/**
 * Análises estratégicas entregues prontas a cada rodada (out/2026).
 *
 * Pedido do professor: SWOT, 5 Forças de Porter, BCG e PESTEL chegam prontas
 * para os alunos, o mais fiéis possível ao mercado real, renovadas a cada
 * rodada e somente para leitura. A Segmentação de Mercado continua sendo
 * feita só pelos alunos (e é herdada da rodada anterior).
 *
 * - PESTEL e Porter descrevem o MERCADO: uma só para a turma (tabela
 *   analises_turma), gravada igual para todas as equipes.
 * - SWOT: uma por equipe, com forças e fraquezas tiradas dos números da
 *   própria equipe (resultado e participação da rodada anterior).
 * - BCG: calculada, sem IA — participação relativa do produto no mercado do
 *   jogo (motor competitivo) e crescimento real do setor (fonte setorial).
 *
 * Regras de texto: diagnóstico neutro, sem recomendar decisões (o aluno
 * decide e descobre as consequências nos resultados). Só vale para turmas no
 * motor competitivo (ver roundCompletionCompetitive.ts); turmas antigas
 * seguem com o fluxo anterior (análises editáveis).
 *
 * Nada aqui roda na tela do aluno: é chamado pela preparação e pela abertura
 * da rodada (roundAutomation.ts) e pelo botão do professor. É idempotente:
 * sem `forcar`, o que já foi gerado na rodada é reaproveitado.
 */
import OpenAI from "openai";
import { z } from "zod";
import type { IStorage } from "../storage";
import type { Class, Product, Round, Team } from "@shared/schema";
import { pool } from "../pg-storage";
import { marketSectors } from "../data/marketData";
import { classificarBcg, participacaoRelativa } from "@shared/bcg";

/** Marca gravada em originalAIContent para reconhecer o conteúdo gerado aqui. */
export const MARCA_ANALISES_IA = "simula-analises-ia-v1";

let clienteIA: OpenAI | null = null;
function ia(): OpenAI {
  if (!clienteIA) {
    clienteIA = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }
  return clienteIA;
}

// ---------------------------------------------------------------- modo

/** A turma recebe as análises prontas (e somente leitura)? */
export async function turmaComAnalisesDaIA(storage: IStorage, classId: string): Promise<boolean> {
  const { MOTOR_COMPETITIVO_ATIVO, turmaNoMotorCompetitivo } = await import("./roundCompletionCompetitive");
  if (!MOTOR_COMPETITIVO_ATIVO) return false;
  return turmaNoMotorCompetitivo(storage, classId);
}

// ---------------------------------------------------------------- esquemas

const lista = z.array(z.string().min(3)).min(2).max(4);
const nota = z.number().int().min(1).max(10);

const pestelPorterSchema = z.object({
  pestel: z.object({
    political: lista,
    economic: lista,
    social: lista,
    technological: lista,
    environmental: lista,
    legal: lista,
  }),
  porter: z.object({
    competitiveRivalry: nota,
    supplierPower: nota,
    buyerPower: nota,
    threatOfSubstitutes: nota,
    threatOfNewEntry: nota,
    rivalryNotes: z.string().min(10),
    supplierNotes: z.string().min(10),
    buyerNotes: z.string().min(10),
    substitutesNotes: z.string().min(10),
    newEntryNotes: z.string().min(10),
  }),
});
export type PestelPorterDaTurma = z.infer<typeof pestelPorterSchema>;

const swotSchema = z.object({
  strengths: lista,
  weaknesses: lista,
  opportunities: lista,
  threats: lista,
});
export type SwotDaEquipe = z.infer<typeof swotSchema>;

const REGRAS_DE_TEXTO = `REGRAS OBRIGATÓRIAS:
1. Português do Brasil, linguagem técnica, clara e neutra.
2. Faça DIAGNÓSTICO, nunca recomendação: é proibido dizer o que a empresa deve fazer, sugerir decisões de preço, produto, praça ou promoção, ou usar termos como "deve", "recomenda-se", "é importante investir", "o ideal é".
3. Use somente os dados fornecidos e a conjuntura informada. Não invente números, pesquisas, leis, empresas reais ou estatísticas que não estejam no contexto. Se citar um número, ele precisa estar no contexto.
4. Os concorrentes do jogo são empresas fictícias (Alfa, Beta, Gama, Delta e as equipes da turma); não cite marcas reais como concorrentes.
5. Cada item com no máximo 2 frases curtas.
6. Não mencione inteligência artificial, modelo de linguagem ou software externo.`;

