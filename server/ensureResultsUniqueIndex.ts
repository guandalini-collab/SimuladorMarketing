import { pool } from "./pg-storage";

/**
 * Garante que a tabela "results" tenha a constraint de unicidade em
 * (team_id, round_id) — a mesma que já existe em shared/schema.ts via
 * uniqueIndex("results_unique_team_round"). Fica só como fallback do
 * boot: o pre-deploy "drizzle-kit push" do Railway já tenta aplicar as
 * migrações do schema.ts a cada deploy, mas há um erro pré-existente e
 * não relacionado (drop de constraint em outra tabela, código 42P16)
 * que aborta o push inteiro antes de chegar nessa mudança. Como
 * createResult() (pg-storage.ts) depende dessa constraint existir de
 * verdade para o "ON CONFLICT (team_id, round_id)" funcionar — sem
 * ela, o Postgres rejeita a query —, criamos o índice aqui
 * diretamente, de forma idempotente (IF NOT EXISTS), como garantia.
 */
export async function ensureResultsUniqueIndex(): Promise<void> {
  try {
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS results_unique_team_round
      ON results (team_id, round_id)
    `);
    console.log(`[BOOT] Índice único "results_unique_team_round" ok (criado ou já existente).`);
  } catch (e) {
    // Não derruba o boot do servidor por isso: se falhar, o app continua
    // funcionando normalmente, só sem a proteção extra desta constraint
    // (mesmo estado de antes desta correção). Fica registrado no log para
    // investigação.
    console.log(`[BOOT] Falha ao garantir índice único "results_unique_team_round": ${e}`);
  }
}
