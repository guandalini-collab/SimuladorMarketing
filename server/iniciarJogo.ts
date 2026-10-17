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
export async function iniciarJogoDaTurma(classId: string, rodadasDeTeste: string[]) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

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
