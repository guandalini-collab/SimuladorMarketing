/**
 * Encerramento da rodada com o motor de mercado competitivo (v3, out/2026).
 * Ver server/simulation/competitiveEngine.ts para as regras de mercado.
 *
 * Diferente do motor V1 (cada equipe calculada sozinha), aqui todas as
 * equipes e os concorrentes simulados disputam o mesmo mercado ao mesmo
 * tempo: primeiro reunimos as decisões de todos, depois calculamos as
 * fatias de cada categoria, e só então gravamos o resultado de cada equipe.
 *
 * O alinhamento estratégico (coerência entre análises e decisões) continua
 * valendo, mas age DENTRO do mercado — multiplica a atratividade da oferta —
 * em vez de reescrever receita e DRE depois do cálculo (o que quebraria a
 * soma de 100% das fatias e a coerência entre unidades, preço e receita).
 */
import type { IStorage } from "../storage";
import type { Class, MarketEvent, MarketingMix, Round, Team } from "@shared/schema";
import { pool } from "../pg-storage";
import { marketSectors } from "../data/marketData";
import { applyEquityCarryover, calculateEventImpact } from "../calculator";
import { consolidateKpis, type ResultCoreMetrics } from "../utils/consolidateKpis";
import { calculateStrategicAlignment } from "./strategicAlignment";
import { categoriaDoProduto, type MarketBulletin } from "./marketBulletin";
import {
  ALIQUOTA_IR_CSLL,
  PARTICIPACAO_RS,
  SEMANAS_NO_ANO,
  calcularCategoria,
  concorrentesDaTurma,
  custoDistribuicao,
  decisaoConcorrente,
  despesaAdministrativaCalibrada,
  proximaVerba,
  receitaReferencia,
  verbaInicial,
  type ContextoCategoria,
  type DecisaoProduto,
  type EstadoConcorrente,
  type Oferta,
  type ResultadoCategoria,
  type ResultadoOferta,
  CUSTO_COBERTURA,
  CUSTO_POR_CANAL,
} from "../simulation/competitiveEngine";

/** Liga/desliga o motor competitivo (rodadas de teste seguem no motor V1). */
export const MOTOR_COMPETITIVO_ATIVO = true;
export const VERSAO_MOTOR = "v3-competitivo";

export function usarMotorCompetitivo(round: Pick<Round, "isPractice">): boolean {
  return MOTOR_COMPETITIVO_ATIVO && round.isPractice !== true;
}

// ---------------------------------------------------------------- estado

export interface EstadoMercado {
  versao: string;
  equipes: Record<string, { verbaInicial: number; produtos: Record<string, { lembranca: number; fidelidade: number }> }>;
  concorrentes: Record<string, Record<string, EstadoConcorrente>>; // categoria -> concorrente -> estado
  categorias: {
    categoriaId: string;
    categoriaNome: string;
    precoReferencia: number;
    demandaUnidades: number;
    receitaTotal: number;
    precoMedioPraticado: number;
    ofertas: {
      empresa: string;
      tipo: "equipe" | "concorrente";
      equipeId?: string;
      perfil?: string;
      preco: number;
      unidades: number;
      participacaoValor: number;
      participacaoUnidades: number;
      lembranca: number;
      satisfacao: number;
      qualidade: string;
      cobertura: string;
      canais: string[];
      comunicacao: number;
    }[];
  }[];
}

async function estadoAnterior(classId: string, roundNumber: number): Promise<EstadoMercado | null> {
  const r = await pool.query(
    `SELECT estado FROM market_states WHERE class_id = $1 AND round_number < $2 ORDER BY round_number DESC LIMIT 1`,
    [classId, roundNumber],
  );
  return (r.rows[0]?.estado as EstadoMercado) ?? null;
}

async function salvarEstado(round: Round, estado: EstadoMercado): Promise<void> {
  await pool.query(
    `INSERT INTO market_states (round_id, class_id, round_number, estado) VALUES ($1, $2, $3, $4)
     ON CONFLICT (round_id) DO UPDATE SET estado = EXCLUDED.estado, created_at = now()`,
    [round.id, round.classId, round.roundNumber, JSON.stringify(estado)],
  );
}

