import OpenAI from "openai";
import type { Result, Class, Team, MarketEvent } from "@shared/schema";
import { marketSectors } from "../data/marketData";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface StrategicRecommendation {
  priority: "alta" | "media" | "baixa";
  category: string;
  title: string;
  description: string;
  actionableSteps: string[];
  expectedImpact: string;
}

export interface RecommendationsGenerationParams {
  result: Result;
  classData: Class;
  teamData: Team;
  marketEvents: MarketEvent[];
  previousResults?: Result[];
}

export async function generateRecommendations(
  params: RecommendationsGenerationParams
): Promise<StrategicRecommendation[]> {
  const {
    result,
    classData,
    teamData,
    marketEvents,
    previousResults = []
  } = params;

  if (!result || !result.calculatedAt) {
    throw new Error("Os resultados desta rodada ainda não foram calculados.");
  }

  const sector = marketSectors.find(s => s.id === classData.sector);
  if (!sector) {
    throw new Error("Setor não encontrado");
  }

  const prompt = buildRecommendationsPrompt(
    result,
    classData,
    teamData,
    sector,
    marketEvents,
    previousResults
  );

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é um consultor de estratégia de marketing especializado em educação empresarial para estudantes do ensino médio. Sua missão é gerar recomendações estratégicas ACIONÁVEIS, EDUCACIONAIS e PRIORIZADAS.

**Seu papel:**
- Analisar KPIs e resultados de equipes estudantis
- Identificar as 3-5 oportunidades mais impactantes
- Fornecer recomendações claras e implementáveis
- Conectar teoria de marketing com prática
- Ser construtivo e motivador

**Princípios das recomendações:**
1. PRIORIZE por impacto (alta/media/baixa)
2. SEJA ESPECÍFICO: não diga "melhorar marketing", diga "aumentar investimento em redes sociais em 20%"
3. EXPLIQUE O PORQUÊ: conecte a recomendação aos dados observados
4. FORNEÇA PASSOS ACIONÁVEIS: liste 2-3 ações concretas
5. PROJETE IMPACTO: estime o resultado esperado

**Categorias válidas:**
- Lucratividade
- Eficiência
- Satisfação do Cliente
- Mercado
- Vendas
- Investimento
- Produto
- Precificação
- Distribuição
- Comunicação

**Linguagem:**
- Acessível para estudantes do ensino médio
- Profissional mas amigável
- Use termos de marketing mas explique quando necessário

**Formato de resposta:**
Retorne um JSON com array "recommendations", cada item contendo:
- priority: "alta" | "media" | "baixa"
- category: string (uma das categorias válidas acima)
- title: string (título curto e impactante, max 60 chars)
- description: string (explicação detalhada, 100-200 chars)
- actionableSteps: string[] (2-3 passos concretos)
- expectedImpact: string (resultado esperado, específico e mensurável)

Limite: máximo 5 recomendações, priorizadas por impacto.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("Resposta vazia da IA");
    }

    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch (parseError) {
      console.error("Erro ao fazer parse da resposta da IA:", parseError);
      throw new Error("Falha ao processar resposta da IA");
    }
    
    // Validar estrutura da resposta
    if (!parsed || !Array.isArray(parsed.recommendations)) {
      console.error("Resposta da IA em formato inválido:", parsed);
      throw new Error("Resposta da IA em formato inválido");
    }
    
    const recommendations = parsed.recommendations;

    // Validar e sanitizar cada recomendação - REJEITAR items inválidos
    const validatedRecs = recommendations.slice(0, 5)
      .filter((rec: any) => {
        // Rejeitar se campos obrigatórios estiverem ausentes
        if (!rec || typeof rec !== "object" || !rec.title || !rec.description) {
          return false;
        }
        
        // Rejeitar se priority ou category forem inválidos
        if (!["alta", "media", "baixa"].includes(rec.priority)) {
          console.warn(`Recomendação rejeitada: priority inválido '${rec.priority}'`);
          return false;
        }
        
        if (typeof rec.category !== "string" || rec.category.trim() === "") {
          console.warn(`Recomendação rejeitada: category inválido`);
          return false;
        }
        
        return true;
      })
      .map((rec: any) => ({
        priority: rec.priority,
        category: rec.category.substring(0, 50),
        title: rec.title.substring(0, 100),
        description: rec.description.substring(0, 500),
        actionableSteps: Array.isArray(rec.actionableSteps) 
          ? rec.actionableSteps.slice(0, 5).filter((s: any) => typeof s === "string").map((s: string) => s.substring(0, 200))
          : [],
        expectedImpact: typeof rec.expectedImpact === "string" ? rec.expectedImpact.substring(0, 300) : ""
      }));
    
    // Se todas as recomendações foram filtradas, lançar erro para fallback
    if (validatedRecs.length === 0) {
      throw new Error("Todas as recomendações da IA foram inválidas");
    }
    
    return validatedRecs;
  } catch (error) {
    console.error("Erro ao gerar recomendações com IA:", error);
    throw new Error("Falha ao gerar recomendações. Tente novamente.");
  }
}

