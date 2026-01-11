import type { MarketingMix, MarketEvent, Result } from "@shared/schema";

export interface BreakdownComponent {
  label: string;
  deltaRevenue: number;
  deltaProfit: number;
  deltaShare: number;
  explanation: string;
}

export interface CompetitorResponse {
  priceAdjustment: number;
  promoAdjustment: number;
  referencePrice: number;
  referencePromoSpend: number;
  explanation: string;
}

export interface EventImpact {
  eventId: string;
  title: string;
  type: string;
  revenueMultiplier: number;
  costMultiplier: number;
  demandMultiplier: number;
  explanation: string;
}

export interface SimulationResult {
  kpis: SimulationKPIs;
  breakdown: BreakdownComponent[];
  competitorResponse: CompetitorResponse;
  eventImpacts: EventImpact[];
}

export interface SimulationKPIs {
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  marketShare: number;
  roi: number;
  brandPerception: number;
  customerSatisfaction: number;
  customerLoyalty: number;
  cac: number;
  ltv: number;
  taxaConversao: number;
  ticketMedio: number;
  razaoLtvCac: number;
  nps: number;
  tempoMedioConversao: number;
  margemContribuicao: number;
  receitaBruta: number;
  receitaLiquida: number;
}

export interface SimulationInputs {
  marketingMix: MarketingMix;
  marketEvents: MarketEvent[];
  teamBudget: number;
  totalTeamsInRound: number;
  previousRoundData?: {
    teamPrice?: number;
    teamPromoSpend?: number;
    competitorPrice?: number;
    competitorPromoSpend?: number;
    teamMarketShare?: number;
  };
  classData?: {
    sector?: string;
    businessType?: string;
    marketSize?: number;
    marketGrowthRate?: number;
    competitionLevel?: string;
    numberOfCompetitors?: number;
  };
}

const CATEGORY_ELASTICITY: Record<string, number> = {
  "alimentos": 1.2,
  "bebidas": 1.1,
  "eletronicos": 1.8,
  "moda": 1.5,
  "saude": 0.6,
  "educacao": 0.5,
  "servicos": 1.0,
  "tecnologia": 1.6,
  "automotivo": 1.4,
  "imobiliario": 0.8,
  "financeiro": 0.7,
  "entretenimento": 1.3,
  "default": 1.0,
};

const PROMO_SATURATION_A = 0.15;
const PROMO_SATURATION_B = 10000;
const PROMO_CARRYOVER = 0.20;

export function computeRoundOutcome(inputs: SimulationInputs): SimulationResult {
  const breakdown: BreakdownComponent[] = [];
  const eventImpacts: EventImpact[] = [];

  const category = inputs.classData?.sector?.toLowerCase() || "default";
  const elasticity = CATEGORY_ELASTICITY[category] ?? CATEGORY_ELASTICITY.default;

  const competitorResponse = calculateCompetitorResponse(inputs);

  const priceEffect = calculatePriceEffect(inputs, competitorResponse, elasticity);
  breakdown.push(priceEffect);

  const promoEffect = calculatePromotionEffect(inputs);
  breakdown.push(promoEffect);

  const placeEffect = calculatePlaceEffect(inputs);
  breakdown.push(placeEffect);

  const productEffect = calculateProductEffect(inputs);
  breakdown.push(productEffect);

  const competitorEffect = calculateCompetitorEffect(inputs, competitorResponse);
  breakdown.push(competitorEffect);

  for (const event of inputs.marketEvents) {
    if (!event.active) continue;
    const impact = calculateEventImpact(event);
    eventImpacts.push(impact);
  }

  const eventEffect = aggregateEventEffects(eventImpacts);
  if (eventEffect) {
    breakdown.push(eventEffect);
  }

  const kpis = computeKPIs(inputs, breakdown, competitorResponse, eventImpacts);

  return {
    kpis,
    breakdown,
    competitorResponse,
    eventImpacts,
  };
}