export async function temEstadoDeMercado(classId: string): Promise<boolean> {
  const r = await pool.query(`SELECT 1 FROM market_states WHERE class_id = $1 LIMIT 1`, [classId]);
  return (r.rowCount ?? 0) > 0;
}

/**
 * Proteção para turmas já em andamento (zero breaking changes): uma turma que
 * já tem resultados de rodadas valendo calculados pelo motor V1 continua no
 * V1 até o fim, para não trocar as regras (e a verba) no meio do jogo. O motor
 * competitivo vale para turmas que começam do zero — ou que já estão nele.
 * Rodadas de teste não contam (são apagadas em "Iniciar o jogo").
 */
export async function turmaNoMotorCompetitivo(storage: IStorage, classId: string): Promise<boolean> {
  if (await temEstadoDeMercado(classId)) return true;
  const rodadas = await storage.getRoundsByClass(classId);
  for (const r of rodadas) {
    if (r.isPractice) continue;
    if ((await storage.getResultsByRound(r.id)).length > 0) return false;
  }
  return true;
}

/** Decide o motor da rodada: competitivo só fora da rodada de teste e em turma elegível. */
export async function rodadaNoMotorCompetitivo(storage: IStorage, round: Pick<Round, "isPractice" | "classId">): Promise<boolean> {
  if (!usarMotorCompetitivo(round)) return false;
  return turmaNoMotorCompetitivo(storage, round.classId);
}

// ---------------------------------------------------------------- contexto

export function setorDaTurma(classData: Pick<Class, "sector">) {
  return marketSectors.find((s) => s.id === classData.sector) ?? null;
}

/** Valor semanal de uma categoria na praça (RS), ao preço de referência. */
export function valorSemanalCategoria(classData: Pick<Class, "sector" | "marketSize">): number {
  const setor = setorDaTurma(classData);
  if (!setor) return 0;
  const anual = classData.marketSize && classData.marketSize > 0 ? classData.marketSize : setor.marketSize;
  return (anual * PARTICIPACAO_RS) / SEMANAS_NO_ANO / Math.max(1, setor.categories.length);
}

export function numeroDeConcorrentes(classData: Pick<Class, "numberOfCompetitors">): number {
  const n = classData.numberOfCompetitors ?? 4;
  return Math.min(12, Math.max(1, n > 0 ? n : 4));
}

/** Receita de referência por empresa numa categoria (R$/semana) para a turma. */
export function receitaReferenciaDaTurma(classData: Class, numeroEquipes: number): number {
  return receitaReferencia({
    valorSemanal: valorSemanalCategoria(classData),
    numeroEmpresas: Math.max(1, numeroEquipes) + numeroDeConcorrentes(classData),
  });
}

export function verbaInicialDaTurma(classData: Class, numeroEquipes: number, numeroProdutos: number): number {
  const setor = setorDaTurma(classData);
  if (!setor?.verbaMarketingPct) return 0;
  return verbaInicial(receitaReferenciaDaTurma(classData, numeroEquipes), setor.verbaMarketingPct, numeroProdutos);
}

/** Custo da decisão no motor competitivo: comunicação (mídias) + distribuição. */
export function custoDecisaoCompetitiva(mix: Pick<MarketingMix, "promotionBudgets" | "distributionChannels" | "distributionCoverage">, receitaRef: number): number {
  const midias = Object.values((mix.promotionBudgets as Record<string, number> | null) ?? {}).reduce((s, v) => s + (Number(v) || 0), 0);
  return midias + custoDistribuicao({ canais: mix.distributionChannels ?? [], cobertura: mix.distributionCoverage ?? "regional" }, receitaRef);
}

const MULT_DEMANDA: Record<string, number> = { retracao: 0.9, estavel: 1.0, aquecida: 1.1 };
const MULT_SENSIBILIDADE: Record<string, number> = { alta: 1.2, normal: 1.0, baixa: 0.85 };

