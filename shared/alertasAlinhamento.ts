/**
 * Nov/2026 (pedido do professor, relatório gerencial da rodada): explicação
 * em linguagem simples de cada alerta do alinhamento estratégico.
 *
 * As regras e os pontos são EXATAMENTE os de server/services/strategicAlignment.ts;
 * este arquivo só traduz cada alerta para o aluno: o que a análise da rodada
 * diz, o que a empresa decidiu, por que o simulador considera que as duas
 * coisas não combinam e quanto pesou. Não diz o que a equipe deve fazer.
 *
 * Limites: as regras comparam preço e investimento numa régua comum
 * (preço de referência da categoria = 22,5; verba de referência do produto =
 * 100.000). Aqui os limites voltam para reais: preço < 15 na régua equivale a
 * preço < 66,7% da referência; investimento < 15.000 equivale a < 15% da
 * verba de referência do produto, e assim por diante.
 */

export interface ContextoAlerta {
  produto: string;
  preco: number;
  precoReferencia: number;
  /** Soma das mídias do produto (a mesma soma usada pela regra). */
  comunicacao: number;
  /** Verba de referência do produto = receita de referência × % de verba do setor. */
  verbaProduto: number;
  rivalidade?: number | null;
  poderClientes?: number | null;
  poderFornecedores?: number | null;
  substitutos?: number | null;
  novosEntrantes?: number | null;
  quadranteBcg?: string | null;
  crescimentoMercado?: number | null;
  participacaoRelativa?: number | null;
  canais?: string[];
  estrategiaPreco?: string | null;
}

export interface ExplicacaoAlerta {
  ferramenta: "SWOT" | "5 Forças" | "Matriz BCG" | "PESTEL" | "Segmentação";
  titulo: string;
  analise: string;
  decisao: string;
  porque: string;
  pontos: number;
}

/** Cada ponto perdido numa ferramenta vale 0,14 na nota de alinhamento (70% × 1/5). */
export const PESO_PONTO_FERRAMENTA = 0.7 / 5;

const reais = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
const pct = (v: number) => Math.round(v).toLocaleString("pt-BR") + "%";
const nota = (v: number | null | undefined) => (v == null ? "8 ou mais" : `${v} de 10`);

function precoTxt(c: ContextoAlerta): string {
  if (!(c.precoReferencia > 0)) return `Preço do ${c.produto}: ${reais(c.preco)}.`;
  const dif = (c.preco / c.precoReferencia - 1) * 100;
  const rel = dif >= 0 ? `${pct(dif)} acima` : `${pct(-dif)} abaixo`;
  return `Preço do ${c.produto}: ${reais(c.preco)}, ${rel} do preço de referência da categoria (${reais(c.precoReferencia)}).`;
}
const limitePreco = (c: ContextoAlerta, fracao: number) => (c.precoReferencia > 0 ? reais(c.precoReferencia * fracao) : "—");
const limiteVerba = (c: ContextoAlerta, fracao: number) => (c.verbaProduto > 0 ? reais(c.verbaProduto * fracao) : "—");
const comunicacaoTxt = (c: ContextoAlerta) => `Comunicação (mídias) do ${c.produto}: ${reais(c.comunicacao)}.`;
const verbaRef = (c: ContextoAlerta) => (c.verbaProduto > 0 ? ` (verba de referência do produto: ${reais(c.verbaProduto)})` : "");
const canaisTxt = (c: ContextoAlerta) => `Canais do ${c.produto}: ${(c.canais ?? []).join(", ") || "nenhum"}.`;

type Fabrica = (c: ContextoAlerta) => ExplicacaoAlerta;

