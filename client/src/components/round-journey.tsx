import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { CheckCircle2, Lock, ArrowRight, BookOpenCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Percurso obrigatório da rodada (server/services/teamJourney.ts): menu em
// ordem, etapas bloqueadas até a anterior ser feita e botão "Li e entendi"
// nas etapas de leitura. A regra fica no servidor; aqui só a exibição.

export type JourneyStepKey = "feedback" | "mercado" | "ferramentas" | "identidade" | "mix";

export interface JourneyStep {
  key: JourneyStepKey;
  number: number;
  label: string;
  href: string;
  paths: string[];
  required: boolean;
  done: boolean;
  locked: boolean;
  note?: string;
}

export interface Journey {
  roundId: string;
  roundNumber: number;
  steps: JourneyStep[];
  currentStep: JourneyStepKey | null;
}

const STATUS_KEY = ["/api/team/current-round-status"];

export function useJourney(): { journey: Journey | null; isLoading: boolean } {
  const { data, isFetched } = useQuery<{ journey?: Journey }>({
    queryKey: STATUS_KEY,
    retry: false,
  });
  // "Carregando" só até a primeira resposta. Correção (out/2026): sem rodada
  // ativa a rota responde 404 e não há dado em cache; cada nova montagem
  // (ex.: a barra "Li e entendi") refazia a consulta, o estado voltava a
  // "carregando", o portão escondia a página e a barra saía — um ciclo que
  // deixava Análise de Mercado, Simula+ News e Feedback em branco.
  return { journey: data?.journey ?? null, isLoading: !isFetched };
}

export function stepForPath(journey: Journey | null, path: string): JourneyStep | undefined {
  return journey?.steps.find((s) => s.paths.includes(path));
}

// Tela exibida no lugar de uma página cuja etapa ainda está bloqueada.
export function JourneyGate({ path, children }: { path: string; children: React.ReactNode }) {
  const { journey, isLoading } = useJourney();
  if (isLoading) return null;
  const step = stepForPath(journey, path);
  if (!journey || !step || !step.locked) return <>{children}</>;
  const atual = journey.steps.find((s) => s.key === journey.currentStep);

  return (
    <div className="mx-auto max-w-xl pt-10" data-testid="journey-gate">
      <Card>
        <CardContent className="space-y-4 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Etapa {step.number}: {step.label}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Esta etapa abre depois que a equipe concluir as anteriores. Na rodada {journey.roundNumber}, o percurso segue esta ordem:
            </p>
          </div>
          <ol className="space-y-1.5 text-left text-sm">
            {journey.steps.filter((s) => s.required).map((s) => (
              <li key={s.key} className="flex items-center gap-2">
                {s.done ? <CheckCircle2 className="h-4 w-4 text-[#1aa15c]" /> : s.locked ? <Lock className="h-4 w-4 text-muted-foreground" /> : <ArrowRight className="h-4 w-4 text-[#1447e6]" />}
                <span className={s.done ? "text-muted-foreground line-through" : s.key === journey.currentStep ? "font-semibold" : ""}>
                  {s.number}. {s.label}
                </span>
              </li>
            ))}
          </ol>
          {atual && (
            <Link href={atual.href}>
              <Button className="w-full" data-testid="button-journey-go-current">
                Ir para a etapa {atual.number}: {atual.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Barra "Li e entendi" no fim das páginas de leitura (etapas 1 e 2).
export function JourneyAckBar({ step }: { step: "feedback" | "mercado" }) {
  const { journey } = useJourney();
  const { toast } = useToast();
  const ack = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/team/journey/ack", { step });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATUS_KEY });
      toast({ title: "Etapa concluída", description: "A próxima etapa da rodada foi liberada." });
    },
    onError: (error: any) => {
      toast({ title: "Não foi possível confirmar", description: error.message, variant: "destructive" });
    },
  });

  if (!journey) return null;
  const s = journey.steps.find((x) => x.key === step);
  if (!s || !s.required) return null;
  const idx = journey.steps.findIndex((x) => x.key === step);
  const proxima = journey.steps.slice(idx + 1).find((x) => x.required);

  return (
    <Card className="border-2 border-[#1447e6]/30" data-testid={`journey-ack-${step}`}>
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <BookOpenCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#1447e6]" />
          <div className="text-sm">
            <p className="font-semibold">Etapa {s.number} da rodada: {s.label}</p>
            <p className="text-muted-foreground">
              {s.done
                ? "Concluída pela equipe."
                : s.note ?? "Depois de ler com a equipe, confirme para liberar a próxima etapa."}
            </p>
          </div>
        </div>
        {s.done ? (
          proxima && (
            <Link href={proxima.href}>
              <Button variant="outline" className="shrink-0" data-testid={`button-journey-next-${step}`}>
                Seguir para {proxima.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )
        ) : s.note ? (
          <Link href="/fechamento-anual">
            <Button className="shrink-0" data-testid={`button-journey-annual-${step}`}>
              Ir para o fechamento anual
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Button className="shrink-0" onClick={() => ack.mutate()} disabled={ack.isPending || s.locked} data-testid={`button-journey-ack-${step}`}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Li e entendi
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
