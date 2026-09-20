import type { IStorage } from "../storage";

export interface CarryForwardTeamResult {
  teamId: string;
  teamName: string;
  carried: boolean;
  reason?: string;
}

export interface CarryForwardResult {
  success: boolean;
  totalTeams: number;
  carriedCount: number;
  results: CarryForwardTeamResult[];
}

/**
 * Herda, para a rodada que está começando, a análise estratégica (SWOT,
 * Porter, BCG, PESTEL e Segmentação de Mercado) que a equipe deixou salva
 * na rodada anterior —
 * pedido do professor (2026-09): a equipe preenche as análises na primeira
 * rodada e, se continuar achando que estão corretas, não precisa reescrever
 * nada nas rodadas seguintes; só mexe se quiser editar, excluir ou
 * acrescentar algo novo.
 *
 * Importante: isto CRIA uma cópia própria da rodada atual (uma nova linha,
 * com o roundId desta rodada) em vez de reaproveitar a linha da rodada
 * anterior. Isso preserva o histórico — a rodada anterior continua exibindo
 * exatamente o que a equipe tinha registrado nela — e faz com que editar ou
 * excluir algo nesta rodada nunca toque nos dados de uma rodada já
 * encerrada. Também é o que garante que o cálculo de alinhamento
 * estratégico no fechamento da rodada (roundCompletion.ts, que busca a
 * análise pelo roundId exato) sempre encontre algo para comparar com o mix
 * de marketing praticado, mesmo quando a equipe não mexeu em nada.
 *
 * Só copia o que ainda não existe: se a equipe já salvou algo diretamente
 * nesta rodada (por exemplo, por causa de um reprocessamento do mesmo
 * início de rodada), essa análise já salva não é sobrescrita.
 *
 * Não gera nada novo via IA — isso é papel exclusivo de
 * autoStrategicGeneration.ts, usado apenas na Rodada 1. Se a equipe nunca
 * teve nenhuma análise (nem a rodada anterior tinha), esta função
 * simplesmente não copia nada, e a tela de Estratégia mostra o aviso normal
 * de "preencha sua análise".
 */
