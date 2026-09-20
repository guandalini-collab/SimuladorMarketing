import type { MarketingMix, MarketEvent, Result } from "@shared/schema";
import { calculateStrategicAlignment } from "./services/strategicAlignment";

function addAccountingDefaults(kpis: Partial<ResultCoreMetrics>): ResultCoreMetrics {
  return {
    ...kpis,
    impostos: kpis.impostos ?? 0,
    devolucoes: kpis.devolucoes ?? 0,
    descontos: kpis.descontos ?? 0,
    cpv: kpis.cpv ?? 0,
    lucroBruto: kpis.lucroBruto ?? 0,
    despesasVendas: kpis.despesasVendas ?? 0,
    despesasAdmin: kpis.despesasAdmin ?? 0,
    despesasFinanc: kpis.despesasFinanc ?? 0,
    outrasDespesas: kpis.outrasDespesas ?? 0,
    ebitda: kpis.ebitda ?? 0,
    depreciacao: kpis.depreciacao ?? 0,
    lair: kpis.lair ?? 0,
    irCsll: kpis.irCsll ?? 0,
    lucroLiquido: kpis.lucroLiquido ?? 0,
    caixa: kpis.caixa ?? 0,
    contasReceber: kpis.contasReceber ?? 0,
    estoques: kpis.estoques ?? 0,
    ativoCirculante: kpis.ativoCirculante ?? 0,
    imobilizado: kpis.imobilizado ?? 0,
    intangivel: kpis.intangivel ?? 0,
    ativoNaoCirculante: kpis.ativoNaoCirculante ?? 0,
    ativoTotal: kpis.ativoTotal ?? 0,
    fornecedores: kpis.fornecedores ?? 0,
    obrigFiscais: kpis.obrigFiscais ?? 0,
    outrasObrig: kpis.outrasObrig ?? 0,
    passivoCirculante: kpis.passivoCirculante ?? 0,
    financiamentosLP: kpis.financiamentosLP ?? 0,
    passivoNaoCirculante: kpis.passivoNaoCirculante ?? 0,
    capitalSocial: kpis.capitalSocial ?? 0,
    lucrosAcumulados: kpis.lucrosAcumulados ?? 0,
    patrimonioLiquido: kpis.patrimonioLiquido ?? 0,
    passivoPlTotal: kpis.passivoPlTotal ?? 0,
  } as ResultCoreMetrics;
}

type ResultCoreMetrics = Pick<Result, 
  'revenue' | 'costs' | 'profit' | 'margin' | 'marketShare' | 'roi' | 
  'brandPerception' | 'customerSatisfaction' | 'customerLoyalty' | 
  'cac' | 'ltv' | 'taxaConversao' | 'ticketMedio' | 'razaoLtvCac' | 
  'nps' | 'tempoMedioConversao' | 'margemContribuicao' | 
  'receitaBruta' | 'receitaLiquida' |
  // DRE Completa
  'impostos' | 'devolucoes' | 'descontos' | 'cpv' | 'lucroBruto' |
  'despesasVendas' | 'despesasAdmin' | 'despesasFinanc' | 'outrasDespesas' |
  'ebitda' | 'depreciacao' | 'lair' | 'irCsll' | 'lucroLiquido' |
  // Balanço Patrimonial
  'caixa' | 'contasReceber' | 'estoques' | 'ativoCirculante' |
  'imobilizado' | 'intangivel' | 'ativoNaoCirculante' | 'ativoTotal' |
  'fornecedores' | 'obrigFiscais' | 'outrasObrig' | 'passivoCirculante' |
  'financiamentosLP' | 'passivoNaoCirculante' | 'capitalSocial' |
  'lucrosAcumulados' | 'patrimonioLiquido' | 'passivoPlTotal'
>;

interface CalculationInputs {
  marketingMix: MarketingMix;
  marketEvents: MarketEvent[];
  teamBudget: number;
  totalTeamsInRound: number;
  previousAccumulatedProfits?: number;
  classData?: {
    sector?: string;
    businessType?: string;
    marketSize?: number;
    marketGrowthRate?: number;
    competitionLevel?: string;
    numberOfCompetitors?: number;
    marketConcentration?: string;
    competitorStrength?: string;
    targetConsumers?: number;
  };
  sectorData?: {
    averageMargin?: number;
    growthRate?: number;
    competitionLevel?: string;
  };
  teamData?: {
    productCategory?: string;
    targetAudienceClass?: string;
    targetAudienceAge?: string;
    targetAudienceProfile?: string;
  };
}

export function calculateMarketingSpend(
  marketingMix: MarketingMix,
  averageMargin?: number
): number {
  const BASE_COST = 10000;
  
  let costMultiplier = 1.0;
  
  if (marketingMix.productQuality === "premium") costMultiplier += 0.4;
  else if (marketingMix.productQuality === "medio") costMultiplier += 0.2;
  else if (marketingMix.productQuality === "basico") costMultiplier += 0.1;
  
  if (marketingMix.productFeatures === "completo") costMultiplier += 0.3;
  else if (marketingMix.productFeatures === "intermediario") costMultiplier += 0.15;
  
  const channelCost = marketingMix.distributionChannels.length * 0.1;
  costMultiplier += channelCost;
  
  const promoCost = marketingMix.promotionMix.length * 0.15;
  costMultiplier += promoCost;
  
  if (marketingMix.promotionIntensity === "intensivo") costMultiplier += 0.5;
  else if (marketingMix.promotionIntensity === "alto") costMultiplier += 0.3;
  else if (marketingMix.promotionIntensity === "medio") costMultiplier += 0.15;
  else if (marketingMix.promotionIntensity === "baixo") costMultiplier += 0.05;
  
  if (marketingMix.distributionCoverage === "internacional") costMultiplier += 0.4;
  else if (marketingMix.distributionCoverage === "nacional") costMultiplier += 0.25;
  else if (marketingMix.distributionCoverage === "regional") costMultiplier += 0.1;
  
  if (averageMargin !== undefined && averageMargin > 0) {
    const marginAdjust = (100 - averageMargin) / 100;
    costMultiplier *= marginAdjust;
  }
  
  return BASE_COST * costMultiplier;
}

// Grupo A (auditoria de 2026-09) — item 1: a DRE e o Balanço Patrimonial
// completos são derivados aqui, uma única vez, a partir de
// (receitaBruta, receitaLiquida, costs, teamBudget). Extraído de dentro de
// calculateResults() para poder ser chamado de novo, com os valores
// ATUALIZADOS de revenue/costs, depois que applyStrategicImpacts() e
// applyAlignmentPenalties() os ajustam — antes, esses dois ajustes
// recalculavam profit/margin/roi/receitaLiquida (via recomputeDependentKPIs)
// mas devolviam a DRE e o Balanço intactos, com os valores de ANTES do
// ajuste (bug: relatório contábil ficava inconsistente com o revenue/costs
// finais da rodada). Não inclui caixa/ativoCirculante/ativoTotal nem
// capitalSocial/lucrosAcumulados/patrimonioLiquido/passivoPlTotal — esses
// dependem do carregamento de patrimônio entre rodadas (ver
// applyEquityCarryover) e são responsabilidade de quem chama esta função.
interface AccountingStatements {
  impostos: number;
  devolucoes: number;
  descontos: number;
  cpv: number;
  lucroBruto: number;
  despesasVendas: number;
  despesasAdmin: number;
  despesasFinanc: number;
  outrasDespesas: number;
  depreciacao: number;
  ebitda: number;
  lair: number;
  irCsll: number;
  lucroLiquido: number;
  contasReceber: number;
  estoques: number;
  imobilizado: number;
  intangivel: number;
  ativoNaoCirculante: number;
  fornecedores: number;
  obrigFiscais: number;
  outrasObrig: number;
  passivoCirculante: number;
  financiamentosLP: number;
  passivoNaoCirculante: number;
}

