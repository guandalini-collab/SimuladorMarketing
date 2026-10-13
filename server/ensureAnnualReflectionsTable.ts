import { pool } from "./pg-storage";

/**
 * Fechamento anual (pedido do professor, out/2026 — ver
 * services/annualReview.ts): guarda as respostas reflexivas de cada equipe
 * por ano de jogo (12 rodadas = 12 meses). Mesmo padrão das outras tabelas
 * criadas no boot; só acrescenta uma tabela nova.
 */
export async function ensureAnnualReflectionsTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS annual_reflections (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id varchar NOT NULL,
        class_id varchar NOT NULL,
        year integer NOT NULL,
        answers jsonb NOT NULL DEFAULT '{}'::jsonb,
        submitted_by varchar,
        submitted_at timestamp,
        updated_at timestamp NOT NULL DEFAULT now(),
        UNIQUE (team_id, year)
      )
    `);
    console.log(`[BOOT] Tabela "annual_reflections" ok (criada ou já existente).`);
  } catch (e) {
    console.log(`[BOOT] Falha ao garantir a tabela "annual_reflections": ${e}`);
  }
}
