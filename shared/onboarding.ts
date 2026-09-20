/**
 * Pedido do professor (2026-09): Rodada 0 — onboarding obrigatório exibido
 * no primeiro acesso do aluno, antes de liberar o resto do jogo. Cada seção
 * exige um tempo mínimo de leitura (imposto pelo SERVIDOR, não só pela
 * tela, para não poder ser pulado editando o JavaScript do navegador — ver
 * as rotas /api/onboarding/* em server/routes.ts). Este arquivo é a única
 * fonte de verdade sobre quais seções existem e quanto tempo cada uma
 * exige: tanto o cliente (client/src/pages/onboarding.tsx, para o texto e
 * o cronômetro) quanto o servidor (para validar) importam daqui, evitando
 * que os dois lados fiquem dessincronizados sobre a lista de seções.
 */

export const ONBOARDING_MIN_SECONDS_PER_SECTION = 120; // 2 minutos

export const ONBOARDING_SECTION_IDS = [
  "boas-vindas",
  "rodadas",
  "mix-marketing",
  "ferramentas-estrategicas",
  "eventos-resultados",
  "equipe-regras",
] as const;

export type OnboardingSectionId = (typeof ONBOARDING_SECTION_IDS)[number];

export interface OnboardingSectionProgress {
  startedAt: string; // ISO timestamp
  completedAt: string | null; // ISO timestamp, null até concluir
}

export type OnboardingProgress = Partial<Record<OnboardingSectionId, OnboardingSectionProgress>>;

export function isOnboardingSectionId(value: string): value is OnboardingSectionId {
  return (ONBOARDING_SECTION_IDS as readonly string[]).includes(value);
}

export function isOnboardingComplete(progress: OnboardingProgress): boolean {
  return ONBOARDING_SECTION_IDS.every((id) => Boolean(progress[id]?.completedAt));
}
