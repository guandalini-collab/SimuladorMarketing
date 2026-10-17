/**
 * Motor de mercado competitivo do Simula+ (v3, out/2026).
 *
 * Pedido do professor: as equipes são concorrentes de verdade num mesmo
 * mercado, a receita nasce do mercado (e não do orçamento), o preço é
 * comparado ao preço médio real do setor e os números ficam o mais
 * próximos possível da realidade. Regras aprovadas:
 *
 * 1. Praça: Rio Grande do Sul — mercado nacional real do setor × 5,26%
 *    (participação do RS na população, IBGE 2025). Coerente com o catálogo
 *    de mídias, que usa preços do RS.
 * 2. Disputam o mercado as equipes e os concorrentes simulados da turma
 *    (nomes fictícios, perfis definidos). As fatias somam 100%.
 * 3. Verba de marketing pelo método da porcentagem sobre as vendas
 *    (KOTLER; KELLER): inicial = % do setor × receita de referência;
 *    seguintes = % × receita obtida, com piso de 30% da inicial.
 * 4. Custos calibrados pela realidade: custo do produto pela margem bruta
 *    real do setor (Damodaran); despesas administrativas calibradas para
 *    que a empresa "média" tenha a margem líquida real do setor.
 * 5. Concorrentes simulados começam com marca conhecida; equipes, com marca
 *    nova, construída ao longo das rodadas (memória de marca — adstock).
 *
 * Participação de mercado pelo modelo de atratividade (attraction model,
 * COOPER; NAKANISHI, 1988): fatia_i = A_i / Σ A_j. A demanda total da
 * categoria parte do tamanho real do mercado e reage ao nível de preço,
 * à sazonalidade/boletim e aos eventos da semana.
 *
 * Os números marcados como PARÂMETRO DO MODELO são hipóteses do simulador
 * (inspiradas na literatura), não estatísticas oficiais — o manual deixa
 * essa distinção explícita.
 *
 * Este arquivo é puro (sem banco): recebe tudo pronto e devolve tudo
 * calculado, para poder ser testado com equipes fictícias.
 */

// ---------------------------------------------------------------- constantes

/** Participação do RS na população brasileira (IBGE 2025: 11.233.263 / 213,4 mi). */
export const PARTICIPACAO_RS = 11_233_263 / 213_400_000;
export const SEMANAS_NO_ANO = 52;
/** Piso da verba: 30% da verba inicial (aprovado pelo professor, out/2026). */
export const PISO_VERBA = 0.3;
/** PARÂMETRO DO MODELO: tributos sobre vendas, alíquota simplificada. */
export const ALIQUOTA_TRIBUTOS_VENDA = 0.12;
/** IRPJ + CSLL (lucro real): 34% sobre o lucro antes do IR, quando positivo. */
export const ALIQUOTA_IR_CSLL = 0.34;

/** PARÂMETRO DO MODELO: elasticidade-preço da escolha entre marcas, por setor. */
export const ELASTICIDADE_SETOR: Record<string, number> = {
  eletronicos: 1.8,
  alimentos: 1.2,
  moda: 1.5,
  cosmeticos: 1.3,
  moveis: 1.4,
  automotivo: 1.4,
  esportes: 1.4,
  saude: 0.8,
  educacao: 0.9,
  pets: 1.1,
  construcao: 1.2,
  entretenimento: 1.3,
};

/** PARÂMETRO DO MODELO: valor percebido por nível de qualidade e de recursos. */
const VALOR_QUALIDADE: Record<string, number> = { basico: 0.85, medio: 1.0, premium: 1.3 };
const VALOR_RECURSOS: Record<string, number> = { basico: 0.96, intermediario: 1.0, completo: 1.08 };
/** PARÂMETRO DO MODELO: custo relativo por nível de qualidade e de recursos. */
const CUSTO_QUALIDADE: Record<string, number> = { basico: 0.82, medio: 1.0, premium: 1.2 };
const CUSTO_RECURSOS: Record<string, number> = { basico: 0.94, intermediario: 1.0, completo: 1.08 };
/** PARÂMETRO DO MODELO: alcance da cobertura dentro da praça (RS). */
const ALCANCE_COBERTURA: Record<string, number> = { local: 0.55, regional: 0.85, nacional: 1.0, internacional: 1.0 };
/** PARÂMETRO DO MODELO: custo semanal de distribuição, em % da receita de referência. */
export const CUSTO_COBERTURA: Record<string, number> = { local: 0.005, regional: 0.01, nacional: 0.015, internacional: 0.02 };
export const CUSTO_POR_CANAL = 0.005;

