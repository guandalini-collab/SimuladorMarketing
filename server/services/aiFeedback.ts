import OpenAI from "openai";
import type { MarketingMix, Result, MarketEvent, Class, Team } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface FeedbackAnalysis {
  overallAnalysis: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  literatureRecommendations: Array<{
    title: string;
    author: string;
    chapter?: string;
    reason: string;
  }>;
}

export interface FeedbackGenerationParams {
  marketingMix: MarketingMix;
  result: Result;
  classData: Class;
  teamData: Team;
  marketEvents: MarketEvent[];
  previousResults?: Result[];
}

export async function generateFeedback(params: FeedbackGenerationParams): Promise<FeedbackAnalysis> {
  const {
    marketingMix,
    result,
    classData,
    teamData,
    marketEvents,
    previousResults = []
  } = params;

  // Validar que há dados suficientes para análise
  if (!marketingMix || !marketingMix.submittedAt) {
    throw new Error("Não há decisões de marketing mix submetidas para esta rodada. O feedback só pode ser gerado após a equipe enviar suas decisões e a rodada ser encerrada.");
  }

  if (!result || !result.calculatedAt) {
    throw new Error("Os resultados desta rodada ainda não foram calculados. O feedback só pode ser gerado após o encerramento da rodada.");
  }

  const prompt = buildFeedbackPrompt(
    marketingMix,
    result,
    classData,
    teamData,
    marketEvents,
    previousResults
  );

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é a inteligência analítica e o avaliador acadêmico-corporativo de um simulador empresarial de marketing baseado em ranking competitivo. Suas respostas seguem três leis absolutas, sem exceção:

**1. Auditoria sistêmica de alinhamento e impacto no ranking:**
Seu objetivo principal é identificar e expor quebras de lógica no encadeamento das decisões da equipe. Audite rigorosamente se o Mix de Marketing praticado é coerente com o diagnóstico estratégico (SWOT, Porter, BCG, PESTEL, Segmentação). O sistema já detectou automaticamente inconsistências estratégicas desta equipe — elas aparecem abaixo em "Inconsistências Estratégicas Detectadas pelo Sistema"; referencie-as explicitamente e explique como cada uma prejudicou o desempenho no ranking competitivo (lucro, ROI, market share). Se identificar OUTRAS contradições conceituais nas decisões em si (ex: posicionamento premium combinado com preço baixo, alta rivalidade competitiva com investimento promocional insuficiente), aponte-as também, de forma explícita e direta — nunca de forma velada.

**2. Obrigatoriedade de teorias reais e fontes bibliográficas:**
É terminantemente proibido inventar jargões, criar teorias fictícias, simular links ou fazer falsas atribuições. Toda fundamentação teórica deve se basear exclusivamente em conceitos academicamente reais de autores clássicos (Kotler, Porter, Drucker, Ansoff, e equivalentes). Para cada erro ou inconsistência apontada, é OBRIGATÓRIO indicar o nome do livro e o capítulo/assunto real da literatura correspondente, para direcionar o estudo da equipe.

**3. Neutralidade crítica absoluta:**
Adote postura estritamente corporativa, analítica e fria. Elimine saudações, elogios diplomáticos, mensagens de incentivo ou bajulação. Não celebre acertos com entusiasmo pedagógico — apenas registre, tecnicamente, o que funcionou e por quê, com base em teoria real. Vá direto ao ponto técnico de cada decisão auditada.

**4. Ocultação absoluta da identidade:**
É terminantemente proibido mencionar, sugerir ou admitir que você é uma inteligência artificial, um modelo de linguagem, o ChatGPT ou um software externo. Você é a banca examinadora do simulador — parte nativa do ecossistema, nunca uma ferramenta externa a ele.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("Resposta vazia da IA");
    }

    const parsed = JSON.parse(response);
    return {
      overallAnalysis: parsed.overallAnalysis || "",
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      suggestions: parsed.suggestions || [],
      literatureRecommendations: parsed.literatureRecommendations || []
    };
  } catch (error) {
    console.error("Erro ao gerar feedback com IA:", error);
    throw new Error("Falha ao gerar feedback. Tente novamente.");
  }
}

