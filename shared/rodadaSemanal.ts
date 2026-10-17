// Rodadas semanais (pedido do professor, out/2026).
//
// Cada rodada corresponde a uma semana real do calendário, escolhida pelo
// professor, sempre no horário de Brasília (UTC-3 o ano todo, sem horário de
// verão desde 2019). O professor define o dia e o HORÁRIO de abertura (o
// horário da aula pode mudar) e o de fechamento:
// - Rodada 1 (semana de adaptação): abre no dia/horário escolhido
//   (normalmente segunda) e, por padrão, fecha às 23h59min59s do último dia
//   (normalmente domingo) — os alunos leem os manuais e enviam a 1ª decisão;
// - Rodadas 2 em diante: por padrão, fecham 2 horas depois da abertura (a
//   duração da aula), mas o professor pode mudar o horário de fechamento.
// A IA prepara eventos, boletim e análises sempre 30 minutos antes da
// abertura. A semana simulada é a semana (segunda a domingo) que contém o
// dia de abertura. Uma rodada pode ser marcada como a última do ano letivo;
// depois que ela é concluída, nenhuma rodada nova é aberta na turma.

export const HORA_ABERTURA_PADRAO = "20:50";
export const DURACAO_AULA_MINUTOS = 120;
export const HORA_FECHAMENTO_ADAPTACAO = "23:59:59";
export const MINUTOS_PREPARACAO_IA = 30;
export const FUSO_BRASILIA = "America/Sao_Paulo";
const OFFSET_BRASILIA = "-03:00";

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;

/** A Rodada 1 é a semana de adaptação (vários dias); as demais duram a aula. */
export const rodadaDeAdaptacao = (roundNumber: number) => roundNumber <= 1;

/** Data (AAAA-MM-DD) de um instante, no calendário de Brasília. */
export function dataBrasilia(instante: string | Date): string {
  return new Date(instante).toLocaleDateString("en-CA", { timeZone: FUSO_BRASILIA });
}

/** "HH:MM" de um instante, no relógio de Brasília. */
export function horaBrasilia(instante: string | Date): string {
  return new Date(instante).toLocaleTimeString("pt-BR", { timeZone: FUSO_BRASILIA, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

/** true quando o valor é só uma data (AAAA-MM-DD), sem horário. */
export const ehSoData = (valor: unknown) => typeof valor === "string" && RE_DATA.test(valor);

/** Aceita "AAAA-MM-DD" ou um instante ISO e devolve a data em Brasília. */
function normalizarData(valor: string | Date): string | null {
  if (ehSoData(valor)) return valor as string;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : dataBrasilia(d);
}

/** Dia (AAAA-MM-DD) + hora ("HH:MM" ou "HH:MM:SS") em Brasília → instante. */
export function instanteBrasilia(dia: string, hora: string): Date {
  return new Date(`${dia}T${hora.length === 5 ? `${hora}:00` : hora}${OFFSET_BRASILIA}`);
}

const valido = (d: Date) => (Number.isNaN(d.getTime()) ? null : d);

/** Abertura: instante ISO exato, ou só o dia (usa 20h50, o horário padrão). */
export function aberturaDaRodada(valor: string | Date): Date | null {
  if (ehSoData(valor)) return instanteBrasilia(valor as string, HORA_ABERTURA_PADRAO);
  return valor ? valido(new Date(valor)) : null;
}

/** Fechamento padrão: Rodada 1 → 23h59min59s do dia; demais → abertura + 2h. */
export function fechamentoPadrao(abertura: Date, roundNumber: number, diaFim?: string): Date {
  if (rodadaDeAdaptacao(roundNumber)) {
    return instanteBrasilia(diaFim ?? dataBrasilia(abertura), HORA_FECHAMENTO_ADAPTACAO);
  }
  return new Date(abertura.getTime() + DURACAO_AULA_MINUTOS * 60_000);
}

/**
 * Fechamento: instante ISO exato (horário escolhido pelo professor) ou só o
 * dia — nesse caso, aplica o padrão (Rodada 1: 23h59min59s; demais: 2h
 * depois da abertura, ou 2h depois das 20h50 desse dia sem abertura).
 */
export function fechamentoDaRodada(valor: string | Date, roundNumber: number, abertura?: Date | null): Date | null {
  if (!ehSoData(valor)) return valor ? valido(new Date(valor)) : null;
  const dia = valor as string;
  if (rodadaDeAdaptacao(roundNumber)) return instanteBrasilia(dia, HORA_FECHAMENTO_ADAPTACAO);
  return fechamentoPadrao(abertura ?? instanteBrasilia(dia, HORA_ABERTURA_PADRAO), roundNumber);
}

/** Momento em que a IA prepara a rodada (30 min antes da abertura). */
export function preparacaoDaRodada(abertura: string | Date): Date {
  return new Date(new Date(abertura).getTime() - MINUTOS_PREPARACAO_IA * 60_000);
}

/** "19 a 24/10/2026", "28/12/2026 a 02/01/2027" etc. */
export function formatarSemanaDaRodada(inicio: string | Date, fim: string | Date): string {
  const a = normalizarData(inicio);
  const b = normalizarData(fim);
  if (!a || !b) return "";
  const [ya, ma, da] = a.split("-");
  const [yb, mb, db] = b.split("-");
  if (a === b) return `${da}/${ma}/${ya}`;
  if (ya === yb && ma === mb) return `${da} a ${db}/${mb}/${yb}`;
  if (ya === yb) return `${da}/${ma} a ${db}/${mb}/${yb}`;
  return `${da}/${ma}/${ya} a ${db}/${mb}/${yb}`;
}

/** Semana simulada: segunda a domingo que contém o dia de abertura. */
export function semanaSimulada(abertura: string | Date): { inicio: string; fim: string; texto: string } | null {
  const dia = normalizarData(abertura);
  if (!dia) return null;
  const [y, m, d] = dia.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  const desdeSegunda = (base.getUTCDay() + 6) % 7;
  const seg = new Date(base.getTime() - desdeSegunda * 86_400_000);
  const dom = new Date(seg.getTime() + 6 * 86_400_000);
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  return { inicio: iso(seg), fim: iso(dom), texto: formatarSemanaDaRodada(iso(seg), iso(dom)) };
}

interface RodadaMinima {
  status: string;
  isLastRound?: boolean | null;
}

/** O ano letivo da turma termina quando a rodada marcada como última é concluída. */
export function anoLetivoEncerrado(rodadas: RodadaMinima[]): boolean {
  return rodadas.some((r) => r.isLastRound === true && r.status === "completed");
}