/** PARÂMETRO DO MODELO: memória de marca (adstock semanal) e resposta à comunicação. */
const RETENCAO_LEMBRANCA = 0.7;
const ESCALA_COMUNICACAO = 0.01; // investir ~1% do valor semanal da categoria gera ~63% de lembrança potencial
const LEMBRANCA_INICIAL_EQUIPE = 0.25;
const RETENCAO_FIDELIDADE = 0.7;

// ---------------------------------------------------------------- tipos

export interface DecisaoProduto {
  qualidade: string;          // basico | medio | premium
  recursos: string;           // basico | intermediario | completo
  posicionamento: string;     // qualidade | preco | inovacao
  estrategiaPreco: string;    // penetracao | competitivo | skimming | valor
  preco: number;
  canais: string[];
  cobertura: string;          // local | regional | nacional | internacional
  investimentoComunicacao: number; // R$ na semana (soma das mídias)
}

export interface Oferta {
  id: string;                 // equipe:produto ou concorrente:id
  tipo: "equipe" | "concorrente";
  empresa: string;            // nome exibido
  equipeId?: string;
  produtoId?: string;
  decisao: DecisaoProduto;
  lembrancaAnterior: number;  // 0..1
  fidelidadeAnterior: number; // 0..100
}

export interface ContextoCategoria {
  setorId: string;
  categoriaId: string;
  categoriaNome: string;
  precoReferencia: number;
  /** Valor semanal da categoria na praça, ao preço de referência (R$). */
  valorSemanal: number;
  margemBruta: number;        // %
  verbaMarketingPct: number;  // %
  despesaAdminPct: number;    // % da receita de referência por empresa
  numeroEmpresas: number;     // equipes + concorrentes (para a receita de referência)
  multiplicadorDemanda: number;   // sazonalidade, boletim e eventos
  multiplicadorSensibilidade: number; // boletim: sensibilidade a preço
}

export interface ResultadoOferta {
  id: string;
  tipo: "equipe" | "concorrente";
  empresa: string;
  equipeId?: string;
  produtoId?: string;
  categoriaId: string;
  preco: number;
  unidades: number;
  receitaBruta: number;
  participacaoValor: number;    // % da receita da categoria
  participacaoUnidades: number; // % das unidades da categoria
  lembranca: number;            // 0..1 (lembrança de marca após a semana)
  fidelidade: number;           // 0..100
  satisfacao: number;           // 0..100
  valorPercebido: number;       // índice (1 = média do mercado)
  atratividade: number;
  // custos (só fazem sentido para equipes, mas calculados para todos)
  custoUnitario: number;
  cpv: number;
  tributos: number;
  comunicacao: number;
  distribuicao: number;
  administrativo: number;
}

export interface ResultadoCategoria {
  categoriaId: string;
  categoriaNome: string;
  precoReferencia: number;
  demandaUnidades: number;
  receitaTotal: number;
  precoMedioPraticado: number;
  ofertas: ResultadoOferta[];
}

// ---------------------------------------------------------------- utilitários

const limitar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Despesa administrativa (% da receita líquida) que leva a empresa "média"
 * à margem líquida real do setor:
 *   margem líquida = (margem bruta − verba de marketing − administrativo) × (1 − IR/CSLL)
 * As margens de Damodaran são sobre a receita líquida de tributos sobre vendas.
 */
export function despesaAdministrativaCalibrada(margemBruta: number, verbaPct: number, margemLiquida: number): number {
  // A verba de marketing cobre comunicação e distribuição (é o que a equipe
  // decide gastar); por isso só ela entra aqui, sem somar distribuição à parte.
  const lucroAntesIr = margemLiquida / (1 - ALIQUOTA_IR_CSLL);
  return Math.max(2, margemBruta - verbaPct - lucroAntesIr);
}

/** Receita de referência de uma empresa numa categoria (R$/semana). */
export function receitaReferencia(ctx: Pick<ContextoCategoria, "valorSemanal" | "numeroEmpresas">): number {
  return ctx.valorSemanal / Math.max(1, ctx.numeroEmpresas);
}

