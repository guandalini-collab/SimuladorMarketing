import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface RoundCountdownProps {
  /** Data/hora de fechamento da rodada (ISO string ou Date). Sempre meia-noite
   *  de Brasília, independente do fuso horário de quem está vendo a tela — a
   *  conta é feita em tempo absoluto (Date - Date), então funciona certo em
   *  qualquer fuso do navegador. */
  endDate: string | Date | null | undefined;
  className?: string;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) {
    return "Prazo encerrado — aguardando o professor fechar a rodada";
  }
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `Faltam ${days} dia${days !== 1 ? "s" : ""}${hours > 0 ? ` e ${hours}h` : ""} para o fechamento da rodada`;
  }
  if (hours > 0) {
    return `Faltam ${hours}h${minutes > 0 ? ` ${minutes}min` : ""} para o fechamento da rodada`;
  }
  return `Faltam ${minutes} minuto${minutes !== 1 ? "s" : ""} para o fechamento da rodada`;
}

/**
 * Contador visível de tempo restante até o fechamento da rodada.
 * A rodada sempre fecha à meia-noite oficial de Brasília — este componente
 * apenas exibe quanto falta, sem depender do relógio local do usuário para
 * a regra de negócio (o fechamento em si é controlado pelo servidor).
 */
export function RoundCountdown({ endDate, className }: RoundCountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endDate) return;
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (!endDate) return null;

  const end = new Date(endDate).getTime();
  if (Number.isNaN(end)) return null;

  const remainingMs = end - now;
  const isOverdue = remainingMs <= 0;
  const isUrgent = !isOverdue && remainingMs <= 24 * 60 * 60 * 1000;

  return (
    <p
      className={`flex items-center gap-1.5 text-sm font-medium ${
        isOverdue
          ? "text-muted-foreground"
          : isUrgent
            ? "text-[#e07800] dark:text-orange-400"
            : "text-foreground"
      } ${className ?? ""}`}
      data-testid="text-round-countdown"
    >
      {isUrgent ? (
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <Clock className="h-3.5 w-3.5 shrink-0" />
      )}
      {formatRemaining(remainingMs)}
    </p>
  );
}