// ---------------------------------------------------------------- contexto

function moeda(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
function pct(v: number, casas = 1): string {
  return `${v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;
}

function setorDa(classData: Pick<Class, "sector">) {
  return marketSectors.find((s) => s.id === classData.sector);
}

async function produtosDaRodada(storage: IStorage, classData: Class, round: Round): Promise<Product[]> {
  if (!classData.sector) return [];
  const todos = await storage.getProductsBySector(classData.sector);
  return [...todos].sort((a, b) => a.orderIndex - b.orderIndex).slice(0, Math.max(1, round.productCount ?? 1));
}

async function rodadaAnterior(storage: IStorage, round: Round): Promise<Round | undefined> {
  const rodadas = await storage.getRoundsByClass(round.classId);
  return rodadas
    .filter((r) => !r.isPractice && r.roundNumber < round.roundNumber && r.status === "completed")
    .sort((a, b) => b.roundNumber - a.roundNumber)[0];
}

async function contextoDoMercado(storage: IStorage, classData: Class, round: Round, teams: Team[]): Promise<string> {
  const setor = setorDa(classData);
  const { estadoAnterior, numeroDeConcorrentes, valorSemanalCategoria } = await import("./roundCompletionCompetitive");
  const { PERFIS_CONCORRENTES, concorrentesDaTurma } = await import("../simulation/competitiveEngine");
  const estado = await estadoAnterior(round.classId, round.roundNumber);
  const { getBulletinByRound } = await import("./marketBulletin");
  const boletim = await getBulletinByRound(round.id).catch(() => null);
  const eventos = (await storage.getMarketEventsByRound(round.id)).filter((e) => e.active);
  const crescimento = classData.marketGrowthRate ?? setor?.growthRate;

  const linhas: string[] = [];
  linhas.push(`Setor: ${setor?.name ?? classData.sector ?? "não informado"}. Praça do jogo: Rio Grande do Sul.`);
  if (setor) {
    linhas.push(`Tamanho anual do setor no Brasil: ${moeda(classData.marketSize && classData.marketSize > 0 ? classData.marketSize : setor.marketSize)}${setor.fonte?.tamanho ? ` (fonte: ${setor.fonte.tamanho})` : ""}.`);
    if (crescimento != null) linhas.push(`Crescimento do setor: ${pct(crescimento)} ao ano${setor.fonte?.crescimento ? ` (fonte: ${setor.fonte.crescimento})` : ""}.`);
    if (setor.margemBruta != null) linhas.push(`Margem bruta média do setor: ${pct(setor.margemBruta)}; margem líquida: ${pct(setor.margemLiquida ?? 0)} (Damodaran, mercados emergentes, 2026).`);
    if (setor.verbaMarketingPct != null) linhas.push(`Investimento típico em marketing: ${pct(setor.verbaMarketingPct)} da receita${setor.fonteVerbaMarketing ? ` (${setor.fonteVerbaMarketing})` : ""}.`);
    linhas.push(`Categorias e preço médio de referência: ${setor.categories.map((c) => `${c.name} ${moeda(c.averagePrice)}${(c as any).unidade ? ` (${(c as any).unidade})` : ""}`).join("; ")}.`);
    linhas.push(`Mercado semanal estimado por categoria na praça: ${moeda(valorSemanalCategoria(classData))}.`);
  }
  const nConc = numeroDeConcorrentes(classData);
  const perfis = concorrentesDaTurma(nConc).map((p) => `${p.nome} (${p.perfil})`).join(", ");
  linhas.push(`Empresas no mercado do jogo: ${teams.length} equipe(s) da turma, todas marcas novas, e ${nConc} concorrente(s) já estabelecido(s): ${perfis || PERFIS_CONCORRENTES.map((p) => p.nome).join(", ")}.`);

  if (estado?.categorias?.length) {
    for (const cat of estado.categorias) {
      const top = [...cat.ofertas].sort((a, b) => b.participacaoValor - a.participacaoValor).slice(0, 6);
      linhas.push(
        `Rodada anterior, categoria ${cat.categoriaNome}: ${Math.round(cat.demandaUnidades).toLocaleString("pt-BR")} unidades vendidas; preço médio praticado ${moeda(cat.precoMedioPraticado)}. Participação em valor: ${top.map((o) => `${o.empresa} ${pct(o.participacaoValor)}`).join(", ")}.`,
      );
    }
  } else {
    linhas.push("Ainda não há rodada anterior com resultados: as equipes entram agora no mercado.");
  }
  if (boletim) {
    linhas.push(`Boletim da semana: demanda ${boletim.demand}, sensibilidade a preço ${boletim.priceSensitivity}. ${boletim.headline}. ${boletim.summary}`);
  }
  if (eventos.length) {
    linhas.push(`Eventos de mercado da semana: ${eventos.map((e) => `${e.title} — ${e.description}`).join(" | ")}`);
  }
  return linhas.join("\n");
}

async function contextoDaEquipe(storage: IStorage, classData: Class, round: Round, team: Team, produtos: Product[]): Promise<string> {
  const setor = setorDa(classData);
  const { estadoAnterior } = await import("./roundCompletionCompetitive");
  const { categoriaDoProduto } = await import("./marketBulletin");
  const estado = await estadoAnterior(round.classId, round.roundNumber);
  const anterior = await rodadaAnterior(storage, round);
  const linhas: string[] = [];
  linhas.push(`Empresa: ${team.companyName || team.name}${team.slogan ? ` — "${team.slogan}"` : ""}.`);
  linhas.push(`Verba de marketing disponível nesta rodada: ${moeda(team.budget ?? 0)}.`);

  const resultado = anterior ? await storage.getResult(team.id, anterior.id) : undefined;
  if (!anterior || !estado) {
    linhas.push("A empresa ainda não tem histórico no mercado: marca nova, lembrança de marca baixa e sem base de clientes fiéis. Os concorrentes estabelecidos já são conhecidos do público.");
  } else if (!resultado) {
    linhas.push(`Na Rodada ${anterior.roundNumber}, a empresa não enviou decisão e ficou sem vendas; a lembrança de marca caiu.`);
  } else {
    const margem = resultado.revenue > 0 ? (resultado.profit / resultado.revenue) * 100 : 0;
    linhas.push(`Resultado da Rodada ${anterior.roundNumber}: receita ${moeda(resultado.revenue)}, lucro ${moeda(resultado.profit)} (margem ${pct(margem)}), participação de mercado ${pct(resultado.marketShare ?? 0)}.`);
  }

  for (const produto of produtos) {
    const cat = categoriaDoProduto(classData.sector, produto) ?? setor?.categories[0];
    if (!cat) continue;
    const catEstado = estado?.categorias?.find((c) => c.categoriaId === cat.id);
    const oferta = catEstado?.ofertas.find((o) => o.tipo === "equipe" && o.equipeId === team.id);
    if (catEstado && oferta) {
      const lider = [...catEstado.ofertas].sort((a, b) => b.participacaoValor - a.participacaoValor)[0];
      linhas.push(
        `Produto ${produto.name}: preço praticado ${moeda(oferta.preco)} (referência ${moeda(cat.averagePrice)}), qualidade ${oferta.qualidade}, cobertura ${oferta.cobertura}, ${oferta.canais.length} canal(is), comunicação ${moeda(oferta.comunicacao)}; ${Math.round(oferta.unidades).toLocaleString("pt-BR")} unidades; participação ${pct(oferta.participacaoValor)}; lembrança de marca ${pct(oferta.lembranca * 100, 0)}; satisfação ${Math.round(oferta.satisfacao)}/100. Líder da categoria: ${lider.empresa} com ${pct(lider.participacaoValor)}.`,
      );
    } else {
      linhas.push(`Produto ${produto.name} (categoria ${cat.name}, preço médio de referência ${moeda(cat.averagePrice)}): sem vendas registradas até agora.`);
    }
  }
  return linhas.join("\n");
}

// ---------------------------------------------------------------- IA

async function pedirJson<T>(sistema: string, usuario: string, schema: z.ZodType<T>): Promise<T> {
  let ultimoErro: unknown;
  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    try {
      const completion = await ia().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: sistema },
          { role: "user", content: usuario },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 2000,
      });
      const texto = completion.choices[0]?.message?.content;
      if (!texto) throw new Error("Resposta vazia");
      return schema.parse(JSON.parse(texto));
    } catch (e) {
      ultimoErro = e;
    }
  }
  throw ultimoErro;
}

async function gerarPestelPorter(contexto: string, conjuntura: string): Promise<PestelPorterDaTurma> {
  const sistema = `Você é o motor de cenários do Simula+, simulador educacional de marketing. Sua tarefa é descrever o ambiente de mercado de um setor no Brasil (praça: Rio Grande do Sul) com a Análise PESTEL e as 5 Forças de Porter (PORTER, 1979; 2008), fiéis à realidade.\n\n${REGRAS_DE_TEXTO}`;
  const usuario = `CONTEXTO DO MERCADO (dados reais e do jogo):
${contexto}
${conjuntura}

Produza um JSON exatamente neste formato:
{
  "pestel": {
    "political": ["2 a 4 fatores"],
    "economic": ["2 a 4 fatores, com os indicadores da conjuntura quando houver"],
    "social": ["2 a 4 fatores"],
    "technological": ["2 a 4 fatores"],
    "environmental": ["2 a 4 fatores"],
    "legal": ["2 a 4 fatores (cite apenas normas reais e conhecidas, sem número de lei se não tiver certeza)"]
  },
  "porter": {
    "competitiveRivalry": 1-10, "supplierPower": 1-10, "buyerPower": 1-10, "threatOfSubstitutes": 1-10, "threatOfNewEntry": 1-10,
    "rivalryNotes": "justificativa da nota (até 2 frases)",
    "supplierNotes": "...", "buyerNotes": "...", "substitutesNotes": "...", "newEntryNotes": "..."
  }
}
Notas de Porter: 1 = força muito fraca; 10 = muito forte. A rivalidade deve considerar o número de empresas e a concentração informados no contexto.`;
  return pedirJson(sistema, usuario, pestelPorterSchema);
}

async function gerarSwot(contextoMercado: string, contextoEquipe: string, pestelPorter: PestelPorterDaTurma): Promise<SwotDaEquipe> {
  const sistema = `Você é o motor de cenários do Simula+, simulador educacional de marketing. Sua tarefa é montar a Análise SWOT de UMA empresa do jogo: forças e fraquezas vêm dos números da própria empresa (ambiente interno); oportunidades e ameaças vêm do mercado (ambiente externo).\n\n${REGRAS_DE_TEXTO}`;
  const usuario = `MERCADO:
${contextoMercado}

PESTEL E PORTER DA TURMA (ambiente externo já analisado):
${JSON.stringify(pestelPorter)}

EMPRESA:
${contextoEquipe}

Produza um JSON exatamente neste formato:
{ "strengths": ["2 a 4"], "weaknesses": ["2 a 4"], "opportunities": ["2 a 4"], "threats": ["2 a 4"] }
Forças e fraquezas precisam se apoiar nos números da empresa informados acima (compare com o líder e com a referência de preço quando houver).`;
  return pedirJson(sistema, usuario, swotSchema);
}

// ---------------------------------------------------------------- gravação

async function lerAnalisesDaTurma(roundId: string): Promise<PestelPorterDaTurma | null> {
  try {
    const r = await pool.query(`SELECT pestel, porter FROM analises_turma WHERE round_id = $1`, [roundId]);
    if (!r.rows[0]) return null;
    return { pestel: r.rows[0].pestel, porter: r.rows[0].porter };
  } catch {
    return null;
  }
}

async function gravarAnalisesDaTurma(round: Round, dados: PestelPorterDaTurma): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO analises_turma (round_id, class_id, round_number, pestel, porter) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (round_id) DO UPDATE SET pestel = EXCLUDED.pestel, porter = EXCLUDED.porter, created_at = now()`,
      [round.id, round.classId, round.roundNumber, JSON.stringify(dados.pestel), JSON.stringify(dados.porter)],
    );
  } catch (e) {
    console.error("[ANALISES-IA] Falha ao gravar analises_turma:", e);
  }
}

