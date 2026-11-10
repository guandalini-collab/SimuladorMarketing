/**
 * Análise de concorrentes semanal (nov/2026, correções da Rodada 3).
 *
 * Para cada produto da equipe, monta o roteiro pedido pelo professor
 * (identificar concorrentes; matriz comparativa dos 4 Ps; SWOT em relação aos
 * concorrentes; pontos cegos dos concorrentes) a partir de:
 * - o estado do mercado gravado no fechamento da rodada anterior (empresas do
 *   jogo: equipes e concorrentes simulados);
 * - as marcas reais pesquisadas com fonte (shared/marcasReais.ts);
 * - o calendário e a preferência do consumidor da semana (os mesmos do
 *   Simula+ News).
 * Tudo é calculado, com critério explícito; não há texto livre de IA. Das
 * outras equipes, mostra só o que seria observável no mercado real (preço,
 * qualidade, canais, cobertura, participação e unidades), sem o valor
 * investido em comunicação (decisão do professor, 10/11/2026). Sem
 * recomendações: a análise descreve, a equipe decide. Só leitura.
 *
 * SWOT conforme a literatura (KOTLER; KELLER, 2019, p. 52-55): forças e fraquezas são
 * fatores internos, avaliados em comparação com os concorrentes;
 * oportunidades e ameaças são fatores do ambiente externo.
 */
import type { IStorage } from "../storage";
import type { Class, Round, Team } from "@shared/schema";
import { pool } from "../pg-storage";
import { categoriaDoProduto } from "./marketBulletin";
import { setorDaTurma } from "./roundCompletionCompetitive";
import { custoUnitarioEstimado } from "@shared/fichaProduto";
import { concorrenciaDaCategoria, type ConcorrenciaDaCategoria } from "@shared/marcasReais";

const QUALIDADES = ["basico", "medio", "premium"] as const;
const NOME_QUALIDADE: Record<string, string> = { basico: "básica", medio: "média", premium: "premium" };
const CANAIS = ["varejo", "ecommerce", "marketplace", "atacado", "franquias", "direto"] as const;
const NOME_CANAL: Record<string, string> = { varejo: "Varejo físico", ecommerce: "E-commerce próprio", marketplace: "Marketplaces", atacado: "Atacado", franquias: "Franquias", direto: "Venda direta" };
const COBERTURAS = ["local", "regional", "nacional", "internacional"] as const;
const NOME_COBERTURA: Record<string, string> = { local: "Local", regional: "Regional", nacional: "Nacional", internacional: "Internacional" };
const NOME_POSICIONAMENTO: Record<string, string> = { qualidade: "qualidade", preco: "preço", inovacao: "inovação" };

const brl = (v: number) => (Math.round(v) < 0 ? "−" : "") + "R$ " + Math.abs(Math.round(v)).toLocaleString("pt-BR");
const pct = (v: number, c = 1) => v.toLocaleString("pt-BR", { minimumFractionDigits: c, maximumFractionDigits: c }) + "%";

export interface ItemSwot { texto: string; criterio: string }

export interface EmpresaNaMatriz {
  empresa: string;
  tipo: "sua equipe" | "equipe" | "concorrente simulado";
  preco: number;
  qualidade: string;
  canais: string[];
  cobertura: string;
  participacao: number;
  unidades: number;
}

export interface AnaliseDoProduto {
  produtoId: string;
  produto: string;
  categoria: string;
  precoReferencia: number;
  diretos: { jogo: { empresa: string; tipo: string }[]; marcasReais: string[] };
  indiretos: string[];
  novosEntrantes: { nome: string; fonte: string }[];
  matriz: EmpresaNaMatriz[];
  media: { preco: number; participacao: number; unidades: number; canais: number } | null;
  marcasReais: ConcorrenciaDaCategoria["marcas"];
  lacunas: string[];
  fontes: string[];
  swot: { forcas: ItemSwot[]; fraquezas: ItemSwot[]; oportunidades: ItemSwot[]; ameacas: ItemSwot[] };
  pontosCegos: ItemSwot[];
  semDadosDaEquipe: boolean;
}

export interface AnaliseConcorrentes {
  disponivel: boolean;
  mensagem?: string;
  rodadaBase?: number;
  rodadaAtual?: number;
  dataComercial?: string | null;
  preferencia?: string;
  produtos: AnaliseDoProduto[];
  referenciaSwot: string;
}

const REFERENCIA_SWOT = "KOTLER, P.; KELLER, K. L. Administração de marketing. 15. ed. São Paulo: Pearson Education do Brasil, 2019, p. 52-55 (análise SWOT: oportunidades e ameaças no ambiente externo; forças e fraquezas no ambiente interno, com checklist que inclui participação de mercado, satisfação do cliente, preço, distribuição e cobertura geográfica). Na tela, forças e fraquezas são comparadas com os concorrentes da categoria; a lembrança de marca é critério do simulador (Manual do Aluno, A.5).";

