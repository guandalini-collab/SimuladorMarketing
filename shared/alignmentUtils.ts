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