function calculateCompetitorResponse(inputs: SimulationInputs): CompetitorResponse {
  const teamPrice = inputs.marketingMix.priceValue;
  const previousCompetitorPrice = inputs.previousRoundData?.competitorPrice ?? 75;
  const previousCompetitorPromo = inputs.previousRoundData?.competitorPromoSpend ?? 15000;
  const previousTeamPrice = inputs.previousRoundData?.teamPrice ?? 75;
  const previousTeamPromo = inputs.previousRoundData?.teamPromoSpend ?? 15000;

  let priceAdjustment = 0;
  let promoAdjustment = 0;
  const explanations: string[] = [];

  const priceDrop = previousTeamPrice - teamPrice;
  if (priceDrop > 10) {
    priceAdjustment = -Math.min(priceDrop * 0.4, 15);
    explanations.push(`Concorrente reduziu preço em R$${Math.abs(priceAdjustment).toFixed(2)} em resposta à queda de preço da equipe`);
  } else if (priceDrop < -10) {
    priceAdjustment = Math.min(Math.abs(priceDrop) * 0.2, 8);
    explanations.push(`Concorrente aumentou preço em R$${priceAdjustment.toFixed(2)} aproveitando movimento de alta da equipe`);
  }

  const promoMixCost = estimatePromoCost(inputs.marketingMix);
  const promoIncrease = promoMixCost - previousTeamPromo;
  if (promoIncrease > 5000) {
    promoAdjustment = Math.min(promoIncrease * 0.3, 10000);
    explanations.push(`Concorrente aumentou investimento promocional em R$${promoAdjustment.toFixed(2)} para manter competitividade`);
  }

  const referencePrice = Math.max(20, previousCompetitorPrice + priceAdjustment);
  const referencePromoSpend = Math.max(5000, previousCompetitorPromo + promoAdjustment);

  return {
    priceAdjustment,
    promoAdjustment,
    referencePrice,
    referencePromoSpend,
    explanation: explanations.length > 0 
      ? explanations.join(". ") 
      : "Concorrente manteve estratégia estável nesta rodada",
  };
}

function calculatePriceEffect(
  inputs: SimulationInputs,
  competitor: CompetitorResponse,
  elasticity: number
): BreakdownComponent {
  const teamPrice = inputs.marketingMix.priceValue;
  const referencePrice = competitor.referencePrice;

  const priceRatio = teamPrice / referencePrice;

  const demandMultiplier = Math.pow(priceRatio, -elasticity);
  const clampedMultiplier = Math.max(0.3, Math.min(3.0, demandMultiplier));

  const baseRevenue = inputs.teamBudget * 1.2;
  const deltaRevenue = baseRevenue * (clampedMultiplier - 1) * 0.25;
  const deltaProfit = deltaRevenue * 0.3;

  let shareEffect = 0;
  if (priceRatio < 0.9) {
    shareEffect = (0.9 - priceRatio) * 15;
  } else if (priceRatio > 1.1) {
    shareEffect = -(priceRatio - 1.1) * 12;
  }
  shareEffect = Math.max(-10, Math.min(10, shareEffect));

  let explanation: string;
  if (priceRatio < 0.85) {
    explanation = `Preço ${((1 - priceRatio) * 100).toFixed(0)}% abaixo do mercado. Elasticidade ${elasticity.toFixed(1)} gerou aumento significativo de demanda, mas com compressão de margens.`;
  } else if (priceRatio > 1.15) {
    explanation = `Preço ${((priceRatio - 1) * 100).toFixed(0)}% acima do mercado. Elasticidade ${elasticity.toFixed(1)} causou retração de demanda, possivelmente compensada por percepção premium.`;
  } else {
    explanation = `Preço próximo à referência de mercado (R$${referencePrice.toFixed(2)}). Elasticidade ${elasticity.toFixed(1)} indica impacto moderado na demanda.`;
  }

  return {
    label: "Efeito Preço",
    deltaRevenue: Math.round(deltaRevenue),
    deltaProfit: Math.round(deltaProfit),
    deltaShare: Math.round(shareEffect * 10) / 10,
    explanation,
  };
}