const CATALOGO: Record<string, Fabrica> = {
  // ---------- 5 Forças ----------
  "Rivalidade competitiva alta, com investimento promocional reduzido": (c) => ({
    ferramenta: "5 Forças", pontos: 25,
    titulo: "Concorrência forte e pouca comunicação",
    analise: `Nas 5 Forças desta rodada, a disputa entre concorrentes recebeu nota ${nota(c.rivalidade)}. Muitas marcas disputam os mesmos clientes.`,
    decisao: comunicacaoTxt(c),
    porque: `Num mercado assim, o cliente vê muitas marcas ao mesmo tempo, e quem aparece pouco tende a ser menos lembrado na hora da compra. A regra considera pouco um investimento menor que ${limiteVerba(c, 0.15)} por produto, que são 15% da verba de referência${verbaRef(c)}.`,
  }),
  "Rivalidade alta indica pressão de preços, mas preço está elevado": (c) => ({
    ferramenta: "5 Forças", pontos: 15,
    titulo: "Concorrência forte e preço bem acima do mercado",
    analise: `Nas 5 Forças desta rodada, a disputa entre concorrentes recebeu nota ${nota(c.rivalidade)}.`,
    decisao: precoTxt(c),
    porque: `Com muitas concorrentes, o cliente compara preços com facilidade e encontra alternativas mais baratas. A regra aponta conflito quando o preço passa de 111% da referência: ${limitePreco(c, 25 / 22.5)}.`,
  }),
  "Alto poder de barganha dos clientes, mas preço está premium": (c) => ({
    ferramenta: "5 Forças", pontos: 20,
    titulo: "Clientes com muito poder de negociação e preço muito alto",
    analise: `Nas 5 Forças desta rodada, o poder de barganha dos clientes recebeu nota ${nota(c.poderClientes)}: o cliente tem muitas opções e força os preços para baixo.`,
    decisao: precoTxt(c),
    porque: `Quando o cliente tem poder de escolha, um preço muito acima do mercado é fácil de recusar. A regra aponta conflito quando o preço passa de 133% da referência: ${limitePreco(c, 30 / 22.5)}.`,
  }),
  "Alto poder de barganha dos clientes, com estratégia de preço de desnatamento (skimming)": (c) => ({
    ferramenta: "5 Forças", pontos: 18,
    titulo: "Clientes com muito poder de negociação e estratégia de desnatamento",
    analise: `Nas 5 Forças desta rodada, o poder de barganha dos clientes recebeu nota ${nota(c.poderClientes)}.`,
    decisao: `Estratégia de preço do ${c.produto}: desnatamento (preço que começa alto e é reduzido aos poucos).`,
    porque: "O desnatamento funciona quando há clientes dispostos a pagar mais no início. Com clientes que têm muito poder de escolha, essa condição fica mais difícil.",
  }),
  "Alto poder dos fornecedores (pressão sobre custos), com preço muito baixo": (c) => ({
    ferramenta: "5 Forças", pontos: 15,
    titulo: "Fornecedores pressionando custos e preço baixo",
    analise: `Nas 5 Forças desta rodada, o poder dos fornecedores recebeu nota ${nota(c.poderFornecedores)}: eles conseguem aumentar o custo dos componentes.`,
    decisao: precoTxt(c),
    porque: `Com custos pressionados, um preço baixo reduz a sobra de cada unidade vendida. A regra aponta conflito quando o preço fica abaixo de 89% da referência: ${limitePreco(c, 20 / 22.5)}.`,
  }),
  "Alta ameaça de substitutos, com investimento promocional reduzido": (c) => ({
    ferramenta: "5 Forças", pontos: 20,
    titulo: "Muitos produtos substitutos e pouca comunicação",
    analise: `Nas 5 Forças desta rodada, a ameaça de produtos substitutos recebeu nota ${nota(c.substitutos)}: o cliente pode resolver a mesma necessidade com outro tipo de produto.`,
    decisao: comunicacaoTxt(c),
    porque: `Quando há substitutos, o produto precisa ser lembrado para não perder o cliente para outra solução. A regra considera pouco um investimento menor que ${limiteVerba(c, 0.12)}, que são 12% da verba de referência${verbaRef(c)}.`,
  }),
  "Alta ameaça de novos entrantes, com investimento promocional reduzido": (c) => ({
    ferramenta: "5 Forças", pontos: 15,
    titulo: "Novas empresas entrando e pouca comunicação",
    analise: `Nas 5 Forças desta rodada, a ameaça de novos entrantes recebeu nota ${nota(c.novosEntrantes)}: é fácil surgir concorrente novo.`,
    decisao: comunicacaoTxt(c),
    porque: `Uma marca conhecida é uma barreira contra quem está chegando. A regra considera pouco um investimento menor que ${limiteVerba(c, 0.10)}, que são 10% da verba de referência${verbaRef(c)}.`,
  }),
  // ---------- Matriz BCG ----------
  "Produto no quadrante PONTO DE INTERROGAÇÃO com investimento promocional reduzido": (c) => ({
    ferramenta: "Matriz BCG", pontos: 20,
    titulo: "Produto num mercado que cresce, ainda pequeno, e pouca comunicação",
    analise: `Na Matriz BCG, o ${c.produto} está no quadrante "ponto de interrogação": o mercado cresce${c.crescimentoMercado != null ? ` ${c.crescimentoMercado.toLocaleString("pt-BR")}% ao ano` : ""}, mas a empresa é bem menor que a líder${c.participacaoRelativa != null ? ` (participação relativa de ${c.participacaoRelativa.toLocaleString("pt-BR", { maximumFractionDigits: 2 })})` : ""}.`,
    decisao: comunicacaoTxt(c),
    porque: `No modelo da BCG, um produto nessa posição está num mercado atraente, mas ainda tem pouca participação; ele só ganha espaço com investimento para crescer. A regra considera pouco um investimento menor que ${limiteVerba(c, 0.15)}, que são 15% da verba de referência${verbaRef(c)}.`,
  }),
  "Produto no quadrante ESTRELA com investimento promocional baixo": (c) => ({
    ferramenta: "Matriz BCG", pontos: 25,
    titulo: "Produto líder num mercado que cresce e pouca comunicação",
    analise: `Na Matriz BCG, o ${c.produto} está no quadrante "estrela": mercado em crescimento e participação maior que a da maior concorrente.`,
    decisao: comunicacaoTxt(c),
    porque: `No modelo da BCG, a estrela precisa de investimento para manter a liderança enquanto o mercado cresce. A regra considera pouco um investimento menor que ${limiteVerba(c, 0.20)}, que são 20% da verba de referência${verbaRef(c)}.`,
  }),
  "Produto no quadrante ESTRELA com preço reduzido": (c) => ({
    ferramenta: "Matriz BCG", pontos: 12,
    titulo: "Produto líder num mercado que cresce e preço baixo",
    analise: `Na Matriz BCG, o ${c.produto} está no quadrante "estrela".`,
    decisao: precoTxt(c),
    porque: `Um produto líder em mercado que cresce costuma sustentar o preço. A regra aponta conflito quando o preço fica abaixo de 89% da referência: ${limitePreco(c, 20 / 22.5)}.`,
  }),
  "Produto no quadrante VACA LEITEIRA com investimento promocional alto": (c) => ({
    ferramenta: "Matriz BCG", pontos: 15,
    titulo: "Produto líder num mercado parado e muita comunicação",
    analise: `Na Matriz BCG, o ${c.produto} está no quadrante "vaca leiteira": participação alta num mercado que cresce pouco.`,
    decisao: comunicacaoTxt(c),
    porque: `No modelo da BCG, a vaca leiteira gera caixa com pouco investimento, porque o mercado já não cresce. A regra considera alto um investimento acima de ${limiteVerba(c, 0.25)}, que são 25% da verba de referência${verbaRef(c)}.`,
  }),
  "Produto no quadrante VACA LEITEIRA com estratégia de preço de penetração": (c) => ({
    ferramenta: "Matriz BCG", pontos: 15,
    titulo: "Produto líder num mercado parado e preço de penetração",
    analise: `Na Matriz BCG, o ${c.produto} está no quadrante "vaca leiteira".`,
    decisao: `Estratégia de preço do ${c.produto}: penetração (preço baixo para ganhar mercado).`,
    porque: "A penetração serve para ganhar participação; a vaca leiteira já tem participação alta num mercado que cresce pouco, e o papel dela no modelo é gerar caixa.",
  }),
  "Produto no quadrante ABACAXI (baixo crescimento e baixa participação) com investimento promocional acima do mínimo": (c) => ({
    ferramenta: "Matriz BCG", pontos: 18,
    titulo: "Produto pequeno num mercado parado e investimento em comunicação",
    analise: `Na Matriz BCG, o ${c.produto} está no quadrante "abacaxi": participação baixa num mercado que cresce pouco.`,
    decisao: comunicacaoTxt(c),
    porque: `No modelo da BCG, o abacaxi tem pouca chance de crescer e costuma receber o mínimo de investimento. A regra considera acima do mínimo um investimento maior que ${limiteVerba(c, 0.10)}, que são 10% da verba de referência${verbaRef(c)}.`,
  }),
  // ---------- SWOT ----------
  "SWOT indica qualidade superior, mas preço está muito baixo": (c) => ({
    ferramenta: "SWOT", pontos: 20,
    titulo: "Força em qualidade e preço muito baixo",
    analise: "A SWOT da rodada aponta qualidade, diferenciação ou posição premium como força da empresa.",
    decisao: precoTxt(c),
    porque: `Um preço muito baixo não comunica a qualidade apontada como força. A regra aponta conflito quando o preço fica abaixo de 67% da referência: ${limitePreco(c, 15 / 22.5)}.`,
  }),
  "SWOT indica vantagem de custo, mas preço está alto": (c) => ({
    ferramenta: "SWOT", pontos: 15,
    titulo: "Força em custo baixo e preço alto",
    analise: "A SWOT da rodada aponta custo baixo, preço competitivo ou eficiência como força da empresa.",
    decisao: precoTxt(c),
    porque: `A vantagem de custo permite preço competitivo; um preço alto não usa essa força. A regra aponta conflito quando o preço passa de 133% da referência: ${limitePreco(c, 30 / 22.5)}.`,
  }),
  "SWOT aponta custo alto como fraqueza, com preço muito baixo": (c) => ({
    ferramenta: "SWOT", pontos: 18,
    titulo: "Fraqueza em custo e preço baixo",
    analise: "A SWOT da rodada aponta custo alto como fraqueza da empresa.",
    decisao: precoTxt(c),
    porque: `Com custo alto, um preço baixo reduz ou elimina a sobra de cada unidade. A regra aponta conflito quando o preço fica abaixo de 89% da referência: ${limitePreco(c, 20 / 22.5)}.`,
  }),
  "SWOT indica fraqueza em qualidade, mas preço está premium": (c) => ({
    ferramenta: "SWOT", pontos: 20,
    titulo: "Fraqueza em qualidade e preço alto",
    analise: "A SWOT da rodada aponta a qualidade como fraqueza da empresa.",
    decisao: precoTxt(c),
    porque: `Cobrar como produto superior quando a própria análise aponta qualidade fraca é difícil de sustentar diante do cliente. A regra aponta conflito quando o preço passa de 111% da referência: ${limitePreco(c, 25 / 22.5)}.`,
  }),
  "SWOT indica oportunidade de branding, mas investimento promocional está baixo": (c) => ({
    ferramenta: "SWOT", pontos: 12,
    titulo: "Oportunidade de fortalecer a marca e pouca comunicação",
    analise: "A SWOT da rodada aponta uma oportunidade ligada a marca, reputação ou visibilidade.",
    decisao: comunicacaoTxt(c),
    porque: `Uma oportunidade de marca só é aproveitada com comunicação. A regra considera pouco um investimento menor que ${limiteVerba(c, 0.10)}, que são 10% da verba de referência${verbaRef(c)}.`,
  }),
  // ---------- PESTEL ----------
  "PESTEL indica crise econômica, mas preço está alto": (c) => ({
    ferramenta: "PESTEL", pontos: 22,
    titulo: "Economia em crise e preço alto",
    analise: "O fator econômico da PESTEL desta rodada aponta crise, recessão ou desemprego.",
    decisao: precoTxt(c),
    porque: `Em crise, o consumidor tem menos renda e fica mais sensível a preço. A regra aponta conflito quando o preço passa de 111% da referência: ${limitePreco(c, 25 / 22.5)}.`,
  }),
  "PESTEL indica inflação, com preço reduzido": (c) => ({
    ferramenta: "PESTEL", pontos: 15,
    titulo: "Inflação e preço baixo",
    analise: "O fator econômico da PESTEL desta rodada aponta inflação ou alta de preços.",
    decisao: precoTxt(c),
    porque: `Com inflação, os custos sobem; um preço baixo reduz a sobra de cada unidade. A regra aponta conflito quando o preço fica abaixo de 67% da referência: ${limitePreco(c, 15 / 22.5)}.`,
  }),
  "PESTEL indica tendências digitais, sem canais digitais na distribuição": (c) => ({
    ferramenta: "PESTEL", pontos: 18,
    titulo: "Consumo cada vez mais digital e nenhum canal online",
    analise: "O fator tecnológico da PESTEL desta rodada aponta tendências digitais, online ou de internet.",
    decisao: canaisTxt(c),
    porque: "Se o consumidor compra cada vez mais pela internet, quem não vende por e-commerce nem por marketplace fica fora desse caminho de compra.",
  }),
  "PESTEL indica mudanças sociais ligadas a sustentabilidade, com intensidade promocional elevada": (c) => ({
    ferramenta: "PESTEL", pontos: 8,
    titulo: "Consumidor mais consciente e comunicação intensa",
    analise: "O fator social da PESTEL desta rodada aponta sustentabilidade, consciência ou responsabilidade.",
    decisao: `Intensidade da comunicação do ${c.produto}: alta.`,
    porque: "Um consumidor mais consciente tende a rejeitar excesso de propaganda.",
  }),
  "PESTEL registra regulações que afetam o setor": () => ({
    ferramenta: "PESTEL", pontos: 5,
    titulo: "Regulação no setor",
    analise: "O fator legal da PESTEL desta rodada registra regulação, restrição ou lei que afeta o setor.",
    decisao: "Não depende de uma decisão da empresa.",
    porque: "É um ponto de atenção registrado para todas as empresas do setor.",
  }),
  // ---------- Segmentação ----------
  "Segmentação B2C indica público de alta renda/premium, mas o preço está muito baixo": (c) => ({
    ferramenta: "Segmentação", pontos: 18,
    titulo: "Público de alta renda e preço muito baixo",
    analise: `Na segmentação do ${c.produto}, a empresa marcou público de alta renda ou premium (classe A ou B1, valor "Status" ou benefício "Design e marca").`,
    decisao: precoTxt(c),
    porque: `Para esse público, preço muito baixo pode passar a ideia de produto inferior. A regra aponta conflito quando o preço fica abaixo de 67% da referência: ${limitePreco(c, 15 / 22.5)}.`,
  }),
  "Segmentação B2C indica público de menor renda/popular, mas o preço está alto": (c) => ({
    ferramenta: "Segmentação", pontos: 18,
    titulo: "Público de menor renda e preço alto",
    analise: `Na segmentação do ${c.produto}, a empresa marcou público de menor renda ou que busca preço (classe C2 ou D-E, benefício "Preço baixo", valor "Economia" ou fidelidade "Troca por promoção").`,
    decisao: precoTxt(c),
    porque: `Esse público escolhe muito pelo preço. A regra aponta conflito quando o preço passa de 133% da referência: ${limitePreco(c, 30 / 22.5)}.`,
  }),
  "Segmentação B2C indica consumidor digital, mas os canais de venda são majoritariamente tradicionais": (c) => ({
    ferramenta: "Segmentação", pontos: 15,
    titulo: "Público digital e nenhum canal online",
    analise: `Na segmentação do ${c.produto}, a empresa marcou um público digital (estilo "Conectado ou gamer" ou interesse "Redes sociais").`,
    decisao: canaisTxt(c),
    porque: "Esse público costuma comprar pela internet; sem e-commerce nem marketplace, o produto não está onde ele compra.",
  }),
  "Segmentação B2B indica clientes de grande porte, mas os canais praticados são de venda em massa (varejo/e-commerce), sem canal direto/relacionamento": (c) => ({
    ferramenta: "Segmentação", pontos: 18,
    titulo: "Clientes empresariais grandes e venda em massa",
    analise: "Na segmentação B2B, a empresa indicou clientes de grande porte.",
    decisao: canaisTxt(c),
    porque: "Empresas grandes compram por relacionamento e negociação; sem venda direta nem franquia, falta esse contato.",
  }),
  "Segmentação B2B indica pequenas empresas como público-alvo, com investimento promocional elevado": (c) => ({
    ferramenta: "Segmentação", pontos: 12,
    titulo: "Pequenas empresas como clientes e comunicação alta",
    analise: "Na segmentação B2B, a empresa indicou pequenas empresas como público.",
    decisao: comunicacaoTxt(c),
    porque: `A regra considera alto, para esse público, um investimento acima de ${limiteVerba(c, 0.25)}, que são 25% da verba de referência${verbaRef(c)}.`,
  }),
  "Segmentação B2B indica ciclo de decisão longo (comitê de compras), com estratégia de penetração por preço baixo": (c) => ({
    ferramenta: "Segmentação", pontos: 15,
    titulo: "Compra decidida por comitê e preço de penetração",
    analise: "Na segmentação B2B, a empresa indicou compra decidida por comitê, com ciclo longo.",
    decisao: `Estratégia de preço do ${c.produto}: penetração.`,
    porque: "Quando a compra passa por várias pessoas e demora, o preço baixo pesa menos que a confiança e o relacionamento.",
  }),
};

