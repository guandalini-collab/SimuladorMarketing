import OpenAI from "openai";
import type { Class, Team } from "@shared/schema";
import { marketSectors, type MarketSector } from "../data/marketData";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const bcgQuadrantSchema = z.enum(["star", "cash_cow", "question_mark", "dog"]);

const strategicAnalysesResponseSchema = z.object({
  swot: z.object({
    strengths: z.array(z.string()).min(1).max(5),
    weaknesses: z.array(z.string()).min(1).max(5),
    opportunities: z.array(z.string()).min(1).max(5),
    threats: z.array(z.string()).min(1).max(5),
  }),
  porter: z.object({
    competitiveRivalry: z.number().int().min(1).max(10),
    supplierPower: z.number().int().min(1).max(10),
    buyerPower: z.number().int().min(1).max(10),
    threatOfSubstitutes: z.number().int().min(1).max(10),
    threatOfNewEntry: z.number().int().min(1).max(10),
    rivalryNotes: z.string().min(1),
    supplierNotes: z.string().min(1),
    buyerNotes: z.string().min(1),
    substitutesNotes: z.string().min(1),
    newEntryNotes: z.string().min(1),
  }),
  bcg: z.array(z.object({
    productName: z.string().min(1),
    marketGrowth: z.number(),
    relativeMarketShare: z.number(),
    quadrant: bcgQuadrantSchema,
    notes: z.string().min(1),
  })).min(1).max(4),
  pestel: z.object({
    political: z.array(z.string()).min(1).max(5),
    economic: z.array(z.string()).min(1).max(5),
    social: z.array(z.string()).min(1).max(5),
    technological: z.array(z.string()).min(1).max(5),
    environmental: z.array(z.string()).min(1).max(5),
    legal: z.array(z.string()).min(1).max(5),
  }),
  recommendations: z.object({
    product: z.array(z.string()).min(1).max(5),
    price: z.array(z.string()).min(1).max(5),
    place: z.array(z.string()).min(1).max(5),
    promotion: z.array(z.string()).min(1).max(5),
  }),
});

const minimalStrategicAnalysesSchema = z.object({
  swot: z.object({
    strengths: z.array(z.string()).length(1),
    weaknesses: z.array(z.string()).length(1),
    opportunities: z.array(z.string()).length(1),
    threats: z.array(z.string()).length(1),
  }),
  porter: z.object({
    competitiveRivalry: z.number().int().min(1).max(10),
    supplierPower: z.number().int().min(1).max(10),
    buyerPower: z.number().int().min(1).max(10),
    threatOfSubstitutes: z.number().int().min(1).max(10),
    threatOfNewEntry: z.number().int().min(1).max(10),
    rivalryNotes: z.string().min(1),
    supplierNotes: z.string().min(1),
    buyerNotes: z.string().min(1),
    substitutesNotes: z.string().min(1),
    newEntryNotes: z.string().min(1),
  }),
  bcg: z.array(z.object({
    productName: z.string().min(1),
    marketGrowth: z.number(),
    relativeMarketShare: z.number(),
    quadrant: bcgQuadrantSchema,
    notes: z.string().min(1),
  })).length(1),
  pestel: z.object({
    political: z.array(z.string()).length(1),
    economic: z.array(z.string()).length(1),
    social: z.array(z.string()).length(1),
    technological: z.array(z.string()).length(1),
    environmental: z.array(z.string()).length(1),
    legal: z.array(z.string()).length(1),
  }),
  recommendations: z.object({
    product: z.array(z.string()).length(1),
    price: z.array(z.string()).length(1),
    place: z.array(z.string()).length(1),
    promotion: z.array(z.string()).length(1),
  }),
});

export interface StrategicAnalyses {
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  porter: {
    competitiveRivalry: number;
    supplierPower: number;
    buyerPower: number;
    threatOfSubstitutes: number;
    threatOfNewEntry: number;
    rivalryNotes: string;
    supplierNotes: string;
    buyerNotes: string;
    substitutesNotes: string;
    newEntryNotes: string;
  };
  bcg: Array<{
    productName: string;
    marketGrowth: number;
    relativeMarketShare: number;
    quadrant: "star" | "cash_cow" | "question_mark" | "dog";
    notes: string;
  }>;
  pestel: {
    political: string[];
    economic: string[];
    social: string[];
    technological: string[];
    environmental: string[];
    legal: string[];
  };
  recommendations: {
    product: string[];
    price: string[];
    place: string[];
    promotion: string[];
  };
}

