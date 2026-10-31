/**
 * Segmentação por produto com efeito no resultado (grupo E1, nov/2026).
 *
 * Usado pela tela (tópicos que o aluno marca) e pelo motor competitivo
 * (segmentos de consumidores de cada categoria). Por enquanto vale só para
 * turmas B2C do setor Eletrônicos; nos demais setores nada muda.
 *
 * A equipe marca opções de tópicos nos quatro critérios. Cada opção é gravada
 * como o código "topico:opcao" nas listas que já existem na tabela
 * market_segmentation (demographic, geographic, psychographic, behavioral),
 * numa linha por produto (productId preenchido). Textos livres antigos ficam
 * guardados e não entram no cálculo.
 *
 * Fontes dos dados de mercado (direção dos números; perfis e pesos são
 * PARÂMETROS DO MODELO, não medições):
 * - ABEP, Critério Brasil: domicílios por classe nas regiões metropolitanas
 *   (2026): A+B1 13%, B2 19%, C 52%, DE 17%.
 * - Cetic.br, TIC Domicílios 2025: computador no domicílio A 97%, B 78%,
 *   C 34%, DE 10%; uso exclusivo do celular A 5%, B 35%, C 67%, DE 87%;
 *   uso de internet 60+ = 54%.
 * - NielsenIQ (1º tri/2026): online 53,1% do faturamento de tecnologia;
 *   marketplaces 21,4%.
 * - Bain & Company (citada pela Mobile Time, 2025): 80% das classes D e E
 *   compraram aparelho por menos de R$ 1 mil.
 * - Conceitos: Kotler e Keller (critérios, ciclo de vida familiar); Rogers,
 *   Diffusion of Innovations (categorias de adotantes).
 */

export type CriterioSegmentacao = "geographic" | "demographic" | "psychographic" | "behavioral";

export interface OpcaoTopico { id: string; label: string }
export interface TopicoSegmentacao { id: string; label: string; opcoes: OpcaoTopico[] }

/** Máximo de opções marcadas por tópico e mínimo de tópicos por critério. */
export const MAX_OPCOES_POR_TOPICO = 2;
export const MIN_TOPICOS_POR_CRITERIO = 3;

export const CRITERIOS_B2C: { key: CriterioSegmentacao; label: string; pergunta: string }[] = [
  { key: "geographic", label: "Geográfica", pergunta: "Onde o cliente está" },
  { key: "demographic", label: "Demográfica", pergunta: "Quem é o cliente" },
  { key: "psychographic", label: "Psicográfica", pergunta: "Como o cliente pensa e vive" },
  { key: "behavioral", label: "Comportamental", pergunta: "Como o cliente age diante do produto" },
];

const o = (id: string, label: string): OpcaoTopico => ({ id, label });

