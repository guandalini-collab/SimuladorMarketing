import type { SwotAnalysis, PorterAnalysis, BcgAnalysis, PestelAnalysis, MarketingMix } from "@shared/schema";

export interface AlignmentScore {
  score: number;
  issues: string[];
  weight: number;
}

export interface AlignmentAnalysis {
  overallScore: number;
  swotAlignment: AlignmentScore;
  porterAlignment: AlignmentScore;
  bcgAlignment: AlignmentScore;
  pestelAlignment: AlignmentScore;
  kpiModifiers: {
    revenueModifier: number;
    profitModifier: number;
    marketShareModifier: number;
  };
  penalties: Array<{
    description: string;
    impact: number;
  }>;
  level: number;
  completionScore: number;
}

export interface AlignmentParams {
  swot: SwotAnalysis | null;
  porter: PorterAnalysis | null;
  bcg: BcgAnalysis | null;
  pestel: PestelAnalysis | null;
  marketingMix: MarketingMix;
  aiAssistanceLevel: number;
  swotAiPercentage?: number;
  porterAiPercentage?: number;
  bcgAiPercentage?: number;
  pestelAiPercentage?: number;
}

function calculateAiContentPenalty(aiPercentage: number | undefined, toolName: string): { penalty: number; description: string | null } {
  if (aiPercentage === undefined || aiPercentage === 0) {
    return { penalty: 0, description: null };
  }

  if (aiPercentage < 30) {
    return { penalty: 0, description: null };
  }

  if (aiPercentage >= 30 && aiPercentage < 70) {
    return {
      penalty: -10,
      description: `${toolName}: Análise com ${Math.round(aiPercentage)}% de conteúdo não editado da IA (penalidade moderada)`
    };
  }

  return {
    penalty: -30,
    description: `${toolName}: Análise com ${Math.round(aiPercentage)}% de conteúdo não editado da IA (penalidade severa)`
  };
}

export function calculateStrategicAlignment(params: AlignmentParams): AlignmentAnalysis {
  const { 
    swot, 
    porter, 
    bcg, 
    pestel, 
    marketingMix, 
    aiAssistanceLevel,
    swotAiPercentage,
    porterAiPercentage,
    bcgAiPercentage,
    pestelAiPercentage
  } = params;

  const completionScore = calculateCompletionScore(swot, porter, bcg, pestel);

  const swotAlignment = analyzeSwotAlignment(swot, marketingMix);
  const porterAlignment = analyzePorterAlignment(porter, marketingMix);
  const bcgAlignment = analyzeBcgAlignment(bcg, marketingMix);
  const pestelAlignment = analyzePestelAlignment(pestel, marketingMix);

  const aiPenalties: Array<{ description: string; impact: number }> = [];
  
  const swotAiPenalty = calculateAiContentPenalty(swotAiPercentage, "SWOT");
  if (swotAiPenalty.description) {
    aiPenalties.push({ description: swotAiPenalty.description, impact: swotAiPenalty.penalty });
  }

  const porterAiPenalty = calculateAiContentPenalty(porterAiPercentage, "Porter");
  if (porterAiPenalty.description) {
    aiPenalties.push({ description: porterAiPenalty.description, impact: porterAiPenalty.penalty });
  }

  const bcgAiPenalty = calculateAiContentPenalty(bcgAiPercentage, "BCG");
  if (bcgAiPenalty.description) {
    aiPenalties.push({ description: bcgAiPenalty.description, impact: bcgAiPenalty.penalty });
  }

  const pestelAiPenalty = calculateAiContentPenalty(pestelAiPercentage, "PESTEL");
  if (pestelAiPenalty.description) {
    aiPenalties.push({ description: pestelAiPenalty.description, impact: pestelAiPenalty.penalty });
  }

  const totalAiPenalty = swotAiPenalty.penalty + porterAiPenalty.penalty + bcgAiPenalty.penalty + pestelAiPenalty.penalty;

  const overallScore = calculateOverallScore(
    completionScore,
    swotAlignment,
    porterAlignment,
    bcgAlignment,
    pestelAlignment
  );

  const adjustedScore = Math.max(0, Math.min(100, overallScore + totalAiPenalty));

  const kpiModifiers = calculateKPIModifiers(adjustedScore);
  const alignmentPenalties = compilePenalties(swotAlignment, porterAlignment, bcgAlignment, pestelAlignment, completionScore);
  const allPenalties = [...alignmentPenalties, ...aiPenalties];

  return {
    overallScore: adjustedScore,
    swotAlignment,
    porterAlignment,
    bcgAlignment,
    pestelAlignment,
    kpiModifiers,
    penalties: allPenalties,
    level: aiAssistanceLevel,
    completionScore,
  };
}