function buildRecommendationsPrompt(
  result: Result,
  classData: Class,
  teamData: Team,
  sector: any,
  marketEvents: MarketEvent[],
  previousResults: Result[]
): string {
  const hasImprovement = previousResults.length > 0 
    ? result.profit > previousResults[previousResults.length - 1].profit
    : null;

  const trend = hasImprovement === true ? "crescimento" :
                hasImprovement === false ? "queda" : "primeira rodada";

  const recentEvents = marketEvents
    .slice(-3)
    .map(e => `- ${e.type}: ${e.title} (${e.severity})`)
    .join("\n");

  return `# CONTEXTO DA EQUIPE

**Equipe:** ${teamData.name}
**Setor:** ${sector.name}
**Empresa:** ${teamData.companyName || "Não definido"}
**Orçamento Atual:** R$ ${teamData.budget.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
**Tendência:** ${trend}

---

# RESULTADOS DA ÚLTIMA RODADA

## Financeiro
- **Receita:** R$ ${result.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- **Custos:** R$ ${result.costs.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- **Lucro:** R$ ${result.profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- **Margem:** ${result.margin.toFixed(1)}% (Benchmark setor: ${sector.averageMargin}%)
- **ROI:** ${result.roi.toFixed(1)}%

## Marketing & Vendas
- **Market Share:** ${result.marketShare.toFixed(1)}%
- **Percepção de Marca:** ${result.brandPerception.toFixed(0)}/100
- **Ticket Médio:** R$ ${result.ticketMedio.toFixed(2)}
- **Taxa de Conversão:** ${result.taxaConversao.toFixed(2)}%

## Cliente
- **Satisfação:** ${result.customerSatisfaction.toFixed(0)}/100
- **Lealdade:** ${result.customerLoyalty.toFixed(0)}/100
- **NPS:** ${result.nps.toFixed(0)}

## Eficiência
- **CAC:** R$ ${result.cac.toFixed(2)}
- **LTV:** R$ ${result.ltv.toFixed(2)}
- **Razão LTV/CAC:** ${result.razaoLtvCac.toFixed(2)} (Ideal: > 3)
- **Margem de Contribuição:** ${result.margemContribuicao.toFixed(1)}%

---

# CONTEXTO DO MERCADO

**Nível de Competição:** ${classData.competitionLevel || "média"}
**Força dos Concorrentes:** ${classData.competitorStrength || "média"}
**Tamanho do Mercado:** ${classData.marketSize ? (classData.marketSize / 1000000).toFixed(0) + "M consumidores" : "não definido"}

## Tendências do Setor
${sector.trends.map((t: string) => `- ${t}`).join("\n")}

## Desafios do Setor
${sector.challenges.map((c: string) => `- ${c}`).join("\n")}

## Oportunidades do Setor
${sector.opportunities.map((o: string) => `- ${o}`).join("\n")}

## Eventos de Mercado Recentes
${recentEvents || "Nenhum evento recente"}

---

# ANÁLISE DE PERFORMANCE

${previousResults.length > 0 ? `
## Evolução (${previousResults.length} rodadas anteriores)
- Lucro anterior: R$ ${previousResults[previousResults.length - 1].profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Variação de lucro: ${
  previousResults[previousResults.length - 1].profit !== 0
    ? ((result.profit - previousResults[previousResults.length - 1].profit) / Math.abs(previousResults[previousResults.length - 1].profit) * 100).toFixed(1) + "%"
    : result.profit > 0 ? "Saiu do zero para lucro positivo" : result.profit < 0 ? "Saiu do zero para prejuízo" : "Manteve em zero"
}
- Market share anterior: ${previousResults[previousResults.length - 1].marketShare.toFixed(1)}%
- Variação de market share: ${(result.marketShare - previousResults[previousResults.length - 1].marketShare).toFixed(1)}pp
` : "Esta é a primeira rodada da equipe."}

## Pontos de Atenção
${result.margin < sector.averageMargin * 0.8 ? "⚠️ Margem significativamente abaixo da média do setor" : ""}
${result.razaoLtvCac < 3 ? "⚠️ Razão LTV/CAC abaixo do ideal (< 3)" : ""}
${result.nps < 0 ? "⚠️ NPS negativo indica problemas sérios de satisfação" : ""}
${result.marketShare < 10 ? "⚠️ Market share muito baixo, necessita ações agressivas" : ""}
${result.roi < 20 ? "⚠️ ROI muito baixo, investimentos pouco efetivos" : ""}

---

# TAREFA

Com base nos dados acima, gere 3-5 recomendações estratégicas PRIORIZADAS e ACIONÁVEIS para a equipe. 

Considere:
1. Quais são os maiores problemas que precisam ser resolvidos URGENTEMENTE?
2. Quais oportunidades de crescimento são mais viáveis no curto prazo?
3. Como a equipe pode se diferenciar dos concorrentes?
4. Quais ações terão maior impacto nos KPIs mais críticos?

Retorne um JSON no formato especificado nas instruções do sistema.`;
}
