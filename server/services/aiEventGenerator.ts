import OpenAI from "openai";
import { marketSectors, type MarketSector } from "../data/marketData";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface GeneratedEvent {
  type: "economic" | "technological" | "social" | "competitive" | "regulatory" | "environmental";
  title: string;
  description: string;
  impact: string;
  severity: "baixo" | "medio" | "alto";
  pestelCategory: string;
}

export interface EventGenerationParams {
  sectorId: string;
  productCategory?: string;
  businessType?: string;
  marketSize?: number;
  competitionLevel?: string;
  numberOfEvents?: number;
}

export async function generateMarketEvents(params: EventGenerationParams): Promise<GeneratedEvent[]> {
  const {
    sectorId,
    productCategory,
    businessType = "B2C",
    marketSize,
    competitionLevel,
    numberOfEvents = 5
  } = params;

  const sector = marketSectors.find(s => s.id === sectorId);
  if (!sector) {
    throw new Error(`Setor ${sectorId} não encontrado`);
  }

  const category = sector.categories.find(c => c.id === productCategory || c.name === productCategory);

  const prompt = buildPESTELPrompt(sector, category, businessType, marketSize, competitionLevel, numberOfEvents);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em análise de mercado e eventos econômicos do Brasil. Sua tarefa é gerar eventos de mercado realistas baseados em análise PESTEL (Político, Econômico, Social, Tecnológico, Ambiental, Legal) para simulações educacionais de marketing."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("Resposta vazia da IA");
    }

    const parsed = JSON.parse(response);
    return parsed.events || [];
  } catch (error) {
    console.error("Erro ao gerar eventos com IA:", error);
    throw new Error("Falha ao gerar eventos de mercado. Tente novamente.");
  }
}

function buildPESTELPrompt(
  sector: MarketSector,
  category: any,
  businessType: string,
  marketSize: number | undefined,
  competitionLevel: string | undefined,
  numberOfEvents: number
): string {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long' });

  return `Gere ${numberOfEvents} eventos de mercado realistas para uma simulação educacional de marketing no Brasil (${currentMonth} de ${currentYear}).

**Contexto do Mercado:**
- Setor: ${sector.name}
- Descrição: ${sector.description}
- Produto: ${category ? category.name : "Diversos produtos do setor"}
- Tipo de Negócio: ${businessType}
- Tamanho do Mercado: R$ ${sector.marketSize.toLocaleString('pt-BR')}
- Taxa de Crescimento: ${sector.growthRate}% ao ano
- Nível de Competição: ${competitionLevel || sector.competitionLevel}

**Tendências do Setor:**
${sector.trends.map((t, i) => `${i + 1}. ${t}`).join('\n')}

**Desafios:**
${sector.challenges.map((c, i) => `${i + 1}. ${c}`).join('\n')}

**Oportunidades:**
${sector.opportunities.map((o, i) => `${i + 1}. ${o}`).join('\n')}

**Instruções:**
1. Gere eventos realistas baseados em dados REAIS do mercado brasileiro atual
2. Cubra diferentes categorias PESTEL:
   - **Político**: Mudanças em políticas, regulamentações, impostos
   - **Econômico**: Inflação, câmbio, taxas de juros, PIB
   - **Social**: Tendências de consumo, demografia, comportamento
   - **Tecnológico**: Inovações, digitalização, novos canais
   - **Ambiental**: Sustentabilidade, mudanças climáticas, ESG
   - **Legal**: Novas leis, regulamentações setoriais

3. Cada evento deve ter:
   - type: uma das categorias ("economic", "technological", "social", "competitive", "regulatory", "environmental")
   - title: título curto e objetivo (máx. 80 caracteres)
   - description: descrição detalhada do evento e como ele afeta o mercado (150-250 caracteres)
   - impact: explicação clara do impacto nas decisões de marketing das equipes (100-150 caracteres)
   - severity: "baixo", "medio" ou "alto"
   - pestelCategory: categoria PESTEL por extenso ("Político", "Econômico", "Social", "Tecnológico", "Ambiental", "Legal")

4. Eventos devem ser variados em severidade (distribua entre baixo, médio e alto)
5. Use dados e tendências REAIS do mercado brasileiro de ${currentYear}
6. Seja específico e prático - os eventos devem influenciar decisões de preço, produto, praça e promoção

**Formato de Resposta (JSON):**
{
  "events": [
    {
      "type": "economic",
      "title": "string",
      "description": "string",
      "impact": "string",
      "severity": "baixo" | "medio" | "alto",
      "pestelCategory": "string"
    }
  ]
}`;
}