function calculateCompletionScore(
  swot: SwotAnalysis | null,
  porter: PorterAnalysis | null,
  bcg: BcgAnalysis | null,
  pestel: PestelAnalysis | null
): number {
  let completed = 0;
  let total = 4;

  if (swot && isSwotComplete(swot)) completed++;
  if (porter && isPorterComplete(porter)) completed++;
  if (bcg && isBcgComplete(bcg)) completed++;
  if (pestel && isPestelComplete(pestel)) completed++;

  return (completed / total) * 100;
}

function isSwotComplete(swot: SwotAnalysis): boolean {
  return (
    swot.strengths.length >= 1 &&
    swot.weaknesses.length >= 1 &&
    swot.opportunities.length >= 1 &&
    swot.threats.length >= 1
  );
}

function isPorterComplete(porter: PorterAnalysis): boolean {
  const isValidNote = (note: string | null): boolean => {
    if (!note) return false;
    const trimmed = note.trim();
    if (trimmed.length < 15) return false;
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) return false;
    if (trimmed.toLowerCase().includes("analise") && trimmed.length < 25) return false;
    return true;
  };

  return (
    isValidNote(porter.rivalryNotes) ||
    isValidNote(porter.supplierNotes) ||
    isValidNote(porter.buyerNotes) ||
    isValidNote(porter.substitutesNotes) ||
    isValidNote(porter.newEntryNotes)
  );
}

function isBcgComplete(bcg: BcgAnalysis): boolean {
  if (!bcg.productName || bcg.productName.trim().length === 0) return false;
  if (bcg.productName.toLowerCase() === "seu produto") return false;
  
  if (!bcg.notes) return false;
  const trimmedNotes = bcg.notes.trim();
  if (trimmedNotes.length < 15) return false;
  if (trimmedNotes.startsWith("[") && trimmedNotes.endsWith("]")) return false;
  if (trimmedNotes.toLowerCase().includes("justifique") && trimmedNotes.length < 25) return false;
  
  return true;
}

function isPestelComplete(pestel: PestelAnalysis): boolean {
  const isValidArray = (arr: string[]): boolean => {
    if (arr.length < 1) return false;
    return arr.some(item => {
      const trimmed = item.trim();
      return trimmed.length > 5 && !trimmed.startsWith("[") && !trimmed.endsWith("]");
    });
  };

  return (
    isValidArray(pestel.political) &&
    isValidArray(pestel.economic) &&
    isValidArray(pestel.social) &&
    isValidArray(pestel.technological) &&
    isValidArray(pestel.environmental) &&
    isValidArray(pestel.legal)
  );
}

function analyzeSwotAlignment(swot: SwotAnalysis | null, mix: MarketingMix): AlignmentScore {
  const issues: string[] = [];
  let alignmentPoints = 100;

  if (!swot) {
    return { score: 0, issues: ["Análise SWOT não realizada"], weight: 0.25 };
  }

  if (!isSwotComplete(swot)) {
    issues.push("Análise SWOT incompleta");
    alignmentPoints -= 30;
  }

  const hasQualityStrength = swot.strengths.some(s => 
    s.toLowerCase().includes("qualidade") || 
    s.toLowerCase().includes("premium") ||
    s.toLowerCase().includes("diferenciação")
  );

  const hasLowCostStrength = swot.strengths.some(s => 
    s.toLowerCase().includes("custo baixo") || 
    s.toLowerCase().includes("preço competitivo") ||
    s.toLowerCase().includes("eficiência")
  );

  const hasHighCostWeakness = swot.weaknesses.some(w => 
    w.toLowerCase().includes("custo alto") || 
    w.toLowerCase().includes("caro") ||
    w.toLowerCase().includes("preço elevado")
  );

  const hasLowQualityWeakness = swot.weaknesses.some(w => 
    w.toLowerCase().includes("qualidade") || 
    w.toLowerCase().includes("inferior")
  );

  if (hasQualityStrength && mix.priceValue && mix.priceValue < 15) {
    issues.push("SWOT indica qualidade superior, mas preço está muito baixo");
    alignmentPoints -= 20;
  }

  if (hasLowCostStrength && mix.priceValue && mix.priceValue > 30) {
    issues.push("SWOT indica vantagem de custo, mas preço está alto");
    alignmentPoints -= 15;
  }

  if (hasHighCostWeakness && mix.priceValue && mix.priceValue < 20) {
    issues.push("SWOT indica custo alto como fraqueza, mas preço muito baixo não compensa");
    alignmentPoints -= 18;
  }

  if (hasLowQualityWeakness && mix.priceValue && mix.priceValue > 25) {
    issues.push("SWOT indica fraqueza em qualidade, mas preço está premium");
    alignmentPoints -= 20;
  }

  const hasBrandOpportunity = swot.opportunities.some(o => 
    o.toLowerCase().includes("marca") || 
    o.toLowerCase().includes("reputação") ||
    o.toLowerCase().includes("visibilidade")
  );

  if (hasBrandOpportunity && getTotalPromotion(mix) < 10000) {
    issues.push("SWOT indica oportunidade de branding, mas investimento promocional está baixo");
    alignmentPoints -= 12;
  }

  const score = Math.max(0, Math.min(100, alignmentPoints));
  return { score, issues, weight: 0.25 };
}