export interface StrategyGenerationParams {
  classData: Class;
  teamData: Team;
  roundNumber: number;
  aiAssistanceLevel?: number;
}

export async function generateStrategicAnalyses(params: StrategyGenerationParams): Promise<StrategicAnalyses> {
  const { classData, teamData, roundNumber, aiAssistanceLevel = 1 } = params;

  if (aiAssistanceLevel === 3) {
    return generateEmptyStructure(classData, teamData);
  }

  const sector = classData.sector ? marketSectors.find(s => s.id === classData.sector) : undefined;

  const prompt = buildStrategyPrompt(classData, teamData, roundNumber, sector);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é um consultor especialista em estratégia empresarial e marketing, com profundo conhecimento em análises SWOT, Forças de Porter, Matriz BCG e PESTEL. Sua missão é gerar análises estratégicas completas e realistas para empresas em um simulador educacional de marketing.

**Seu papel:**
- Criar análises estratégicas detalhadas e contextualizadas
- Considerar o setor, tipo de negócio, tamanho de mercado e concorrência
- Gerar insights acionáveis que orientem decisões de marketing
- Fornecer recomendações específicas para os 4 Ps (Produto, Preço, Praça, Promoção)
- Adaptar análises ao contexto brasileiro

**Princípios:**
1. Análises devem ser REALISTAS e ESPECÍFICAS ao setor
2. Evite generalidades - seja concreto e acionável
3. Considere o cenário econômico brasileiro atual
4. Recomendações devem ser práticas e executáveis
5. Use linguagem acessível para estudantes do ensino médio`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 3000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("Resposta vazia da IA");
    }

    const parsed = JSON.parse(response);
    
    const validated = strategicAnalysesResponseSchema.parse(parsed);
    const fullAnalyses = validated as StrategicAnalyses;

    if (aiAssistanceLevel === 2) {
      return applyPartialAssistance(fullAnalyses);
    }

    return fullAnalyses;
  } catch (error) {
    console.error("Erro ao gerar análises estratégicas com IA:", error);
    throw new Error("Falha ao gerar análises estratégicas. Tente novamente.");
  }
}

function buildStrategyPrompt(
  classData: Class,
  teamData: Team,
  roundNumber: number,
  sector?: MarketSector
): string {
  const sectorName = sector?.name || classData.sector || "Não especificado";
  const sectorTrends = sector?.trends || [];
  const sectorOpportunities = sector?.opportunities || [];
  const sectorChallenges = sector?.challenges || [];

  return `Gere uma análise estratégica completa para uma empresa em um simulador de marketing educacional.

**Contexto da Turma:**
- Setor: ${sectorName}
- Tipo de Negócio: ${classData.businessType || "B2C"}
- Tamanho do Mercado: R$ ${classData.marketSize?.toLocaleString('pt-BR') || "Não especificado"}
- Taxa de Crescimento: ${classData.marketGrowthRate?.toFixed(1) || "5.0"}% ao ano
- Nível de Competição: ${classData.competitionLevel || "Médio"}
- Número de Concorrentes: ${classData.numberOfCompetitors || "Vários"}
- Concentração de Mercado: ${classData.marketConcentration || "Fragmentado"}
- Força dos Concorrentes: ${classData.competitorStrength || "Média"}
- Consumidores-alvo: ${classData.targetConsumers?.toLocaleString('pt-BR') || "Não especificado"}

**Identidade da Empresa:**
- Nome: ${teamData.companyName || "Nova Empresa"}
- Slogan: ${teamData.slogan || "A definir"}
- Categoria de Produto: ${teamData.productCategory || "A definir"}
- Público-Alvo (Classe): ${teamData.targetAudienceClass || "A definir"}
- Público-Alvo (Idade): ${teamData.targetAudienceAge || "A definir"}
- Público-Alvo (Perfil): ${teamData.targetAudienceProfile || "A definir"}
- Orçamento Atual: R$ ${teamData.budget?.toLocaleString('pt-BR') || "100.000"}

**Contexto do Setor:**
${sectorTrends.length > 0 ? `Tendências: ${sectorTrends.join('; ')}` : ''}
${sectorOpportunities.length > 0 ? `Oportunidades: ${sectorOpportunities.join('; ')}` : ''}
${sectorChallenges.length > 0 ? `Desafios: ${sectorChallenges.join('; ')}` : ''}

**Rodada:** ${roundNumber}

**Sua Tarefa:**
Gere análises estratégicas completas que orientem as decisões de marketing desta empresa. As análises devem ser:
1. **Realistas** - Baseadas no cenário brasileiro e no setor específico
2. **Específicas** - Evite generalidades, seja concreto
3. **Acionáveis** - Forneça insights que podem ser transformados em decisões
4. **Educacionais** - Use linguagem acessível para estudantes

**Formato de Resposta (JSON obrigatório):**
{
  "swot": {
    "strengths": [
      "Força 1 - Seja específico ao setor e ao contexto",
      "Força 2 - Considere os recursos disponíveis",
      "Força 3 - Pense em vantagens competitivas reais"
    ],
    "weaknesses": [
      "Fraqueza 1 - Seja honesto sobre limitações",
      "Fraqueza 2 - Considere gaps de capacidade",
      "Fraqueza 3 - Pense em desvantagens competitivas"
    ],
    "opportunities": [
      "Oportunidade 1 - Baseie-se em tendências do setor",
      "Oportunidade 2 - Considere o crescimento do mercado",
      "Oportunidade 3 - Pense em nichos não explorados"
    ],
    "threats": [
      "Ameaça 1 - Considere concorrência e ambiente",
      "Ameaça 2 - Pense em riscos regulatórios/econômicos",
      "Ameaça 3 - Analise mudanças de comportamento do consumidor"
    ]
  },
  "porter": {
    "competitiveRivalry": 7,
    "supplierPower": 5,
    "buyerPower": 6,
    "threatOfSubstitutes": 4,
    "threatOfNewEntry": 6,
    "rivalryNotes": "Análise detalhada da rivalidade competitiva no setor (2-3 frases)",
    "supplierNotes": "Análise do poder dos fornecedores (2-3 frases)",
    "buyerNotes": "Análise do poder dos compradores (2-3 frases)",
    "substitutesNotes": "Análise da ameaça de produtos substitutos (2-3 frases)",
    "newEntryNotes": "Análise da ameaça de novos entrantes (2-3 frases)"
  },
  "bcg": [
    {
      "productName": "Nome do produto principal",
      "marketGrowth": 8.5,
      "relativeMarketShare": 1.2,
      "quadrant": "star",
      "notes": "Justificativa do posicionamento (2-3 frases)"
    },
    {
      "productName": "Nome de produto complementar (se aplicável)",
      "marketGrowth": 3.0,
      "relativeMarketShare": 0.8,
      "quadrant": "cash_cow",
      "notes": "Justificativa do posicionamento (2-3 frases)"
    }
  ],
  "pestel": {
    "political": [
      "Fator político 1 relevante ao setor",
      "Fator político 2 (regulações, políticas públicas)",
      "Fator político 3"
    ],
    "economic": [
      "Fator econômico 1 (inflação, juros, câmbio)",
      "Fator econômico 2 (poder de compra, emprego)",
      "Fator econômico 3"
    ],
    "social": [
      "Fator social 1 (comportamento do consumidor)",
      "Fator social 2 (demografia, valores)",
      "Fator social 3"
    ],
    "technological": [
      "Fator tecnológico 1 (inovações do setor)",
      "Fator tecnológico 2 (transformação digital)",
      "Fator tecnológico 3"
    ],
    "environmental": [
      "Fator ambiental 1 (sustentabilidade)",
      "Fator ambiental 2 (regulações ambientais)",
      "Fator ambiental 3"
    ],
    "legal": [
      "Fator legal 1 (leis e regulações)",
      "Fator legal 2 (proteção ao consumidor)",
      "Fator legal 3"
    ]
  },
  "recommendations": {
    "product": [
      "Recomendação 1 sobre qualidade/características do produto",
      "Recomendação 2 sobre posicionamento de marca",
      "Recomendação 3 sobre diferenciação"
    ],
    "price": [
      "Recomendação 1 sobre estratégia de precificação",
      "Recomendação 2 sobre valor percebido",
      "Recomendação 3 sobre competitividade"
    ],
    "place": [
      "Recomendação 1 sobre canais de distribuição",
      "Recomendação 2 sobre cobertura de mercado",
      "Recomendação 3 sobre logística"
    ],
    "promotion": [
      "Recomendação 1 sobre mix promocional ideal",
      "Recomendação 2 sobre intensidade de comunicação",
      "Recomendação 3 sobre alocação de orçamento"
    ]
  }
}

**Notas Importantes:**
- Scores de Porter devem ser de 1-10
- BCG: marketGrowth e relativeMarketShare são números decimais
- BCG: quadrant pode ser "star", "cash_cow", "question_mark", ou "dog"
- Cada categoria deve ter 3-5 itens
- Seja específico ao setor ${sectorName}
- Use dados realistas do mercado brasileiro`;
}

function generateEmptyStructure(classData: Class, teamData: Team): StrategicAnalyses {
  return {
    swot: {
      strengths: [""],
      weaknesses: [""],
      opportunities: [""],
      threats: [""],
    },
    porter: {
      competitiveRivalry: 5,
      supplierPower: 5,
      buyerPower: 5,
      threatOfSubstitutes: 5,
      threatOfNewEntry: 5,
      rivalryNotes: "",
      supplierNotes: "",
      buyerNotes: "",
      substitutesNotes: "",
      newEntryNotes: "",
    },
    bcg: [
      {
        productName: "",
        marketGrowth: 5.0,
        relativeMarketShare: 1.0,
        quadrant: "question_mark",
        notes: "",
      },
    ],
    pestel: {
      political: [""],
      economic: [""],
      social: [""],
      technological: [""],
      environmental: [""],
      legal: [""],
    },
    recommendations: {
      product: [""],
      price: [""],
      place: [""],
      promotion: [""],
    },
  };
}

function applyPartialAssistance(fullAnalyses: StrategicAnalyses): StrategicAnalyses {
  const removeEveryThirdItem = <T>(arr: T[]): T[] => {
    return arr.filter((_, index) => (index + 1) % 3 !== 0);
  };

  const partialNotes = (notes: string): string => {
    const sentences = notes.split('.').filter(s => s.trim().length > 0);
    if (sentences.length <= 2) {
      return notes.split('.')[0] + ". [Complete a análise]";
    }
    const keep = sentences.slice(0, Math.ceil(sentences.length * 0.7));
    return keep.join('.') + ". [Complete a análise]";
  };

  return {
    swot: {
      strengths: [...removeEveryThirdItem(fullAnalyses.swot.strengths), ""],
      weaknesses: [...removeEveryThirdItem(fullAnalyses.swot.weaknesses), ""],
      opportunities: [...removeEveryThirdItem(fullAnalyses.swot.opportunities), ""],
      threats: [...removeEveryThirdItem(fullAnalyses.swot.threats), ""],
    },
    porter: {
      ...fullAnalyses.porter,
      rivalryNotes: partialNotes(fullAnalyses.porter.rivalryNotes),
      supplierNotes: partialNotes(fullAnalyses.porter.supplierNotes),
      buyerNotes: fullAnalyses.porter.buyerNotes,
      substitutesNotes: partialNotes(fullAnalyses.porter.substitutesNotes),
      newEntryNotes: fullAnalyses.porter.newEntryNotes,
    },
    bcg: fullAnalyses.bcg.map((item, index) => ({
      ...item,
      notes: index === 0 ? partialNotes(item.notes) : item.notes,
    })),
    pestel: {
      political: [...removeEveryThirdItem(fullAnalyses.pestel.political), ""],
      economic: [...removeEveryThirdItem(fullAnalyses.pestel.economic), ""],
      social: [...removeEveryThirdItem(fullAnalyses.pestel.social), ""],
      technological: [...removeEveryThirdItem(fullAnalyses.pestel.technological), ""],
      environmental: [...removeEveryThirdItem(fullAnalyses.pestel.environmental), ""],
      legal: [...removeEveryThirdItem(fullAnalyses.pestel.legal), ""],
    },
    recommendations: {
      product: [...removeEveryThirdItem(fullAnalyses.recommendations.product), ""],
      price: [...removeEveryThirdItem(fullAnalyses.recommendations.price), ""],
      place: [...removeEveryThirdItem(fullAnalyses.recommendations.place), ""],
      promotion: [...removeEveryThirdItem(fullAnalyses.recommendations.promotion), ""],
    },
  };
}

export async function generateMinimalStrategicAnalyses(params: StrategyGenerationParams): Promise<StrategicAnalyses> {
  const { classData, teamData, roundNumber } = params;

  const sector = classData.sector ? marketSectors.find(s => s.id === classData.sector) : undefined;
  const prompt = buildMinimalStrategyPrompt(classData, teamData, roundNumber, sector);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é um consultor estratégico gerando análises BASE mínimas para um simulador educacional.

**SEU PAPEL:**
Gerar exatamente 1 item INICIAL em cada tópico das ferramentas estratégicas. Os estudantes vão complementar depois.

**PRINCÍPIOS:**
1. Seja CONCISO - apenas 1 item curto e direto por tópico
2. Seja ESPECÍFICO ao setor e contexto da empresa
3. Use linguagem SIMPLES para estudantes do ensino médio
4. Evite generalidades - seja prático e acionável
5. Cada item deve ter no máximo 1-2 frases curtas`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("Resposta vazia da IA");
    }

    const parsed = JSON.parse(response);
    const validated = minimalStrategicAnalysesSchema.parse(parsed);
    
    return validated as StrategicAnalyses;
  } catch (error) {
    console.error("Erro ao gerar análises estratégicas mínimas:", error);
    throw new Error("Falha ao gerar análises mínimas");
  }
}

