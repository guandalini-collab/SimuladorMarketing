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
  } catch (e) {
    console.log(`[DIAG-PK] Erro ao investigar: ${e}`);
  }
}
