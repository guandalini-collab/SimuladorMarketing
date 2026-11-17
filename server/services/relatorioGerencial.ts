/**
 * Relatório gerencial da rodada (nov/2026, pedido do professor).
 *
 * Substitui o feedback da IA para os alunos. É montado pelo próprio simulador
 * com os números gravados no fechamento das rodadas: não há texto de IA nem
 * conselho de decisão. Estrutura aprovada pelo professor em 17/11/2026, com
 * base em Kotler e Keller (2019, cap. 23: controle do plano anual e as
 * análises de vendas, participação, despesas ÷ vendas e lucratividade),
 * Farris et al. (2016: painel de indicadores ao longo do tempo) e Kaplan e
 * Norton (1996: indicadores de resultado e indicadores que os antecedem).
 *
 * Só leitura: nada é gravado e nenhum resultado muda.
 */
import type { IStorage } from "../storage";
import type { Class, Round, Team } from "@shared/schema";
import { montarRelatorioDaRodada, type ProdutoRelatorio } from "./relatorioProfessor";
import { receitaReferenciaDaTurma, setorDaTurma } from "./roundCompletionCompetitive";
import { categoriaDoProduto } from "./marketBulletin";
import { pool } from "../pg-storage";
import { explicarAlerta, nomesCanais, PESO_PONTO_FERRAMENTA, type ExplicacaoAlerta } from "@shared/alertasAlinhamento";
import { TOPICOS_B2C, sanearCodigos, type CriterioSegmentacao } from "@shared/segmentacao";

const TRIBUTOS = 0.12;
const PESOS_NOTA = { profit: 0.25, roi: 0.2, marketShare: 0.15, nps: 0.15, margin: 0.15 } as const;

export interface LinhaPainel {
  grupo: "Resultados financeiros" | "Mercado e clientes" | "Decisões de marketing";
  indicador: string;
  casas: number;
  moeda?: boolean;
  /** valor por número de rodada */
  valores: Record<number, number | null>;
  mediaTurma: number | null;
  posicao: number | null;
  equipesNaTurma: number;
  /** true quando o menor valor é o melhor (ex.: CAC) */
  menorMelhor?: boolean;
  /** variação expressa em pontos percentuais em vez de % */
  variacaoEmPontos?: boolean;
}

export interface LinhaVendas {
  produto: string;
  precoAnterior: number | null;
  precoAtual: number | null;
  unidadesAnterior: number | null;
  unidadesAtual: number | null;
  efeitoPreco: number | null;
  efeitoVolume: number | null;
  variacao: number;
}

export interface EmpresaNaCategoria { empresa: string; participacao: number; suaEmpresa: boolean; simulado: boolean }

export interface ParticipacaoProduto {
  produto: string;
  serie: Record<number, number | null>;
  lider: { empresa: string; participacao: number } | null;
  relativa: number | null;
  mediaPorEmpresa: number | null;
  empresasNaCategoria: number;
  empresas: EmpresaNaCategoria[];
  /** true quando o produto não foi vendido na rodada do relatório (só aparece pelo histórico) */
  ausente?: boolean;
}

export interface DreProduto {
  produto: string;
  anterior: Dre | null;
  atual: Dre;
}
export interface Dre {
  receitaBruta: number; tributos: number; receitaLiquida: number; cpv: number; lucroBruto: number;
  comunicacao: number; distribuicao: number; administrativas: number; resultado: number; margem: number;
  unidades: number; preco: number; receitaLiquidaUnidade: number; custoUnidade: number;
}

export interface AlertaProduto extends ExplicacaoAlerta { efeitoNaNota: number }
export interface AlinhamentoProduto {
  produto: string;
  nota: number | null;
  notaAnterior: number | null;
  partes: { ferramenta: string; pontos: number }[];
  alertas: AlertaProduto[];
}

/** Seção "Das análises às decisões" (pedido do professor, 17/11/2026). */
export interface ForcaPorter { nome: string; mede: string; atual: number | null; anterior: number | null }
export interface DecisaoProduto {
  produto: string;
  forcas: ForcaPorter[];
  preco: number;
  precoAnterior: number | null;
  precoReferencia: number;
  comunicacao: number;
  comunicacaoAnterior: number | null;
  canais: string[];
  canaisAnterior: string[] | null;
  bcg: { quadrante: string | null; crescimento: number | null; relativa: number | null; quadranteAnterior: string | null; relativaAnterior: number | null } | null;
  publico: { topico: string; opcoes: string[] }[];
  alertasPorFerramenta: Record<string, string[]>;
}

export interface ItemNota { indicador: string; valor: number; menor: number | null; maior: number | null; pontos: number; peso: number; contribuicao: number; casas: number; moeda?: boolean }

export interface RelatorioGerencial {
  empresa: string;
  turma: string;
  setor: string;
  rodada: number;
  encerradaEm: string | null;
  produtosAtuais: string[];
  produtosAnteriores: string[];
  rodadas: number[];
  equipesNaTurma: number;
  painel: LinhaPainel[];
  serieReceitaLucro: { rodadas: number[]; receita: (number | null)[]; lucro: (number | null)[]; receitaTurma: (number | null)[]; lucroTurma: (number | null)[] };
  fatos: string[];
  vendas: { linhas: LinhaVendas[]; efeitoPreco: number; efeitoVolume: number; variacao: number } | null;
  participacao: ParticipacaoProduto[];
  despesas: { comunicacao: Record<number, number | null>; distribuicao: Record<number, number | null>; verbaUsada: Record<number, number | null> };
  dre: DreProduto[];
  dreEmpresa: Dre;
  produtosQueSairam: { produto: string; receitaBruta: number; resultado: number }[];
  /** Produtos vendidos na rodada anterior que não fizeram parte desta (DRE da rodada anterior). */
  dreAusentes: { produto: string; anterior: Dre }[];
  alinhamento: AlinhamentoProduto[];
  decisoes: DecisaoProduto[];
  /** Limite de comunicação usado pelas regras (15% da verba de referência do produto). */
  limiteComunicacao: number;
  nota: { itens: ItemNota[]; total: number; anterior: number | null; posicao: number | null } | null;
  formulas: { indicador: string; conta: string; fonte: string }[];
}

