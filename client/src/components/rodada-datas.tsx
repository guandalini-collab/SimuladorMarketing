import { useEffect, useMemo, useState } from "react";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { CalendarDays, Flag } from "lucide-react";
import type { Round } from "@shared/schema";
import { DURACAO_AULA_MINUTOS, HORA_ABERTURA_PADRAO, MINUTOS_PREPARACAO_IA, dataBrasilia, horaBrasilia, rodadaDeAdaptacao, semanaSimulada } from "@shared/rodadaSemanal";
import { feriadoEm, feriadosNacionais } from "@shared/calendarioBrasil";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Rodadas semanais (pedido do professor, out/2026 — regras em
// shared/rodadaSemanal.ts). Horário de Brasília. O professor escolhe no
// calendário o(s) dia(s) e informa o horário de abertura (o horário da aula
// pode mudar) e o de fechamento:
// - Rodada de teste (vários dias, desde out/2026): dia de abertura e dia de fechamento;
//   fechamento sugerido às 23h59;
// - Rodadas que valem nota (inclusive a Rodada 1): só o dia da aula; fechamento sugerido 2 horas depois da
//   abertura (duração da aula), editável;
// - rodada já aberta: novo dia e horário de fechamento.
// A IA prepara o conteúdo 30 minutos antes da abertura. A semana simulada é
// a semana (segunda a domingo) do dia de abertura.

/** "AAAA-MM-DD" → Date local ao meio-dia (evita troca de dia por fuso). */
const paraDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
};
/** Date local (do calendário) → "AAAA-MM-DD". */
const paraIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const diaPorExtenso = (iso: string) =>
  paraDate(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });

const hojeBrasilia = () => dataBrasilia(new Date());
const agoraBrasilia = () => horaBrasilia(new Date());

/** Soma minutos a "HH:MM" (limitado a 23:59 — a rodada não vira o dia). */
const somarMinutos = (hhmm: string, min: number) => {
  const [h, m] = hhmm.split(":").map(Number);
  const t = Math.min(h * 60 + m + min, 23 * 60 + 59);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};
const horaOk = (h: string) => /^\d{2}:\d{2}$/.test(h);
const emH = (h: string) => h.replace(":", "h");
/** Dia + "HH:MM" → ISO com fuso de Brasília (23:59 vira 23:59:59). */
const iso = (dia: string, hora: string) => `${dia}T${hora}:${hora === "23:59" ? "59" : "00"}-03:00`;

/** Sugestão de horário de abertura: o da rodada mais recente com horário; senão 20h50. */
function horaDeAberturaSugerida(rodadas: Round[], ignorarId?: string | null): string {
  const comHorario = rodadas
    .filter((r) => r.id !== ignorarId && (r.scheduledStartAt || r.startedAt))
    .sort((a, b) => b.roundNumber - a.roundNumber)[0];
  const ref = comHorario?.scheduledStartAt ?? comHorario?.startedAt;
  return ref ? horaBrasilia(ref) : HORA_ABERTURA_PADRAO;
}

/** Próximo domingo depois de hoje (sugestão de fechamento da rodada de teste). */
export function proximoDomingo(): string {
  const d = paraDate(hojeBrasilia());
  d.setDate(d.getDate() + (((7 - d.getDay()) % 7) || 7));
  return paraIso(d);
}

/** Feriados nacionais do ano anterior ao seguinte (para destacar no calendário). */
function diasDeFeriado(): Date[] {
  const ano = Number(hojeBrasilia().slice(0, 4));
  return [ano - 1, ano, ano + 1, ano + 2].flatMap((a) => feriadosNacionais(a)).map((f) => paraDate(f.data));
}
const DESTAQUE_FERIADO = { feriado: "text-[#c2410c] font-semibold underline decoration-dotted underline-offset-4" };