export function custoDistribuicao(decisao: Pick<DecisaoProduto, "canais" | "cobertura">, receitaRef: number): number {
  const cobertura = CUSTO_COBERTURA[decisao.cobertura] ?? CUSTO_COBERTURA.regional;
  return receitaRef * (cobertura + CUSTO_POR_CANAL * Math.max(1, decisao.canais.length));
}

function valorPercebido(d: DecisaoProduto): number {
  return (VALOR_QUALIDADE[d.qualidade] ?? 1) * (VALOR_RECURSOS[d.recursos] ?? 1);
}

/** Sinais de preço incoerentes com o produto reduzem a atratividade (silencioso). */
function coerenciaPrecoProduto(d: DecisaoProduto, precoRef: number): number {
  const r = d.preco / precoRef;
  let f = 1;
  if (d.qualidade === "premium" && r < 0.7) f *= 0.85;   // "barato demais para ser premium"
  if (d.qualidade === "basico" && r > 1.4) f *= 0.75;    // preço de premium em produto básico
  if (d.estrategiaPreco === "skimming" && r < 1.0) f *= 0.92;
  if (d.estrategiaPreco === "penetracao" && r > 1.1) f *= 0.92;
  if (d.posicionamento === "preco" && r > 1.15) f *= 0.9;
  return f;
}

function alcanceDistribuicao(d: DecisaoProduto): number {
  const cobertura = ALCANCE_COBERTURA[d.cobertura] ?? ALCANCE_COBERTURA.regional;
  const canais = 1 - Math.exp(-0.6 * Math.max(1, d.canais.length));
  return cobertura * canais;
}

// ---------------------------------------------------------------- núcleo

/**
 * @param fatoresAtratividade multiplicadores opcionais da atratividade de
 *   cada oferta (ex.: alinhamento estratégico da equipe); 1 = neutro.
 */