const reais = (v: number) => (Math.round(v) < 0 ? "−" : "") + "R$ " + Math.abs(Math.round(v)).toLocaleString("pt-BR");
const reais2 = (v: number) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const n0 = (v: number) => Math.round(v).toLocaleString("pt-BR");
const dec = (v: number, c = 1) => v.toLocaleString("pt-BR", { minimumFractionDigits: c, maximumFractionDigits: c });
const varPct = (a: number, b: number) => (a !== 0 ? ((b - a) / Math.abs(a)) * 100 : null);

function nomeEquipe(t: Pick<Team, "name" | "companyName">): string {
  return ((t as any).companyName || t.name || "").trim();
}

function dreDe(p: ProdutoRelatorio): Dre {
  const receitaLiquida = p.receitaBruta * (1 - TRIBUTOS);
  const lucroBruto = p.lucroBruto;
  return {
    receitaBruta: p.receitaBruta,
    tributos: p.receitaBruta * TRIBUTOS,
    receitaLiquida,
    cpv: receitaLiquida - lucroBruto,
    lucroBruto,
    comunicacao: p.comunicacao,
    distribuicao: p.distribuicao,
    administrativas: p.administrativas,
    resultado: p.resultado,
    margem: p.receitaBruta > 0 ? (p.resultado / p.receitaBruta) * 100 : 0,
    unidades: p.unidades,
    preco: p.preco,
    receitaLiquidaUnidade: p.receitaLiquidaUnidade,
    custoUnidade: p.custoProducaoUnidade,
  };
}

function somaDre(lista: Dre[]): Dre {
  const z: Dre = { receitaBruta: 0, tributos: 0, receitaLiquida: 0, cpv: 0, lucroBruto: 0, comunicacao: 0, distribuicao: 0, administrativas: 0, resultado: 0, margem: 0, unidades: 0, preco: 0, receitaLiquidaUnidade: 0, custoUnidade: 0 };
  for (const d of lista) {
    z.receitaBruta += d.receitaBruta; z.tributos += d.tributos; z.receitaLiquida += d.receitaLiquida; z.cpv += d.cpv;
    z.lucroBruto += d.lucroBruto; z.comunicacao += d.comunicacao; z.distribuicao += d.distribuicao;
    z.administrativas += d.administrativas; z.resultado += d.resultado; z.unidades += d.unidades;
  }
  z.margem = z.receitaBruta > 0 ? (z.resultado / z.receitaBruta) * 100 : 0;
  return z;
}

const normaliza = (v: number, min: number, max: number) => (max === min ? 50 : Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100)));

/** Nota da rodada: mesma conta do painel do professor (professor.tsx, calculateGrade). */
export function notaDaRodada(resultado: any, todos: any[]): { itens: ItemNota[]; total: number } {
  const faixa = (campo: string) => {
    const v = todos.map((r) => Number(r[campo]) || 0);
    return { min: Math.min(...v), max: Math.max(...v) };
  };
  const nomes: Record<string, { nome: string; casas: number; moeda?: boolean }> = {
    profit: { nome: "Lucro antes do IR (R$)", casas: 0, moeda: true },
    roi: { nome: "ROI (%)", casas: 1 },
    marketShare: { nome: "Participação média (%)", casas: 2 },
    nps: { nome: "NPS estimado", casas: 1 },
    margin: { nome: "Margem (%)", casas: 1 },
  };
  const itens: ItemNota[] = [];
  let total = 0;
  const pontosLista: number[] = [];
  for (const campo of Object.keys(PESOS_NOTA) as (keyof typeof PESOS_NOTA)[]) {
    const f = faixa(campo);
    const valor = Number(resultado[campo]) || 0;
    const pontos = normaliza(valor, f.min, f.max);
    pontosLista.push(pontos);
    const peso = PESOS_NOTA[campo];
    itens.push({ indicador: nomes[campo].nome, valor, menor: f.min, maior: f.max, pontos, peso, contribuicao: pontos * peso, casas: nomes[campo].casas, moeda: nomes[campo].moeda });
    total += pontos * peso;
  }
  const alinh = resultado.alignmentScore;
  if (alinh !== null && alinh !== undefined) {
    const v = Number(alinh) || 0;
    itens.push({ indicador: "Alinhamento estratégico", valor: v, menor: null, maior: null, pontos: v, peso: 0.1, contribuicao: v * 0.1, casas: 0 });
    total += v * 0.1;
  } else {
    // Sem alinhamento: o peso é redistribuído igualmente entre os cinco indicadores.
    const extra = pontosLista.reduce((s, p) => s + p * 0.02, 0);
    itens.forEach((it, i) => { it.peso += 0.02; it.contribuicao += pontosLista[i] * 0.02; });
    total += extra;
  }
  return { itens, total };
}

