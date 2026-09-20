import type { SwotAnalysis, PorterAnalysis, BcgAnalysis, PestelAnalysis, MarketSegmentation, MarketingMix } from "@shared/schema";
import { calculateKPIModifiers } from "@shared/alignmentUtils";

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
  segmentationAlignment: AlignmentScore;
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
  // Segmentação de Mercado (5ª ferramenta, pedido do professor 2026-09):
  // lista porque uma turma híbrida pode ter até 2 linhas (uma "b2c" e uma
  // "b2b") — mesmo padrão de "bcg" ser array em vez de valor único.
  segmentation: MarketSegmentation[];
  businessType: string | null | undefined;
  marketingMix: MarketingMix;
  aiAssistanceLevel: number;
  swotAiPercentage?: number;
  porterAiPercentage?: number;
  bcgAiPercentage?: number;
  pestelAiPercentage?: number;
  segmentationAiPercentage?: number;
}

// Com 5 ferramentas estratégicas (SWOT, Porter, BCG, PESTEL, Segmentação),
// cada uma pesa igualmente 1/5 do bloco de análise (antes eram 4 ferramentas
// de 0.25 cada, somando 1.0 — mantém a mesma soma total agora com 5×0.2).
const TOOL_WEIGHT = 0.2;

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
    segmentation,
    businessType,
    marketingMix,
    aiAssistanceLevel,
    swotAiPercentage,
    porterAiPercentage,
    bcgAiPercentage,
    pestelAiPercentage,
    segmentationAiPercentage
  } = params;

  const completionScore = calculateCompletionScore(swot, porter, bcg, pestel, segmentation, businessType);

  const swotAlignment = analyzeSwotAlignment(swot, marketingMix);
  const porterAlignment = analyzePorterAlignment(porter, marketingMix);
  const bcgAlignment = analyzeBcgAlignment(bcg, marketingMix);
  const pestelAlignment = analyzePestelAlignment(pestel, marketingMix);
  const segmentationAlignment = analyzeSegmentationAlignment(segmentation, businessType, marketingMix);

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

  const segmentationAiPenalty = calculateAiContentPenalty(segmentationAiPercentage, "Segmentação de Mercado");
  if (segmentationAiPenalty.description) {
    aiPenalties.push({ description: segmentationAiPenalty.description, impact: segmentationAiPenalty.penalty });
  }

  const totalAiPenalty = swotAiPenalty.penalty + porterAiPenalty.penalty + bcgAiPenalty.penalty + pestelAiPenalty.penalty + segmentationAiPenalty.penalty;

  const overallScore = calculateOverallScore(
    completionScore,
    swotAlignment,
    porterAlignment,
    bcgAlignment,
    pestelAlignment,
    segmentationAlignment
  );

  const adjustedScore = Math.max(0, Math.min(100, overallScore + totalAiPenalty));

  const kpiModifiers = calculateKPIModifiers(adjustedScore);
  const alignmentPenalties = compilePenalties(swotAlignment, porterAlignment, bcgAlignment, pestelAlignment, segmentationAlignment, completionScore);
  const allPenalties = [...alignmentPenalties, ...aiPenalties];

  return {
    overallScore: adjustedScore,
    swotAlignment,
    porterAlignment,
    bcgAlignment,
    pestelAlignment,
    segmentationAlignment,
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
  pestel: PestelAnalysis | null,
  segmentation: MarketSegmentation[],
  businessType: string | null | undefined
): number {
  let completed = 0;
  let total = 5;

  if (swot && isSwotComplete(swot)) completed++;
  if (porter && isPorterComplete(porter)) completed++;
  if (bcg && isBcgComplete(bcg)) completed++;
  if (pestel && isPestelComplete(pestel)) completed++;
  if (isSegmentationComplete(segmentation, businessType)) completed++;

  return (completed / total) * 100;
}

// Turma "hibrido" precisa das duas linhas (b2c e b2b) completas; qualquer
// outro businessType (ou ausência de valor) precisa só da linha "b2c" —
// mesmo critério usado em routes.ts (isSegmentationComplete) para as
// validações obrigatórias de envio do mix de marketing.
function getRequiredSegmentTypes(businessType: string | null | undefined): Array<"b2c" | "b2b"> {
  if (businessType === "hibrido") return ["b2c", "b2b"];
  if (businessType === "b2b") return ["b2b"];
  return ["b2c"];
}