function deriveAccountingStatements(
  receitaBruta: number,
  receitaLiquida: number,
  costs: number,
  teamBudget: number
): AccountingStatements {
  // Deduções da Receita Bruta (baseadas no gap entre bruta e líquida)
  const deducaoTotal = receitaBruta - receitaLiquida;
  const impostos = deducaoTotal * 0.70;
  const devolucoes = deducaoTotal * 0.20;
  const descontos = deducaoTotal * 0.10;

  // CPV - Custo dos Produtos Vendidos (60% dos custos totais)
  const cpv = costs * 0.60;
  const lucroBruto = receitaLiquida - cpv;

  // Despesas Operacionais (40% restante dos custos, distribuídos)
  const despesasOperacionaisTotais = costs * 0.40;
  const despesasVendas = despesasOperacionaisTotais * 0.625;
  const despesasAdmin = despesasOperacionaisTotais * 0.25;
  const despesasFinanc = despesasOperacionaisTotais * 0.075;
  const outrasDespesas = despesasOperacionaisTotais * 0.05;

  const depreciacao = costs * 0.03;
  const ebitda = lucroBruto - despesasOperacionaisTotais;
  const lair = ebitda - depreciacao;
  const irCsll = lair > 0 ? lair * 0.34 : 0;
  const lucroLiquido = lair - irCsll;

  const contasReceber = receitaLiquida * 0.25;
  const estoques = costs * 0.10;
  const imobilizado = costs * 0.40;
  const intangivel = teamBudget * 0.15;
  const ativoNaoCirculante = imobilizado + intangivel;

  const fornecedores = costs * 0.20;
  const obrigFiscais = irCsll;
  const outrasObrig = costs * 0.10;
  const passivoCirculante = fornecedores + obrigFiscais + outrasObrig;

  const financiamentosLP = teamBudget * 0.20;
  const passivoNaoCirculante = financiamentosLP;

  return {
    impostos, devolucoes, descontos, cpv, lucroBruto,
    despesasVendas, despesasAdmin, despesasFinanc, outrasDespesas,
    depreciacao, ebitda, lair, irCsll, lucroLiquido,
    contasReceber, estoques, imobilizado, intangivel, ativoNaoCirculante,
    fornecedores, obrigFiscais, outrasObrig, passivoCirculante,
    financiamentosLP, passivoNaoCirculante,
  };
}

export function calculateResults(inputs: CalculationInputs): ResultCoreMetrics {
  const { 
    marketingMix, 
    marketEvents, 
    teamBudget, 
    totalTeamsInRound,
    previousAccumulatedProfits = 0,
    classData = {},
    sectorData = {},
    teamData = {}
  } = inputs;
  
  const productScore = calculateProductScore(marketingMix);
  const priceScore = calculatePriceScore(marketingMix, classData.businessType);
  const placeScore = calculatePlaceScore(marketingMix, classData.businessType);
  const promotionScore = calculatePromotionScore(marketingMix);
  
  const eventImpact = calculateEventImpact(marketEvents);
  
  const costs = calculateCosts(marketingMix, teamBudget, sectorData.averageMargin);
  const revenue = calculateRevenue(
    productScore, 
    priceScore, 
    placeScore, 
    promotionScore, 
    eventImpact, 
    teamBudget,
    classData.marketSize,
    classData.marketGrowthRate,
    classData.competitionLevel,
    classData.numberOfCompetitors,
    classData.marketConcentration,
    classData.competitorStrength
  );
  const profit = revenue - costs;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  
  const marketShare = calculateMarketShare(
    revenue, 
    totalTeamsInRound, 
    classData.numberOfCompetitors,
    classData.marketConcentration
  );
  const roi = costs > 0 ? ((profit / costs) * 100) : 0;
  
  const brandPerception = calculateBrandPerception(productScore, priceScore, promotionScore);
  const customerSatisfaction = calculateCustomerSatisfaction(productScore, placeScore, priceScore);
  const customerLoyalty = calculateCustomerLoyalty(brandPerception, customerSatisfaction);
  
  const estimatedCustomers = calculateEstimatedCustomers(
    revenue,
    marketingMix.priceValue,
    marketShare,
    classData.targetConsumers
  );
  const ticketMedio = estimatedCustomers > 0 ? revenue / estimatedCustomers : 0;
  const cac = estimatedCustomers > 0 ? costs / estimatedCustomers : 0;
  const taxaConversao = calculateConversionRate(
    productScore,
    priceScore,
    placeScore,
    promotionScore,
    classData.competitionLevel
  );
  const ltv = calculateLTV(ticketMedio, customerLoyalty, customerSatisfaction);
  const razaoLtvCac = cac > 0 ? ltv / cac : 0;
  
  const nps = calculateNPS(customerSatisfaction, customerLoyalty, brandPerception);
  const tempoMedioConversao = calculateAverageConversionTime(
    productScore,
    priceScore,
    marketingMix.priceValue,
    classData.competitionLevel
  );
  const receitaBruta = revenue;
  const receitaLiquida = calculateNetRevenue(revenue);
  const margemContribuicao = calculateContributionMargin(receitaLiquida, costs);
  
  // ========== DRE COMPLETA e BALANÇO (parte dependente de revenue/costs) ==========
  const stmt = deriveAccountingStatements(receitaBruta, receitaLiquida, costs, teamBudget);
  const {
    impostos, devolucoes, descontos, cpv, lucroBruto,
    despesasVendas, despesasAdmin, despesasFinanc, outrasDespesas,
    depreciacao, ebitda, lair, irCsll, lucroLiquido,
    contasReceber, estoques, imobilizado, intangivel, ativoNaoCirculante,
    fornecedores, obrigFiscais, outrasObrig, passivoCirculante,
    financiamentosLP, passivoNaoCirculante,
  } = stmt;

  // ========== BALANÇO PATRIMONIAL (parte dependente do patrimônio acumulado) ==========

  // ATIVO CIRCULANTE
  const caixa = lucroLiquido;                          // Caixa gerado no período
  const ativoCirculante = caixa + contasReceber + estoques;

  // TOTAL DO ATIVO
  const ativoTotal = ativoCirculante + ativoNaoCirculante;

  // PATRIMÔNIO LÍQUIDO
  const capitalSocial = teamBudget * 0.50;             // 50% do orçamento (capital inicial)
  // Lucros Acumulados balanceadores para fechar a equação patrimonial
  // Ativo Total = Passivo Circulante + Passivo Não Circulante + Patrimônio Líquido
  // Patrimônio Líquido = Capital Social + Lucros Acumulados
  // Logo: Lucros Acumulados = Ativo Total - Passivo Circulante - Passivo Não Circulante - Capital Social
  const lucrosAcumulados = ativoTotal - passivoCirculante - passivoNaoCirculante - capitalSocial;
  const patrimonioLiquido = capitalSocial + lucrosAcumulados;
  
  // TOTAL PASSIVO + PL (deve igualar ATIVO TOTAL pela equação patrimonial)
  const passivoPlTotal = passivoCirculante + passivoNaoCirculante + patrimonioLiquido;
  
  // Retornar valores sem arredondamento para manter precisão
  // O arredondamento será feito apenas após applyStrategicImpacts
  return {
    revenue,
    costs,
    profit,
    margin,
    marketShare,
    roi,
    brandPerception,
    customerSatisfaction,
    customerLoyalty,
    cac,
    ltv,
    taxaConversao,
    ticketMedio,
    razaoLtvCac,
    nps,
    tempoMedioConversao,
    margemContribuicao,
    receitaBruta,
    receitaLiquida,
    
    // DRE Completa
    impostos,
    devolucoes,
    descontos,
    cpv,
    lucroBruto,
    despesasVendas,
    despesasAdmin,
    despesasFinanc,
    outrasDespesas,
    ebitda,
    depreciacao,
    lair,
    irCsll,
    lucroLiquido,
    
    // Balanço Patrimonial
    caixa,
    contasReceber,
    estoques,
    ativoCirculante,
    imobilizado,
    intangivel,
    ativoNaoCirculante,
    ativoTotal,
    fornecedores,
    obrigFiscais,
    outrasObrig,
    passivoCirculante,
    financiamentosLP,
    passivoNaoCirculante,
    capitalSocial,
    lucrosAcumulados,
    patrimonioLiquido,
    passivoPlTotal,
  };
}

