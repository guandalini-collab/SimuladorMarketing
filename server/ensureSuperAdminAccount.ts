import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { pool } from "./pg-storage";

/**
 * Pedido do professor (2026-09): conta de administrador da plataforma —
 * hoje o "admin" é só um allowlist fixo de e-mails no código
 * (authorizedProfessorEmails em routes.ts), sem role/flag persistida. Este
 * boot script cria uma flag "is_admin" de verdade em "users", independente
 * de "role": em vez de trocar o role da conta existente (o que quebraria o
 * acesso normal dela — ex.: um professor perderia as rotas gated por
 * role==="professor"), a mesma conta pode acumular isAdmin=true por cima do
 * role que já tem. Isso permite logar com o MESMO e-mail (guandalini@gmail.com)
 * e ter acesso tanto às telas de professor quanto ao futuro painel de
 * administrador da plataforma (licenciamento etc.).
 *
 * Idempotente e seguro para rodar em todo boot:
 * - Se já existe uma conta com este e-mail, só liga "is_admin" nela (nunca
 *   mexe em senha, role ou qualquer outro campo já existente).
 * - Se não existe nenhuma conta com este e-mail, cria uma nova como
 *   role="professor" (mesmo comportamento que o allowlist já dava para este
 *   e-mail) com is_admin=true e uma senha aleatória inutilizável (nunca é
 *   revelada em lugar nenhum) + must_change_password=true. A pessoa dona do
 *   e-mail define sua própria senha pelo fluxo já existente de "Esqueci
 *   minha senha" (POST /api/auth/forgot-password), que envia um link de
 *   redefinição por e-mail via Resend (server/email-service.ts).
 */
const SUPER_ADMIN_EMAIL = "guandalini@gmail.com";
const SUPER_ADMIN_NAME = "Alexandre Guandalini Bossa";

export async function ensureSuperAdminAccount(): Promise<void> {
  try {
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false
    `);

    const existing = await pool.query(
      `SELECT id, is_admin FROM users WHERE lower(email) = lower($1)`,
      [SUPER_ADMIN_EMAIL]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      const row = existing.rows[0];
      if (!row.is_admin) {
        await pool.query(`UPDATE users SET is_admin = true WHERE id = $1`, [row.id]);
        console.log(`[BOOT] Conta existente (${SUPER_ADMIN_EMAIL}) marcada como administradora da plataforma (is_admin=true). Login e senha continuam os mesmos de sempre.`);
      } else {
        console.log(`[BOOT] Conta de administrador (${SUPER_ADMIN_EMAIL}) ok.`);
      }
      return;
    }

    // Senha aleatória de 32 bytes, só para satisfazer a coluna NOT NULL —
    // nunca é exibida nem enviada a ninguém. A pessoa define a senha real
    // pelo fluxo de "Esqueci minha senha" com este mesmo e-mail.
    const unusablePassword = randomBytes(32).toString("hex");
    const passwordHash = await bcrypt.hash(unusablePassword, 10);

    await pool.query(
      `INSERT INTO users (email, password, name, role, status, must_change_password, is_admin)
       VALUES ($1, $2, $3, 'professor', 'approved', true, true)`,
      [SUPER_ADMIN_EMAIL, passwordHash, SUPER_ADMIN_NAME]
    );
    console.log(`[BOOT] Conta de administrador da plataforma criada (${SUPER_ADMIN_EMAIL}). Nenhuma senha foi definida — use "Esqueci minha senha" na tela de login com este e-mail para criar a senha de acesso.`);
  } catch (e) {
    console.log(`[BOOT] Falha ao garantir conta de administrador da plataforma: ${e}`);
  }
}
