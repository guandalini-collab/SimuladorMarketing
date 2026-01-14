interface SimulationBreakdown {
  priceEffect?: number;
  productEffect?: number;
  placeEffect?: number;
  promoEffect?: number;
  competitorEffect?: number;
  eventEffect?: number;
  baseRevenue?: number;
  baseMarketShare?: number;
  finalRevenue?: number;
  finalMarketShare?: number;
  explanations?: Record<string, string>;
}

interface CompetitorResponse {
  priceAdjustment?: number;
  promoIntensity?: number;
  reactionLevel?: 'passive' | 'moderate' | 'aggressive';
  explanation?: string;
}

interface EventImpact {
  eventType: string;
  eventTitle: string;
  revenueMultiplier?: number;
  costMultiplier?: number;
  demandMultiplier?: number;
  explanation?: string;
}

interface MarketingDecision {
  price?: number;
  promotionBudgets?: Record<string, number>;
  distributionChannels?: string[];
  productQuality?: string;
}

interface RoundResult {
  revenue: number;
  profit: number;
  margin: number;
  marketShare: number;
  roi: number;
  brandPerception: number;
  customerSatisfaction: number;
  costs: number;
}

interface FeedbackRecommendation {
  area: "Produto" | "Preço" | "Praça" | "Promoção";
  action: string;
  rationale: string;
  tradeoff: string;
}

interface GeneratedFeedback {
  summary: string;
  whatHappened: string[];
  whyItHappened: string[];
  recommendations: FeedbackRecommendation[];
  generatedAt: string;
  engineVersion: string;
}

interface FeedbackInput {
  previousResult?: RoundResult | null;
  currentResult: RoundResult;
  decisions?: MarketingDecision | null;
  simulationBreakdown?: SimulationBreakdown | null;
  competitorResponse?: CompetitorResponse | null;
  eventImpacts?: EventImpact[] | null;
  roundNumber: number;
  teamName?: string;
}

function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function analyzePerformanceChange(prev: RoundResult | null | undefined, curr: RoundResult): {
  revenueChange: number;
  profitChange: number;
  marginChange: number;
  marketShareChange: number;
  isFirstRound: boolean;
} {
  if (!prev) {
    return {
      revenueChange: 0,
      profitChange: 0,
      marginChange: 0,
      marketShareChange: 0,
      isFirstRound: true
    };
  }
  return {
    revenueChange: ((curr.revenue - prev.revenue) / Math.max(prev.revenue, 1)) * 100,
    profitChange: ((curr.profit - prev.profit) / Math.max(Math.abs(prev.profit), 1)) * 100,
    marginChange: curr.margin - prev.margin,
    marketShareChange: curr.marketShare - prev.marketShare,
    isFirstRound: false
  };
}

function generateWhatHappened(
  curr: RoundResult,
  changes: ReturnType<typeof analyzePerformanceChange>,
  roundNumber: number
): string[] {
  const bullets: string[] = [];
  
  if (changes.isFirstRound) {
    bullets.push(`Na Rodada ${roundNumber}, sua empresa gerou receita de ${formatCurrency(curr.revenue)}.`);
    if (curr.profit > 0) {
      bullets.push(`Lucro positivo de ${formatCurrency(curr.profit)}, com margem de ${formatPercent(curr.margin)}.`);
    } else {
      bullets.push(`Resultado com prejuízo de ${formatCurrency(Math.abs(curr.profit))}.`);
    }
    bullets.push(`Sua participação de mercado inicial foi de ${formatPercent(curr.marketShare)}.`);
  } else {
    if (changes.revenueChange > 5) {
      bullets.push(`Receita cresceu ${formatPercent(changes.revenueChange)} em relação à rodada anterior.`);
    } else if (changes.revenueChange < -5) {
      bullets.push(`Receita caiu ${formatPercent(Math.abs(changes.revenueChange))} em relação à rodada anterior.`);
    } else {
      bullets.push(`Receita estável em ${formatCurrency(curr.revenue)} (variação de ${formatPercent(changes.revenueChange)}).`);
    }

    if (curr.profit > 0 && changes.profitChange > 10) {
      bullets.push(`Lucro aumentou significativamente para ${formatCurrency(curr.profit)}.`);
    } else if (curr.profit < 0) {
      bullets.push(`Empresa operou com prejuízo de ${formatCurrency(Math.abs(curr.profit))}.`);
    } else if (changes.profitChange < -10) {
      bullets.push(`Lucro diminuiu para ${formatCurrency(curr.profit)}.`);
    }

    if (changes.marketShareChange > 2) {
      bullets.push(`Ganho de market share: agora com ${formatPercent(curr.marketShare)} do mercado.`);
    } else if (changes.marketShareChange < -2) {
      bullets.push(`Perda de market share: agora com ${formatPercent(curr.marketShare)} do mercado.`);
    }
  }

  if (curr.brandPerception > 70) {
    bullets.push(`Percepção de marca elevada (${formatPercent(curr.brandPerception)}).`);
  } else if (curr.brandPerception < 40) {
    bullets.push(`Percepção de marca baixa (${formatPercent(curr.brandPerception)}) - atenção necessária.`);
  }

  return bullets;
}