export async function montarRelatorioGerencial(storage: IStorage, classData: Class, team: Team, round: Round): Promise<RelatorioGerencial> {
  const todasRodadas = (await storage.getRoundsByClass(classData.id))
    .filter((r) => r.status === "completed" && !r.isPractice && r.roundNumber <= round.roundNumber)
    .sort((a, b) => a.roundNumber - b.roundNumber);
  const teams = await storage.getTeamsByClass(classData.id);
  const empresa = nomeEquipe(team);
  const setor = setorDaTurma(classData);

  // Resultados consolidados (equipe) de todas as equipes em cada rodada.
  const porRodada = new Map<number, any[]>();
  for (const r of todasRodadas) porRodada.set(r.roundNumber, await storage.getResultsByRound(r.id));
  const minha = (n: number) => (porRodada.get(n) ?? []).find((x: any) => x.teamId === team.id) ?? null;
  const rodadas = todasRodadas.filter((r) => minha(r.roundNumber)).map((r) => r.roundNumber);
  const atual = minha(round.roundNumber);
  if (!atual) throw new Error("A equipe não tem resultado nesta rodada.");
  const doAtual = porRodada.get(round.roundNumber) ?? [];

  // Detalhe por produto (mesmas contas do relatório do professor).
  const detalhe = new Map<number, ProdutoRelatorio[]>();
  for (const n of rodadas.slice(-2)) {
    const r = todasRodadas.find((x) => x.roundNumber === n)!;
    const rel = await montarRelatorioDaRodada(storage, classData, r);
    detalhe.set(n, rel.equipes.find((e) => e.equipeId === team.id)?.produtos ?? []);
  }
  const anteriorN = rodadas.length >= 2 ? rodadas[rodadas.length - 2] : null;
  const prodAtual = detalhe.get(round.roundNumber) ?? [];
  const prodAnterior = anteriorN != null ? detalhe.get(anteriorN) ?? [] : [];

  // ---------- Painel ----------
  const campo = (r: any, c: string) => (r ? Number(r[c]) : null);
  const media = (lista: any[], c: string) => (lista.length ? lista.reduce((s, r) => s + (Number(r[c]) || 0), 0) / lista.length : null);
  const posicao = (lista: any[], c: string, menorMelhor = false) => {
    const meu = Number(atual[c]) || 0;
    return 1 + lista.filter((r) => (menorMelhor ? (Number(r[c]) || 0) < meu : (Number(r[c]) || 0) > meu)).length;
  };
  const linha = (grupo: LinhaPainel["grupo"], indicador: string, c: string, casas: number, extra: Partial<LinhaPainel> = {}): LinhaPainel => ({
    grupo, indicador, casas,
    valores: Object.fromEntries(rodadas.map((n) => [n, campo(minha(n), c)])),
    mediaTurma: media(doAtual, c),
    posicao: posicao(doAtual, c, extra.menorMelhor),
    equipesNaTurma: doAtual.length,
    ...extra,
  });
  const receitaDe = (r: any) => (r ? Number(r.receitaBruta ?? r.revenue) || 0 : null);
  const despesaSobreReceita = (n: number, tipo: "comunicacao" | "distribuicao") => {
    const r = minha(n);
    const ps = detalhe.get(n);
    const rb = receitaDe(r) || 0;
    if (!ps || rb <= 0) {
      // Rodadas mais antigas: usa o consolidado gravado quando existir.
      const v = tipo === "comunicacao" ? Number(r?.despesasVendas) : null;
      return v && rb > 0 ? null : null;
    }
    return (ps.reduce((s, p) => s + p[tipo], 0) / rb) * 100;
  };
  // Para todas as rodadas (não só as duas últimas) calculamos comunicação e distribuição.
  for (const n of rodadas) {
    if (!detalhe.has(n)) {
      const r = todasRodadas.find((x) => x.roundNumber === n)!;
      const rel = await montarRelatorioDaRodada(storage, classData, r);
      detalhe.set(n, rel.equipes.find((e) => e.equipeId === team.id)?.produtos ?? []);
    }
  }
  const verbaUsada = (n: number) => {
    const r = minha(n);
    const ps = detalhe.get(n) ?? [];
    const antes = Number(r?.budgetBefore) || 0;
    return antes > 0 ? (ps.reduce((s, p) => s + p.comunicacao + p.distribuicao, 0) / antes) * 100 : null;
  };

  const painel: LinhaPainel[] = [
    { ...linha("Resultados financeiros", "Receita bruta (R$)", "receitaBruta", 0, { moeda: true }), valores: Object.fromEntries(rodadas.map((n) => [n, receitaDe(minha(n))])), mediaTurma: doAtual.length ? doAtual.reduce((s, r) => s + (receitaDe(r) || 0), 0) / doAtual.length : null, posicao: 1 + doAtual.filter((r) => (receitaDe(r) || 0) > (receitaDe(atual) || 0)).length },
    linha("Resultados financeiros", "Lucro antes do IR (R$)", "profit", 0, { moeda: true }),
    linha("Resultados financeiros", "Margem (%)", "margin", 1, { variacaoEmPontos: true }),
    linha("Resultados financeiros", "ROI (%)", "roi", 1, { variacaoEmPontos: true }),
    linha("Mercado e clientes", "Participação média (%)", "marketShare", 2, { variacaoEmPontos: true }),
    linha("Mercado e clientes", "Satisfação (0 a 100)", "customerSatisfaction", 1),
    linha("Mercado e clientes", "Fidelização (0 a 100)", "customerLoyalty", 1),
    linha("Mercado e clientes", "NPS estimado", "nps", 1),
    linha("Mercado e clientes", "Percepção de marca (0 a 100)", "brandPerception", 1),
    linha("Mercado e clientes", "Taxa de conversão (%)", "taxaConversao", 1, { variacaoEmPontos: true }),
    linha("Mercado e clientes", "CAC (R$ por cliente novo)", "cac", 0, { menorMelhor: true }),
    { grupo: "Decisões de marketing", indicador: "Comunicação ÷ receita (%)", casas: 2, variacaoEmPontos: true, valores: Object.fromEntries(rodadas.map((n) => [n, despesaSobreReceita(n, "comunicacao")])), mediaTurma: null, posicao: null, equipesNaTurma: doAtual.length },
    { grupo: "Decisões de marketing", indicador: "Distribuição ÷ receita (%)", casas: 2, variacaoEmPontos: true, valores: Object.fromEntries(rodadas.map((n) => [n, despesaSobreReceita(n, "distribuicao")])), mediaTurma: null, posicao: null, equipesNaTurma: doAtual.length },
    { grupo: "Decisões de marketing", indicador: "Verba de marketing usada (%)", casas: 1, variacaoEmPontos: true, valores: Object.fromEntries(rodadas.map((n) => [n, verbaUsada(n)])), mediaTurma: null, posicao: null, equipesNaTurma: doAtual.length },
    linha("Decisões de marketing", "Alinhamento estratégico (0 a 100)", "alignmentScore", 0),
  ];

  // ---------- Série receita e lucro ----------
  const mediaRodada = (n: number, f: (r: any) => number) => {
    const l = porRodada.get(n) ?? [];
    return l.length ? l.reduce((s, r) => s + f(r), 0) / l.length : null;
  };
  const serieReceitaLucro = {
    rodadas,
    receita: rodadas.map((n) => receitaDe(minha(n))),
    lucro: rodadas.map((n) => campo(minha(n), "profit")),
    receitaTurma: rodadas.map((n) => mediaRodada(n, (r) => receitaDe(r) || 0)),
    lucroTurma: rodadas.map((n) => mediaRodada(n, (r) => Number(r.profit) || 0)),
  };

  // ---------- Análise de vendas (preço × volume) ----------
  let vendas: RelatorioGerencial["vendas"] = null;
  const produtosQueSairam: RelatorioGerencial["produtosQueSairam"] = [];
  if (anteriorN != null) {
    const nomes = Array.from(new Set([...prodAtual.map((p) => p.nome), ...prodAnterior.map((p) => p.nome)]));
    const linhas: LinhaVendas[] = nomes.map((nome) => {
      const a = prodAnterior.find((p) => p.nome === nome) ?? null;
      const b = prodAtual.find((p) => p.nome === nome) ?? null;
      if (a && b) {
        const efeitoPreco = (b.preco - a.preco) * b.unidades;
        const efeitoVolume = a.preco * (b.unidades - a.unidades);
        return { produto: nome, precoAnterior: a.preco, precoAtual: b.preco, unidadesAnterior: a.unidades, unidadesAtual: b.unidades, efeitoPreco, efeitoVolume, variacao: b.receitaBruta - a.receitaBruta };
      }
      if (a) {
        produtosQueSairam.push({ produto: nome, receitaBruta: a.receitaBruta, resultado: a.resultado });
        return { produto: nome, precoAnterior: a.preco, precoAtual: null, unidadesAnterior: a.unidades, unidadesAtual: null, efeitoPreco: null, efeitoVolume: null, variacao: -a.receitaBruta };
      }
      return { produto: nome, precoAnterior: null, precoAtual: b!.preco, unidadesAnterior: null, unidadesAtual: b!.unidades, efeitoPreco: null, efeitoVolume: null, variacao: b!.receitaBruta };
    });
    vendas = {
      linhas,
      efeitoPreco: linhas.reduce((s, l) => s + (l.efeitoPreco ?? 0), 0),
      efeitoVolume: linhas.reduce((s, l) => s + (l.efeitoVolume ?? 0), 0),
      variacao: linhas.reduce((s, l) => s + l.variacao, 0),
    };
  }

  // ---------- Participação por produto ----------
  let estado: any = null;
  try {
    const r = await pool.query(`SELECT estado FROM market_states WHERE round_id = $1 LIMIT 1`, [round.id]);
    estado = r.rows[0]?.estado && Array.isArray(r.rows[0].estado.categorias) ? r.rows[0].estado : null;
  } catch {
    estado = null;
  }
  const nomesEquipes = new Map(teams.map((t) => [t.id, nomeEquipe(t)]));
  const participacao: ParticipacaoProduto[] = [];
  for (const p of prodAtual) {
    const produto = await storage.getProduct(p.produtoId);
    const cat: any = categoriaDoProduto(classData.sector, produto ?? null);
    const catEstado = estado ? estado.categorias.find((c: any) => c.categoriaId === cat?.id) : null;
    const ofertas: any[] = catEstado?.ofertas ?? [];
    const empresas: EmpresaNaCategoria[] = ofertas
      .map((o) => ({
        empresa: o.tipo === "equipe" && o.equipeId ? nomesEquipes.get(o.equipeId) ?? o.empresa : o.empresa,
        participacao: Number(o.participacaoValor) || 0,
        suaEmpresa: o.tipo === "equipe" && o.equipeId === team.id,
        simulado: o.tipo !== "equipe",
      }))
      .sort((a, b) => b.participacao - a.participacao);
    const lider = empresas[0] ? { empresa: empresas[0].empresa, participacao: empresas[0].participacao } : p.lider;
    const serie: Record<number, number | null> = {};
    for (const n of rodadas) serie[n] = (detalhe.get(n) ?? []).find((x) => x.nome === p.nome)?.participacao ?? null;
    participacao.push({
      produto: p.nome,
      serie,
      lider,
      relativa: lider && lider.participacao > 0 ? p.participacao / lider.participacao : null,
      mediaPorEmpresa: p.mediaCategoria,
      empresasNaCategoria: empresas.length,
      empresas,
    });
  }
  // Produtos vendidos em rodadas anteriores e não nesta: entram com o histórico
  // (pedido do professor, 17/11: "não teve produto nesta rodada").
  const nomesNoHistorico: string[] = [];
  for (const n of rodadas) for (const x of detalhe.get(n) ?? []) if (!nomesNoHistorico.includes(x.nome)) nomesNoHistorico.push(x.nome);
  for (const nome of nomesNoHistorico) {
    if (prodAtual.some((p) => p.nome === nome)) continue;
    const serie: Record<number, number | null> = {};
    for (const n of rodadas) serie[n] = (detalhe.get(n) ?? []).find((x) => x.nome === nome)?.participacao ?? null;
    participacao.push({ produto: nome, serie, lider: null, relativa: null, mediaPorEmpresa: null, empresasNaCategoria: 0, empresas: [], ausente: true });
  }

  // ---------- Despesas ÷ receita ----------
  const despesas = {
    comunicacao: Object.fromEntries(rodadas.map((n) => [n, despesaSobreReceita(n, "comunicacao")])),
    distribuicao: Object.fromEntries(rodadas.map((n) => [n, despesaSobreReceita(n, "distribuicao")])),
    verbaUsada: Object.fromEntries(rodadas.map((n) => [n, verbaUsada(n)])),
  };

  // ---------- DRE por produto ----------
  const dre: DreProduto[] = prodAtual.map((p) => {
    const a = prodAnterior.find((x) => x.nome === p.nome);
    return { produto: p.nome, anterior: a ? dreDe(a) : null, atual: dreDe(p) };
  });
  const dreEmpresa = somaDre(dre.map((d) => d.atual));
  const dreAusentes = prodAnterior.filter((a) => !prodAtual.some((p) => p.nome === a.nome)).map((a) => ({ produto: a.nome, anterior: dreDe(a) }));

  // ---------- Alinhamento com números ----------
  const [porters, bcgs, mixes, resProdutos, resProdutosAnt] = await Promise.all([
    storage.getPorterAnalysesByTeamAndRound(team.id, round.id),
    storage.getBcgAnalyses(team.id, round.id),
    storage.getMarketingMixesByTeamAndRound(team.id, round.id),
    storage.getProductResultsByTeamAndRound(team.id, round.id),
    anteriorN != null ? storage.getProductResultsByTeamAndRound(team.id, todasRodadas.find((x) => x.roundNumber === anteriorN)!.id) : Promise.resolve([] as any[]),
  ]);
  // Mesma leitura do fechamento da rodada (roundCompletionCompetitive: getPorterAnalysis sem produto).
  const porterDaEquipe: any = (await storage.getPorterAnalysis(team.id, round.id)) ?? porters[0] ?? null;
  const equipesNoMercado = teams.length; // mesma base do fechamento (roundCompletionCompetitive)
  const verbaProduto = setor?.verbaMarketingPct ? receitaReferenciaDaTurma(classData, equipesNoMercado) * (setor.verbaMarketingPct / 100) : 0;
  const alinhamento: AlinhamentoProduto[] = [];
  for (const p of prodAtual) {
    const rp: any = resProdutos.find((x: any) => x.productId === p.produtoId);
    const rpa: any = (resProdutosAnt as any[]).find((x: any) => x.productId === p.produtoId);
    const mix: any = mixes.find((m: any) => m.productId === p.produtoId);
    const bcg: any = bcgs.find((b: any) => b.productId && b.productId === p.produtoId) ?? bcgs[0] ?? null;
    const comunicacaoRegra = mix?.promotionBudgets ? Object.values(mix.promotionBudgets as Record<string, number>).reduce((s, v) => s + (Number(v) || 0), 0) : 0;
    const porter: any = porterDaEquipe;
    const ctx = {
      produto: p.nome,
      preco: p.preco,
      precoReferencia: p.precoReferencia,
      comunicacao: comunicacaoRegra,
      verbaProduto,
      rivalidade: porter?.competitiveRivalry ?? null,
      poderClientes: porter?.buyerPower ?? null,
      poderFornecedores: porter?.supplierPower ?? null,
      substitutos: porter?.threatOfSubstitutes ?? null,
      novosEntrantes: porter?.threatOfNewEntry ?? null,
      quadranteBcg: bcg?.quadrant ?? null,
      crescimentoMercado: bcg?.marketGrowth != null ? Number(bcg.marketGrowth) : null,
      participacaoRelativa: bcg?.relativeMarketShare != null ? Number(bcg.relativeMarketShare) : null,
      canais: mix?.distributionChannels ?? [],
      estrategiaPreco: mix?.priceStrategy ?? null,
    };
    const alertas: AlertaProduto[] = ((rp?.alignmentIssues ?? []) as string[]).map((a) => {
      const e = explicarAlerta(a, ctx);
      return { ...e, efeitoNaNota: e.pontos * PESO_PONTO_FERRAMENTA };
    });
    const partes = ["SWOT", "5 Forças", "Matriz BCG", "PESTEL", "Segmentação"].map((f) => ({
      ferramenta: f,
      pontos: Math.max(0, 100 - alertas.filter((x) => x.ferramenta === f).reduce((s, x) => s + x.pontos, 0)),
    }));
    alinhamento.push({ produto: p.nome, nota: rp?.alignmentScore ?? null, notaAnterior: rpa?.alignmentScore ?? null, partes, alertas });
  }

  // ---------- Das análises às decisões ----------
  const roundAnt = anteriorN != null ? todasRodadas.find((x) => x.roundNumber === anteriorN) ?? null : null;
  const [porterAnt, bcgsAnt, mixesAnt, segmentacoes] = await Promise.all([
    roundAnt ? storage.getPorterAnalysis(team.id, roundAnt.id) : Promise.resolve(undefined),
    roundAnt ? storage.getBcgAnalyses(team.id, roundAnt.id) : Promise.resolve([] as any[]),
    roundAnt ? storage.getMarketingMixesByTeamAndRound(team.id, roundAnt.id) : Promise.resolve([] as any[]),
    storage.getMarketSegmentationsByTeamAndRound(team.id, round.id),
  ]);
  const somaMidias = (m: any) => (m?.promotionBudgets ? Object.values(m.promotionBudgets as Record<string, number>).reduce((acc, v) => acc + (Number(v) || 0), 0) : 0);
  const FORCAS: { campo: string; nome: string; mede: string }[] = [
    { campo: "competitiveRivalry", nome: "Disputa entre concorrentes", mede: "o quanto as empresas brigam pelos mesmos clientes" },
    { campo: "buyerPower", nome: "Poder dos clientes", mede: "o quanto os clientes conseguem pressionar o preço ou trocar de marca" },
    { campo: "supplierPower", nome: "Poder dos fornecedores", mede: "o quanto os fornecedores conseguem aumentar os custos" },
    { campo: "threatOfSubstitutes", nome: "Produtos substitutos", mede: "o quanto outros tipos de produto atendem à mesma necessidade" },
    { campo: "threatOfNewEntry", nome: "Novas empresas", mede: "o quanto é fácil uma nova empresa entrar neste mercado" },
  ];
  const TOPICOS_PUBLICO = ["classe", "beneficio", "valores", "estilo", "interesses", "fidelidade"];
  const decisoes: DecisaoProduto[] = [];
  for (const p of prodAtual) {
    const mix: any = mixes.find((m: any) => m.productId === p.produtoId);
    const mixA: any = (mixesAnt as any[]).find((m: any) => m.productId === p.produtoId);
    const pa = prodAnterior.find((x) => x.nome === p.nome);
    const bcg: any = bcgs.find((b: any) => b.productId && b.productId === p.produtoId) ?? bcgs[0] ?? null;
    const bcgA: any = (bcgsAnt as any[]).find((b: any) => b.productId && b.productId === p.produtoId) ?? null;
    const seg: any = (segmentacoes as any[]).find((x: any) => x.segmentType === "b2c" && x.productId === p.produtoId) ?? null;
    const publico: { topico: string; opcoes: string[] }[] = [];
    if (seg) {
      for (const c of Object.keys(TOPICOS_B2C) as CriterioSegmentacao[]) {
        const cods = sanearCodigos(c, seg[c]);
        for (const t of TOPICOS_B2C[c]) {
          if (!TOPICOS_PUBLICO.includes(t.id)) continue;
          const ops = t.opcoes.filter((op) => cods.includes(`${t.id}:${op.id}`)).map((op) => op.label);
          if (ops.length) publico.push({ topico: t.label, opcoes: ops });
        }
      }
    }
    const al = alinhamento.find((a) => a.produto === p.nome);
    const alertasPorFerramenta: Record<string, string[]> = {};
    for (const a of al?.alertas ?? []) (alertasPorFerramenta[a.ferramenta] ??= []).push(a.titulo);
    decisoes.push({
      produto: p.nome,
      forcas: FORCAS.map((f) => ({ nome: f.nome, mede: f.mede, atual: porterDaEquipe?.[f.campo] ?? null, anterior: (porterAnt as any)?.[f.campo] ?? null })),
      preco: p.preco,
      precoAnterior: pa?.preco ?? null,
      precoReferencia: p.precoReferencia,
      comunicacao: somaMidias(mix),
      comunicacaoAnterior: mixA ? somaMidias(mixA) : null,
      canais: nomesCanais(mix?.distributionChannels),
      canaisAnterior: mixA ? nomesCanais(mixA.distributionChannels) : null,
      bcg: bcg
        ? {
            quadrante: bcg.quadrant ?? null,
            crescimento: bcg.marketGrowth != null ? Number(bcg.marketGrowth) : null,
            relativa: bcg.relativeMarketShare != null ? Number(bcg.relativeMarketShare) : null,
            quadranteAnterior: bcgA?.quadrant ?? null,
            relativaAnterior: bcgA?.relativeMarketShare != null ? Number(bcgA.relativeMarketShare) : null,
          }
        : null,
      publico,
      alertasPorFerramenta,
    });
  }

  // ---------- Nota ----------
  let nota: RelatorioGerencial["nota"] = null;
  if (doAtual.length) {
    const n = notaDaRodada(atual, doAtual);
    const ant = anteriorN != null && minha(anteriorN) ? notaDaRodada(minha(anteriorN), porRodada.get(anteriorN) ?? []).total : null;
    const notas = doAtual.map((r) => notaDaRodada(r, doAtual).total);
    nota = { ...n, anterior: ant, posicao: 1 + notas.filter((x) => x > n.total + 1e-9).length };
    painel.push({
      grupo: "Decisões de marketing",
      indicador: "Nota da rodada (0 a 100)",
      casas: 1,
      valores: Object.fromEntries(rodadas.map((k) => [k, minha(k) ? notaDaRodada(minha(k), porRodada.get(k) ?? []).total : null])),
      mediaTurma: notas.reduce((s, x) => s + x, 0) / notas.length,
      posicao: nota.posicao,
      equipesNaTurma: doAtual.length,
    });
  }

  // ---------- Fatos (frases fixas preenchidas com os números) ----------
  const fatos: string[] = [];
  const ra = anteriorN != null ? minha(anteriorN) : null;
  if (ra) {
    const rbA = receitaDe(ra) || 0, rbB = receitaDe(atual) || 0;
    const vr = varPct(rbA, rbB);
    if (vr != null) fatos.push(`A receita bruta ${vr >= 0 ? "subiu" : "caiu"} ${dec(Math.abs(vr))}%, de ${reais(rbA)} para ${reais(rbB)}.`);
    if (prodAnterior.length !== prodAtual.length) {
      const qtd = (n: number) => (["nenhum", "um", "dois", "três", "quatro", "cinco", "seis"][n] ?? String(n)) + (n === 1 ? " produto" : " produtos");
      fatos.push(`Na Rodada ${anteriorN} a empresa vendeu ${qtd(prodAnterior.length)}; na Rodada ${round.roundNumber}, ${qtd(prodAtual.length)}.` +
        produtosQueSairam.map((x) => ` O ${x.produto}, que gerou ${reais(x.receitaBruta)} de receita na Rodada ${anteriorN}, não fez parte desta rodada.`).join(""));
    }
    if (vendas) {
      const comuns = vendas.linhas.filter((l) => l.efeitoPreco != null);
      if (comuns.length) {
        const base = comuns.reduce((s, l) => s + (l.precoAnterior ?? 0) * (l.unidadesAnterior ?? 0), 0);
        const v = comuns.reduce((s, l) => s + l.variacao, 0);
        const ep = comuns.reduce((s, l) => s + (l.efeitoPreco ?? 0), 0), ev = comuns.reduce((s, l) => s + (l.efeitoVolume ?? 0), 0);
        const precosIguais = comuns.every((l) => l.precoAnterior === l.precoAtual);
        if (base > 0) fatos.push(`Nos produtos vendidos nas duas rodadas, a receita ${v >= 0 ? "subiu" : "caiu"} ${reais(Math.abs(v))} (${v >= 0 ? "+" : "−"}${dec(Math.abs(v / base) * 100)}%). ` +
          (precosIguais
            ? "Como os preços não mudaram, toda a variação veio do volume vendido (seção 4)."
            : `${reais(ep)} vieram da mudança de preço e ${reais(ev)} da mudança no volume vendido (seção 4).`));
      }
    }
    const la = Number(ra.profit) || 0, lb = Number(atual.profit) || 0;
    const vl = varPct(la, lb);
    if (vl != null) fatos.push(`O lucro antes do IR ${lb >= la ? "subiu" : "caiu"} ${dec(Math.abs(vl))}%, de ${reais(la)} para ${reais(lb)}.` +
      dre.filter((d) => d.anterior).map((d) => { const x = varPct(d.anterior!.resultado, d.atual.resultado); return x == null ? "" : ` O lucro do ${d.produto} ${x >= 0 ? "subiu" : "caiu"} ${dec(Math.abs(x))}%.`; }).join(""));
    for (const d of dre) {
      if (d.anterior && d.anterior.custoUnidade > 0) {
        const x = varPct(d.anterior.custoUnidade, d.atual.custoUnidade);
        if (x != null && Math.abs(x) >= 0.05) fatos.push(`O custo de produção por unidade do ${d.produto} ${x >= 0 ? "subiu" : "caiu"} ${dec(Math.abs(x))}%, de ${reais2(d.anterior.custoUnidade)} para ${reais2(d.atual.custoUnidade)}.`);
      }
    }
    for (const pp of participacao) {
      const a = anteriorN != null ? pp.serie[anteriorN] : null, b = pp.serie[round.roundNumber];
      if (a != null && b != null) fatos.push(`A participação do ${pp.produto} ${b >= a ? "subiu" : "caiu"} de ${dec(a, 2)}% para ${dec(b, 2)}%.${pp.lider ? ` A líder da categoria é ${pp.lider.empresa}, com ${dec(pp.lider.participacao, 2)}%.` : ""}`);
    }
    const ca = anteriorN != null ? despesas.comunicacao[anteriorN] : null, cb = despesas.comunicacao[round.roundNumber];
    if (ca != null && cb != null) fatos.push(`O investimento em comunicação passou de ${dec(ca, 2)}% para ${dec(cb, 2)}% da receita.`);
    const vu = despesas.verbaUsada[round.roundNumber];
    if (vu != null) fatos.push(`A empresa usou ${dec(vu)}% da verba de marketing disponível (${reais(prodAtual.reduce((s, p) => s + p.comunicacao + p.distribuicao, 0))} de ${reais(Number(atual.budgetBefore) || 0)}).`);
    const sa = Number(ra.customerSatisfaction), sb = Number(atual.customerSatisfaction), na = Number(ra.nps), nb = Number(atual.nps);
    if (Number.isFinite(sa) && Number.isFinite(sb)) fatos.push(`A satisfação ${sb >= sa ? "subiu" : "caiu"} de ${dec(sa)} para ${dec(sb)}, e o NPS estimado ${nb >= na ? "subiu" : "caiu"} de ${dec(na)} para ${dec(nb)}.`);
  }
  if (nota) fatos.push(`A nota da rodada foi ${dec(nota.total)}${nota.anterior != null ? ` (Rodada ${anteriorN}: ${dec(nota.anterior)})` : ""}, ${nota.posicao}ª entre as ${doAtual.length} equipes da turma.`);

  // ---------- Fórmulas com os números do primeiro produto ----------
  const fp = dre[0]?.atual;
  const formulas: RelatorioGerencial["formulas"] = [];
  if (fp) {
    const nome = dre[0].produto;
    formulas.push(
      { indicador: "Receita bruta", conta: `Preço × unidades = ${reais2(fp.preco)} × ${n0(fp.unidades)} = ${reais(fp.receitaBruta)} (${nome})`, fonte: "Manual, A.7" },
      { indicador: "Tributos sobre vendas", conta: `12% × receita bruta = 0,12 × ${reais(fp.receitaBruta)} = ${reais(fp.tributos)}`, fonte: "Manual, A.7" },
      { indicador: "Lucro bruto", conta: `(Receita líquida por unidade − custo por unidade) × unidades = (${reais2(fp.receitaLiquidaUnidade)} − ${reais2(fp.custoUnidade)}) × ${n0(fp.unidades)} = ${reais(fp.lucroBruto)}`, fonte: "Manual, A.7" },
      { indicador: "Lucro antes do IR", conta: `Lucro bruto − comunicação − distribuição − administrativas = ${n0(fp.lucroBruto)} − ${n0(fp.comunicacao)} − ${n0(fp.distribuicao)} − ${n0(fp.administrativas)} = ${reais(fp.resultado)}`, fonte: "Manual, A.7" },
      { indicador: "Margem", conta: `Lucro ÷ receita bruta × 100 = ${n0(fp.resultado)} ÷ ${n0(fp.receitaBruta)} × 100 = ${dec(fp.margem)}%`, fonte: "Manual, A.7" },
    );
    const custos = (receitaDe(atual) || 0) - (Number(atual.profit) || 0);
    if (custos > 0) formulas.push({ indicador: "ROI (empresa)", conta: `Lucro ÷ custos totais × 100 = ${n0(Number(atual.profit) || 0)} ÷ ${n0(custos)} × 100 = ${dec(Number(atual.roi) || 0)}%`, fonte: "Manual, A.7; Farris et al. (2016)" });
    const pp = participacao[0];
    if (pp) formulas.push({ indicador: "Participação", conta: `Receita da empresa ÷ receita da categoria × 100 = ${dec(pp.serie[round.roundNumber] ?? 0, 2)}%`, fonte: "Manual, A.2 e A.3; Kotler e Keller (2019, p. 757)" });
    if (pp?.relativa != null && pp.lider) formulas.push({ indicador: "Participação relativa", conta: `Participação da empresa ÷ participação da líder = ${dec(pp.serie[round.roundNumber] ?? 0, 2)} ÷ ${dec(pp.lider.participacao, 2)} = ${dec(pp.relativa, 2)}`, fonte: "Kotler e Keller (2019, p. 757)" });
    const cb = despesas.comunicacao[round.roundNumber];
    if (cb != null) formulas.push({ indicador: "Comunicação ÷ receita (empresa)", conta: `Comunicação ÷ receita bruta × 100 = ${n0(dreEmpresa.comunicacao)} ÷ ${n0(dreEmpresa.receitaBruta)} × 100 = ${dec(cb, 2)}%`, fonte: "Kotler e Keller (2019, p. 758)" });
    formulas.push(
      { indicador: "NPS estimado", conta: "(Satisfação − 50) × 1,6", fonte: "Manual, A.6; Reichheld (2006)" },
      { indicador: "CAC", conta: "Comunicação ÷ novos clientes estimados", fonte: "Manual, A.7; Farris et al. (2016, p. 179-180)" },
    );
  }

  return {
    empresa,
    turma: classData.name,
    setor: setor?.name ?? classData.sector ?? "",
    rodada: round.roundNumber,
    encerradaEm: (round as any).endedAt ? new Date((round as any).endedAt).toISOString() : ((round as any).endDate ? new Date((round as any).endDate).toISOString() : null),
    produtosAtuais: prodAtual.map((p) => p.nome),
    produtosAnteriores: prodAnterior.map((p) => p.nome),
    rodadas,
    equipesNaTurma: doAtual.length,
    painel,
    serieReceitaLucro,
    fatos,
    vendas,
    participacao,
    despesas,
    dre,
    dreEmpresa,
    produtosQueSairam,
    dreAusentes,
    alinhamento,
    decisoes,
    limiteComunicacao: verbaProduto * 0.15,
    nota,
    formulas,
  };
}

/**
 * Relatório que o aluno ainda precisa baixar (decisão do professor, 17/11/2026:
 * cada aluno baixa o seu). Vale só a última rodada encerrada (não prática):
 * se a equipe tem resultado nela e este aluno ainda não baixou o relatório,
 * o acesso ao simulador fica bloqueado até o download. Devolve null quando
 * não há pendência.
 */
export async function relatorioPendenteDoAluno(storage: IStorage, team: Team, userId: string): Promise<{ roundId: string; rodada: number } | null> {
  const ultima = (await storage.getRoundsByClass(team.classId))
    .filter((r) => r.status === "completed" && !r.isPractice)
    .sort((a, b) => b.roundNumber - a.roundNumber)[0];
  if (!ultima) return null;
  const temResultado = (await storage.getResultsByRound(ultima.id)).some((x: any) => x.teamId === team.id);
  if (!temResultado) return null;
  const q = await pool.query(
    `SELECT 1 FROM round_access_logs WHERE round_id = $1 AND action = 'relatorio_baixado' AND user_id = $2 LIMIT 1`,
    [ultima.id, userId],
  );
  return q.rowCount ? null : { roundId: ultima.id, rodada: ultima.roundNumber };
}
