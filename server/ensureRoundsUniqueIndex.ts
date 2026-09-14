import { pool } from "./pg-storage";

/**
 * Grupo D (auditoria de 2026-09) — POST /api/rounds/:classId/start fazia
 * "checar se já há rodada ativa, depois criar a próxima" sem atomicidade:
 * duas chamadas concorrentes (duplo clique em "Iniciar Rodada") liam o
 * mesmo classData.currentRound e ambas criavam uma rodada com o MESMO
 * (class_id, round_number), deixando duas rodadas "active" simultâneas
 * para a mesma turma — quebrando qualquer código que assume no máximo uma
 * rodada ativa por turma (getCurrentRound faz SELECT ... LIMIT 1, por
 * exemplo).
 *
 * Como o pre-deploy "drizzle-kit push" do Railway está desligado (ver
 * server/ensureResultsUniqueIndex.ts), a nova constraint em
 * shared/schema.ts não chega à produção sozinha — esta função cria o
 * índice diretamente via SQL, de forma idempotente (IF NOT EXISTS).
 *
 * Segurança: como esse bug pode já ter produzido duplicatas em produção
 * antes desta correção, CREATE UNIQUE INDEX falharia se elas existirem.
 * Em vez de apagar linhas automaticamente (decisão que não deve ser
 * tomada sem revisão humana), primeiro checa se há duplicatas; se houver,
 * pula a criação do índice e deixa registrado no log para investigação —
 * não derruba o boot do servidor.
 */
export async function ensureRoundsUniqueIndex(): Promise<void> {
  try {
    const dupCheck = await pool.query(`
      SELECT class_id, round_number, COUNT(*) AS qtd
      FROM rounds
      GROUP BY class_id, round_number
      HAVING COUNT(*) > 1
      LIMIT 10
    `);

    if (dupCheck.rows.length > 0) {
      console.log(
        `[BOOT] "rounds": ${dupCheck.rows.length}+ grupo(s) duplicado(s) de (class_id, round_number) encontrados — índice único "rounds_unique_class_round_number" NÃO criado (precisa de investigação/limpeza antes). Exemplos: ${JSON.stringify(dupCheck.rows)}`
      );
      return;
    }

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS rounds_unique_class_round_number
      ON rounds (class_id, round_number)
    `);
    console.log(`[BOOT] Índice único "rounds_unique_class_round_number" ok (criado ou já existente).`);
  } catch (e) {
    console.log(`[BOOT] Falha ao garantir índice único "rounds_unique_class_round_number": ${e}`);
  }
}
