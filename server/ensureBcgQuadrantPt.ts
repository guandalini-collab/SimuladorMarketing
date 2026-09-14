import { pool } from "./pg-storage";

/**
 * Grupo A (auditoria de 2026-09) — item 2 (backfill): antes desta correção,
 * análises BCG geradas por IA (auto-geração e "gerar com IA" do professor)
 * gravavam o quadrante em inglês ("star"/"cash_cow"/"question_mark"/"dog" —
 * ver bcgQuadrantSchema em aiStrategy.ts), enquanto o preenchimento manual
 * do professor (estrategia.tsx -> getQuadrant) sempre gravou em português
 * ("Estrela"/"Vaca Leiteira"/"Ponto de Interrogação"/"Abacaxi") — o formato
 * que o resto do sistema (calculator.ts, strategicAlignment.ts, gráficos do
 * frontend) sempre esperou. O ponto de gravação da IA foi corrigido para
 * traduzir antes de salvar (aiStrategy.ts -> translateBcgQuadrantToPt), mas
 * isso não afeta linhas já existentes no banco. Esta função roda a cada
 * boot e converte, de forma idempotente, qualquer linha antiga que ainda
 * esteja em inglês — sem isso, análises BCG geradas por IA antes do deploy
 * desta correção continuariam com o quadrante "mudo" (sem nenhum efeito no
 * cálculo de resultados nem nos gráficos) para sempre.
 */
export async function ensureBcgQuadrantPt(): Promise<void> {
  try {
    const result = await pool.query(`
      UPDATE bcg_analysis
      SET quadrant = CASE quadrant
        WHEN 'star' THEN 'Estrela'
        WHEN 'cash_cow' THEN 'Vaca Leiteira'
        WHEN 'question_mark' THEN 'Ponto de Interrogação'
        WHEN 'dog' THEN 'Abacaxi'
        ELSE quadrant
      END
      WHERE quadrant IN ('star', 'cash_cow', 'question_mark', 'dog')
    `);
    const updated = result.rowCount ?? 0;
    if (updated > 0) {
      console.log(`[BOOT] ${updated} análise(s) BCG com quadrante em inglês convertida(s) para português.`);
    } else {
      console.log(`[BOOT] Quadrantes BCG ok (nenhum valor em inglês encontrado).`);
    }
  } catch (e) {
    // Não derruba o boot do servidor por isso: se falhar, o app continua
    // funcionando normalmente (só sem o backfill), igual ao padrão já
    // usado em ensureMidiaCatalog.ts / ensureResultsUniqueIndex.ts.
    console.log(`[BOOT] Falha ao converter quadrantes BCG para português: ${e}`);
  }
}
