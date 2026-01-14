import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, MessageSquare, TrendingUp, TrendingDown, Lightbulb, Package, DollarSign, MapPin, Megaphone, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DeterministicFeedbackCardProps {
  teamId: string;
  roundId: string;
  compact?: boolean;
}

interface Recommendation {
  area: "Produto" | "Preço" | "Praça" | "Promoção";
  action: string;
  rationale: string;
  tradeoff: string;
}

interface DeterministicFeedback {
  id: string;
  teamId: string;
  roundId: string;
  summary: string;
  whatHappened: string[];
  whyItHappened: string[];
  recommendations: Recommendation[];
  engineVersion: string;
  createdAt: string;
}

const areaIcons = {
  Produto: Package,
  Preço: DollarSign,
  Praça: MapPin,
  Promoção: Megaphone,
};

const areaColors = {
  Produto: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  Preço: "bg-green-500/10 text-green-700 dark:text-green-400",
  Praça: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  Promoção: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
};

export function DeterministicFeedbackCard({ teamId, roundId, compact = false }: DeterministicFeedbackCardProps) {
  const { data: feedback, isLoading, error } = useQuery<DeterministicFeedback | null>({
    queryKey: ["/api/deterministic-feedback", teamId, roundId],
    enabled: !!teamId && !!roundId,
  });

  if (isLoading) {
    return (
      <Card data-testid="card-deterministic-feedback">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !feedback) {
    return (
      <Card data-testid="card-deterministic-feedback">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">Feedback da Rodada</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Análise automática dos seus resultados
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert data-testid="alert-feedback-unavailable">
            <Info className="h-4 w-4" />
            <AlertDescription>
              O feedback estará disponível após o encerramento da rodada e processamento dos resultados.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card data-testid="card-deterministic-feedback-compact" className="border-l-4 border-l-primary">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium">{feedback.summary}</p>
              {feedback.recommendations.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lightbulb className="h-3 w-3" />
                  <span>{feedback.recommendations.length} recomendações disponíveis</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-deterministic-feedback">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Feedback da Rodada</CardTitle>
            <CardDescription>
              Análise automática baseada em seus resultados e decisões
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-l-primary">
          <p className="text-base leading-relaxed">{feedback.summary}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">O que aconteceu</h3>
            </div>
            <ul className="space-y-2">
              {feedback.whatHappened.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Por que aconteceu</h3>
            </div>
            <ul className="space-y-2">
              {feedback.whyItHappened.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {feedback.recommendations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold">O que fazer na próxima rodada</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {feedback.recommendations.map((rec, index) => {
                const Icon = areaIcons[rec.area];
                return (
                  <Card key={index} className="overflow-hidden">
                    <div className={`px-4 py-2 flex items-center gap-2 ${areaColors[rec.area]}`}>
                      <Icon className="h-4 w-4" />
                      <span className="font-medium text-sm">{rec.area}</span>
                    </div>
                    <CardContent className="pt-4 space-y-3">
                      <p className="font-medium text-sm">{rec.action}</p>
                      <p className="text-xs text-muted-foreground">{rec.rationale}</p>
                      <div className="pt-2 border-t">
                        <Badge variant="outline" className="text-xs">
                          Trade-off: {rec.tradeoff}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {feedback.engineVersion}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