function calculatePromotionEffect(inputs: SimulationInputs): BreakdownComponent {
  const promoSpend = estimatePromoCost(inputs.marketingMix);
  const previousPromo = inputs.previousRoundData?.teamPromoSpend ?? 10000;

  const currentEffect = PROMO_SATURATION_A * Math.log(1 + promoSpend / PROMO_SATURATION_B);
  const carryover = PROMO_CARRYOVER * PROMO_SATURATION_A * Math.log(1 + previousPromo / PROMO_SATURATION_B);
  const totalEffect = currentEffect + carryover;

  const baseRevenue = inputs.teamBudget * 1.2;
  const deltaRevenue = baseRevenue * totalEffect * 0.5;
  const deltaProfit = deltaRevenue * 0.25 - promoSpend * 0.1;

  const shareEffect = Math.min(totalEffect * 20, 8);

  let explanation: string;
  const marginalReturn = promoSpend > 0 
    ? (deltaRevenue / promoSpend * 100).toFixed(0) 
    : "0";

  if (promoSpend > 30000) {
    explanation = `Investimento promocional elevado (R$${promoSpend.toLocaleString("pt-BR")}). Retorno marginal de ${marginalReturn}% indica saturação - incrementos adicionais têm efeito decrescente.`;
  } else if (promoSpend > 15000) {
    explanation = `Investimento promocional moderado-alto (R$${promoSpend.toLocaleString("pt-BR")}). Retorno marginal de ${marginalReturn}% ainda atrativo. Carryover de marca: +${(carryover * 100).toFixed(1)}%.`;
  } else {
    explanation = `Investimento promocional conservador (R$${promoSpend.toLocaleString("pt-BR")}). Retorno marginal de ${marginalReturn}% indica espaço para crescimento. Carryover: +${(carryover * 100).toFixed(1)}%.`;
  }

  return {
    label: "Efeito Promoção",
    deltaRevenue: Math.round(deltaRevenue),
    deltaProfit: Math.round(deltaProfit),
    deltaShare: Math.round(shareEffect * 10) / 10,
    explanation,
  };
}

function calculatePlaceEffect(inputs: SimulationInputs): BreakdownComponent {
  const mix = inputs.marketingMix;
  const channelCount = mix.distributionChannels.length;
  
  let coverageMultiplier = 1.0;
  if (mix.distributionCoverage === "local") coverageMultiplier = 0.6;
  else if (mix.distributionCoverage === "regional") coverageMultiplier = 0.85;
  else if (mix.distributionCoverage === "nacional") coverageMultiplier = 1.2;
  else if (mix.distributionCoverage === "internacional") coverageMultiplier = 1.5;

  const channelBonus = Math.min(channelCount * 0.08, 0.32);
  const totalPlaceEffect = (coverageMultiplier - 1) + channelBonus;

  const baseRevenue = inputs.teamBudget * 1.2;
  const deltaRevenue = baseRevenue * totalPlaceEffect * 0.3;
  const deltaProfit = deltaRevenue * 0.35 - channelCount * 2000;

  const shareEffect = totalPlaceEffect * 10;

  const explanation = `Distribuição ${mix.distributionCoverage} com ${channelCount} canal(is). Cobertura gera multiplicador de ${coverageMultiplier.toFixed(2)}x. Cada canal adicional expande alcance mas aumenta custos operacionais.`;

  return {
    label: "Efeito Praça",
    deltaRevenue: Math.round(deltaRevenue),
    deltaProfit: Math.round(deltaProfit),
    deltaShare: Math.round(shareEffect * 10) / 10,
    explanation,
  };
}

