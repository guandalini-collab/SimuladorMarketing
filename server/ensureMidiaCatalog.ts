import { pool } from "./pg-storage";

// Garante que o catálogo completo de mídias exista em produção.
//
// Descoberto durante a investigação deste item: a tabela `midias` em
// produção só continha as 6 mídias inseridas pelos Grupos 1-2 (SMS
// Marketing, Marketing de Conteúdo, Google Ads, Meta Ads, Mala Direta,
// Telemarketing) — as 25 mídias "originais" do catálogo (Jornal, TV,
// Rádio, Outdoor etc., replicadas em seed-midias.ts) nunca chegaram a ser
// inseridas nesta base. Um mecanismo anterior aqui tentava apenas
// atualizar a descrição dessas 25 linhas (supondo que já existissem) e
// não encontrava nenhuma — diagnosticado via log de boot (SELECT count(*)
// mostrou 6 linhas no total).
//
// A correção: o catálogo completo (todas as 31 mídias, espelhando
// seed-midias.ts) entra nesta única lista de inserção idempotente. Esta
// função roda a cada boot do servidor e só insere o que ainda não existe
// (por categoria+nome+formato): nunca apaga nem duplica linhas, então é
// segura para rodar em todo deploy, sem risco de invalidar IDs de mídia
// já referenciados em decisões de rodadas anteriores (diferente de rodar
// seed-midias.ts, que apaga e recria a tabela inteira com novos IDs).
interface MidiaSeed {
  categoria: string;
  nome: string;
  formato: string;
  custoUnitarioMinimo: number;
  unidade: string;
  quantidadeSugerida?: string;
  descricao?: string;
  orderIndex: number;
}

