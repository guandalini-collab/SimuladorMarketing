/**
 * Relatório didático do professor (nov/2026, correções da Rodada 3).
 *
 * Explica, equipe por equipe, por que o resultado da rodada foi o que foi.
 * Tudo é CALCULADO a partir do que já está gravado (decisões, resultados por
 * produto, resultado consolidado e estado do mercado da rodada), com as mesmas
 * fórmulas do motor competitivo. As frases são fixas, preenchidas com os
 * números; não há texto livre de IA, para não inventar causas. Só leitura:
 * nada é gravado e nenhum resultado muda. O relatório é só para o professor.
 */
import type { IStorage } from "../storage";
import type { Class, Round } from "@shared/schema";
import { categoriaDoProduto } from "./marketBulletin";
import { setorDaTurma, investimentoEmMidias } from "./roundCompletionCompetitive";
import { pool } from "../pg-storage";
import { custoUnitarioEstimado } from "@shared/fichaProduto";

const TRIBUTOS = 0.12;

const brl = (v: number) => (Math.round(v) < 0 ? "−" : "") + "R$ " + Math.abs(Math.round(v)).toLocaleString("pt-BR");
const brl2 = (v: number) => (v < -0.005 ? "−" : "") + "R$ " + Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (v: number, casas = 1) => v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }) + "%";
const num = (v: number) => Math.round(v).toLocaleString("pt-BR");

const QUALIDADE: Record<string, string> = { basico: "básica", medio: "média", premium: "premium" };
const RECURSOS: Record<string, string> = { basico: "básicas", intermediario: "intermediárias", completo: "completas" };
const ESTRATEGIA: Record<string, string> = { penetracao: "penetração (preço baixo para ganhar mercado)", competitivo: "competitivo (preço parecido com o dos concorrentes)", skimming: "desnatamento (preço que começa alto e é reduzido aos poucos)", valor: "baseado em valor" };

export interface Diagnostico {
  /** "alerta" pesa contra o resultado; "ok" é um ponto que não explica o problema. */
  tipo: "alerta" | "ok";
  titulo: string;
  texto: string;
  /** Contas passo a passo, uma por linha. */
  contas?: string[];
}

export interface ProdutoRelatorio {
  produtoId: string;
  nome: string;
  qualidade: string;
  caracteristicas: string;
  estrategiaPreco: string;
  preco: number;
  precoReferencia: number;
  diferencaReferenciaPct: number;
  unidades: number;
  receitaBruta: number;
  receitaLiquidaUnidade: number;
  custoProducaoUnidade: number;
  sobraUnidade: number;
  sobraPct: number;
  lucroBruto: number;
  comunicacao: number;
  distribuicao: number;
  administrativas: number;
  despesasUnidade: number;
  custoTotalUnidade: number;
  precoMinimo: number;
  resultado: number;
  participacao: number;
  mediaCategoria: number | null;
  lider: { empresa: string; participacao: number } | null;
  segmento: string | null;
  aderencia: number | null;
  contradicoes: number;
  diagnosticos: Diagnostico[];
}

export interface EquipeRelatorio {
  equipeId: string;
  equipe: string;
  enviou: boolean;
  resumo: string;
  receitaBruta: number;
  resultado: number;
  participacaoMedia: number;
  verbaInicial: number;
  verbaUsada: number;
  verbaProxima: number;
  multiplicadorCusto: number;
  composicao: { item: string; valor: number; parte: number }[];
  produtos: ProdutoRelatorio[];
  diagnosticosEquipe: Diagnostico[];
  conversa: string[];
}

export interface RelatorioRodada {
  rodada: number;
  roundId: string;
  geradoEm: string;
  equipes: EquipeRelatorio[];
  observacoes: string[];
}

