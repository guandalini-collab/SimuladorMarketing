import { MarketEventCard } from "@/components/market-event-card";
import { KPICard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Minus, Users, Target, Zap, Activity, DollarSign, Package, Building2, Lightbulb, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Team, Class, MarketEvent } from "@shared/schema";

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function competitionBadgeClass(level?: string | null): string {
  switch (level) {
    case "muito_alta":
      return "bg-[#fde8e6] text-[#a3241c] border-transparent";
    case "alta":
      return "bg-[#ffe8d1] text-[#8a4b00] border-transparent";
    case "media":
      return "bg-[#eef2ff] text-[#1447e6] border-transparent";
    case "baixa":
      return "bg-[#e6f7ee] text-[#0f7a44] border-transparent";
    default:
      return "bg-[#eef2ff] text-[#1447e6] border-transparent";
  }
}

export default function Mercado() {
  const { data: team } = useQuery<Team>({
    queryKey: ["/api/team/current"],
  });

  const { data: currentClass } = useQuery<Class>({
    queryKey: ["/api/classes", team?.classId],
    enabled: !!team?.classId,
  });

  const { data: marketSector } = useQuery<any>({
    queryKey: ["/api/market/sectors", currentClass?.sector],
    enabled: !!currentClass?.sector,
  });

  const { data: marketEvents = [] } = useQuery<MarketEvent[]>({
    queryKey: ["/api/events/class", currentClass?.id],
    enabled: !!currentClass?.id,
    select: (data) => data.filter((event: MarketEvent) => event.active),
  });

  const { data: economicData, isLoading: loadingEconomic } = useQuery<any>({
    queryKey: ["/api/economic/latest"],
  });

  const { data: economicHistory = [] } = useQuery<any[]>({
    queryKey: ["/api/economic/history"],
    select: (data) => data.slice(0, 10).reverse().map((item: any) => ({
      data: new Date(item.date || item.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      taxa: item.exchangeRateUSD,
    })),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-accent font-bold">Análise de Mercado</h1>
        <p className="text-muted-foreground">
          Informações que podem influenciar suas decisões estratégicas
        </p>
      </div>

      {!currentClass?.sector && (
        <Alert>
          <AlertDescription>
            O professor ainda não configurou o setor de mercado para esta turma. As informações de mercado estarão disponíveis após a configuração.
          </AlertDescription>
        </Alert>
      )}

      {currentClass?.sector && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Tamanho do Mercado"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              notation: 'compact',
              compactDisplay: 'short'
            }).format(currentClass?.marketSize || 0)}
            icon={Target}
            description={`${(currentClass?.marketGrowthRate ?? 0) > 0 ? '+' : ''}${currentClass?.marketGrowthRate ?? 0}% vs ano anterior`}
            color="blue"
          />
          <KPICard
            title="Taxa de Crescimento"
            value={`${marketSector?.growthRate || currentClass?.marketGrowthRate}%`}
            icon={TrendingUp}
            description="Anual projetado"
            color="green"
          />
          <KPICard
            title="Consumidores Potenciais"
            value={new Intl.NumberFormat('pt-BR', {
              notation: 'compact',
              compactDisplay: 'short'
            }).format(currentClass?.targetConsumers || 0)}
            icon={Users}
            description="No mercado-alvo"
            color="violet"
          />
          <KPICard
            title="Concorrência"
            value={capitalizeFirst(marketSector?.competitionLevel || currentClass?.competitionLevel || 'Média')}
            icon={Activity}
            description="Nível de intensidade"
            color="orange"
          />
        </div>
      )}

      {marketEvents.length > 0 && (
        <Card>
          <CardHeader className="bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#ff8c1a] flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Eventos de Mercado Ativos</CardTitle>
                <CardDescription>
                  Eventos que podem influenciar suas decisões nesta rodada
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {marketEvents.map((event, index) => (
                <MarketEventCard 
                  key={event.id || index} 
                  type={event.type}
                  title={event.title}
                  description={event.description}
                  impact={event.impact}
                  severity={event.severity as "baixo" | "medio" | "alto" | "critico"}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={currentClass?.sector ? "setor" : "economia"} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setor" data-testid="tab-setor" disabled={!currentClass?.sector}>
            Setor
          </TabsTrigger>
          <TabsTrigger value="concorrencia" data-testid="tab-concorrencia" disabled={!currentClass?.sector}>
            Concorrência
          </TabsTrigger>
          <TabsTrigger value="economia" data-testid="tab-economia">Economia</TabsTrigger>
        </TabsList>

        <TabsContent value="setor" className="space-y-6 mt-6">
          {marketSector ? (
            <>
              <Card>
                <CardHeader className="bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#2f2a8f] flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>{marketSector.name}</CardTitle>
                      <CardDescription>{marketSector.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tamanho do Setor</p>
                      <p className="text-lg font-bold">
                        {new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          notation: 'compact'
                        }).format(marketSector.marketSize)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Crescimento Anual</p>
                      <p className="text-lg font-bold">{marketSector.growthRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Margem Média</p>
                      <p className="text-lg font-bold">{marketSector.averageMargin}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#1447e6] flex items-center justify-center">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>Categorias de Produtos</CardTitle>
                      <CardDescription>Principais categorias disponíveis no setor</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-2 md:grid-cols-3">
                    {marketSector.categories?.map((category: any, idx: number) => (
                      <Badge key={idx} variant="secondary" className="justify-center py-2">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#1aa15c] flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle>Tendências do Setor</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-2">
                      {marketSector.trends?.map((trend: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#1aa15c] mt-1">•</span>
                          <span className="text-sm">{trend}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#ff8c1a] flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle>Desafios</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-2">
                      {marketSector.challenges?.map((challenge: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#e5352b] mt-1">•</span>
                          <span className="text-sm">{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#ffcc00] flex items-center justify-center">
                        <Lightbulb className="h-5 w-5 text-[#0a1830]" />
                      </div>
                      <CardTitle>Oportunidades</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-2">
                      {marketSector.opportunities?.map((opportunity: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#1aa15c] mt-1">•</span>
                          <span className="text-sm">{opportunity}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#7c3aed] flex items-center justify-center">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-base">Informações Adicionais</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tipo de Comércio</p>
                      <p className="text-base font-semibold capitalize">{currentClass?.businessType || 'Não definido'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nível de Concorrência</p>
                      <Badge className={competitionBadgeClass(marketSector.competitionLevel)}>
                        {marketSector.competitionLevel?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aguardando configuração do setor pelo professor...
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="concorrencia" className="space-y-6 mt-6">
          {currentClass ? (
            <>
              <Card>
                <CardHeader className="bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#7c3aed] flex items-center justify-center">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>Panorama Competitivo</CardTitle>
                      <CardDescription>
                        Análise do ambiente concorrencial do mercado
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="font-semibold text-sm mb-3">Estrutura de Mercado</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Nível de Concorrência</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={competitionBadgeClass(currentClass.competitionLevel)}>
                              {currentClass.competitionLevel === "baixa" ? "Baixa" :
                               currentClass.competitionLevel === "media" ? "Média" :
                               currentClass.competitionLevel === "alta" ? "Alta" :
                               currentClass.competitionLevel === "muito_alta" ? "Muito Alta" : "Média"}
                            </Badge>
                          </div>
                        </div>
                        
                        {currentClass.numberOfCompetitors !== undefined && currentClass.numberOfCompetitors !== null && currentClass.numberOfCompetitors > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Número de Concorrentes</p>
                            <p className="text-2xl font-bold mt-1">{currentClass.numberOfCompetitors}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {currentClass.numberOfCompetitors <= 3 ? "Mercado concentrado" :
                               currentClass.numberOfCompetitors <= 7 ? "Mercado moderadamente competitivo" :
                               currentClass.numberOfCompetitors <= 15 ? "Mercado competitivo" :
                               "Mercado altamente fragmentado"}
                            </p>
                          </div>
                        )}

                        {currentClass.marketConcentration && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Concentração de Mercado</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">
                                {currentClass.marketConcentration === "monopolio" ? "Monopólio" :
                                 currentClass.marketConcentration === "oligopolio" ? "Oligopólio" :
                                 currentClass.marketConcentration === "concorrencia_monopolistica" ? "Concorrência Monopolística" :
                                 currentClass.marketConcentration === "concorrencia_perfeita" ? "Concorrência Perfeita" : "-"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {currentClass.marketConcentration === "monopolio" && "Mercado dominado por um único player"}
                              {currentClass.marketConcentration === "oligopolio" && "Poucas empresas dominam o mercado"}
                              {currentClass.marketConcentration === "concorrencia_monopolistica" && "Muitos concorrentes com produtos diferenciados"}
                              {currentClass.marketConcentration === "concorrencia_perfeita" && "Produtos homogêneos e muitos concorrentes"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm mb-3">Análise dos Concorrentes</h3>
                      <div className="space-y-4">
                        {currentClass.competitorStrength && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Força dos Concorrentes</p>
                            <div className="mt-2">
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={
                                    currentClass.competitorStrength === "fraca" ? 25 :
                                    currentClass.competitorStrength === "media" ? 50 :
                                    currentClass.competitorStrength === "forte" ? 75 :
                                    currentClass.competitorStrength === "muito_forte" ? 100 : 50
                                  }
                                  className="flex-1"
                                />
                                <span className="text-sm font-medium capitalize">
                                  {currentClass.competitorStrength === "fraca" ? "Fraca" :
                                   currentClass.competitorStrength === "media" ? "Média" :
                                   currentClass.competitorStrength === "forte" ? "Forte" :
                                   currentClass.competitorStrength === "muito_forte" ? "Muito Forte" : "Média"}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {currentClass.competitorStrength === "fraca" && "Concorrentes com recursos limitados e baixa participação de mercado"}
                              {currentClass.competitorStrength === "media" && "Concorrentes com capacidade competitiva equilibrada"}
                              {currentClass.competitorStrength === "forte" && "Concorrentes estabelecidos com grande capacidade de resposta"}
                              {currentClass.competitorStrength === "muito_forte" && "Líderes de mercado com recursos significativos e alto poder de barganha"}
                            </p>
                          </div>
                        )}

                        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Implicações Estratégicas
                          </h4>
                          <ul className="space-y-2 text-xs text-muted-foreground">
                            {currentClass.competitionLevel === "baixa" && (
                              <>
                                <li className="flex items-start gap-2">
                                  <span className="text-primary mt-0.5">•</span>
                                  <span>Maior flexibilidade de preço e posicionamento</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-primary mt-0.5">•</span>
                                  <span>Oportunidade para construir marca forte</span>
                                </li>
                              </>
                            )}
                            {currentClass.competitionLevel === "alta" || currentClass.competitionLevel === "muito_alta" && (
                              <>
                                <li className="flex items-start gap-2">
                                  <span className="text-primary mt-0.5">•</span>
                                  <span>Diferenciação é crucial para destaque</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-primary mt-0.5">•</span>
                                  <span>Pressão sobre margens e necessidade de eficiência</span>
                                </li>
                              </>
                            )}
                            {currentClass.marketConcentration === "monopolio" && (
                              <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>Barreiras de entrada elevadas, dificulta novos entrantes</span>
                              </li>
                            )}
                            {currentClass.marketConcentration === "concorrencia_perfeita" && (
                              <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>Preço determinado pelo mercado, foco em volume e custo</span>
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <AlertDescription>
                Informações de concorrência não disponíveis. O professor precisa configurar o mercado.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="economia" className="space-y-6 mt-6">
          {loadingEconomic ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Carregando dados econômicos...
              </CardContent>
            </Card>
          ) : economicData ? (
            <>
              <div className="grid gap-6 md:grid-cols-3">
                <Card data-testid="card-exchange-rate">
                  <CardHeader className="bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#1aa15c] flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Câmbio USD/BRL</CardTitle>
                        <CardDescription>Taxa de câmbio atual</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold">
                      R$ {economicData.exchangeRateUSD?.toFixed(2) || "N/A"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Atualizado em {new Date(economicData.date || economicData.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#1447e6] flex items-center justify-center">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Tendência</CardTitle>
                        <CardDescription>Movimento do mercado</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      {economicData.analysis?.trend === "up" && (
                        <>
                          <TrendingUp className="h-8 w-8 text-[#1aa15c]" />
                          <div>
                            <p className="text-xl font-bold text-[#1aa15c]">Alta</p>
                            <p className="text-xs text-muted-foreground">Dólar valorizando</p>
                          </div>
                        </>
                      )}
                      {economicData.analysis?.trend === "down" && (
                        <>
                          <TrendingDown className="h-8 w-8 text-[#e5352b]" />
                          <div>
                            <p className="text-xl font-bold text-[#e5352b]">Queda</p>
                            <p className="text-xs text-muted-foreground">Dólar desvalorizando</p>
                          </div>
                        </>
                      )}
                      {economicData.analysis?.trend === "stable" && (
                        <>
                          <Minus className="h-8 w-8 text-[#1447e6]" />
                          <div>
                            <p className="text-xl font-bold text-[#1447e6]">Estável</p>
                            <p className="text-xs text-muted-foreground">Sem variações</p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#2f2a8f] flex items-center justify-center">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Condição Econômica</CardTitle>
                        <CardDescription>Análise de cenário</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <Badge
                      className={
                        economicData.analysis?.condition === "favorable"
                          ? "bg-[#e6f7ee] text-[#0f7a44] border-transparent text-base px-4 py-2"
                          : economicData.analysis?.condition === "unfavorable"
                          ? "bg-[#fde8e6] text-[#a3241c] border-transparent text-base px-4 py-2"
                          : "bg-[#eef2ff] text-[#1447e6] border-transparent text-base px-4 py-2"
                      }
                    >
                      {economicData.analysis?.condition === "favorable" && "Favorável"}
                      {economicData.analysis?.condition === "unfavorable" && "Desfavorável"}
                      {economicData.analysis?.condition === "neutral" && "Neutra"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-3">
                      {economicData.analysis?.condition === "favorable" &&
                        "Bom momento para investir e expandir"}
                      {economicData.analysis?.condition === "unfavorable" &&
                        "Momento de cautela e reservas"}
                      {economicData.analysis?.condition === "neutral" &&
                        "Cenário equilibrado, avaliar riscos"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {economicHistory.length > 0 && (
                <Card data-testid="card-economic-history">
                  <CardHeader className="bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#7c3aed] flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>Histórico de Câmbio (Últimos 10 registros)</CardTitle>
                        <CardDescription>Evolução da taxa USD/BRL</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={economicHistory}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="data" />
                        <YAxis domain={["auto", "auto"]} />
                        <Tooltip
                          formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Taxa"]}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="taxa"
                          stroke="#1447e6"
                          strokeWidth={2}
                          dot={{ fill: "#1447e6", r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#ff8c1a] flex items-center justify-center">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle>Impactos nas Decisões de Marketing</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-sm mb-2">Produto</p>
                      <p className="text-sm text-muted-foreground">
                        {economicData.analysis?.trend === "up" 
                          ? "Custos de importação podem aumentar. Considere fornecedores locais."
                          : economicData.analysis?.trend === "down"
                          ? "Oportunidade para produtos importados com melhor margem."
                          : "Mantenha equilíbrio entre fornecedores locais e importados."}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-2">Preço</p>
                      <p className="text-sm text-muted-foreground">
                        {economicData.analysis?.condition === "favorable"
                          ? "Consumidores mais dispostos a pagar. Considere preço premium."
                          : economicData.analysis?.condition === "unfavorable"
                          ? "Reduza preços ou ofereça promoções para manter volume."
                          : "Mantenha preços competitivos com flexibilidade para ajustes."}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-2">Praça</p>
                      <p className="text-sm text-muted-foreground">
                        Canais digitais são menos afetados por variações cambiais. 
                        Priorize e-commerce e marketplaces.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-2">Promoção</p>
                      <p className="text-sm text-muted-foreground">
                        {economicData.analysis?.condition === "favorable"
                          ? "Invista em branding e posicionamento de marca."
                          : economicData.analysis?.condition === "unfavorable"
                          ? "Foque em promoções de preço e descontos agressivos."
                          : "Equilibre investimentos entre branding e promoções."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Dados econômicos indisponíveis
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
            <CardHeader>
              <CardTitle>Tendências por Segmento</CardTitle>
            </CardHeader>