// Item 4 da auditoria: antes, `capitalSocial` era recalculado a cada rodada
// como 50% do orçamento ATUAL da equipe, e `lucrosAcumulados` era só um
// resíduo para fechar a equação patrimonial (Ativo = Passivo + PL) —
// nenhum dos dois carregava histórico de verdade entre rodadas, apesar do
// nome "Lucros Acumulados" sugerir uma série acumulada. Esta função corrige
// isso: `capitalSocialFixo` é fixado desde a criação da equipe (não muda
// mais a cada rodada) e `previousAccumulatedProfits` é somado ao lucro
// líquido do período para formar o novo acumulado de verdade. Para a
// equação patrimonial continuar fechando com esses dois valores agora
// genuínos, quem passa a ser o item de fechamento é o `caixa` — o que
// inclusive é mais realista: caixa cresce conforme os lucros retidos se
// acumulam, em vez de resetar a cada rodada.
export function applyEquityCarryover(
  kpis: ResultCoreMetrics,
  capitalSocialFixo: number,
  previousAccumulatedProfits: number
): ResultCoreMetrics {
  const lucrosAcumulados = previousAccumulatedProfits + (kpis.lucroLiquido ?? 0);
  const patrimonioLiquido = capitalSocialFixo + lucrosAcumulados;
  const passivoPlTotal = (kpis.passivoCirculante ?? 0) + (kpis.passivoNaoCirculante ?? 0) + patrimonioLiquido;

  const caixa = passivoPlTotal - (kpis.ativoNaoCirculante ?? 0) - (kpis.contasReceber ?? 0) - (kpis.estoques ?? 0);
  const ativoCirculante = caixa + (kpis.contasReceber ?? 0) + (kpis.estoques ?? 0);
  const ativoTotal = ativoCirculante + (kpis.ativoNaoCirculante ?? 0);

  return {
    ...kpis,
    capitalSocial: capitalSocialFixo,
    lucrosAcumulados,
    patrimonioLiquido,
    passivoPlTotal,
    caixa,
    ativoCirculante,
    ativoTotal,
  };
}

function calculateProductScore(mix: MarketingMix): number {
  let score = 20;
  
  if (mix.productQuality === "basico") score += 15;
  else if (mix.productQuality === "medio") score += 30;
  else if (mix.productQuality === "premium") score += 50;
  
  if (mix.productFeatures === "basico") score += 10;
  else if (mix.productFeatures === "intermediario") score += 20;
  else if (mix.productFeatures === "completo") score += 30;
  
  return Math.min(score, 100);
}

function calculatePriceScore(mix: MarketingMix, businessType?: string): number {
  let score = 25;
  const price = mix.priceValue;
  
  if (mix.priceStrategy === "penetracao" && price < 50) score += 35;
  else if (mix.priceStrategy === "competitivo" && price >= 50 && price <= 100) score += 30;
  else if (mix.priceStrategy === "skimming" && price > 100) score += 35;
  else if (mix.priceStrategy === "valor") score += 40;
  else score += 10;
  
  let priceOptimality = 100 - Math.abs(75 - price) * 0.7;
  
  const normalizedType = businessType?.toLowerCase();
  if (normalizedType === "b2b" && price > 80) {
    priceOptimality += 8;
  } else if (normalizedType === "b2c" && price < 90) {
    priceOptimality += 5;
  }
  
  score += (priceOptimality - 50) * 0.25;
  
  return Math.min(Math.max(score, 0), 100);
}

function calculatePlaceScore(mix: MarketingMix, businessType?: string): number {
  let score = 15;
  
  const channelCount = mix.distributionChannels.length;
  if (channelCount === 1) score += 20;
  else if (channelCount === 2) score += 35;
  else if (channelCount === 3) score += 45;
  else if (channelCount >= 4) score += 50;
  
  if (mix.distributionCoverage === "local") score += 15;
  else if (mix.distributionCoverage === "regional") score += 25;
  else if (mix.distributionCoverage === "nacional") score += 40;
  else if (mix.distributionCoverage === "internacional") score += 50;
  
  const normalizedType = businessType?.toLowerCase();
  if (normalizedType === "b2b" && channelCount >= 2) {
    score += 5;
  } else if (normalizedType === "b2c" && channelCount >= 3) {
    score += 5;
  }
  
  return Math.min(score, 100);
}

function calculatePromotionScore(mix: MarketingMix): number {
  let score = 15;
  
  const promoCount = mix.promotionMix.length;
  if (promoCount === 1) score += 20;
  else if (promoCount === 2) score += 30;
  else if (promoCount === 3) score += 40;
  else if (promoCount >= 4) score += 50;
  
  if (mix.promotionIntensity === "baixo") score += 10;
  else if (mix.promotionIntensity === "medio") score += 20;
  else if (mix.promotionIntensity === "alto") score += 35;
  else if (mix.promotionIntensity === "intensivo") score += 45;
  
  return Math.min(score, 100);
}

function calculateEventImpact(events: MarketEvent[]): number {
  if (events.length === 0) return 1.0;
  
  let totalImpact = 0;
  
  for (const event of events) {
    let eventMultiplier = 0;
    
    if (event.severity === "baixo") eventMultiplier = 0.05;
    else if (event.severity === "medio") eventMultiplier = 0.1;
    else if (event.severity === "alto") eventMultiplier = 0.15;
    else if (event.severity === "critico") eventMultiplier = 0.25;
    
    if (event.type === "economico" || event.type === "competitivo") {
      totalImpact -= eventMultiplier;
    } else if (event.type === "tecnologico" || event.type === "social") {
      totalImpact += eventMultiplier * 0.5;
    }
    // "regulatorio" fica sem efeito numérico por ora — os eventos dessa
    // categoria têm sentido misto (ex.: "Aumento de Impostos" é negativo,
    // "Redução de Impostos" é positivo) e o cálculo atual só decide pelo
    // tipo+severidade, sem ler o conteúdo do evento. Tratar com mais calma
    // antes de atribuir uma direção única a essa categoria.
  }
  
  return Math.max(0.5, Math.min(1.5, 1 + totalImpact));
}

function calculateCosts(mix: MarketingMix, budget: number, averageMargin?: number): number {
  let baseCostRate = 0.65;
  
  if (averageMargin !== undefined && averageMargin > 0) {
    baseCostRate = Math.max(0.55, Math.min(0.75, (100 - averageMargin) / 100));
  }
  
  let costs = budget * baseCostRate;
  
  if (mix.productQuality === "premium") costs += budget * 0.12;
  else if (mix.productQuality === "medio") costs += budget * 0.06;
  else if (mix.productQuality === "basico") costs += budget * 0.02;
  
  if (mix.productFeatures === "completo") costs += budget * 0.10;
  else if (mix.productFeatures === "intermediario") costs += budget * 0.05;
  else if (mix.productFeatures === "basico") costs += budget * 0.02;
  
  const channelCost = Math.min(mix.distributionChannels.length * budget * 0.04, budget * 0.16);
  costs += channelCost;
  
  const promoCost = Math.min(mix.promotionMix.length * budget * 0.05, budget * 0.20);
  costs += promoCost;
  
  if (mix.promotionIntensity === "intensivo") costs += budget * 0.12;
  else if (mix.promotionIntensity === "alto") costs += budget * 0.08;
  else if (mix.promotionIntensity === "medio") costs += budget * 0.04;
  else if (mix.promotionIntensity === "baixo") costs += budget * 0.01;
  
  costs = Math.min(costs, budget * 0.95);
  
  return costs;
}

