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
//
// Expansão do catálogo (31 novos formatos, a pedido do usuário): TV, Rádio,
// mídia impressa e OOH ganharam formatos adicionais dentro das categorias
// já existentes; redes sociais/vídeo online ganharam itens granulares por
// formato de anúncio (mantendo Google Ads/Meta Ads como estão, para quem
// prefere pensar em verba mensal geral); e banners/programática entraram
// numa categoria nova, "Mídia Display e Programática", por serem comprados
// via leilão em sites terceiros (Google Ads Display/GDN), um modelo
// diferente do de redes sociais. "Mídia em Trânsito" (envelopamento de
// frota, telas em elevador/táxi/metrô) foi absorvida em "Mídia Exterior
// (OOH)", que já continha Busdoor — evita fragmentar em mais uma categoria
// para só 2-4 itens. Preços regionais/por emissora (TV e Rádio) foram
// condensados no valor único exigido pelo schema usando a faixa "Estadual
// (RS)" da emissora líder de cada mercado (RBS TV/Globo, Rádio Gaúcha) —
// mesmo critério implícito já usado nos valores de TV/Rádio pré-existentes
// abaixo. Preços por CPM/CPV/CPC usam o ponto médio da faixa informada
// pelo usuário como custoUnitarioMinimo, com a unidade de cobrança (CPM,
// CPV ou CPC) no campo `unidade`. quantidadeSugerida foi deixado de fora
// nos itens novos: o campo existe no schema mas não é lido em lugar nenhum
// do cliente (nem na tela de decisões, nem no PDF do Guia de Mídias).
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
  {
    categoria: "Mídia Impressa",
    nome: "Jornal",
    formato: "Página Dupla",
    custoUnitarioMinimo: 9000.00,
    unidade: "edição",
    descricao: "Anúncio ocupando as duas páginas centrais abertas da edição, para máxima visibilidade.",
    orderIndex: 100,
  },
  {
    categoria: "Mídia Impressa",
    nome: "Revista",
    formato: "Página Dupla",
    custoUnitarioMinimo: 12500.00,
    unidade: "edição",
    descricao: "Anúncio ocupando as duas páginas centrais abertas da edição, para máxima visibilidade.",
    orderIndex: 101,
  },
  {
    categoria: "Mídia Impressa",
    nome: "Jornal",
    formato: "Fração de Página",
    custoUnitarioMinimo: 450.00,
    unidade: "edição",
    descricao: "Bloco pequeno (1/4 ou 1/8 de página) ou anúncio de rodapé, opção de menor custo.",
    orderIndex: 102,
  },
  {
    categoria: "Mídia Impressa",
    nome: "Revista",
    formato: "Fração de Página",
    custoUnitarioMinimo: 650.00,
    unidade: "edição",
    descricao: "Bloco pequeno (1/4 ou 1/8 de página) ou anúncio de rodapé, opção de menor custo.",
    orderIndex: 103,
  },
  {
    categoria: "Mídia Impressa",
    nome: "Revista",
    formato: "Meia Página",
    custoUnitarioMinimo: 6000.00,
    unidade: "edição",
    descricao: "Anúncio ocupando metade da página (horizontal ou vertical) em revista impressa.",
    orderIndex: 104,
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
  {
    categoria: "Marketing Digital",
    nome: "Bumper Ads",
    formato: "YouTube",
    custoUnitarioMinimo: 14.00,
    unidade: "CPM",
    descricao: "Vídeo não pulável de até 6 segundos exibido no YouTube. Custo por mil impressões (CPM).",
    orderIndex: 110,
  },
  {
    categoria: "Marketing Digital",
    nome: "Skippable Ads",
    formato: "YouTube (In-Stream)",
    custoUnitarioMinimo: 0.25,
    unidade: "CPV",
    descricao: "Vídeo pulável após 5 segundos (30s a 2min) no YouTube. Custo por visualização completa (CPV).",
    orderIndex: 111,
  },
  {
    categoria: "Marketing Digital",
    nome: "Stories/Reels/TikTok Ads",
    formato: "Vídeo Vertical",
    custoUnitarioMinimo: 16.00,
    unidade: "CPM",
    descricao: "Vídeo ou imagem vertical (9:16) em Stories, Reels e TikTok. Custo por mil pessoas alcançadas (CPM).",
    orderIndex: 112,
  },
  {
    categoria: "Marketing Digital",
    nome: "Feed Ads",
    formato: "Instagram, Facebook e LinkedIn",
    custoUnitarioMinimo: 20.00,
    unidade: "CPM",
    descricao: "Imagem ou vídeo no feed (1:1 ou 4:5) de Instagram, Facebook e LinkedIn. Custo por mil impressões (CPM).",
    orderIndex: 113,
  },
  {
    categoria: "Marketing Digital",
    nome: "Carrossel Ads",
    formato: "Múltiplas Imagens",
    custoUnitarioMinimo: 1.20,
    unidade: "CPC",
    descricao: "Sequência de até 10 imagens ou vídeos deslizantes (1:1), focada em cliques e engajamento. Custo por clique (CPC).",
    orderIndex: 114,
  },
  {
    categoria: "Marketing Digital",
    nome: "Anúncios de Coleção",
    formato: "Catálogo E-commerce",
    custoUnitarioMinimo: 25.00,
    unidade: "CPM",
    descricao: "Capa em vídeo/imagem com catálogo de produtos abaixo, focado em conversões de e-commerce. Custo por mil impressões (CPM).",
    orderIndex: 115,
  },
  {
    categoria: "Marketing Digital",
    nome: "Notificação Push",
    formato: "App e Navegador",
    custoUnitarioMinimo: 300.00,
    unidade: "mês",
    descricao: "Licença de ferramenta de disparo de notificações curtas na tela de bloqueio do celular ou no navegador.",
    orderIndex: 116,
  },

  // MÍDIA DISPLAY E PROGRAMÁTICA
  {
    categoria: "Mídia Display e Programática",
    nome: "Leaderboard",
    formato: "728x90 px",
    custoUnitarioMinimo: 10.00,
    unidade: "CPM",
    descricao: "Banner horizontal de topo veiculado em blogs, portais e sites de notícias via mídia programática.",
    orderIndex: 130,
  },
  {
    categoria: "Mídia Display e Programática",
    nome: "Retângulo Médio (MPU)",
    formato: "300x250 px",
    custoUnitarioMinimo: 12.00,
    unidade: "CPM",
    descricao: "Banner lateral integrado ao texto, um dos formatos mais comuns em sites de conteúdo.",
    orderIndex: 131,
  },
  {
    categoria: "Mídia Display e Programática",
    nome: "Half Page",
    formato: "300x600 px",
    custoUnitarioMinimo: 17.00,
    unidade: "CPM",
    descricao: "Banner lateral longo de alta visibilidade.",
    orderIndex: 132,
  },
  {
    categoria: "Mídia Display e Programática",
    nome: "Skyscraper",
    formato: "160x600 px",
    custoUnitarioMinimo: 8.00,
    unidade: "CPM",
    descricao: "Banner vertical fino posicionado na lateral da página.",
    orderIndex: 133,
  },
  {
    categoria: "Mídia Display e Programática",
    nome: "Billboard",
    formato: "970x250 px",
    custoUnitarioMinimo: 21.00,
    unidade: "CPM",
    descricao: "Grande banner de topo de página, alta visibilidade.",
    orderIndex: 134,
  },
  {
    categoria: "Mídia Display e Programática",
    nome: "Interstitial",
    formato: "Tela Cheia",
    custoUnitarioMinimo: 35.00,
    unidade: "CPM",
    descricao: "Anúncio em tela cheia que cobre a página antes de carregar o conteúdo.",
    orderIndex: 135,
  },
  {
    categoria: "Mídia Display e Programática",
    nome: "Native Ads",
    formato: "Publicidade Nativa",
    custoUnitarioMinimo: 0.50,
    unidade: "CPC",
    descricao: "Anúncio que imita o formato das notícias do site (ex.: Taboola, Outbrain). Custo por clique (CPC).",
    orderIndex: 136,
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
  {
    categoria: "Mídia Exterior (OOH)",
    nome: "Mobiliário Urbano",
    formato: "Abrigos de Ônibus e Relógios",
    custoUnitarioMinimo: 1650.00,
    unidade: "ponto/semana",
    descricao: "Painel publicitário ao nível do pedestre em abrigos de ônibus ou relógios de rua.",
    orderIndex: 140,
  },
  {
    categoria: "Mídia Exterior (OOH)",
    nome: "Empena",
    formato: "Lona em Parede Cega",
    custoUnitarioMinimo: 45000.00,
    unidade: "mês",
    descricao: "Grande lona fixada em parede cega de prédio, alto custo de estrutura e produção.",
    orderIndex: 141,
  },
  {
    categoria: "Mídia Exterior (OOH)",
    nome: "Envelopamento de Frota",
    formato: "Metrô, Trem ou Ônibus",
    custoUnitarioMinimo: 23000.00,
    unidade: "veículo/mês",
    descricao: "Adesivagem completa de vagões de metrô, trens ou ônibus.",
    orderIndex: 142,
  },
  {
    categoria: "Mídia Exterior (OOH)",
    nome: "Telas em Elevadores, Táxis e Metrô",
    formato: "Circuito Fechado",
    custoUnitarioMinimo: 1800.00,
    unidade: "mês",
    descricao: "Circuito fechado de TV em elevadores, táxis ou metrô, inserções de 15 segundos sem som.",
    orderIndex: 143,
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
  {
    categoria: "Mídia Eletrônica",
    nome: "TV",
    formato: "Teaser (5 a 10s)",
    custoUnitarioMinimo: 4500.00,
    unidade: "inserção",
    descricao: "Vídeo curto para gerar expectativa antes de um lançamento.",
    orderIndex: 150,
  },
  {
    categoria: "Mídia Eletrônica",
    nome: "TV",
    formato: "Merchandising / Ação Integrada",
    custoUnitarioMinimo: 27000.00,
    unidade: "ação",
    descricao: "Apresentador interage com o produto no cenário do programa (30 segundos a 3 minutos).",
    orderIndex: 151,
  },
  {
    categoria: "Mídia Eletrônica",
    nome: "TV",
    formato: "Vinheta de Patrocínio",
    custoUnitarioMinimo: 47000.00,
    unidade: "mês",
    descricao: "Abertura/fechamento de blocos de programação (5 a 7 segundos), vendida por cota mensal.",
    orderIndex: 152,
  },
  {
    categoria: "Mídia Eletrônica",
    nome: "TV",
    formato: "Infocomercial (15 a 30min)",
    custoUnitarioMinimo: 6000.00,
    unidade: "bloco",
    descricao: "Demonstração longa de vendas, tipicamente veiculada na madrugada.",
    orderIndex: 153,
  },
  {
    categoria: "Mídia Eletrônica",
    nome: "Rádio",
    formato: "Jingle (Produção)",
    custoUnitarioMinimo: 2400.00,
    unidade: "produção",
    descricao: "Custo único de produção de propaganda cantada e ritmada; a veiculação segue o preço do spot.",
    orderIndex: 154,
  },
  {
    categoria: "Mídia Eletrônica",
    nome: "Rádio",
    formato: "Patrocínio de Programa",
    custoUnitarioMinimo: 4750.00,
    unidade: "mês",
    descricao: "Cota mensal de patrocínio com direito a vinhetas exclusivas.",
    orderIndex: 155,
  },
  {
    categoria: "Mídia Eletrônica",
    nome: "Rádio",
    formato: "Podcast e Streaming Digital",
    custoUnitarioMinimo: 40.00,
    unidade: "CPM",
    descricao: "Áudio digital da rádio integrado a plataformas online. Custo por mil ouvintes/reproduções (CPM).",
    orderIndex: 156,
  },
  {
    categoria: "Mídia Eletrônica",
    nome: "Rádio",
    formato: "Publicação em Mídia Social da Emissora",
    custoUnitarioMinimo: 900.00,
    unidade: "postagem",
    descricao: "Post ou combo de ações nos perfis digitais da rádio.",
    orderIndex: 157,
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
