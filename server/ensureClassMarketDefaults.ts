import { pool } from "./pg-storage";
import { marketSectors } from "./data/marketData";

/**
 * Dados reais do setor nas turmas (pedido do professor, out/2026): turmas
 * criadas antes da tabela de setores com fonte ficaram com tamanho do
 * mercado, crescimento e consumidores potenciais vazios (R$ 0 na tela do
 * aluno). Preenche SOMENTE os campos vazios (nulos ou zero), com os números
 * do setor da turma (server/data/marketData.ts). Valores digitados pelo
 * professor nunca são sobrescritos. Roda no boot e na abertura de rodada.
 */
export async function preencherDadosDoSetor(classId?: string): Promise<number> {
  let total = 0;
  for (const setor of marketSectors) {
    const params: any[] = [setor.id, setor.marketSize, setor.growthRate, setor.consumidoresPotenciais ?? null];
    let filtro = "";
    if (classId) {
      params.push(classId);
      filtro = " AND id = $5";
    }
    const r = await pool.query(
      `UPDATE classes SET
         market_size = CASE WHEN market_size IS NULL OR market_size <= 0 THEN $2 ELSE market_size END,
         market_growth_rate = CASE WHEN market_growth_rate IS NULL OR market_growth_rate = 0 THEN $3 ELSE market_growth_rate END,
         target_consumers = CASE WHEN (target_consumers IS NULL OR target_consumers <= 0) AND $4::integer IS NOT NULL THEN $4::integer ELSE target_consumers END
       WHERE sector = $1${filtro}
         AND (market_size IS NULL OR market_size <= 0
              OR market_growth_rate IS NULL OR market_growth_rate = 0
              OR target_consumers IS NULL OR target_consumers <= 0)`,
      params,
    );
    total += r.rowCount ?? 0;
  }
  return total;
}

export async function ensureClassMarketDefaults(): Promise<void> {
  try {
    const n = await preencherDadosDoSetor();
    console.log(`[BOOT] Dados reais do setor aplicados em ${n} turma(s) com campos de mercado vazios.`);
  } catch (e) {
    console.log(`[BOOT] Falha ao aplicar dados reais do setor nas turmas: ${e}`);
  }
}
