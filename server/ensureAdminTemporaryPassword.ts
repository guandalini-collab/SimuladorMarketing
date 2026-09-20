import bcrypt from "bcryptjs";
import { pool } from "./pg-storage";

/**
 * Pedido do professor (2026-09): uma senha temporária para a conta de
 * administrador (guandalini@gmail.com), para ele poder logar e trocá-la
 * depois — sem que eu (Claude) precise autenticar em nome dele em nenhum
 * momento. A conta já existe (ver ensureSuperAdminAccount.ts) com uma senha
 * permanente aleatória e inutilizável em `password`; este script reaproveita
 * o mecanismo de senha temporária JÁ EXISTENTE no app (colunas
 * `temporary_password` / `temporary_password_expiry`, mesmas usadas quando um
 * professor gera senha temporária para um aluno em
 * POST /api/users/:userId/generate-temporary-password) em vez de criar um
 * fluxo novo.
 *
 * Idempotente: só define a senha temporária se `temporary_password` ainda
 * estiver NULL nesta conta (primeira vez, ou depois de expirada — o login já
 * limpa a coluna automaticamente quando expira, ver routes.ts). Nunca
 * sobrescreve uma senha temporária ainda válida, então gerar um novo deploy
 * não invalida silenciosamente a senha que a pessoa já está usando.
 *
 * A senha em si (texto puro, só para o boot log e para o commit que introduz
 * este arquivo) é temporária por natureza — feita para ser trocada assim que
 * o professor logar, via a tela de troca de senha obrigatória
 * (POST /api/auth/change-temporary-password, já disparada pelo
 * mustChangePassword=true que o login retorna).
 */
const ADMIN_EMAIL = "guandalini@gmail.com";
const TEMPORARY_PASSWORD = "U5Qh5GaqHvAb";
const EXPIRY_DAYS = 30;

export async function ensureAdminTemporaryPassword(): Promise<void> {
  try {
    const existing = await pool.query(
      `SELECT id, temporary_password FROM users WHERE lower(email) = lower($1)`,
      [ADMIN_EMAIL]
    );

    if (!existing.rowCount || existing.rowCount === 0) {
      console.log(`[BOOT] Senha temporária do admin: conta ${ADMIN_EMAIL} ainda não existe (aguardando ensureSuperAdminAccount).`);
      return;
    }

    const row = existing.rows[0];
    if (row.temporary_password) {
      console.log(`[BOOT] Senha temporária do admin (${ADMIN_EMAIL}) já definida e ainda válida — nada a fazer.`);
      return;
    }

    const hashedTempPassword = await bcrypt.hash(TEMPORARY_PASSWORD, 10);
    const expiryDate = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE users
       SET temporary_password = $1, temporary_password_expiry = $2, must_change_password = true
       WHERE id = $3`,
      [hashedTempPassword, expiryDate, row.id]
    );

    console.log(`[BOOT] Senha temporária definida para ${ADMIN_EMAIL} (expira em ${EXPIRY_DAYS} dias). A pessoa deve trocá-la no primeiro login.`);
  } catch (e) {
    console.log(`[BOOT] Falha ao definir senha temporária do admin: ${e}`);
  }
}
