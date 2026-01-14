import type { Result } from "@shared/schema";

export type ResultCoreMetrics = Pick<Result, 
  'revenue' | 'costs' | 'profit' | 'margin' | 'marketShare' | 'roi' | 
  'brandPerception' | 'customerSatisfaction' | 'customerLoyalty' | 
  'cac' | 'ltv' | 'taxaConversao' | 'ticketMedio' | 'razaoLtvCac' | 
  'nps' | 'tempoMedioConversao' | 'margemContribuicao' | 
  'receitaBruta' | 'receitaLiquida' |
  'impostos' | 'devolucoes' | 'descontos' | 'cpv' | 'lucroBruto' |
  'despesasVendas' | 'despesasAdmin' | 'despesasFinanc' | 'outrasDespesas' |
  'ebitda' | 'depreciacao' | 'lair' | 'irCsll' | 'lucroLiquido' |
  'caixa' | 'contasReceber' | 'estoques' | 'ativoCirculante' |
  'imobilizado' | 'intangivel' | 'ativoNaoCirculante' | 'ativoTotal' |
  'fornecedores' | 'obrigFiscais' | 'outrasObrig' | 'passivoCirculante' |
  'financiamentosLP' | 'passivoNaoCirculante' | 'capitalSocial' |
  'lucrosAcumulados' | 'patrimonioLiquido' | 'passivoPlTotal'
>;

function safeDiv(numerator: number, denominator: number, fallback: number = 0): number {
  if (denominator === 0 || !isFinite(numerator) || !isFinite(denominator)) {
    return fallback;
  }
  return numerator / denominator;
}

function weightedAverage(values: number[], weights: number[], fallback: number = 0): number {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) {
    return fallback;
  }
  const weightedSum = values.reduce((sum, v, i) => sum + v * weights[i], 0);
  return weightedSum / totalWeight;
}

