import { pool } from "./pg-storage";

/**
 * Pedido do professor (2026-09): eventos de mercado agora carregam uma
 * polaridade própria (sentiment: "positivo" | "negativo" | "neutro"),
 * escolhida pelo professor ao criar um evento manualmente ou (no futuro,
 * quando a geração automática pela IA for liberada) gerada pela IA — ver
 * server/services/aiEventGenerator.ts. Isso substitui a lógica antiga em
 * calculateEventImpact() (server/calculator.ts) que inferia o sinal do
 * impacto rigidamente a partir de "type", deixando eventos "regulatorio"
 * (e "ambiental") sem nenhum efeito numérico no resultado — um bug.
 *
 * Como o pre-deploy "drizzle-kit push" do Railway está desligado (ver
 * comentário em ensureGrupoBUniqueIndexes.ts), a nova coluna precisa ser
 * criada manualmente aqui no boot. Para não alterar retroativamente o
 * resultado de simulações já em andamento, o backfill do sentiment a
 * partir do "type" (reproduzindo o comportamento antigo: econômico e
 * competitivo eram sempre negativos; tecnológico e social eram sempre
 * positivos com peso reduzido; regulatório/ambiental não tinham efeito)
 * roda apenas UMA VEZ, na execução em que a coluna é criada. Depois
 * disso, "sentiment" passa a ser inteiramente decidido pelo professor ou
 * pela IA, e este script nunca mais sobrescreve linhas existentes —
 * mesmo que um professor escolha "neutro" de propósito para um evento
 * econômico, por exemplo.
 */
export async function ensureMarketEventSentiment(): Promise<void> {
  try {
    const columnCheck = await pool.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'market_events' AND column_name = 'sentiment'
    `);
    const columnAlreadyExisted = (columnCheck.rowCount ?? 0) > 0;

    await pool.query(`
      ALTER TABLE market_events
      ADD COLUMN IF NOT EXISTS sentiment text NOT NULL DEFAULT 'neutro'
    `);

    if (!columnAlreadyExisted) {
      const result = await pool.query(`
        UPDATE market_events
        SET sentiment = CASE type
          WHEN 'economico' THEN 'negativo'
          WHEN 'competitivo' THEN 'negativo'
          WHEN 'tecnologico' THEN 'positivo'
          WHEN 'social' THEN 'positivo'
          ELSE 'neutro'
        END
      `);
      console.log(`[BOOT] Coluna "sentiment" criada em market_events; ${result.rowCount ?? 0} evento(s) existente(s) migrado(s) a partir do "type" (comportamento antigo preservado).`);
    } else {
      console.log(`[BOOT] Coluna "sentiment" de market_events ok (já existia).`);
    }
  } catch (e) {
    console.log(`[BOOT] Falha ao garantir coluna "sentiment" em market_events: ${e}`);
  }
}
