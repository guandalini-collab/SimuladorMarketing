import { pool } from "./pg-storage";

/**
 * Conjuntura Brasil por turma (pedido do professor, out/2026 — ver
 * services/conjuntura.ts): texto que o professor pode ajustar para a turma.
 * Sem registro, vale o texto padrão de data/conjunturaBrasil.ts. Só
 * acrescenta uma tabela nova; nenhuma tabela existente é alterada.
 */
export async function ensureClassContextTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS class_context (
        class_id varchar PRIMARY KEY,
        conjuntura text NOT NULL,
        updated_by varchar,
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
    console.log(`[BOOT] Tabela "class_context" ok (criada ou já existente).`);
  } catch (e) {
    console.log(`[BOOT] Falha ao garantir a tabela "class_context": ${e}`);
  }
}
