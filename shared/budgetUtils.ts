// Ajuste de orçamento das equipes quando a quantidade de produtos por rodada
// muda de uma rodada para a outra.
//
// Inconsistência de auditoria (2026-09), item 2: esta fórmula só existia
// implementada em server/routes.ts (aplicada de fato ao orçamento) e, de
// forma independente, como um texto de "prévia" em client/src/pages/
// professor.tsx (só para exibição, antes de confirmar o início da rodada).
// As duas divergiam quando a quantidade de produtos DIMINUÍA: o texto do
// professor usava uma conta linear simples (Δ×10%), mas o servidor sempre
// aplicou o inverso multiplicativo (para desfazer exatamente uma redução
// anterior) — ex.: uma equipe com R$ 8.000 caindo de 3 para 1 produto via o
// painel prometer "+20%" (R$ 9.600), mas o servidor de fato aplicar +25%
// (R$ 10.000). Extraído para cá para que os dois lados usem sempre a mesma
// conta, sem depender de manter duas implementações sincronizadas.

// Percentual de impacto no orçamento por produto adicional/removido entre rodadas.
export const PRODUCT_COUNT_BUDGET_IMPACT = 0.10;

/**
 * Multiplicador a aplicar sobre o orçamento atual de uma equipe quando a
 * quantidade de produtos por rodada muda de `previousProductCount` para
 * `newProductCount`. 1 = sem alteração. Cada produto a mais reduz o
 * orçamento em PRODUCT_COUNT_BUDGET_IMPACT (10% por padrão); cada produto a
 * menos desfaz proporcionalmente essa redução (inverso multiplicativo, não
 * uma soma linear — restaurar de 3 para 1 produto não é o mesmo que desfazer
 * duas reduções de 10% somadas, é desfazer a redução composta real).
 */
export function getProductCountBudgetMultiplier(
  previousProductCount: number,
  newProductCount: number
): number {
  const delta = newProductCount - previousProductCount;
  if (delta === 0) return 1;
  return delta > 0
    ? 1 - PRODUCT_COUNT_BUDGET_IMPACT * delta
    : 1 / (1 - PRODUCT_COUNT_BUDGET_IMPACT * Math.abs(delta));
}

export interface ProductCountBudgetPreview {
  multiplier: number;
  /** Variação percentual (positiva = aumento, negativa = redução), já arredondada para 1 casa decimal. */
  percent: number;
  /** true quando o multiplicador foi zerado (orçamento zeraria na prática). */
  zeroed: boolean;
}

/** Versão "prévia", para exibir ao professor antes de confirmar a mudança. */
export function getProductCountBudgetPreview(
  previousProductCount: number,
  newProductCount: number
): ProductCountBudgetPreview {
  const multiplier = getProductCountBudgetMultiplier(previousProductCount, newProductCount);
  const clamped = Math.max(0, multiplier);
  return {
    multiplier,
    percent: Math.round((clamped - 1) * 1000) / 10,
    zeroed: multiplier <= 0,
  };
}
