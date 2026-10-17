import { pool } from "./pg-storage";

/**
 * Motor competitivo (out/2026): estado do mercado de cada rodada — fatias,
 * preços e unidades de todas as empresas (equipes e concorrentes
 * simulados), memória de marca/fidelidade e verba inicial de cada equipe.
 * É o que permite a "memória" entre rodadas e, depois, a aba de
 * concorrentes e o relatório gerencial. Criada no boot, idempotente.
 */
export async function ensureMarketStateTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS market_states (
        round_id varchar PRIMARY KEY,
        class_id varchar NOT NULL,
        round_number integer NOT NULL,
        estado jsonb NOT NULL,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS market_states_class_idx ON market_states (class_id, round_number)`);
    console.log(`[BOOT] Tabela "market_states" ok.`);
  } catch (e) {
    console.log(`[BOOT] Falha ao garantir a tabela "market_states": ${e}`);
  }
}