/** Conteúdo gerado aqui PARA ESTA rodada (a cópia herdada da rodada anterior não conta). */
const geradoNaRodada = (conteudo: unknown, roundId: string) =>
  (conteudo as any)?.marca === MARCA_ANALISES_IA && (conteudo as any)?.rodada === roundId;

async function gravarPestel(storage: IStorage, team: Team, round: Round, p: PestelPorterDaTurma["pestel"]) {
  const campos = { ...p, aiGeneratedPercentage: 100, originalAIContent: { marca: MARCA_ANALISES_IA, rodada: round.id, ...p }, editedByUser: false };
  const atual = await storage.getPestelAnalysis(team.id, round.id);
  if (atual) await storage.updatePestelAnalysis(atual.id, campos as any);
  else await storage.createPestelAnalysis({ teamId: team.id, roundId: round.id, ...campos } as any);
}

async function gravarPorter(storage: IStorage, team: Team, round: Round, p: PestelPorterDaTurma["porter"]) {
  const campos = { ...p, aiGeneratedPercentage: 100, originalAIContent: { marca: MARCA_ANALISES_IA, rodada: round.id, ...p }, editedByUser: false };
  const atual = await storage.getPorterAnalysis(team.id, round.id);
  if (atual) await storage.updatePorterAnalysis(atual.id, campos as any);
  else await storage.createPorterAnalysis({ teamId: team.id, roundId: round.id, ...campos } as any);
}