export function consolidateKpis(productKpisList: ResultCoreMetrics[]): ResultCoreMetrics {
  if (productKpisList.length === 0) {
    return getEmptyKpis();
  }

  if (productKpisList.length === 1) {
    return recalculateDerivedFields(productKpisList[0]);
  }

  const revenues = productKpisList.map(k => k.revenue || 0);
  const totalRevenue = revenues.reduce((sum, r) => sum + r, 0);

  const sumMonetary = (field: keyof ResultCoreMetrics) =>
    productKpisList.reduce((sum, k) => sum + ((k[field] as number) || 0), 0);

  const consolidatedRevenue = sumMonetary('revenue');
  const consolidatedCosts = sumMonetary('costs');
  const consolidatedProfit = sumMonetary('profit');
  const consolidatedReceitaBruta = sumMonetary('receitaBruta');
  const consolidatedReceitaLiquida = sumMonetary('receitaLiquida');
  const consolidatedImpostos = sumMonetary('impostos');
  const consolidatedDevolucoes = sumMonetary('devolucoes');
  const consolidatedDescontos = sumMonetary('descontos');
  const consolidatedCpv = sumMonetary('cpv');
  const consolidatedLucroBruto = sumMonetary('lucroBruto');
  const consolidatedDespesasVendas = sumMonetary('despesasVendas');
  const consolidatedDespesasAdmin = sumMonetary('despesasAdmin');
  const consolidatedDespesasFinanc = sumMonetary('despesasFinanc');
  const consolidatedOutrasDespesas = sumMonetary('outrasDespesas');
  const consolidatedEbitda = sumMonetary('ebitda');
  const consolidatedDepreciacao = sumMonetary('depreciacao');
  const consolidatedLair = sumMonetary('lair');
  const consolidatedIrCsll = sumMonetary('irCsll');
  const consolidatedLucroLiquido = sumMonetary('lucroLiquido');
  const consolidatedCaixa = sumMonetary('caixa');
  const consolidatedContasReceber = sumMonetary('contasReceber');
  const consolidatedEstoques = sumMonetary('estoques');
  const consolidatedImobilizado = sumMonetary('imobilizado');
  const consolidatedIntangivel = sumMonetary('intangivel');
  const consolidatedFornecedores = sumMonetary('fornecedores');
  const consolidatedObrigFiscais = sumMonetary('obrigFiscais');
  const consolidatedOutrasObrig = sumMonetary('outrasObrig');
  const consolidatedFinanciamentosLP = sumMonetary('financiamentosLP');
  const consolidatedCapitalSocial = sumMonetary('capitalSocial');
  const consolidatedLucrosAcumulados = sumMonetary('lucrosAcumulados');

  const weightedAvgByRevenue = (field: keyof ResultCoreMetrics, fallback?: number) => {
    const rawValues = productKpisList.map((k, idx) => ({ val: k[field] as number | undefined | null, rev: revenues[idx] }));
    const validEntries = rawValues.filter(entry => entry.val != null);
    
    if (validEntries.length === 0) {
      return fallback ?? 0;
    }
    
    const values = validEntries.map(e => e.val!);
    const weights = validEntries.map(e => e.rev);
    const simpleAvg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const actualFallback = fallback ?? simpleAvg;
    return weightedAverage(values, weights, actualFallback);
  };

  const consolidatedBrandPerception = weightedAvgByRevenue('brandPerception');
  const consolidatedCustomerSatisfaction = weightedAvgByRevenue('customerSatisfaction');
  const consolidatedCustomerLoyalty = weightedAvgByRevenue('customerLoyalty');
  const consolidatedMarketShare = weightedAvgByRevenue('marketShare');
  const consolidatedTaxaConversao = weightedAvgByRevenue('taxaConversao');
  const consolidatedTicketMedio = weightedAvgByRevenue('ticketMedio');
  const consolidatedNps = weightedAvgByRevenue('nps');
  const consolidatedTempoMedioConversao = weightedAvgByRevenue('tempoMedioConversao');
  const consolidatedCac = weightedAvgByRevenue('cac');
  const consolidatedLtv = weightedAvgByRevenue('ltv');

  const consolidatedMargin = safeDiv(consolidatedProfit, consolidatedRevenue, 0) * 100;
  const consolidatedRoi = safeDiv(consolidatedProfit, consolidatedCosts, 0) * 100;
  const consolidatedRazaoLtvCac = safeDiv(consolidatedLtv, consolidatedCac, 0);
  const consolidatedMargemContribuicao = weightedAvgByRevenue('margemContribuicao');

  const consolidatedAtivoCirculante = consolidatedCaixa + consolidatedContasReceber + consolidatedEstoques;
  const consolidatedAtivoNaoCirculante = consolidatedImobilizado + consolidatedIntangivel;
  const consolidatedAtivoTotal = consolidatedAtivoCirculante + consolidatedAtivoNaoCirculante;
  const consolidatedPassivoCirculante = consolidatedFornecedores + consolidatedObrigFiscais + consolidatedOutrasObrig;
  const consolidatedPassivoNaoCirculante = consolidatedFinanciamentosLP;
  const consolidatedPatrimonioLiquido = consolidatedCapitalSocial + consolidatedLucrosAcumulados;
  const consolidatedPassivoPlTotal = consolidatedPassivoCirculante + consolidatedPassivoNaoCirculante + consolidatedPatrimonioLiquido;

  return {
    revenue: consolidatedRevenue,
    costs: consolidatedCosts,
    profit: consolidatedProfit,
    margin: consolidatedMargin,
    marketShare: consolidatedMarketShare,
    roi: consolidatedRoi,
    brandPerception: consolidatedBrandPerception,
    customerSatisfaction: consolidatedCustomerSatisfaction,
    customerLoyalty: consolidatedCustomerLoyalty,
    cac: consolidatedCac,
    ltv: consolidatedLtv,
    taxaConversao: consolidatedTaxaConversao,
    ticketMedio: consolidatedTicketMedio,
    razaoLtvCac: consolidatedRazaoLtvCac,
    nps: consolidatedNps,
    tempoMedioConversao: consolidatedTempoMedioConversao,
    margemContribuicao: consolidatedMargemContribuicao,
    receitaBruta: consolidatedReceitaBruta,
    receitaLiquida: consolidatedReceitaLiquida,
    impostos: consolidatedImpostos,
    devolucoes: consolidatedDevolucoes,
    descontos: consolidatedDescontos,
    cpv: consolidatedCpv,
    lucroBruto: consolidatedLucroBruto,
    despesasVendas: consolidatedDespesasVendas,
    despesasAdmin: consolidatedDespesasAdmin,
    despesasFinanc: consolidatedDespesasFinanc,
    outrasDespesas: consolidatedOutrasDespesas,
    ebitda: consolidatedEbitda,
    depreciacao: consolidatedDepreciacao,
    lair: consolidatedLair,
    irCsll: consolidatedIrCsll,
    lucroLiquido: consolidatedLucroLiquido,
    caixa: consolidatedCaixa,
    contasReceber: consolidatedContasReceber,
    estoques: consolidatedEstoques,
    ativoCirculante: consolidatedAtivoCirculante,
    imobilizado: consolidatedImobilizado,
    intangivel: consolidatedIntangivel,
    ativoNaoCirculante: consolidatedAtivoNaoCirculante,
    ativoTotal: consolidatedAtivoTotal,
    fornecedores: consolidatedFornecedores,
    obrigFiscais: consolidatedObrigFiscais,
    outrasObrig: consolidatedOutrasObrig,
    passivoCirculante: consolidatedPassivoCirculante,
    financiamentosLP: consolidatedFinanciamentosLP,
    passivoNaoCirculante: consolidatedPassivoNaoCirculante,
    capitalSocial: consolidatedCapitalSocial,
    lucrosAcumulados: consolidatedLucrosAcumulados,
    patrimonioLiquido: consolidatedPatrimonioLiquido,
    passivoPlTotal: consolidatedPassivoPlTotal,
  };
}

