import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Target, AlertTriangle, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAlignmentScoreLevel, getScoreColor } from "@shared/alignmentUtils";

interface AlignmentScoreCardProps {
  teamId: string;
  roundId: string;
}

interface AlignmentData {
  teamId: string;
  roundId: string;
  alignmentScore: number | null;
  alignmentIssues: string[];
  calculatedAt: string;
}

export function AlignmentScoreCard({ teamId, roundId }: AlignmentScoreCardProps) {
  const { data: alignmentData, isLoading } = useQuery<AlignmentData>({
    queryKey: ["/api/alignment/score", teamId, roundId],
    queryFn: async () => {
      const res = await fetch(`/api/alignment/score/${teamId}/${roundId}`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Erro ao buscar score de alinhamento");
      }
      return res.json();
    },
    enabled: !!teamId && !!roundId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!alignmentData || alignmentData.alignmentScore === null) {
    return null;
  }

  const score = alignmentData.alignmentScore;
  const issues = alignmentData.alignmentIssues || [];

  // Get score level and styling using shared utility
  const scoreLevel = getAlignmentScoreLevel(score);
  const scoreColor = getScoreColor(score);
  
  // Map score to icon
  let ScoreIcon = CheckCircle2;
  if (score < 30) {
    ScoreIcon = XCircle;
  } else if (score < 50) {
    ScoreIcon = AlertTriangle;
  } else if (score < 70) {
    ScoreIcon = AlertCircle;
  }

  return (
    <Card className="border-2" data-testid="card-alignment-score">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">Alinhamento Estratégico</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Coerência entre análises estratégicas e decisões de marketing
            </p>
          </div>
          <Badge variant={scoreLevel.variant} className="text-base px-3 py-1">
            {scoreLevel.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Display */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <ScoreIcon className={`h-10 w-10 ${scoreColor}`} />
            <div>
              <p className={`text-5xl font-bold ${scoreColor}`} data-testid="text-alignment-score">
                {score}
              </p>
              <p className="text-sm text-muted-foreground">de 100</p>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="relative h-4 bg-muted rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all ${scoreColor.replace('text-', 'bg-').replace(' dark:text-', ' dark:bg-')}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Impact Info */}
        {score < 90 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {score < 30 && (
                <span>
                  <strong>Penalidades aplicadas:</strong> Receita -25%, Lucro -35%, Market Share -15%
                </span>
              )}
              {score >= 30 && score < 50 && (
                <span>
                  <strong>Penalidades aplicadas:</strong> Receita -15%, Lucro -20%, Market Share -10%
                </span>
              )}
              {score >= 50 && score < 70 && (
                <span>
                  <strong>Penalidades aplicadas:</strong> Receita -10%, Lucro -12%, Market Share -5%
                </span>
              )}
              {score >= 70 && score < 90 && (
                <span>
                  <strong>Penalidades aplicadas:</strong> Receita -5%, Lucro -7%, Market Share -3%
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Alignment Issues */}
        {issues.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Inconsistências Detectadas
            </h4>
            <div className="space-y-1">
              {issues.map((issue, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded"
                  data-testid={`text-alignment-issue-${index}`}
                >
                  <span className="text-destructive mt-0.5">•</span>
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Message */}
        {issues.length === 0 && score >= 90 && (
          <Alert className="bg-chart-3/10 border-chart-3">
            <CheckCircle2 className="h-4 w-4 text-chart-3" />
            <AlertDescription className="text-chart-3">
              <strong>Bônus aplicado:</strong> Receita +15%, Lucro +20%, Market Share +10%
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
