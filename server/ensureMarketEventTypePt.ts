import { pool } from "./pg-storage";

/**
 * Grupo E (auditoria de 2026-09) — backfill: eventos de mercado gerados por
 * IA (POST /api/market-events/generate-ai) gravavam o campo "type" em inglês
 * ("economic"/"technological"/"competitive"/"regulatory"/"environmental" —
 * ver GeneratedEvent em aiEventGenerator.ts), enquanto calculateEventImpact()
 * (calculator.ts) só reconhece os valores em português usados pelo gerador
 * determinístico de eventos ("economico"/"tecnologico"/"competitivo"/
 * "regulatorio") — mesmo padrão do bug do quadrante BCG corrigido no Grupo A.
 * Sem tradução, um evento gerado por IA aparecia normalmente na tela (o
 * rótulo do admin já reconhecia as duas línguas) mas nunca tinha efeito
 * numérico no resultado calculado da equipe. O ponto de gravação foi
 * corrigido para traduzir antes de salvar (routes.ts ->
 * translateEventTypeToPt), mas isso não afeta linhas já existentes no banco.
 * Esta função roda a cada boot e converte, de forma idempotente, qualquer
 * linha antiga que ainda esteja em inglês.
 */
export async function ensureMarketEventTypePt(): Promise<void> {
  try {
    const result = await pool.query(`
      UPDATE market_events
      SET type = CASE type
        WHEN 'economic' THEN 'economico'
        WHEN 'technological' THEN 'tecnologico'
        WHEN 'competitive' THEN 'competitivo'
        WHEN 'regulatory' THEN 'regulatorio'
        WHEN 'environmental' THEN 'ambiental'
        ELSE type
      END
      WHERE type IN ('economic', 'technological', 'competitive', 'regulatory', 'environmental')
    `);
    const updated = result.rowCount ?? 0;
    if (updated > 0) {
      console.log(`[BOOT] ${updated} evento(s) de mercado com "type" em inglês convertido(s) para português.`);
    } else {
      console.log(`[BOOT] Tipos de eventos de mercado ok (nenhum valor em inglês encontrado).`);
    }
  } catch (e) {
    console.log(`[BOOT] Falha ao converter "type" de eventos de mercado para português: ${e}`);
  }
}