const INCOMPLETA: Record<string, ExplicacaoAlerta["ferramenta"]> = {
  "Análise SWOT incompleta": "SWOT",
  "Análise Porter incompleta": "5 Forças",
  "Análise BCG incompleta": "Matriz BCG",
  "Análise PESTEL incompleta": "PESTEL",
  "Segmentação de Mercado incompleta": "Segmentação",
};

/** Explica um alerta gravado. Alertas desconhecidos voltam com o texto original. */
export function explicarAlerta(alerta: string, c: ContextoAlerta): ExplicacaoAlerta {
  const f = CATALOGO[alerta];
  if (f) return f(c);
  const ferr = INCOMPLETA[alerta];
  if (ferr) {
    return {
      ferramenta: ferr, pontos: 30,
      titulo: `${ferr}: análise incompleta`,
      analise: `A análise ${ferr} desta rodada não tem todos os campos preenchidos.`,
      decisao: "—",
      porque: "Sem a análise completa, o simulador não consegue comparar as decisões com ela.",
    };
  }
  if (alerta.endsWith("não realizada")) {
    const ferramenta: ExplicacaoAlerta["ferramenta"] = alerta.includes("Porter")
      ? "5 Forças"
      : alerta.includes("BCG")
        ? "Matriz BCG"
        : alerta.includes("PESTEL")
          ? "PESTEL"
          : alerta.includes("Segmentação")
            ? "Segmentação"
            : "SWOT";
    return {
      ferramenta, pontos: 100,
      titulo: alerta,
      analise: "A análise não foi feita nesta rodada.",
      decisao: "—",
      porque: "Sem a análise, a parte dela no alinhamento fica com zero.",
    };
  }
  return { ferramenta: "SWOT", pontos: 0, titulo: alerta, analise: alerta, decisao: "—", porque: "Ver Manual do Aluno, Apêndice E.4." };
}

/** Lista de todos os alertas conhecidos (para o manual e testes). */
export const ALERTAS_CONHECIDOS = [...Object.keys(CATALOGO), ...Object.keys(INCOMPLETA)];
