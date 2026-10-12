import type { IStorage } from "../storage";

// Automação de IA ligada ao ciclo das rodadas (pedido do professor, out/2026):
//
// - Ao ABRIR uma rodada:
//   1. Completa, com análises mínimas geradas por IA, só o que estiver
//      faltando para cada equipe (SWOT, Porter, BCG, PESTEL, Segmentação).
//      Nunca sobrescreve: roda depois da herança da rodada anterior
//      (strategyCarryForward.ts), então o que a equipe já fez continua
//      valendo. Na Rodada 1 isso já acontecia; agora vale para todas.
//   2. Se a "Geração automática de eventos" estiver ligada na turma e a
//      rodada ainda não tiver eventos, gera eventos de mercado com IA em
//      quantidade aleatória (EVENTOS_MIN a EVENTOS_MAX), igual ao botão
//      "Gerar com IA" — assim os alunos já os veem durante a rodada.
//
// - Ao ENCERRAR uma rodada:
//   3. Gera o Feedback Inteligente (IA) de cada equipe que teve resultado
//      calculado e ainda não tem feedback, igual ao botão "Gerar para
//      todas as equipes".
//
// Tudo roda em segundo plano (não atrasa a abertura/encerramento) e cada
// passo é isolado: uma falha só é registrada no log, sem afetar a rodada
// nem os demais passos. Nenhuma regra de cálculo foi alterada.

const EVENTOS_MIN = 2;
const EVENTOS_MAX = 4;

function quantidadeAleatoriaDeEventos(): number {
  return EVENTOS_MIN + Math.floor(Math.random() * (EVENTOS_MAX - EVENTOS_MIN + 1));
}

async function completarAnalisesFaltantes(storage: IStorage, roundId: string, roundNumber: number) {
  // Na Rodada 1, as rotas de início e o agendador já chamam esta mesma
  // geração — não repete.
  if (roundNumber <= 1) return;
  const { autoGenerateMinimalAnalysesForAllTeams } = await import("./autoStrategicGeneration");
  const result = await autoGenerateMinimalAnalysesForAllTeams(storage, roundId);
  console.log(`[ROUND-AUTO] Análises completadas na abertura: ${result.successCount}/${result.totalTeams} equipes`);
}

async function gerarEventosDaRodada(storage: IStorage, roundId: string, classId: string) {
  const config = await storage.getAutoEventConfig(classId);
  if (!config?.enabled) {
    console.log("[ROUND-AUTO] Geração automática de eventos desligada nesta turma — nenhum evento gerado");
    return;
  }

  const existentes = await storage.getMarketEventsByRound(roundId);
  if (existentes.length > 0) {
    console.log(`[ROUND-AUTO] Rodada já tem ${existentes.length} evento(s) — nada a gerar`);
    return;
  }

  const classData = await storage.getClass(classId);
  if (!classData?.sector || classData.sector.trim() === "") {
    console.warn("[ROUND-AUTO] Turma sem setor configurado — eventos não gerados");
    return;
  }

  const { generateMarketEvents, translateEventTypeToPt } = await import("./aiEventGenerator");
  const teams = await storage.getTeamsByClass(classId);
  const quantidade = quantidadeAleatoriaDeEventos();

  const eventos = await generateMarketEvents({
    sectorId: classData.sector,
    productCategory: teams[0]?.productCategory || undefined,
    businessType: classData.businessType || "B2C",
    marketSize: classData.marketSize || undefined,
    competitionLevel: classData.competitionLevel || undefined,
    numberOfEvents: quantidade,
  });

  // Confere de novo logo antes de gravar: se o professor criou eventos
  // enquanto a IA respondia, não acrescenta outro lote por cima.
  const aindaSemEventos = (await storage.getMarketEventsByRound(roundId)).length === 0;
  if (!aindaSemEventos) {
    console.log("[ROUND-AUTO] Eventos criados durante a geração — lote automático descartado");
    return;
  }

  for (const event of eventos) {
    await storage.createMarketEvent({
      classId,
      roundId,
      type: translateEventTypeToPt(event.type),
      title: event.title,
      description: event.description,
      impact: event.impact,
      severity: event.severity,
      sentiment: event.sentiment,
      active: true,
    });
  }
  console.log(`[ROUND-AUTO] ${eventos.length} evento(s) de mercado gerado(s) por IA (sorteados: ${quantidade})`);
}

