import { pool } from "./pg-storage";

/**
 * Out/2026 (Grupo A da auditoria de segurança): a versão anterior deste
 * script gravava, a cada boot, uma senha temporária FIXA para a conta do
 * administrador (guandalini@gmail.com, professor e administrador). Essa
 * senha estava escrita no código-fonte e no histórico do git, então é
 * tratada como vazada.
 *
 * Agora o script faz o contrário: apaga a senha temporária da conta do
 * administrador. A senha permanente dele não é tocada. Se a conta ainda
 * estivesse com a troca pendente, o caminho é "Esqueci minha senha" (cujo
 * link agora aponta para o site certo).
 *
 * Idempotente: depois da primeira execução não há o que apagar.
 */
const ADMIN_EMAIL = "guandalini@gmail.com";

export async function ensureAdminTemporaryPassword(): Promise<void> {
  try {
    const existing = await pool.query(
      `SELECT id, temporary_password IS NOT NULL AS tem_temporaria FROM users WHERE lower(email) = lower($1)`,
      [ADMIN_EMAIL]
    );
    if (!existing.rowCount) return;
    const row = existing.rows[0];
    if (!row.tem_temporaria) {
      console.log(`[BOOT] Conta do administrador sem senha temporária — ok.`);
      return;
    }
    await pool.query(
      `UPDATE users SET temporary_password = NULL, temporary_password_expiry = NULL WHERE id = $1`,
      [row.id]
    );
    console.log(`[BOOT] Senha temporária antiga do administrador apagada (a senha permanente continua a mesma).`);
  } catch (e) {
    console.log(`[BOOT] Falha ao revisar a senha temporária do administrador: ${e}`);
  }
}
