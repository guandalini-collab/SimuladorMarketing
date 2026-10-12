import { pool } from "./pg-storage";

/**
 * Percurso obrigatório da rodada (pedido do professor, out/2026 — ver
 * services/teamJourney.ts): guarda o botão "Li e entendi" de cada equipe,
 * por rodada e etapa. Mesmo padrão de ensureMarketSegmentationTable: a
 * tabela é criada aqui, de forma idempotente, no boot do servidor. Só
 * acrescenta uma tabela nova; nenhuma tabela existente é alterada.
 */
export async function ensureTeamRoundStepsTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_round_steps (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id varchar NOT NULL,
        round_id varchar NOT NULL,
        step text NOT NULL,
        user_id varchar,
        created_at timestamp NOT NULL DEFAULT now(),
        UNIQUE (team_id, round_id, step)
      )
    `);
    console.log(`[BOOT] Tabela "team_round_steps" ok (criada ou já existente).`);
  } catch (e) {
    console.log(`[BOOT] Falha ao garantir a tabela "team_round_steps": ${e}`);
  }
}
