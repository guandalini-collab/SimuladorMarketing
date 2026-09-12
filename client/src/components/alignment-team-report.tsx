import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Target, AlertTriangle, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getAlignmentScoreLevel, getScoreColor } from "@shared/alignmentUtils";

interface AlignmentTeamReportProps {
  classId: string;
  lastCompletedRound: { id: string; roundNumber: number } | null;
}

interface TeamAlignmentData {
  teamId: string;
  teamName: string;
  alignmentScore: number | null;
  scoreLevel: string | null;
  alignmentIssues: string[];
  calculatedAt: string | null;
  hasSubmission?: boolean;
}

export function AlignmentTeamReport({ classId, lastCompletedRound }: AlignmentTeamReportProps) {
  const { data: alignmentData = [], isLoading } = useQuery<TeamAlignmentData[]>({
    queryKey: [`/api/alignment/class/${classId}/round/${lastCompletedRound?.id}`],
    enabled: !!classId && !!lastCompletedRound,
  });

  if (!lastCompletedRound) {
    return (
      <Card data-testid="card-alignment-report">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-[#1447e6] flex items-center justify-center shadow-md">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>Relatório de Alinhamento Estratégico</CardTitle>
              <CardDescription>Scores de alinhamento por equipe</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma rodada concluída ainda. Os scores de alinhamento serão exibidos após a primeira rodada ser encerrada.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card data-testid="card-alignment-report">
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const criticalTeams = alignmentData.filter(t => t.alignmentScore !== null && t.alignmentScore < 30);
  const weakTeams = alignmentData.filter(t => t.alignmentScore !== null && t.alignmentScore >= 30 && t.alignmentScore < 50);
  const noSubmissionTeams = alignmentData.filter(t => t.alignmentScore === null);
  const goodTeams = alignmentData.filter(t => t.alignmentScore !== null && t.alignmentScore >= 50);

  const totalTeams = alignmentData.length;
  const teamsWithIssues = criticalTeams.length + weakTeams.length + noSubmissionTeams.length;

  return (
    <Card data-testid="card-alignment-report">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-[#1447e6] flex items-center justify-center shadow-md">
            <Target className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle>Relatório de Alinhamento Estratégico</CardTitle>
            <CardDescription>
              Rodada {lastCompletedRound.roundNumber} - {totalTeams} equipes ({teamsWithIssues} precisam de atenção)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumo rápido */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-3 rounded-lg bg-[#fde8e6] dark:bg-red-900/20 border border-[#a3241c]/20 dark:border-red-800 hover-elevate cursor-help">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-[#a3241c] dark:text-red-400" />
                  <span className="text-sm font-medium text-[#a3241c] dark:text-red-400">Crítico</span>
                </div>
                <p className="text-2xl font-bold text-[#a3241c] dark:text-red-400 mt-1">{criticalTeams.length}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>Score de alinhamento &lt; 30</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-3 rounded-lg bg-[#ff8c1a]/10 border border-[#ff8c1a]/30 hover-elevate cursor-help">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-[#ff8c1a]" />
                  <span className="text-sm font-medium text-[#ff8c1a]">Fraco</span>
                </div>
                <p className="text-2xl font-bold text-[#ff8c1a] mt-1">{weakTeams.length}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>Score de alinhamento 30-49</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-3 rounded-lg bg-muted/50 border border-muted-foreground/20 hover-elevate cursor-help">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Sem dados</span>
                </div>
                <p className="text-2xl font-bold text-muted-foreground mt-1">{noSubmissionTeams.length}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>Equipes sem análises ou decisões</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-3 rounded-lg bg-[#1aa15c]/10 border border-[#1aa15c]/30 hover-elevate cursor-help">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#1aa15c]" />
                  <span className="text-sm font-medium text-[#1aa15c]">OK</span>
                </div>
                <p className="text-2xl font-bold text-[#1aa15c] mt-1">{goodTeams.length}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>Score de alinhamento ≥ 50</TooltipContent>
          </Tooltip>
        </div>

        {/* Alerta para equipes críticas */}
        {(criticalTeams.length > 0 || noSubmissionTeams.length > 0) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{criticalTeams.length + noSubmissionTeams.length} equipes precisam de atenção urgente:</strong>
              {criticalTeams.length > 0 && (
                <span className="ml-1">{criticalTeams.length} em estado crítico</span>
              )}
              {criticalTeams.length > 0 && noSubmissionTeams.length > 0 && <span>,</span>}
              {noSubmissionTeams.length > 0 && (
                <span className="ml-1">{noSubmissionTeams.length} sem submissão</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Tabela de equipes */}
        {alignmentData.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma equipe cadastrada nesta turma.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Equipe</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Nível</TableHead>
                  <TableHead>Principais Problemas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alignmentData.map((team) => {
                  const score = team.alignmentScore;
                  const scoreInfo = score !== null ? getAlignmentScoreLevel(score) : null;
                  const scoreColor = score !== null ? getScoreColor(score) : "";
                  const isCritical = score !== null && score < 30;
                  const isWeak = score !== null && score >= 30 && score < 50;
                  const noData = score === null;
                  
                  return (
                    <TableRow 
                      key={team.teamId} 
                      data-testid={`row-team-alignment-${team.teamId}`}
                      className={isCritical ? "bg-[#fde8e6]/50 dark:bg-red-900/10" : isWeak ? "bg-[#ff8c1a]/5" : noData ? "bg-muted/30" : ""}
                    >
                      <TableCell className="w-8">
                        {isCritical && <XCircle className="h-4 w-4 text-[#a3241c] dark:text-red-400" />}
                        {isWeak && <AlertCircle className="h-4 w-4 text-[#ff8c1a]" />}
                        {noData && <AlertTriangle className="h-4 w-4 text-muted-foreground" />}
                        {!isCritical && !isWeak && !noData && <CheckCircle2 className="h-4 w-4 text-[#1aa15c]" />}
                      </TableCell>
                      <TableCell className="font-medium">{team.teamName}</TableCell>
                      <TableCell className="text-center">
                        {score !== null ? (
                          <span className={`text-2xl font-bold ${scoreColor}`} data-testid={`text-score-${team.teamId}`}>
                            {score}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sem dados</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {scoreInfo ? (
                          <Badge variant={scoreInfo.variant} data-testid={`badge-level-${team.teamId}`}>
                            {scoreInfo.label}
                          </Badge>
                        ) : (
                          <Badge variant="outline">N/A</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {noData ? (
                          <span className="text-sm text-muted-foreground italic">
                            Equipe não submeteu análises ou mix de marketing
                          </span>
                        ) : team.alignmentIssues.length > 0 ? (
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {team.alignmentIssues.slice(0, 3).map((issue, idx) => (
                              <li key={idx} className="flex items-start gap-2" data-testid={`text-issue-${team.teamId}-${idx}`}>
                                <span className="text-destructive mt-0.5">•</span>
                                <span>{issue}</span>
                              </li>
                            ))}
                            {team.alignmentIssues.length > 3 && (
                              <li className="text-xs italic">
                                +{team.alignmentIssues.length - 3} outros problemas
                              </li>
                            )}
                          </ul>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">Nenhum problema detectado</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Legenda */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-2">
            <Badge variant="default">Excelente</Badge>
            <span>90-100</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">Bom</Badge>
            <span>70-89</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Médio</Badge>
            <span>50-69</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Fraco</Badge>
            <span>30-49</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">Crítico</Badge>
            <span>&lt;30</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