export async function montarRelatorioDaRodada(storage: IStorage, classData: Class, round: Round): Promise<RelatorioRodada> {
  const setor = setorDaTurma(classData);
  const margemBruta = Number((setor as any)?.margemBruta ?? 0);
  // Estado do mercado gravado no fechamento DESTA rodada (por round_id).
  let estadoDaRodada: any = null;
  try {
    const r = await pool.query(`SELECT estado FROM market_states WHERE round_id = $1 LIMIT 1`, [round.id]);
    const e = r.rows[0]?.estado;
    estadoDaRodada = e && Array.isArray(e.categorias) ? e : null;
  } catch {
    estadoDaRodada = null;
  }
  const teams = await storage.getTeamsByClass(classData.id);
  const equipes: EquipeRelatorio[] = [];

  for (const team of teams) {
    const res: any = await storage.getResult(team.id, round.id);
    if (!res) {
      equipes.push({
        equipeId: team.id, equipe: team.name, enviou: false,
        resumo: "A equipe não enviou decisão nesta rodada; não há resultado para explicar.",
        receitaBruta: 0, resultado: 0, participacaoMedia: 0, verbaInicial: 0, verbaUsada: 0, verbaProxima: 0, multiplicadorCusto: 1,
        composicao: [], produtos: [], diagnosticosEquipe: [], conversa: [],
      });
      continue;
    }
    const mixes = await storage.getMarketingMixesByTeamAndRound(team.id, round.id);
    const resultadosProdutos: any[] = await storage.getProductResultsByTeamAndRound(team.id, round.id);
    const mult = Number(res.simulationBreakdown?.multiplicadorCusto) || 1;
    const segPorProduto = new Map<string, any>();
    for (const p of (res.simulationBreakdown?.produtos ?? []) as any[]) if (p?.productId) segPorProduto.set(p.productId, p.segmentacao ?? null);

    const produtos: ProdutoRelatorio[] = [];
    for (const pr of resultadosProdutos) {
      const mix: any = mixes.find((m: any) => m.productId === pr.productId);
      if (!mix) continue;
      const produto = await storage.getProduct(pr.productId);
      const cat: any = categoriaDoProduto(classData.sector, produto ?? null) ?? (setor as any)?.categories?.[0];
      const ref = Number(cat?.averagePrice) || 0;
      const preco = Number(mix.priceValue) || 0;
      const receitaBruta = Number(pr.receitaBruta ?? pr.revenue) || 0;
      const unidades = preco > 0 ? Math.round(receitaBruta / preco) : 0;
      const receitaLiquida = Number(pr.receitaLiquida) || receitaBruta * (1 - TRIBUTOS);
      const custoProducaoUnidade = custoUnitarioEstimado(ref, margemBruta, mix.productQuality, mix.productFeatures) * mult;
      const cpv = unidades * custoProducaoUnidade;
      const comunicacao = investimentoEmMidias(mix);
      // margem de contribuição = receita líquida − CPV − distribuição (motor).
      const distribuicao = Math.max(0, receitaLiquida - cpv - (Number(pr.margemContribuicao) || 0));
      const custos = Number(pr.costs) || 0;
      const administrativas = Math.max(0, custos - receitaBruta * TRIBUTOS - cpv - comunicacao - distribuicao);
      const resultado = Number(pr.profit) || 0;
      const receitaLiquidaUnidade = preco * (1 - TRIBUTOS);
      const sobraUnidade = receitaLiquidaUnidade - custoProducaoUnidade;
      const despesas = comunicacao + distribuicao + administrativas;
      const despesasUnidade = unidades > 0 ? despesas / unidades : 0;
      const custoTotalUnidade = custoProducaoUnidade + despesasUnidade;
      const precoMinimo = custoTotalUnidade / (1 - TRIBUTOS);
      const lucroBruto = receitaLiquida - cpv;

      // Estado do mercado da rodada: média e líder da categoria.
      const catEstado = estadoDaRodada ? (estadoDaRodada as any).categorias.find((c: any) => c.categoriaId === cat?.id) : null;
      const ofertas: any[] = catEstado?.ofertas ?? [];
      const mediaCategoria = ofertas.length > 0 ? 100 / ofertas.length : null;
      const liderOferta = ofertas.length > 0 ? ofertas.reduce((a, b) => (b.participacaoValor > a.participacaoValor ? b : a)) : null;
      const seg = segPorProduto.get(pr.productId) ?? null;

      const p: ProdutoRelatorio = {
        produtoId: pr.productId,
        nome: produto?.name ?? cat?.name ?? "Produto",
        qualidade: QUALIDADE[mix.productQuality] ?? mix.productQuality,
        caracteristicas: RECURSOS[mix.productFeatures] ?? mix.productFeatures,
        estrategiaPreco: ESTRATEGIA[mix.priceStrategy] ?? mix.priceStrategy,
        preco, precoReferencia: ref,
        diferencaReferenciaPct: ref > 0 ? (preco / ref - 1) * 100 : 0,
        unidades, receitaBruta, receitaLiquidaUnidade, custoProducaoUnidade, sobraUnidade,
        sobraPct: receitaLiquidaUnidade > 0 ? (sobraUnidade / receitaLiquidaUnidade) * 100 : 0,
        lucroBruto, comunicacao, distribuicao, administrativas, despesasUnidade, custoTotalUnidade, precoMinimo, resultado,
        participacao: Number(pr.marketShare) || 0,
        mediaCategoria,
        lider: liderOferta ? { empresa: liderOferta.empresa, participacao: liderOferta.participacaoValor } : null,
        segmento: seg?.segmento ?? null,
        aderencia: typeof seg?.aderencia === "number" ? seg.aderencia : null,
        contradicoes: Array.isArray(seg?.contradicoes) ? seg.contradicoes.length : 0,
        diagnosticos: [],
      };
      p.diagnosticos = diagnosticosDoProduto(p, pr.alignmentIssues ?? []);
      produtos.push(p);
    }

    const receitaBrutaTotal = Number(res.receitaBruta ?? res.revenue) || 0;
    const resultadoTotal = Number(res.lair ?? res.profit) || 0;
    const verbaInicial = Number(res.budgetBefore) || 0;
    const verbaUsada = produtos.reduce((s, p) => s + p.comunicacao + p.distribuicao, 0);
    const composicao = receitaBrutaTotal > 0 ? [
      { item: "Tributos sobre vendas", valor: receitaBrutaTotal * TRIBUTOS },
      { item: "Custo de produção", valor: produtos.reduce((s, p) => s + p.unidades * p.custoProducaoUnidade, 0) },
      { item: "Comunicação (mídias)", valor: produtos.reduce((s, p) => s + p.comunicacao, 0) },
      { item: "Distribuição (canais e cobertura)", valor: produtos.reduce((s, p) => s + p.distribuicao, 0) },
      { item: "Despesas administrativas", valor: produtos.reduce((s, p) => s + p.administrativas, 0) },
      { item: "Resultado (lucro ou prejuízo antes do imposto)", valor: resultadoTotal },
    ].map((l) => ({ ...l, parte: (l.valor / receitaBrutaTotal) * 100 })) : [];

    const eq: EquipeRelatorio = {
      equipeId: team.id, equipe: team.name, enviou: true,
      resumo: "",
      receitaBruta: receitaBrutaTotal, resultado: resultadoTotal,
      participacaoMedia: Number(res.marketShare) || 0,
      verbaInicial, verbaUsada, verbaProxima: Number(res.budgetAfter) || 0,
      multiplicadorCusto: mult,
      composicao, produtos,
      diagnosticosEquipe: [], conversa: [],
    };
    eq.resumo = resumoDaEquipe(eq);
    eq.diagnosticosEquipe = diagnosticosDaEquipe(eq, res.alignmentScore ?? null);
    eq.conversa = conversaComAEquipe(eq);
    equipes.push(eq);
  }

  const observacoes = [
    "Os números vêm do que ficou gravado no fechamento da rodada e são recalculados com as fórmulas do motor (Manual do Aluno, A.7 e C.5). Pequenas diferenças de centavos são arredondamento.",
    "O resultado mostrado é o lucro ou prejuízo antes do IR e da CSLL, o mesmo usado no ranking.",
    "Distribuição e despesas administrativas de cada produto são obtidas por diferença entre os valores gravados (margem de contribuição e custos totais).",
  ];
  if (round.roundNumber <= 2) observacoes.push("Nas Rodadas 1 e 2, o imposto do DRE dos alunos foi calculado produto a produto (erro corrigido a partir da Rodada 3). Este relatório não usa o imposto.");
  if (!estadoDaRodada) observacoes.push("O registro do mercado desta rodada não foi encontrado; a comparação com a média e o líder da categoria ficou de fora.");

  return { rodada: round.roundNumber, roundId: round.id, geradoEm: new Date().toISOString(), equipes, observacoes };
}