/** Aviso (sem bloquear) quando algum dia escolhido é feriado nacional. */
function AvisoFeriado({ dias }: { dias: (string | undefined)[] }) {
  const achados = Array.from(new Set(dias.filter((d): d is string => !!d)))
    .map((d) => ({ d, f: feriadoEm(d) }))
    .filter((x) => x.f);
  if (achados.length === 0) {
    return <p className="text-[11px] text-muted-foreground"><span className="font-semibold text-[#c2410c] underline decoration-dotted">Dias sublinhados</span> são feriados nacionais.</p>;
  }
  return (
    <div className="rounded-md border border-[#c2410c]/40 bg-[#fff4ed] p-2 text-xs text-[#9a3412] dark:bg-orange-950/30 dark:text-orange-300" data-testid="aviso-feriado">
      {achados.map(({ d, f }) => (
        <p key={d}>
          <span className="font-semibold">{d.split("-").reverse().join("/")} é {f!.facultativo ? "ponto facultativo nacional" : "feriado nacional"}</span> ({f!.nome}). Confirme se haverá aula nesse dia.
        </p>
      ))}
    </div>
  );
}

/** Dias já ocupados por outras rodadas da turma (não concluídas). */
function diasOcupados(rodadas: Round[], ignorarId?: string | null) {
  return rodadas
    .filter((r) => r.id !== ignorarId && r.status !== "completed")
    .map((r) => {
      const ini = r.status === "active" && r.startedAt ? r.startedAt : r.scheduledStartAt;
      return ini && r.scheduledEndAt ? { from: paraDate(dataBrasilia(ini)), to: paraDate(dataBrasilia(r.scheduledEndAt)) } : null;
    })
    .filter((x): x is { from: Date; to: Date } => x !== null);
}

const dataHora = (v: string | Date) =>
  new Date(v).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/** Linhas "Semana simulada / Abre / Fecha" do card da rodada. */
export function SemanaDaRodada({ round }: { round: Round }) {
  const inicio = round.status !== "locked" && round.startedAt ? round.startedAt : round.scheduledStartAt;
  if (!inicio && !round.scheduledEndAt) return null;
  const semana = inicio ? semanaSimulada(inicio) : null;
  return (
    <div className="mb-2 space-y-0.5 text-xs text-muted-foreground" data-testid={`semana-rodada-${round.roundNumber}`}>
      {semana && (
        <p className="flex items-center gap-1 font-medium text-foreground">
          <CalendarDays className="h-3 w-3" />
          Semana de {semana.texto}
        </p>
      )}
      {inicio && <p>{round.status === "locked" ? "Abre" : "Aberta em"} {dataHora(inicio)}</p>}
      {round.scheduledEndAt && <p>{round.status === "completed" ? "Prazo era" : "Fecha"} {dataHora(round.scheduledEndAt)}</p>}
    </div>
  );
}

export function SeloRodadaTeste() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#eef2ff] px-2 py-0.5 text-[11px] font-semibold text-[#1447e6]" data-testid="selo-rodada-teste">
      Rodada de teste
    </span>
  );
}

/** Opção "Rodada de teste" dos diálogos de datas e de início. */
function CampoRodadaTeste({ marcado, onChange }: { marcado: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm" data-testid="campo-rodada-teste">
      <Checkbox checked={marcado} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" data-testid="checkbox-rodada-teste" />
      <span>
        <span className="font-medium">Rodada de teste</span>
        <span className="block text-xs text-muted-foreground">Para os alunos conhecerem o simulador. Não vale nota; depois, o botão "Iniciar o jogo" apaga tudo o que ela gerou.</span>
      </span>
    </label>
  );
}

export function SeloUltimaRodada() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff6e0] px-2 py-0.5 text-[11px] font-semibold text-[#8a5a00]" data-testid="selo-ultima-rodada">
      <Flag className="h-3 w-3" />
      Última rodada
    </span>
  );
}