function isValidSegmentationArray(arr: string[] | null | undefined): boolean {
  if (!arr || arr.length < 1) return false;
  return arr.some(item => {
    const trimmed = item.trim();
    return trimmed.length > 5 && !trimmed.startsWith("[") && !trimmed.endsWith("]");
  });
}

function isSegmentationRowComplete(segmentation: MarketSegmentation): boolean {
  if (segmentation.segmentType === "b2b") {
    return (
      isValidSegmentationArray(segmentation.firmographic) &&
      isValidSegmentationArray(segmentation.geographic) &&
      isValidSegmentationArray(segmentation.behavioral) &&
      isValidSegmentationArray(segmentation.buyingCenter)
    );
  }
  return (
    isValidSegmentationArray(segmentation.demographic) &&
    isValidSegmentationArray(segmentation.geographic) &&
    isValidSegmentationArray(segmentation.psychographic) &&
    isValidSegmentationArray(segmentation.behavioral)
  );
}

function isSegmentationComplete(segmentation: MarketSegmentation[], businessType: string | null | undefined): boolean {
  return getRequiredSegmentTypes(businessType).every(type => {
    const row = segmentation.find(s => s.segmentType === type);
    return !!row && isSegmentationRowComplete(row);
  });
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
    return { score: 0, issues: ["Análise SWOT não realizada"], weight: TOOL_WEIGHT };
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
  return { score, issues, weight: TOOL_WEIGHT };
}