function calculateProductEffect(inputs: SimulationInputs): BreakdownComponent {
  const mix = inputs.marketingMix;
  
  let qualityMultiplier = 1.0;
  let qualityCostFactor = 0;
  if (mix.productQuality === "basico") {
    qualityMultiplier = 0.8;
    qualityCostFactor = 0.05;
  } else if (mix.productQuality === "medio") {
    qualityMultiplier = 1.0;
    qualityCostFactor = 0.12;
  } else if (mix.productQuality === "premium") {
    qualityMultiplier = 1.25;
    qualityCostFactor = 0.22;
  }

  let featureMultiplier = 1.0;
  let featureCostFactor = 0;
  if (mix.productFeatures === "basico") {
    featureMultiplier = 0.9;
    featureCostFactor = 0.03;
  } else if (mix.productFeatures === "intermediario") {
    featureMultiplier = 1.05;
    featureCostFactor = 0.08;
  } else if (mix.productFeatures === "completo") {
    featureMultiplier = 1.2;
    featureCostFactor = 0.15;
  }

  const totalProductEffect = (qualityMultiplier * featureMultiplier) - 1;
  const totalCostFactor = qualityCostFactor + featureCostFactor;

  const baseRevenue = inputs.teamBudget * 1.2;
  const deltaRevenue = baseRevenue * totalProductEffect * 0.35;
  const extraCost = inputs.teamBudget * totalCostFactor;
  const deltaProfit = deltaRevenue * 0.4 - extraCost;

  const shareEffect = totalProductEffect * 8;

  const explanation = `Produto ${mix.productQuality} com funcionalidades ${mix.productFeatures}. Qualidade premium aumenta percepção de valor e permite precificação superior, mas eleva custos de produção em ${(totalCostFactor * 100).toFixed(0)}%.`;

  return {
    label: "Efeito Produto",
    deltaRevenue: Math.round(deltaRevenue),
    deltaProfit: Math.round(deltaProfit),
    deltaShare: Math.round(shareEffect * 10) / 10,
    explanation,
  };
}

function calculateCompetitorEffect(
  inputs: SimulationInputs,
  competitor: CompetitorResponse
): BreakdownComponent {
  const totalAdjustment = Math.abs(competitor.priceAdjustment) + Math.abs(competitor.promoAdjustment / 1000);
  
  let competitiveImpact = 0;
  if (competitor.priceAdjustment < 0) {
    competitiveImpact -= Math.abs(competitor.priceAdjustment) * 0.005;
  }
  if (competitor.promoAdjustment > 0) {
    competitiveImpact -= (competitor.promoAdjustment / 10000) * 0.02;
  }

  const baseRevenue = inputs.teamBudget * 1.2;
  const deltaRevenue = baseRevenue * competitiveImpact;
  const deltaProfit = deltaRevenue * 0.3;
  const shareEffect = competitiveImpact * 25;

  let explanation: string;
  if (totalAdjustment < 2) {
    explanation = "Concorrência manteve posicionamento estável. Ambiente competitivo previsível.";
  } else if (competitor.priceAdjustment < -5) {
    explanation = `Concorrente reagiu com guerra de preços (redução de R$${Math.abs(competitor.priceAdjustment).toFixed(2)}). Pressão sobre margens do setor.`;
  } else if (competitor.promoAdjustment > 5000) {
    explanation = `Concorrente intensificou promoções (+R$${competitor.promoAdjustment.toLocaleString("pt-BR")}). Disputa por atenção do consumidor.`;
  } else {
    explanation = `Ajustes competitivos moderados. Mercado em equilíbrio dinâmico.`;
  }

  return {
    label: "Efeito Competição",
    deltaRevenue: Math.round(deltaRevenue),
    deltaProfit: Math.round(deltaProfit),
    deltaShare: Math.round(shareEffect * 10) / 10,
    explanation,
  };
}