function decisaoDaEquipe(mix: MarketingMix): DecisaoProduto {
  const midias = Object.values((mix.promotionBudgets as Record<string, number> | null) ?? {}).reduce((s, v) => s + (Number(v) || 0), 0);
  return {
    qualidade: mix.productQuality,
    recursos: mix.productFeatures,
    posicionamento: mix.brandPositioning,
    estrategiaPreco: mix.priceStrategy,
    preco: mix.priceValue,
    canais: mix.distributionChannels ?? [],
    cobertura: mix.distributionCoverage ?? "regional",
    investimentoComunicacao: midias,
  };
}

// ---------------------------------------------------------------- KPIs

function kpisDaOferta(o: ResultadoOferta, categoria: ResultadoCategoria): ResultCoreMetrics {
  const receitaBruta = o.receitaBruta;
  const impostos = o.tributos;
  const receitaLiquida = receitaBruta - impostos;
  const cpv = o.cpv;
  const lucroBruto = receitaLiquida - cpv;
  const despesasVendas = o.comunicacao + o.distribuicao;
  const despesasAdmin = o.administrativo;
  const ebitda = lucroBruto - despesasVendas - despesasAdmin;
  const lair = ebitda;
  const irCsll = lair > 0 ? lair * ALIQUOTA_IR_CSLL : 0;
  const lucroLiquido = lair - irCsll;
  const costs = impostos + cpv + despesasVendas + despesasAdmin;
  const profit = receitaBruta - costs;

  const fid = o.fidelidade;
  const retencao = Math.min(0.9, fid / 100);
  const novosClientes = Math.max(1, o.unidades * (1 - retencao * 0.5));
  const margemUnitaria = o.preco * (1 - 0.12) - o.custoUnitario;
  const ltv = margemUnitaria / Math.max(0.1, 1 - retencao);
  const cac = o.comunicacao / novosClientes;
  const alcance = Math.max(1, categoria.demandaUnidades * o.lembranca);
  const fornecedores = cpv * 0.3;
  const contasReceber = receitaLiquida * 0.25;

  return {
    revenue: receitaBruta,
    costs,
    profit,
    margin: receitaBruta > 0 ? (profit / receitaBruta) * 100 : 0,
    marketShare: o.participacaoValor,
    roi: costs > 0 ? (profit / costs) * 100 : 0,
    brandPerception: Math.round(o.lembranca * 1000) / 10,
    customerSatisfaction: o.satisfacao,
    customerLoyalty: fid,
    cac,
    ltv,
    taxaConversao: Math.min(100, (o.unidades / alcance) * 100),
    ticketMedio: o.preco,
    razaoLtvCac: cac > 0 ? ltv / cac : 0,
    nps: Math.max(-100, Math.min(100, (o.satisfacao - 50) * 1.6)),
    tempoMedioConversao: Math.max(1, 30 - 0.25 * o.satisfacao),
    margemContribuicao: receitaLiquida - cpv - o.distribuicao,
    receitaBruta,
    receitaLiquida,
    impostos,
    devolucoes: 0,
    descontos: 0,
    cpv,
    lucroBruto,
    despesasVendas,
    despesasAdmin,
    despesasFinanc: 0,
    outrasDespesas: 0,
    ebitda,
    depreciacao: 0,
    lair,
    irCsll,
    lucroLiquido,
    caixa: 0,
    contasReceber,
    estoques: 0,
    ativoCirculante: 0,
    imobilizado: 0,
    intangivel: 0,
    ativoNaoCirculante: 0,
    ativoTotal: 0,
    fornecedores,
    obrigFiscais: irCsll,
    outrasObrig: 0,
    passivoCirculante: fornecedores + irCsll,
    financiamentosLP: 0,
    passivoNaoCirculante: 0,
    capitalSocial: 0,
    lucrosAcumulados: 0,
    patrimonioLiquido: 0,
    passivoPlTotal: 0,
  } as ResultCoreMetrics;
}