export const TOPICOS_B2C: Record<CriterioSegmentacao, TopicoSegmentacao[]> = {
  geographic: [
    { id: "porte", label: "Porte da cidade", opcoes: [o("capital", "Capital ou metrópole"), o("metropolitana", "Região metropolitana"), o("media", "Cidade média (100 a 500 mil hab.)"), o("pequena", "Cidade pequena (até 100 mil hab.)")] },
    { id: "regiao", label: "Região", opcoes: [o("rs", "Rio Grande do Sul"), o("sul", "Região Sul"), o("sudeste", "Sudeste"), o("nordeste", "Nordeste"), o("co_norte", "Centro-Oeste e Norte"), o("exterior", "Exterior (Mercosul)")] },
    { id: "zona", label: "Zona", opcoes: [o("central", "Urbana central"), o("periferica", "Urbana periférica"), o("rural", "Rural")] },
    { id: "internet", label: "Acesso à internet", opcoes: [o("fibra5g", "Fibra ou 5G"), o("4g", "4G"), o("limitada", "Conexão limitada")] },
    { id: "clima", label: "Clima", opcoes: [o("frio", "Frio e temperado"), o("umido", "Quente e úmido"), o("seco", "Quente e seco")] },
  ],
  demographic: [
    { id: "idade", label: "Idade", opcoes: [o("16_24", "16–24"), o("25_34", "25–34"), o("35_44", "35–44"), o("45_59", "45–59"), o("60_mais", "60+")] },
    { id: "classe", label: "Classe econômica (Critério Brasil/ABEP)", opcoes: [o("a", "A"), o("b1", "B1"), o("b2", "B2"), o("c1", "C1"), o("c2", "C2"), o("de", "D-E")] },
    { id: "ocupacao", label: "Ocupação", opcoes: [o("estudante", "Estudante"), o("clt", "Assalariado (CLT)"), o("servidor", "Servidor público"), o("autonomo", "Autônomo ou empresário"), o("aposentado", "Aposentado")] },
    { id: "escolaridade", label: "Escolaridade", opcoes: [o("fundamental", "Fundamental"), o("medio", "Médio"), o("sup_curso", "Superior em curso"), o("sup_completo", "Superior completo"), o("pos", "Pós-graduação")] },
    { id: "ciclo", label: "Ciclo de vida familiar", opcoes: [o("solteiro", "Solteiro sem filhos"), o("casal", "Casal sem filhos"), o("filhos_peq", "Família com filhos pequenos"), o("filhos_adol", "Família com filhos adolescentes"), o("ninho_vazio", "Filhos já saíram de casa")] },
    { id: "genero", label: "Gênero", opcoes: [o("feminino", "Feminino"), o("masculino", "Masculino"), o("todos", "Todos")] },
  ],
  psychographic: [
    { id: "estilo", label: "Estilo de vida", opcoes: [o("conectado", "Conectado ou gamer"), o("ocupado", "Profissional ocupado"), o("saude", "Saúde e esporte"), o("caseiro", "Caseiro e familiar"), o("viajante", "Viajante ou aventureiro")] },
    { id: "inovacao", label: "Atitude diante da inovação (Rogers)", opcoes: [o("inovador", "Inovador"), o("adotante_inicial", "Adotante inicial"), o("maioria_inicial", "Maioria inicial"), o("maioria_tardia", "Maioria tardia"), o("retardatario", "Retardatário")] },
    { id: "valores", label: "Valores", opcoes: [o("economia", "Economia"), o("status", "Status"), o("sustentabilidade", "Sustentabilidade"), o("seguranca", "Segurança"), o("praticidade", "Praticidade")] },
    { id: "interesses", label: "Interesses", opcoes: [o("games", "Games"), o("foto_video", "Foto e vídeo"), o("esportes", "Esportes"), o("trabalho_estudo", "Trabalho e estudo"), o("streaming", "Streaming e entretenimento"), o("redes_sociais", "Redes sociais")] },
    { id: "personalidade", label: "Personalidade", opcoes: [o("sociavel", "Sociável"), o("racional", "Racional e analítico"), o("impulsivo", "Impulsivo"), o("cauteloso", "Cauteloso"), o("criativo", "Criativo")] },
  ],
  behavioral: [
    { id: "beneficio", label: "Benefício buscado", opcoes: [o("preco", "Preço baixo"), o("durabilidade", "Durabilidade"), o("desempenho", "Desempenho"), o("design_marca", "Design e marca"), o("garantia", "Garantia e assistência")] },
    { id: "troca", label: "Frequência de troca", opcoes: [o("anual", "Todo ano"), o("2anos", "A cada 2 anos"), o("3_4anos", "A cada 3–4 anos"), o("quando_quebra", "Só quando quebra")] },
    { id: "usuario", label: "Status de usuário", opcoes: [o("primeira", "Primeira compra"), o("regular", "Usuário regular"), o("concorrente", "Cliente de concorrente"), o("ex_usuario", "Ex-usuário")] },
    { id: "fidelidade", label: "Fidelidade", opcoes: [o("fiel", "Fiel a uma marca"), o("duas_marcas", "Divide entre duas marcas"), o("promocao", "Troca por promoção"), o("sem_preferencia", "Sem preferência")] },
    { id: "ocasiao", label: "Ocasião de compra", opcoes: [o("datas", "Datas comemorativas"), o("black_friday", "Black Friday"), o("presente", "Presente"), o("reposicao", "Reposição imediata"), o("lancamento", "Lançamento")] },
    { id: "pagamento", label: "Forma de pagamento", opcoes: [o("pix", "À vista ou Pix"), o("sem_juros", "Parcelado sem juros"), o("crediario", "Crediário"), o("cartao_juros", "Cartão com juros")] },
  ],
};