export async function runRoundOpenedAutomation(storage: IStorage, roundId: string): Promise<void> {
  const round = await storage.getRound(roundId);
  if (!round || round.status !== "active") return;

  try {
    await completarAnalisesFaltantes(storage, round.id, round.roundNumber);
  } catch (error) {
    console.error("[ROUND-AUTO] Erro ao completar análises na abertura:", error);
  }

  try {
    await gerarEventosDaRodada(storage, round.id, round.classId);
  } catch (error) {
    console.error("[ROUND-AUTO] Erro ao gerar eventos na abertura:", error);
  }
}

async function gerarFeedbackDaEquipe(storage: IStorage, teamId: string, roundId: string): Promise<"gerado" | "pulado"> {
  if (await storage.getAiFeedback(teamId, roundId)) return "pulado";

  const team = await storage.getTeam(teamId);
  const round = await storage.getRound(roundId);
  if (!team || !round) return "pulado";
  const classData = await storage.getClass(team.classId);
  const marketingMix = await storage.getMarketingMix(teamId, roundId);
  const result = await storage.getResult(teamId, roundId);
  if (!classData || !marketingMix || !result) return "pulado";

  // Mesmo conteúdo enviado à IA pela rota POST /api/feedback/generate.
  const marketEvents = await storage.getMarketEventsByRound(roundId);
  const allResults = await storage.getAllResults();
  const previousResults = [];
  for (const r of allResults.filter((x) => x.teamId === teamId)) {
    const resultRound = await storage.getRound(r.roundId);
    if (resultRound && resultRound.roundNumber < round.roundNumber) previousResults.push(r);
  }
  previousResults.sort((a, b) => a.calculatedAt.getTime() - b.calculatedAt.getTime());

  const { generateFeedback } = await import("./aiFeedback");
  const analysis = await generateFeedback({
    marketingMix,
    result,
    classData,
    teamData: team,
    marketEvents: marketEvents.filter((e) => e.active),
    previousResults,
  });

  // O professor pode ter gerado manualmente enquanto a IA respondia.
  if (await storage.getAiFeedback(teamId, roundId)) return "pulado";

  await storage.createAiFeedback({
    teamId,
    roundId,
    overallAnalysis: analysis.overallAnalysis,
    strengths: analysis.strengths,
    weaknesses: analysis.weaknesses,
    suggestions: analysis.suggestions,
    literatureRecommendations: analysis.literatureRecommendations,
  });
  return "gerado";
}

export async function runRoundClosedAutomation(storage: IStorage, roundId: string): Promise<void> {
  const round = await storage.getRound(roundId);
  if (!round || round.status !== "completed") return;

  const teams = await storage.getTeamsByClass(round.classId);
  let gerados = 0;
  let pulados = 0;
  for (const team of teams) {
    try {
      const status = await gerarFeedbackDaEquipe(storage, team.id, roundId);
      if (status === "gerado") gerados++;
      else pulados++;
    } catch (error) {
      console.error(`[ROUND-AUTO] Erro ao gerar feedback da equipe ${team.id}:`, error);
    }
  }
  console.log(`[ROUND-AUTO] Feedback Inteligente no encerramento: ${gerados} gerado(s), ${pulados} pulado(s) de ${teams.length} equipe(s)`);
}

// Dispara sem bloquear quem chamou (rotas e agendador).
export function scheduleRoundOpenedAutomation(storage: IStorage, roundId: string): void {
  void runRoundOpenedAutomation(storage, roundId).catch((error) =>
    console.error("[ROUND-AUTO] Falha na automação de abertura:", error),
  );
}

export function scheduleRoundClosedAutomation(storage: IStorage, roundId: string): void {
  void runRoundClosedAutomation(storage, roundId).catch((error) =>
    console.error("[ROUND-AUTO] Falha na automação de encerramento:", error),
  );
}