function calculateRevenue(
  productScore: number,
  priceScore: number,
  placeScore: number,
  promotionScore: number,
  eventImpact: number,
  budget: number,
  marketSize?: number,
  growthRate?: number,
  competitionLevel?: string,
  numberOfCompetitors?: number,
  marketConcentration?: string,
  competitorStrength?: string
): number {
  const overallScore = (productScore + priceScore + placeScore + promotionScore) / 4;
  
  let baseMultiplier = 1.3;
  
  const scoreFactor = overallScore / 100;
  const diminishingReturns = Math.pow(scoreFactor, 1.2);
  
  let revenueMultiplier = baseMultiplier * (0.6 + 0.8 * diminishingReturns);
  
  if (growthRate !== undefined && growthRate > 0) {
    revenueMultiplier += (growthRate / 100) * 0.3;
  }
  
  if (competitionLevel) {
    if (competitionLevel === "baixa") revenueMultiplier += 0.25;
    else if (competitionLevel === "media") revenueMultiplier += 0.05;
    else if (competitionLevel === "alta") revenueMultiplier -= 0.15;
    else if (competitionLevel === "muito_alta") revenueMultiplier -= 0.30;
  }
  
  if (numberOfCompetitors !== undefined && numberOfCompetitors > 0) {
    if (numberOfCompetitors <= 3) {
      revenueMultiplier += 0.12;
    } else if (numberOfCompetitors <= 7) {
      revenueMultiplier += 0.03;
    } else if (numberOfCompetitors <= 15) {
      revenueMultiplier -= 0.08;
    } else {
      revenueMultiplier -= 0.18;
    }
  }
  
  if (marketConcentration) {
    if (marketConcentration === "monopolio") {
      revenueMultiplier += 0.40;
    } else if (marketConcentration === "oligopolio") {
      revenueMultiplier += 0.15;
    } else if (marketConcentration === "concorrencia_monopolistica") {
      revenueMultiplier += 0.0;
    } else if (marketConcentration === "concorrencia_perfeita") {
      revenueMultiplier -= 0.25;
    }
  }
  
  if (competitorStrength) {
    if (competitorStrength === "fraca") {
      revenueMultiplier += 0.20;
    } else if (competitorStrength === "media") {
      revenueMultiplier += 0.03;
    } else if (competitorStrength === "forte") {
      revenueMultiplier -= 0.12;
    } else if (competitorStrength === "muito_forte") {
      revenueMultiplier -= 0.28;
    }
  }
  
  revenueMultiplier = Math.max(0.5, Math.min(revenueMultiplier, 2.0));
  
  const baseRevenue = budget * (overallScore / 100) * revenueMultiplier;
  
  const finalRevenue = baseRevenue * eventImpact;
  
  return finalRevenue;
}

function calculateMarketShare(
  revenue: number, 
  totalTeams: number,
  numberOfCompetitors?: number,
  marketConcentration?: string
): number {
  if (totalTeams === 0 || revenue === 0) return 0;
  
  let totalMarketPlayers = totalTeams;
  
  if (numberOfCompetitors !== undefined && numberOfCompetitors > 0) {
    totalMarketPlayers += numberOfCompetitors;
  } else {
    totalMarketPlayers += 5;
  }
  
  let baseShare = (1 / totalMarketPlayers) * 100;
  
  let concentrationMultiplier = 1.0;
  
  if (marketConcentration === "monopolio") {
    concentrationMultiplier = 2.5;
  } else if (marketConcentration === "oligopolio") {
    concentrationMultiplier = 1.5;
  } else if (marketConcentration === "concorrencia_monopolistica") {
    concentrationMultiplier = 1.0;
  } else if (marketConcentration === "concorrencia_perfeita") {
    concentrationMultiplier = 0.7;
  }
  
  const normalizedRevenue = Math.log1p(revenue);
  const revenueBonus = Math.min(normalizedRevenue / 15, 1.5);
  
  let finalShare = baseShare * concentrationMultiplier * revenueBonus;
  
  finalShare = Math.max(0.5, Math.min(finalShare, 45));
  
  return finalShare;
}

function calculateBrandPerception(productScore: number, priceScore: number, promotionScore: number): number {
  return (productScore * 0.4 + priceScore * 0.2 + promotionScore * 0.4);
}

function calculateCustomerSatisfaction(productScore: number, placeScore: number, priceScore: number): number {
  return (productScore * 0.5 + placeScore * 0.3 + priceScore * 0.2);
}

function calculateCustomerLoyalty(brandPerception: number, customerSatisfaction: number): number {
  return (brandPerception * 0.4 + customerSatisfaction * 0.6);
}

function calculateEstimatedCustomers(
  revenue: number,
  priceValue: number,
  marketShare: number,
  targetConsumers?: number
): number {
  if (priceValue === 0) return 0;
  
  const baseCustomers = revenue / priceValue;
  
  if (targetConsumers && targetConsumers > 0 && marketShare > 0) {
    const marketBasedCustomers = (targetConsumers * marketShare) / 100;
    return Math.min(baseCustomers, marketBasedCustomers);
  }
  
  return baseCustomers;
}

function calculateConversionRate(
  productScore: number,
  priceScore: number,
  placeScore: number,
  promotionScore: number,
  competitionLevel?: string
): number {
  let baseConversion = 1.5;
  
  const qualityFactor = (productScore / 100) * 2;
  const priceFactor = (priceScore / 100) * 1.5;
  const distributionFactor = (placeScore / 100) * 1.5;
  const promotionFactor = (promotionScore / 100) * 2;
  
  baseConversion += qualityFactor + priceFactor + distributionFactor + promotionFactor;
  
  if (competitionLevel === "alta") {
    baseConversion *= 0.65;
  } else if (competitionLevel === "media") {
    baseConversion *= 0.80;
  } else if (competitionLevel === "baixa") {
    baseConversion *= 1.15;
  }
  
  return Math.min(baseConversion, 8.5);
}

function calculateLTV(
  ticketMedio: number,
  customerLoyalty: number,
  customerSatisfaction: number
): number {
  const purchaseFrequency = 1.5 + (customerLoyalty / 100) * 4;
  
  const lifetimeMonths = 12 + (customerSatisfaction / 100) * 24;
  
  const ltv = ticketMedio * purchaseFrequency * (lifetimeMonths / 12);
  
  return ltv;
}

function calculateNPS(
  customerSatisfaction: number,
  customerLoyalty: number,
  brandPerception: number
): number {
  const combinedScore = (customerSatisfaction * 0.4 + customerLoyalty * 0.4 + brandPerception * 0.2);
  
  const promoters = Math.max(0, Math.min(100, combinedScore - 50)) * 2;
  const detractors = Math.max(0, Math.min(100, 50 - combinedScore)) * 2;
  
  const nps = promoters - detractors;
  
  return Math.max(-100, Math.min(100, nps));
}

function calculateAverageConversionTime(
  productScore: number,
  priceScore: number,
  priceValue: number,
  competitionLevel?: string
): number {
  let baseDays = 30;
  
  const complexityFactor = (productScore / 100) * 20;
  baseDays -= complexityFactor;
  
  if (priceValue > 150) {
    baseDays += 15;
  } else if (priceValue > 100) {
    baseDays += 8;
  } else if (priceValue < 50) {
    baseDays -= 10;
  }
  
  if (competitionLevel === "alta") {
    baseDays -= 5;
  } else if (competitionLevel === "baixa") {
    baseDays += 5;
  }
  
  const priceFactor = (priceScore / 100) * 5;
  baseDays -= priceFactor;
  
  return Math.max(5, Math.min(90, baseDays));
}

function calculateNetRevenue(grossRevenue: number): number {
  // Dedução fixa de 5% (impostos e custos de venda) sobre a receita bruta.
  //
  // Este cálculo já teve deduções adicionais condicionadas a promotionMix
  // conter "cupons_desconto", "promocoes_sazonais", "amostras_gratis" ou
  // "marketplaces" — resíduo de uma versão anterior do simulador. Hoje
  // promotionMix é preenchido só com os UUIDs reais das mídias do catálogo
  // (ver decisoes.tsx, que já filtra qualquer valor que não seja um ID de
  // mídia válido), então essas condições nunca eram satisfeitas e a
  // dedução extra nunca era aplicada. Removido para não sugerir um
  // comportamento que não existia.
  const deductionRate = 0.05;

  return grossRevenue * (1 - deductionRate);
}

