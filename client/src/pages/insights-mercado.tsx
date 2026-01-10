import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, TrendingUp, Target, Users, Lightbulb, BarChart3, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

interface Team {
  id: string;
  name: string;
  classId: string;
  budget: number;
}

interface ClassData {
  id: string;
  name: string;
  sector: string;
  businessType: string;
  marketSize: number;
  targetConsumers: number;
  competitionLevel: string;
  competitorStrength: string;
  currentRound: number;
}

interface Result {
  id: string;
  teamId: string;
  roundId: string;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  marketShare: number;
  roi: number;
  brandPerception: number;
  customerSatisfaction: number;
  customerLoyalty: number;
  cac: number;
  ltv: number;
  taxaConversao: number;
  ticketMedio: number;
  razaoLtvCac: number;
  nps: number;
  tempoMedioConversao: number;
  margemContribuicao: number;
  receitaBruta: number;
  receitaLiquida: number;
  calculatedAt: string;
}

interface Round {
  id: string;
  roundNumber: number;
  classId: string;
  status: string;
}

interface MarketInsights {
  sectorInfo: {
    name: string;
    description: string;
    averageMargin: number;
    growthTrend: string;
    mainChallenges: string[];
    opportunities: string[];
  };
  teamPerformance: {
    profitabilityLevel: string;
    efficiencyLevel: string;
    customerEngagementLevel: string;
    marketPositionLevel: string;
  };
  competitiveAnalysis: {
    marketSharePosition: string;
    pricePositioning: string;
    brandStrength: string;
  };
  recommendations: {
    priority: string;
    category: string;
    title: string;
    description: string;
    actionableSteps?: string[];
    expectedImpact?: string;
  }[];
}