function Resumo({ inicio, horaInicio, fim, horaFim, abreJa }: { inicio?: string; horaInicio?: string; fim?: string; horaFim: string; abreJa?: boolean }) {
  const semana = inicio ? semanaSimulada(inicio) : null;
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-sm" data-testid="resumo-datas-rodada">
      {inicio && (
        <p>
          <span className="font-medium">Abre:</span> {abreJa ? "agora" : `${diaPorExtenso(inicio)}, às ${emH(horaInicio ?? "")}`}
        </p>
      )}
      <p>
        <span className="font-medium">Fecha:</span> {fim ? `${diaPorExtenso(fim)}, às ${emH(horaFim)}` : "escolha o dia no calendário"}
      </p>
      {semana && <p className="mt-1 text-xs text-muted-foreground">Semana simulada: {semana.texto} (horário de Brasília).</p>}
      {inicio && !abreJa && horaInicio && horaOk(horaInicio) && (
        <p className="text-xs text-muted-foreground">A IA prepara eventos, boletim e análises às {emH(somarMinutos(horaInicio, -MINUTOS_PREPARACAO_IA))}.</p>
      )}
    </div>
  );
}

function CampoHora({ id, rotulo, valor, onChange }: { id: string; rotulo: string; valor: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor={id} className="text-sm">{rotulo}</Label>
      <Input id={id} type="time" value={valor} onChange={(e) => onChange(e.target.value)} className="w-32" data-testid={`input-${id}`} />
    </div>
  );
}

/**
 * Diálogo "Datas da rodada". Rodada de teste bloqueada: dia de abertura e dia de
 * fechamento (dois cliques) + horários. Demais rodadas bloqueadas: dia da
 * aula + horários (fechamento sugerido 2h depois). Rodada aberta: novo dia e
 * horário de fechamento.
 */