function analyzePorterAlignment(porter: PorterAnalysis | null, mix: MarketingMix): AlignmentScore {
  const issues: string[] = [];
  let alignmentPoints = 100;

  if (!porter) {
    return { score: 0, issues: ["Análise Porter não realizada"], weight: TOOL_WEIGHT };
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

  if (porter.buyerPower >= 8 && mix.priceStrategy === "skimming") {
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
  return { score, issues, weight: TOOL_WEIGHT };
}

function analyzeBcgAlignment(bcg: BcgAnalysis | null, mix: MarketingMix): AlignmentScore {
  const issues: string[] = [];
  let alignmentPoints = 100;

  if (!bcg) {
    return { score: 0, issues: ["Análise BCG não realizada"], weight: TOOL_WEIGHT };
  }

  if (!isBcgComplete(bcg)) {
    issues.push("Análise BCG incompleta");
    alignmentPoints -= 30;
  }

  const totalInvestment = getTotalPromotion(mix);

  // Grupo A (auditoria de 2026-09) — item 2: bcg.quadrant é gravado em
  // português (client/src/pages/estrategia.tsx -> getQuadrant: "Estrela",
  // "Vaca Leiteira", "Ponto de Interrogação", "Abacaxi"), não em inglês —
  // as comparações abaixo nunca batiam, então nenhuma dessas penalidades
  // de alinhamento era aplicada.
  if (bcg.quadrant === "Estrela" && totalInvestment < 20000) {
    issues.push("Produto classificado como ESTRELA requer alto investimento para manter crescimento");
    alignmentPoints -= 25;
  }

  if (bcg.quadrant === "Vaca Leiteira" && totalInvestment > 25000) {
    issues.push("Produto VACA LEITEIRA não justifica investimento tão alto");
    alignmentPoints -= 15;
  }

  if (bcg.quadrant === "Ponto de Interrogação" && totalInvestment < 15000) {
    issues.push("Produto INTERROGAÇÃO precisa de investimento para se tornar Estrela");
    alignmentPoints -= 20;
  }

  if (bcg.quadrant === "Abacaxi" && totalInvestment > 10000) {
    issues.push("Produto ABACAXI tem baixo potencial, investimento deveria ser mínimo");
    alignmentPoints -= 18;
  }

  if (bcg.quadrant === "Vaca Leiteira" && mix.priceStrategy === "penetracao") {
    issues.push("VACA LEITEIRA deveria maximizar lucros, não penetração de mercado");
    alignmentPoints -= 15;
  }

  if (bcg.quadrant === "Estrela" && mix.priceValue && mix.priceValue < 20) {
    issues.push("ESTRELA permite preço premium devido ao crescimento e participação");
    alignmentPoints -= 12;
  }

  const score = Math.max(0, Math.min(100, alignmentPoints));
  return { score, issues, weight: TOOL_WEIGHT };
}

function analyzePestelAlignment(pestel: PestelAnalysis | null, mix: MarketingMix): AlignmentScore {
  const issues: string[] = [];
  let alignmentPoints = 100;

  if (!pestel) {
    return { score: 0, issues: ["Análise PESTEL não realizada"], weight: TOOL_WEIGHT };
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

  // Grupo A (auditoria de 2026-09) — item 3: o catálogo real de canais
  // (client/src/pages/decisoes.tsx) usa os values "varejo", "ecommerce"
  // (sem hífen), "marketplace", "atacado", "franquias", "direto" — nenhum
  // deles contém "online", "e-commerce" (com hífen) ou "digital", então só
  // "marketplace" acionava esta checagem antes.
  const hasDigitalChannel = mix.distributionChannels.some(channel =>
    channel.toLowerCase() === "ecommerce" ||
    channel.toLowerCase() === "marketplace"
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

  if (hasSocialChange && mix.promotionIntensity === "alto") {
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
  return { score, issues, weight: TOOL_WEIGHT };
}

// Segmentação de Mercado x Mix de Marketing: mesma lógica das outras 4
// ferramentas — a equipe é penalizada quando o segmento-alvo que ela mesma
// declarou não bate com o que está de fato praticando no mix (preço,
// canais). Os critérios de B2C (demographic/psychographic/behavioral) só
// são checados se a equipe tiver uma linha "b2c"; os de B2B
// (firmographic/buyingCenter) só se tiver uma linha "b2b" — turma híbrida
// checa as duas.
function analyzeSegmentationAlignment(
  segmentation: MarketSegmentation[],
  businessType: string | null | undefined,
  mix: MarketingMix
): AlignmentScore {
  const issues: string[] = [];
  let alignmentPoints = 100;

  const requiredTypes = getRequiredSegmentTypes(businessType);
  const b2c = segmentation.find(s => s.segmentType === "b2c");
  const b2b = segmentation.find(s => s.segmentType === "b2b");

  if (segmentation.length === 0) {
    return { score: 0, issues: ["Segmentação de Mercado não realizada"], weight: TOOL_WEIGHT };
  }

  if (!isSegmentationComplete(segmentation, businessType)) {
    issues.push("Segmentação de Mercado incompleta");
    alignmentPoints -= 30;
  }

  const matchesKeyword = (arr: string[] | null | undefined, keywords: string[]): boolean =>
    !!arr && arr.some(item => keywords.some(kw => item.toLowerCase().includes(kw)));

  const hasDigitalChannel = mix.distributionChannels.some(channel =>
    channel.toLowerCase() === "ecommerce" ||
    channel.toLowerCase() === "marketplace"
  );
  const hasHighTouchChannel = mix.distributionChannels.some(channel =>
    channel.toLowerCase() === "direto" ||
    channel.toLowerCase() === "franquias"
  );

  if (requiredTypes.includes("b2c") && b2c) {
    const hasPremiumSegment = matchesKeyword(b2c.demographic, ["alta renda", "classe a", "alto padrão", "premium"]) ||
      matchesKeyword(b2c.psychographic, ["premium", "sofisticado", "exclusividade"]);
    const hasPopularSegment = matchesKeyword(b2c.demographic, ["classe c", "classe d", "baixa renda", "popular"]) ||
      matchesKeyword(b2c.behavioral, ["econômico", "sensível a preço", "promoção"]);
    const hasDigitalBehavior = matchesKeyword(b2c.behavioral, ["digital", "online", "redes sociais", "aplicativo"]) ||
      matchesKeyword(b2c.psychographic, ["digital", "conectado"]);

    if (hasPremiumSegment && mix.priceValue && mix.priceValue < 15) {
      issues.push("Segmentação B2C indica público de alta renda/premium, mas o preço está muito baixo");
      alignmentPoints -= 18;
    }

    if (hasPopularSegment && mix.priceValue && mix.priceValue > 30) {
      issues.push("Segmentação B2C indica público de menor renda/popular, mas o preço está alto");
      alignmentPoints -= 18;
    }

    if (hasDigitalBehavior && !hasDigitalChannel) {
      issues.push("Segmentação B2C indica consumidor digital, mas os canais de venda são majoritariamente tradicionais");
      alignmentPoints -= 15;
    }
  }

  if (requiredTypes.includes("b2b") && b2b) {
    const hasEnterpriseSegment = matchesKeyword(b2b.firmographic, ["grande porte", "grandes empresas", "corporaç", "multinacional", "enterprise"]);
    const hasSmallBusinessSegment = matchesKeyword(b2b.firmographic, ["pequeno porte", "pequenas empresas", "mei", "microempresa"]);
    const hasLongBuyingCycle = matchesKeyword(b2b.buyingCenter, ["comitê", "comite", "decisão longa", "múltiplos decisores", "multiplos decisores"]);

    if (hasEnterpriseSegment && !hasHighTouchChannel) {
      issues.push("Segmentação B2B indica clientes de grande porte, mas os canais praticados são de venda em massa (varejo/e-commerce), sem canal direto/relacionamento");
      alignmentPoints -= 18;
    }

    if (hasSmallBusinessSegment && getTotalPromotion(mix) > 25000) {
      issues.push("Segmentação B2B indica pequenas empresas como público-alvo, mas o investimento promocional está desproporcional a esse ticket");
      alignmentPoints -= 12;
    }

    if (hasLongBuyingCycle && mix.priceStrategy === "penetracao") {
      issues.push("Segmentação B2B indica ciclo de decisão longo (comitê de compras), pouco compatível com estratégia de penetração por preço baixo");
      alignmentPoints -= 15;
    }
  }

  const score = Math.max(0, Math.min(100, alignmentPoints));
  return { score, issues, weight: TOOL_WEIGHT };
}

function calculateOverallScore(
  completionScore: number,
  swot: AlignmentScore,
  porter: AlignmentScore,
  bcg: AlignmentScore,
  pestel: AlignmentScore,
  segmentation: AlignmentScore
): number {
  const completionWeight = 0.3;
  const analysisWeight = 0.7;

  const weightedAnalysisScore = (
    swot.score * swot.weight +
    porter.score * porter.weight +
    bcg.score * bcg.weight +
    pestel.score * pestel.weight +
    segmentation.score * segmentation.weight
  );

  const overallScore = (completionScore * completionWeight) + (weightedAnalysisScore * analysisWeight);

  return Math.round(Math.max(0, Math.min(100, overallScore)));
}

// Inconsistência de auditoria (2026-09, segunda rodada): esta função vivia só
// aqui, e o card de alinhamento no frontend (alignment-score-card.tsx)
// reimplementava as mesmas faixas/percentuais de forma independente e
// divergente. Movida para shared/alignmentUtils.ts (calculateKPIModifiers)
// para que os dois lados usem sempre a mesma tabela.

function compilePenalties(
  swot: AlignmentScore,
  porter: AlignmentScore,
  bcg: AlignmentScore,
  pestel: AlignmentScore,
  segmentation: AlignmentScore,
  completionScore: number
): Array<{ description: string; impact: number }> {
  const penalties: Array<{ description: string; impact: number }> = [];

  if (completionScore < 100) {
    // 5 ferramentas agora (SWOT, Porter, BCG, PESTEL, Segmentação) — cada
    // uma ausente representa 20 pontos de completionScore, não mais 25.
    const missingAnalyses = Math.round((100 - completionScore) / 20);
    penalties.push({
      description: `${missingAnalyses} análise(s) estratégica(s) não concluída(s) - penalização de -10%`,
      impact: -10,
    });
  }

  [...swot.issues, ...porter.issues, ...bcg.issues, ...pestel.issues, ...segmentation.issues].forEach(issue => {
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
  segmentation: MarketSegmentation[];
  businessType: string | null | undefined;
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
    segmentation: params.segmentation,
    businessType: params.businessType,
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
      swotAlignment: { score: 0, issues: ["Nenhum produto analisado"], weight: TOOL_WEIGHT },
      porterAlignment: { score: 0, issues: ["Nenhum produto analisado"], weight: TOOL_WEIGHT },
      bcgAlignment: { score: 0, issues: ["Nenhum produto analisado"], weight: TOOL_WEIGHT },
      pestelAlignment: { score: 0, issues: ["Nenhum produto analisado"], weight: TOOL_WEIGHT },
      segmentationAlignment: { score: 0, issues: ["Nenhum produto analisado"], weight: TOOL_WEIGHT },
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
    weight: TOOL_WEIGHT,
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
    weight: TOOL_WEIGHT,
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
    weight: TOOL_WEIGHT,
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
    weight: TOOL_WEIGHT,
  };

  const consolidatedSegmentation: AlignmentScore = {
    score: productAlignments.reduce((sum, p) => {
      const weight = useEqualWeights ? equalWeight : (p.budget / totalBudget);
      return sum + (p.alignment.segmentationAlignment.score * weight);
    }, 0),
    issues: consolidateIssues(productAlignments.map(p => ({
      productName: p.productName,
      issues: p.alignment.segmentationAlignment.issues,
    }))),
    weight: TOOL_WEIGHT,
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
    segmentationAlignment: consolidatedSegmentation,
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