function generateWhyItHappened(
  breakdown: SimulationBreakdown | null | undefined,
  competitor: CompetitorResponse | null | undefined,
  events: EventImpact[] | null | undefined,
  changes: ReturnType<typeof analyzePerformanceChange>
): string[] {
  const bullets: string[] = [];

  if (breakdown) {
    const effects = [
      { name: 'Preço', value: breakdown.priceEffect ?? 0, key: 'priceEffect' },
      { name: 'Produto', value: breakdown.productEffect ?? 0, key: 'productEffect' },
      { name: 'Praça/Distribuição', value: breakdown.placeEffect ?? 0, key: 'placeEffect' },
      { name: 'Promoção', value: breakdown.promoEffect ?? 0, key: 'promoEffect' },
      { name: 'Concorrência', value: breakdown.competitorEffect ?? 0, key: 'competitorEffect' },
      { name: 'Eventos de Mercado', value: breakdown.eventEffect ?? 0, key: 'eventEffect' },
    ].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    const topEffects = effects.filter(e => Math.abs(e.value) > 0.02).slice(0, 3);

    for (const effect of topEffects) {
      const explanation = breakdown.explanations?.[effect.key];
      if (effect.value > 0.05) {
        bullets.push(`${effect.name} contribuiu positivamente (${formatPercent(effect.value * 100)}).${explanation ? ` ${explanation}` : ''}`);
      } else if (effect.value < -0.05) {
        bullets.push(`${effect.name} impactou negativamente (${formatPercent(effect.value * 100)}).${explanation ? ` ${explanation}` : ''}`);
      } else if (Math.abs(effect.value) > 0.02) {
        bullets.push(`${effect.name} teve impacto moderado (${formatPercent(effect.value * 100)}).`);
      }
    }

    if (bullets.length === 0) {
      bullets.push('Os efeitos dos 4Ps estiveram equilibrados nesta rodada.');
    }
  }

  if (competitor) {
    if (competitor.reactionLevel === 'aggressive') {
      bullets.push(`Concorrentes reagiram agressivamente${competitor.explanation ? `: ${competitor.explanation}` : ', pressionando sua participação de mercado.'}`);
    } else if (competitor.reactionLevel === 'moderate') {
      bullets.push('Concorrentes responderam com ajustes moderados de estratégia.');
    }
  }

  if (events && events.length > 0) {
    for (const event of events.slice(0, 2)) {
      if (event.revenueMultiplier && event.revenueMultiplier > 1.05) {
        bullets.push(`Evento "${event.eventTitle}" impulsionou a demanda.${event.explanation ? ` ${event.explanation}` : ''}`);
      } else if (event.revenueMultiplier && event.revenueMultiplier < 0.95) {
        bullets.push(`Evento "${event.eventTitle}" reduziu a demanda.${event.explanation ? ` ${event.explanation}` : ''}`);
      }
    }
  }

  if (bullets.length === 0) {
    if (changes.isFirstRound) {
      bullets.push('Este é o início da simulação. Os resultados refletem suas decisões iniciais de posicionamento.');
    } else {
      bullets.push('Os resultados refletem uma combinação equilibrada de fatores estratégicos e de mercado.');
    }
  }

  return bullets;
}