async function gravarSwot(storage: IStorage, team: Team, round: Round, s: SwotDaEquipe) {
  const campos = { ...s, aiGeneratedPercentage: 100, originalAIContent: { marca: MARCA_ANALISES_IA, rodada: round.id, ...s }, editedByUser: false };
  const atual = await storage.getSwotAnalysis(team.id, round.id);
  if (atual) await storage.updateSwotAnalysis(atual.id, campos as any);
  else await storage.createSwotAnalysis({ teamId: team.id, roundId: round.id, ...campos } as any);
}

/** BCG pelos números do jogo: uma linha por produto da rodada. Sem IA. */
export async function calcularBcgDaEquipe(storage: IStorage, classData: Class, round: Round, team: Team, produtos: Product[]): Promise<number> {
  const setor = setorDa(classData);
  const { estadoAnterior } = await import("./roundCompletionCompetitive");
  const { categoriaDoProduto } = await import("./marketBulletin");
  const estado = await estadoAnterior(round.classId, round.roundNumber);
  const crescimento = Number(classData.marketGrowthRate ?? setor?.growthRate ?? 0);
  const fonteCrescimento = setor?.fonte?.crescimento;

  for (const antiga of await storage.getBcgAnalyses(team.id, round.id)) {
    await storage.deleteBcgAnalysis(antiga.id);
  }
  let gravadas = 0;
  for (const produto of produtos) {
    const cat = categoriaDoProduto(classData.sector, produto) ?? setor?.categories[0];
    const catEstado = cat ? estado?.categorias?.find((c) => c.categoriaId === cat.id) : undefined;
    const minha = catEstado?.ofertas.find((o) => o.tipo === "equipe" && o.equipeId === team.id);
    const participacao = minha?.participacaoValor ?? 0;
    const outras = (catEstado?.ofertas ?? []).filter((o) => o !== minha);
    const maior = outras.sort((a, b) => b.participacaoValor - a.participacaoValor)[0];
    const relativa = maior ? participacaoRelativa(participacao, maior.participacaoValor) ?? 0 : 0;
    const quadrante = classificarBcg(crescimento, relativa);
    const notas = catEstado
      ? `Participação de mercado na rodada anterior: ${pct(participacao)}. Maior concorrente: ${maior?.empresa ?? "—"}, com ${pct(maior?.participacaoValor ?? 0)}. Participação relativa: ${relativa.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}×. Crescimento do setor: ${pct(crescimento)} ao ano${fonteCrescimento ? ` (${fonteCrescimento})` : ""}.`
      : `Produto ainda sem vendas no jogo (participação relativa 0). Crescimento do setor: ${pct(crescimento)} ao ano${fonteCrescimento ? ` (${fonteCrescimento})` : ""}.`;
    await storage.createBcgAnalysis({
      teamId: team.id,
      roundId: round.id,
      productId: produto.id,
      productName: produto.name,
      marketGrowth: Math.round(crescimento * 10) / 10,
      relativeMarketShare: Math.round(relativa * 100) / 100,
      quadrant: quadrante,
      notes: notas,
      aiGeneratedPercentage: 100,
      originalAIContent: { marca: MARCA_ANALISES_IA, rodada: round.id, calculada: true, participacao, maiorConcorrente: maior?.empresa ?? null },
      editedByUser: false,
    } as any);
    gravadas++;
  }
  return gravadas;
}

