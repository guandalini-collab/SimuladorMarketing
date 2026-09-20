import type { IStorage } from "../storage";
import { processRoundCompletion } from "./roundCompletion";
import { autoGenerateMinimalAnalysesForAllTeams } from "./autoStrategicGeneration";
import { carryForwardStrategyAnalyses } from "./strategyCarryForward";

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
        // Grupo D (auditoria de 2026-09): antes, ativava a rodada agendada
        // sem checar se a turma já tinha outra rodada "active" — duas
        // rodadas agendadas para o mesmo horário (ou próximo de), ou um
        // agendamento coincidindo com o professor ainda não ter encerrado a
        // rodada anterior, deixavam a turma com DUAS rodadas ativas ao
        // mesmo tempo, quebrando getCurrentRound() (SELECT ... LIMIT 1,
        // resultado arbitrário) e qualquer tela que assume no máximo uma
        // rodada ativa por turma.
        //
        // Auditoria (2026-09, segunda rodada): essa checagem "ler depois
        // gravar" continua não sendo atômica — o professor pode iniciar uma
        // rodada manualmente (POST /api/rounds/:classId/start) no exato
        // instante entre a leitura acima e o updateRound abaixo. Por isso
        // todo o corpo do loop agora fica em try/catch: o índice único
        // parcial "rounds_unique_active_per_class" (ver
        // ensureRoundsActiveUniqueIndex.ts) garante a atomicidade real a
        // nível de banco, e aqui só tratamos o conflito (23505) resultante
        // como um aviso — sem derrubar o processamento das demais rodadas
        // agendadas nesta mesma execução do scheduler.
        try {
          const currentActive = await this.storage.getCurrentRound(round.classId);
          if (currentActive && currentActive.id !== round.id) {
            console.warn(`[ROUND_SCHEDULER] Rodada ${round.id} (Round ${round.roundNumber}) não ativada: turma ${round.classId} já tem a rodada ${currentActive.id} ativa`);
            continue;
          }

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

          if (round.roundNumber === 1) {
            console.log(`[ROUND_SCHEDULER] Gerando análises estratégicas automáticas para rodada ${round.roundNumber}...`);
            try {
              const result = await autoGenerateMinimalAnalysesForAllTeams(this.storage, round.id);
              console.log(`[ROUND_SCHEDULER] Análises geradas: ${result.successCount}/${result.totalTeams} equipes`);
            } catch (error) {
              console.error(`[ROUND_SCHEDULER] Erro ao gerar análises automáticas para rodada ${round.id}:`, error);
            }
          } else {
            // Pedido do professor (2026-09): a partir da Rodada 2, em vez de a
            // IA gerar uma sugestão nova (ou a tela começar em branco), a
            // análise que a equipe deixou salva na rodada anterior passa a
            // valer automaticamente nesta rodada — a equipe só mexe se
            // quiser editar, excluir ou acrescentar algo novo.
            console.log(`[ROUND_SCHEDULER] Herdando análises estratégicas da rodada anterior para a rodada ${round.roundNumber}...`);
            try {
              const result = await carryForwardStrategyAnalyses(this.storage, round.id);
              console.log(`[ROUND_SCHEDULER] Análises herdadas: ${result.carriedCount}/${result.totalTeams} equipes`);
            } catch (error) {
              console.error(`[ROUND_SCHEDULER] Erro ao herdar análises estratégicas para rodada ${round.id}:`, error);
            }
          }
        } catch (error: any) {
          if (error?.code === "23505") {
            console.warn(`[ROUND_SCHEDULER] Rodada ${round.id} (Round ${round.roundNumber}) não ativada: outra rodada da turma ${round.classId} foi ativada concorrentemente (conflito de índice único)`);
          } else {
            console.error(`[ROUND_SCHEDULER] Erro ao ativar rodada ${round.id}:`, error);
          }
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