export function calcularCategoria(ctx: ContextoCategoria, ofertas: Oferta[], fatoresAtratividade?: number[]): ResultadoCategoria {
  const ref = ctx.precoReferencia;
  const elasticidade = (ELASTICIDADE_SETOR[ctx.setorId] ?? 1.2) * ctx.multiplicadorSensibilidade;
  const escalaComunicacao = Math.max(1, ctx.valorSemanal * ESCALA_COMUNICACAO);

  // 1) Lembrança de marca após a semana (adstock)
  const lembrancas = ofertas.map((o) => {
    const resposta = 1 - Math.exp(-o.decisao.investimentoComunicacao / escalaComunicacao);
    return limitar(RETENCAO_LEMBRANCA * o.lembrancaAnterior + (1 - RETENCAO_LEMBRANCA) * resposta, 0.02, 0.98);
  });

  // 2) Atratividade (modelo de atratividade multiplicativo)
  const atratividades = ofertas.map((o, i) => {
    const vp = valorPercebido(o.decisao);
    const precoEfetivo = o.decisao.preco / vp;
    const termoValor = Math.pow(Math.max(0.05, precoEfetivo / ref), -elasticidade);
    const termoMarca = Math.pow(lembrancas[i], 0.6);
    const termoDistribuicao = alcanceDistribuicao(o.decisao);
    const termoFidelidade = 0.85 + 0.3 * (o.fidelidadeAnterior / 100);
    const fator = fatoresAtratividade?.[i] ?? 1;
    return termoValor * termoMarca * termoDistribuicao * termoFidelidade * coerenciaPrecoProduto(o.decisao, ref) * fator;
  });
  const somaA = atratividades.reduce((a, b) => a + b, 0) || 1;
  const fatias = atratividades.map((a) => a / somaA);

  // 3) Demanda total da categoria: base real × sazonalidade/eventos × nível de preço
  const precoMedio = ofertas.reduce((s, o, i) => s + fatias[i] * o.decisao.preco, 0) || ref;
  const elasticidadeCategoria = 0.4 * elasticidade;
  const demandaBase = ctx.valorSemanal / ref;
  const demanda = demandaBase * ctx.multiplicadorDemanda * Math.pow(precoMedio / ref, -elasticidadeCategoria);

  const receitaRef = receitaReferencia(ctx);
  // Margem bruta (Damodaran) é sobre a receita líquida dos tributos sobre vendas.
  const custoBase = ref * (1 - ALIQUOTA_TRIBUTOS_VENDA) * (1 - ctx.margemBruta / 100);

  const resultados: ResultadoOferta[] = ofertas.map((o, i) => {
    const unidades = Math.max(0, Math.round(demanda * fatias[i]));
    const receitaBruta = unidades * o.decisao.preco;
    const vp = valorPercebido(o.decisao);
    const valorRelativo = vp / (o.decisao.preco / ref); // >1: mais valor que o preço sugere
    const satisfacao = limitar(50 + 30 * Math.log(valorRelativo) / Math.log(1.6) + 10 * (alcanceDistribuicao(o.decisao) - 0.5), 5, 98);
    const fidelidade = limitar(RETENCAO_FIDELIDADE * o.fidelidadeAnterior + (1 - RETENCAO_FIDELIDADE) * satisfacao, 0, 100);
    const custoUnitario = custoBase * (CUSTO_QUALIDADE[o.decisao.qualidade] ?? 1) * (CUSTO_RECURSOS[o.decisao.recursos] ?? 1);
    return {
      id: o.id,
      tipo: o.tipo,
      empresa: o.empresa,
      equipeId: o.equipeId,
      produtoId: o.produtoId,
      categoriaId: ctx.categoriaId,
      preco: o.decisao.preco,
      unidades,
      receitaBruta,
      participacaoValor: 0,
      participacaoUnidades: 0,
      lembranca: lembrancas[i],
      fidelidade,
      satisfacao,
      valorPercebido: valorRelativo,
      atratividade: atratividades[i],
      custoUnitario,
      cpv: unidades * custoUnitario,
      tributos: receitaBruta * ALIQUOTA_TRIBUTOS_VENDA,
      comunicacao: o.decisao.investimentoComunicacao,
      distribuicao: custoDistribuicao(o.decisao, receitaRef),
      // Estrutura semifixa: metade proporcional ao porte de referência, metade
      // ao porte real da empresa (uma empresa que vende menos tem estrutura menor).
      administrativo: (0.5 * receitaRef + 0.5 * receitaBruta) * (1 - ALIQUOTA_TRIBUTOS_VENDA) * (ctx.despesaAdminPct / 100),
    };
  });

  const receitaTotal = resultados.reduce((s, r) => s + r.receitaBruta, 0);
  const unidadesTotal = resultados.reduce((s, r) => s + r.unidades, 0);
  for (const r of resultados) {
    r.participacaoValor = receitaTotal > 0 ? (r.receitaBruta / receitaTotal) * 100 : 0;
    r.participacaoUnidades = unidadesTotal > 0 ? (r.unidades / unidadesTotal) * 100 : 0;
  }

  return {
    categoriaId: ctx.categoriaId,
    categoriaNome: ctx.categoriaNome,
    precoReferencia: ref,
    demandaUnidades: unidadesTotal,
    receitaTotal,
    precoMedioPraticado: unidadesTotal > 0 ? receitaTotal / unidadesTotal : ref,
    ofertas: resultados,
  };
}

// ---------------------------------------------------------------- concorrentes simulados

export interface PerfilConcorrente {
  id: string;
  nome: string;
  perfil: string;
  precoRelativo: number;
  qualidade: string;
  recursos: string;
  posicionamento: string;
  estrategiaPreco: string;
  cobertura: string;
  canais: string[];
  comunicacaoPct: number;   // % do valor semanal da categoria investido em comunicação
  lembrancaInicial: number;
  fidelidadeInicial: number;
}

