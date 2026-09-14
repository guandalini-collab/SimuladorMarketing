import { pool } from "./pg-storage";

/**
 * Grupo B (auditoria de 2026-09) — marketing_mix, swot_analysis,
 * porter_analysis e pestel_analysis nunca tiveram constraint de
 * unicidade em (team_id, round_id, product_id): cada uma delas é
 * preenchida por um padrão "buscar, depois criar" (get-then-create) em
 * routes.ts, sem atomicidade — duas gravações concorrentes para o mesmo
 * produto (duplo clique em "Enviar Decisão", uma nova tentativa após
 * timeout, ou duas chamadas de geração automática de IA quase ao mesmo
 * tempo) podiam criar duas linhas para o mesmo (team, round, product).
 * Para marketing_mix isso é especialmente sério: o fechamento de rodada
 * busca TODAS as linhas submetidas de uma equipe/rodada e processa cada
 * uma como um produto — uma duplicata faria o mesmo produto ser contado
 * duas vezes na receita/custo consolidados da equipe.
 *
 * Como o pre-deploy "drizzle-kit push" do Railway está desligado (ver
 * server/ensureResultsUniqueIndex.ts), as novas constraints em
 * shared/schema.ts não chegam à produção sozinhas — esta função cria
 * cada índice diretamente via SQL, de forma idempotente (IF NOT EXISTS).
 *
 * Segurança: CREATE UNIQUE INDEX falha se já existirem duplicatas. Em
 * vez de apagar linhas automaticamente (decisão que não deve ser tomada
 * sem revisão), cada tabela é checada primeiro; se houver duplicatas, a
 * criação do índice dessa tabela é pulada e o fato fica registrado no
 * log para investigação — não derruba o boot do servidor.
 */

interface TableSpec {
  table: string;
  indexName: string;
}

const TABLES: TableSpec[] = [
  { table: "marketing_mix", indexName: "marketing_mix_unique_team_round_product" },
  { table: "swot_analysis", indexName: "swot_unique_team_round_product" },
  { table: "porter_analysis", indexName: "porter_unique_team_round_product" },
  { table: "pestel_analysis", indexName: "pestel_unique_team_round_product" },
];

export async function ensureGrupoBUniqueIndexes(): Promise<void> {
  for (const { table, indexName } of TABLES) {
    try {
      const dupCheck = await pool.query(`
        SELECT team_id, round_id, COALESCE(product_id, '') AS product_key, COUNT(*) AS qtd
        FROM ${table}
        GROUP BY team_id, round_id, COALESCE(product_id, '')
        HAVING COUNT(*) > 1
        LIMIT 10
      `);

      if (dupCheck.rows.length > 0) {
        console.log(
          `[BOOT] "${table}": ${dupCheck.rows.length}+ grupo(s) duplicado(s) de (team_id, round_id, product_id) encontrados — índice único "${indexName}" NÃO criado (precisa de investigação/limpeza antes). Exemplos: ${JSON.stringify(dupCheck.rows)}`
        );
        continue;
      }

      await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS ${indexName}
        ON ${table} (team_id, round_id, COALESCE(product_id, ''))
      `);
      console.log(`[BOOT] Índice único "${indexName}" ok (criado ou já existente).`);
    } catch (e) {
      console.log(`[BOOT] Falha ao garantir índice único "${indexName}" em "${table}": ${e}`);
    }
  }
}
