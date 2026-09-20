import { pool } from "./pg-storage";

/**
 * Pedido do professor (2026-09): Rodada 0 — onboarding obrigatório exibido
 * no primeiro acesso do aluno (explica o jogo, exige leitura mínima de 2
 * minutos por seção, e libera o Manual do Aluno no menu só depois de
 * concluído). Ver shared/onboarding.ts para a lista de seções e
 * server/routes.ts para as rotas /api/onboarding/*.
 *
 * Como o pre-deploy "drizzle-kit push" do Railway está desligado, as novas
 * colunas em "users" (onboarding_progress, onboarding_completed_at)
 * precisam ser criadas manualmente aqui no boot.
 *
 * Grandfathering: alunos que já usavam a plataforma ANTES desta feature
 * existir não devem ser barrados retroativamente por um onboarding que
 * nunca fizeram — seria uma interrupção surpresa no meio do jogo. Por isso,
 * na mesma execução em que as colunas são criadas (e só nela), todo aluno
 * já cadastrado até aquele momento recebe onboarding_completed_at = now(),
 * como se já tivesse concluído. Só contas criadas DEPOIS dessa migração
 * (role "equipe") nascem com onboarding_completed_at nulo e precisam
 * mesmo passar pela Rodada 0.
 */
export async function ensureOnboardingColumns(): Promise<void> {
  try {
    const columnCheck = await pool.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'onboarding_completed_at'
    `);
    const columnAlreadyExisted = (columnCheck.rowCount ?? 0) > 0;

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS onboarding_progress jsonb NOT NULL DEFAULT '{}'::jsonb
    `);
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamp
    `);

    if (!columnAlreadyExisted) {
      const result = await pool.query(`
        UPDATE users
        SET onboarding_completed_at = now()
        WHERE onboarding_completed_at IS NULL
      `);
      console.log(`[BOOT] Colunas de onboarding criadas em "users"; ${result.rowCount ?? 0} conta(s) já existente(s) marcada(s) como onboarding concluído (grandfathering — só novas contas passam pela Rodada 0).`);
    } else {
      console.log(`[BOOT] Colunas de onboarding em "users" ok (já existiam).`);
    }
  } catch (e) {
    console.log(`[BOOT] Falha ao garantir colunas de onboarding em "users": ${e}`);
  }
}