function generateRecommendations(
  breakdown: SimulationBreakdown | null | undefined,
  competitor: CompetitorResponse | null | undefined,
  events: EventImpact[] | null | undefined,
  curr: RoundResult,
  changes: ReturnType<typeof analyzePerformanceChange>
): FeedbackRecommendation[] {
  const recs: FeedbackRecommendation[] = [];

  if (breakdown) {
    if ((breakdown.priceEffect ?? 0) < -0.05) {
      recs.push({
        area: "Preço",
        action: "Revise sua estratégia de precificação",
        rationale: "O efeito preço foi negativo, indicando possível desalinhamento com o mercado ou elasticidade alta.",
        tradeoff: "Reduzir preço pode aumentar volume, mas diminui margem. Aumentar preço mantém margem, mas pode perder clientes."
      });
    } else if ((breakdown.priceEffect ?? 0) > 0.1 && curr.margin < 15) {
      recs.push({
        area: "Preço",
        action: "Considere aumentar o preço para melhorar margem",
        rationale: "Seu preço está gerando bom volume, mas a margem está baixa.",
        tradeoff: "Aumentar preço melhora margem, mas pode reduzir volume de vendas."
      });
    }

    if ((breakdown.promoEffect ?? 0) < 0.02 && curr.costs > curr.revenue * 0.5) {
      recs.push({
        area: "Promoção",
        action: "Redistribua seu investimento promocional",
        rationale: "O retorno promocional está baixo, indicando possível saturação ou canais ineficientes.",
        tradeoff: "Investir mais em promoção aumenta visibilidade, mas retornos decrescentes podem comprometer ROI."
      });
    } else if ((breakdown.promoEffect ?? 0) > 0.15) {
      recs.push({
        area: "Promoção",
        action: "Mantenha e otimize sua estratégia promocional",
        rationale: "A promoção está funcionando bem. Identifique os canais mais eficazes.",
        tradeoff: "Manter investimento alto garante visibilidade, mas monitor o ponto de saturação."
      });
    }

    if ((breakdown.placeEffect ?? 0) < -0.03) {
      recs.push({
        area: "Praça",
        action: "Reveja seus canais de distribuição",
        rationale: "A estratégia de praça está impactando negativamente os resultados.",
        tradeoff: "Expandir canais aumenta alcance, mas eleva custos logísticos e de gestão."
      });
    }

    if ((breakdown.productEffect ?? 0) < -0.03) {
      recs.push({
        area: "Produto",
        action: "Melhore a percepção de qualidade do produto",
        rationale: "O efeito produto está negativo, sugerindo necessidade de diferenciação.",
        tradeoff: "Investir em qualidade aumenta custos, mas pode justificar preço premium."
      });
    }
  }

  if (competitor && competitor.reactionLevel === 'aggressive') {
    if (!recs.find(r => r.area === 'Produto')) {
      recs.push({
        area: "Produto",
        action: "Diferencie seu produto para reduzir competição direta",
        rationale: "Concorrentes estão reagindo agressivamente. Diferenciação reduz comparação por preço.",
        tradeoff: "Diferenciação exige investimento, mas cria barreiras competitivas de longo prazo."
      });
    }
  }

  if (events && events.some(e => (e.demandMultiplier ?? 1) > 1.1)) {
    const positiveEvent = events.find(e => (e.demandMultiplier ?? 1) > 1.1);
    if (positiveEvent && !recs.find(r => r.area === 'Promoção')) {
      recs.push({
        area: "Promoção",
        action: `Aproveite a tendência positiva: "${positiveEvent.eventTitle}"`,
        rationale: "Há uma oportunidade de mercado que pode ser explorada com promoção direcionada.",
        tradeoff: "Investir na oportunidade pode trazer retorno alto, mas demanda agilidade e recursos."
      });
    }
  }

  if (curr.margin < 10 && !recs.find(r => r.area === 'Preço')) {
    recs.push({
      area: "Preço",
      action: "Aumente sua margem revisando custos ou preços",
      rationale: `Margem atual de ${formatPercent(curr.margin)} é baixa para sustentabilidade.`,
      tradeoff: "Aumentar preço melhora margem, mas pode perder volume. Reduzir custos mantém competitividade."
    });
  }

  if (curr.brandPerception < 40 && !recs.find(r => r.area === 'Produto')) {
    recs.push({
      area: "Produto",
      action: "Invista em qualidade e posicionamento de marca",
      rationale: `Percepção de marca baixa (${formatPercent(curr.brandPerception)}) limita potencial de preço e fidelização.`,
      tradeoff: "Investir em marca tem retorno de longo prazo, mas custos imediatos."
    });
  }

  if (recs.length === 0) {
    recs.push({
      area: "Produto",
      action: "Mantenha a estratégia e monitore o mercado",
      rationale: "Seus resultados estão equilibrados. Continue refinando para otimização.",
      tradeoff: "Estabilidade traz previsibilidade, mas crescimento exige experimentação."
    });
  }

  const uniqueAreas = new Set<string>();
  return recs.filter(r => {
    if (uniqueAreas.has(r.area)) return false;
    uniqueAreas.add(r.area);
    return true;
  }).slice(0, 4);
}