function analyzePorterAlignment(porter: PorterAnalysis | null, mix: MarketingMix): AlignmentScore {
  const issues: string[] = [];
  let alignmentPoints = 100;

  if (!porter) {
    return { score: 0, issues: ["Análise Porter não realizada"], weight: 0.25 };
  }

  if (!isPorterComplete(porter)) {
    issues.push("Análise Porter incompleta");
    alignmentPoints -= 30;
  }

  if (porter.competitiveRivalry >= 8 && getTotalPromotion(mix) < 15000) {
    issues.push("Rivalidade competitiva alta, mas investimento promocional insuficiente");
    alignmentPoints -= 25;
  }

  if (porter.competitiveRivalry >= 8 && mix.priceValue && mix.priceValue > 25) {
    issues.push("Rivalidade alta indica pressão de preços, mas preço está elevado");
    alignmentPoints -= 15;
  }

  if (porter.buyerPower >= 8 && mix.priceValue && mix.priceValue > 30) {
    issues.push("Alto poder de barganha dos clientes, mas preço está premium");
    alignmentPoints -= 20;
  }

  if (porter.buyerPower >= 8 && mix.priceStrategy === "premium") {
    issues.push("Alto poder dos clientes dificulta estratégia premium");
    alignmentPoints -= 18;
  }

  if (porter.supplierPower >= 8 && mix.priceValue && mix.priceValue < 20) {
    issues.push("Alto poder dos fornecedores aumenta custos, mas preço está muito baixo");
    alignmentPoints -= 15;
  }

  if (porter.threatOfSubstitutes >= 8 && getTotalPromotion(mix) < 12000) {
    issues.push("Alta ameaça de substitutos requer diferenciação promocional maior");
    alignmentPoints -= 20;
  }

  if (porter.threatOfNewEntry >= 8 && getTotalPromotion(mix) < 10000) {
    issues.push("Alta ameaça de novos entrantes exige investimento maior em brand awareness");
    alignmentPoints -= 15;
  }

  const score = Math.max(0, Math.min(100, alignmentPoints));
  return { score, issues, weight: 0.25 };
}

function analyzeBcgAlignment(bcg: BcgAnalysis | null, mix: MarketingMix): AlignmentScore {
  const issues: string[] = [];
  let alignmentPoints = 100;

  if (!bcg) {
    return { score: 0, issues: ["Análise BCG não realizada"], weight: 0.25 };
  }

  if (!isBcgComplete(bcg)) {
    issues.push("Análise BCG incompleta");
    alignmentPoints -= 30;
  }

  const totalInvestment = getTotalPromotion(mix);

  if (bcg.quadrant === "star" && totalInvestment < 20000) {
    issues.push("Produto classificado como ESTRELA requer alto investimento para manter crescimento");
    alignmentPoints -= 25;
  }

  if (bcg.quadrant === "cash_cow" && totalInvestment > 25000) {
    issues.push("Produto VACA LEITEIRA não justifica investimento tão alto");
    alignmentPoints -= 15;
  }

  if (bcg.quadrant === "question_mark" && totalInvestment < 15000) {
    issues.push("Produto INTERROGAÇÃO precisa de investimento para se tornar Estrela");
    alignmentPoints -= 20;
  }

  if (bcg.quadrant === "dog" && totalInvestment > 10000) {
    issues.push("Produto ABACAXI tem baixo potencial, investimento deveria ser mínimo");
    alignmentPoints -= 18;
  }

  if (bcg.quadrant === "cash_cow" && mix.priceStrategy === "penetracao") {
    issues.push("VACA LEITEIRA deveria maximizar lucros, não penetração de mercado");
    alignmentPoints -= 15;
  }

  if (bcg.quadrant === "star" && mix.priceValue && mix.priceValue < 20) {
    issues.push("ESTRELA permite preço premium devido ao crescimento e participação");
    alignmentPoints -= 12;
  }

  const score = Math.max(0, Math.min(100, alignmentPoints));
  return { score, issues, weight: 0.25 };
}