/** PARÂMETRO DO MODELO: perfis dos concorrentes simulados (empresas fictícias, já estabelecidas). */
export const PERFIS_CONCORRENTES: PerfilConcorrente[] = [
  { id: "alfa", nome: "Alfa", perfil: "Líder premium", precoRelativo: 1.25, qualidade: "premium", recursos: "completo", posicionamento: "qualidade", estrategiaPreco: "skimming", cobertura: "nacional", canais: ["varejo", "ecommerce", "marketplace", "franquias"], comunicacaoPct: 0.012, lembrancaInicial: 0.7, fidelidadeInicial: 65 },
  { id: "beta", nome: "Beta", perfil: "Popular de volume", precoRelativo: 0.8, qualidade: "basico", recursos: "basico", posicionamento: "preco", estrategiaPreco: "penetracao", cobertura: "nacional", canais: ["varejo", "atacado", "marketplace", "ecommerce"], comunicacaoPct: 0.01, lembrancaInicial: 0.65, fidelidadeInicial: 50 },
  { id: "gama", nome: "Gama", perfil: "Intermediário", precoRelativo: 1.0, qualidade: "medio", recursos: "intermediario", posicionamento: "qualidade", estrategiaPreco: "competitivo", cobertura: "nacional", canais: ["varejo", "ecommerce", "marketplace"], comunicacaoPct: 0.008, lembrancaInicial: 0.55, fidelidadeInicial: 55 },
  { id: "delta", nome: "Delta", perfil: "Regional (forte no RS)", precoRelativo: 0.95, qualidade: "medio", recursos: "basico", posicionamento: "preco", estrategiaPreco: "competitivo", cobertura: "regional", canais: ["varejo", "direto"], comunicacaoPct: 0.006, lembrancaInicial: 0.5, fidelidadeInicial: 60 },
];

/** Os N concorrentes da turma (repete os perfis com sufixo quando N > 4). */
export function concorrentesDaTurma(n: number): PerfilConcorrente[] {
  const total = limitar(Math.round(n || 4), 1, 12);
  return Array.from({ length: total }, (_, i) => {
    const base = PERFIS_CONCORRENTES[i % PERFIS_CONCORRENTES.length];
    const volta = Math.floor(i / PERFIS_CONCORRENTES.length);
    return volta === 0 ? base : { ...base, id: `${base.id}${volta + 1}`, nome: `${base.nome} ${volta + 1}` };
  });
}

export interface EstadoConcorrente {
  preco: number;
  comunicacao: number;
  lembranca: number;
  fidelidade: number;
}

/**
 * Decisão do concorrente simulado na semana. Reage às equipes: se o preço
 * médio das equipes caiu mais de 10% abaixo do dele, o perfil de volume
 * acompanha parte da queda; se as equipes ampliaram muito a comunicação,
 * os concorrentes reforçam a sua (PARÂMETRO DO MODELO).
 */
export function decisaoConcorrente(
  p: PerfilConcorrente,
  precoRef: number,
  valorSemanal: number,
  anterior: EstadoConcorrente | undefined,
  mediaPrecoEquipes: number | null,
  mediaComunicacaoEquipes: number | null,
): DecisaoProduto {
  let preco = anterior?.preco ?? precoRef * p.precoRelativo;
  let comunicacao = anterior?.comunicacao ?? valorSemanal * p.comunicacaoPct;
  const alvo = precoRef * p.precoRelativo;
  if (mediaPrecoEquipes && mediaPrecoEquipes < preco * 0.9 && p.estrategiaPreco !== "skimming") {
    preco = Math.max(alvo * 0.85, preco * 0.96);
  } else {
    preco = preco + (alvo - preco) * 0.3; // volta gradual ao preço do perfil
  }
  const base = valorSemanal * p.comunicacaoPct;
  if (mediaComunicacaoEquipes && mediaComunicacaoEquipes > base * 1.5) {
    comunicacao = Math.min(base * 1.6, comunicacao * 1.1);
  } else {
    comunicacao = comunicacao + (base - comunicacao) * 0.3;
  }
  return {
    qualidade: p.qualidade,
    recursos: p.recursos,
    posicionamento: p.posicionamento,
    estrategiaPreco: p.estrategiaPreco,
    preco: Math.round(preco * 100) / 100,
    canais: p.canais,
    cobertura: p.cobertura,
    investimentoComunicacao: Math.round(comunicacao),
  };
}

// ---------------------------------------------------------------- verba

export function verbaInicial(receitaRefPorCategoria: number, verbaPct: number, numeroProdutos: number): number {
  return Math.round(receitaRefPorCategoria * (verbaPct / 100) * Math.max(1, numeroProdutos));
}

export function proximaVerba(receitaBruta: number, verbaPct: number, inicial: number): number {
  return Math.round(Math.max(receitaBruta * (verbaPct / 100), inicial * PISO_VERBA));
}
