import { pool } from "./pg-storage";

/**
 * Boletim mensal de mercado (pedido do professor, out/2026 — ver
 * services/marketBulletin.ts). Mesmo padrão de ensureMarketSegmentationTable:
 * o "drizzle-kit push" está desligado no Railway, então a tabela é criada
 * aqui, de forma idempotente, no boot do servidor. Só acrescenta uma tabela
 * nova; nenhuma tabela existente é alterada.
 */
export async function ensureMarketBulletinTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS market_bulletins (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        class_id varchar NOT NULL,
        round_id varchar NOT NULL UNIQUE,
        demand text NOT NULL,
        price_sensitivity text NOT NULL,
        headline text,
        summary text,
        indicators jsonb,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS market_bulletins_class_idx ON market_bulletins (class_id)`);
    console.log(`[BOOT] Tabela "market_bulletins" ok (criada ou já existente).`);
  } catch (e) {
    console.log(`[BOOT] Falha ao garantir a tabela "market_bulletins": ${e}`);
  }
}