const CATALOGO_MIDIAS: MidiaSeed[] = [
  // MÍDIA IMPRESSA
  {
    categoria: "Mídia Impressa",
    nome: "Jornal",
    formato: "Página Inteira",
    custoUnitarioMinimo: 8500.00,
    unidade: "inserção",
    quantidadeSugerida: "1-3",
    descricao: "Anúncio ocupando a página inteira em jornal impresso, indicado para grande visibilidade e credibilidade institucional.",
    orderIndex: 1,
  },
  {
    categoria: "Mídia Impressa",
    nome: "Jornal",
    formato: "Meia Página",
    custoUnitarioMinimo: 4500.00,
    unidade: "inserção",
    quantidadeSugerida: "2-5",
    descricao: "Anúncio ocupando meia página em jornal impresso, alternativa de menor custo à página inteira.",
    orderIndex: 2,
  },
  {
    categoria: "Mídia Impressa",
    nome: "Revista",
    formato: "Página Inteira",
    custoUnitarioMinimo: 12000.00,
    unidade: "inserção",
    quantidadeSugerida: "1-2",
    descricao: "Anúncio de página inteira em revista impressa, indicado para públicos segmentados por editoria.",
    orderIndex: 3,
  },

  // MARKETING DIGITAL
  {
    categoria: "Marketing Digital",
    nome: "Influenciador",
    formato: "Micro (até 100k seguidores)",
    custoUnitarioMinimo: 1200.00,
    unidade: "campanha",
    quantidadeSugerida: "3-5",
    descricao: "Parceria paga com criador de conteúdo de até 100 mil seguidores, indicada para nichos específicos e maior proximidade com a audiência.",
    orderIndex: 10,
  },
  {
    categoria: "Marketing Digital",
    nome: "Influenciador",
    formato: "Médio (100k-500k seguidores)",
    custoUnitarioMinimo: 3500.00,
    unidade: "campanha",
    quantidadeSugerida: "2-3",
    descricao: "Parceria paga com criador de conteúdo de 100 mil a 500 mil seguidores, equilíbrio entre alcance e engajamento.",
    orderIndex: 11,
  },
  {
    categoria: "Marketing Digital",
    nome: "Influenciador",
    formato: "Grande (500k+ seguidores)",
    custoUnitarioMinimo: 8000.00,
    unidade: "campanha",
    quantidadeSugerida: "1-2",
    descricao: "Parceria paga com criador de conteúdo acima de 500 mil seguidores, indicada para campanhas de grande alcance.",
    orderIndex: 12,
  },
  {
    categoria: "Marketing Digital",
    nome: "E-mail Marketing",
    formato: "Campanha",
    custoUnitarioMinimo: 0.12,
    unidade: "envio",
    quantidadeSugerida: "1000-10000",
    descricao: "Disparo de campanha por e-mail para uma lista de contatos. R$ 0,12 por envio.",
    orderIndex: 13,
  },
  {
    categoria: "Marketing Digital",
    nome: "Podcast",
    formato: "Inserção",
    custoUnitarioMinimo: 800.00,
    unidade: "inserção",
    quantidadeSugerida: "2-4",
    descricao: "Menção ou spot publicitário inserido dentro de um episódio de podcast.",
    orderIndex: 14,
  },
  {
    categoria: "Marketing Digital",
    nome: "SMS Marketing",
    formato: "Campanha",
    custoUnitarioMinimo: 0.10,
    unidade: "envio",
    quantidadeSugerida: "1000-10000",
    descricao: "R$ 0,10 por SMS enviado",
    orderIndex: 15,
  },
  {
    categoria: "Marketing Digital",
    nome: "Marketing de Conteúdo",
    formato: "Pacote Mensal",
    custoUnitarioMinimo: 1500.00,
    unidade: "mês",
    quantidadeSugerida: "1-3",
    descricao: "Produção de conteúdo para blog e redes sociais (pacote básico)",
    orderIndex: 16,
  },
  {
    categoria: "Marketing Digital",
    nome: "Google Ads",
    formato: "Pesquisa, Display e YouTube",
    custoUnitarioMinimo: 750.00,
    unidade: "mês",
    quantidadeSugerida: "1-3",
    descricao: "Piso de campanha para negócio pequeno/local; nichos competitivos passam de R$ 3.000/mês",
    orderIndex: 17,
  },
  {
    categoria: "Marketing Digital",
    nome: "Meta Ads",
    formato: "Facebook e Instagram",
    custoUnitarioMinimo: 900.00,
    unidade: "mês",
    quantidadeSugerida: "1-3",
    descricao: "Campanhas de conversão em Facebook e Instagram",
    orderIndex: 18,
  },

  // MÍDIA EXTERIOR (OOH)
  {
    categoria: "Mídia Exterior (OOH)",
    nome: "Outdoor",
    formato: "Fixo",
    custoUnitarioMinimo: 1700.00,
    unidade: "unidade/mês",
    quantidadeSugerida: "5-10",
    descricao: "Painel publicitário fixo instalado em vias de grande circulação.",
    orderIndex: 20,
  },
  {
    categoria: "Mídia Exterior (OOH)",
    nome: "Front Light",
    formato: "Padrão",
    custoUnitarioMinimo: 4000.00,
    unidade: "unidade/mês",
    quantidadeSugerida: "3-5",
    descricao: "Painel iluminado internamente, indicado para pontos de grande visibilidade noturna.",
    orderIndex: 21,
  },
  {
    categoria: "Mídia Exterior (OOH)",
    nome: "Busdoor",
    formato: "Padrão",
    custoUnitarioMinimo: 900.00,
    unidade: "unidade/mês",
    quantidadeSugerida: "10-20",
    descricao: "Anúncio aplicado na lateral externa de ônibus urbano.",
    orderIndex: 22,
  },
  {
    categoria: "Mídia Exterior (OOH)",
    nome: "Painéis Digitais",
    formato: "Padrão",
    custoUnitarioMinimo: 1400.00,
    unidade: "unidade/mês",
    quantidadeSugerida: "5-10",
    descricao: "Painel de LED digital em vias públicas, permite rotação entre diferentes campanhas.",
    orderIndex: 23,
  },

  // MÍDIA ELETRÔNICA
  {
    categoria: "Mídia Eletrônica",
    nome: "Rádio",
    formato: "Spot 30s",
    custoUnitarioMinimo: 500.00,
    unidade: "inserção",
    quantidadeSugerida: "20-50",
    descricao: "Inserção de áudio de 30 segundos veiculada na programação de rádio.",
    orderIndex: 30,
  },
  {
    categoria: "Mídia Eletrônica",
    nome: "Rádio",
    formato: "Testemunhal",
    custoUnitarioMinimo: 1200.00,
    unidade: "inserção",
    quantidadeSugerida: "10-20",
    descricao: "Anúncio lido ao vivo por um apresentador ou locutor do programa.",
    orderIndex: 31,
  },
  {
    categoria: "Mídia Eletrônica",
    nome: "TV",
    formato: "Comercial 15s",
    custoUnitarioMinimo: 18000.00,
    unidade: "inserção",
    quantidadeSugerida: "5-10",
    descricao: "Comercial de 15 segundos veiculado na grade de programação de TV.",
    orderIndex: 32,
  },
  {
    categoria: "Mídia Eletrônica",
    nome: "TV",
    formato: "Comercial 30s",
    custoUnitarioMinimo: 30000.00,
    unidade: "inserção",
    quantidadeSugerida: "3-8",
    descricao: "Comercial de 30 segundos veiculado na grade de programação de TV.",
    orderIndex: 33,
  },
  {
    categoria: "Mídia Eletrônica",
    nome: "Cinema",
    formato: "Comercial 30s",
    custoUnitarioMinimo: 12000.00,
    unidade: "semana",
    quantidadeSugerida: "2-4",
    descricao: "Comercial de 30 segundos exibido antes da sessão nas salas de cinema.",
    orderIndex: 34,
  },

  // MARKETING DIRETO
  {
    categoria: "Marketing Direto",
    nome: "Carro de Som",
    formato: "Padrão",
    custoUnitarioMinimo: 350.00,
    unidade: "dia",
    quantidadeSugerida: "5-10",
    descricao: "Divulgação sonora itinerante em vias públicas de um bairro ou região.",
    orderIndex: 40,
  },
  {
    categoria: "Marketing Direto",
    nome: "Panfletos e Flyers",
    formato: "Impressão",
    custoUnitarioMinimo: 0.22,
    unidade: "unidade",
    quantidadeSugerida: "5000-20000",
    descricao: "Impressão do material para distribuição. R$ 0,22 por unidade.",
    orderIndex: 41,
  },
  {
    categoria: "Marketing Direto",
    nome: "Panfletos e Flyers",
    formato: "Distribuição",
    custoUnitarioMinimo: 0.18,
    unidade: "unidade",
    quantidadeSugerida: "5000-20000",
    descricao: "Distribuição de panfletos em pontos de grande circulação. R$ 0,18 por unidade distribuída.",
    orderIndex: 42,
  },
  {
    categoria: "Marketing Direto",
    nome: "Mala Direta",
    formato: "Impressão e Postagem",
    custoUnitarioMinimo: 1.50,
    unidade: "unidade",
    quantidadeSugerida: "1000-5000",
    descricao: "R$ 1,50 por peça (impressão + postagem)",
    orderIndex: 43,
  },
  {
    categoria: "Marketing Direto",
    nome: "Telemarketing",
    formato: "Campanha Mensal",
    custoUnitarioMinimo: 1500.00,
    unidade: "mês",
    quantidadeSugerida: "1",
    descricao: "Operação terceirizada de telemarketing",
    orderIndex: 44,
  },

  // RELAÇÕES PÚBLICAS
  {
    categoria: "Relações Públicas",
    nome: "Assessoria de Imprensa",
    formato: "Mensal",
    custoUnitarioMinimo: 3800.00,
    unidade: "mês",
    quantidadeSugerida: "1-3",
    descricao: "Gestão profissional do relacionamento com a imprensa para geração de pauta espontânea.",
    orderIndex: 50,
  },
  {
    categoria: "Relações Públicas",
    nome: "Comunicados à Imprensa",
    formato: "Por release",
    custoUnitarioMinimo: 280.00,
    unidade: "release",
    quantidadeSugerida: "3-6",
    descricao: "Nota oficial enviada a veículos de imprensa para divulgar uma novidade da empresa.",
    orderIndex: 51,
  },

  // PROMOÇÃO DE VENDAS
  {
    categoria: "Promoção de Vendas",
    nome: "Brindes",
    formato: "Padrão",
    custoUnitarioMinimo: 8.00,
    unidade: "unidade",
    quantidadeSugerida: "500-2000",
    descricao: "Distribuição de brindes promocionais com a marca da empresa. R$ 8,00 por unidade.",
    orderIndex: 60,
  },

  // PRODUCT PLACEMENT
  {
    categoria: "Product Placement",
    nome: "Product Placement",
    formato: "Inserção Simples",
    custoUnitarioMinimo: 6000.00,
    unidade: "inserção",
    quantidadeSugerida: "1-2",
    descricao: "Inserção do produto ou marca em cena de programa de TV, novela ou conteúdo audiovisual.",
    orderIndex: 70,
  },
  {
    categoria: "Product Placement",
    nome: "Product Placement",
    formato: "Inserção Premium",
    custoUnitarioMinimo: 18000.00,
    unidade: "inserção",
    quantidadeSugerida: "1",
    descricao: "Inserção destacada e recorrente do produto ou marca em conteúdo audiovisual de alto alcance.",
    orderIndex: 71,
  },
];

export async function ensureMidiaCatalog(): Promise<void> {
  try {
    for (const midia of CATALOGO_MIDIAS) {
      const existing = await pool.query(
        `SELECT id FROM midias WHERE categoria = $1 AND nome = $2 AND formato = $3 LIMIT 1`,
        [midia.categoria, midia.nome, midia.formato]
      );

      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO midias (categoria, nome, formato, custo_unitario_minimo, unidade, quantidade_sugerida, descricao, order_index, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
          [
            midia.categoria,
            midia.nome,
            midia.formato,
            midia.custoUnitarioMinimo,
            midia.unidade,
            midia.quantidadeSugerida ?? null,
            midia.descricao ?? null,
            midia.orderIndex,
          ]
        );
        console.log(`✓ Mídia adicionada ao catálogo: ${midia.categoria} / ${midia.nome} (${midia.formato})`);
      }
    }
  } catch (error) {
    // Nunca deixa o boot do servidor falhar por causa disso — na pior
    // hipótese a mídia fica faltando até o próximo deploy tentar de novo.
    console.error("⚠️  Não foi possível garantir o catálogo de mídias:", error);
  }
}
