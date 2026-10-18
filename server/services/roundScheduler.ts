import type { IStorage } from "../storage";
import { processRoundCompletion } from "./roundCompletion";
import { autoGenerateMinimalAnalysesForAllTeams } from "./autoStrategicGeneration";
import { carryForwardStrategyAnalyses } from "./strategyCarryForward";
import { scheduleRoundOpenedAutomation, scheduleRoundPreparation } from "./roundAutomation";
import { anoLetivoEncerrado, preparacaoDaRodada } from "@shared/rodadaSemanal";
import { abrirRodadaBloqueada, comBloqueioDoAgendador } from "./transicaoDeRodada";
import { equipesForaDoTamanho, mensagemEquipesForaDoTamanho } from "@shared/tamanhoEquipe";

export class RoundScheduler {
  private storage: IStorage;
  private isProcessing: boolean = false;
  // Rodadas já preparadas pela IA neste processo (evita disparar de novo a
  // cada minuto). Após um reinício a preparação pode rodar outra vez, sem
  // problema: cada passo pula o que já existe.
  private preparadas = new Set<string>();
  // Rodadas cujo horário de fechamento passou antes de abrirem (avisadas
  // uma vez no log; o professor vê o aviso no painel).
  private expiradasAvisadas = new Set<string>();

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async checkScheduledRounds(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // Out/2026 (Grupo C): só um processo do app executa o agendador por
      // vez (durante uma publicação no Railway, o processo antigo e o novo
      // rodam juntos por alguns instantes).
      const executou = await comBloqueioDoAgendador(async () => {
        const now = new Date();
        await this.processScheduledPreparations(now);
        await this.processScheduledStarts(now);
        await this.processScheduledEnds(now);
      });
      if (!executou) {
        console.log("[ROUND_SCHEDULER] Outro processo está executando o agendador; esta verificação foi pulada.");
      }
    } catch (error) {
      console.error("[ROUND_SCHEDULER] Erro ao processar rodadas agendadas:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Rodadas semanais (out/2026): 30 minutos antes da abertura agendada
  // (20h20 para abertura às 20h50), dispara a preparação do conteúdo em
  // segundo plano — sem esperar a IA, para não atrasar a abertura.
  private async processScheduledPreparations(now: Date): Promise<void> {
    try {
      const allRounds = await this.storage.getAllRounds();
      for (const round of allRounds) {
        if (round.status !== "locked" || !round.scheduledStartAt || this.preparadas.has(round.id)) continue;
        const abertura = new Date(round.scheduledStartAt);
        if (now < preparacaoDaRodada(abertura) || now >= abertura) continue;
        const rodadasDaTurma = allRounds.filter((r) => r.classId === round.classId);
        if (anoLetivoEncerrado(rodadasDaTurma)) continue;
        this.preparadas.add(round.id);
        scheduleRoundPreparation(this.storage, round.id);
      }
    } catch (error) {
      console.error("[ROUND_SCHEDULER] Erro ao preparar rodadas agendadas:", error);
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

      // Out/2026 (Grupo C): se o site ficou fora do ar e voltou depois do
      // horário de FECHAMENTO, a rodada não é mais aberta (antes ela abria
      // e fechava no mesmo minuto, sem decisões das equipes). Ela fica
      // parada; o painel do professor mostra o aviso para reagendar.
      for (const round of roundsToStart) {
        if (round.scheduledEndAt && new Date(round.scheduledEndAt) <= now && !this.expiradasAvisadas.has(round.id)) {
          this.expiradasAvisadas.add(round.id);
          console.warn(`[ROUND_SCHEDULER] Rodada ${round.id} (Round ${round.roundNumber}) não aberta: o horário de fechamento já passou. Reagende as datas.`);
        }
      }
      const abriveis = roundsToStart.filter((round) => !(round.scheduledEndAt && new Date(round.scheduledEndAt) <= now));

      for (const round of abriveis) {
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

          // Rodadas semanais (out/2026): depois que a rodada marcada como
          // última é concluída, o ano letivo da turma está encerrado.
          const rodadasDaTurma = allRounds.filter((r) => r.classId === round.classId);
          if (anoLetivoEncerrado(rodadasDaTurma)) {
            console.warn(`[ROUND_SCHEDULER] Rodada ${round.id} (Round ${round.roundNumber}) não ativada: o ano letivo da turma ${round.classId} já foi encerrado`);
            continue;
          }

          // Out/2026 (Grupo B): turma sem setor não abre rodada (não há
          // produtos nem mercado; a rodada não conseguiria ser encerrada).
          const turmaDaRodada = await this.storage.getClass(round.classId);
          if (!turmaDaRodada?.sector) {
            if (!this.expiradasAvisadas.has(`sem-setor:${round.id}`)) {
              this.expiradasAvisadas.add(`sem-setor:${round.id}`);
              console.warn(`[ROUND_SCHEDULER] Rodada ${round.id} (Round ${round.roundNumber}) não aberta: a turma ${round.classId} está sem setor.`);
            }
            continue;
          }

          // Tamanho das equipes (out/2026): com alguma equipe fora de 3 a 5
          // alunos, a rodada espera. O agendador tenta de novo a cada minuto
          // e abre assim que todas estiverem completas (até o fechamento).
          const foraDoTamanho = equipesForaDoTamanho(await this.storage.getTeamsByClass(round.classId));
          if (foraDoTamanho.length > 0) {
            if (!this.expiradasAvisadas.has(`tamanho:${round.id}`)) {
              this.expiradasAvisadas.add(`tamanho:${round.id}`);
              console.warn(`[ROUND_SCHEDULER] Rodada ${round.id} (Round ${round.roundNumber}) aguardando: ${mensagemEquipesForaDoTamanho(foraDoTamanho)}`);
            }
            continue;
          }

          console.log(`[ROUND_SCHEDULER] Ativando rodada ${round.id} (Round ${round.roundNumber})`);

          // Out/2026 (Grupo C): abertura atômica. Se o professor clicou em
          // "Iniciar rodada" no mesmo instante, só um dos dois abre.
          const abriu = await abrirRodadaBloqueada(round.id);
          if (!abriu) {
            console.log(`[ROUND_SCHEDULER] Rodada ${round.id} (Round ${round.roundNumber}) já tinha sido aberta por outro caminho; nada a fazer.`);
            continue;
          }

          const classData = await this.storage.getClass(round.classId);
          if (classData && classData.currentRound < round.roundNumber) {
            await this.storage.updateClass(round.classId, {
              currentRound: round.roundNumber,
            });
          }

          console.log(`[ROUND_SCHEDULER] Rodada ${round.id} ativada com sucesso`);

          if (round.roundNumber === 1) {
            console.log(`[ROUND_SCHEDULER] Gerando análises estratégicas automáticas para rodada ${round.roundNumber}...`);
            // Out/2026 (Grupo C): em segundo plano. Antes o agendador ficava
            // esperando a IA terminar para todas as equipes, e nesse tempo
            // nenhuma outra rodada de nenhuma turma abria ou fechava.
            void autoGenerateMinimalAnalysesForAllTeams(this.storage, round.id)
              .then((result) => console.log(`[ROUND_SCHEDULER] Análises geradas: ${result.successCount}/${result.totalTeams} equipes`))
              .catch((error) => console.error(`[ROUND_SCHEDULER] Erro ao gerar análises automáticas para rodada ${round.id}:`, error));
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

          // Automação de IA na abertura (análises faltantes + eventos de
          // mercado), em segundo plano — ver roundAutomation.ts.
          scheduleRoundOpenedAutomation(this.storage, round.id);
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
