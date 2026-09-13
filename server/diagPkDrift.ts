import { pool } from "./pg-storage";

/**
 * TEMP DIAGNOSTIC — investigação do erro recorrente do pre-deploy
 * "drizzle-kit push" (código 42P16, "column 'id' is in a primary key",
 * rotina dropconstraint_internal). Dispara em todo deploy, antes mesmo
 * do container subir, e aborta o push inteiro. Remover depois da
 * investigação.
 *
 * Hipótese: alguma tabela tem a coluna "id" (ou sua constraint de chave
 * primária) com um tipo/definição diferente do que schema.ts declara
 * (todas as 24 tabelas usam varchar("id").primaryKey().default(gen_random_uuid())),
 * fazendo o drizzle-kit tentar um ALTER que exige derrubar a PK e falhar
 * no meio do caminho.
 *
 * Esta função só LÊ metadados de catálogo do Postgres (pg_constraint,
 * information_schema.columns) — nenhuma tabela de negócio é tocada.
 */
export async function diagPkDrift(): Promise<void> {
  try {
    const pks = await pool.query(`
      SELECT
        rel.relname AS table_name,
        con.conname AS constraint_name,
        pg_get_constraintdef(con.oid) AS constraint_def
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE con.contype = 'p' AND nsp.nspname = 'public'
      ORDER BY rel.relname
    `);
    console.log(`[DIAG-PK] ${pks.rows.length} constraints de chave primária encontradas em 'public':`);
    for (const row of pks.rows) {
      console.log(`[DIAG-PK] tabela=${row.table_name} constraint=${row.constraint_name} def=${row.constraint_def}`);
    }

    const idCols = await pool.query(`
      SELECT table_name, column_name, data_type, udt_name, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND column_name = 'id'
      ORDER BY table_name
    `);
    console.log(`[DIAG-PK] ${idCols.rows.length} colunas "id" encontradas:`);
    for (const row of idCols.rows) {
      console.log(`[DIAG-PK] tabela=${row.table_name} data_type=${row.data_type} udt_name=${row.udt_name} max_len=${row.character_maximum_length} nullable=${row.is_nullable} default=${row.column_default}`);
    }

    // Tabelas que schema.ts declara mas que porventura não apareceram acima
    // (ausentes do banco) ou vice-versa também são um sinal útil.
    const allTables = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log(`[DIAG-PK] Tabelas em 'public': ${allTables.rows.map(r => r.table_name).join(", ")}`);

    // Verificação crítica de segurança: o "drizzle-kit push" (pre-deploy) gera,
    // a cada deploy, um DROP CONSTRAINT "<tabela>_<coluna>_not_null" para
    // praticamente toda coluna NOT NULL do banco (não só "id") — provavelmente
    // por causa de como o Postgres 17+ passou a catalogar NOT NULL como
    // constraint nomeada (pg_constraint contype='n'), o que confunde o diff
    // do drizzle-kit. O push só falha (42P16) quando chega numa coluna "id"
    // (ainda faz parte da PK). Como as statements rodam em loop simples,
    // sem transação (db.query() um a um, sem BEGIN/COMMIT — confirmado lendo
    // o código-fonte do drizzle-kit em node_modules), statements ANTERIORES
    // à que falha no loop já teriam sido de fato aplicadas e confirmadas no
    // banco. Esta checagem confirma, direto no catálogo de produção, se
    // alguma coluna que schema.ts declara como notNull() já está, de fato,
    // NULLABLE em produção (ou seja, se o DROP CONSTRAINT already-executado
    // realmente "pegou").
    const nullableCols = await pool.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND is_nullable = 'YES'
      ORDER BY table_name, column_name
    `);
    console.log(`[DIAG-NULL] ${nullableCols.rows.length} colunas atualmente NULLABLE em produção:`);
    for (const row of nullableCols.rows) {
      console.log(`[DIAG-NULL] tabela=${row.table_name} coluna=${row.column_name}`);
    }

    // Checagem extra: schema.ts não declara mais "readyConfirmedAt" nem
    // "tutorialCompletedAt" na tabela "teams" (DROP COLUMN pendente no plano
    // do drizzle-kit) — confirma se essas colunas ainda existem em produção
    // (ou seja, se esse DROP COLUMN específico, que aparece DEPOIS dos DROP
    // CONSTRAINT no plano impresso, chegou a rodar).
    const teamsCols = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'teams'
      ORDER BY column_name
    `);
    console.log(`[DIAG-NULL] Colunas atuais de "teams": ${teamsCols.rows.map(r => r.column_name).join(", ")}`);
  } catch (e) {
    console.log(`[DIAG-PK] Erro ao investigar: ${e}`);
  }
}
