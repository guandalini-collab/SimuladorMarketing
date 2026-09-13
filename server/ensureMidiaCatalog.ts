import { pool } from "./pg-storage";

// Mídias que o Guia de Mídias (tela e PDF) sempre prometeu ao aluno, mas que
// nunca existiram na tabela `midias` — o aluno via a promessa no guia e não
// encontrava a opção para selecionar/investir na aba Decisões.
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
  } catch (error) {
    // Nunca deixa o boot do servidor falhar por causa disso — na pior
    // hipótese a mídia fica faltando até o próximo deploy tentar de novo.
    console.error("⚠️  Não foi possível garantir o catálogo de mídias:", error);
  }
}
