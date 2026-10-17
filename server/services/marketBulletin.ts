import OpenAI from "openai";
import type { MarketEvent, MarketingMix } from "@shared/schema";
import { marketSectors } from "../data/marketData";
import { pool } from "../pg-storage";

// Boletim mensal de mercado (pedido do professor, out/2026): cada rodada
// corresponde a um mês, e o mercado muda de um mês para o outro. Na abertura
// de cada rodada é gerado um boletim com dois indicadores que passam a pesar
// no resultado ("adequação ao mercado do mês"):
//   - demanda: retração | estável | aquecida
//   - sensibilidade a preço: alta | normal | baixa
// A tabela é criada no boot (ensureMarketBulletinTable.ts). Rodadas sem
// boletim (todas as anteriores a esta mudança) não recebem ajuste nenhum.

export type Demanda = "retracao" | "estavel" | "aquecida";
export type Sensibilidade = "alta" | "normal" | "baixa";

export interface MarketBulletin {
  id: string;
  classId: string;
  roundId: string;
  demand: Demanda;
  priceSensitivity: Sensibilidade;
  headline: string;
  summary: string;
  indicators: {
    confiancaConsumidor?: number; // 0 a 100
    variacaoPrecosSetor?: number; // % no mês
    intensidadeConcorrencia?: "baixa" | "media" | "alta";
    tendencias?: string[];
  } | null;
  createdAt: string;
}

const DEMANDAS = new Set<Demanda>(["retracao", "estavel", "aquecida"]);
const SENSIBILIDADES = new Set<Sensibilidade>(["alta", "normal", "baixa"]);

// Cliente criado só quando o boletim é gerado: assim, importar este módulo
// no encerramento da rodada nunca falha por falta de chave da IA.
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }
  return openaiClient;
}