// ---------------------------------------------------------------- orquestração

export interface ResultadoAnalisesDaRodada {
  aplicado: boolean;
  motivo?: string;
  pestelPorter: "gerado" | "reaproveitado" | "falhou";
  equipes: { teamId: string; nome: string; swot: "gerado" | "reaproveitado" | "falhou"; bcg: number }[];
}

/**
 * Prepara as análises da rodada para todas as equipes. Sem `forcar`, só gera
 * o que ainda não existe nesta rodada (PESTEL/Porter da turma e SWOT de cada
 * equipe); a BCG é sempre recalculada (é barata e só usa números do jogo).
 */
export async function prepararAnalisesDaRodada(
  storage: IStorage,
  roundId: string,
  opcoes: { forcar?: boolean } = {},
): Promise<ResultadoAnalisesDaRodada> {
  const round = await storage.getRound(roundId);
  if (!round) return { aplicado: false, motivo: "rodada não encontrada", pestelPorter: "falhou", equipes: [] };
  if (!(await turmaComAnalisesDaIA(storage, round.classId))) {
    return { aplicado: false, motivo: "turma no fluxo anterior", pestelPorter: "falhou", equipes: [] };
  }
  const classData = await storage.getClass(round.classId);
  if (!classData?.sector) return { aplicado: false, motivo: "turma sem setor", pestelPorter: "falhou", equipes: [] };
  const teams = await storage.getTeamsByClass(round.classId);
  const produtos = await produtosDaRodada(storage, classData, round);

  // A Segmentação é das equipes: herda a da rodada anterior, se ainda não existir nesta.
  try {
    const { carryForwardStrategyAnalyses } = await import("./strategyCarryForward");
    await carryForwardStrategyAnalyses(storage, round.id);
  } catch (e) {
    console.error("[ANALISES-IA] Falha ao herdar a segmentação:", e);
  }

  const contextoMercado = await contextoDoMercado(storage, classData, round, teams);
  const { getConjunturaParaPrompt } = await import("./conjuntura");
  const conjuntura = await getConjunturaParaPrompt(classData.id);

  // 1) PESTEL e Porter da turma
  let pestelPorter = opcoes.forcar ? null : await lerAnalisesDaTurma(round.id);
  let statusTurma: ResultadoAnalisesDaRodada["pestelPorter"] = pestelPorter ? "reaproveitado" : "gerado";
  if (!pestelPorter) {
    try {
      pestelPorter = await gerarPestelPorter(contextoMercado, conjuntura);
      await gravarAnalisesDaTurma(round, pestelPorter);
    } catch (e) {
      console.error("[ANALISES-IA] Falha ao gerar PESTEL/Porter da turma:", e);
      statusTurma = "falhou";
    }
  }

  // 2) Por equipe: PESTEL/Porter (iguais), SWOT (própria) e BCG (calculada)
  const equipes: ResultadoAnalisesDaRodada["equipes"] = [];
  for (const team of teams) {
    let swotStatus: ResultadoAnalisesDaRodada["equipes"][number]["swot"] = "reaproveitado";
    try {
      if (pestelPorter) {
        await gravarPestel(storage, team, round, pestelPorter.pestel);
        await gravarPorter(storage, team, round, pestelPorter.porter);
      }
      const swotAtual = await storage.getSwotAnalysis(team.id, round.id);
      if (opcoes.forcar || !swotAtual || !geradoNaRodada(swotAtual.originalAIContent, round.id)) {
        if (pestelPorter) {
          try {
            const contextoEquipe = await contextoDaEquipe(storage, classData, round, team, produtos);
            await gravarSwot(storage, team, round, await gerarSwot(contextoMercado, contextoEquipe, pestelPorter));
            swotStatus = "gerado";
          } catch (e) {
            console.error(`[ANALISES-IA] Falha ao gerar a SWOT de ${team.name}:`, e);
            swotStatus = "falhou";
          }
        } else {
          swotStatus = "falhou";
        }
      }
    } catch (e) {
      console.error(`[ANALISES-IA] Falha ao gravar análises de ${team.name}:`, e);
      swotStatus = "falhou";
    }
    let bcg = 0;
    try {
      bcg = await calcularBcgDaEquipe(storage, classData, round, team, produtos);
    } catch (e) {
      console.error(`[ANALISES-IA] Falha ao calcular a BCG de ${team.name}:`, e);
    }
    equipes.push({ teamId: team.id, nome: team.name, swot: swotStatus, bcg });
  }

  console.log(
    `[ANALISES-IA] Rodada ${round.roundNumber}: PESTEL/Porter ${statusTurma}; SWOT ${equipes.filter((e) => e.swot !== "falhou").length}/${teams.length}; BCG calculada para ${equipes.filter((e) => e.bcg > 0).length} equipe(s)`,
  );
  return { aplicado: true, pestelPorter: statusTurma, equipes };
}
