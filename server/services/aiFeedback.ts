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
          content: `Você é um professor especialista em marketing e estratégia empresarial com ampla experiência em educação. Sua abordagem pedagógica é baseada no método socrático: você NÃO dá respostas diretas, mas faz perguntas provocativas que levam os alunos a refletirem e descobrirem as soluções por si mesmos.

**Seu papel:**
- Analisar decisões de marketing de equipes de estudantes do ensino médio
- Identificar acertos e erros nas estratégias aplicadas
- Fazer perguntas que estimulem pensamento crítico
- Sugerir literatura específica para aprofundamento
- Ser construtivo, encorajador e educacional

**Princípios pedagógicos:**
1. NUNCA diga diretamente "você deveria ter feito X"
2. SEMPRE faça perguntas como "Por que você escolheu Y? Quais outras opções considerou?"
3. Conecte decisões aos resultados de forma educativa
4. Use linguagem acessível para estudantes do ensino médio
5. Reforce aprendizados positivos e ajude a descobrir erros

**Abordagem de feedback:**
- Pontos fortes: Celebre acertos e explique POR QUE funcionou
- Pontos fracos: Apresente como oportunidades de aprendizado com perguntas reflexivas
- Sugestões: Oriente sem dar a resposta pronta, estimule a investigação
- Literatura: Sugira leituras específicas e acessíveis, explicando o que encontrarão`
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

  return `Analise as decisões de marketing desta equipe de estudantes do ensino médio e forneça feedback educacional construtivo.

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

${previousResults.length > 0 ? `**Evolução:**
${hasImprovement ? '✅ Lucro AUMENTOU em relação à rodada anterior' : '⚠️ Lucro DIMINUIU em relação à rodada anterior'}
- Rodada anterior: R$ ${previousResults[previousResults.length - 1].profit.toLocaleString('pt-BR')}
- Rodada atual: R$ ${result.profit.toLocaleString('pt-BR')}` : '**Primeira Rodada:** Esta é a primeira rodada da equipe.'}

**Sua Tarefa:**
Forneça uma análise educacional completa no formato JSON especificado. Lembre-se:
- Use método socrático (perguntas > respostas)
- Conecte decisões aos resultados
- Seja específico e construtivo
- Linguagem acessível para ensino médio

**Formato de Resposta (JSON obrigatório):**
{
  "overallAnalysis": "Análise geral da estratégia (2-3 parágrafos). Conecte as decisões aos resultados obtidos de forma educativa.",
  "strengths": [
    "Ponto forte 1 - Explique o acerto e por que funcionou",
    "Ponto forte 2 - Conecte à teoria de marketing (ex: precificação premium + qualidade alta)",
    "Ponto forte 3 - Celebre a decisão e o resultado positivo"
  ],
  "weaknesses": [
    "Oportunidade de melhoria 1 - Apresente como pergunta reflexiva (ex: 'Por que investir tanto em X quando Y estava em alta?')",
    "Oportunidade de melhoria 2 - Aponte o resultado negativo sem culpar",
    "Oportunidade de melhoria 3 - Sugira reflexão sobre alternativas"
  ],
  "suggestions": [
    "Sugestão 1 - Oriente sem dar resposta pronta (ex: 'Investigue como seus concorrentes estão precificando produtos similares')",
    "Sugestão 2 - Proponha experimento ou análise adicional",
    "Sugestão 3 - Conecte com ferramentas estratégicas disponíveis (SWOT, Porter, BCG, PESTEL)"
  ],
  "literatureRecommendations": [
    {
      "title": "Princípios de Marketing",
      "author": "Philip Kotler & Gary Armstrong",
      "chapter": "Capítulo específico relacionado ao tema (ex: 'Capítulo 10: Estratégias de Preço')",
      "reason": "Por que esta leitura ajudará (ex: 'Aprofunda estratégias de precificação baseadas em valor')"
    },
    {
      "title": "Estratégia Competitiva",
      "author": "Michael Porter",
      "chapter": "Capítulo ou conceito específico",
      "reason": "Como esta leitura complementa a análise"
    }
  ]
}

**Importante:**
- Máximo de 3-5 pontos em cada categoria
- Seja específico ao setor ${classData.sector || "do negócio"}
- Referencie os eventos de mercado quando relevante
- Sugira literatura em português quando possível`;
}