/** Código gravado no banco para uma opção marcada. */
export const codigoOpcao = (topico: string, opcao: string) => `${topico}:${opcao}`;

const TOPICO_PARA_CRITERIO: Record<string, CriterioSegmentacao> = Object.fromEntries(
  (Object.keys(TOPICOS_B2C) as CriterioSegmentacao[]).flatMap((c) => TOPICOS_B2C[c].map((t) => [t.id, c])),
);
const OPCOES_VALIDAS = new Set(
  (Object.keys(TOPICOS_B2C) as CriterioSegmentacao[]).flatMap((c) => TOPICOS_B2C[c].flatMap((t) => t.opcoes.map((op) => codigoOpcao(t.id, op.id)))),
);

/**
 * Mantém só códigos válidos do critério, no máximo MAX_OPCOES_POR_TOPICO por
 * tópico (os primeiros). Textos livres são descartados.
 */
export function sanearCodigos(criterio: CriterioSegmentacao, lista: unknown): string[] {
  if (!Array.isArray(lista)) return [];
  const porTopico = new Map<string, number>();
  const saida: string[] = [];
  for (const item of lista) {
    if (typeof item !== "string" || !OPCOES_VALIDAS.has(item)) continue;
    const topico = item.split(":")[0];
    if (TOPICO_PARA_CRITERIO[topico] !== criterio || saida.includes(item)) continue;
    const n = porTopico.get(topico) ?? 0;
    if (n >= MAX_OPCOES_POR_TOPICO) continue;
    porTopico.set(topico, n + 1);
    saida.push(item);
  }
  return saida;
}

export type LinhaSegmentacao = Partial<Record<CriterioSegmentacao, string[] | null>>;

/** Opções marcadas, agrupadas por tópico (só códigos válidos). */
export function selecoesPorTopico(linha: LinhaSegmentacao): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>();
  for (const c of Object.keys(TOPICOS_B2C) as CriterioSegmentacao[]) {
    for (const cod of sanearCodigos(c, linha[c])) {
      const [t, op] = cod.split(":");
      if (!m.has(t)) m.set(t, new Set());
      m.get(t)!.add(op);
    }
  }
  return m;
}

/** Quantos tópicos de cada critério têm ao menos uma opção marcada. */
export function topicosPreenchidos(linha: LinhaSegmentacao): Record<CriterioSegmentacao, number> {
  const sel = selecoesPorTopico(linha);
  const r = { geographic: 0, demographic: 0, psychographic: 0, behavioral: 0 } as Record<CriterioSegmentacao, number>;
  for (const t of Array.from(sel.keys())) r[TOPICO_PARA_CRITERIO[t]]++;
  return r;
}

// ---------------------------------------------------------------- segmentos

export interface SegmentoConsumidor {
  id: string;
  nome: string;
  descricao: string;
  /** Opções típicas de cada tópico. Tópicos ausentes não distinguem o segmento. */
  perfil: Record<string, string[]>;
  /** Multiplicador da sensibilidade a preço do setor (1 = média). */
  sensibilidadePreco: number;
  /** Atração relativa por nível de qualidade. */
  preferenciaQualidade: Record<string, number>;
  /** Peso de cada canal nas compras do segmento (soma 1). */
  canais: Record<string, number>;
  /** Nomes das mídias (catálogo do jogo) que o segmento mais consome. */
  midias: string[];
}

