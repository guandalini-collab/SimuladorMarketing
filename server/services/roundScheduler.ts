import type { IStorage } from "../storage";
import { processRoundCompletion } from "./roundCompletion";
import { autoGenerateMinimalAnalysesForAllTeams } from "./autoStrategicGeneration";

export class RoundScheduler {
  private storage: IStorage;
  private isProcessing: boolean = false;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async checkScheduledRounds(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const now = new Date();
      
      await this.processScheduledStarts(now);
      await this.processScheduledEnds(now);
    } catch (error) {
      console.error("[ROUND_SCHEDULER] Erro ao processar rodadas agendadas:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processScheduledStarts(now: Date): Promise<void> {
    try {
      const allRounds = await this.storage.getAllRounds();
      
      const roundsToStart = allRounds.filter(round => 
        round.status === "locked" &&
        round.scheduledStartAt &&
        new Date(round.scheduledStartAt) <= now &&
        !round.startedAt
      );

      for (const round of roundsToStart) {
        console.log(`[ROUND_SCHEDULER] Ativando rodada ${round.id} (Round ${round.roundNumber})`);
        
        await this.storage.updateRound(round.id, {
          status: "active",
          startedAt: new Date(),
        });

        const classData = await this.storage.getClass(round.classId);
        if (classData && classData.currentRound < round.roundNumber) {
          await this.storage.updateClass(round.classId, {
            currentRound: round.roundNumber,
          });
        }

        console.log(`[ROUND_SCHEDULER] Rodada ${round.id} ativada com sucesso`);

        if (round.roundNumber <= 3) {
          console.log(`[ROUND_SCHEDULER] Gerando análises estratégicas automáticas para rodada ${round.roundNumber}...`);
          try {
            const result = await autoGenerateMinimalAnalysesForAllTeams(this.storage, round.id);
            console.log(`[ROUND_SCHEDULER] Análises geradas: ${result.successCount}/${result.totalTeams} equipes`);
          } catch (error) {
            console.error(`[ROUND_SCHEDULER] Erro ao gerar análises automáticas para rodada ${round.id}:`, error);
          }
        } else {
          console.log(`[ROUND_SCHEDULER] Rodada ${round.roundNumber}: sem geração automática (rodada ≥ 4)`);
        }
      }
    } catch (error) {
      console.error("[ROUND_SCHEDULER] Erro ao processar inícios agendados:", error);
    }
  }

  private async processScheduledEnds(now: Date): Promise<void> {
    try {
      const allRounds = await this.storage.getAllRounds();
      
      const roundsToEnd = allRounds.filter(round =>
        round.status === "active" &&
        round.scheduledEndAt &&
        new Date(round.scheduledEndAt) <= now &&
        !round.endedAt
      );

      for (const round of roundsToEnd) {
        console.log(`[ROUND_SCHEDULER] Encerrando rodada ${round.id} (Round ${round.roundNumber})`);
        
        try {
          await this.endRound(round.id);
          console.log(`[ROUND_SCHEDULER] Rodada ${round.id} encerrada com sucesso`);
        } catch (error) {
          console.error(`[ROUND_SCHEDULER] Erro ao encerrar rodada ${round.id}:`, error);
        }
      }
    } catch (error) {
      console.error("[ROUND_SCHEDULER] Erro ao processar encerramentos agendados:", error);
    }
  }

  private async endRound(roundId: string): Promise<void> {
    const result = await processRoundCompletion(this.storage, roundId);
    
    if (!result.success) {
      throw new Error(result.error || "Erro ao processar encerramento");
    }
  }

  startScheduler(intervalMs: number = 60000): NodeJS.Timeout {
    console.log(`[ROUND_SCHEDULER] Iniciando scheduler com intervalo de ${intervalMs}ms (${intervalMs / 1000}s)`);
    
    this.checkScheduledRounds();
    
    return setInterval(() => {
      this.checkScheduledRounds();
    }, intervalMs);
  }
}

export function createRoundScheduler(storage: IStorage): RoundScheduler {
  return new RoundScheduler(storage);
}