function analyzePestelAlignment(pestel: PestelAnalysis | null, mix: MarketingMix): AlignmentScore {
  const issues: string[] = [];
  let alignmentPoints = 100;

  if (!pestel) {
    return { score: 0, issues: ["Análise PESTEL não realizada"], weight: 0.25 };
  }

  if (!isPestelComplete(pestel)) {
    issues.push("Análise PESTEL incompleta");
    alignmentPoints -= 30;
  }

  const hasEconomicCrisis = pestel.economic.some(e => 
    e.toLowerCase().includes("crise") || 
    e.toLowerCase().includes("recessão") ||
    e.toLowerCase().includes("desemprego")
  );

  const hasInflation = pestel.economic.some(e => 
    e.toLowerCase().includes("inflação") || 
    e.toLowerCase().includes("alta de preços")
  );

  if (hasEconomicCrisis && mix.priceValue && mix.priceValue > 25) {
    issues.push("PESTEL indica crise econômica, mas preço está alto");
    alignmentPoints -= 22;
  }

  if (hasInflation && mix.priceValue && mix.priceValue < 15) {
    issues.push("PESTEL indica inflação, mas preço não acompanha custos crescentes");
    alignmentPoints -= 15;
  }

  const hasTechTrends = pestel.technological.some(t => 
    t.toLowerCase().includes("digital") || 
    t.toLowerCase().includes("online") ||
    t.toLowerCase().includes("internet")
  );

  const hasDigitalChannel = mix.distributionChannels.some(channel => 
    channel.toLowerCase().includes("online") || 
    channel.toLowerCase().includes("e-commerce") ||
    channel.toLowerCase().includes("marketplace") ||
    channel.toLowerCase().includes("digital")
  );

  if (hasTechTrends && !hasDigitalChannel) {
    issues.push("PESTEL indica tendências digitais, mas canais tradicionais predominam");
    alignmentPoints -= 18;
  }

  const hasSocialChange = pestel.social.some(s => 
    s.toLowerCase().includes("sustentabilidade") || 
    s.toLowerCase().includes("consciência") ||
    s.toLowerCase().includes("responsabilidade")
  );

  if (hasSocialChange && mix.promotionIntensity === "alta") {
    issues.push("PESTEL indica mudanças sociais que requerem marketing consciente");
    alignmentPoints -= 8;
  }

  const hasRegulation = pestel.legal.some(l => 
    l.toLowerCase().includes("regulação") || 
    l.toLowerCase().includes("restrição") ||
    l.toLowerCase().includes("lei")
  );

  if (hasRegulation) {
    alignmentPoints -= 5;
    issues.push("Atenção: regulações identificadas no PESTEL podem impactar operações");
  }

  const score = Math.max(0, Math.min(100, alignmentPoints));
  return { score, issues, weight: 0.25 };
}

function calculateOverallScore(
  completionScore: number,
  swot: AlignmentScore,
  porter: AlignmentScore,
  bcg: AlignmentScore,
  pestel: AlignmentScore
): number {
  const completionWeight = 0.3;
  const analysisWeight = 0.7;

  const weightedAnalysisScore = (
    swot.score * swot.weight +
    porter.score * porter.weight +
    bcg.score * bcg.weight +
    pestel.score * pestel.weight
  );

  const overallScore = (completionScore * completionWeight) + (weightedAnalysisScore * analysisWeight);

  return Math.round(Math.max(0, Math.min(100, overallScore)));
}

