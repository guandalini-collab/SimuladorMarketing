import { pool } from "./pg-storage";

/**
 * Pedido do professor (2026-09): 5ª ferramenta estratégica "Segmentação de
 * Mercado" (ver shared/schema.ts -> marketSegmentation). Como o pre-deploy
 * "drizzle-kit push" do Railway está desligado (ver
 * server/ensureGrupoBUniqueIndexes.ts), uma tabela nova adicionada em
 * shared/schema.ts não chega à produção sozinha — esta função cria a
 * tabela e seus índices diretamente via SQL, de forma idempotente
 * (IF NOT EXISTS), no boot do servidor.
 */
export async function ensureMarketSegmentationTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS market_segmentation (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id varchar NOT NULL,
        round_id varchar NOT NULL,
        product_id varchar,
        segment_type text NOT NULL,
        demographic text[] NOT NULL DEFAULT ARRAY[]::text[],
        geographic text[] NOT NULL DEFAULT ARRAY[]::text[],
        psychographic text[] NOT NULL DEFAULT ARRAY[]::text[],
        behavioral text[] NOT NULL DEFAULT ARRAY[]::text[],
        firmographic text[] NOT NULL DEFAULT ARRAY[]::text[],
        buying_center text[] NOT NULL DEFAULT ARRAY[]::text[],
        ai_generated_percentage real NOT NULL DEFAULT 0,
        original_ai_content jsonb,
        edited_by_user boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS segmentation_team_round_product_type_idx
      ON market_segmentation (team_id, round_id, product_id, segment_type)
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS segmentation_unique_team_round_product_type
      ON market_segmentation (team_id, round_id, COALESCE(product_id, ''), segment_type)
    `);

    console.log(`[BOOT] Tabela "market_segmentation" ok (criada ou já existente).`);
  } catch (e) {
    console.log(`[BOOT] Falha ao garantir a tabela "market_segmentation": ${e}`);
  }
}