function calculateContributionMargin(
  netRevenue: number,
  totalCosts: number
): number {
  if (netRevenue === 0) return 0;
  
  const variableCosts = totalCosts * 0.6;
  
  const contribution = netRevenue - variableCosts;
  const contributionMargin = (contribution / netRevenue) * 100;
  
  return contributionMargin;
}

interface StrategicAnalyses {
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  } | null;
  porter: {
    competitiveRivalry: number;
    supplierPower: number;
    buyerPower: number;
    threatOfSubstitutes: number;
    threatOfNewEntry: number;
    rivalryNotes?: string | null;
    supplierNotes?: string | null;
    buyerNotes?: string | null;
    substitutesNotes?: string | null;
    newEntryNotes?: string | null;
  } | null;
  bcg: {
    productName: string;
    marketGrowth: number;
    relativeMarketShare: number;
    quadrant: string;
  }[] | null;
  pestel: {
    political: string[];
    economic: string[];
    social: string[];
    technological: string[];
    environmental: string[];
    legal: string[];
  } | null;
  segmentation: {
    segmentType: string;
    demographic: string[];
    geographic: string[];
    psychographic: string[];
    behavioral: string[];
    firmographic: string[];
    buyingCenter: string[];
  }[] | null;
}

function recomputeDependentKPIs(
  kpis: ResultCoreMetrics,
  baseKPIs: ResultCoreMetrics,
  priceValue: number
): void {
  // Recalcular profit, margin, ROI (baseado em revenue e costs atuais)
  kpis.profit = kpis.revenue - kpis.costs;
  kpis.margin = kpis.revenue > 0 ? (kpis.profit / kpis.revenue) * 100 : 0;
  kpis.roi = kpis.costs > 0 ? ((kpis.profit / kpis.costs) * 100) : 0;
  kpis.receitaBruta = kpis.revenue;
  
  // Recalcular receita líquida mantendo proporção
  if (baseKPIs.revenue > 0) {
    const netRevenueProportion = baseKPIs.receitaLiquida / baseKPIs.revenue;
    kpis.receitaLiquida = kpis.revenue * netRevenueProportion;
  } else {
    kpis.receitaLiquida = kpis.revenue;
  }
  
  kpis.margemContribuicao = kpis.receitaLiquida > 0 ? 
    ((kpis.receitaLiquida - (kpis.costs * 0.6)) / kpis.receitaLiquida) * 100 : 0;
  
  // Recalcular KPIs de clientes do zero baseado em revenue ajustado
  const estimatedCustomers = priceValue > 0 ? kpis.revenue / priceValue : 0;
  kpis.ticketMedio = estimatedCustomers > 0 ? kpis.revenue / estimatedCustomers : 0;
  kpis.cac = estimatedCustomers > 0 ? kpis.costs / estimatedCustomers : 0;
  kpis.razaoLtvCac = kpis.cac > 0 ? kpis.ltv / kpis.cac : 0;
}

function applyROIClamp(
  kpis: ResultCoreMetrics,
  baseKPIs: ResultCoreMetrics,
  priceValue: number
): void {
  const maxROI = 70;  // 70% (em porcentagem, não decimal!)
  if (kpis.roi > maxROI) {
    // Ajustar costs para que profit = revenue - costs resulte em ROI = 70%
    // ROI = (profit / costs) * 100
    // ROI = ((revenue - costs) / costs) * 100
    // ROI/100 = revenue/costs - 1
    // costs_ajustado = revenue / (1 + ROI/100)
    kpis.costs = kpis.revenue / (1 + maxROI / 100);
    
    // Recalcular TODOS os KPIs dependentes de revenue/costs para manter consistência
    // recomputeDependentKPIs irá calcular profit = revenue - costs_ajustado
    // resultando em ROI = 70%
    recomputeDependentKPIs(kpis, baseKPIs, priceValue);
  }
}

