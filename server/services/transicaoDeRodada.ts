import { pool } from "../pg-storage";

/**
 * Out/2026 (Grupo C da auditoria): abertura atômica de uma rodada agendada.
 *
 * Antes, o agendador e o botão "Iniciar rodada" liam a rodada como
 * "locked" e depois gravavam "active" sem condição: se os dois agissem no
 * mesmo minuto (ou dois processos do agendador durante uma publicação do
 * site), a rodada era aberta duas vezes e as tarefas de abertura (análises,
 * eventos, boletim) rodavam em dobro.
 *
 * Agora a troca de estado é um único UPDATE condicional: só quem encontra a
 * rodada ainda "locked" a abre; o outro recebe false e não faz nada.
 * (O encerramento já era atômico: ver claimRoundForCompletion.)
 */
export async function abrirRodadaBloqueada(roundId: string): Promise<boolean> {
  const r = await pool.query(
    `UPDATE rounds SET status = 'active', started_at = COALESCE(started_at, now())
     WHERE id = $1 AND status = 'locked'
     RETURNING id`,
    [roundId]
  );
  return (r.rowCount ?? 0) === 1;
}

// Número fixo do bloqueio consultivo do agendador (qualquer inteiro único
// no banco serve; não colide com nada do app).
const BLOQUEIO_DO_AGENDADOR = 7_270_026;

/**
 * Executa a tarefa só se nenhum outro processo do app estiver executando o
 * agendador no mesmo instante (ex.: o processo antigo e o novo durante uma
 * publicação no Railway). Usa pg_try_advisory_lock: não espera; se outro
 * processo tem o bloqueio, este pula a rodada de verificação.
 */
export async function comBloqueioDoAgendador(tarefa: () => Promise<void>): Promise<boolean> {
  const cliente = await pool.connect();
  let obtido = false;
  try {
    const r = await cliente.query("SELECT pg_try_advisory_lock($1) AS ok", [BLOQUEIO_DO_AGENDADOR]);
    obtido = r.rows[0]?.ok === true;
    if (!obtido) return false;
    await tarefa();
    return true;
  } finally {
    if (obtido) {
      await cliente.query("SELECT pg_advisory_unlock($1)", [BLOQUEIO_DO_AGENDADOR]).catch(() => {});
    }
    cliente.release();
  }
}
