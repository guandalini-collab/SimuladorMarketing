import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Target, AlertTriangle, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAlignmentScoreLevel, getScoreColor, calculateKPIModifiers, formatKpiModifierPercent } from "@shared/alignmentUtils";

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

  // Inconsistência de auditoria (2026-09, segunda rodada): os blocos abaixo
  // usavam faixas de pontuação e percentuais de bônus/penalidade digitados
  // à mão aqui, divergentes da tabela real que o servidor aplica ao
  // resultado (calculateKPIModifiers, em shared/alignmentUtils.ts). Uma
  // equipe com pontuação 65 chegava a ver "Penalidades aplicadas" quando o
  // servidor na verdade aplicou um bônus. Agora os dois números vêm da
  // mesma função usada pelo servidor.
  const kpiModifiers = calculateKPIModifiers(score);
  const hasBonus = kpiModifiers.revenueModifier >= 0;
  
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
      <CardHeader className="bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-[#1447e6] flex items-center justify-center shadow-md">
            <Target className="h-6 w-6 text-white" />
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
          <Alert className={hasBonus ? "bg-[#1aa15c]/10 border-[#1aa15c]" : undefined}>
            <AlertTriangle className={`h-4 w-4 ${hasBonus ? "text-[#1aa15c]" : ""}`} />
            <AlertDescription className={hasBonus ? "text-[#1aa15c]" : undefined}>
              <strong>{hasBonus ? "Bônus aplicado" : "Penalidades aplicadas"}:</strong> Receita {formatKpiModifierPercent(kpiModifiers.revenueModifier)}, Lucro {formatKpiModifierPercent(kpiModifiers.profitModifier)}, Market Share {formatKpiModifierPercent(kpiModifiers.marketShareModifier)}
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
          <Alert className="bg-[#1aa15c]/10 border-[#1aa15c]">
            <CheckCircle2 className="h-4 w-4 text-[#1aa15c]" />
            <AlertDescription className="text-[#1aa15c]">
              <strong>Bônus aplicado:</strong> Receita {formatKpiModifierPercent(kpiModifiers.revenueModifier)}, Lucro {formatKpiModifierPercent(kpiModifiers.profitModifier)}, Market Share {formatKpiModifierPercent(kpiModifiers.marketShareModifier)}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
