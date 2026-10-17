import { pool } from "./pg-storage";

/**
 * Análises da turma geradas pela IA a cada rodada (out/2026): PESTEL e
 * 5 Forças de Porter descrevem o MERCADO, então são uma só para a turma.
 * Guardamos aqui o conteúdo gerado para que reprocessar a rodada (preparação
 * e abertura) ou incluir uma equipe nova reaproveite o mesmo texto, sem
 * chamar a IA de novo. Tabela nova, criada no boot e idempotente; nenhuma
 * tabela existente é alterada.
 */
export async function ensureAnalisesTurmaTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analises_turma (
        round_id varchar PRIMARY KEY,
        class_id varchar NOT NULL,
        round_number integer NOT NULL,
        pestel jsonb NOT NULL,
        porter jsonb NOT NULL,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS analises_turma_class_idx ON analises_turma (class_id)`);
    console.log(`[BOOT] Tabela "analises_turma" ok.`);
  } catch (e) {
    console.log(`[BOOT] Falha ao garantir a tabela "analises_turma": ${e}`);
  }
}