function calculateKPIModifiers(overallScore: number): {
  revenueModifier: number;
  profitModifier: number;
  marketShareModifier: number;
} {
  if (overallScore >= 90) {
    return {
      revenueModifier: 0.20,
      profitModifier: 0.25,
      marketShareModifier: 0.15,
    };
  } else if (overallScore >= 75) {
    return {
      revenueModifier: 0.10,
      profitModifier: 0.15,
      marketShareModifier: 0.08,
    };
  } else if (overallScore >= 60) {
    return {
      revenueModifier: 0.03,
      profitModifier: 0.05,
      marketShareModifier: 0.02,
    };
  } else if (overallScore >= 40) {
    return {
      revenueModifier: -0.08,
      profitModifier: -0.12,
      marketShareModifier: -0.05,
    };
  } else if (overallScore >= 20) {
    return {
      revenueModifier: -0.20,
      profitModifier: -0.30,
      marketShareModifier: -0.15,
    };
  } else if (overallScore > 0) {
    return {
      revenueModifier: -0.35,
      profitModifier: -0.45,
      marketShareModifier: -0.25,
    };
  } else {
    return {
      revenueModifier: -0.50,
      profitModifier: -0.60,
      marketShareModifier: -0.35,
    };
  }
}

function compilePenalties(
  swot: AlignmentScore,
  porter: AlignmentScore,
  bcg: AlignmentScore,
  pestel: AlignmentScore,
  completionScore: number
): Array<{ description: string; impact: number }> {
  const penalties: Array<{ description: string; impact: number }> = [];

  if (completionScore < 100) {
    const missingAnalyses = Math.round((100 - completionScore) / 25);
    penalties.push({
      description: `${missingAnalyses} análise(s) estratégica(s) não concluída(s) - penalização de -10%`,
      impact: -10,
    });
  }

  [...swot.issues, ...porter.issues, ...bcg.issues, ...pestel.issues].forEach(issue => {
    const impact = calculateIssueImpact(issue);
    if (impact < 0) {
      penalties.push({ description: issue, impact });
    }
  });

  return penalties;
}

function calculateIssueImpact(issue: string): number {
  if (issue.includes("não realizada") || issue.includes("incompleta")) return -10;
  if (issue.includes("muito")) return -8;
  if (issue.includes("alto") || issue.includes("baixo")) return -6;
  return -4;
}

function getTotalPromotion(mix: MarketingMix): number {
  if (!mix.promotionBudgets) return 0;
  
  const budgets = mix.promotionBudgets as Record<string, number>;
  return Object.values(budgets).reduce((sum: number, value: number) => sum + (value || 0), 0);
}

export interface ProductAlignmentParams {
  productId: string;
  productName: string;
  swot: SwotAnalysis | null;
  porter: PorterAnalysis | null;
  bcg: BcgAnalysis | null;
  pestel: PestelAnalysis | null;
  marketingMix: MarketingMix;
  aiAssistanceLevel: number;
  budget: number;
}

export interface ProductAlignmentResult {
  productId: string;
  productName: string;
  alignment: AlignmentAnalysis;
  budget: number;
}

export function calculateProductAlignment(params: ProductAlignmentParams): ProductAlignmentResult {
  const alignment = calculateStrategicAlignment({
    swot: params.swot,
    porter: params.porter,
    bcg: params.bcg,
    pestel: params.pestel,
    marketingMix: params.marketingMix,
    aiAssistanceLevel: params.aiAssistanceLevel,
  });

  return {
    productId: params.productId,
    productName: params.productName,
    alignment,
    budget: params.budget,
  };
}