function rowToBulletin(row: any): MarketBulletin {
  return {
    id: row.id,
    classId: row.class_id,
    roundId: row.round_id,
    demand: row.demand,
    priceSensitivity: row.price_sensitivity,
    headline: row.headline ?? "",
    summary: row.summary ?? "",
    indicators: row.indicators ?? null,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}

export async function getBulletinByRound(roundId: string): Promise<MarketBulletin | null> {
  try {
    const { rows } = await pool.query(`SELECT * FROM market_bulletins WHERE round_id = $1 LIMIT 1`, [roundId]);
    return rows[0] ? rowToBulletin(rows[0]) : null;
  } catch (error) {
    console.error("[BOLETIM] Erro ao ler boletim:", error);
    return null;
  }
}

export async function getBulletinsByClass(classId: string): Promise<MarketBulletin[]> {
  try {
    const { rows } = await pool.query(`SELECT * FROM market_bulletins WHERE class_id = $1 ORDER BY created_at ASC`, [classId]);
    return rows.map(rowToBulletin);
  } catch (error) {
    console.error("[BOLETIM] Erro ao listar boletins:", error);
    return [];
  }
}

// Leitura de segurança quando a IA falha: deriva os indicadores dos eventos
// do mês (sinal e severidade), sem inventar texto.
function indicadoresPelosEventos(events: MarketEvent[]): { demand: Demanda; priceSensitivity: Sensibilidade } {
  const peso = (e: MarketEvent) => (e.severity === "critico" ? 3 : e.severity === "alto" ? 2 : e.severity === "medio" ? 1 : 0.5);
  let saldo = 0;
  let pressaoPreco = 0;
  for (const e of events.filter((ev) => ev.active)) {
    const sinal = e.sentiment === "positivo" ? 1 : e.sentiment === "negativo" ? -1 : 0;
    saldo += sinal * peso(e);
    if (e.type === "economico" && sinal < 0) pressaoPreco += peso(e);
  }
  const demand: Demanda = saldo <= -2 ? "retracao" : saldo >= 2 ? "aquecida" : "estavel";
  const priceSensitivity: Sensibilidade = pressaoPreco >= 2 || demand === "retracao" ? "alta" : demand === "aquecida" ? "baixa" : "normal";
  return { demand, priceSensitivity };
}

async function gerarTextoComIA(params: {
  sectorName: string;
  businessType: string;
  roundNumber: number;
  events: MarketEvent[];
  classId?: string;
}): Promise<{ demand: Demanda; priceSensitivity: Sensibilidade; headline: string; summary: string; indicators: MarketBulletin["indicators"] } | null> {
  const listaEventos = params.events
    .filter((e) => e.active)
    .map((e) => `- ${e.title} (${e.type}, ${e.severity}, ${e.sentiment}): ${e.description}`)
    .join("\n") || "- Nenhum evento relevante neste mês.";

  const { getConjunturaParaPrompt } = await import("./conjuntura");
  const conjuntura = await getConjunturaParaPrompt(params.classId);
  const prompt = `Setor: ${params.sectorName}. Tipo de negócio: ${params.businessType}. Mês ${params.roundNumber} da simulação.
Eventos de mercado deste mês:
${listaEventos}

Redija o boletim de conjuntura do mês para este setor, coerente com os eventos acima.
Responda em JSON com exatamente estes campos:
{
  "demand": "retracao" | "estavel" | "aquecida",
  "priceSensitivity": "alta" | "normal" | "baixa",
  "headline": "título curto do boletim",
  "summary": "2 a 4 frases descrevendo o comportamento do consumidor, da demanda e dos preços no mês, sem recomendar o que as empresas devem fazer",
  "indicators": {
    "confiancaConsumidor": número de 0 a 100,
    "variacaoPrecosSetor": número (variação % dos preços do setor no mês, ex.: -1.2),
    "intensidadeConcorrencia": "baixa" | "media" | "alta",
    "tendencias": ["2 a 3 tendências curtas do mês"]
  }
}
Os eventos são o mês simulado; a conjuntura abaixo é o pano de fundo real do país e deve ser coerente com o boletim.${conjuntura}`;

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Você é a redação econômica do Simula+ News. Escreva em português do Brasil, em tom jornalístico, objetivo e frio. Baseie-se em dinâmicas econômicas plausíveis do Brasil, sem inventar instituições ou números apresentados como dados oficiais. Nunca recomende decisões às empresas e nunca mencione ser uma inteligência artificial.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 700,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (!DEMANDAS.has(parsed?.demand) || !SENSIBILIDADES.has(parsed?.priceSensitivity)) return null;
  if (typeof parsed.headline !== "string" || typeof parsed.summary !== "string") return null;

  const ind = parsed.indicators ?? {};
  return {
    demand: parsed.demand,
    priceSensitivity: parsed.priceSensitivity,
    headline: parsed.headline.trim(),
    summary: parsed.summary.trim(),
    indicators: {
      confiancaConsumidor: Number.isFinite(Number(ind.confiancaConsumidor)) ? Math.max(0, Math.min(100, Number(ind.confiancaConsumidor))) : undefined,
      variacaoPrecosSetor: Number.isFinite(Number(ind.variacaoPrecosSetor)) ? Number(ind.variacaoPrecosSetor) : undefined,
      intensidadeConcorrencia: ["baixa", "media", "alta"].includes(ind.intensidadeConcorrencia) ? ind.intensidadeConcorrencia : undefined,
      tendencias: Array.isArray(ind.tendencias) ? ind.tendencias.filter((t: any) => typeof t === "string").slice(0, 3) : undefined,
    },
  };
}

const TEXTO_DEMANDA: Record<Demanda, string> = {
  retracao: "Demanda em retração",
  estavel: "Demanda estável",
  aquecida: "Demanda aquecida",
};

export async function ensureBulletinForRound(params: {
  classId: string;
  roundId: string;
  roundNumber: number;
  sectorId: string | null | undefined;
  businessType: string | null | undefined;
  events: MarketEvent[];
}): Promise<MarketBulletin | null> {
  const existente = await getBulletinByRound(params.roundId);
  if (existente) return existente;

  const sector = marketSectors.find((s) => s.id === params.sectorId);
  let dados: Awaited<ReturnType<typeof gerarTextoComIA>> = null;
  try {
    dados = await gerarTextoComIA({
      sectorName: sector?.name ?? "Setor da turma",
      businessType: params.businessType || "B2C",
      roundNumber: params.roundNumber,
      events: params.events,
      classId: params.classId,
    });
  } catch (error) {
    console.error("[BOLETIM] IA indisponível, usando leitura pelos eventos:", error);
  }

  if (!dados) {
    const base = indicadoresPelosEventos(params.events);
    dados = {
      ...base,
      headline: `${TEXTO_DEMANDA[base.demand]} no mês ${params.roundNumber}`,
      summary: "Boletim resumido a partir dos eventos de mercado do mês.",
      indicators: null,
    };
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO market_bulletins (class_id, round_id, demand, price_sensitivity, headline, summary, indicators)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (round_id) DO NOTHING
       RETURNING *`,
      [params.classId, params.roundId, dados.demand, dados.priceSensitivity, dados.headline, dados.summary, dados.indicators ? JSON.stringify(dados.indicators) : null],
    );
    return rows[0] ? rowToBulletin(rows[0]) : await getBulletinByRound(params.roundId);
  } catch (error) {
    console.error("[BOLETIM] Erro ao gravar boletim:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Adequação ao mercado do mês (tabela aprovada pelo professor em 12/10/2026)
// ---------------------------------------------------------------------------

export interface MarketFit {
  percent: number; // ex.: -8 significa -8% na receita
  reasons: string[];
  demand: Demanda;
  priceSensitivity: Sensibilidade;
}

const LIMITE_AJUSTE = 12;

function precoPremium(mix: MarketingMix, precoMedioCategoria: number | null): boolean {
  if (mix.priceStrategy === "skimming") return true;
  return precoMedioCategoria !== null && precoMedioCategoria > 0 && mix.priceValue > precoMedioCategoria * 1.15;
}

function precoEconomico(mix: MarketingMix, precoMedioCategoria: number | null): boolean {
  if (mix.priceStrategy === "penetracao") return true;
  return precoMedioCategoria !== null && precoMedioCategoria > 0 && mix.priceValue < precoMedioCategoria * 0.85;
}

export function computeMarketFit(bulletin: MarketBulletin, mix: MarketingMix, precoMedioCategoria: number | null): MarketFit {
  const reasons: string[] = [];
  let pct = 0;
  const promoAlta = mix.promotionIntensity === "alto" || mix.promotionIntensity === "intensivo";
  const promoBaixa = mix.promotionIntensity === "baixo";
  const premium = precoPremium(mix, precoMedioCategoria);
  const economico = precoEconomico(mix, precoMedioCategoria);

  if (bulletin.demand === "retracao") {
    if (promoAlta) { pct -= 8; reasons.push("Demanda em retração e promoção alta: investimento feito quando o consumidor estava retraído (−8%)."); }
    if (premium) { pct -= 6; reasons.push("Demanda em retração e preço premium (−6%)."); }
  } else if (bulletin.demand === "aquecida") {
    if (promoBaixa) { pct -= 5; reasons.push("Demanda aquecida e promoção baixa: oportunidade pouco aproveitada (−5%)."); }
    if (promoAlta) { pct += 5; reasons.push("Demanda aquecida e promoção alta (+5%)."); }
  }

  if (bulletin.priceSensitivity === "alta") {
    if (premium) { pct -= 6; reasons.push("Consumidor sensível a preço e preço premium (−6%)."); }
    if (economico) { pct += 4; reasons.push("Consumidor sensível a preço e preço econômico (+4%)."); }
  } else if (bulletin.priceSensitivity === "baixa") {
    if (premium || mix.priceStrategy === "valor") { pct += 4; reasons.push("Consumidor pouco sensível a preço e preço premium ou baseado em valor (+4%)."); }
  }

  const limitado = Math.max(-LIMITE_AJUSTE, Math.min(LIMITE_AJUSTE, pct));
  if (limitado !== pct) reasons.push(`Ajuste total limitado a ${limitado > 0 ? "+" : ""}${limitado}%.`);
  return { percent: limitado, reasons, demand: bulletin.demand, priceSensitivity: bulletin.priceSensitivity };
}

// Preço médio da categoria do produto (mesma regra da tela de decisões:
// categoria do setor com id igual ao slug do produto ou com o mesmo nome).
export function precoMedioDaCategoria(sectorId: string | null | undefined, product: { slug?: string | null; name?: string | null } | null | undefined): number | null {
  const sector = marketSectors.find((s) => s.id === sectorId);
  if (!sector || !product) return null;
  // Out/2026: os produtos da turma têm slug "<categoria>-<setor>" (ver
  // ensureProductCatalog.ts) e o nome pode vir sem acento ("Snack Saudavel");
  // antes só batia o slug puro ou o nome idêntico, e o preço caía no da 1ª
  // categoria do setor.
  const semAcento = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const cat = sector.categories.find(
    (c) =>
      c.id === product.slug ||
      `${c.id}-${sector.id}` === product.slug ||
      (c.name && product.name && semAcento(c.name) === semAcento(String(product.name))),
  );
  return cat?.averagePrice ?? null;
}