function buildMinimalStrategyPrompt(
  classData: Class,
  teamData: Team,
  roundNumber: number,
  sector?: MarketSector
): string {
  const sectorName = sector?.name || classData.sector || "Não especificado";

  return `Gere análises estratégicas BASE MÍNIMAS para uma empresa em um simulador de marketing educacional.

**IMPORTANTE:** Gere EXATAMENTE 1 item em cada tópico. Os estudantes vão complementar depois.

**Contexto da Empresa:**
- Setor: ${sectorName}
- Nome: ${teamData.companyName || "Nova Empresa"}
- Categoria: ${teamData.productCategory || "A definir"}
- Público-Alvo: ${teamData.targetAudienceClass || "A definir"}
- Orçamento: R$ ${teamData.budget?.toLocaleString('pt-BR') || "100.000"}
- Rodada: ${roundNumber}

**Contexto de Mercado:**
- Tamanho: R$ ${classData.marketSize?.toLocaleString('pt-BR') || "Não especificado"}
- Crescimento: ${classData.marketGrowthRate?.toFixed(1) || "5.0"}% ao ano
- Competição: ${classData.competitionLevel || "Médio"}
- Concorrentes: ${classData.numberOfCompetitors || "Vários"}

**FORMATO JSON (OBRIGATÓRIO):**
{
  "swot": {
    "strengths": ["1 força específica ao setor (máx 2 frases)"],
    "weaknesses": ["1 fraqueza realista (máx 2 frases)"],
    "opportunities": ["1 oportunidade de mercado (máx 2 frases)"],
    "threats": ["1 ameaça concreta (máx 2 frases)"]
  },
  "porter": {
    "competitiveRivalry": 7,
    "supplierPower": 5,
    "buyerPower": 6,
    "threatOfSubstitutes": 4,
    "threatOfNewEntry": 6,
    "rivalryNotes": "1-2 frases sobre rivalidade competitiva",
    "supplierNotes": "1-2 frases sobre poder dos fornecedores",
    "buyerNotes": "1-2 frases sobre poder dos compradores",
    "substitutesNotes": "1-2 frases sobre produtos substitutos",
    "newEntryNotes": "1-2 frases sobre novos entrantes"
  },
  "bcg": [
    {
      "productName": "${teamData.productCategory || "Produto Principal"}",
      "marketGrowth": 8.5,
      "relativeMarketShare": 1.2,
      "quadrant": "star",
      "notes": "1-2 frases justificando o posicionamento"
    }
  ],
  "pestel": {
    "political": ["1 fator político relevante (máx 2 frases)"],
    "economic": ["1 fator econômico atual (máx 2 frases)"],
    "social": ["1 tendência social do setor (máx 2 frases)"],
    "technological": ["1 tecnologia/inovação relevante (máx 2 frases)"],
    "environmental": ["1 fator ambiental importante (máx 2 frases)"],
    "legal": ["1 regulação/lei relevante (máx 2 frases)"]
  },
  "recommendations": {
    "product": ["1 recomendação sobre produto (máx 2 frases)"],
    "price": ["1 recomendação sobre preço (máx 2 frases)"],
    "place": ["1 recomendação sobre distribuição (máx 2 frases)"],
    "promotion": ["1 recomendação sobre promoção (máx 2 frases)"]
  }
}

**REGRAS CRÍTICAS:**
- EXATAMENTE 1 item por array (não mais, não menos)
- Máximo 1-2 frases por item
- Scores Porter: 1-10
- BCG: apenas 1 produto
- Quadrante BCG: "star", "cash_cow", "question_mark", ou "dog"
- Seja ESPECÍFICO ao ${sectorName}`;
}