function calculateEventImpact(event: MarketEvent): EventImpact {
  let revenueMultiplier = 1.0;
  let costMultiplier = 1.0;
  let demandMultiplier = 1.0;

  const severityFactor = getSeverityFactor(event.severity);

  switch (event.type) {
    case "economia":
      demandMultiplier = 1 - severityFactor * 0.15;
      revenueMultiplier = 1 - severityFactor * 0.12;
      break;
    case "competicao":
      revenueMultiplier = 1 - severityFactor * 0.08;
      demandMultiplier = 1 - severityFactor * 0.05;
      break;
    case "tecnologia":
      revenueMultiplier = 1 + severityFactor * 0.08;
      costMultiplier = 1 - severityFactor * 0.05;
      break;
    case "social":
      demandMultiplier = 1 + severityFactor * 0.10;
      break;
    case "politico":
      costMultiplier = 1 + severityFactor * 0.08;
      break;
    case "ambiental":
      costMultiplier = 1 + severityFactor * 0.12;
      demandMultiplier = 1 - severityFactor * 0.05;
      break;
    default:
      break;
  }

  const explanation = `Evento "${event.title}" (${event.type}, ${event.severity}): ${event.description}. Impacto: Receita ${formatMultiplier(revenueMultiplier)}, Custos ${formatMultiplier(costMultiplier)}, Demanda ${formatMultiplier(demandMultiplier)}.`;

  return {
    eventId: event.id,
    title: event.title,
    type: event.type,
    revenueMultiplier,
    costMultiplier,
    demandMultiplier,
    explanation,
  };
}

function aggregateEventEffects(eventImpacts: EventImpact[]): BreakdownComponent | null {
  if (eventImpacts.length === 0) return null;

  let totalRevenueMultiplier = 1.0;
  let totalCostMultiplier = 1.0;
  let totalDemandMultiplier = 1.0;

  for (const impact of eventImpacts) {
    totalRevenueMultiplier *= impact.revenueMultiplier;
    totalCostMultiplier *= impact.costMultiplier;
    totalDemandMultiplier *= impact.demandMultiplier;
  }

  const avgRevenueEffect = (totalRevenueMultiplier * totalDemandMultiplier - 1);
  const avgCostEffect = (totalCostMultiplier - 1);

  const baseRevenue = 100000;
  const deltaRevenue = baseRevenue * avgRevenueEffect;
  const deltaProfit = deltaRevenue * 0.3 - baseRevenue * 0.5 * avgCostEffect;
  const shareEffect = avgRevenueEffect * 15;

  const eventCount = eventImpacts.length;
  const explanation = `${eventCount} evento(s) de mercado afetando a rodada. Impacto combinado: Receita ${formatMultiplier(totalRevenueMultiplier * totalDemandMultiplier)}, Custos ${formatMultiplier(totalCostMultiplier)}.`;

  return {
    label: "Efeito Eventos",
    deltaRevenue: Math.round(deltaRevenue),
    deltaProfit: Math.round(deltaProfit),
    deltaShare: Math.round(shareEffect * 10) / 10,
    explanation,
  };
}