/** PARÂMETRO DO MODELO: segmentos de consumidores de Eletrônicos. */
export const SEGMENTOS_ELETRONICOS: SegmentoConsumidor[] = [
  {
    id: "jovem_conectado",
    nome: "Jovem conectado",
    descricao: "16 a 24 anos, classes B2 e C, estudante, gamer e redes sociais; busca desempenho por preço justo e troca a cada 2 anos; compra em marketplace e online.",
    perfil: {
      porte: ["capital", "metropolitana", "media"], zona: ["central", "periferica"], internet: ["fibra5g", "4g"],
      idade: ["16_24", "25_34"], classe: ["b2", "c1", "c2"], ocupacao: ["estudante", "clt"], escolaridade: ["medio", "sup_curso"], ciclo: ["solteiro"],
      estilo: ["conectado"], inovacao: ["adotante_inicial", "maioria_inicial"], valores: ["status", "praticidade", "economia"], interesses: ["games", "redes_sociais", "streaming", "foto_video"], personalidade: ["sociavel", "impulsivo", "criativo"],
      beneficio: ["desempenho", "preco", "design_marca"], troca: ["anual", "2anos"], usuario: ["primeira", "concorrente", "regular"], fidelidade: ["promocao", "sem_preferencia", "duas_marcas"], ocasiao: ["black_friday", "lancamento", "presente"], pagamento: ["cartao_juros", "sem_juros", "pix"],
    },
    sensibilidadePreco: 1.25,
    preferenciaQualidade: { basico: 0.9, medio: 1.05, premium: 1.0 },
    canais: { marketplace: 0.4, ecommerce: 0.25, varejo: 0.2, franquias: 0.05, atacado: 0.05, direto: 0.05 },
    midias: ["Influenciador", "Meta Ads", "Google Ads", "Podcast", "Cinema", "Painéis Digitais", "Marketing de Conteúdo"],
  },
  {
    id: "profissional_exigente",
    nome: "Profissional exigente",
    descricao: "25 a 44 anos, classes A e B1, superior completo, adotante inicial; busca desempenho e marca; compra no e-commerce da marca e no varejo.",
    perfil: {
      porte: ["capital", "metropolitana"], zona: ["central"], internet: ["fibra5g"],
      idade: ["25_34", "35_44", "45_59"], classe: ["a", "b1"], ocupacao: ["clt", "servidor", "autonomo"], escolaridade: ["sup_completo", "pos"], ciclo: ["solteiro", "casal", "filhos_peq", "filhos_adol"],
      estilo: ["ocupado", "viajante", "saude"], inovacao: ["inovador", "adotante_inicial"], valores: ["status", "praticidade", "seguranca"], interesses: ["trabalho_estudo", "foto_video", "esportes"], personalidade: ["racional", "sociavel"],
      beneficio: ["desempenho", "design_marca", "garantia"], troca: ["anual", "2anos"], usuario: ["regular", "concorrente"], fidelidade: ["fiel", "duas_marcas"], ocasiao: ["lancamento", "reposicao"], pagamento: ["sem_juros", "pix"],
    },
    sensibilidadePreco: 0.55,
    preferenciaQualidade: { basico: 0.7, medio: 0.95, premium: 1.2 },
    canais: { ecommerce: 0.35, varejo: 0.25, marketplace: 0.2, franquias: 0.15, direto: 0.05, atacado: 0 },
    midias: ["Google Ads", "Podcast", "Revista", "Marketing de Conteúdo", "E-mail Marketing", "Meta Ads", "Assessoria de Imprensa"],
  },
  {
    id: "familia_pratica",
    nome: "Família prática",
    descricao: "30 a 49 anos, classes B2 e C1, com filhos; busca durabilidade e praticidade, parcela sem juros; compra no varejo físico e em marketplace.",
    perfil: {
      porte: ["metropolitana", "media", "pequena"], zona: ["central", "periferica"], internet: ["fibra5g", "4g"],
      idade: ["25_34", "35_44", "45_59"], classe: ["b2", "c1"], ocupacao: ["clt", "servidor", "autonomo"], escolaridade: ["medio", "sup_completo"], ciclo: ["filhos_peq", "filhos_adol", "casal"],
      estilo: ["caseiro", "ocupado"], inovacao: ["maioria_inicial", "maioria_tardia"], valores: ["praticidade", "seguranca", "economia"], interesses: ["streaming", "trabalho_estudo", "redes_sociais"], personalidade: ["racional", "cauteloso"],
      beneficio: ["durabilidade", "preco", "garantia"], troca: ["3_4anos", "2anos"], usuario: ["regular", "concorrente"], fidelidade: ["duas_marcas", "promocao", "fiel"], ocasiao: ["datas", "black_friday", "presente"], pagamento: ["sem_juros", "crediario"],
    },
    sensibilidadePreco: 1.05,
    preferenciaQualidade: { basico: 0.95, medio: 1.08, premium: 0.92 },
    canais: { varejo: 0.4, marketplace: 0.25, ecommerce: 0.15, franquias: 0.1, atacado: 0.05, direto: 0.05 },
    midias: ["TV", "Meta Ads", "Rádio", "Influenciador", "Panfletos e Flyers", "Outdoor", "Brindes"],
  },
  {
    id: "economico",
    nome: "Econômico",
    descricao: "Classes C2 e D-E; busca preço baixo, troca só quando quebra, usa crediário e gasta até R$ 1 mil; compra no varejo físico e no pequeno varejo abastecido pelo atacado.",
    perfil: {
      porte: ["media", "pequena", "metropolitana"], zona: ["periferica", "rural"], internet: ["4g", "limitada"],
      idade: ["16_24", "25_34", "35_44", "45_59"], classe: ["c2", "de"], ocupacao: ["clt", "autonomo", "estudante"], escolaridade: ["fundamental", "medio"], ciclo: ["solteiro", "filhos_peq", "filhos_adol"],
      estilo: ["caseiro", "conectado"], inovacao: ["maioria_tardia", "retardatario"], valores: ["economia", "praticidade"], interesses: ["redes_sociais", "streaming"], personalidade: ["cauteloso", "impulsivo"],
      beneficio: ["preco", "durabilidade"], troca: ["quando_quebra", "3_4anos"], usuario: ["primeira", "regular"], fidelidade: ["promocao", "sem_preferencia"], ocasiao: ["reposicao", "black_friday", "datas"], pagamento: ["crediario", "cartao_juros", "pix"],
    },
    sensibilidadePreco: 1.7,
    preferenciaQualidade: { basico: 1.15, medio: 0.97, premium: 0.75 },
    canais: { varejo: 0.4, atacado: 0.25, marketplace: 0.2, direto: 0.1, ecommerce: 0.05, franquias: 0 },
    midias: ["Rádio", "TV", "Panfletos e Flyers", "Carro de Som", "SMS Marketing", "Busdoor", "Outdoor"],
  },
  {
    id: "senior",
    nome: "Sênior",
    descricao: "60 anos ou mais, classes B e C, cauteloso; busca garantia e assistência; compra no varejo físico e por venda direta.",
    perfil: {
      porte: ["capital", "metropolitana", "media", "pequena"], zona: ["central", "periferica"], internet: ["4g", "fibra5g", "limitada"],
      idade: ["60_mais"], classe: ["b1", "b2", "c1"], ocupacao: ["aposentado", "autonomo"], escolaridade: ["fundamental", "medio", "sup_completo"], ciclo: ["ninho_vazio", "casal"],
      estilo: ["caseiro", "saude", "viajante"], inovacao: ["maioria_tardia", "retardatario"], valores: ["seguranca", "praticidade"], interesses: ["streaming", "esportes", "redes_sociais"], personalidade: ["cauteloso", "racional"],
      beneficio: ["garantia", "durabilidade"], troca: ["quando_quebra", "3_4anos"], usuario: ["regular", "primeira", "ex_usuario"], fidelidade: ["fiel"], ocasiao: ["reposicao", "presente", "datas"], pagamento: ["pix", "sem_juros"],
    },
    sensibilidadePreco: 0.95,
    preferenciaQualidade: { basico: 0.95, medio: 1.05, premium: 0.98 },
    canais: { varejo: 0.45, direto: 0.2, franquias: 0.15, ecommerce: 0.1, marketplace: 0.1, atacado: 0 },
    midias: ["TV", "Rádio", "Jornal", "Revista", "Mala Direta", "Telemarketing"],
  },
];

