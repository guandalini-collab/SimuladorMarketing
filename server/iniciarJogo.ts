import { pool } from "./pg-storage";

/**
 * Rodada de teste (pedido do professor, out/2026): "Iniciar o jogo".
 *
 * Numa única transação:
 * 1. apaga, em toda tabela que tem coluna "round_id" (descoberta pelo
 *    information_schema, para incluir também as tabelas criadas no boot
 *    pelos ensure*.ts), as linhas das rodadas de teste;
 * 2. apaga as próprias rodadas de teste;
 * 3. renumera as rodadas restantes da turma (só podem ser rodadas futuras
 *    bloqueadas) a partir de 1, na mesma ordem;
 * 4. zera a rodada atual da turma;
 * 5. devolve a cada equipe a verba inicial (initial_budget).
 * Alunos, equipes, produtos da turma e configuração de mercado ficam intactos.
 */
/** Erro de regra ("não pode iniciar agora"), com mensagem para o professor. */
export class IniciarJogoRecusado extends Error {}

export async function iniciarJogoDaTurma(classId: string, rodadasPedidas: string[]) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Out/2026 (Grupo C): as condições são conferidas DENTRO da transação,
    // com a turma e as rodadas travadas (FOR UPDATE). Antes eram conferidas
    // antes do BEGIN, e o agendador podia abrir uma rodada no intervalo.
    await client.query(`SELECT id FROM classes WHERE id = $1 FOR UPDATE`, [classId]);
    const rodadas = await client.query<{ id: string; status: string; is_practice: boolean | null; round_number: number }>(
      `SELECT id, status, is_practice, round_number FROM rounds WHERE class_id = $1 FOR UPDATE`,
      [classId]
    );
    if (rodadas.rows.some((r) => r.status === "active")) {
      throw new IniciarJogoRecusado("Há uma rodada aberta. Encerre-a antes de iniciar o jogo.");
    }
    const realJaAberta = rodadas.rows.find((r) => !r.is_practice && r.status !== "locked");
    if (realJaAberta) {
      throw new IniciarJogoRecusado(`A Rodada ${realJaAberta.round_number} (que não é de teste) já foi aberta: o jogo já começou.`);
    }
    // Só apaga rodadas que são de teste E desta turma, mesmo que o pedido
    // traga outros ids.
    const rodadasDeTeste = rodadas.rows.filter((r) => r.is_practice === true && rodadasPedidas.includes(r.id)).map((r) => r.id);
    if (rodadasDeTeste.length === 0) {
      throw new IniciarJogoRecusado("Esta turma não tem rodada de teste para apagar.");
    }

    const tabelas = await client.query<{ table_name: string }>(`
      SELECT DISTINCT c.table_name
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_name = c.table_name AND t.table_schema = c.table_schema
      WHERE c.column_name = 'round_id'
        AND c.table_schema = current_schema()
        AND t.table_type = 'BASE TABLE'
        AND c.table_name <> 'rounds'
    `);

    const apagadas: Record<string, number> = {};
    for (const { table_name } of tabelas.rows) {
      const r = await client.query(`DELETE FROM "${table_name}" WHERE round_id = ANY($1::varchar[])`, [rodadasDeTeste]);
      if ((r.rowCount ?? 0) > 0) apagadas[table_name] = r.rowCount ?? 0;
    }

    await client.query(`DELETE FROM rounds WHERE id = ANY($1::varchar[]) AND class_id = $2`, [rodadasDeTeste, classId]);

    // Renumera em duas etapas para não violar o índice único (class_id, round_number).
    await client.query(`UPDATE rounds SET round_number = round_number + 100000 WHERE class_id = $1`, [classId]);
    await client.query(`
      UPDATE rounds r SET round_number = x.novo
      FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY round_number) AS novo FROM rounds WHERE class_id = $1) x
      WHERE r.id = x.id
    `, [classId]);

    await client.query(`UPDATE classes SET current_round = 0 WHERE id = $1`, [classId]);
    const equipes = await client.query(`UPDATE teams SET budget = initial_budget WHERE class_id = $1`, [classId]);

    await client.query("COMMIT");
    console.log(`[INICIAR-JOGO] Turma ${classId}: ${rodadasDeTeste.length} rodada(s) de teste apagada(s); linhas apagadas: ${JSON.stringify(apagadas)}; verba restaurada em ${equipes.rowCount ?? 0} equipe(s)`);
    return { rodadasApagadas: rodadasDeTeste.length, linhasApagadas: apagadas, equipesRestauradas: equipes.rowCount ?? 0 };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