function computeKPIs(
  inputs: SimulationInputs,
  breakdown: BreakdownComponent[],
  competitor: CompetitorResponse,
  eventImpacts: EventImpact[]
): SimulationKPIs {
  const baseRevenue = inputs.teamBudget * 1.15;
  const baseCosts = inputs.teamBudget * 0.70;

  let totalDeltaRevenue = 0;
  let totalDeltaProfit = 0;
  let totalDeltaShare = 0;

  for (const component of breakdown) {
    totalDeltaRevenue += component.deltaRevenue;
    totalDeltaProfit += component.deltaProfit;
    totalDeltaShare += component.deltaShare;
  }

  let eventRevenueMultiplier = 1.0;
  let eventCostMultiplier = 1.0;
  for (const impact of eventImpacts) {
    eventRevenueMultiplier *= impact.revenueMultiplier * impact.demandMultiplier;
    eventCostMultiplier *= impact.costMultiplier;
  }

  const revenue = Math.max(0, (baseRevenue + totalDeltaRevenue) * eventRevenueMultiplier);
  const costs = Math.max(0, baseCosts * eventCostMultiplier);
  const profit = revenue - costs + totalDeltaProfit;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  const baseShare = 100 / Math.max(inputs.totalTeamsInRound, 1);
  const marketShare = Math.max(1, Math.min(60, baseShare + totalDeltaShare));

  const roi = costs > 0 ? ((profit / costs) * 100) : 0;

  const priceValue = inputs.marketingMix.priceValue;
  const productQuality = inputs.marketingMix.productQuality;
  
  let brandPerception = 50;
  if (productQuality === "premium") brandPerception = 75;
  else if (productQuality === "medio") brandPerception = 55;
  else brandPerception = 40;
  brandPerception += totalDeltaShare * 0.5;
  brandPerception = Math.max(20, Math.min(95, brandPerception));

  const customerSatisfaction = Math.max(30, Math.min(95, 50 + totalDeltaShare * 0.8));
  const customerLoyalty = Math.max(25, Math.min(90, (brandPerception + customerSatisfaction) / 2.2));

  const estimatedCustomers = revenue > 0 && priceValue > 0 
    ? Math.max(100, revenue / priceValue) 
    : 100;
  const ticketMedio = revenue / estimatedCustomers;
  const cac = costs > 0 ? costs * 0.3 / estimatedCustomers : 0;
  const ltv = ticketMedio * (customerLoyalty / 30);
  const razaoLtvCac = cac > 0 ? ltv / cac : 0;

  const taxaConversao = Math.max(1, Math.min(15, 5 + totalDeltaShare * 0.3));
  const tempoMedioConversao = Math.max(1, 15 - taxaConversao * 0.8);

  const nps = Math.max(-50, Math.min(80, (customerSatisfaction - 50) * 1.5 + (brandPerception - 50) * 0.5));

  const receitaBruta = revenue;
  const receitaLiquida = receitaBruta * 0.88;
  const margemContribuicao = receitaLiquida - costs * 0.6;

  return {
    revenue: Math.round(revenue * 100) / 100,
    costs: Math.round(costs * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    margin: Math.round(margin * 100) / 100,
    marketShare: Math.round(marketShare * 100) / 100,
    roi: Math.round(Math.min(roi, 300) * 100) / 100,
    brandPerception: Math.round(brandPerception * 100) / 100,
    customerSatisfaction: Math.round(customerSatisfaction * 100) / 100,
    customerLoyalty: Math.round(customerLoyalty * 100) / 100,
    cac: Math.round(cac * 100) / 100,
    ltv: Math.round(ltv * 100) / 100,
    taxaConversao: Math.round(taxaConversao * 100) / 100,
    ticketMedio: Math.round(ticketMedio * 100) / 100,
    razaoLtvCac: Math.round(razaoLtvCac * 100) / 100,
    nps: Math.round(nps * 100) / 100,
    tempoMedioConversao: Math.round(tempoMedioConversao * 100) / 100,
    margemContribuicao: Math.round(margemContribuicao * 100) / 100,
    receitaBruta: Math.round(receitaBruta * 100) / 100,
    receitaLiquida: Math.round(receitaLiquida * 100) / 100,
  };
}

function estimatePromoCost(mix: MarketingMix): number {
  const promoCount = mix.promotionMix.length;
  let baseCost = promoCount * 3000;

  if (mix.promotionIntensity === "baixo") baseCost *= 0.5;
  else if (mix.promotionIntensity === "medio") baseCost *= 1.0;
  else if (mix.promotionIntensity === "alto") baseCost *= 1.8;
  else if (mix.promotionIntensity === "intensivo") baseCost *= 2.5;

  return baseCost;
}

function getSeverityFactor(severity: string): number {
  switch (severity) {
    case "baixo": return 0.25;
    case "medio": return 0.5;
    case "alto": return 0.75;
    case "critico": return 1.0;
    default: return 0.5;
  }
}

function formatMultiplier(value: number): string {
  const percentage = (value - 1) * 100;
  if (percentage >= 0) {
    return `+${percentage.toFixed(1)}%`;
  }
  return `${percentage.toFixed(1)}%`;
}