export async function carryForwardStrategyAnalyses(
  storage: IStorage,
  roundId: string
): Promise<CarryForwardResult> {
  const round = await storage.getRound(roundId);
  if (!round) {
    throw new Error("Rodada não encontrada");
  }

  // Não há rodada anterior para herdar na Rodada 1 — ela é semeada pela IA
  // (autoStrategicGeneration.ts) ou preenchida do zero pela própria equipe.
  if (round.roundNumber <= 1) {
    return { success: true, totalTeams: 0, carriedCount: 0, results: [] };
  }

  const roundsOfClass = await storage.getRoundsByClass(round.classId);
  const previousRound = roundsOfClass.find(r => r.roundNumber === round.roundNumber - 1);
  if (!previousRound) {
    return { success: true, totalTeams: 0, carriedCount: 0, results: [] };
  }

  const teams = await storage.getTeamsByClass(round.classId);
  const results: CarryForwardTeamResult[] = [];
  let carriedCount = 0;

  for (const team of teams) {
    try {
      const [existingSwot, existingPorter, existingPestel, existingBcg] = await Promise.all([
        storage.getSwotAnalysis(team.id, round.id),
        storage.getPorterAnalysis(team.id, round.id),
        storage.getPestelAnalysis(team.id, round.id),
        storage.getBcgAnalyses(team.id, round.id),
      ]);

      const [prevSwot, prevPorter, prevPestel, prevBcg] = await Promise.all([
        storage.getSwotAnalysis(team.id, previousRound.id),
        storage.getPorterAnalysis(team.id, previousRound.id),
        storage.getPestelAnalysis(team.id, previousRound.id),
        storage.getBcgAnalyses(team.id, previousRound.id),
      ]);

      let carriedAny = false;

      if (!existingSwot && prevSwot) {
        await storage.createSwotAnalysis({
          teamId: team.id,
          roundId: round.id,
          productId: prevSwot.productId,
          strengths: prevSwot.strengths,
          weaknesses: prevSwot.weaknesses,
          opportunities: prevSwot.opportunities,
          threats: prevSwot.threats,
          aiGeneratedPercentage: prevSwot.aiGeneratedPercentage,
          originalAIContent: prevSwot.originalAIContent as any,
          editedByUser: prevSwot.editedByUser,
        });
        carriedAny = true;
      }

      if (!existingPorter && prevPorter) {
        await storage.createPorterAnalysis({
          teamId: team.id,
          roundId: round.id,
          productId: prevPorter.productId,
          competitiveRivalry: prevPorter.competitiveRivalry,
          supplierPower: prevPorter.supplierPower,
          buyerPower: prevPorter.buyerPower,
          threatOfSubstitutes: prevPorter.threatOfSubstitutes,
          threatOfNewEntry: prevPorter.threatOfNewEntry,
          rivalryNotes: prevPorter.rivalryNotes,
          supplierNotes: prevPorter.supplierNotes,
          buyerNotes: prevPorter.buyerNotes,
          substitutesNotes: prevPorter.substitutesNotes,
          newEntryNotes: prevPorter.newEntryNotes,
          aiGeneratedPercentage: prevPorter.aiGeneratedPercentage,
          originalAIContent: prevPorter.originalAIContent as any,
          editedByUser: prevPorter.editedByUser,
        });
        carriedAny = true;
      }

      if (!existingPestel && prevPestel) {
        await storage.createPestelAnalysis({
          teamId: team.id,
          roundId: round.id,
          productId: prevPestel.productId,
          political: prevPestel.political,
          economic: prevPestel.economic,
          social: prevPestel.social,
          technological: prevPestel.technological,
          environmental: prevPestel.environmental,
          legal: prevPestel.legal,
          aiGeneratedPercentage: prevPestel.aiGeneratedPercentage,
          originalAIContent: prevPestel.originalAIContent as any,
          editedByUser: prevPestel.editedByUser,
        });
        carriedAny = true;
      }

      if (existingBcg.length === 0 && prevBcg.length > 0) {
        for (const item of prevBcg) {
          await storage.createBcgAnalysis({
            teamId: team.id,
            roundId: round.id,
            productId: item.productId,
            productName: item.productName,
            marketGrowth: item.marketGrowth,
            relativeMarketShare: item.relativeMarketShare,
            quadrant: item.quadrant,
            notes: item.notes,
            aiGeneratedPercentage: item.aiGeneratedPercentage,
            originalAIContent: item.originalAIContent as any,
            editedByUser: item.editedByUser,
          });
        }
        carriedAny = true;
      }

      // Segmentação de Mercado (5ª ferramenta, pedido do professor 2026-09):
      // mesma lógica das outras 4, mas pode existir mais de uma linha por
      // equipe/rodada (uma "b2c" e uma "b2b", para turmas híbridas) — copia
      // cada linha da rodada anterior que ainda não tenha equivalente
      // (mesmo segmentType) na rodada atual.
      const existingSegmentations = await storage.getMarketSegmentationsByTeamAndRound(team.id, round.id);
      const prevSegmentations = await storage.getMarketSegmentationsByTeamAndRound(team.id, previousRound.id);
      const existingSegmentTypes = new Set(existingSegmentations.map(s => s.segmentType));

      for (const prevSeg of prevSegmentations) {
        if (existingSegmentTypes.has(prevSeg.segmentType)) continue;
        await storage.createMarketSegmentation({
          teamId: team.id,
          roundId: round.id,
          productId: prevSeg.productId,
          segmentType: prevSeg.segmentType,
          demographic: prevSeg.demographic,
          geographic: prevSeg.geographic,
          psychographic: prevSeg.psychographic,
          behavioral: prevSeg.behavioral,
          firmographic: prevSeg.firmographic,
          buyingCenter: prevSeg.buyingCenter,
          aiGeneratedPercentage: prevSeg.aiGeneratedPercentage,
          originalAIContent: prevSeg.originalAIContent as any,
          editedByUser: prevSeg.editedByUser,
        });
        carriedAny = true;
      }

      results.push({ teamId: team.id, teamName: team.name, carried: carriedAny });
      if (carriedAny) carriedCount++;
    } catch (error: any) {
      console.error(`[STRATEGY-CARRY-FORWARD] Erro ao herdar análises para equipe ${team.name}:`, error);
      results.push({ teamId: team.id, teamName: team.name, carried: false, reason: error.message });
    }
  }

  return { success: true, totalTeams: teams.length, carriedCount, results };
}