function resumoDaEquipe(e: EquipeRelatorio): string {
  const lucro = e.resultado >= 0;
  const piores = e.produtos.filter((p) => p.resultado < 0).map((p) => p.nome);
  const melhores = e.produtos.filter((p) => p.resultado >= 0).map((p) => p.nome);
  let texto = `${lucro ? "Lucro" : "Prejuízo"} de ${brl(Math.abs(e.resultado))} antes do imposto, com receita bruta de ${brl(e.receitaBruta)} e participação média de ${pct(e.participacaoMedia)}.`;
  if (piores.length > 0 && melhores.length > 0) texto += ` Deram prejuízo: ${piores.join(", ")}. Deram lucro: ${melhores.join(", ")}.`;
  else if (piores.length > 0) texto += ` Todos os produtos deram prejuízo.`;
  else texto += ` Todos os produtos deram lucro.`;
  if (e.verbaProxima !== e.verbaInicial) {
    texto += ` A verba de marketing da próxima rodada ${e.verbaProxima < e.verbaInicial ? "caiu" : "subiu"} de ${brl(e.verbaInicial)} para ${brl(e.verbaProxima)}, porque ela acompanha a receita.`;
  }
  return texto;
}

function diagnosticosDoProduto(p: ProdutoRelatorio, alertasAlinhamento: string[]): Diagnostico[] {
  const d: Diagnostico[] = [];
  const contaSobra = [
    `Receita líquida por unidade = preço × 0,88 = ${brl2(p.preco)} × 0,88 = ${brl2(p.receitaLiquidaUnidade)}`,
    `Custo de produção por unidade (qualidade ${p.qualidade}, características ${p.caracteristicas}) = ${brl2(p.custoProducaoUnidade)}`,
    `Sobra por unidade = ${brl2(p.receitaLiquidaUnidade)} − ${brl2(p.custoProducaoUnidade)} = ${brl2(p.sobraUnidade)}`,
  ];

  if (p.sobraUnidade < 0) {
    d.push({
      tipo: "alerta",
      titulo: "Vendeu abaixo do custo de produção",
      texto: `Cada unidade vendida custou mais para produzir do que a empresa recebeu por ela. Por isso, quanto mais vendeu, maior ficou o prejuízo: foram ${num(p.unidades)} unidades, cada uma com perda de ${brl2(Math.abs(p.sobraUnidade))} antes de qualquer despesa.`,
      contas: [...contaSobra, `Perda só na produção = ${num(p.unidades)} × ${brl2(Math.abs(p.sobraUnidade))} = ${brl(Math.abs(p.sobraUnidade) * p.unidades)}`],
    });
  } else if (p.sobraPct < 10) {
    d.push({
      tipo: "alerta",
      titulo: "Sobra pequena em cada unidade",
      texto: `Depois de pagar os tributos e o custo de produção, sobram só ${brl2(p.sobraUnidade)} por unidade (${pct(p.sobraPct)} do que a empresa recebe). Com uma sobra tão pequena, é preciso vender muito para pagar as despesas.`,
      contas: contaSobra,
    });
  }

  const despesas = p.comunicacao + p.distribuicao + p.administrativas;
  if (p.resultado < 0 && p.lucroBruto > 0 && p.lucroBruto < despesas) {
    d.push({
      tipo: "alerta",
      titulo: "As despesas foram maiores que a sobra das vendas",
      texto: `A sobra das vendas (lucro bruto) não cobriu as despesas de comunicação, distribuição e administração do produto.`,
      contas: [
        `Lucro bruto = ${num(p.unidades)} unidades × ${brl2(p.sobraUnidade)} ≈ ${brl(p.lucroBruto)}`,
        `Despesas = comunicação ${brl(p.comunicacao)} + distribuição ${brl(p.distribuicao)} + administrativas ${brl(p.administrativas)} = ${brl(despesas)}`,
        `Resultado = ${brl(p.lucroBruto)} − ${brl(despesas)} = ${brl(p.resultado)}`,
      ],
    });
  }

  if (p.resultado < 0 && p.unidades > 0) {
    d.push({
      tipo: "alerta",
      titulo: "Preço mínimo para não ter prejuízo com esse volume",
      texto: `Com as ${num(p.unidades)} unidades vendidas, o preço que zeraria o prejuízo seria de cerca de ${brl(p.precoMinimo)}. A equipe praticou ${brl(p.preco)}. Esse preço mínimo muda se o volume mudar: com mais unidades, as despesas se dividem por mais aparelhos.`,
      contas: [
        `Despesas por unidade = ${brl(despesas)} ÷ ${num(p.unidades)} = ${brl2(p.despesasUnidade)}`,
        `Custo total por unidade = produção ${brl2(p.custoProducaoUnidade)} + despesas ${brl2(p.despesasUnidade)} = ${brl2(p.custoTotalUnidade)}`,
        `Preço mínimo = custo total ÷ 0,88 = ${brl2(p.custoTotalUnidade)} ÷ 0,88 = ${brl2(p.precoMinimo)}`,
      ],
    });
  }

  if (p.comunicacao <= 0) {
    d.push({
      tipo: "alerta",
      titulo: "Nenhum investimento em comunicação",
      texto: `O produto não teve mídia comprada nesta rodada. Sem comunicação, a lembrança da marca cai de uma semana para outra, e o produto perde força na disputa por clientes (Manual do Aluno, A.5).`,
    });
  } else if (p.receitaBruta > 0 && p.comunicacao / p.receitaBruta < 0.01) {
    d.push({
      tipo: "alerta",
      titulo: "Comunicação muito baixa",
      texto: `O investimento em mídias foi de ${brl(p.comunicacao)}, menos de 1% da receita do produto. Pouca comunicação mantém a lembrança da marca baixa (Manual do Aluno, A.5).`,
      contas: [`Comunicação ÷ receita bruta = ${brl(p.comunicacao)} ÷ ${brl(p.receitaBruta)} = ${pct((p.comunicacao / p.receitaBruta) * 100, 2)}`],
    });
  }

  if (p.mediaCategoria != null && p.diferencaReferenciaPct < -10 && p.participacao < p.mediaCategoria) {
    d.push({
      tipo: "alerta",
      titulo: "O preço baixo não trouxe o volume esperado",
      texto: `O preço ficou ${pct(Math.abs(p.diferencaReferenciaPct), 0)} abaixo da referência do mercado, mas a participação (${pct(p.participacao)}) ficou abaixo da média da categoria (${pct(p.mediaCategoria)}). Preço baixo sozinho atrai pouco quando a marca é pouco lembrada ou o produto é pouco valorizado (Manual do Aluno, A.2).`,
      contas: [
        `Diferença para a referência = ${brl(p.preco)} ÷ ${brl(p.precoReferencia)} − 1 = ${pct(p.diferencaReferenciaPct, 0)}`,
        `Média da categoria = 100% ÷ número de empresas na categoria = ${pct(p.mediaCategoria)}`,
      ],
    });
  }

  if (p.segmento != null) {
    if (p.contradicoes > 0 || (p.aderencia != null && p.aderencia < 0.5)) {
      d.push({
        tipo: "alerta",
        titulo: "Público-alvo pouco claro",
        texto: `A segmentação do produto foi lida como "${p.segmento}", com aderência de ${(p.aderencia ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} (de 0 a 1)${p.contradicoes > 0 ? ` e ${p.contradicoes} combinação(ões) contraditória(s)` : ""}. Quanto menor a aderência, menor o ganho de atratividade junto ao público escolhido (Manual do Aluno, A.3).`,
      });
    } else {
      d.push({
        tipo: "ok",
        titulo: "Público-alvo coerente",
        texto: `A segmentação foi lida como "${p.segmento}", com aderência de ${(p.aderencia ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} e sem contradições. O público não explica o resultado.`,
      });
    }
  }

  for (const a of alertasAlinhamento) {
    d.push({ tipo: "alerta", titulo: "Alerta do alinhamento estratégico", texto: a });
  }
  return d;
}

