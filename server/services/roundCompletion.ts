import type { IStorage } from "../storage";
import { calculateResults, applyStrategicImpacts, applyAlignmentPenalties } from "../calculator";

export async function processRoundCompletion(
  storage: IStorage,
  roundId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const round = await storage.getRound(roundId);
    if (!round) {
      return { success: false, error: "Rodada não encontrada" };
    }

    if (round.status === "completed") {
      console.log(`[ROUND_COMPLETION] Round ${roundId} already completed, skipping`);
      return { success: true };
    }

    const classData = await storage.getClass(round.classId);
    if (!classData) {
      return { success: false, error: "Turma não encontrada" };
    }

    console.log(`[ROUND_COMPLETION] Processing completion for round ${roundId}`);

    const autoEventConfig = await storage.getAutoEventConfig(round.classId);
    
    if (autoEventConfig?.enabled) {
      console.log("[ROUND_COMPLETION] Auto-events enabled, generating events");
      try {
        const { economicService } = await import("./economic");
        const { eventGenerator } = await import("./eventGenerator");

        let economicData = await storage.getLatestEconomicData();
        const now = Date.now();
        const oneHour = 3600000;

        if (!economicData || now - economicData.createdAt.getTime() > oneHour) {
          console.log("[ROUND_COMPLETION] Fetching fresh economic data");
          const freshData = await economicService.fetchLatestData();
          economicData = await storage.createEconomicData(freshData);
        }

        const generatedEvents = eventGenerator.generateEvents(
          economicData,
          autoEventConfig,
          round.classId,
          roundId
        );

        console.log(`[ROUND_COMPLETION] Generated ${generatedEvents.length} events`);

        for (const eventData of generatedEvents) {
          await storage.createMarketEvent({
            classId: round.classId,
            roundId: roundId,
            ...eventData,
          });
        }
      } catch (error) {
        console.error("[ROUND_COMPLETION] ERROR generating events:", error);
      }
    }

    const teams = await storage.getTeamsByClass(round.classId);
    const marketEvents = await storage.getMarketEventsByRound(roundId);
    const activeEvents = marketEvents.filter(event => event.active);

    console.log(`[ROUND_COMPLETION] Processing results for ${teams.length} teams`);

    for (const team of teams) {
      const existingResult = await storage.getResult(team.id, roundId);
      if (!existingResult) {
        const marketingMix = await storage.getMarketingMix(team.id, roundId);
        
        if (marketingMix && marketingMix.submittedAt) {
          const baseKPIs = calculateResults({
            marketingMix,
            marketEvents: activeEvents,
            teamBudget: team.budget,
            totalTeamsInRound: teams.length,
          });

          const swot = await storage.getSwotAnalysis(team.id, roundId);
          const porter = await storage.getPorterAnalysis(team.id, roundId);
          const bcg = await storage.getBcgAnalyses(team.id, roundId);
          const pestel = await storage.getPestelAnalysis(team.id, roundId);

          const analyses = {
            swot: swot || null,
            porter: porter || null,
            bcg: bcg.length > 0 ? bcg : null,
            pestel: pestel || null,
          };

          const adjustedKPIs = applyStrategicImpacts(baseKPIs, analyses, marketingMix.priceValue);

          const { kpis: finalKPIs, alignmentScore, alignmentIssues } = applyAlignmentPenalties(
            adjustedKPIs,
            marketingMix,
            swot,
            porter,
            bcg.length > 0 ? bcg[0] : null,
            pestel,
            round.aiAssistanceLevel ?? 1,
            marketingMix.priceValue
          );

          const budgetBefore = team.budget;
          const profitImpact = finalKPIs.profit;
          const budgetAfter = Math.max(0, budgetBefore + profitImpact);

          await storage.createResult({
            teamId: team.id,
            roundId: roundId,
            ...finalKPIs,
            budgetBefore,
            profitImpact,
            budgetAfter,
            alignmentScore,
            alignmentIssues,
          });

          await storage.updateTeam(team.id, { budget: budgetAfter });

          console.log(`[ROUND_COMPLETION] Processed results for team ${team.id}`);
        }
      }
    }

    await storage.updateRound(roundId, {
      status: "completed",
      endedAt: new Date(),
    });

    console.log(`[ROUND_COMPLETION] Round ${roundId} completed successfully`);
    return { success: true };
  } catch (error: any) {
    console.error(`[ROUND_COMPLETION] ERROR processing round ${roundId}:`, error);
    return { success: false, error: error.message || "Erro ao processar encerramento" };
  }
}