export default function InsightsMercado() {
  const { data: team, isLoading: teamLoading } = useQuery<Team>({
    queryKey: ["/api/team/current"],
  });

  const { data: classData, isLoading: classLoading } = useQuery<ClassData>({
    queryKey: ["/api/classes", team?.classId],
    enabled: !!team?.classId,
  });

  const { data: rounds, isLoading: roundsLoading } = useQuery<Round[]>({
    queryKey: ["/api/rounds"],
    enabled: !!team,
  });

  const { data: teamResults, isLoading: resultsLoading } = useQuery<Result[]>({
    queryKey: ["/api/results/team", team?.id],
    enabled: !!team,
  });

  const { data: insights, isLoading: insightsLoading } = useQuery<MarketInsights>({
    queryKey: ["/api/insights/market", team?.id],
    enabled: !!team,
  });

  const completedRounds = rounds?.filter(r => r.status === "completed") || [];
  const lastCompletedRound = completedRounds[completedRounds.length - 1];
  const currentResult = teamResults?.find(r => r.roundId === lastCompletedRound?.id);

  if (teamLoading || classLoading || roundsLoading || resultsLoading || insightsLoading) {
    return (
      <div className="space-y-6" data-testid="skeleton-loading">
        <div>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!currentResult && completedRounds.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-accent font-bold">Insights de Mercado</h1>
          <p className="text-muted-foreground">
            Análise do setor, tendências e recomendações estratégicas
          </p>
        </div>
        <Alert data-testid="alert-no-results">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Os insights de mercado estarão disponíveis após a conclusão da primeira rodada.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-accent font-bold">Insights de Mercado</h1>
          <p className="text-muted-foreground">
            Carregando análises do mercado...
          </p>
        </div>
        <Alert data-testid="alert-loading">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Aguarde enquanto geramos os insights personalizados para sua equipe.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const sectorData = [
    { metric: "Margem", value: currentResult?.margin || 0, benchmark: insights.sectorInfo.averageMargin },
    { metric: "ROI", value: Math.min(currentResult?.roi || 0, 100), benchmark: 40 },
    { metric: "Market Share", value: currentResult?.marketShare || 0, benchmark: 25 },
    { metric: "Satisfação", value: currentResult?.customerSatisfaction || 0, benchmark: 70 },
    { metric: "NPS", value: ((currentResult?.nps || 0) + 100) / 2, benchmark: 60 },
  ];

  const performanceComparison = [
    {
      category: "Sua Equipe",
      margem: currentResult?.margin || 0,
      roi: Math.min(currentResult?.roi || 0, 150),
      marketShare: currentResult?.marketShare || 0,
    },
    {
      category: "Média do Setor",
      margem: insights.sectorInfo.averageMargin,
      roi: 40,
      marketShare: 25,
    },
  ];

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "excelente":
        return <Badge className="bg-green-600 hover:bg-green-700" data-testid="badge-excellent">Excelente</Badge>;
      case "bom":
        return <Badge className="bg-blue-600 hover:bg-blue-700" data-testid="badge-good">Bom</Badge>;
      case "regular":
        return <Badge className="bg-yellow-600 hover:bg-yellow-700" data-testid="badge-regular">Regular</Badge>;
      case "baixo":
        return <Badge className="bg-red-600 hover:bg-red-700" data-testid="badge-low">Baixo</Badge>;
      default:
        return <Badge data-testid="badge-neutral">Neutro</Badge>;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "alta":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "media":
        return <Target className="h-5 w-5 text-yellow-600" />;
      case "baixa":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-accent font-bold" data-testid="heading-market-insights">Insights de Mercado</h1>
        <p className="text-muted-foreground">
          Análise do setor {insights.sectorInfo.name} e recomendações personalizadas
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="card-sector-info">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Informações do Setor
            </CardTitle>
            <CardDescription>{insights.sectorInfo.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2" data-testid="text-sector-description">
                {insights.sectorInfo.description}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Margem Média</p>
                <p className="text-2xl font-bold text-chart-1" data-testid="text-sector-margin">
                  {insights.sectorInfo.averageMargin.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Tendência</p>
                <Badge variant="outline" className="mt-1" data-testid="badge-growth-trend">
                  {insights.sectorInfo.growthTrend}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Principais Desafios</p>
              <ul className="space-y-1">
                {insights.sectorInfo.mainChallenges.map((challenge, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2" data-testid={`text-challenge-${index}`}>
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-yellow-600" />
                    {challenge}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Oportunidades</p>
              <ul className="space-y-1">
                {insights.sectorInfo.opportunities.map((opportunity, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2" data-testid={`text-opportunity-${index}`}>
                    <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                    {opportunity}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-team-performance">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance da Equipe
            </CardTitle>
            <CardDescription>Avaliação em relação ao mercado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div data-testid="metric-profitability">
                <p className="text-sm text-muted-foreground mb-1">Lucratividade</p>
                {getLevelBadge(insights.teamPerformance.profitabilityLevel)}
              </div>
              <div data-testid="metric-efficiency">
                <p className="text-sm text-muted-foreground mb-1">Eficiência</p>
                {getLevelBadge(insights.teamPerformance.efficiencyLevel)}
              </div>
              <div data-testid="metric-engagement">
                <p className="text-sm text-muted-foreground mb-1">Engajamento</p>
                {getLevelBadge(insights.teamPerformance.customerEngagementLevel)}
              </div>
              <div data-testid="metric-market-position">
                <p className="text-sm text-muted-foreground mb-1">Posição de Mercado</p>
                {getLevelBadge(insights.teamPerformance.marketPositionLevel)}
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Análise Competitiva</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Market Share</span>
                  <span className="text-sm font-medium" data-testid="text-market-position">
                    {insights.competitiveAnalysis.marketSharePosition}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Precificação</span>
                  <span className="text-sm font-medium" data-testid="text-price-positioning">
                    {insights.competitiveAnalysis.pricePositioning}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Força da Marca</span>
                  <span className="text-sm font-medium" data-testid="text-brand-strength">
                    {insights.competitiveAnalysis.brandStrength}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="card-sector-comparison">
          <CardHeader>
            <CardTitle>Comparação com o Setor</CardTitle>
            <CardDescription>Sua performance vs. média do mercado</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={sectorData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar
                  name="Sua Equipe"
                  dataKey="value"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Benchmark Setor"
                  dataKey="benchmark"
                  stroke="hsl(var(--chart-2))"
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.3}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-testid="card-comparative-indicators">
          <CardHeader>
            <CardTitle>Indicadores Comparativos</CardTitle>
            <CardDescription>Margem, ROI e Market Share</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceComparison}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="margem" fill="hsl(var(--chart-1))" name="Margem (%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="roi" fill="hsl(var(--chart-2))" name="ROI (%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="marketShare" fill="hsl(var(--chart-3))" name="Market Share (%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-recommendations" className="border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Recomendações Estratégicas
            </CardTitle>
            <Badge className="bg-primary/90 hover:bg-primary" data-testid="badge-ai-generated">
              <span className="mr-1">✨</span> Gerado por IA
            </Badge>
          </div>
          <CardDescription>
            Ações priorizadas e acionáveis para melhorar sua performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.recommendations.map((rec, index) => (
              <div 
                key={index} 
                className="border rounded-lg p-5 hover-elevate" 
                data-testid={`recommendation-${index}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getPriorityIcon(rec.priority)}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-base" data-testid={`text-recommendation-title-${index}`}>
                        {rec.title}
                      </h4>
                      <Badge variant="outline" className="text-xs" data-testid={`badge-category-${index}`}>
                        {rec.category}
                      </Badge>
                      <Badge 
                        className={
                          rec.priority === "alta" ? "bg-red-600 hover:bg-red-700" :
                          rec.priority === "media" ? "bg-yellow-600 hover:bg-yellow-700" :
                          "bg-green-600 hover:bg-green-700"
                        }
                        data-testid={`badge-priority-${index}`}
                      >
                        {rec.priority === "alta" ? "Alta" : rec.priority === "media" ? "Média" : "Baixa"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid={`text-recommendation-description-${index}`}>
                      {rec.description}
                    </p>
                    
                    {rec.actionableSteps && rec.actionableSteps.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium mb-2 flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          Passos Acionáveis:
                        </p>
                        <ul className="space-y-1">
                          {rec.actionableSteps.map((step, stepIndex) => (
                            <li 
                              key={stepIndex} 
                              className="text-xs text-muted-foreground flex items-start gap-2"
                              data-testid={`text-step-${index}-${stepIndex}`}
                            >
                              <span className="text-primary mt-0.5">•</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {rec.expectedImpact && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium mb-1 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Impacto Esperado:
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`text-impact-${index}`}>
                          {rec.expectedImpact}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
