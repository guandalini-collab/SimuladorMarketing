import type { IStorage } from "../storage";
import type { Team, Round } from "@shared/schema";
import { pool } from "../pg-storage";
import { isSwotComplete, isPorterComplete, isBcgComplete, isPestelComplete } from "./strategicAlignment";

// Percurso obrigatório da rodada (pedido do professor, out/2026): o aluno
// percorre as etapas em ordem lógica e cada uma só abre depois que a
// anterior foi feita.
//   1. Feedback e Resultados da rodada anterior  (botão "Li e entendi")
//   2. Simula+ News e Análise de Mercado          (botão "Li e entendi")
//   3. Ferramentas Estratégicas                   (5 ferramentas completas)
//   4. Identidade da Empresa                      (nome e slogan definidos)
//   5. Mix de Marketing                           (decisão enviada)
// A etapa 1 só existe quando a equipe já tem resultado de uma rodada
// anterior. As confirmações de leitura ficam na tabela
// team_round_steps (ensureTeamRoundStepsTable.ts), uma por equipe/rodada/etapa.

export type JourneyStepKey = "feedback" | "mercado" | "ferramentas" | "identidade" | "mix";
export type AckStep = "feedback" | "mercado";

export interface JourneyStep {
  key: JourneyStepKey;
  number: number;
  label: string;
  href: string;
  paths: string[];
  required: boolean;
  done: boolean;
  locked: boolean;
  note?: string;
}

export interface Journey {
  roundId: string;
  roundNumber: number;
  steps: JourneyStep[];
  currentStep: JourneyStepKey | null;
}

export async function getAcks(teamId: string, roundId: string): Promise<Set<string>> {
  try {
    const { rows } = await pool.query(`SELECT step FROM team_round_steps WHERE team_id = $1 AND round_id = $2`, [teamId, roundId]);
    return new Set(rows.map((r: any) => r.step));
  } catch (error) {
    console.error("[PERCURSO] Erro ao ler confirmações:", error);
    return new Set();
  }
}

export async function saveAck(teamId: string, roundId: string, step: AckStep, userId: string): Promise<void> {
  await pool.query(
    `INSERT INTO team_round_steps (team_id, round_id, step, user_id) VALUES ($1, $2, $3, $4)
     ON CONFLICT (team_id, round_id, step) DO NOTHING`,
    [teamId, roundId, step, userId],
  );
}

export async function computeJourney(
  storage: IStorage,
  team: Team,
  round: Round,
  segmentationComplete: (list: any[], businessType?: string | null) => boolean,
): Promise<Journey> {
  const [acks, swot, porter, bcg, pestel, segs, mixes, classData, allRounds] = await Promise.all([
    getAcks(team.id, round.id),
    storage.getSwotAnalysesByTeamAndRound(team.id, round.id),
    storage.getPorterAnalysesByTeamAndRound(team.id, round.id),
    storage.getBcgAnalyses(team.id, round.id),
    storage.getPestelAnalysesByTeamAndRound(team.id, round.id),
    storage.getMarketSegmentationsByTeamAndRound(team.id, round.id),
    storage.getMarketingMixesByTeamAndRound(team.id, round.id),
    storage.getClass(team.classId),
    storage.getRoundsByClass(team.classId),
  ]);

  // Etapa 1 só faz sentido se a equipe já teve resultado numa rodada anterior.
  let temResultadoAnterior = false;
  for (const r of allRounds.filter((x) => x.roundNumber < round.roundNumber && x.status === "completed")) {
    if (await storage.getResult(team.id, r.id)) { temResultadoAnterior = true; break; }
  }

  const ferramentas =
    swot.some(isSwotComplete) &&
    porter.some(isPorterComplete) &&
    bcg.some(isBcgComplete) &&
    pestel.some(isPestelComplete) &&
    segmentationComplete(segs, classData?.businessType);
  const identidade = !!team.companyName?.trim() && !!team.slogan?.trim();

  // No primeiro mês de um ano novo, a etapa 1 também exige a reflexão do
  // fechamento do ano que terminou (services/annualReview.ts).
  const { pendingReflectionYear } = await import("./annualReview");
  const anoPendente = await pendingReflectionYear(storage, team, round);
  const enviado = mixes.some((m) => m.submittedAt !== null);

  const base: Omit<JourneyStep, "number" | "locked">[] = [
    anoPendente
      ? { key: "feedback", label: "Feedback e Resultados da rodada anterior", href: "/fechamento-anual", paths: ["/feedback", "/analises"], required: true, done: false, note: `Antes de seguir, a equipe precisa responder e enviar a reflexão do Fechamento do Ano ${anoPendente}.` }
      : { key: "feedback", label: "Feedback e Resultados da rodada anterior", href: "/feedback", paths: ["/feedback", "/analises"], required: temResultadoAnterior, done: !temResultadoAnterior || acks.has("feedback") },
    { key: "mercado", label: "Simula+ News e Análise de Mercado", href: "/mercado", paths: ["/news", "/mercado"], required: true, done: acks.has("mercado") },
    { key: "ferramentas", label: "Ferramentas Estratégicas", href: "/estrategia", paths: ["/estrategia"], required: true, done: ferramentas },
    { key: "identidade", label: "Identidade da Empresa", href: "/empresa", paths: ["/empresa"], required: true, done: identidade },
    { key: "mix", label: "Mix de Marketing", href: "/decisoes", paths: ["/decisoes"], required: true, done: enviado },
  ];

  let bloqueado = false;
  let numero = 0;
  const steps: JourneyStep[] = base.map((s) => {
    const step: JourneyStep = { ...s, number: s.required ? ++numero : 0, locked: bloqueado && !enviado };
    if (s.required && !s.done) bloqueado = true;
    return step;
  });

  const atual = steps.find((s) => s.required && !s.done);
  return { roundId: round.id, roundNumber: round.roundNumber, steps, currentStep: atual?.key ?? null };
}
