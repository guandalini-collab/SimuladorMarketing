import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ArrowRight, AlertCircle, Users } from "lucide-react";
import { Link } from "wouter";

interface NextAction {
  key: "swot" | "porter" | "bcg" | "pestel" | "mix" | "submit" | "results";
  title: string;
  description: string;
  href: string;
}

interface RoundStatus {
  teamId: string | null;
  roundNumber: number | null;
  hasSwot: boolean;
  hasPorter: boolean;
  hasBcg: boolean;
  hasPestel: boolean;
  hasMarketingMixDraft: boolean;
  isSubmitted: boolean;
  hasResults: boolean;
  progress: number;
  nextAction: NextAction | null;
  noTeam?: boolean;
}

interface ChecklistItem {
  key: string;
  label: string;
  completed: boolean;
}

export function RoundChecklistCard() {
  const { data, isLoading, isError, refetch } = useQuery<RoundStatus>({
    queryKey: ["/api/team/current-round-status"],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card data-testid="card-round-checklist-loading">
        <CardHeader>
          <CardTitle className="text-lg">Roteiro da Rodada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Carregando roteiro...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data?.noTeam || (!isLoading && !isError && !data?.teamId)) {
    return (
      <Card data-testid="card-round-checklist-no-team">
        <CardHeader>
          <CardTitle className="text-lg">Roteiro da Rodada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 py-4 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span>Você precisa estar em uma equipe para jogar.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card data-testid="card-round-checklist-error">
        <CardHeader>
          <CardTitle className="text-lg">Roteiro da Rodada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              <span>Não foi possível carregar o roteiro.</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              data-testid="button-retry-checklist"
            >
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const checklistItems: ChecklistItem[] = [
    { key: "swot", label: "Diagnóstico SWOT", completed: data.hasSwot },
    { key: "porter", label: "Forças competitivas (Porter)", completed: data.hasPorter },
    { key: "bcg", label: "Portfólio (BCG)", completed: data.hasBcg },
    { key: "pestel", label: "Ambiente externo (PESTEL)", completed: data.hasPestel },
    { key: "mix", label: "Decisões (4Ps)", completed: data.hasMarketingMixDraft },
    { key: "submit", label: "Submeter rodada", completed: data.isSubmitted },
    { key: "results", label: "Ver resultados", completed: data.hasResults },
  ];

  return (
    <Card data-testid="card-round-checklist">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Roteiro da Rodada {data.roundNumber}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {data.progress}% concluído
          </span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Siga estas etapas para concluir a rodada com segurança.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={data.progress} className="h-2" data-testid="progress-round" />
        
        <ul className="space-y-2">
          {checklistItems.map((item) => (
            <li 
              key={item.key} 
              className="flex items-center gap-2 text-sm"
              data-testid={`checklist-item-${item.key}`}
            >
              {item.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className={item.completed ? "text-muted-foreground line-through" : ""}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>

        {data.nextAction && (
          <div className="pt-2 border-t space-y-2">
            <div className="text-sm">
              <p className="font-medium">{data.nextAction.title}</p>
              <p className="text-muted-foreground">{data.nextAction.description}</p>
            </div>
            <Link href={data.nextAction.href}>
              <Button 
                className="w-full" 
                size="sm"
                data-testid="button-next-action"
              >
                Ir agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