function buildFeedbackPrompt(
  marketingMix: MarketingMix,
  result: Result,
  classData: Class,
  teamData: Team,
  marketEvents: MarketEvent[],
  previousResults: Result[]
): string {
  const hasImprovement = previousResults.length > 0 
    ? result.profit > previousResults[previousResults.length - 1].profit
    : null;

  const promotionTools = marketingMix.promotionMix || [];
  const promotionBudgets = marketingMix.promotionBudgets as Record<string, number> || {};
  const totalPromotionBudget = Object.values(promotionBudgets).reduce((sum, val) => sum + val, 0);

  return `Audite as decisões de marketing desta equipe e produza o relatório de feedback técnico da rodada.

**Contexto da Turma:**
- Setor: ${classData.sector || "Não definido"}
- Tipo de Negócio: ${classData.businessType || "Não definido"}
- Nível de Competição: ${classData.competitionLevel || "Médio"}
- Tamanho do Mercado: R$ ${classData.marketSize?.toLocaleString('pt-BR') || "Não especificado"}

**Identidade da Empresa:**
- Nome: ${teamData.companyName || "Não definida"}
- Slogan: ${teamData.slogan || "Não definido"}
- Categoria de Produto: ${teamData.productCategory || "Não definida"}
- Público-Alvo: ${teamData.targetAudienceProfile || "Não definido"}

**Decisões Tomadas (4 Ps do Marketing):**

**PRODUTO:**
- Qualidade: ${marketingMix.productQuality}
- Features: ${marketingMix.productFeatures}
- Posicionamento de Marca: ${marketingMix.brandPositioning}

**PREÇO:**
- Estratégia: ${marketingMix.priceStrategy}
- Valor: R$ ${marketingMix.priceValue.toFixed(2)}

**PRAÇA (Distribuição):**
- Canais: ${marketingMix.distributionChannels.join(', ')}
- Cobertura: ${marketingMix.distributionCoverage}

**PROMOÇÃO:**
- Ferramentas Usadas: ${promotionTools.join(', ')}
- Orçamento por Ferramenta:
${Object.entries(promotionBudgets).map(([tool, value]) => `  - ${tool}: R$ ${value.toLocaleString('pt-BR')}`).join('\n')}
- Total Investido: R$ ${totalPromotionBudget.toLocaleString('pt-BR')}
- Custo Estimado Total: R$ ${marketingMix.estimatedCost.toLocaleString('pt-BR')}

**Resultados Obtidos (KPIs):**
- Receita: R$ ${result.revenue.toLocaleString('pt-BR')}
- Custos: R$ ${result.costs.toLocaleString('pt-BR')}
- Lucro: R$ ${result.profit.toLocaleString('pt-BR')}
- Margem: ${result.margin.toFixed(2)}%
- ROI: ${result.roi.toFixed(2)}%
- Market Share: ${result.marketShare.toFixed(2)}%
- Percepção de Marca: ${result.brandPerception.toFixed(0)}/100
- Satisfação do Cliente: ${result.customerSatisfaction.toFixed(0)}/100
- Lealdade do Cliente: ${result.customerLoyalty.toFixed(0)}/100
- NPS: ${result.nps.toFixed(0)} (-100 a +100)
- CAC (Custo de Aquisição): R$ ${result.cac.toFixed(2)}
- LTV (Lifetime Value): R$ ${result.ltv.toFixed(2)}
- Taxa de Conversão: ${result.taxaConversao.toFixed(2)}%
- Razão LTV/CAC: ${result.razaoLtvCac.toFixed(2)}

**Eventos de Mercado Ativos:**
${marketEvents.length > 0 ? marketEvents.map(e => `- [${e.severity.toUpperCase()}] ${e.title}: ${e.impact}`).join('\n') : '- Nenhum evento significativo'}

**Inconsistências Estratégicas Detectadas pelo Sistema (auditoria determinística de alinhamento SWOT/Porter/BCG/PESTEL/Segmentação):**
${result.alignmentScore !== null && result.alignmentScore !== undefined ? `- Score de Alinhamento Estratégico: ${result.alignmentScore.toFixed(1)}/100` : '- Score de Alinhamento Estratégico: não calculado para esta rodada'}
${result.alignmentIssues && result.alignmentIssues.length > 0 ? result.alignmentIssues.map(issue => `- ${issue}`).join('\n') : '- Nenhuma inconsistência detectada automaticamente pelo sistema nesta rodada'}

${previousResults.length > 0 ? `**Evolução:**
${hasImprovement ? '✅ Lucro AUMENTOU em relação à rodada anterior' : '⚠️ Lucro DIMINUIU em relação à rodada anterior'}
- Rodada anterior: R$ ${previousResults[previousResults.length - 1].profit.toLocaleString('pt-BR')}
- Rodada atual: R$ ${result.profit.toLocaleString('pt-BR')}` : '**Primeira Rodada:** Esta é a primeira rodada da equipe.'}

**Sua Tarefa:**
Produza o relatório de auditoria no formato JSON especificado. Lembre-se:
- Exponha quebras de lógica de forma explícita e direta (nunca por perguntas ou insinuação)
- Conecte cada decisão ao resultado obtido e, quando aplicável, à inconsistência estratégica já detectada pelo sistema
- Fundamente cada erro em teoria acadêmica real, com livro e capítulo/assunto
- Tom corporativo, analítico, frio — sem saudações, elogios ou incentivo

**Formato de Resposta (JSON obrigatório):**
{
  "overallAnalysis": "Análise técnica da estratégia (2-3 parágrafos). Conecte decisões, inconsistências detectadas e resultados, de forma direta e analítica.",
  "strengths": [
    "Ponto 1 - Registre o que funcionou e por que, com base em conceito teórico real",
    "Ponto 2 - Conecte à teoria de marketing (ex: precificação premium + qualidade alta, segundo Kotler)",
    "Ponto 3 - Decisão e resultado, sem tom de celebração"
  ],
  "weaknesses": [
    "Falha 1 - Aponte o erro explicitamente, citando a inconsistência estratégica detectada quando houver (ex: 'Posicionamento declarado como premium é incompatível com preço abaixo da média do setor')",
    "Falha 2 - Aponte o resultado negativo e sua causa direta",
    "Falha 3 - Exponha a contradição conceitual, se houver, sem suavizar"
  ],
  "suggestions": [
    "Sugestão 1 - Instrução direta e objetiva (ex: 'Ajustar o preço para compatibilidade com o posicionamento premium declarado')",
    "Sugestão 2 - Ação concreta a tomar na próxima rodada",
    "Sugestão 3 - Correção específica em relação às ferramentas estratégicas (SWOT, Porter, BCG, PESTEL, Segmentação)"
  ],
  "literatureRecommendations": [
    {
      "title": "Princípios de Marketing",
      "author": "Philip Kotler & Gary Armstrong",
      "chapter": "Capítulo real e específico relacionado ao erro apontado (ex: 'Capítulo 10: Estratégias de Preço')",
      "reason": "Relação direta entre o erro cometido e o conteúdo do capítulo"
    },
    {
      "title": "Estratégia Competitiva",
      "author": "Michael Porter",
      "chapter": "Capítulo ou conceito real específico",
      "reason": "Relação direta entre o erro cometido e o conceito"
    }
  ]
}

**Importante:**
- Máximo de 3-5 pontos em cada categoria
- Seja específico ao setor ${classData.sector || "do negócio"}
- Referencie os eventos de mercado e as inconsistências estratégicas detectadas quando relevante
- NUNCA invente teorias, autores, livros ou atribuições — use exclusivamente literatura acadêmica real
- Sugira literatura em português quando possível`;
}
