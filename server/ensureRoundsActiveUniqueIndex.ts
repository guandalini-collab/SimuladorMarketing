import { pool } from "./pg-storage";

/**
 * Auditoria (2026-09, segunda rodada) — roundScheduler.processScheduledStarts
 * fazia "checar se a turma já tem rodada ativa (getCurrentRound), depois
 * ativar a rodada agendada (updateRound status=active)" sem atomicidade. Como
 * esse scheduler roda em paralelo às rotas manuais de início de rodada
 * (POST /api/rounds/:classId/start e sua irmã), era possível o professor
 * iniciar uma rodada manualmente no mesmo instante em que o scheduler
 * ativava uma rodada agendada para a mesma turma — como são round_number
 * diferentes, o índice único "rounds_unique_class_round_number" não detecta
 * esse caso, e a turma ficava com DUAS rodadas "active" simultâneas
 * (quebrando getCurrentRound, que faz SELECT ... LIMIT 1 e retorna um
 * resultado arbitrário).
 *
 * Como o pre-deploy "drizzle-kit push" do Railway está desligado (ver
 * server/ensureResultsUniqueIndex.ts), a nova constraint em
 * shared/schema.ts não chega à produção sozinha — esta função cria o
 * índice parcial diretamente via SQL, de forma idempotente (IF NOT EXISTS).
 *
 * Segurança: como esse bug pode já ter produzido duplicatas em produção
 * antes desta correção, CREATE UNIQUE INDEX falharia se elas existirem. Em
 * vez de apagar/alterar linhas automaticamente (decisão que não deve ser
 * tomada sem revisão humana), primeiro checa se há turmas com mais de uma
 * rodada "active"; se houver, pula a criação do índice e deixa registrado
 * no log para investigação — não derruba o boot do servidor.
 */
export async function ensureRoundsActiveUniqueIndex(): Promise<void> {
  try {
    const dupCheck = await pool.query(`
      SELECT class_id, COUNT(*) AS qtd
      FROM rounds
      WHERE status = 'active'
      GROUP BY class_id
      HAVING COUNT(*) > 1
      LIMIT 10
    `);

    if (dupCheck.rows.length > 0) {
      console.log(
        `[BOOT] "rounds": ${dupCheck.rows.length}+ turma(s) com mais de uma rodada "active" simultânea — índice único "rounds_unique_active_per_class" NÃO criado (precisa de investigação/limpeza antes). Exemplos: ${JSON.stringify(dupCheck.rows)}`
      );
      return;
    }

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS rounds_unique_active_per_class
      ON rounds (class_id)
      WHERE status = 'active'
    `);
    console.log(`[BOOT] Índice único "rounds_unique_active_per_class" ok (criado ou já existente).`);
  } catch (e) {
    console.log(`[BOOT] Falha ao garantir índice único "rounds_unique_active_per_class": ${e}`);
  }
}
