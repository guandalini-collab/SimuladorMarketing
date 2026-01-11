import type { IStorage } from "../storage";
import { calculateResults, applyStrategicImpacts, applyAlignmentPenalties } from "../calculator";
import { computeRoundOutcome, type SimulationInputs } from "../simulation/marketEngine";
import { getEnv } from "../config";

function isSimEngineV2Enabled(): boolean {
  try {
    const env = getEnv();
    return env.SIM_ENGINE_V2 === "true";
  } catch {
    return false;
  }
}

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

    const useV2Engine = isSimEngineV2Enabled();
    console.log(`[ROUND_COMPLETION] Using simulation engine: ${useV2Engine ? "V2" : "V1 (legacy)"}`);

    for (const team of teams) {
      const existingResult = await storage.getResult(team.id, roundId);
      if (!existingResult) {
        const marketingMix = await storage.getMarketingMix(team.id, roundId);
        
        if (marketingMix && marketingMix.submittedAt) {
          const swot = await storage.getSwotAnalysis(team.id, roundId);
          const porter = await storage.getPorterAnalysis(team.id, roundId);
          const bcg = await storage.getBcgAnalyses(team.id, roundId);
          const pestel = await storage.getPestelAnalysis(team.id, roundId);

          let finalKPIs: any;
          let alignmentScore: number | undefined;
          let alignmentIssues: string[] | undefined;
          let simulationBreakdown: any = null;
          let competitorResponse: any = null;
          let eventImpacts: any = null;
          let engineVersion: string;

          if (useV2Engine) {
            const previousResult = await storage.getPreviousRoundResult(team.id, roundId);
            const prevCompetitor = previousResult?.competitorResponse as { referencePrice?: number; referencePromoSpend?: number } | null;

            const simInputs: SimulationInputs = {
              marketingMix,
              marketEvents: activeEvents,
              teamBudget: team.budget,
              totalTeamsInRound: teams.length,
              previousRoundData: previousResult ? {
                teamPrice: prevCompetitor?.referencePrice,
                teamPromoSpend: prevCompetitor?.referencePromoSpend,
                competitorPrice: prevCompetitor?.referencePrice,
                competitorPromoSpend: prevCompetitor?.referencePromoSpend,
                teamMarketShare: previousResult.marketShare,
              } : undefined,
              classData: {
                sector: classData.sector ?? undefined,
                businessType: classData.businessType ?? undefined,
                marketSize: classData.marketSize ?? undefined,
                marketGrowthRate: classData.marketGrowthRate ?? undefined,
                competitionLevel: classData.competitionLevel ?? undefined,
                numberOfCompetitors: classData.numberOfCompetitors ?? undefined,
              },
            };

            const simResult = computeRoundOutcome(simInputs);

            finalKPIs = {
              ...simResult.kpis,
              impostos: simResult.kpis.receitaBruta * 0.12,
              devolucoes: simResult.kpis.receitaBruta * 0.02,
              descontos: simResult.kpis.receitaBruta * 0.01,
              cpv: simResult.kpis.costs * 0.60,
              lucroBruto: simResult.kpis.receitaLiquida - simResult.kpis.costs * 0.60,
              despesasVendas: simResult.kpis.costs * 0.25,
              despesasAdmin: simResult.kpis.costs * 0.10,
              despesasFinanc: simResult.kpis.costs * 0.03,
              outrasDespesas: simResult.kpis.costs * 0.02,
              ebitda: simResult.kpis.profit * 1.15,
              depreciacao: team.budget * 0.03,
              lair: simResult.kpis.profit * 1.12,
              irCsll: Math.max(0, simResult.kpis.profit * 0.34),
              lucroLiquido: simResult.kpis.profit * 0.66,
              caixa: Math.max(0, team.budget * 0.25 + simResult.kpis.profit * 0.4),
              contasReceber: simResult.kpis.revenue * 0.15,
              estoques: simResult.kpis.costs * 0.20,
              ativoCirculante: 0,
              imobilizado: team.budget * 0.30,
              intangivel: team.budget * 0.10,
              ativoNaoCirculante: 0,
              ativoTotal: 0,
              fornecedores: simResult.kpis.costs * 0.20,
              obrigFiscais: simResult.kpis.profit > 0 ? simResult.kpis.profit * 0.34 : 0,
              outrasObrig: simResult.kpis.costs * 0.10,
              passivoCirculante: 0,
              financiamentosLP: team.budget * 0.20,
              passivoNaoCirculante: 0,
              capitalSocial: team.budget * 0.50,
              lucrosAcumulados: 0,
              patrimonioLiquido: 0,
              passivoPlTotal: 0,
            };

            finalKPIs.ativoCirculante = finalKPIs.caixa + finalKPIs.contasReceber + finalKPIs.estoques;
            finalKPIs.ativoNaoCirculante = finalKPIs.imobilizado + finalKPIs.intangivel;
            finalKPIs.ativoTotal = finalKPIs.ativoCirculante + finalKPIs.ativoNaoCirculante;
            finalKPIs.passivoCirculante = finalKPIs.fornecedores + finalKPIs.obrigFiscais + finalKPIs.outrasObrig;
            finalKPIs.passivoNaoCirculante = finalKPIs.financiamentosLP;
            finalKPIs.lucrosAcumulados = finalKPIs.ativoTotal - finalKPIs.passivoCirculante - finalKPIs.passivoNaoCirculante - finalKPIs.capitalSocial;
            finalKPIs.patrimonioLiquido = finalKPIs.capitalSocial + finalKPIs.lucrosAcumulados;
            finalKPIs.passivoPlTotal = finalKPIs.passivoCirculante + finalKPIs.passivoNaoCirculante + finalKPIs.patrimonioLiquido;

            simulationBreakdown = simResult.breakdown;
            competitorResponse = simResult.competitorResponse;
            eventImpacts = simResult.eventImpacts;
            engineVersion = "v2";

            console.log(`[ROUND_COMPLETION] V2 Engine breakdown for team ${team.id}:`, 
              simResult.breakdown.map(b => `${b.label}: ΔRev=${b.deltaRevenue}, ΔProfit=${b.deltaProfit}`).join("; "));
          } else {
            const baseKPIs = calculateResults({
              marketingMix,
              marketEvents: activeEvents,
              teamBudget: team.budget,
              totalTeamsInRound: teams.length,
            });

            const analyses = {
              swot: swot || null,
              porter: porter || null,
              bcg: bcg.length > 0 ? bcg : null,
              pestel: pestel || null,
            };

            const adjustedKPIs = applyStrategicImpacts(baseKPIs, analyses, marketingMix.priceValue);

            const penaltyResult = applyAlignmentPenalties(
              adjustedKPIs,
              marketingMix,
              swot,
              porter,
              bcg.length > 0 ? bcg[0] : null,
              pestel,
              round.aiAssistanceLevel ?? 1,
              marketingMix.priceValue
            );

            finalKPIs = penaltyResult.kpis;
            alignmentScore = penaltyResult.alignmentScore;
            alignmentIssues = penaltyResult.alignmentIssues;
            engineVersion = "v1";
          }

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
            simulationBreakdown,
            competitorResponse,
            eventImpacts,
            engineVersion,
          });

          await storage.updateTeam(team.id, { budget: budgetAfter });

          console.log(`[ROUND_COMPLETION] Processed results for team ${team.id} (engine: ${engineVersion})`);
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