export function applyStrategicImpacts(
  baseKPIs: ResultCoreMetrics,
  analyses: StrategicAnalyses,
  priceValue: number,
  teamBudget: number
): ResultCoreMetrics {
  let adjustedKPIs = { ...baseKPIs };
  
  let totalModifier = 1.0;
  let revenueModifier = 1.0;
  let costModifier = 1.0;
  
  // SWOT: Forças e Oportunidades melhoram percepção, satisfação e lealdade
  if (analyses.swot) {
    const strengthsCount = analyses.swot.strengths?.length || 0;
    const opportunitiesCount = analyses.swot.opportunities?.length || 0;
    const weaknessesCount = analyses.swot.weaknesses?.length || 0;
    const threatsCount = analyses.swot.threats?.length || 0;
    
    const positiveFactors = strengthsCount + opportunitiesCount;
    const negativeFactors = weaknessesCount + threatsCount;
    const totalFactors = positiveFactors + negativeFactors;
    
    if (totalFactors > 0) {
      const swotBalance = (positiveFactors - negativeFactors) / totalFactors;
      const swotModifier = Math.min(1 + (swotBalance * 0.04), 1.04);
      
      adjustedKPIs.brandPerception *= swotModifier;
      adjustedKPIs.customerSatisfaction *= swotModifier;
      adjustedKPIs.customerLoyalty *= swotModifier;
      
      totalModifier *= Math.min((1 + swotBalance * 0.015), 1.015);
    }
  }
  
  // Porter: Forças competitivas favoráveis aumentam marketShare e revenue
  if (analyses.porter) {
    const avgForce = (
      (10 - analyses.porter.competitiveRivalry) +
      (10 - analyses.porter.supplierPower) +
      (10 - analyses.porter.buyerPower) +
      (10 - analyses.porter.threatOfSubstitutes) +
      (10 - analyses.porter.threatOfNewEntry)
    ) / 5;
    
    const porterBoost = Math.min((avgForce - 5) / 180, 0.025);
    revenueModifier *= (1 + porterBoost);
    
    adjustedKPIs.marketShare *= (1 + porterBoost);
  }
  
  // BCG: Produtos em quadrantes favoráveis (Stars, Cash Cows) aumentam marketShare e reduzem costs
  //
  // Grupo A (auditoria de 2026-09) — item 2: os quadrantes são gravados em
  // português (client/src/pages/estrategia.tsx -> getQuadrant: "Estrela",
  // "Vaca Leiteira", "Ponto de Interrogação", "Abacaxi") e não há enum na
  // coluna "quadrant" (shared/schema.ts) que barre isso. A comparação abaixo
  // usava os nomes em inglês ("star"/"cash_cow"/"question_mark"), que nunca
  // batiam com o valor real gravado — bcgScore ficava sempre 0 e o BCG nunca
  // dava nenhum bônus de marketShare/custo, mesmo quando o professor
  // preenchia a matriz corretamente.
  if (analyses.bcg && Array.isArray(analyses.bcg) && analyses.bcg.length > 0) {
    let bcgScore = 0;

    for (const product of analyses.bcg) {
      if (product.quadrant === "Estrela") bcgScore += 2;
      else if (product.quadrant === "Vaca Leiteira") bcgScore += 1.5;
      else if (product.quadrant === "Ponto de Interrogação") bcgScore += 0.5;
    }
    
    const bcgBoost = Math.min(bcgScore / (analyses.bcg.length * 34), 0.035);
    costModifier *= (1 - bcgBoost);  // Reduz custos
    
    adjustedKPIs.marketShare *= (1 + bcgBoost);
  }
  
  // PESTEL: Análise completa do ambiente externo melhora brandPerception
  if (analyses.pestel) {
    const pestelFactorsCount = 
      (analyses.pestel.political?.length || 0) +
      (analyses.pestel.economic?.length || 0) +
      (analyses.pestel.social?.length || 0) +
      (analyses.pestel.technological?.length || 0) +
      (analyses.pestel.environmental?.length || 0) +
      (analyses.pestel.legal?.length || 0);
    
    if (pestelFactorsCount > 0) {
      const pestelModifier = Math.min(1 + (pestelFactorsCount / 200), 1.05);

      adjustedKPIs.brandPerception *= pestelModifier;
      adjustedKPIs.nps *= pestelModifier;

      totalModifier *= Math.min((1 + (pestelFactorsCount / 400)), 1.025);
    }
  }

  // Segmentação de Mercado: conhecer bem o segmento-alvo (riqueza de
  // critérios preenchidos, somando todas as linhas — b2c e/ou b2b, conforme
  // o tipo de negócio da turma) melhora a eficiência de conversão
  // (customerSatisfaction/marketShare), no mesmo espírito do bônus de
  // riqueza já dado a PESTEL acima.
  if (analyses.segmentation && analyses.segmentation.length > 0) {
    const segmentationFactorsCount = analyses.segmentation.reduce((sum, seg) =>
      sum +
      (seg.demographic?.length || 0) +
      (seg.geographic?.length || 0) +
      (seg.psychographic?.length || 0) +
      (seg.behavioral?.length || 0) +
      (seg.firmographic?.length || 0) +
      (seg.buyingCenter?.length || 0),
      0
    );

    if (segmentationFactorsCount > 0) {
      const segmentationModifier = Math.min(1 + (segmentationFactorsCount / 200), 1.05);

      adjustedKPIs.customerSatisfaction *= segmentationModifier;
      adjustedKPIs.marketShare *= segmentationModifier;

      totalModifier *= Math.min((1 + (segmentationFactorsCount / 400)), 1.025);
    }
  }

  // Aplicar modificadores de revenue e cost com caps globais
  const cappedRevenueModifier = Math.max(0.88, Math.min(revenueModifier, 1.08));
  const cappedCostModifier = Math.max(0.94, Math.min(costModifier, 1.06));
  
  adjustedKPIs.revenue *= cappedRevenueModifier;
  adjustedKPIs.costs *= cappedCostModifier;
  
  // Recalcular todos os KPIs dependentes de revenue/costs após aplicar modificadores
  recomputeDependentKPIs(adjustedKPIs, baseKPIs, priceValue);
  
  // Aplicar clamp de ROI
  applyROIClamp(adjustedKPIs, baseKPIs, priceValue);
  
  // Aplicar modificador total suave em LTV e recalcular razão LTV/CAC
  // Limitar boost cumulativo máximo a 15%
  const cappedTotalModifier = Math.max(0.85, Math.min(totalModifier, 1.15));
  
  if (cappedTotalModifier !== 1.0) {
    adjustedKPIs.ltv *= cappedTotalModifier;
    // Recalcular razão usando LTV ajustado e CAC final
    adjustedKPIs.razaoLtvCac = adjustedKPIs.cac > 0 ? adjustedKPIs.ltv / adjustedKPIs.cac : 0;
  }

  // Grupo A (auditoria de 2026-09) — item 1: recalcular a DRE e o Balanço
  // com o revenue/costs JÁ ajustados por SWOT/Porter/BCG/PESTEL, em vez de
  // devolver os valores de baseKPIs (de antes do ajuste) mais abaixo. Como
  // ainda não houve carregamento de patrimônio entre rodadas neste ponto
  // (isso só acontece depois, em applyEquityCarryover, sobre o KPI já
  // consolidado entre produtos), caixa/ativoTotal/lucrosAcumulados são
  // recalculados aqui com a mesma fórmula "isolada" de calculateResults
  // (lucrosAcumulados como resíduo que fecha a equação patrimonial) — o
  // valor final e correto (com histórico real) é sobrescrito depois.
  const stmt = deriveAccountingStatements(
    adjustedKPIs.receitaBruta,
    adjustedKPIs.receitaLiquida,
    adjustedKPIs.costs,
    teamBudget
  );
  Object.assign(adjustedKPIs, stmt);
  adjustedKPIs.caixa = stmt.lucroLiquido;
  adjustedKPIs.ativoCirculante = adjustedKPIs.caixa + stmt.contasReceber + stmt.estoques;
  adjustedKPIs.ativoTotal = adjustedKPIs.ativoCirculante + stmt.ativoNaoCirculante;
  adjustedKPIs.capitalSocial = teamBudget * 0.50;
  adjustedKPIs.lucrosAcumulados = adjustedKPIs.ativoTotal - stmt.passivoCirculante - stmt.passivoNaoCirculante - adjustedKPIs.capitalSocial;
  adjustedKPIs.patrimonioLiquido = adjustedKPIs.capitalSocial + adjustedKPIs.lucrosAcumulados;
  adjustedKPIs.passivoPlTotal = stmt.passivoCirculante + stmt.passivoNaoCirculante + adjustedKPIs.patrimonioLiquido;

  // Arredondar todos os valores incluindo DRE e Balanço
  return {
    revenue: Math.round(adjustedKPIs.revenue * 100) / 100,
    costs: Math.round(adjustedKPIs.costs * 100) / 100,
    profit: Math.round(adjustedKPIs.profit * 100) / 100,
    margin: Math.round(adjustedKPIs.margin * 100) / 100,
    marketShare: Math.round(adjustedKPIs.marketShare * 100) / 100,
    roi: Math.round(adjustedKPIs.roi * 100) / 100,
    brandPerception: Math.round(Math.min(adjustedKPIs.brandPerception, 100) * 100) / 100,
    customerSatisfaction: Math.round(Math.min(adjustedKPIs.customerSatisfaction, 100) * 100) / 100,
    customerLoyalty: Math.round(Math.min(adjustedKPIs.customerLoyalty, 100) * 100) / 100,
    cac: Math.round(adjustedKPIs.cac * 100) / 100,
    ltv: Math.round(adjustedKPIs.ltv * 100) / 100,
    taxaConversao: Math.round(adjustedKPIs.taxaConversao * 100) / 100,
    ticketMedio: Math.round(adjustedKPIs.ticketMedio * 100) / 100,
    razaoLtvCac: Math.round(adjustedKPIs.razaoLtvCac * 100) / 100,
    nps: Math.round(Math.max(-100, Math.min(100, adjustedKPIs.nps)) * 100) / 100,
    tempoMedioConversao: Math.round(adjustedKPIs.tempoMedioConversao * 100) / 100,
    margemContribuicao: Math.round(adjustedKPIs.margemContribuicao * 100) / 100,
    receitaBruta: Math.round(adjustedKPIs.receitaBruta * 100) / 100,
    receitaLiquida: Math.round(adjustedKPIs.receitaLiquida * 100) / 100,
    impostos: Math.round((adjustedKPIs.impostos ?? 0) * 100) / 100,
    devolucoes: Math.round((adjustedKPIs.devolucoes ?? 0) * 100) / 100,
    descontos: Math.round((adjustedKPIs.descontos ?? 0) * 100) / 100,
    cpv: Math.round((adjustedKPIs.cpv ?? 0) * 100) / 100,
    lucroBruto: Math.round((adjustedKPIs.lucroBruto ?? 0) * 100) / 100,
    despesasVendas: Math.round((adjustedKPIs.despesasVendas ?? 0) * 100) / 100,
    despesasAdmin: Math.round((adjustedKPIs.despesasAdmin ?? 0) * 100) / 100,
    despesasFinanc: Math.round((adjustedKPIs.despesasFinanc ?? 0) * 100) / 100,
    outrasDespesas: Math.round((adjustedKPIs.outrasDespesas ?? 0) * 100) / 100,
    ebitda: Math.round((adjustedKPIs.ebitda ?? 0) * 100) / 100,
    depreciacao: Math.round((adjustedKPIs.depreciacao ?? 0) * 100) / 100,
    lair: Math.round((adjustedKPIs.lair ?? 0) * 100) / 100,
    irCsll: Math.round((adjustedKPIs.irCsll ?? 0) * 100) / 100,
    lucroLiquido: Math.round((adjustedKPIs.lucroLiquido ?? 0) * 100) / 100,
    caixa: Math.round((adjustedKPIs.caixa ?? 0) * 100) / 100,
    contasReceber: Math.round((adjustedKPIs.contasReceber ?? 0) * 100) / 100,
    estoques: Math.round((adjustedKPIs.estoques ?? 0) * 100) / 100,
    ativoCirculante: Math.round((adjustedKPIs.ativoCirculante ?? 0) * 100) / 100,
    imobilizado: Math.round((adjustedKPIs.imobilizado ?? 0) * 100) / 100,
    intangivel: Math.round((adjustedKPIs.intangivel ?? 0) * 100) / 100,
    ativoNaoCirculante: Math.round((adjustedKPIs.ativoNaoCirculante ?? 0) * 100) / 100,
    ativoTotal: Math.round((adjustedKPIs.ativoTotal ?? 0) * 100) / 100,
    fornecedores: Math.round((adjustedKPIs.fornecedores ?? 0) * 100) / 100,
    obrigFiscais: Math.round((adjustedKPIs.obrigFiscais ?? 0) * 100) / 100,
    outrasObrig: Math.round((adjustedKPIs.outrasObrig ?? 0) * 100) / 100,
    passivoCirculante: Math.round((adjustedKPIs.passivoCirculante ?? 0) * 100) / 100,
    financiamentosLP: Math.round((adjustedKPIs.financiamentosLP ?? 0) * 100) / 100,
    passivoNaoCirculante: Math.round((adjustedKPIs.passivoNaoCirculante ?? 0) * 100) / 100,
    capitalSocial: Math.round((adjustedKPIs.capitalSocial ?? 0) * 100) / 100,
    lucrosAcumulados: Math.round((adjustedKPIs.lucrosAcumulados ?? 0) * 100) / 100,
    patrimonioLiquido: Math.round((adjustedKPIs.patrimonioLiquido ?? 0) * 100) / 100,
    passivoPlTotal: Math.round((adjustedKPIs.passivoPlTotal ?? 0) * 100) / 100,
  };
}

