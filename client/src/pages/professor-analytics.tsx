import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  Trophy, 
  TrendingUp, 
  Target,
  BarChart3,
  Award,
  Activity,
  CheckCircle2,
  Building2,
  DollarSign
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Analytics {
  classInfo: {
    id: string;
    name: string;
    sector: string;
    totalTeams: number;
    totalStudents: number;
    totalRounds: number;
    completedRounds: number;
    averageBudget: number;
  };
  kpiEvolution: Array<{
    roundNumber: number;
    roundId: string;
    avgProfit: number;
    avgRevenue: number;
    avgMarketShare: number;
    avgNPS: number;
    avgROI: number;
    teamsSubmitted: number;
  }>;
  rankings: {
    byProfit: Array<{
      teamId: string;
      teamName: string;
      companyName?: string;
      profit: number;
      marketShare: number;
      nps: number;
      roi: number;
      revenue: number;
      margin: number;
    }>;
    byMarketShare: Array<any>;
    byNPS: Array<any>;
    byROI: Array<any>;
  };
  engagement: {
    overall: {
      avgSubmissionRate: number;
      avgToolsCompleted: number;
    };
    byTeam: Array<{
      teamId: string;
      teamName: string;
      submissionRate: number;
      strategicToolsCompleted: number;
      totalMembers: number;
    }>;
  };
}

export default function ProfessorAnalytics({ classId }: { classId: string }) {
  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ["/api/professor/analytics", classId],
    enabled: !!classId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="skeleton-loading">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Alert data-testid="alert-no-data">
        <AlertDescription>
          Nenhum dado disponível para esta turma.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
          Analytics da Turma
        </h2>
        <p className="text-muted-foreground" data-testid="text-page-description">
          Acompanhe o desempenho e engajamento das equipes
        </p>
      </div>

      {/* Métricas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-teams">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Equipes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-total-teams">
              {analytics.classInfo.totalTeams}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.classInfo.totalStudents} estudantes
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-completed-rounds">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rodadas Completadas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-completed-rounds">
              {analytics.classInfo.completedRounds}
            </div>
            <p className="text-xs text-muted-foreground">
              de {analytics.classInfo.totalRounds} rodadas
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-submission-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Submissão</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-submission-rate">
              {analytics.engagement.overall.avgSubmissionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Média entre equipes
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-tools-completed">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ferramentas Concluídas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-tools-completed">
              {analytics.engagement.overall.avgToolsCompleted.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              de 4 ferramentas (média)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Evolução Temporal dos KPIs */}
      <Card data-testid="card-kpi-evolution">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução dos KPIs
          </CardTitle>
          <CardDescription>
            Desempenho médio das equipes ao longo das rodadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profit" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profit" data-testid="tab-profit">Lucro</TabsTrigger>
              <TabsTrigger value="marketShare" data-testid="tab-market-share">Market Share</TabsTrigger>
              <TabsTrigger value="nps" data-testid="tab-nps">NPS</TabsTrigger>
              <TabsTrigger value="roi" data-testid="tab-roi">ROI</TabsTrigger>
            </TabsList>

            <TabsContent value="profit" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.kpiEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="roundNumber" label={{ value: 'Rodada', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Lucro Médio (R$)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgProfit" stroke="hsl(var(--primary))" strokeWidth={2} name="Lucro Médio" />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="marketShare" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.kpiEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="roundNumber" label={{ value: 'Rodada', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Market Share (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgMarketShare" stroke="hsl(var(--primary))" strokeWidth={2} name="Market Share Médio" />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="nps" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.kpiEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="roundNumber" label={{ value: 'Rodada', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'NPS', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgNPS" stroke="hsl(var(--primary))" strokeWidth={2} name="NPS Médio" />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="roi" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.kpiEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="roundNumber" label={{ value: 'Rodada', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgROI" stroke="hsl(var(--primary))" strokeWidth={2} name="ROI Médio" />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Rankings */}
      <Card data-testid="card-rankings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Rankings
          </CardTitle>
          <CardDescription>
            Top equipes por diferentes métricas (última rodada completa)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profit" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profit" data-testid="tab-ranking-profit">Por Lucro</TabsTrigger>
              <TabsTrigger value="marketShare" data-testid="tab-ranking-market">Por Market Share</TabsTrigger>
              <TabsTrigger value="nps" data-testid="tab-ranking-nps">Por NPS</TabsTrigger>
              <TabsTrigger value="roi" data-testid="tab-ranking-roi">Por ROI</TabsTrigger>
            </TabsList>

            <TabsContent value="profit" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Posição</TableHead>
                    <TableHead>Equipe</TableHead>
                    <TableHead className="text-right">Lucro</TableHead>
                    <TableHead className="text-right">Margem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.rankings.byProfit.map((team, index) => (
                    <TableRow key={team.teamId} data-testid={`row-ranking-profit-${index}`}>
                      <TableCell>
                        <Badge variant={index === 0 ? "default" : "outline"}>
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{team.teamName}</TableCell>
                      <TableCell className="text-right">R$ {team.profit.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{team.margin.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="marketShare" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Posição</TableHead>
                    <TableHead>Equipe</TableHead>
                    <TableHead className="text-right">Market Share</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.rankings.byMarketShare.map((team, index) => (
                    <TableRow key={team.teamId} data-testid={`row-ranking-market-${index}`}>
                      <TableCell>
                        <Badge variant={index === 0 ? "default" : "outline"}>
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{team.teamName}</TableCell>
                      <TableCell className="text-right">{team.marketShare.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">R$ {team.revenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="nps" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Posição</TableHead>
                    <TableHead>Equipe</TableHead>
                    <TableHead className="text-right">NPS</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.rankings.byNPS.map((team, index) => (
                    <TableRow key={team.teamId} data-testid={`row-ranking-nps-${index}`}>
                      <TableCell>
                        <Badge variant={index === 0 ? "default" : "outline"}>
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{team.teamName}</TableCell>
                      <TableCell className="text-right">{team.nps.toFixed(0)}</TableCell>
                      <TableCell className="text-right">R$ {team.profit.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="roi" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Posição</TableHead>
                    <TableHead>Equipe</TableHead>
                    <TableHead className="text-right">ROI</TableHead>
                    <TableHead className="text-right">Margem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.rankings.byROI.map((team, index) => (
                    <TableRow key={team.teamId} data-testid={`row-ranking-roi-${index}`}>
                      <TableCell>
                        <Badge variant={index === 0 ? "default" : "outline"}>
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{team.teamName}</TableCell>
                      <TableCell className="text-right">{team.roi.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{team.margin.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Engajamento das Equipes */}
      <Card data-testid="card-engagement">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Engajamento das Equipes
          </CardTitle>
          <CardDescription>
            Taxa de submissão e conclusão de ferramentas estratégicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipe</TableHead>
                <TableHead className="text-center">Membros</TableHead>
                <TableHead className="text-right">Taxa de Submissão</TableHead>
                <TableHead className="text-right">Ferramentas Concluídas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.engagement.byTeam.map((team) => (
                <TableRow key={team.teamId} data-testid={`row-engagement-${team.teamId}`}>
                  <TableCell className="font-medium">{team.teamName}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{team.totalMembers}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={team.submissionRate >= 80 ? "default" : team.submissionRate >= 50 ? "secondary" : "outline"}>
                      {team.submissionRate.toFixed(0)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={team.strategicToolsCompleted === 4 ? "default" : "outline"}>
                      {team.strategicToolsCompleted}/4
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
