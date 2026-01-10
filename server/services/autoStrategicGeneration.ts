import type { IStorage } from "../storage";
import { generateMinimalStrategicAnalyses } from "./aiStrategy";

export interface AutoGenerationResult {
  success: boolean;
  teamId: string;
  teamName: string;
  error?: string;
}

export async function autoGenerateMinimalAnalysesForAllTeams(
  storage: IStorage,
  roundId: string
): Promise<{ success: boolean; results: AutoGenerationResult[]; totalTeams: number; successCount: number }> {
  try {
    const round = await storage.getRound(roundId);
    if (!round) {
      throw new Error("Rodada não encontrada");
    }

    const classData = await storage.getClass(round.classId);
    if (!classData) {
      throw new Error("Turma não encontrada");
    }

    const teams = await storage.getTeamsByClass(round.classId);
    if (teams.length === 0) {
      console.log(`[AUTO-GEN] Nenhuma equipe encontrada para rodada ${roundId}`);
      return {
        success: true,
        results: [],
        totalTeams: 0,
        successCount: 0,
      };
    }

    console.log(`[AUTO-GEN] Iniciando geração automática para ${teams.length} equipes na rodada ${round.roundNumber}`);

    const results: AutoGenerationResult[] = [];
    let successCount = 0;
    let skippedCount = 0;

    for (const team of teams) {
      try {
        // Verificar se já existe análises para evitar sobreescrever
        const existingSwot = await storage.getSwotAnalysis(team.id, round.id);
        const existingPorter = await storage.getPorterAnalysis(team.id, round.id);
        const existingPestel = await storage.getPestelAnalysis(team.id, round.id);
        const existingBcg = await storage.getBcgAnalyses(team.id, round.id);

        // Se já tem análises completas, pular (não conta como sucesso de geração)
        if (existingSwot && existingPorter && existingPestel && existingBcg.length > 0) {
          console.log(`[AUTO-GEN] Equipe ${team.name} já possui análises - pulando`);
          results.push({
            success: true,
            teamId: team.id,
            teamName: team.name,
            error: "Pulado - já possui análises",
          });
          skippedCount++;
          continue;
        }

        // Gerar análises mínimas via IA
        console.log(`[AUTO-GEN] Gerando análises mínimas para equipe: ${team.name}`);
        const analyses = await generateMinimalStrategicAnalyses({
          classData,
          teamData: team,
          roundNumber: round.roundNumber,
        });

        // Salvar SWOT
        if (!existingSwot) {
          const originalSwot = {
            strengths: analyses.swot.strengths,
            weaknesses: analyses.swot.weaknesses,
            opportunities: analyses.swot.opportunities,
            threats: analyses.swot.threats,
          };

          await storage.createSwotAnalysis({
            teamId: team.id,
            roundId: round.id,
            strengths: analyses.swot.strengths,
            weaknesses: analyses.swot.weaknesses,
            opportunities: analyses.swot.opportunities,
            threats: analyses.swot.threats,
            aiGeneratedPercentage: 100,
            originalAIContent: originalSwot,
            editedByUser: false,
          });
          console.log(`[AUTO-GEN] SWOT criada para ${team.name}`);
        }

        // Salvar Porter
        if (!existingPorter) {
          const originalPorter = {
            competitiveRivalry: analyses.porter.competitiveRivalry,
            supplierPower: analyses.porter.supplierPower,
            buyerPower: analyses.porter.buyerPower,
            threatOfSubstitutes: analyses.porter.threatOfSubstitutes,
            threatOfNewEntry: analyses.porter.threatOfNewEntry,
            rivalryNotes: analyses.porter.rivalryNotes,
            supplierNotes: analyses.porter.supplierNotes,
            buyerNotes: analyses.porter.buyerNotes,
            substitutesNotes: analyses.porter.substitutesNotes,
            newEntryNotes: analyses.porter.newEntryNotes,
          };

          await storage.createPorterAnalysis({
            teamId: team.id,
            roundId: round.id,
            ...analyses.porter,
            aiGeneratedPercentage: 100,
            originalAIContent: originalPorter,
            editedByUser: false,
          });
          console.log(`[AUTO-GEN] Porter criada para ${team.name}`);
        }

        // Salvar BCG (apenas primeiro produto)
        if (existingBcg.length === 0 && analyses.bcg.length > 0) {
          const bcgItem = analyses.bcg[0];
          const originalBcg = {
            productName: bcgItem.productName,
            marketGrowth: bcgItem.marketGrowth,
            relativeMarketShare: bcgItem.relativeMarketShare,
            quadrant: bcgItem.quadrant,
            notes: bcgItem.notes,
          };

          await storage.createBcgAnalysis({
            teamId: team.id,
            roundId: round.id,
            productName: bcgItem.productName,
            marketGrowth: bcgItem.marketGrowth,
            relativeMarketShare: bcgItem.relativeMarketShare,
            quadrant: bcgItem.quadrant,
            notes: bcgItem.notes || "",
            aiGeneratedPercentage: 100,
            originalAIContent: originalBcg,
            editedByUser: false,
          });
          console.log(`[AUTO-GEN] BCG criada para ${team.name}`);
        }

        // Salvar PESTEL
        if (!existingPestel) {
          const originalPestel = {
            political: analyses.pestel.political,
            economic: analyses.pestel.economic,
            social: analyses.pestel.social,
            technological: analyses.pestel.technological,
            environmental: analyses.pestel.environmental,
            legal: analyses.pestel.legal,
          };

          await storage.createPestelAnalysis({
            teamId: team.id,
            roundId: round.id,
            political: analyses.pestel.political,
            economic: analyses.pestel.economic,
            social: analyses.pestel.social,
            technological: analyses.pestel.technological,
            environmental: analyses.pestel.environmental,
            legal: analyses.pestel.legal,
            aiGeneratedPercentage: 100,
            originalAIContent: originalPestel,
            editedByUser: false,
          });
          console.log(`[AUTO-GEN] PESTEL criada para ${team.name}`);
        }

        results.push({
          success: true,
          teamId: team.id,
          teamName: team.name,
        });
        successCount++;

        console.log(`[AUTO-GEN] ✓ Análises mínimas geradas com sucesso para ${team.name}`);
      } catch (error: any) {
        console.error(`[AUTO-GEN] Erro ao gerar análises para equipe ${team.name}:`, error);
        results.push({
          success: false,
          teamId: team.id,
          teamName: team.name,
          error: error.message || "Erro desconhecido",
        });
      }
    }

    const generatedCount = successCount;
    const totalProcessed = successCount + skippedCount;
    
    console.log(`[AUTO-GEN] Concluído: ${generatedCount} geradas, ${skippedCount} puladas de ${teams.length} equipes`);

    return {
      success: generatedCount > 0,
      results,
      totalTeams: teams.length,
      successCount: generatedCount,
    };
  } catch (error: any) {
    console.error("[AUTO-GEN] Erro geral na geração automática:", error);
    throw error;
  }
}
