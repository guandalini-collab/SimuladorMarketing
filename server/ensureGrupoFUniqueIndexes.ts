import { pool } from "./pg-storage";

/**
 * Out/2026 (Grupo F da auditoria): índices únicos que faltavam.
 *
 * - bcg_analysis: uma linha por (equipe, rodada, produto). Antes, uma nova
 *   tentativa ou duas preparações simultâneas podiam gravar a mesma BCG duas
 *   vezes, e a matriz e o alinhamento passavam a contar o produto em dobro.
 *   O nome do produto entra na chave porque, no fluxo antigo, a equipe podia
 *   cadastrar na BCG produtos sem vínculo com o catálogo (product_id vazio).
 * - ai_feedback: um feedback por (equipe, rodada). Antes, duas gerações
 *   simultâneas gravavam dois feedbacks e a tela mostrava um deles ao acaso.
 *
 * Mesmo cuidado do ensureGrupoBUniqueIndexes.ts: se já houver duplicatas,
 * nada é apagado; o índice daquela tabela não é criado e o caso fica
 * registrado no log para revisão. Idempotente (IF NOT EXISTS).
 */
const INDICES = [
  {
    tabela: "bcg_analysis",
    nome: "bcg_unique_team_round_product",
    chave: "team_id, round_id, COALESCE(product_id, ''), COALESCE(product_name, '')",
  },
  {
    tabela: "ai_feedback",
    nome: "ai_feedback_unique_team_round",
    chave: "team_id, round_id",
  },
];

export async function ensureGrupoFUniqueIndexes(): Promise<void> {
  for (const { tabela, nome, chave } of INDICES) {
    try {
      const duplicadas = await pool.query(
        `SELECT ${chave}, COUNT(*) AS qtd FROM ${tabela} GROUP BY ${chave} HAVING COUNT(*) > 1 LIMIT 10`
      );
      if (duplicadas.rows.length > 0) {
        console.log(
          `[BOOT] "${tabela}": ${duplicadas.rows.length}+ grupo(s) duplicado(s) encontrados — índice único "${nome}" NÃO criado (revisar antes). Exemplos: ${JSON.stringify(duplicadas.rows)}`
        );
        continue;
      }
      await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS ${nome} ON ${tabela} (${chave})`);
      console.log(`[BOOT] Índice único "${nome}" ok (criado ou já existente).`);
    } catch (e) {
      console.log(`[BOOT] Falha ao garantir índice único "${nome}" em "${tabela}": ${e}`);
    }
  }
}