export async function montarAnaliseConcorrentes(storage: IStorage, classData: Class, team: Team): Promise<AnaliseConcorrentes> {
  const setor: any = setorDaTurma(classData);
  const rounds = (await storage.getRoundsByClass(classData.id)).filter((r) => !r.isPractice).sort((a, b) => a.roundNumber - b.roundNumber);
  const atual: Round | undefined = rounds.find((r) => r.status === "active") ?? rounds.find((r) => r.status === "locked") ?? rounds[rounds.length - 1];
  const encerradas = rounds.filter((r) => r.status === "completed" && (!atual || r.roundNumber < atual.roundNumber || atual.status === "completed"));
  const base = encerradas[encerradas.length - 1];
  if (!base) {
    return { disponivel: false, mensagem: "A análise de concorrentes aparece depois que a primeira rodada for encerrada, porque usa os resultados do mercado.", produtos: [], referenciaSwot: REFERENCIA_SWOT };
  }
  let estado: any = null;
  try {
    const r = await pool.query(`SELECT estado FROM market_states WHERE round_id = $1 LIMIT 1`, [base.id]);
    estado = r.rows[0]?.estado && Array.isArray(r.rows[0].estado.categorias) ? r.rows[0].estado : null;
  } catch {
    estado = null;
  }
  if (!estado) {
    return { disponivel: false, mensagem: "O registro do mercado da rodada anterior não foi encontrado.", produtos: [], referenciaSwot: REFERENCIA_SWOT };
  }

  // Semana atual: data comercial e preferência do consumidor (as mesmas do Simula+ News).
  let dataComercial: string | null = null;
  let preferencia: string | undefined;
  try {
    const { semanaSimulada } = await import("@shared/rodadaSemanal");
    const { sazonalidadeDaSemana, preferenciaDaSemana } = await import("@shared/calendarioMercado");
    const rodadaSemana = atual && atual.status !== "completed" ? atual : undefined;
    if (rodadaSemana) {
      const abertura = rodadaSemana.scheduledStartAt ?? rodadaSemana.startedAt;
      const saz = sazonalidadeDaSemana(abertura ? semanaSimulada(abertura)?.inicio : null);
      dataComercial = saz.rotulo;
      preferencia = preferenciaDaSemana(classData.id, rodadaSemana.roundNumber, saz);
    }
  } catch {
    /* sem calendário: os itens dependentes ficam de fora */
  }

  const mixesBase = await storage.getMarketingMixesByTeamAndRound(team.id, base.id);
  const produtosTodos = (await storage.getProductsBySector(classData.sector as string)).sort((a: any, b: any) => a.orderIndex - b.orderIndex);
  const qtd = atual && atual.status !== "completed" ? atual.productCount : base.productCount;
  const produtos = produtosTodos.slice(0, Math.max(1, qtd || 1));
  const multiplicador = Number(estado.custos?.multiplicador) || 1;
  const nomesEquipes = new Map<string, string>();
  for (const t of await storage.getTeamsByClass(classData.id)) nomesEquipes.set(t.id, t.companyName || t.name);

  const analises: AnaliseDoProduto[] = [];
  for (const produto of produtos) {
    const cat: any = categoriaDoProduto(classData.sector, produto) ?? setor?.categories?.[0];
    if (!cat) continue;
    const catEstado = estado.categorias.find((c: any) => c.categoriaId === cat.id);
    const real = concorrenciaDaCategoria(setor?.id, cat.id);
    const ofertas: any[] = catEstado?.ofertas ?? [];
    const matriz: EmpresaNaMatriz[] = ofertas.map((o) => ({
      empresa: o.tipo === "equipe" && o.equipeId ? (nomesEquipes.get(o.equipeId) ?? o.empresa) : o.empresa,
      tipo: (o.tipo === "equipe" ? (o.equipeId === team.id ? "sua equipe" : "equipe") : "concorrente simulado") as EmpresaNaMatriz["tipo"],
      preco: o.preco,
      qualidade: NOME_QUALIDADE[o.qualidade] ?? o.qualidade,
      canais: (o.canais ?? []).map((c: string) => NOME_CANAL[c] ?? c),
      cobertura: NOME_COBERTURA[o.cobertura] ?? o.cobertura,
      participacao: o.participacaoValor,
      unidades: o.unidades,
    })).sort((a, b) => b.participacao - a.participacao);
    const n = ofertas.length;
    const media = n > 0 ? {
      preco: ofertas.reduce((s, o) => s + o.preco, 0) / n,
      participacao: 100 / n,
      unidades: ofertas.reduce((s, o) => s + o.unidades, 0) / n,
      canais: ofertas.reduce((s, o) => s + (o.canais?.length ?? 0), 0) / n,
    } : null;

    const minha = ofertas.find((o) => o.tipo === "equipe" && o.equipeId === team.id);
    const outras = ofertas.filter((o) => o !== minha);
    const mediaOutras = (campo: string) => (outras.length > 0 ? outras.reduce((s, o) => s + (Number(o[campo]) || 0), 0) / outras.length : 0);
    const forcas: ItemSwot[] = [];
    const fraquezas: ItemSwot[] = [];
    const oportunidades: ItemSwot[] = [];
    const ameacas: ItemSwot[] = [];

    // ---- Ambiente interno (forças e fraquezas), em relação aos concorrentes
    if (minha && outras.length > 0) {
      const compara = (valor: number, ref: number, rotulo: string, formatar: (v: number) => string, criterio: string) => {
        const item = { texto: `${rotulo}: ${formatar(valor)} (média dos concorrentes: ${formatar(ref)}).`, criterio };
        if (valor >= ref) forcas.push(item); else fraquezas.push(item);
      };
      compara(minha.participacaoValor, mediaOutras("participacaoValor"), "Participação de mercado", (v) => pct(v), "Comparação da participação da equipe com a média das demais empresas da categoria; acima ou igual à média = força, abaixo = fraqueza.");
      compara(minha.satisfacao, mediaOutras("satisfacao"), "Satisfação dos clientes (0 a 100)", (v) => v.toLocaleString("pt-BR", { maximumFractionDigits: 0 }), "Comparação da satisfação dos clientes da equipe com a média das demais empresas (Manual do Aluno, A.6).");
      compara(minha.lembranca * 100, mediaOutras("lembranca") * 100, "Lembrança de marca", (v) => pct(v, 0), "Comparação da lembrança de marca da equipe com a média das demais empresas (Manual do Aluno, A.5).");
      compara(minha.canais?.length ?? 0, outras.reduce((s, o) => s + (o.canais?.length ?? 0), 0) / outras.length, "Número de canais de venda", (v) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 }), "Comparação do número de canais da equipe com a média das demais empresas; mais canais = distribuição mais ampla.");
      const mix: any = mixesBase.find((m: any) => m.productId === produto.id);
      if (mix && cat.averagePrice && setor?.margemBruta != null) {
        const custo = custoUnitarioEstimado(cat.averagePrice, setor.margemBruta, mix.productQuality, mix.productFeatures) * multiplicador;
        const recebe = (Number(mix.priceValue) || minha.preco) * 0.88;
        if (recebe < custo) {
          fraquezas.push({ texto: `Preço abaixo do custo de produção: a empresa recebeu ${brl(recebe)} por unidade (preço menos 12% de tributos) e o custo de produção foi de ${brl(custo)}.`, criterio: "Receita líquida por unidade comparada com o custo de produção por unidade (Manual do Aluno, A.7 e C.5)." });
        }
      }
    }

    // ---- Ambiente externo (oportunidades e ameaças)
    if (dataComercial) {
      oportunidades.push({ texto: `Data comercial desta semana: ${dataComercial}. A demanda da categoria fica maior que numa semana comum.`, criterio: "Calendário comercial do simulador, publicado no Simula+ News (Manual do Aluno, A.4)." });
    }
    if (preferencia && preferencia !== "equilibrada") {
      const posAnterior = (mixesBase.find((m: any) => m.productId === produto.id) as any)?.brandPositioning as string | undefined;
      const texto = `Preferência dos consumidores nesta semana: ${NOME_POSICIONAMENTO[preferencia] ?? preferencia} (Simula+ News).`;
      if (posAnterior && posAnterior === preferencia) {
        oportunidades.push({ texto: `${texto} Na rodada anterior, o produto foi posicionado em ${NOME_POSICIONAMENTO[posAnterior] ?? posAnterior}.`, criterio: "Preferência da semana igual ao posicionamento usado pela equipe na rodada anterior = oportunidade (Manual do Aluno, A.4)." });
      } else if (posAnterior) {
        ameacas.push({ texto: `${texto} Na rodada anterior, o produto foi posicionado em ${NOME_POSICIONAMENTO[posAnterior] ?? posAnterior}.`, criterio: "Preferência da semana diferente do posicionamento usado pela equipe na rodada anterior = ameaça (Manual do Aluno, A.4)." });
      }
    }
    if (multiplicador > 1.0005) {
      ameacas.push({ texto: `O custo de produção estava ${pct((multiplicador - 1) * 100)} acima da semana-base na rodada anterior, por causa do dólar e da inflação.`, criterio: "Multiplicador de custo registrado no fechamento da rodada anterior (Manual do Aluno, A.7)." });
    } else if (multiplicador < 0.9995) {
      oportunidades.push({ texto: `O custo de produção estava ${pct((1 - multiplicador) * 100)} abaixo da semana-base na rodada anterior, por causa do dólar e da inflação.`, criterio: "Multiplicador de custo registrado no fechamento da rodada anterior (Manual do Aluno, A.7)." });
    }
    const lider = estado.lideranca?.[cat.id];
    if (lider && lider.equipeId === team.id) {
      ameacas.push({ texto: `A equipe liderou a categoria ${cat.name} por ${lider.rodadas} rodada(s) seguida(s). Os concorrentes simulados do mesmo território de preço reagem à empresa líder.`, criterio: "Registro de liderança da categoria e regra de reação ao líder (Manual do Aluno, A.9)." });
    }
    if (minha) {
      const ordem = (q: string) => QUALIDADES.indexOf(q as any);
      const maisBaratos = outras.filter((o) => o.preco < minha.preco && ordem(o.qualidade) >= ordem(minha.qualidade));
      if (maisBaratos.length > 0) {
        ameacas.push({ texto: `${maisBaratos.length} concorrente(s) venderam com preço menor e qualidade igual ou superior à da equipe: ${maisBaratos.map((o) => (o.tipo === "equipe" && o.equipeId ? (nomesEquipes.get(o.equipeId) ?? o.empresa) : o.empresa)).join(", ")}.`, criterio: "Comparação de preço e qualidade de cada concorrente com os da equipe, na rodada anterior." });
      }
    }
    for (const ne of real?.novosEntrantes ?? []) {
      ameacas.push({ texto: `Nova marca no mercado brasileiro: ${ne.nome}.`, criterio: `Novos entrantes identificados em fonte de mercado: ${ne.fonte}.` });
    }

    // ---- Pontos cegos dos concorrentes (o que nenhuma empresa fez)
    const pontosCegos: ItemSwot[] = [];
    if (n > 0) {
      const qualidadesUsadas = new Set(ofertas.map((o) => o.qualidade));
      for (const q of QUALIDADES) if (!qualidadesUsadas.has(q)) pontosCegos.push({ texto: `Nenhuma empresa vendeu ${cat.name.toLowerCase()} de qualidade ${NOME_QUALIDADE[q]}.`, criterio: "Qualidades usadas pelas empresas da categoria na rodada anterior." });
      const canaisUsados = new Set(ofertas.flatMap((o) => o.canais ?? []));
      for (const c of CANAIS) if (!canaisUsados.has(c)) pontosCegos.push({ texto: `Nenhuma empresa usou o canal ${NOME_CANAL[c]}.`, criterio: "Canais usados pelas empresas da categoria na rodada anterior." });
      const coberturasUsadas = new Set(ofertas.map((o) => o.cobertura));
      for (const c of COBERTURAS) if (!coberturasUsadas.has(c)) pontosCegos.push({ texto: `Nenhuma empresa usou a cobertura ${NOME_COBERTURA[c].toLowerCase()}.`, criterio: "Coberturas usadas pelas empresas da categoria na rodada anterior." });
    }
    if (pontosCegos.length > 0) {
      oportunidades.push({ texto: `${pontosCegos.length} espaço(s) do mercado não atendido(s) por nenhuma empresa na rodada anterior (lista na etapa 5, Pontos cegos dos concorrentes).`, criterio: "Qualidades, canais e coberturas que nenhuma empresa da categoria usou na rodada anterior." });
    }

    analises.push({
      produtoId: produto.id,
      produto: produto.name,
      categoria: cat.name,
      precoReferencia: cat.averagePrice,
      diretos: {
        jogo: matriz.filter((m) => m.tipo !== "sua equipe").map((m) => ({ empresa: m.empresa, tipo: m.tipo })),
        marcasReais: (real?.marcas ?? []).map((m) => m.nome),
      },
      indiretos: real?.substitutos ?? [],
      novosEntrantes: real?.novosEntrantes ?? [],
      matriz,
      media,
      marcasReais: real?.marcas ?? [],
      lacunas: real?.lacunas ?? ["Não há levantamento de marcas reais para esta categoria."],
      fontes: real?.fontes ?? [],
      swot: { forcas, fraquezas, oportunidades, ameacas },
      pontosCegos,
      semDadosDaEquipe: !minha,
    });
  }

  return {
    disponivel: true,
    rodadaBase: base.roundNumber,
    rodadaAtual: atual && atual.status !== "completed" ? atual.roundNumber : undefined,
    dataComercial,
    preferencia,
    produtos: analises,
    referenciaSwot: REFERENCIA_SWOT,
  };
}