export function applyAlignmentPenalties(
  kpis: ResultCoreMetrics,
  marketingMix: MarketingMix,
  swot: any,
  porter: any,
  bcg: any,
  pestel: any,
  aiAssistanceLevel: number,
  priceValue: number,
  teamBudget: number,
  segmentation: any[] = [],
  businessType?: string | null
): { kpis: ResultCoreMetrics; alignmentScore: number; alignmentIssues: string[] } {
  // aiGeneratedPercentage da Segmentação: uma turma híbrida pode ter até 2
  // linhas (b2c e b2b) — usa a média entre as que existirem, mesmo espírito
  // das demais ferramentas (uma única % vinda de uma única linha).
  const segmentationAiPercentage = segmentation.length > 0
    ? segmentation.reduce((sum, s) => sum + (s.aiGeneratedPercentage || 0), 0) / segmentation.length
    : undefined;

  const alignment = calculateStrategicAlignment({
    swot: swot || null,
    porter: porter || null,
    bcg: bcg || null,
    pestel: pestel || null,
    segmentation: segmentation || [],
    businessType,
    marketingMix,
    aiAssistanceLevel,
    swotAiPercentage: swot?.aiGeneratedPercentage,
    porterAiPercentage: porter?.aiGeneratedPercentage,
    bcgAiPercentage: bcg?.aiGeneratedPercentage,
    pestelAiPercentage: pestel?.aiGeneratedPercentage,
    segmentationAiPercentage,
  });
  
  let penalizedKPIs = { ...kpis };
  
  penalizedKPIs.revenue *= (1 + alignment.kpiModifiers.revenueModifier);
  penalizedKPIs.marketShare *= (1 + alignment.kpiModifiers.marketShareModifier);
  
  recomputeDependentKPIs(penalizedKPIs, kpis, priceValue);
  
  penalizedKPIs.profit *= (1 + alignment.kpiModifiers.profitModifier);
  penalizedKPIs.margin = penalizedKPIs.revenue > 0 ? (penalizedKPIs.profit / penalizedKPIs.revenue) * 100 : 0;
  penalizedKPIs.roi = penalizedKPIs.costs > 0 ? ((penalizedKPIs.profit / penalizedKPIs.costs) * 100) : 0;
  
  // Aplicar clamp de ROI após alignment penalties
  applyROIClamp(penalizedKPIs, kpis, priceValue);

  // Grupo A (auditoria de 2026-09) — item 1: recalcular a DRE (e a parte do
  // Balanço que depende só de receita/custos, não de patrimônio acumulado)
  // com o revenue/costs finais, pós-alignment-penalties — antes, esses
  // campos eram devolvidos intactos com os valores de "kpis" (de antes do
  // penalty), deixando a DRE inconsistente com o revenue/costs realmente
  // salvos no resultado. NÃO mexe em caixa/ativoCirculante/ativoTotal/
  // capitalSocial/lucrosAcumulados/patrimonioLiquido/passivoPlTotal: esses
  // dependem do carregamento de patrimônio entre rodadas e continuam sendo
  // responsabilidade de applyEquityCarryover, que passou a ser chamado
  // DEPOIS desta função (ver roundCompletion.ts / routes.ts) — chamar
  // deriveAccountingStatements aqui e sobrescrever esses campos apagaria o
  // resultado correto do carryover.
  const stmt = deriveAccountingStatements(
    penalizedKPIs.receitaBruta,
    penalizedKPIs.receitaLiquida,
    penalizedKPIs.costs,
    teamBudget
  );
  Object.assign(penalizedKPIs, stmt);

  const roundedKPIs: ResultCoreMetrics = {
    revenue: Math.round(penalizedKPIs.revenue * 100) / 100,
    costs: Math.round(penalizedKPIs.costs * 100) / 100,
    profit: Math.round(penalizedKPIs.profit * 100) / 100,
    margin: Math.round(penalizedKPIs.margin * 100) / 100,
    marketShare: Math.round(penalizedKPIs.marketShare * 100) / 100,
    roi: Math.round(penalizedKPIs.roi * 100) / 100,
    brandPerception: Math.round(Math.min(penalizedKPIs.brandPerception, 100) * 100) / 100,
    customerSatisfaction: Math.round(Math.min(penalizedKPIs.customerSatisfaction, 100) * 100) / 100,
    customerLoyalty: Math.round(Math.min(penalizedKPIs.customerLoyalty, 100) * 100) / 100,
    cac: Math.round(penalizedKPIs.cac * 100) / 100,
    ltv: Math.round(penalizedKPIs.ltv * 100) / 100,
    taxaConversao: Math.round(penalizedKPIs.taxaConversao * 100) / 100,
    ticketMedio: Math.round(penalizedKPIs.ticketMedio * 100) / 100,
    razaoLtvCac: Math.round(penalizedKPIs.razaoLtvCac * 100) / 100,
    nps: Math.round(Math.max(-100, Math.min(100, penalizedKPIs.nps)) * 100) / 100,
    tempoMedioConversao: Math.round(penalizedKPIs.tempoMedioConversao * 100) / 100,
    margemContribuicao: Math.round(penalizedKPIs.margemContribuicao * 100) / 100,
    receitaBruta: Math.round(penalizedKPIs.receitaBruta * 100) / 100,
    receitaLiquida: Math.round(penalizedKPIs.receitaLiquida * 100) / 100,
    impostos: Math.round((penalizedKPIs.impostos ?? 0) * 100) / 100,
    devolucoes: Math.round((penalizedKPIs.devolucoes ?? 0) * 100) / 100,
    descontos: Math.round((penalizedKPIs.descontos ?? 0) * 100) / 100,
    cpv: Math.round((penalizedKPIs.cpv ?? 0) * 100) / 100,
    lucroBruto: Math.round((penalizedKPIs.lucroBruto ?? 0) * 100) / 100,
    despesasVendas: Math.round((penalizedKPIs.despesasVendas ?? 0) * 100) / 100,
    despesasAdmin: Math.round((penalizedKPIs.despesasAdmin ?? 0) * 100) / 100,
    despesasFinanc: Math.round((penalizedKPIs.despesasFinanc ?? 0) * 100) / 100,
    outrasDespesas: Math.round((penalizedKPIs.outrasDespesas ?? 0) * 100) / 100,
    ebitda: Math.round((penalizedKPIs.ebitda ?? 0) * 100) / 100,
    depreciacao: Math.round((penalizedKPIs.depreciacao ?? 0) * 100) / 100,
    lair: Math.round((penalizedKPIs.lair ?? 0) * 100) / 100,
    irCsll: Math.round((penalizedKPIs.irCsll ?? 0) * 100) / 100,
    lucroLiquido: Math.round((penalizedKPIs.lucroLiquido ?? 0) * 100) / 100,
    caixa: Math.round((penalizedKPIs.caixa ?? 0) * 100) / 100,
    contasReceber: Math.round((penalizedKPIs.contasReceber ?? 0) * 100) / 100,
    estoques: Math.round((penalizedKPIs.estoques ?? 0) * 100) / 100,
    ativoCirculante: Math.round((penalizedKPIs.ativoCirculante ?? 0) * 100) / 100,
    imobilizado: Math.round((penalizedKPIs.imobilizado ?? 0) * 100) / 100,
    intangivel: Math.round((penalizedKPIs.intangivel ?? 0) * 100) / 100,
    ativoNaoCirculante: Math.round((penalizedKPIs.ativoNaoCirculante ?? 0) * 100) / 100,
    ativoTotal: Math.round((penalizedKPIs.ativoTotal ?? 0) * 100) / 100,
    fornecedores: Math.round((penalizedKPIs.fornecedores ?? 0) * 100) / 100,
    obrigFiscais: Math.round((penalizedKPIs.obrigFiscais ?? 0) * 100) / 100,
    outrasObrig: Math.round((penalizedKPIs.outrasObrig ?? 0) * 100) / 100,
    passivoCirculante: Math.round((penalizedKPIs.passivoCirculante ?? 0) * 100) / 100,
    financiamentosLP: Math.round((penalizedKPIs.financiamentosLP ?? 0) * 100) / 100,
    passivoNaoCirculante: Math.round((penalizedKPIs.passivoNaoCirculante ?? 0) * 100) / 100,
    capitalSocial: Math.round((penalizedKPIs.capitalSocial ?? 0) * 100) / 100,
    lucrosAcumulados: Math.round((penalizedKPIs.lucrosAcumulados ?? 0) * 100) / 100,
    patrimonioLiquido: Math.round((penalizedKPIs.patrimonioLiquido ?? 0) * 100) / 100,
    passivoPlTotal: Math.round((penalizedKPIs.passivoPlTotal ?? 0) * 100) / 100,
  };
  
  return {
    kpis: roundedKPIs,
    alignmentScore: alignment.overallScore,
    alignmentIssues: alignment.penalties.map(p => p.description),
  };
}