/** PARÂMETRO DO MODELO: participação de cada segmento na demanda da categoria (%). */
export const PESOS_SEGMENTOS_ELETRONICOS: Record<string, Record<string, number>> = {
  smartphone: { jovem_conectado: 25, profissional_exigente: 15, familia_pratica: 25, economico: 27, senior: 8 },
  notebook: { jovem_conectado: 25, profissional_exigente: 35, familia_pratica: 25, economico: 8, senior: 7 },
  tablet: { jovem_conectado: 15, profissional_exigente: 15, familia_pratica: 40, economico: 15, senior: 15 },
  smartwatch: { jovem_conectado: 25, profissional_exigente: 35, familia_pratica: 15, economico: 10, senior: 15 },
};

/** Segmentos (com peso 0..1) de uma categoria, ou null se o setor/categoria não tem segmentação. */
export function segmentosDaCategoria(setorId: string, categoriaId: string): { segmento: SegmentoConsumidor; peso: number }[] | null {
  if (setorId !== "eletronicos") return null;
  const pesos = PESOS_SEGMENTOS_ELETRONICOS[categoriaId];
  if (!pesos) return null;
  const total = Object.values(pesos).reduce((a, b) => a + b, 0) || 1;
  return SEGMENTOS_ELETRONICOS.map((s) => ({ segmento: s, peso: (pesos[s.id] ?? 0) / total })).filter((x) => x.peso > 0);
}

