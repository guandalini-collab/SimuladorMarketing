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
  // Pedido do professor (2026-09): a polaridade do evento (se ele favorece,
  // prejudica ou é neutro para o mercado) agora é decidida pela própria IA
  // a partir do conteúdo gerado, em vez de inferida rigidamente pelo "type"
  // (ver shared/schema.ts -> marketEvents.sentiment e calculateEventImpact
  // em calculator.ts / simulation/marketEngine.ts). A geração automática
  // por IA continua pausada até o professor liberar o uso de créditos da
  // API — este campo só fica pronto para quando isso acontecer.
  sentiment: "positivo" | "negativo" | "neutro";
}

// Grupo E (auditoria de 2026-09): a IA gera o campo "type" em inglês
// ("economic", "technological", ...), mas calculateEventImpact()
// (calculator.ts) compara com os valores em português usados pelo gerador
// determinístico de eventos (eventGenerator.ts: "economico", "tecnologico",
// "competitivo", "social", "regulatorio") — mesmo padrão do bug do quadrante
// BCG corrigido no Grupo A. Sem tradução, um evento gerado por IA nunca
// bate em nenhuma comparação (exceto "social", que coincide nas duas
// línguas), então nunca tem efeito numérico no resultado da equipe, embora
// apareça normalmente na tela (o rótulo em client/admin.tsx já reconhecia
// tanto o inglês quanto o português, então a tradução aqui não quebra a
// exibição — só garante que o efeito no cálculo passe a existir).
const EVENT_TYPE_PT: Record<GeneratedEvent["type"], string> = {
  economic: "economico",
  technological: "tecnologico",
  social: "social",
  competitive: "competitivo",
  regulatory: "regulatorio",
  environmental: "ambiental",
};

export function translateEventTypeToPt(type: string): string {
  return EVENT_TYPE_PT[type as GeneratedEvent["type"]] ?? type;
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

    // Grupo E (auditoria de 2026-09): antes, "parsed.events || []" confiava
    // cegamente no formato devolvido pela IA — um item sem "severity"
    // válido, ou o campo "events" vindo como algo que não é array, seguia
    // direto para storage.createMarketEvent (colunas NOT NULL em
    // market_events) e quebrava a rota com um erro de banco, em vez de uma
    // mensagem clara. Agora valida a forma de cada evento e descarta
    // silenciosamente (com log) só os que não têm o formato esperado,
    // devolvendo os demais normalmente.
    const rawEvents = Array.isArray(parsed?.events) ? parsed.events : [];
    const validEvents = rawEvents.filter(isValidGeneratedEvent);

    if (validEvents.length < rawEvents.length) {
      console.warn(
        `[AI_EVENT_GENERATOR] ${rawEvents.length - validEvents.length} de ${rawEvents.length} evento(s) descartado(s) por formato inválido na resposta da IA.`
      );
    }

    return validEvents;
  } catch (error) {
    console.error("Erro ao gerar eventos com IA:", error);
    throw new Error("Falha ao gerar eventos de mercado. Tente novamente.");
  }
}

const VALID_EVENT_TYPES = new Set<GeneratedEvent["type"]>([
  "economic", "technological", "social", "competitive", "regulatory", "environmental",
]);
const VALID_EVENT_SEVERITIES = new Set<GeneratedEvent["severity"]>(["baixo", "medio", "alto"]);
const VALID_EVENT_SENTIMENTS = new Set<GeneratedEvent["sentiment"]>(["positivo", "negativo", "neutro"]);
const REQUIRED_STRING_FIELDS: (keyof GeneratedEvent)[] = ["title", "description", "impact", "pestelCategory"];

export function isValidGeneratedEvent(event: any): event is GeneratedEvent {
  if (!event || typeof event !== "object") return false;
  if (!VALID_EVENT_TYPES.has(event.type)) return false;
  if (!VALID_EVENT_SEVERITIES.has(event.severity)) return false;
  if (!VALID_EVENT_SENTIMENTS.has(event.sentiment)) return false;
  return REQUIRED_STRING_FIELDS.every(
    (field) => typeof event[field] === "string" && event[field].trim().length > 0
  );
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
   - sentiment: "positivo", "negativo" ou "neutro" — decida pelo CONTEÚDO real do evento, não pela categoria. Um evento "regulatory" pode ser positivo (ex.: redução de impostos) ou negativo (ex.: aumento de impostos); um evento "competitive" pode ser positivo para a equipe (ex.: concorrente fecha as portas) ou negativo (ex.: novo concorrente forte entra no mercado). Use "neutro" só quando o evento tiver efeito genuinamente misto ou desprezível.
   - pestelCategory: categoria PESTEL por extenso ("Político", "Econômico", "Social", "Tecnológico", "Ambiental", "Legal")

4. Eventos devem ser variados em severidade (distribua entre baixo, médio e alto) e em sentiment (não gere só eventos negativos nem só positivos)
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
      "sentiment": "positivo" | "negativo" | "neutro",
      "pestelCategory": "string"
    }
  ]
}`;
}