export function calculateConsolidatedAlignment(
  productAlignments: ProductAlignmentResult[]
): AlignmentAnalysis {
  if (productAlignments.length === 0) {
    return {
      overallScore: 0,
      swotAlignment: { score: 0, issues: ["Nenhum produto analisado"], weight: 0.25 },
      porterAlignment: { score: 0, issues: ["Nenhum produto analisado"], weight: 0.25 },
      bcgAlignment: { score: 0, issues: ["Nenhum produto analisado"], weight: 0.25 },
      pestelAlignment: { score: 0, issues: ["Nenhum produto analisado"], weight: 0.25 },
      kpiModifiers: {
        revenueModifier: -0.25,
        profitModifier: -0.35,
        marketShareModifier: -0.15,
      },
      penalties: [{ description: "Nenhum produto possui análise estratégica", impact: -50 }],
      level: 0,
      completionScore: 0,
    };
  }

  const totalBudget = productAlignments.reduce((sum, p) => sum + p.budget, 0);
  const useEqualWeights = totalBudget <= 0;
  const equalWeight = 1 / productAlignments.length;

  const weightedOverallScore = productAlignments.reduce((sum, p) => {
    const weight = useEqualWeights ? equalWeight : (p.budget / totalBudget);
    return sum + (p.alignment.overallScore * weight);
  }, 0);

  const weightedCompletionScore = productAlignments.reduce((sum, p) => {
    const weight = useEqualWeights ? equalWeight : (p.budget / totalBudget);
    return sum + (p.alignment.completionScore * weight);
  }, 0);

  const consolidatedSwot: AlignmentScore = {
    score: productAlignments.reduce((sum, p) => {
      const weight = useEqualWeights ? equalWeight : (p.budget / totalBudget);
      return sum + (p.alignment.swotAlignment.score * weight);
    }, 0),
    issues: consolidateIssues(productAlignments.map(p => ({
      productName: p.productName,
      issues: p.alignment.swotAlignment.issues,
    }))),
    weight: 0.25,
  };

  const consolidatedPorter: AlignmentScore = {
    score: productAlignments.reduce((sum, p) => {
      const weight = useEqualWeights ? equalWeight : (p.budget / totalBudget);
      return sum + (p.alignment.porterAlignment.score * weight);
    }, 0),
    issues: consolidateIssues(productAlignments.map(p => ({
      productName: p.productName,
      issues: p.alignment.porterAlignment.issues,
    }))),
    weight: 0.25,
  };

  const consolidatedBcg: AlignmentScore = {
    score: productAlignments.reduce((sum, p) => {
      const weight = useEqualWeights ? equalWeight : (p.budget / totalBudget);
      return sum + (p.alignment.bcgAlignment.score * weight);
    }, 0),
    issues: consolidateIssues(productAlignments.map(p => ({
      productName: p.productName,
      issues: p.alignment.bcgAlignment.issues,
    }))),
    weight: 0.25,
  };

  const consolidatedPestel: AlignmentScore = {
    score: productAlignments.reduce((sum, p) => {
      const weight = useEqualWeights ? equalWeight : (p.budget / totalBudget);
      return sum + (p.alignment.pestelAlignment.score * weight);
    }, 0),
    issues: consolidateIssues(productAlignments.map(p => ({
      productName: p.productName,
      issues: p.alignment.pestelAlignment.issues,
    }))),
    weight: 0.25,
  };

  const avgAiLevel = Math.round(
    productAlignments.reduce((sum, p) => sum + p.alignment.level, 0) / productAlignments.length
  );

  const kpiModifiers = calculateKPIModifiers(Math.round(weightedOverallScore));

  const consolidatedPenalties = consolidatePenalties(productAlignments);

  return {
    overallScore: Math.round(weightedOverallScore),
    swotAlignment: consolidatedSwot,
    porterAlignment: consolidatedPorter,
    bcgAlignment: consolidatedBcg,
    pestelAlignment: consolidatedPestel,
    kpiModifiers,
    penalties: consolidatedPenalties,
    level: avgAiLevel,
    completionScore: Math.round(weightedCompletionScore),
  };
}

function consolidateIssues(
  productIssues: Array<{ productName: string; issues: string[] }>
): string[] {
  const issueMap = new Map<string, string[]>();

  for (const { productName, issues } of productIssues) {
    for (const issue of issues) {
      if (!issueMap.has(issue)) {
        issueMap.set(issue, []);
      }
      issueMap.get(issue)!.push(productName);
    }
  }

  const consolidatedIssues: string[] = [];
  Array.from(issueMap.entries()).forEach(([issue, products]) => {
    if (products.length === productIssues.length) {
      consolidatedIssues.push(issue);
    } else {
      consolidatedIssues.push(`${issue} (${products.join(", ")})`);
    }
  });

  return consolidatedIssues;
}

function consolidatePenalties(
  productAlignments: ProductAlignmentResult[]
): Array<{ description: string; impact: number }> {
  const penaltyMap = new Map<string, { products: string[]; impact: number }>();

  for (const { productName, alignment } of productAlignments) {
    for (const penalty of alignment.penalties) {
      const key = penalty.description.replace(/\s*\([^)]*\)/, '');
      
      if (!penaltyMap.has(key)) {
        penaltyMap.set(key, { products: [], impact: penalty.impact });
      }
      penaltyMap.get(key)!.products.push(productName);
    }
  }

  const consolidatedPenalties: Array<{ description: string; impact: number }> = [];
  Array.from(penaltyMap.entries()).forEach(([description, { products, impact }]) => {
    if (products.length === productAlignments.length) {
      consolidatedPenalties.push({ description, impact });
    } else {
      consolidatedPenalties.push({
        description: `${description} (${products.join(", ")})`,
        impact,
      });
    }
  });

  return consolidatedPenalties;
}