const arred = (k: ResultCoreMetrics): ResultCoreMetrics =>
  Object.fromEntries(Object.entries(k).map(([c, v]) => [c, typeof v === "number" ? Math.round(v * 100) / 100 : v])) as ResultCoreMetrics;

// ---------------------------------------------------------------- processamento

export async function processarMercadoCompetitivo(
  storage: IStorage,
  round: Round,
  classData: Class,
  teams: Team[],
  activeEvents: MarketEvent[],
  bulletin: MarketBulletin | null,
): Promise<void> {
  const setor = setorDaTurma(classData);
  if (!setor || !setor.margemBruta || !setor.verbaMarketingPct || setor.margemLiquida === undefined) {
    throw new Error("Turma sem setor configurado: o motor competitivo precisa do setor para calcular o mercado.");
  }

  const anterior = await estadoAnterior(classData.id, round.roundNumber);
  const perfis = concorrentesDaTurma(numeroDeConcorrentes(classData));
  const valorSemanal = valorSemanalCategoria(classData);
  const numeroEmpresas = teams.length + perfis.length;
  const receitaRef = receitaReferencia({ valorSemanal, numeroEmpresas });
  const despesaAdminPct = despesaAdministrativaCalibrada(setor.margemBruta, setor.verbaMarketingPct, setor.margemLiquida);
  const multDemanda = (MULT_DEMANDA[bulletin?.demand ?? "estavel"] ?? 1) * calculateEventImpact(activeEvents);
  const multSensibilidade = MULT_SENSIBILIDADE[bulletin?.priceSensitivity ?? "normal"] ?? 1;

  // 1) Decisões enviadas de cada equipe, agrupadas por categoria
  interface ItemEquipe { team: Team; mix: MarketingMix; categoriaId: string; alinhamento: ReturnType<typeof calculateStrategicAlignment> }
  const porCategoria = new Map<string, ItemEquipe[]>();
  const enviaram = new Set<string>();
  for (const team of teams) {
    if (await storage.getResult(team.id, round.id)) continue; // idempotência
    const mixes = (await storage.getMarketingMixesByTeamAndRound(team.id, round.id)).filter((m) => m.submittedAt !== null);
    if (mixes.length === 0) continue;
    enviaram.add(team.id);
    const swot = await storage.getSwotAnalysis(team.id, round.id);
    const porter = await storage.getPorterAnalysis(team.id, round.id);
    const bcg = await storage.getBcgAnalyses(team.id, round.id);
    const pestel = await storage.getPestelAnalysis(team.id, round.id);
    const segmentation = await storage.getMarketSegmentationsByTeamAndRound(team.id, round.id);
    for (const mix of mixes) {
      const produto = mix.productId ? await storage.getProduct(mix.productId) : undefined;
      const categoria = categoriaDoProduto(classData.sector, produto ?? null) ?? setor.categories[0];
      const alinhamento = calculateStrategicAlignment({
        swot: swot ?? null,
        porter: porter ?? null,
        bcg: bcg[0] ?? null,
        pestel: pestel ?? null,
        segmentation,
        businessType: classData.businessType,
        marketingMix: mix,
        aiAssistanceLevel: round.aiAssistanceLevel ?? 1,
        swotAiPercentage: swot?.aiGeneratedPercentage ?? undefined,
        porterAiPercentage: porter?.aiGeneratedPercentage ?? undefined,
        bcgAiPercentage: bcg[0]?.aiGeneratedPercentage ?? undefined,
        pestelAiPercentage: pestel?.aiGeneratedPercentage ?? undefined,
      });
      const lista = porCategoria.get(categoria.id) ?? [];
      lista.push({ team, mix, categoriaId: categoria.id, alinhamento });
      porCategoria.set(categoria.id, lista);
    }
  }

  const novoEstado: EstadoMercado = { versao: VERSAO_MOTOR, equipes: {}, concorrentes: {}, categorias: [] };
  for (const team of teams) {
    const prev = anterior?.equipes?.[team.id];
    novoEstado.equipes[team.id] = {
      verbaInicial: prev?.verbaInicial ?? verbaInicial(receitaRef, setor.verbaMarketingPct, round.productCount ?? 1),
      // Quem não enviou decisão perde lembrança de marca (sem comunicação na semana).
      produtos: Object.fromEntries(
        Object.entries(prev?.produtos ?? {}).map(([cat, e]) => [cat, { lembranca: e.lembranca * 0.7, fidelidade: e.fidelidade * 0.9 }]),
      ),
    };
  }

  // 2) Mercado de cada categoria em que há ofertas de equipes
  const kpisPorEquipe = new Map<string, { kpis: ResultCoreMetrics; mix: MarketingMix; alinhamento: ItemEquipe["alinhamento"] }[]>();
  for (const [categoriaId, itens] of Array.from(porCategoria.entries())) {
    const categoria = setor.categories.find((c) => c.id === categoriaId)!;
    const ctx: ContextoCategoria = {
      setorId: setor.id,
      categoriaId,
      categoriaNome: categoria.name,
      precoReferencia: categoria.averagePrice,
      valorSemanal,
      margemBruta: setor.margemBruta,
      verbaMarketingPct: setor.verbaMarketingPct,
      despesaAdminPct,
      numeroEmpresas,
      multiplicadorDemanda: multDemanda,
      multiplicadorSensibilidade: multSensibilidade,
    };
    const decisoesEquipes = itens.map((i) => decisaoDaEquipe(i.mix));
    const mediaPreco = decisoesEquipes.reduce((s, d) => s + d.preco, 0) / decisoesEquipes.length;
    const mediaComunicacao = decisoesEquipes.reduce((s, d) => s + d.investimentoComunicacao, 0) / decisoesEquipes.length;

    const ofertas: Oferta[] = itens.map((i, idx) => {
      const prev = anterior?.equipes?.[i.team.id]?.produtos?.[categoriaId];
      return {
        id: `${i.team.id}:${i.mix.id}`,
        tipo: "equipe",
        empresa: i.team.companyName || i.team.name,
        equipeId: i.team.id,
        produtoId: i.mix.productId ?? undefined,
        decisao: decisoesEquipes[idx],
        lembrancaAnterior: prev?.lembranca ?? 0.25,
        fidelidadeAnterior: prev?.fidelidade ?? 50,
      };
    });
    const estadoConc = anterior?.concorrentes?.[categoriaId] ?? {};
    for (const p of perfis) {
      const d = decisaoConcorrente(p, categoria.averagePrice, valorSemanal, estadoConc[p.id], mediaPreco, mediaComunicacao);
      ofertas.push({
        id: `conc:${p.id}`,
        tipo: "concorrente",
        empresa: p.nome,
        decisao: d,
        lembrancaAnterior: estadoConc[p.id]?.lembranca ?? p.lembrancaInicial,
        fidelidadeAnterior: estadoConc[p.id]?.fidelidade ?? p.fidelidadeInicial,
      });
    }

    // Alinhamento estratégico entra como multiplicador da atratividade (via
    // demanda da oferta): aplicamos sobre a lembrança usada no cálculo para
    // não alterar a estrutura do núcleo puro.
    const ajustadas = ofertas.map((o, idx) => {
      if (o.tipo !== "equipe") return o;
      const mod = itens[idx].alinhamento.kpiModifiers.revenueModifier ?? 0;
      return { ...o, decisao: { ...o.decisao }, fatorAlinhamento: Math.max(0.5, 1 + mod) };
    });
    const resultado = calcularCategoriaComAlinhamento(ctx, ajustadas);

    novoEstado.concorrentes[categoriaId] = {};
    for (const o of resultado.ofertas) {
      if (o.tipo === "concorrente") {
        const id = o.id.replace("conc:", "");
        novoEstado.concorrentes[categoriaId][id] = { preco: o.preco, comunicacao: o.comunicacao, lembranca: o.lembranca, fidelidade: o.fidelidade };
      } else if (o.equipeId) {
        novoEstado.equipes[o.equipeId].produtos[categoriaId] = { lembranca: o.lembranca, fidelidade: o.fidelidade };
        const item = itens.find((i) => `${i.team.id}:${i.mix.id}` === o.id)!;
        const lista = kpisPorEquipe.get(o.equipeId) ?? [];
        lista.push({ kpis: kpisDaOferta(o, resultado), mix: item.mix, alinhamento: item.alinhamento });
        kpisPorEquipe.set(o.equipeId, lista);
      }
    }
    novoEstado.categorias.push({
      categoriaId,
      categoriaNome: categoria.name,
      precoReferencia: categoria.averagePrice,
      demandaUnidades: resultado.demandaUnidades,
      receitaTotal: resultado.receitaTotal,
      precoMedioPraticado: resultado.precoMedioPraticado,
      ofertas: resultado.ofertas.map((o, idx) => {
        const d = ajustadas[idx].decisao;
        return {
          empresa: o.empresa,
          tipo: o.tipo,
          equipeId: o.equipeId,
          perfil: o.tipo === "concorrente" ? perfis.find((p) => `conc:${p.id}` === o.id)?.perfil : undefined,
          preco: o.preco,
          unidades: o.unidades,
          participacaoValor: Math.round(o.participacaoValor * 100) / 100,
          participacaoUnidades: Math.round(o.participacaoUnidades * 100) / 100,
          lembranca: Math.round(o.lembranca * 1000) / 1000,
          satisfacao: Math.round(o.satisfacao * 10) / 10,
          qualidade: d.qualidade,
          cobertura: d.cobertura,
          canais: d.canais,
          comunicacao: Math.round(o.comunicacao),
        };
      }),
    });
  }

  // 3) Grava o resultado de cada equipe que enviou decisão
  for (const team of teams) {
    const lista = kpisPorEquipe.get(team.id);
    if (!lista || lista.length === 0) continue;
    for (const item of lista) {
      await storage.createProductResult({
        teamId: team.id,
        roundId: round.id,
        productId: item.mix.productId ?? "default",
        ...arred(item.kpis),
        budgetBefore: team.budget,
        profitImpact: item.kpis.profit,
        budgetAfter: team.budget,
        alignmentScore: item.alinhamento.overallScore,
        alignmentIssues: item.alinhamento.penalties.map((p) => p.description),
      } as any);
    }
    const consolidado = consolidateKpis(lista.map((l) => l.kpis));
    const previousResult = await storage.getPreviousRoundResult(team.id, round.id);
    const comPatrimonio = applyEquityCarryover(consolidado, team.initialBudget * 0.5, previousResult?.lucrosAcumulados ?? 0);
    const melhor = lista.reduce((a, b) => (b.kpis.revenue > a.kpis.revenue ? b : a));
    const verbaIni = novoEstado.equipes[team.id].verbaInicial;
    const budgetAfter = proximaVerba(consolidado.revenue, setor.verbaMarketingPct, verbaIni);
    await storage.createResult({
      teamId: team.id,
      roundId: round.id,
      ...arred(comPatrimonio),
      budgetBefore: team.budget,
      profitImpact: Math.round(consolidado.profit * 100) / 100,
      budgetAfter,
      alignmentScore: melhor.alinhamento.overallScore,
      alignmentIssues: melhor.alinhamento.penalties.map((p) => p.description),
      simulationBreakdown: {
        motor: VERSAO_MOTOR,
        praca: "Rio Grande do Sul",
        verbaInicial: verbaIni,
        proximaVerba: budgetAfter,
        produtos: lista.map((l) => ({ productId: l.mix.productId, receita: l.kpis.revenue, lucro: l.kpis.profit })),
        multiplicadorDemanda: multDemanda,
        multiplicadorSensibilidade: multSensibilidade,
      },
      competitorResponse: null,
      eventImpacts: null,
      engineVersion: VERSAO_MOTOR,
    } as any);
    await storage.updateTeam(team.id, { budget: budgetAfter });
    console.log(`[MOTOR-V3] Equipe ${team.id}: receita ${Math.round(consolidado.revenue)}, lucro ${Math.round(consolidado.profit)}, próxima verba ${budgetAfter}`);
  }

  // Equipes que não enviaram: próxima verba = a mesma (não houve receita) ou o piso
  for (const team of teams) {
    if (enviaram.has(team.id)) continue;
    const verbaIni = novoEstado.equipes[team.id].verbaInicial;
    const piso = proximaVerba(0, setor.verbaMarketingPct, verbaIni);
    if (team.budget > piso) await storage.updateTeam(team.id, { budget: piso });
  }

  await salvarEstado(round, novoEstado);
  console.log(`[MOTOR-V3] Rodada ${round.roundNumber} da turma ${classData.id}: ${novoEstado.categorias.length} categoria(s), ${kpisPorEquipe.size} equipe(s) com resultado`);
}