function recalculateDerivedFields(kpis: ResultCoreMetrics): ResultCoreMetrics {
  const margin = safeDiv(kpis.profit, kpis.revenue, 0) * 100;
  const roi = safeDiv(kpis.profit, kpis.costs, 0) * 100;
  const razaoLtvCac = safeDiv(kpis.ltv, kpis.cac, 0);
  
  const ativoCirculante = (kpis.caixa || 0) + (kpis.contasReceber || 0) + (kpis.estoques || 0);
  const ativoNaoCirculante = (kpis.imobilizado || 0) + (kpis.intangivel || 0);
  const ativoTotal = ativoCirculante + ativoNaoCirculante;
  const passivoCirculante = (kpis.fornecedores || 0) + (kpis.obrigFiscais || 0) + (kpis.outrasObrig || 0);
  const passivoNaoCirculante = kpis.financiamentosLP || 0;
  const patrimonioLiquido = (kpis.capitalSocial || 0) + (kpis.lucrosAcumulados || 0);
  const passivoPlTotal = passivoCirculante + passivoNaoCirculante + patrimonioLiquido;

  return {
    ...kpis,
    margin,
    roi,
    razaoLtvCac,
    margemContribuicao: kpis.margemContribuicao ?? margin,
    ativoCirculante,
    ativoNaoCirculante,
    ativoTotal,
    passivoCirculante,
    passivoNaoCirculante,
    patrimonioLiquido,
    passivoPlTotal,
  };
}

function getEmptyKpis(): ResultCoreMetrics {
  return {
    revenue: 0,
    costs: 0,
    profit: 0,
    margin: 0,
    marketShare: 0,
    roi: 0,
    brandPerception: 50,
    customerSatisfaction: 50,
    customerLoyalty: 50,
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
    impostos: 0,
    devolucoes: 0,
    descontos: 0,
    cpv: 0,
    lucroBruto: 0,
    despesasVendas: 0,
    despesasAdmin: 0,
    despesasFinanc: 0,
    outrasDespesas: 0,
    ebitda: 0,
    depreciacao: 0,
    lair: 0,
    irCsll: 0,
    lucroLiquido: 0,
    caixa: 0,
    contasReceber: 0,
    estoques: 0,
    ativoCirculante: 0,
    imobilizado: 0,
    intangivel: 0,
    ativoNaoCirculante: 0,
    ativoTotal: 0,
    fornecedores: 0,
    obrigFiscais: 0,
    outrasObrig: 0,
    passivoCirculante: 0,
    financiamentosLP: 0,
    passivoNaoCirculante: 0,
    capitalSocial: 0,
    lucrosAcumulados: 0,
    patrimonioLiquido: 0,
    passivoPlTotal: 0,
  };
}