// ---------------------------------------------------------------- identificação

/** Tópicos que mais distinguem os segmentos pesam o dobro. */
const PESO_TOPICO: Record<string, number> = { idade: 2, classe: 2, beneficio: 2 };

/** Combinações contraditórias: cada uma reduz a aderência. */
const CONTRADICOES: { teste: (s: Map<string, Set<string>>) => boolean; descricao: string }[] = (() => {
  const so = (s: Map<string, Set<string>>, t: string, ops: string[]) => { const x = s.get(t); return !!x && x.size > 0 && Array.from(x).every((v) => ops.includes(v)); };
  const tem = (s: Map<string, Set<string>>, t: string, op: string) => !!s.get(t)?.has(op);
  return [
    { teste: (s) => so(s, "classe", ["c2", "de"]) && tem(s, "valores", "status"), descricao: "classe C2/D-E com valor Status" },
    { teste: (s) => so(s, "classe", ["c2", "de"]) && tem(s, "troca", "anual"), descricao: "classe C2/D-E trocando de aparelho todo ano" },
    { teste: (s) => so(s, "classe", ["a", "b1"]) && so(s, "beneficio", ["preco"]), descricao: "classe A/B1 buscando só preço baixo" },
    { teste: (s) => so(s, "classe", ["a"]) && tem(s, "pagamento", "crediario"), descricao: "classe A pagando no crediário" },
    { teste: (s) => so(s, "idade", ["60_mais"]) && tem(s, "ocupacao", "estudante"), descricao: "60+ como estudante" },
    { teste: (s) => so(s, "idade", ["16_24"]) && (tem(s, "ciclo", "ninho_vazio") || tem(s, "ocupacao", "aposentado")), descricao: "16–24 anos aposentado ou com filhos já fora de casa" },
    { teste: (s) => so(s, "inovacao", ["maioria_tardia", "retardatario"]) && (tem(s, "troca", "anual") || tem(s, "ocasiao", "lancamento")), descricao: "maioria tardia/retardatário comprando no lançamento ou todo ano" },
    { teste: (s) => so(s, "inovacao", ["inovador"]) && tem(s, "troca", "quando_quebra"), descricao: "inovador que só troca quando quebra" },
    { teste: (s) => so(s, "internet", ["limitada"]) && tem(s, "estilo", "conectado"), descricao: "conexão limitada com estilo conectado/gamer" },
    { teste: (s) => so(s, "zona", ["rural"]) && so(s, "porte", ["capital"]), descricao: "zona rural em capital" },
  ];
})();