/** Aplica o fator de alinhamento como multiplicador direto da atratividade. */
function calcularCategoriaComAlinhamento(ctx: ContextoCategoria, ofertas: (Oferta & { fatorAlinhamento?: number })[]): ResultadoCategoria {
  // O fator entra como "lembrança efetiva": atratividade ∝ lembrança^0,6,
  // então lembrança × fator^(1/0,6) equivale a multiplicar a atratividade
  // por "fator". A lembrança gravada para a próxima rodada é a real.
  const fatores = ofertas.map((o) => o.fatorAlinhamento ?? 1);
  const resultado = calcularCategoria(
    ctx,
    ofertas.map((o, i) => ({ ...o, lembrancaAnterior: o.lembrancaAnterior })),
    fatores,
  );
  return resultado;
}

/**
 * Custo estimado de uma decisão, usado na validação de orçamento das telas
 * de decisão. No motor competitivo a verba cobre o que a equipe de fato
 * gasta: mídias escolhidas + distribuição. Fora dele (rodada de teste, motor
 * V1), mantém a estimativa antiga (calculateMarketingSpend).
 */
export async function custoEstimadoDaDecisao(
  storage: IStorage,
  team: Pick<Team, "classId">,
  mix: MarketingMix,
  classData: Class | undefined,
  custoAntigo: () => number,
): Promise<number> {
  if (!classData) return custoAntigo();
  const round = await storage.getCurrentRound(team.classId);
  if (!round || !setorDaTurma(classData)?.verbaMarketingPct || !(await rodadaNoMotorCompetitivo(storage, round))) return custoAntigo();
  const teams = await storage.getTeamsByClass(team.classId);
  return custoDecisaoCompetitiva(mix, receitaReferenciaDaTurma(classData, teams.length));
}

/**
 * Parâmetros de custo exibidos na tela de decisões (somente leitura).
 * Fora do motor competitivo, `ativo` é false e a tela segue como antes.
 */
export async function parametrosDeCustoDaEquipe(
  storage: IStorage,
  team: Pick<Team, "classId">,
): Promise<{ ativo: boolean; receitaReferencia: number; custoCobertura: Record<string, number>; custoPorCanal: number }> {
  const inativo = { ativo: false, receitaReferencia: 0, custoCobertura: {}, custoPorCanal: 0 };
  const classData = await storage.getClass(team.classId);
  if (!classData) return inativo;
  const round = await storage.getCurrentRound(team.classId);
  if (!round || !setorDaTurma(classData)?.verbaMarketingPct || !(await rodadaNoMotorCompetitivo(storage, round))) return inativo;
  const teams = await storage.getTeamsByClass(team.classId);
  return {
    ativo: true,
    receitaReferencia: receitaReferenciaDaTurma(classData, teams.length),
    custoCobertura: { ...CUSTO_COBERTURA },
    custoPorCanal: CUSTO_POR_CANAL,
  };
}