export function DialogoDatasRodada({
  open,
  onOpenChange,
  round,
  rodadas,
  pending,
  onSalvar,
  onRemover,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  round: Round | null;
  rodadas: Round[];
  pending: boolean;
  /** Instantes ISO (com fuso de Brasília) escolhidos pelo professor. */
  onSalvar: (datas: { inicio?: string; fim: string; isPractice?: boolean }) => void;
  onRemover: () => void;
}) {
  const aberta = round?.status === "active";
  const [faixa, setFaixa] = useState<DateRange | undefined>();
  const [dia, setDia] = useState<Date | undefined>();
  const [horaInicio, setHoraInicio] = useState(HORA_ABERTURA_PADRAO);
  const [horaFim, setHoraFim] = useState("22:50");
  const [fimEditado, setFimEditado] = useState(false);
  const [teste, setTeste] = useState(false);
  // Out/2026 (regra unificada): só a rodada de teste pode durar vários dias;
  // todas as rodadas que valem nota, inclusive a Rodada 1, duram a aula.
  const adaptacao = rodadaDeAdaptacao(round?.roundNumber ?? 1, aberta ? round?.isPractice : teste);

  useEffect(() => {
    if (!open || !round) return;
    const ini = round.scheduledStartAt ? paraDate(dataBrasilia(round.scheduledStartAt)) : undefined;
    const fim = round.scheduledEndAt ? paraDate(dataBrasilia(round.scheduledEndAt)) : undefined;
    const hIni = round.scheduledStartAt ? horaBrasilia(round.scheduledStartAt) : horaDeAberturaSugerida(rodadas, round.id);
    setFaixa(ini ? { from: ini, to: fim } : undefined);
    setDia(round.status === "active" ? fim : ini);
    setHoraInicio(hIni);
    setHoraFim(round.scheduledEndAt ? horaBrasilia(round.scheduledEndAt) : round.isPractice ? "23:59" : somarMinutos(hIni, DURACAO_AULA_MINUTOS));
    setFimEditado(!!round.scheduledEndAt);
    setTeste(round.isPractice === true);
  }, [open, round?.id]);

  // Rodadas 2+: enquanto o professor não mexer no fechamento, ele acompanha
  // a abertura (abertura + 2h).
  const mudarHoraInicio = (h: string) => {
    setHoraInicio(h);
    if (!adaptacao && !fimEditado && horaOk(h)) setHoraFim(somarMinutos(h, DURACAO_AULA_MINUTOS));
  };
  const mudarHoraFim = (h: string) => {
    setHoraFim(h);
    setFimEditado(true);
  };

  const hojeIso = hojeBrasilia();
  const hoje = paraDate(hojeIso);
  const bloqueados = useMemo(() => [{ before: hoje }, ...diasOcupados(rodadas, round?.id)], [rodadas, round?.id, hojeIso]);
  const feriados = useMemo(diasDeFeriado, [hojeIso]);

  let inicio: string | undefined;
  let fim: string | undefined;
  if (aberta) {
    fim = dia ? paraIso(dia) : undefined;
  } else if (adaptacao) {
    inicio = faixa?.from ? paraIso(faixa.from) : undefined;
    fim = faixa?.to ? paraIso(faixa.to) : undefined;
  } else {
    inicio = dia ? paraIso(dia) : undefined;
    fim = inicio;
  }

  const horasOk = horaOk(horaFim) && (aberta || horaOk(horaInicio));
  const fimAntesDoInicio = !aberta && !!inicio && !!fim && horasOk && `${fim} ${horaFim}` <= `${inicio} ${horaInicio}`;
  const fimNoPassado = aberta && !!fim && horasOk && `${fim} ${horaFim}` <= `${hojeIso} ${agoraBrasilia()}`;
  const podeSalvar = !!round && !!fim && horasOk && !fimAntesDoInicio && !fimNoPassado && (aberta || !!inicio);
  const temAgendamento = !!(round?.scheduledStartAt || round?.scheduledEndAt);
  const abreAgora = !aberta && !!inicio && horaOk(horaInicio) && `${inicio} ${horaInicio}` <= `${hojeIso} ${agoraBrasilia()}`;

  const salvar = () => {
    if (!fim || !podeSalvar) return;
    onSalvar({ inicio: aberta || !inicio ? undefined : iso(inicio, horaInicio), fim: iso(fim, horaFim), isPractice: aberta ? undefined : teste });
  };

  const titulo = aberta ? `Fechamento da Rodada ${round?.roundNumber}` : `Datas da Rodada ${round?.roundNumber ?? ""}`;
  const descricao = aberta
    ? "Escolha o dia e o horário do novo fechamento (por exemplo, se a aula atrasou). Horário de Brasília."
    : adaptacao
      ? "Rodada de teste — pode durar vários dias. Clique no dia de abertura e depois no dia de fechamento, e confira os horários (Brasília)."
      : "Clique no dia da aula e informe o horário de abertura. O fechamento é sugerido 2 horas depois e pode ser alterado (horário de Brasília).";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] max-w-md overflow-y-auto" data-testid="dialog-schedule-round">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
          {!aberta && adaptacao ? (
            <Calendar mode="range" locale={ptBR} selected={faixa} onSelect={setFaixa} disabled={bloqueados} modifiers={{ feriado: feriados }} modifiersClassNames={DESTAQUE_FERIADO} defaultMonth={faixa?.from ?? hoje} data-testid="calendario-rodada" />
          ) : (
            <Calendar mode="single" locale={ptBR} selected={dia} onSelect={setDia} disabled={bloqueados} modifiers={{ feriado: feriados }} modifiersClassNames={DESTAQUE_FERIADO} defaultMonth={dia ?? hoje} data-testid="calendario-rodada-dia" />
          )}
        </div>
        <div className="space-y-2">
          {!aberta && <CampoHora id="hora-abertura" rotulo="Horário de abertura" valor={horaInicio} onChange={mudarHoraInicio} />}
          <CampoHora id="hora-fechamento" rotulo="Horário de fechamento" valor={horaFim} onChange={mudarHoraFim} />
          {!aberta && <CampoRodadaTeste marcado={teste} onChange={setTeste} />}
        </div>
        <AvisoFeriado dias={[inicio, fim]} />
        <Resumo inicio={inicio} horaInicio={horaInicio} fim={fim} horaFim={horaFim} />
        {fimAntesDoInicio && <p className="text-xs text-destructive">O fechamento precisa ser depois da abertura.</p>}
        {fimNoPassado && <p className="text-xs text-destructive">Esse horário já passou. Escolha um horário futuro.</p>}
        {abreAgora && <p className="text-xs text-[#8a5a00]">Esse horário de abertura já passou: a rodada abre assim que você salvar (em até 1 minuto).</p>}
        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <div>
            {!aberta && temAgendamento && (
              <Button variant="destructive" onClick={onRemover} disabled={pending} data-testid="button-remove-schedule">
                Remover datas
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-schedule">
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={!podeSalvar || pending} data-testid="button-submit-schedule">
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Diálogo "Iniciar rodada agora". Rodada de teste: dia e horário de fechamento
 * (sugere o próximo domingo, 23h59). Demais: horário de fechamento de hoje
 * (sugere 2 horas a partir de agora).
 */
export function DialogoIniciarRodada({
  open,
  onOpenChange,
  numeroRodada,
  rodadas,
  pending,
  onConfirmar,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  numeroRodada: number;
  rodadas: Round[];
  pending: boolean;
  /** Instante ISO do fechamento (fuso de Brasília). */
  onConfirmar: (fim: string, isPractice: boolean) => void;
}) {
  const [dia, setDia] = useState<Date | undefined>();
  const [horaFim, setHoraFim] = useState("23:59");
  const [teste, setTeste] = useState(false);
  // Out/2026 (regra unificada): só a rodada de teste pode durar vários dias.
  const adaptacao = rodadaDeAdaptacao(numeroRodada, teste);
  useEffect(() => {
    if (!open) return;
    setTeste(false);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    setDia(paraDate(adaptacao ? proximoDomingo() : hojeBrasilia()));
    setHoraFim(adaptacao ? "23:59" : somarMinutos(agoraBrasilia(), DURACAO_AULA_MINUTOS));
  }, [open, adaptacao]);
  const hojeIso = hojeBrasilia();
  const hoje = paraDate(hojeIso);
  const bloqueados = [{ before: hoje }, ...diasOcupados(rodadas)];
  const feriados = useMemo(diasDeFeriado, [hojeIso]);
  const fimIso = adaptacao ? (dia ? paraIso(dia) : undefined) : hojeIso;
  const noPassado = !!fimIso && horaOk(horaFim) && `${fimIso} ${horaFim}` <= `${hojeIso} ${agoraBrasilia()}`;
  const podeIniciar = !!fimIso && horaOk(horaFim) && !noPassado;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] max-w-md overflow-y-auto" data-testid="dialog-start-round">
        <DialogHeader>
          <DialogTitle>Iniciar a Rodada {numeroRodada} agora</DialogTitle>
          <DialogDescription>
            {adaptacao
              ? "A rodada de teste abre neste momento. Escolha o dia e o horário de fechamento (horário de Brasília)."
              : "A rodada abre neste momento e fecha hoje no horário abaixo — sugerido 2 horas a partir de agora (horário de Brasília)."}
          </DialogDescription>
        </DialogHeader>
        {adaptacao && (
          <div className="flex justify-center">
            <Calendar mode="single" locale={ptBR} selected={dia} onSelect={setDia} disabled={bloqueados} modifiers={{ feriado: feriados }} modifiersClassNames={DESTAQUE_FERIADO} defaultMonth={dia ?? hoje} data-testid="calendario-iniciar" />
          </div>
        )}
        <CampoHora id="hora-fechamento-inicio" rotulo="Horário de fechamento" valor={horaFim} onChange={setHoraFim} />
        <CampoRodadaTeste marcado={teste} onChange={setTeste} />
        <AvisoFeriado dias={[hojeIso, fimIso]} />
        <Resumo inicio={hojeIso} fim={fimIso} horaFim={horaFim} abreJa />
        {noPassado && <p className="text-xs text-destructive">Esse horário já passou. Escolha um horário futuro.</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-start-round">
            Cancelar
          </Button>
          <Button onClick={() => fimIso && podeIniciar && onConfirmar(iso(fimIso, horaFim), teste)} disabled={!podeIniciar || pending} data-testid="button-confirm-start-round">
            {pending ? "Iniciando..." : "Iniciar rodada"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
