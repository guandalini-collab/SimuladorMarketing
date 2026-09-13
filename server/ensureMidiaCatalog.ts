import { pool } from "./pg-storage";

// Mídias adicionadas depois do catálogo original de seed-midias.ts — parte
// prometida pelo Guia de Mídias mas nunca cadastrada, parte mídia digital
// paga (Google Ads, Meta Ads) ausente do catálogo original apesar de hoje
// responder pela maior fatia do investimento publicitário real no Brasil.
//
// Esta função roda uma vez a cada boot do servidor e só insere o que ainda
// não existe (idempotente): nunca apaga nem duplica linhas, então é segura
// para rodar em todo deploy, sem risco de invalidar IDs de mídia já
// referenciados em decisões de rodadas anteriores (diferente de rodar
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

const NOVAS_MIDIAS: MidiaSeed[] = [
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
];

// Descrições para as 25 mídias do catálogo original (seed-midias.ts). A
// maioria nunca teve o campo `descricao` preenchido; um punhado tinha apenas
// o preço repetido (ex.: "R$ 0,22 por unidade"), redundante com o campo
// "Custo unitário mínimo" que o Guia de Mídias já exibe ao lado. Por isso a
// atualização é incondicional (sempre reescreve com o texto abaixo), não só
// quando está vazio — garante um texto explicativo real para todas as
// mídias. Roda a cada boot do servidor, por categoria+nome+formato:
// idempotente (reescreve o mesmo texto) e nunca insere linha nova aqui — só
// complementa registros que já existem.
interface DescricaoSeed {
  categoria: string;
  nome: string;
  formato: string;
  descricao: string;
}

const DESCRICOES_CATALOGO_ORIGINAL: DescricaoSeed[] = [
  { categoria: "Mídia Impressa", nome: "Jornal", formato: "Página Inteira", descricao: "Anúncio ocupando a página inteira em jornal impresso, indicado para grande visibilidade e credibilidade institucional." },
  { categoria: "Mídia Impressa", nome: "Jornal", formato: "Meia Página", descricao: "Anúncio ocupando meia página em jornal impresso, alternativa de menor custo à página inteira." },
  { categoria: "Mídia Impressa", nome: "Revista", formato: "Página Inteira", descricao: "Anúncio de página inteira em revista impressa, indicado para públicos segmentados por editoria." },
  { categoria: "Marketing Digital", nome: "Influenciador", formato: "Micro (até 100k seguidores)", descricao: "Parceria paga com criador de conteúdo de até 100 mil seguidores, indicada para nichos específicos e maior proximidade com a audiência." },
  { categoria: "Marketing Digital", nome: "Influenciador", formato: "Médio (100k-500k seguidores)", descricao: "Parceria paga com criador de conteúdo de 100 mil a 500 mil seguidores, equilíbrio entre alcance e engajamento." },
  { categoria: "Marketing Digital", nome: "Influenciador", formato: "Grande (500k+ seguidores)", descricao: "Parceria paga com criador de conteúdo acima de 500 mil seguidores, indicada para campanhas de grande alcance." },
  { categoria: "Marketing Digital", nome: "E-mail Marketing", formato: "Campanha", descricao: "Disparo de campanha por e-mail para uma lista de contatos. R$ 0,12 por envio." },
  { categoria: "Marketing Digital", nome: "Podcast", formato: "Inserção", descricao: "Menção ou spot publicitário inserido dentro de um episódio de podcast." },
  { categoria: "Mídia Exterior (OOH)", nome: "Outdoor", formato: "Fixo", descricao: "Painel publicitário fixo instalado em vias de grande circulação." },
  { categoria: "Mídia Exterior (OOH)", nome: "Front Light", formato: "Padrão", descricao: "Painel iluminado internamente, indicado para pontos de grande visibilidade noturna." },
  { categoria: "Mídia Exterior (OOH)", nome: "Busdoor", formato: "Padrão", descricao: "Anúncio aplicado na lateral externa de ônibus urbano." },
  { categoria: "Mídia Exterior (OOH)", nome: "Painéis Digitais", formato: "Padrão", descricao: "Painel de LED digital em vias públicas, permite rotação entre diferentes campanhas." },
  { categoria: "Mídia Eletrônica", nome: "Rádio", formato: "Spot 30s", descricao: "Inserção de áudio de 30 segundos veiculada na programação de rádio." },
  { categoria: "Mídia Eletrônica", nome: "Rádio", formato: "Testemunhal", descricao: "Anúncio lido ao vivo por um apresentador ou locutor do programa." },
  { categoria: "Mídia Eletrônica", nome: "TV", formato: "Comercial 15s", descricao: "Comercial de 15 segundos veiculado na grade de programação de TV." },
  { categoria: "Mídia Eletrônica", nome: "TV", formato: "Comercial 30s", descricao: "Comercial de 30 segundos veiculado na grade de programação de TV." },
  { categoria: "Mídia Eletrônica", nome: "Cinema", formato: "Comercial 30s", descricao: "Comercial de 30 segundos exibido antes da sessão nas salas de cinema." },
  { categoria: "Marketing Direto", nome: "Carro de Som", formato: "Padrão", descricao: "Divulgação sonora itinerante em vias públicas de um bairro ou região." },
  { categoria: "Marketing Direto", nome: "Panfletos e Flyers", formato: "Impressão", descricao: "Impressão do material para distribuição. R$ 0,22 por unidade." },
  { categoria: "Marketing Direto", nome: "Panfletos e Flyers", formato: "Distribuição", descricao: "Distribuição de panfletos em pontos de grande circulação. R$ 0,18 por unidade distribuída." },
  { categoria: "Relações Públicas", nome: "Assessoria de Imprensa", formato: "Mensal", descricao: "Gestão profissional do relacionamento com a imprensa para geração de pauta espontânea." },
  { categoria: "Relações Públicas", nome: "Comunicados à Imprensa", formato: "Por release", descricao: "Nota oficial enviada a veículos de imprensa para divulgar uma novidade da empresa." },
  { categoria: "Promoção de Vendas", nome: "Brindes", formato: "Padrão", descricao: "Distribuição de brindes promocionais com a marca da empresa. R$ 8,00 por unidade." },
  { categoria: "Product Placement", nome: "Product Placement", formato: "Inserção Simples", descricao: "Inserção do produto ou marca em cena de programa de TV, novela ou conteúdo audiovisual." },
  { categoria: "Product Placement", nome: "Product Placement", formato: "Inserção Premium", descricao: "Inserção destacada e recorrente do produto ou marca em conteúdo audiovisual de alto alcance." },
];

export async function ensureMidiaCatalog(): Promise<void> {
  try {
    for (const midia of NOVAS_MIDIAS) {
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

    for (const item of DESCRICOES_CATALOGO_ORIGINAL) {
      const result = await pool.query(
        `UPDATE midias SET descricao = $1
         WHERE categoria = $2 AND nome = $3 AND formato = $4 AND descricao IS DISTINCT FROM $1`,
        [item.descricao, item.categoria, item.nome, item.formato]
      );
      if ((result.rowCount ?? 0) > 0) {
        console.log(`✓ Descrição atualizada: ${item.categoria} / ${item.nome} (${item.formato})`);
      }
    }
  } catch (error) {
    // Nunca deixa o boot do servidor falhar por causa disso — na pior
    // hipótese a mídia fica faltando até o próximo deploy tentar de novo.
    console.error("⚠️  Não foi possível garantir o catálogo de mídias:", error);
  }
}