export interface IdentificacaoSegmento {
  /** Segmento mais parecido com o que a equipe marcou (null se nada marcado). */
  segmentoId: string | null;
  /** 0..1: quanto a segmentação de fato mira esse segmento. */
  aderencia: number;
  similaridades: Record<string, number>;
  contradicoes: string[];
  topicosPorCriterio: Record<CriterioSegmentacao, number>;
}

export function identificarSegmento(linha: LinhaSegmentacao | null | undefined, segmentos: SegmentoConsumidor[] = SEGMENTOS_ELETRONICOS): IdentificacaoSegmento {
  const vazio: IdentificacaoSegmento = { segmentoId: null, aderencia: 0, similaridades: {}, contradicoes: [], topicosPorCriterio: { geographic: 0, demographic: 0, psychographic: 0, behavioral: 0 } };
  if (!linha) return vazio;
  const sel = selecoesPorTopico(linha);
  if (sel.size === 0) return vazio;
  const topicosPorCriterio = topicosPreenchidos(linha);

  const similaridades: Record<string, number> = {};
  for (const seg of segmentos) {
    let soma = 0, pesos = 0;
    for (const [t, ops] of Array.from(sel.entries())) {
      const perfil = seg.perfil[t];
      if (!perfil) continue; // tópico que não distingue este segmento
      const p = PESO_TOPICO[t] ?? 1;
      const acertos = Array.from(ops).filter((v) => perfil.includes(v)).length;
      soma += p * (acertos / ops.size);
      pesos += p;
    }
    similaridades[seg.id] = pesos > 0 ? soma / pesos : 0;
  }
  const ordenados = Object.entries(similaridades).sort((a, b) => b[1] - a[1]);
  const [melhorId, melhor] = ordenados[0];
  const segunda = ordenados[1]?.[1] ?? 0;

  const contradicoes = CONTRADICOES.filter((c) => c.teste(sel)).map((c) => c.descricao);
  const coerencia = Math.max(0.5, Math.pow(0.85, contradicoes.length));
  const criteriosCompletos = (Object.values(topicosPorCriterio) as number[]).filter((n) => n >= MIN_TOPICOS_POR_CRITERIO).length;
  const completude = 0.25 + 0.75 * (criteriosCompletos / 4);
  const nitidez = melhor - segunda < 0.05 ? 0.7 : 1; // público difuso: parece dois segmentos ao mesmo tempo
  const base = Math.min(1, Math.max(0, (melhor - 0.35) / 0.5));
  const aderencia = Math.round(base * coerencia * completude * nitidez * 1000) / 1000;
  return { segmentoId: melhorId, aderencia, similaridades, contradicoes, topicosPorCriterio };
}

/**
 * Parcela do investimento em mídias destinada às mídias preferidas de cada
 * segmento (0..1). `midias`: id da mídia → nome no catálogo.
 */
export function midiasPorSegmento(
  orcamentos: Record<string, number>,
  nomesDasMidias: Record<string, string>,
  segmentos: SegmentoConsumidor[] = SEGMENTOS_ELETRONICOS,
): Record<string, number> | undefined {
  const total = Object.values(orcamentos).reduce((s, v) => s + (Number(v) || 0), 0);
  if (total <= 0) return undefined;
  const r: Record<string, number> = {};
  for (const seg of segmentos) {
    let parte = 0;
    for (const [id, v] of Object.entries(orcamentos)) {
      if (seg.midias.includes(nomesDasMidias[id] ?? "")) parte += Number(v) || 0;
    }
    r[seg.id] = parte / total;
  }
  return r;
}