function generateSummary(
  curr: RoundResult,
  changes: ReturnType<typeof analyzePerformanceChange>,
  roundNumber: number,
  teamName?: string
): string {
  const team = teamName ? `A equipe ${teamName}` : 'Sua empresa';
  
  if (changes.isFirstRound) {
    if (curr.profit > 0) {
      return `${team} iniciou a simulação com resultado positivo na Rodada ${roundNumber}: lucro de ${formatCurrency(curr.profit)} e ${formatPercent(curr.marketShare)} de market share. Uma boa base para crescer.`;
    } else {
      return `${team} iniciou a Rodada ${roundNumber} com prejuízo de ${formatCurrency(Math.abs(curr.profit))}. Revise sua estratégia de preço e custos para virar o jogo.`;
    }
  }

  if (curr.profit > 0 && changes.profitChange > 10) {
    return `Excelente! ${team} cresceu ${formatPercent(changes.profitChange)} em lucro na Rodada ${roundNumber}. Sua estratégia está funcionando. Continue refinando.`;
  } else if (curr.profit > 0 && changes.profitChange < -10) {
    return `${team} manteve lucro de ${formatCurrency(curr.profit)} na Rodada ${roundNumber}, mas com queda de ${formatPercent(Math.abs(changes.profitChange))}. Atenção aos sinais de mercado.`;
  } else if (curr.profit < 0) {
    return `${team} fechou a Rodada ${roundNumber} com prejuízo de ${formatCurrency(Math.abs(curr.profit))}. É hora de repensar estratégia de preço, custos ou promoção.`;
  } else {
    return `${team} manteve desempenho estável na Rodada ${roundNumber} com lucro de ${formatCurrency(curr.profit)}. Busque oportunidades de crescimento.`;
  }
}

export function generateRoundFeedback(input: FeedbackInput): GeneratedFeedback {
  const {
    previousResult,
    currentResult,
    decisions,
    simulationBreakdown,
    competitorResponse,
    eventImpacts,
    roundNumber,
    teamName
  } = input;

  const changes = analyzePerformanceChange(previousResult, currentResult);

  const whatHappened = generateWhatHappened(currentResult, changes, roundNumber);
  const whyItHappened = generateWhyItHappened(simulationBreakdown, competitorResponse, eventImpacts, changes);
  const recommendations = generateRecommendations(simulationBreakdown, competitorResponse, eventImpacts, currentResult, changes);
  const summary = generateSummary(currentResult, changes, roundNumber, teamName);

  return {
    summary,
    whatHappened,
    whyItHappened,
    recommendations,
    generatedAt: new Date().toISOString(),
    engineVersion: simulationBreakdown ? 'v2_deterministic' : 'v1_deterministic'
  };
}

export function generateFallbackFeedback(
  currentResult: RoundResult,
  roundNumber: number,
  teamName?: string
): GeneratedFeedback {
  const changes = analyzePerformanceChange(null, currentResult);
  const whatHappened = generateWhatHappened(currentResult, changes, roundNumber);
  
  const whyItHappened = [
    'Este feedback foi gerado sem dados detalhados da simulação.',
    'Os resultados refletem a combinação de suas decisões de marketing.',
    currentResult.profit > 0 
      ? 'O lucro positivo indica boa adequação entre preço, produto e mercado.'
      : 'O prejuízo sugere necessidade de revisar custos ou estratégia de preço.'
  ];

  const recommendations: FeedbackRecommendation[] = [];
  
  if (currentResult.margin < 15) {
    recommendations.push({
      area: "Preço",
      action: "Revise sua estratégia de precificação para melhorar margem",
      rationale: `Margem de ${formatPercent(currentResult.margin)} está baixa.`,
      tradeoff: "Preço mais alto melhora margem, mas pode reduzir volume."
    });
  }

  if (currentResult.marketShare < 10) {
    recommendations.push({
      area: "Promoção",
      action: "Aumente investimento em promoção para ganhar visibilidade",
      rationale: `Market share de ${formatPercent(currentResult.marketShare)} indica baixa penetração.`,
      tradeoff: "Mais promoção aumenta custos, mas pode ampliar mercado."
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      area: "Produto",
      action: "Mantenha a estratégia atual e busque otimizações pontuais",
      rationale: "Resultados equilibrados sugerem estratégia adequada.",
      tradeoff: "Estabilidade versus crescimento: experimentar pode trazer ganhos."
    });
  }

  const summary = generateSummary(currentResult, changes, roundNumber, teamName);

  return {
    summary,
    whatHappened,
    whyItHappened,
    recommendations,
    generatedAt: new Date().toISOString(),
    engineVersion: 'fallback_deterministic'
  };
}

export type { GeneratedFeedback, FeedbackRecommendation, FeedbackInput };