function diagnosticosDaEquipe(e: EquipeRelatorio, alinhamento: number | null): Diagnostico[] {
  const d: Diagnostico[] = [];
  if (e.verbaInicial > 0) {
    const uso = (e.verbaUsada / e.verbaInicial) * 100;
    if (uso < 70) {
      d.push({
        tipo: "alerta",
        titulo: "Parte da verba ficou sem uso",
        texto: `A equipe usou ${pct(uso, 0)} da verba de marketing da rodada. O que não é gasto não volta como vantagem: a verba da próxima rodada depende da receita, não da economia feita.`,
        contas: [`Verba usada = comunicação + distribuição = ${brl(e.verbaUsada)} de ${brl(e.verbaInicial)} = ${pct(uso, 0)}`],
      });
    }
  }
  if (e.multiplicadorCusto && Math.abs(e.multiplicadorCusto - 1) >= 0.005) {
    d.push({
      tipo: e.multiplicadorCusto > 1 ? "alerta" : "ok",
      titulo: "Efeito do dólar e da inflação no custo",
      texto: `Nesta semana, o custo de produção foi multiplicado por ${e.multiplicadorCusto.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} por causa do dólar e da inflação (Manual do Aluno, A.7).`,
    });
  }
  if (alinhamento != null) {
    d.push({
      tipo: alinhamento >= 70 ? "ok" : "alerta",
      titulo: `Alinhamento estratégico: ${Math.round(alinhamento)} de 100`,
      texto: alinhamento >= 70 ? "As decisões ficaram coerentes com as análises da rodada; os alertas, se houver, aparecem em cada produto." : "As decisões ficaram pouco coerentes com as análises da rodada; veja os alertas em cada produto.",
    });
  }
  return d;
}

