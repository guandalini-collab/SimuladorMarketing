export interface AlignmentScoreLevel {
  label: string;
  color: string;
  variant: "destructive" | "default" | "secondary" | "outline";
}

export function getAlignmentScoreLevel(score: number): AlignmentScoreLevel {
  if (score < 30) {
    return {
      label: "Crítico",
      color: "text-red-600 dark:text-red-400",
      variant: "destructive",
    };
  }
  if (score < 50) {
    return {
      label: "Fraco",
      color: "text-orange-600 dark:text-orange-400",
      variant: "secondary",
    };
  }
  if (score < 70) {
    return {
      label: "Médio",
      color: "text-yellow-600 dark:text-yellow-400",
      variant: "outline",
    };
  }
  if (score < 90) {
    return {
      label: "Bom",
      color: "text-green-600 dark:text-green-400",
      variant: "default",
    };
  }
  return {
    label: "Excelente",
    color: "text-green-700 dark:text-green-300",
    variant: "default",
  };
}

export function getScoreColor(score: number): string {
  if (score < 30) return "text-red-600 dark:text-red-400";
  if (score < 50) return "text-orange-600 dark:text-orange-400";
  if (score < 70) return "text-yellow-600 dark:text-yellow-400";
  if (score < 90) return "text-green-600 dark:text-green-400";
  return "text-green-700 dark:text-green-300";
}

export interface KpiModifiers {
  revenueModifier: number;
  profitModifier: number;
  marketShareModifier: number;
}

// Inconsistência de auditoria (2026-09, segunda rodada): esta tabela de
// modificadores de KPI por pontuação de alinhamento estratégico só existia
// implementada em server/services/strategicAlignment.ts (aplicada de fato ao
// resultado da equipe) e, de forma independente, como texto fixo em
// client/src/components/alignment-score-card.tsx — com faixas de pontuação
// E percentuais completamente diferentes. Uma equipe com pontuação 65
// recebia do servidor um BÔNUS de +3% receita / +5% lucro / +2% market share,
// mas o card mostrava "Penalidades aplicadas: Receita -10%, Lucro -12%,
// Market Share -5%" — dizendo ao aluno que ele foi penalizado quando na
// verdade foi bonificado. Movida para cá para que os dois lados usem sempre
// a mesma tabela, no mesmo padrão de shared/budgetUtils.ts.
export function calculateKPIModifiers(overallScore: number): KpiModifiers {
  if (overallScore >= 90) {
    return { revenueModifier: 0.20, profitModifier: 0.25, marketShareModifier: 0.15 };
  } else if (overallScore >= 75) {
    return { revenueModifier: 0.10, profitModifier: 0.15, marketShareModifier: 0.08 };
  } else if (overallScore >= 60) {
    return { revenueModifier: 0.03, profitModifier: 0.05, marketShareModifier: 0.02 };
  } else if (overallScore >= 40) {
    return { revenueModifier: -0.08, profitModifier: -0.12, marketShareModifier: -0.05 };
  } else if (overallScore >= 20) {
    return { revenueModifier: -0.20, profitModifier: -0.30, marketShareModifier: -0.15 };
  } else if (overallScore > 0) {
    return { revenueModifier: -0.35, profitModifier: -0.45, marketShareModifier: -0.25 };
  } else {
    return { revenueModifier: -0.50, profitModifier: -0.60, marketShareModifier: -0.35 };
  }
}

/** Formata um modificador (ex.: 0.03 -> "+3%", -0.1 -> "-10%") para exibição. */
export function formatKpiModifierPercent(modifier: number): string {
  const percent = Math.round(modifier * 100);
  return percent >= 0 ? `+${percent}%` : `${percent}%`;
}
