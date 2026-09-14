import type { IStorage } from "../storage";
import type { MarketingMix } from "@shared/schema";
import { calculateResults, calculateMarketingSpend, applyStrategicImpacts, applyAlignmentPenalties, applyEquityCarryover } from "../calculator";
import { computeRoundOutcome, type SimulationInputs } from "../simulation/marketEngine";
import { consolidateKpis, type ResultCoreMetrics } from "../utils/consolidateKpis";
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
  // Grupo D (auditoria de 2026-09): "reivindica" a rodada com um UPDATE
  // atômico condicional (status "active" -> "completed") ANTES de gerar
  // qualquer evento de mercado ou resultado. Isso fecha a janela de corrida
  // entre um duplo clique do professor em "Encerrar Rodada" e/ou o scheduler
  // automático (roundScheduler.ts) tentando encerrar a mesma rodada quase ao
  // mesmo tempo — antes, ambos liam status "active", ambos geravam seu
  // próprio conjunto de eventos de mercado (duplicados) e só a gravação final
  // do status era feita por último. Agora só quem vence a corrida do UPDATE
  // atômico processa a rodada; o outro recebe undefined e sai sem duplicar
  // nada. Também impede processar uma rodada "locked" (nunca iniciada) —
  // antes só "completed" era filtrado.
  const claimedRound = await storage.claimRoundForCompletion(roundId);
  if (!claimedRound) {
    const existing = await storage.getRound(roundId);
    if (!existing) {
      return { success: false, error: "Rodada não encontrada" };
    }
    if (existing.status === "completed") {
      console.log(`[ROUND_COMPLETION] Round ${roundId} already completed, skipping`);
      return { success: true };
    }
    return { success: false, error: "Rodada não está ativa" };
  }

  const round = claimedRound;

  try {
    const classData = await storage.getClass(round.classId);
    if (!classData) {
      // Não há como processar sem a turma — desfaz a reivindicação para que
      // uma tentativa futura (após o problema ser corrigido) possa repetir.
      await storage.updateRound(roundId, { status: "active", endedAt: null });
      return { success: false, error: "Turma não encontrada" };
    }

    console.log(`[ROUND_COMPLETION] Processing completion for round ${roundId}`);

    const autoEventConfig = await storage.getAutoEventConfig(round.classId);

    // Grupo D (auditoria de 2026-09): a geração automática de eventos não
    // era idempotente — se processRoundCompletion falhasse no meio do
    // processamento das equipes (depois de já ter gerado os eventos) e
    // fosse chamada de novo (professor tentando encerrar a rodada outra
    // vez), um novo lote de eventos era gerado por cima do anterior,
    // duplicando os eventos de mercado da rodada. Agora só gera eventos se
    // a rodada ainda não tiver nenhum — numa nova tentativa, reaproveita os
    // que já existem em vez de gerar outro lote.
    const existingEventsForRound = await storage.getMarketEventsByRound(roundId);

    if (autoEventConfig?.enabled && existingEventsForRound.length === 0) {
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
        // Bug corrigido aqui (Item 2 da auditoria): antes buscava um único
        // getMarketingMix(team.id, roundId) — que faz SELECT ... LIMIT 1 sem
        // ORDER BY (pg-storage.ts) — então equipes com mais de um produto na
        // rodada tinham só um produto (escolhido arbitrariamente pelo banco)
        // processado no fechamento, e os demais eram ignorados. Agora busca
        // TODOS os mixes submetidos da equipe e processa cada produto,
        // igual ao padrão já usado (e testado) no endpoint manual do
        // professor POST /api/rounds/:roundId/process.
        const allMixes = await storage.getMarketingMixesByTeamAndRound(team.id, roundId);
        const submittedProducts = allMixes.filter(mix => mix.submittedAt !== null);

        if (submittedProducts.length > 0) {
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

          // Orçamento-base de cada produto: para o caso de 1 produto só
          // (o cenário mais comum, já em produção), mantém exatamente o
          // comportamento anterior (teamBudget = team.budget) para não
          // mudar o resultado de nenhuma equipe existente. Para 2+
          // produtos — caso que hoje está quebrado — usa o custo estimado
          // de cada decisão (ou o cálculo de fallback), igual ao endpoint
          // /process já testado.
          const productBudget = (mix: MarketingMix): number =>
            submittedProducts.length === 1
              ? team.budget
              : (mix.estimatedCost || calculateMarketingSpend(mix));

          const firstProduct = submittedProducts[0];
          const productKpisList: ResultCoreMetrics[] = [];

          // Item 4 da auditoria: capital social fixo desde a criação da
          // equipe (nunca recalculado a cada rodada) e lucros acumulados
          // de verdade, carregando o valor fechado na rodada anterior —
          // ver applyEquityCarryover em calculator.ts.
          const previousResult = await storage.getPreviousRoundResult(team.id, roundId);
          const capitalSocialFixo = team.initialBudget * 0.50;
          const previousAccumulatedProfits = previousResult?.lucrosAcumulados ?? 0;

          let finalKPIs: any;
          let alignmentScore: number | undefined;
          let alignmentIssues: string[] | undefined;
          let simulationBreakdown: any = null;
          let competitorResponse: any = null;
          let eventImpacts: any = null;
          let engineVersion: string;

          if (useV2Engine) {
            const prevCompetitor = previousResult?.competitorResponse as { referencePrice?: number; referencePromoSpend?: number } | null;
            const perProductSim: { productId: string; breakdown: any; competitorResponse: any; eventImpacts: any }[] = [];
            let totalProductBudgetV2 = 0;

            for (const productMix of submittedProducts) {
              const budget = productBudget(productMix);
              totalProductBudgetV2 += budget;

              const simInputs: SimulationInputs = {
                marketingMix: productMix,
                marketEvents: activeEvents,
                teamBudget: budget,
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

              const productKPIs: any = {
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
                depreciacao: budget * 0.03,
                lair: simResult.kpis.profit * 1.12,
                irCsll: Math.max(0, simResult.kpis.profit * 0.34),
                lucroLiquido: simResult.kpis.profit * 0.66,
                caixa: Math.max(0, budget * 0.25 + simResult.kpis.profit * 0.4),
                contasReceber: simResult.kpis.revenue * 0.15,
                estoques: simResult.kpis.costs * 0.20,
                ativoCirculante: 0,
                imobilizado: budget * 0.30,
                intangivel: budget * 0.10,
                ativoNaoCirculante: 0,
                ativoTotal: 0,
                fornecedores: simResult.kpis.costs * 0.20,
                obrigFiscais: simResult.kpis.profit > 0 ? simResult.kpis.profit * 0.34 : 0,
                outrasObrig: simResult.kpis.costs * 0.10,
                passivoCirculante: 0,
                financiamentosLP: budget * 0.20,
                passivoNaoCirculante: 0,
                capitalSocial: budget * 0.50,
                lucrosAcumulados: 0,
                patrimonioLiquido: 0,
                passivoPlTotal: 0,
              };

              productKPIs.ativoCirculante = productKPIs.caixa + productKPIs.contasReceber + productKPIs.estoques;
              productKPIs.ativoNaoCirculante = productKPIs.imobilizado + productKPIs.intangivel;
              productKPIs.ativoTotal = productKPIs.ativoCirculante + productKPIs.ativoNaoCirculante;
              productKPIs.passivoCirculante = productKPIs.fornecedores + productKPIs.obrigFiscais + productKPIs.outrasObrig;
              productKPIs.passivoNaoCirculante = productKPIs.financiamentosLP;
              productKPIs.lucrosAcumulados = productKPIs.ativoTotal - productKPIs.passivoCirculante - productKPIs.passivoNaoCirculante - productKPIs.capitalSocial;
              productKPIs.patrimonioLiquido = productKPIs.capitalSocial + productKPIs.lucrosAcumulados;
              productKPIs.passivoPlTotal = productKPIs.passivoCirculante + productKPIs.passivoNaoCirculante + productKPIs.patrimonioLiquido;

              productKpisList.push(productKPIs);
              perProductSim.push({
                productId: productMix.productId ?? "default",
                breakdown: simResult.breakdown,
                competitorResponse: simResult.competitorResponse,
                eventImpacts: simResult.eventImpacts,
              });

              await storage.createProductResult({
                teamId: team.id,
                roundId: roundId,
                productId: productMix.productId ?? "default",
                ...productKPIs,
                budgetBefore: budget,
                profitImpact: productKPIs.profit,
                budgetAfter: budget + productKPIs.profit,
                alignmentScore: null,
                alignmentIssues: [],
                financialBreakdown: simResult.breakdown,
              });

              console.log(`[ROUND_COMPLETION] V2 Engine breakdown for team ${team.id} produto ${productMix.productId ?? "default"}:`,
                simResult.breakdown.map(b => `${b.label}: ΔRev=${b.deltaRevenue}, ΔProfit=${b.deltaProfit}`).join("; "));
            }

            const consolidated = applyEquityCarryover(
              consolidateKpis(productKpisList),
              capitalSocialFixo,
              previousAccumulatedProfits
            );

            const penaltyResult = applyAlignmentPenalties(
              consolidated,
              firstProduct,
              swot,
              porter,
              bcg.length > 0 ? bcg[0] : null,
              pestel,
              round.aiAssistanceLevel ?? 1,
              firstProduct.priceValue,
              totalProductBudgetV2
            );

            alignmentScore = penaltyResult.alignmentScore;
            alignmentIssues = penaltyResult.alignmentIssues;
            simulationBreakdown = perProductSim.map(p => ({ productId: p.productId, breakdown: p.breakdown }));
            competitorResponse = perProductSim.map(p => ({ productId: p.productId, competitorResponse: p.competitorResponse }));
            eventImpacts = perProductSim.map(p => ({ productId: p.productId, eventImpacts: p.eventImpacts }));
            engineVersion = "v2";
            finalKPIs = penaltyResult.kpis;
          } else {
            let totalProductBudget = 0;

            for (const productMix of submittedProducts) {
              const budget = productBudget(productMix);
              totalProductBudget += budget;

              const baseKPIs = calculateResults({
                marketingMix: productMix,
                marketEvents: activeEvents,
                teamBudget: budget,
                totalTeamsInRound: teams.length,
              });

              const adjustedKPIs = applyStrategicImpacts(baseKPIs, analyses, productMix.priceValue, budget);
              productKpisList.push(adjustedKPIs);

              await storage.createProductResult({
                teamId: team.id,
                roundId: roundId,
                productId: productMix.productId ?? "default",
                ...adjustedKPIs,
                budgetBefore: budget,
                profitImpact: adjustedKPIs.profit,
                budgetAfter: budget + adjustedKPIs.profit,
                alignmentScore: null,
                alignmentIssues: [],
              });
            }

            // Grupo A (auditoria de 2026-09) — item 1: applyEquityCarryover
            // agora é chamado DEPOIS de applyAlignmentPenalties (não antes),
            // para que capitalSocial/lucrosAcumulados/caixa/ativoTotal do
            // resultado final reflitam o lucroLiquido e o balanço JÁ
            // ajustados pelo alinhamento estratégico, e não o valor de
            // antes desse ajuste (ver comentários em calculator.ts).
            const penaltyResult = applyAlignmentPenalties(
              consolidateKpis(productKpisList),
              firstProduct,
              swot,
              porter,
              bcg.length > 0 ? bcg[0] : null,
              pestel,
              round.aiAssistanceLevel ?? 1,
              firstProduct.priceValue,
              totalProductBudget
            );

            const consolidatedKPIs = applyEquityCarryover(
              penaltyResult.kpis,
              capitalSocialFixo,
              previousAccumulatedProfits
            );

            alignmentScore = penaltyResult.alignmentScore;
            alignmentIssues = penaltyResult.alignmentIssues;
            engineVersion = "v1";
            finalKPIs = consolidatedKPIs;
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

          console.log(`[ROUND_COMPLETION] Processed results for team ${team.id} (engine: ${engineVersion}, produtos: ${submittedProducts.length})`);
        }
      }
    }

    // Status e endedAt já foram gravados atomicamente no claim, no início
    // desta função — nada a fazer aqui além de confirmar no log.
    console.log(`[ROUND_COMPLETION] Round ${roundId} completed successfully`);
    return { success: true };
  } catch (error: any) {
    console.error(`[ROUND_COMPLETION] ERROR processing round ${roundId}:`, error);
    // Desfaz a reivindicação: a rodada volta a "active" para que uma nova
    // tentativa de encerramento seja possível, em vez de ficar presa como
    // "completed" sem resultados de fato processados.
    try {
      await storage.updateRound(roundId, { status: "active", endedAt: null });
    } catch (rollbackError) {
      console.error(`[ROUND_COMPLETION] Falha ao reverter status da rodada ${roundId} após erro:`, rollbackError);
    }
    return { success: false, error: error.message || "Erro ao processar encerramento" };
  }
}