function conversaComAEquipe(e: EquipeRelatorio): string[] {
  const linhas: string[] = [];
  const pior = [...e.produtos].sort((a, b) => a.resultado - b.resultado)[0];
  if (!pior) return linhas;
  if (pior.resultado < 0) {
    if (pior.sobraUnidade < 0) {
      linhas.push(`O ponto principal é o ${pior.nome}: o preço de ${brl(pior.preco)} ficou abaixo do custo de produção de ${brl(pior.custoProducaoUnidade)}, que a equipe via na aba Produto. Vender mais, nesse caso, só aumenta o prejuízo.`);
    } else {
      linhas.push(`O ponto principal é o ${pior.nome}. Cada unidade deixou ${brl2(pior.sobraUnidade)} depois do custo de produção, mas carregou ${brl2(pior.despesasUnidade)} de despesas. Com ${num(pior.unidades)} unidades, o preço mínimo para não ter prejuízo seria de cerca de ${brl(pior.precoMinimo)}, e a equipe praticou ${brl(pior.preco)}.`);
      linhas.push(`Há dois caminhos para fechar essa diferença: vender mais unidades (para dividir as despesas) ou aumentar a sobra de cada unidade. A escolha é da equipe; a conta está no Manual do Aluno, seção C.5.`);
    }
    linhas.push(`Estratégia de preço escolhida no ${pior.nome}: ${pior.estrategiaPreco}.`);
  } else {
    linhas.push(`Todos os produtos deram lucro. O que mais contribuiu foi o ${[...e.produtos].sort((a, b) => b.resultado - a.resultado)[0].nome}. Vale a equipe registrar o que fez, porque os concorrentes reagem ao líder nas próximas semanas (Manual do Aluno, A.9).`);
  }
  return linhas;
}
