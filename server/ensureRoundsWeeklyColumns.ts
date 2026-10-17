import { pool } from "./pg-storage";

/**
 * Rodadas semanais (pedido do professor, out/2026): cada rodada corresponde
 * a uma semana real do calendário, com abertura e fechamento nos dias e horários definidos pelo professor (Rodada 1 =
 * semana de adaptação), horário de Brasília, nas datas escolhidas pelo professor; uma delas é
 * marcada como a última do ano letivo.
 *
 * Como o "drizzle-kit push" está desligado no Railway, a coluna nova de
 * "rounds" é criada aqui no boot, de forma idempotente. Turmas existentes
 * ficam com is_last_round = false (nada muda para elas).
 */
export async function ensureRoundsWeeklyColumns(): Promise<void> {
  try {
    await pool.query(`
      ALTER TABLE rounds
      ADD COLUMN IF NOT EXISTS is_last_round boolean NOT NULL DEFAULT false
    `);
    await pool.query(`
      ALTER TABLE rounds
      ADD COLUMN IF NOT EXISTS is_practice boolean NOT NULL DEFAULT false
    `);
    console.log(`[BOOT] Colunas "is_last_round" e "is_practice" em "rounds" ok.`);
  } catch (e) {
    console.log(`[BOOT] Falha ao garantir a coluna "is_last_round" em "rounds": ${e}`);
  }
}