export function calculateProductResults(inputs: CalculationInputs): ResultCoreMetrics {
  return calculateResults(inputs);
}

export interface ProductKPI {
  productId: string;
  productName: string;
  kpis: ResultCoreMetrics;
  budget: number;
}

export function calculateConsolidatedResults(productKPIs: ProductKPI[]): ResultCoreMetrics {
  if (productKPIs.length === 0) {
    return addAccountingDefaults({
      revenue: 0,
      costs: 0,
      profit: 0,
      margin: 0,
      marketShare: 0,
      roi: 0,
      brandPerception: 0,
      customerSatisfaction: 0,
      customerLoyalty: 0,
      cac: 0,
      ltv: 0,
      taxaConversao: 0,
      ticketMedio: 0,
      razaoLtvCac: 0,
      nps: 0,
      tempoMedioConversao: 0,
      margemContribuicao: 0,
      receitaBruta: 0,
      receitaLiquida: 0,
    });
  }

  const totalBudget = productKPIs.reduce((sum, p) => sum + p.budget, 0);
  const useEqualWeights = totalBudget <= 0;
  const equalWeight = 1 / productKPIs.length;
  
  const revenue = productKPIs.reduce((sum, p) => sum + p.kpis.revenue, 0);
  const costs = productKPIs.reduce((sum, p) => sum + p.kpis.costs, 0);
  const profit = revenue - costs;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  
  const marketShare = productKPIs.reduce((sum, p) => {
    const weight = useEqualWeights ? equalWeight : (p.budget / totalBudget);
    return sum + (p.kpis.marketShare * weight);
  }, 0);
  const roi = costs > 0 ? ((profit / costs) * 100) : 0;
  
  const brandPerception = productKPIs.reduce((sum, p) => {
    const weight = useEqualWeights ? equalWeight : (p.budget / totalBudget);
    return sum + (p.kpis.brandPerception * weight);
  }, 0);
  
  const customerSatisfaction = productKPIs.reduce((sum, p) => {
    const weight = useEqualWeights ? equalWeight : (p.budget / totalBudget);
    return sum + (p.kpis.customerSatisfaction * weight);
  }, 0);
  
  const customerLoyalty = productKPIs.reduce((sum, p) => {
    const weight = useEqualWeights ? equalWeight : (p.budget / totalBudget);
    return sum + (p.kpis.customerLoyalty * weight);
  }, 0);
  
  const totalCustomers = productKPIs.reduce((sum, p) => {
    const customers = p.kpis.ticketMedio > 0 ? p.kpis.revenue / p.kpis.ticketMedio : 0;
    return sum + customers;
  }, 0);
  
  const ticketMedio = totalCustomers > 0 ? revenue / totalCustomers : 0;
  const cac = totalCustomers > 0 ? costs / totalCustomers : 0;
  
  const taxaConversao = productKPIs.reduce((sum, p) => {
    const weight = useEqualWeights ? equalWeight : (p.budget / totalBudget);
    return sum + (p.kpis.taxaConversao * weight);
  }, 0);
  
  const ltv = productKPIs.reduce((sum, p) => {
    const weight = useEqualWeights ? equalWeight : (p.budget / totalBudget);
    return sum + (p.kpis.ltv * weight);
  }, 0);
  
  const razaoLtvCac = cac > 0 ? ltv / cac : 0;
  
  const nps = productKPIs.reduce((sum, p) => {
    const weight = useEqualWeights ? equalWeight : (p.budget / totalBudget);
    return sum + (p.kpis.nps * weight);
  }, 0);
  
  const tempoMedioConversao = productKPIs.reduce((sum, p) => {
    const weight = useEqualWeights ? equalWeight : (p.budget / totalBudget);
    return sum + (p.kpis.tempoMedioConversao * weight);
  }, 0);
  
  const receitaBruta = productKPIs.reduce((sum, p) => sum + p.kpis.receitaBruta, 0);
  const receitaLiquida = productKPIs.reduce((sum, p) => sum + p.kpis.receitaLiquida, 0);
  const margemContribuicao = receitaLiquida > 0 ? 
    ((receitaLiquida - (costs * 0.6)) / receitaLiquida) * 100 : 0;
  
  return addAccountingDefaults({
    revenue: Math.round(revenue * 100) / 100,
    costs: Math.round(costs * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    margin: Math.round(margin * 100) / 100,
    marketShare: Math.round(marketShare * 100) / 100,
    roi: Math.round(roi * 100) / 100,
    brandPerception: Math.round(Math.min(brandPerception, 100) * 100) / 100,
    customerSatisfaction: Math.round(Math.min(customerSatisfaction, 100) * 100) / 100,
    customerLoyalty: Math.round(Math.min(customerLoyalty, 100) * 100) / 100,
    cac: Math.round(cac * 100) / 100,
    ltv: Math.round(ltv * 100) / 100,
    taxaConversao: Math.round(taxaConversao * 100) / 100,
    ticketMedio: Math.round(ticketMedio * 100) / 100,
    razaoLtvCac: Math.round(razaoLtvCac * 100) / 100,
    nps: Math.round(Math.max(-100, Math.min(100, nps)) * 100) / 100,
    tempoMedioConversao: Math.round(tempoMedioConversao * 100) / 100,
    margemContribuicao: Math.round(margemContribuicao * 100) / 100,
    receitaBruta: Math.round(receitaBruta * 100) / 100,
    receitaLiquida: Math.round(receitaLiquida * 100) / 100,
  });
}
