import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { TrendingUp, DollarSign, TrendingDown, Award, Users, Heart, Target, Sparkles, Percent, ShoppingCart, TrendingUpDown, Star, Clock, BarChart3, Coins, Download, FileSpreadsheet, Building2, ChevronDown, Wallet, Receipt, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { KPICard } from "@/components/kpi-card";
import { AlignmentScoreCard } from "@/components/alignment-score-card";
import { BcgMatrixChart } from "@/components/bcg-matrix-chart";
import { AiFeedbackCard } from "@/components/ai-feedback-card";
import { DeterministicFeedbackCard } from "@/components/deterministic-feedback-card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import * as XLSX from 'xlsx';
import { useState } from "react";

interface Team {
  id: string;
  name: string;
  classId: string;
  budget: number;
}

interface Round {
  id: string;
  roundNumber: number;
  classId: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
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
  // DRE Completa
  impostos: number;
  devolucoes: number;
  descontos: number;
  cpv: number;
  lucroBruto: number;
  despesasVendas: number;
  despesasAdmin: number;
  despesasFinanc: number;
  outrasDespesas: number;
  ebitda: number;
  depreciacao: number;
  lair: number;
  irCsll: number;
  lucroLiquido: number;
  // Balanço Patrimonial - Ativo
  caixa: number;
  contasReceber: number;
  estoques: number;
  ativoCirculante: number;
  imobilizado: number;
  intangivel: number;
  ativoNaoCirculante: number;
  ativoTotal: number;
  // Balanço Patrimonial - Passivo + PL
  fornecedores: number;
  obrigFiscais: number;
  outrasObrig: number;
  passivoCirculante: number;
  financiamentosLP: number;
  passivoNaoCirculante: number;
  capitalSocial: number;
  lucrosAcumulados: number;
  patrimonioLiquido: number;
  passivoPlTotal: number;
  // Outros campos
  budgetBefore: number;
  profitImpact: number;
  budgetAfter: number;
  alignmentScore: number | null;
  alignmentIssues: string[] | null;
  financialBreakdown: unknown;
}

interface ProductResult {
  id: string;
  teamId: string;
  roundId: string;
  productId: string;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  marketShare: number;
  roi: number;
  brandPerception: number;
  customerSatisfaction: number;
  customerLoyalty: number;
}

export default function Analises() {
  const [selectedView, setSelectedView] = useState<'consolidado' | 'produtos'>('consolidado');
  
  const { data: team, isLoading: teamLoading } = useQuery<Team>({
    queryKey: ["/api/team/current"],
  });

  const { data: rounds, isLoading: roundsLoading } = useQuery<Round[]>({
    queryKey: ["/api/rounds"],
    enabled: !!team,
  });

  const { data: teamResults, isLoading: resultsLoading } = useQuery<Result[]>({
    queryKey: ["/api/results/team", team?.id],
    enabled: !!team,
  });

  const completedRounds = rounds?.filter(r => r.status === "completed") || [];
  const lastCompletedRound = completedRounds[completedRounds.length - 1];

  const currentResult = teamResults?.find(r => r.roundId === lastCompletedRound?.id);

  const { data: productResults, isLoading: productResultsLoading } = useQuery<ProductResult[]>({
    queryKey: [`/api/results/team/${team?.id}/round/${lastCompletedRound?.id}/products`],
    enabled: !!team && !!lastCompletedRound,
  });

  const evolutionData = teamResults?.map((result, index) => {
    const round = rounds?.find(r => r.id === result.roundId);
    return {
      rodada: `R${round?.roundNumber || index + 1}`,
      receita: result.revenue,
      lucro: result.profit,
      marketShare: result.marketShare,
      roi: result.roi,
      custos: result.costs,
      margem: result.margin,
    };
  }) || [];

  const brandData = currentResult ? [
    { metric: "Percepção de Marca", value: currentResult.brandPerception },
    { metric: "Satisfação", value: currentResult.customerSatisfaction },
    { metric: "Fidelização", value: currentResult.customerLoyalty },
    { metric: "Market Share", value: currentResult.marketShare },
    { metric: "ROI", value: Math.min(currentResult.roi, 100) },
  ] : [];

  // Função para exportar dados financeiros completos para Excel
  const exportToExcel = () => {
    if (!currentResult || !team) return;

    // Usar campos reais calculados pelo backend
    const impostos = currentResult.impostos || 0;
    const devolucoes = currentResult.devolucoes || 0;
    const descontos = currentResult.descontos || 0;
    const cpv = currentResult.cpv || 0;
    const lucroBruto = currentResult.lucroBruto || 0;
    const despesasVendas = currentResult.despesasVendas || 0;
    const despesasAdmin = currentResult.despesasAdmin || 0;
    const despesasFinanc = currentResult.despesasFinanc || 0;
    const outrasDespesas = currentResult.outrasDespesas || 0;
    const ebitda = currentResult.ebitda || 0;
    const depreciacao = currentResult.depreciacao || 0;
    const lair = currentResult.lair || 0;
    const irCsll = currentResult.irCsll || 0;
    const lucroLiquido = currentResult.lucroLiquido || 0;

    // Balanço Patrimonial - Campos reais do backend
    const caixaEquiv = currentResult.caixa || 0;
    const contasReceber = currentResult.contasReceber || 0;
    const estoques = currentResult.estoques || 0;
    const ativoCirculante = currentResult.ativoCirculante || 0;
    const imobilizado = currentResult.imobilizado || 0;
    const intangivel = currentResult.intangivel || 0;
    const ativoNaoCirculante = currentResult.ativoNaoCirculante || 0;
    const ativoTotal = currentResult.ativoTotal || 0;
    
    const fornecedores = currentResult.fornecedores || 0;
    const obrigFiscais = currentResult.obrigFiscais || 0;
    const outrasObrig = currentResult.outrasObrig || 0;
    const passivoCirculante = currentResult.passivoCirculante || 0;
    const financiamentosLP = currentResult.financiamentosLP || 0;
    const passivoNaoCirculante = currentResult.passivoNaoCirculante || 0;
    const capitalSocial = currentResult.capitalSocial || 0;
    const lucrosAcum = currentResult.lucrosAcumulados || 0;
    const patrimonioLiquido = currentResult.patrimonioLiquido || 0;

    // DRE Completa
    const dreData = [
      ['DRE COMPLETA - DEMONSTRATIVO DO RESULTADO DO EXERCÍCIO', '', ''],
      ['Equipe: ' + team.name, '', ''],
      ['Rodada: ' + (lastCompletedRound?.roundNumber || ''), '', ''],
      ['Data: ' + new Date().toLocaleDateString('pt-BR'), '', ''],
      [''],
      ['Item', 'Valor (R$)', '% Receita'],
      ['RECEITA OPERACIONAL BRUTA', currentResult.receitaBruta.toFixed(2), '100.0%'],
      ['(-) Impostos sobre Vendas', impostos.toFixed(2), (currentResult.receitaBruta > 0 ? (impostos/currentResult.receitaBruta*100).toFixed(1) : '0.0') + '%'],
      ['(-) Devoluções e Cancelamentos', devolucoes.toFixed(2), (currentResult.receitaBruta > 0 ? (devolucoes/currentResult.receitaBruta*100).toFixed(1) : '0.0') + '%'],
      ['(-) Descontos Concedidos', descontos.toFixed(2), (currentResult.receitaBruta > 0 ? (descontos/currentResult.receitaBruta*100).toFixed(1) : '0.0') + '%'],
      ['(=) RECEITA OPERACIONAL LÍQUIDA', currentResult.receitaLiquida.toFixed(2), (currentResult.receitaBruta > 0 ? (currentResult.receitaLiquida/currentResult.receitaBruta*100).toFixed(1) : '0.0') + '%'],
      ['(-) Custo dos Produtos Vendidos (CPV)', cpv.toFixed(2), (currentResult.receitaBruta > 0 ? (cpv/currentResult.receitaBruta*100).toFixed(1) : '0.0') + '%'],
      ['(=) LUCRO BRUTO', lucroBruto.toFixed(2), (currentResult.receitaBruta > 0 ? (lucroBruto/currentResult.receitaBruta*100).toFixed(1) : '0.0') + '%'],
      [''],
      ['DESPESAS OPERACIONAIS', '', ''],
      ['(-) Despesas com Vendas', despesasVendas.toFixed(2), (currentResult.receitaBruta > 0 ? (despesasVendas/currentResult.receitaBruta*100).toFixed(1) : '0.0') + '%'],
      ['(-) Despesas Administrativas', despesasAdmin.toFixed(2), (currentResult.receitaBruta > 0 ? (despesasAdmin/currentResult.receitaBruta*100).toFixed(1) : '0.0') + '%'],
      ['(-) Despesas Financeiras', despesasFinanc.toFixed(2), (currentResult.receitaBruta > 0 ? (despesasFinanc/currentResult.receitaBruta*100).toFixed(1) : '0.0') + '%'],
      ['(-) Outras Despesas Operacionais', outrasDespesas.toFixed(2), (currentResult.receitaBruta > 0 ? (outrasDespesas/currentResult.receitaBruta*100).toFixed(1) : '0.0') + '%'],
      [''],
      ['(=) EBITDA', ebitda.toFixed(2), (currentResult.receitaBruta > 0 ? (ebitda/currentResult.receitaBruta*100).toFixed(1) : '0.0') + '%'],
      ['(-) Depreciação e Amortização', depreciacao.toFixed(2), (currentResult.receitaBruta > 0 ? (depreciacao/currentResult.receitaBruta*100).toFixed(1) : '0.0') + '%'],
      ['(=) LAIR (Lucro Antes do IR)', lair.toFixed(2), (currentResult.receitaBruta > 0 ? (lair/currentResult.receitaBruta*100).toFixed(1) : '0.0') + '%'],
      ['(-) IR e CSLL', irCsll.toFixed(2), (currentResult.receitaBruta > 0 && currentResult.profit > 0 ? (irCsll/currentResult.receitaBruta*100).toFixed(1) : '0.0') + '%'],
      ['(=) LUCRO LÍQUIDO DO EXERCÍCIO', lucroLiquido.toFixed(2), (currentResult.receitaBruta > 0 ? (lucroLiquido/currentResult.receitaBruta*100).toFixed(1) : '0.0') + '%'],
    ];

    // Balanço Patrimonial
    const balancoData = [
      ['BALANÇO PATRIMONIAL', ''],
      ['Equipe: ' + team.name, ''],
      ['Rodada: ' + (lastCompletedRound?.roundNumber || ''), ''],
      ['Data: ' + new Date().toLocaleDateString('pt-BR'), ''],
      [''],
      ['ATIVO', 'Valor (R$)'],
      ['ATIVO CIRCULANTE', ativoCirculante.toFixed(2)],
      ['  Caixa e Equivalentes', caixaEquiv.toFixed(2)],
      ['  Contas a Receber', contasReceber.toFixed(2)],
      ['  Estoques', estoques.toFixed(2)],
      [''],
      ['ATIVO NÃO CIRCULANTE', ativoNaoCirculante.toFixed(2)],
      ['  Imobilizado', imobilizado.toFixed(2)],
      ['  Intangível (Marcas)', intangivel.toFixed(2)],
      [''],
      ['TOTAL DO ATIVO', ativoTotal.toFixed(2)],
      [''],
      ['PASSIVO + PATRIMÔNIO LÍQUIDO', 'Valor (R$)'],
      ['PASSIVO CIRCULANTE', passivoCirculante.toFixed(2)],
      ['  Fornecedores', fornecedores.toFixed(2)],
      ['  Obrigações Fiscais', obrigFiscais.toFixed(2)],
      ['  Outras Obrigações', outrasObrig.toFixed(2)],
      [''],
      ['PASSIVO NÃO CIRCULANTE', passivoNaoCirculante.toFixed(2)],
      ['  Financiamentos LP', financiamentosLP.toFixed(2)],
      [''],
      ['PATRIMÔNIO LÍQUIDO', patrimonioLiquido.toFixed(2)],
      ['  Capital Social', capitalSocial.toFixed(2)],
      ['  Lucros Acumulados', lucrosAcum.toFixed(2)],
      [''],
      ['TOTAL PASSIVO + PL', ativoTotal.toFixed(2)],
      [''],
      ['EQUAÇÃO PATRIMONIAL: ATIVO = PASSIVO + PL', ''],
      ['Verificação: ' + (Math.abs(ativoTotal - (passivoCirculante + passivoNaoCirculante + patrimonioLiquido)) < 0.01 ? 'EQUILIBRADO ✓' : 'DESEQUILIBRADO ✗'), ''],
    ];

    // KPIs
    const kpisData = [
      ['PRINCIPAIS KPIs', 'Valor'],
      ['ROI (%)', currentResult.roi.toFixed(2)],
      ['Margem Bruta (%)', currentResult.margin.toFixed(2)],
      ['Margem de Contribuição (%)', currentResult.margemContribuicao.toFixed(2)],
      ['CAC (R$)', currentResult.cac.toFixed(2)],
      ['LTV (R$)', currentResult.ltv.toFixed(2)],
      ['Razão LTV/CAC', currentResult.razaoLtvCac.toFixed(2)],
      ['Taxa de Conversão (%)', currentResult.taxaConversao.toFixed(2)],
      ['Ticket Médio (R$)', currentResult.ticketMedio.toFixed(2)],
      ['Market Share (%)', currentResult.marketShare.toFixed(2)],
      ['Percepção de Marca', currentResult.brandPerception.toFixed(1)],
      ['Satisfação do Cliente', currentResult.customerSatisfaction.toFixed(1)],
      ['Fidelização', currentResult.customerLoyalty.toFixed(1)],
    ];

    // Criar worksheets
    const wsDRE = XLSX.utils.aoa_to_sheet(dreData);
    const wsBalanco = XLSX.utils.aoa_to_sheet(balancoData);
    const wsKPIs = XLSX.utils.aoa_to_sheet(kpisData);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsDRE, 'DRE Completa');
    XLSX.utils.book_append_sheet(wb, wsBalanco, 'Balanço Patrimonial');
    XLSX.utils.book_append_sheet(wb, wsKPIs, 'KPIs');
    
    XLSX.writeFile(wb, `Financeiro_Completo_${team.name}_R${lastCompletedRound?.roundNumber || 'atual'}.xlsx`);
  };

  if (teamLoading || roundsLoading || resultsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!currentResult && completedRounds.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-accent font-bold">Resultados e KPIs</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho da sua equipe
          </p>
        </div>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Ainda não há resultados disponíveis. Aguarde o professor encerrar a primeira rodada.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!currentResult) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-accent font-bold">Resultados e KPIs</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho da sua equipe
          </p>
        </div>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Você não submeteu decisões nesta rodada. Os resultados serão calculados apenas para equipes que submeteram suas decisões de marketing.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[#0a1830] via-[#0d2348] to-[#0a1830] p-8">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-20 w-32 h-32 border-4 border-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 left-20 w-40 h-40 border-4 border-white rounded-lg rotate-45 animate-pulse delay-75"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[#1aa15c] flex items-center justify-center shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                Resultados e KPIs
              </h1>
              <p className="text-white/80 text-lg mt-1">
                Rodada {lastCompletedRound?.roundNumber} - Resultados calculados automaticamente
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="kpis" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="kpis" data-testid="tab-kpis">KPIs e Desempenho</TabsTrigger>
          <TabsTrigger value="financeiros" data-testid="tab-financeiros">Demonstrativo Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="kpis" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
            <KPICard
              title="Receita"
              value={`R$ ${currentResult.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={DollarSign}
              testId="text-revenue"
              color="green"
            />
            <KPICard
              title="Lucro"
              value={`R$ ${currentResult.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              trend={{
                value: currentResult.margin,
                isPositive: currentResult.profit > 0,
              }}
              icon={currentResult.profit > 0 ? TrendingUp : TrendingDown}
              testId="text-profit"
              color="blue"
            />
            <KPICard
              title="Margem"
              value={`${currentResult.margin.toFixed(1)}%`}
              icon={TrendingUp}
              testId="text-margin"
              color="violet"
            />
            <KPICard
              title="ROI"
              value={`${currentResult.roi.toFixed(1)}%`}
              icon={Award}
              testId="text-roi"
              color="orange"
            />
            <KPICard
              title="Market Share"
              value={`${currentResult.marketShare.toFixed(1)}%`}
              icon={Users}
              testId="text-market-share"
              color="green"
            />
            <KPICard
              title="Fidelização"
              value={`${currentResult.customerLoyalty.toFixed(0)}/100`}
              icon={Heart}
              testId="text-loyalty"
              color="blue"
            />
          </div>

          {/* KPIs Completos - Seção Colapsável */}
          <Accordion type="single" collapsible className="w-full" data-testid="accordion-kpis-completos">
            <AccordionItem value="kpis-completos" className="border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline" data-testid="accordion-trigger-kpis-completos">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#2f2a8f] flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold">KPIs Completos</h3>
                    <p className="text-sm text-muted-foreground">Clientes, DRE e Balanço Patrimonial detalhados</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-6">
                  {/* Grupo: Clientes */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h4 className="text-base font-semibold">Indicadores de Clientes</h4>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="kpi-cac">
                        <p className="text-sm text-muted-foreground">CAC</p>
                        <p className="text-xl font-bold">
                          {(currentResult.cac ?? 0) > 0 
                            ? `R$ ${currentResult.cac.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                            : <span className="text-muted-foreground">R$ 0,00</span>}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="kpi-ltv">
                        <p className="text-sm text-muted-foreground">LTV</p>
                        <p className="text-xl font-bold">
                          {(currentResult.ltv ?? 0) > 0 
                            ? `R$ ${currentResult.ltv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                            : <span className="text-muted-foreground">R$ 0,00</span>}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="kpi-razao-ltv-cac">
                        <p className="text-sm text-muted-foreground">LTV/CAC</p>
                        <p className="text-xl font-bold">
                          {(currentResult.razaoLtvCac ?? 0) > 0 
                            ? currentResult.razaoLtvCac.toFixed(2) 
                            : <span className="text-muted-foreground">0,00</span>}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="kpi-taxa-conversao">
                        <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                        <p className="text-xl font-bold">
                          {(currentResult.taxaConversao ?? 0) > 0 
                            ? `${currentResult.taxaConversao.toFixed(1)}%` 
                            : <span className="text-muted-foreground">0,0%</span>}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="kpi-ticket-medio">
                        <p className="text-sm text-muted-foreground">Ticket Médio</p>
                        <p className="text-xl font-bold">
                          {(currentResult.ticketMedio ?? 0) > 0 
                            ? `R$ ${currentResult.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                            : <span className="text-muted-foreground">R$ 0,00</span>}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="kpi-nps">
                        <p className="text-sm text-muted-foreground">NPS</p>
                        <p className="text-xl font-bold">
                          {(currentResult.nps ?? 0) !== 0 
                            ? currentResult.nps.toFixed(0) 
                            : <span className="text-muted-foreground">0</span>}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="kpi-tempo-conversao">
                        <p className="text-sm text-muted-foreground">Tempo Médio Conversão</p>
                        <p className="text-xl font-bold">
                          {(currentResult.tempoMedioConversao ?? 0) > 0 
                            ? `${currentResult.tempoMedioConversao.toFixed(1)} dias` 
                            : <span className="text-muted-foreground">0 dias</span>}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Grupo: DRE */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-primary" />
                      <h4 className="text-base font-semibold">DRE - Demonstração do Resultado</h4>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="kpi-receita-bruta">
                        <p className="text-sm text-muted-foreground">Receita Bruta</p>
                        <p className="text-xl font-bold">
                          R$ {(currentResult.receitaBruta ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="kpi-impostos">
                        <p className="text-sm text-muted-foreground">(-) Impostos</p>
                        <p className="text-xl font-bold text-destructive">
                          R$ {(currentResult.impostos ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="kpi-receita-liquida">
                        <p className="text-sm text-muted-foreground">Receita Líquida</p>
                        <p className="text-xl font-bold">
                          R$ {(currentResult.receitaLiquida ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="kpi-cpv">
                        <p className="text-sm text-muted-foreground">(-) CPV</p>
                        <p className="text-xl font-bold text-destructive">
                          R$ {(currentResult.cpv ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="kpi-lucro-bruto">
                        <p className="text-sm text-muted-foreground">Lucro Bruto</p>
                        <p className={`text-xl font-bold ${(currentResult.lucroBruto ?? 0) >= 0 ? '' : 'text-destructive'}`}>
                          R$ {(currentResult.lucroBruto ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="kpi-despesas-vendas">
                        <p className="text-sm text-muted-foreground">(-) Desp. Vendas</p>
                        <p className="text-xl font-bold text-destructive">
                          R$ {(currentResult.despesasVendas ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="kpi-despesas-admin">
                        <p className="text-sm text-muted-foreground">(-) Desp. Admin</p>
                        <p className="text-xl font-bold text-destructive">
                          R$ {(currentResult.despesasAdmin ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="kpi-ebitda">
                        <p className="text-sm text-muted-foreground">EBITDA</p>
                        <p className={`text-xl font-bold ${(currentResult.ebitda ?? 0) >= 0 ? '' : 'text-destructive'}`}>
                          R$ {(currentResult.ebitda ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="kpi-depreciacao">
                        <p className="text-sm text-muted-foreground">(-) Depreciação</p>
                        <p className="text-xl font-bold text-destructive">
                          R$ {(currentResult.depreciacao ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="kpi-lair">
                        <p className="text-sm text-muted-foreground">LAIR</p>
                        <p className={`text-xl font-bold ${(currentResult.lair ?? 0) >= 0 ? '' : 'text-destructive'}`}>
                          R$ {(currentResult.lair ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="kpi-ir-csll">
                        <p className="text-sm text-muted-foreground">(-) IR/CSLL</p>
                        <p className="text-xl font-bold text-destructive">
                          R$ {(currentResult.irCsll ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary/20" data-testid="kpi-lucro-liquido">
                        <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                        <p className={`text-xl font-bold ${(currentResult.lucroLiquido ?? 0) >= 0 ? 'text-[#1aa15c]' : 'text-destructive'}`}>
                          R$ {(currentResult.lucroLiquido ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Grupo: Balanço Patrimonial */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Scale className="h-5 w-5 text-primary" />
                      <h4 className="text-base font-semibold">Balanço Patrimonial</h4>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Ativo */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Ativo</h5>
                        <div className="space-y-2">
                          <div className="p-3 rounded-lg bg-muted/50 flex justify-between" data-testid="kpi-caixa">
                            <span className="text-sm">Caixa</span>
                            <span className="font-semibold">R$ {(currentResult.caixa ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 flex justify-between" data-testid="kpi-contas-receber">
                            <span className="text-sm">Contas a Receber</span>
                            <span className="font-semibold">R$ {(currentResult.contasReceber ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 flex justify-between" data-testid="kpi-estoques">
                            <span className="text-sm">Estoques</span>
                            <span className="font-semibold">R$ {(currentResult.estoques ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-primary/5 flex justify-between border" data-testid="kpi-ativo-circulante">
                            <span className="text-sm font-medium">Ativo Circulante</span>
                            <span className="font-bold">R$ {(currentResult.ativoCirculante ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 flex justify-between" data-testid="kpi-imobilizado">
                            <span className="text-sm">Imobilizado</span>
                            <span className="font-semibold">R$ {(currentResult.imobilizado ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 flex justify-between" data-testid="kpi-intangivel">
                            <span className="text-sm">Intangível</span>
                            <span className="font-semibold">R$ {(currentResult.intangivel ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-primary/5 flex justify-between border" data-testid="kpi-ativo-nao-circulante">
                            <span className="text-sm font-medium">Ativo Não Circulante</span>
                            <span className="font-bold">R$ {(currentResult.ativoNaoCirculante ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-primary/10 flex justify-between border-2 border-primary/20" data-testid="kpi-ativo-total">
                            <span className="text-sm font-semibold">ATIVO TOTAL</span>
                            <span className="font-bold text-lg">R$ {(currentResult.ativoTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Passivo + PL */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Passivo + Patrimônio Líquido</h5>
                        <div className="space-y-2">
                          <div className="p-3 rounded-lg bg-muted/50 flex justify-between" data-testid="kpi-fornecedores">
                            <span className="text-sm">Fornecedores</span>
                            <span className="font-semibold">R$ {(currentResult.fornecedores ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 flex justify-between" data-testid="kpi-obrig-fiscais">
                            <span className="text-sm">Obrigações Fiscais</span>
                            <span className="font-semibold">R$ {(currentResult.obrigFiscais ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-primary/5 flex justify-between border" data-testid="kpi-passivo-circulante">
                            <span className="text-sm font-medium">Passivo Circulante</span>
                            <span className="font-bold">R$ {(currentResult.passivoCirculante ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 flex justify-between" data-testid="kpi-financiamentos-lp">
                            <span className="text-sm">Financiamentos LP</span>
                            <span className="font-semibold">R$ {(currentResult.financiamentosLP ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-primary/5 flex justify-between border" data-testid="kpi-passivo-nao-circulante">
                            <span className="text-sm font-medium">Passivo Não Circulante</span>
                            <span className="font-bold">R$ {(currentResult.passivoNaoCirculante ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 flex justify-between" data-testid="kpi-capital-social">
                            <span className="text-sm">Capital Social</span>
                            <span className="font-semibold">R$ {(currentResult.capitalSocial ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 flex justify-between" data-testid="kpi-lucros-acumulados">
                            <span className="text-sm">Lucros Acumulados</span>
                            <span className="font-semibold">R$ {(currentResult.lucrosAcumulados ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-primary/5 flex justify-between border" data-testid="kpi-patrimonio-liquido">
                            <span className="text-sm font-medium">Patrimônio Líquido</span>
                            <span className="font-bold">R$ {(currentResult.patrimonioLiquido ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-primary/10 flex justify-between border-2 border-primary/20" data-testid="kpi-passivo-pl-total">
                            <span className="text-sm font-semibold">PASSIVO + PL TOTAL</span>
                            <span className="font-bold text-lg">R$ {(currentResult.passivoPlTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Strategic Alignment Score - Highlighted Section */}
          {team && lastCompletedRound && (
            <AlignmentScoreCard teamId={team.id} roundId={lastCompletedRound.id} />
          )}

          {/* Multi-Product Results Section */}
          {productResultsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-64" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </div>
            </div>
          ) : productResults && productResults.length > 0 ? (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#7c3aed] flex items-center justify-center">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Desempenho por Produto</h2>
                    <p className="text-muted-foreground">Comparação entre os {productResults.length} produtos da sua linha</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {productResults.map((product, index) => {
                    const productName = product.productId.charAt(0).toUpperCase() + product.productId.slice(1);
                    return (
                      <Card key={product.id} className="border-2" data-testid={`card-product-result-${index}`}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg capitalize flex items-center gap-2">
                            <span data-testid={`text-product-name-${index}`}>{productName}</span>
                            <Badge 
                              variant={product.profit > 0 ? "default" : "destructive"} 
                              className="ml-auto"
                              data-testid={`badge-product-status-${index}`}
                            >
                              {product.profit > 0 ? "Lucrativo" : "Prejuízo"}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Receita</p>
                              <p className="font-semibold" data-testid={`text-product-revenue-${index}`}>
                                R$ {product.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Lucro</p>
                              <p 
                                className={`font-semibold ${product.profit > 0 ? 'text-[#1aa15c]' : 'text-destructive'}`}
                                data-testid={`text-product-profit-${index}`}
                              >
                                R$ {product.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">ROI</p>
                              <p className="font-semibold" data-testid={`text-product-roi-${index}`}>
                                {product.roi.toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Margem</p>
                              <p className="font-semibold" data-testid={`text-product-margin-${index}`}>
                                {product.margin.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <Card className="border-2 border-slate-200 dark:border-slate-800" data-testid="card-products-comparison">
                <CardHeader className="bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#1aa15c] flex items-center justify-center">
                      <Coins className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle>Comparação Financeira entre Produtos</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={productResults.map(p => ({
                      produto: p.productId.charAt(0).toUpperCase() + p.productId.slice(1),
                      receita: p.revenue,
                      custos: p.costs,
                      lucro: p.profit,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="produto" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                      <Legend />
                      <Bar dataKey="receita" fill="#1447e6" name="Receita" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="custos" fill="#ff8c1a" name="Custos" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lucro" fill="#1aa15c" name="Lucro" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : null}

          {/* BCG Matrix Visualization */}
          {team && lastCompletedRound && (
            <BcgMatrixChart teamId={team.id} roundId={lastCompletedRound.id} />
          )}

          {/* Feedback Automático Determinístico */}
          {team && lastCompletedRound && (
            <DeterministicFeedbackCard teamId={team.id} roundId={lastCompletedRound.id} />
          )}

          {/* AI Feedback (Gerado por LLM) */}
          {team && lastCompletedRound && (
            <AiFeedbackCard teamId={team.id} roundId={lastCompletedRound.id} />
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-2 border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#1447e6] flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle>Evolução Financeira</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {evolutionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={evolutionData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="rodada" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="receita"
                        stroke="#1447e6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Receita"
                      />
                      <Line
                        type="monotone"
                        dataKey="lucro"
                        stroke="#1aa15c"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Lucro"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Dados insuficientes para exibir evolução
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#7c3aed] flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle>Análise de Marca e Mercado</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={brandData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name="Desempenho"
                      dataKey="value"
                      stroke="#7c3aed"
                      fill="#7c3aed"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#2f2a8f] flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <CardTitle>Performance por Rodada</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {evolutionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="rodada" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="marketShare"
                      fill="#2f2a8f"
                      name="Market Share (%)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="roi"
                      fill="#ffcc00"
                      name="ROI (%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Dados insuficientes para exibir performance
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Percepção de Marca</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#1447e6]" data-testid="text-brand-perception">
                  {currentResult.brandPerception.toFixed(1)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">de 100 pontos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Satisfação do Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#1aa15c]" data-testid="text-satisfaction">
                  {currentResult.customerSatisfaction.toFixed(1)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">de 100 pontos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Custos Totais</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#ff8c1a]" data-testid="text-costs">
                  R$ {currentResult.costs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {team!.budget > 0 ? ((currentResult.costs / team!.budget) * 100).toFixed(1) : "0.0"}% do orçamento
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-accent font-bold">Indicadores de Cliente</h2>
              <p className="text-muted-foreground text-sm">
                Métricas de aquisição, valor e conversão de clientes
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
              <KPICard
                title="CAC"
                value={`R$ ${currentResult.cac.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                icon={Target}
                description="Custo de Aquisição por Cliente"
                testId="text-cac"
                color="green"
              />
              <KPICard
                title="LTV"
                value={`R$ ${currentResult.ltv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                icon={Sparkles}
                description="Lifetime Value do Cliente"
                testId="text-ltv"
                color="blue"
              />
              <KPICard
                title="Razão LTV/CAC"
                value={currentResult.razaoLtvCac.toFixed(2)}
                icon={TrendingUpDown}
                description={currentResult.razaoLtvCac >= 3 ? "Excelente!" : currentResult.razaoLtvCac >= 1 ? "Regular" : "Atenção"}
                trend={{
                  value: currentResult.razaoLtvCac,
                  isPositive: currentResult.razaoLtvCac >= 3,
                }}
                testId="text-ltv-cac-ratio"
                color="violet"
              />
              <KPICard
                title="Taxa de Conversão"
                value={`${currentResult.taxaConversao.toFixed(2)}%`}
                icon={Percent}
                description="Conversão de leads em clientes"
                testId="text-conversion-rate"
                color="orange"
              />
              <KPICard
                title="Ticket Médio"
                value={`R$ ${currentResult.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                icon={ShoppingCart}
                description="Valor médio por compra"
                testId="text-average-ticket"
                color="green"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-accent font-bold">Indicadores Avançados</h2>
              <p className="text-muted-foreground text-sm">
                Métricas de performance, receita e eficiência operacional
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="NPS"
                value={currentResult.nps.toFixed(0)}
                icon={Star}
                description="Net Promoter Score (-100 a +100)"
                trend={{
                  value: currentResult.nps,
                  isPositive: currentResult.nps >= 0,
                }}
                testId="text-nps"
                color="green"
              />
              <KPICard
                title="Tempo de Conversão"
                value={`${currentResult.tempoMedioConversao.toFixed(0)} dias`}
                icon={Clock}
                description="Tempo médio até fechar venda"
                testId="text-conversion-time"
                color="blue"
              />
              <KPICard
                title="Margem de Contribuição"
                value={`${currentResult.margemContribuicao.toFixed(1)}%`}
                icon={BarChart3}
                description="Margem após custos variáveis"
                trend={{
                  value: currentResult.margemContribuicao,
                  isPositive: currentResult.margemContribuicao >= 30,
                }}
                testId="text-contribution-margin"
                color="violet"
              />
              <KPICard
                title="Receita Líquida"
                value={`R$ ${currentResult.receitaLiquida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                icon={Coins}
                description={`Bruta: R$ ${currentResult.receitaBruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                testId="text-net-revenue"
                color="orange"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="financeiros" className="space-y-6 mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-accent font-bold">Demonstrativo Financeiro</h2>
              <p className="text-muted-foreground text-sm">
                DRE detalhada com breakdown de receitas, custos e investimentos
              </p>
            </div>
            <Button onClick={exportToExcel} variant="outline" data-testid="button-export-excel">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="lg:col-span-2 border-2 border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-muted/30">
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#1aa15c] flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  DRE Completa - Demonstrativo do Resultado do Exercício
                </CardTitle>
                <CardDescription>Estrutura contábil completa conforme práticas brasileiras</CardDescription>
              </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60%]">Item</TableHead>
                    <TableHead className="text-right">Valor (R$)</TableHead>
                    <TableHead className="text-right">% Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Receita Operacional Bruta */}
                  <TableRow className="font-semibold bg-blue-50 dark:bg-blue-950/20">
                    <TableCell>RECEITA OPERACIONAL BRUTA</TableCell>
                    <TableCell className="text-right" data-testid="text-receita-bruta">
                      {currentResult.receitaBruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">100,0%</TableCell>
                  </TableRow>
                  
                  {/* Deduções da Receita */}
                  <TableRow>
                    <TableCell className="pl-6">(-) Impostos sobre Vendas</TableCell>
                    <TableCell className="text-right text-red-500">
                      ({(currentResult.impostos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {currentResult.receitaBruta > 0 ? (((currentResult.impostos || 0) / currentResult.receitaBruta) * 100).toFixed(1) : '0.0'}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">(-) Devoluções e Cancelamentos</TableCell>
                    <TableCell className="text-right text-red-500">
                      ({(currentResult.devolucoes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {currentResult.receitaBruta > 0 ? (((currentResult.devolucoes || 0) / currentResult.receitaBruta) * 100).toFixed(1) : '0.0'}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">(-) Descontos Concedidos</TableCell>
                    <TableCell className="text-right text-red-500">
                      ({(currentResult.descontos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {currentResult.receitaBruta > 0 ? (((currentResult.descontos || 0) / currentResult.receitaBruta) * 100).toFixed(1) : '0.0'}%
                    </TableCell>
                  </TableRow>
                  
                  {/* Receita Líquida */}
                  <TableRow className="font-semibold bg-blue-50 dark:bg-blue-950/20 border-t">
                    <TableCell>(=) RECEITA OPERACIONAL LÍQUIDA</TableCell>
                    <TableCell className="text-right" data-testid="text-receita-liquida-dre">
                      {currentResult.receitaLiquida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {currentResult.receitaBruta > 0 ? ((currentResult.receitaLiquida / currentResult.receitaBruta) * 100).toFixed(1) : '0.0'}%
                    </TableCell>
                  </TableRow>
                  
                  {/* CPV */}
                  <TableRow>
                    <TableCell className="pl-6">(-) Custo dos Produtos Vendidos (CPV)</TableCell>
                    <TableCell className="text-right text-red-500" data-testid="text-cpv">
                      ({(currentResult.cpv || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {currentResult.receitaBruta > 0 ? (((currentResult.cpv || 0) / currentResult.receitaBruta) * 100).toFixed(1) : '0.0'}%
                    </TableCell>
                  </TableRow>
                  
                  {/* Lucro Bruto */}
                  <TableRow className="font-semibold bg-green-50 dark:bg-green-950/20 border-t">
                    <TableCell>(=) LUCRO BRUTO</TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-400" data-testid="text-lucro-bruto-completo">
                      {(currentResult.lucroBruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {currentResult.receitaBruta > 0 ? (((currentResult.lucroBruto || 0) / currentResult.receitaBruta) * 100).toFixed(1) : '0.0'}%
                    </TableCell>
                  </TableRow>
                  
                  {/* Despesas Operacionais */}
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-semibold">DESPESAS OPERACIONAIS</TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">(-) Despesas com Vendas</TableCell>
                    <TableCell className="text-right text-red-500">
                      ({(currentResult.despesasVendas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {currentResult.receitaBruta > 0 ? (((currentResult.despesasVendas || 0) / currentResult.receitaBruta) * 100).toFixed(1) : '0.0'}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">(-) Despesas Administrativas</TableCell>
                    <TableCell className="text-right text-red-500">
                      ({(currentResult.despesasAdmin || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {currentResult.receitaBruta > 0 ? (((currentResult.despesasAdmin || 0) / currentResult.receitaBruta) * 100).toFixed(1) : '0.0'}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">(-) Despesas Financeiras</TableCell>
                    <TableCell className="text-right text-red-500">
                      ({(currentResult.despesasFinanc || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {currentResult.receitaBruta > 0 ? (((currentResult.despesasFinanc || 0) / currentResult.receitaBruta) * 100).toFixed(1) : '0.0'}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-6">(-) Outras Despesas Operacionais</TableCell>
                    <TableCell className="text-right text-red-500">
                      ({(currentResult.outrasDespesas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {currentResult.receitaBruta > 0 ? (((currentResult.outrasDespesas || 0) / currentResult.receitaBruta) * 100).toFixed(1) : '0.0'}%
                    </TableCell>
                  </TableRow>
                  
                  {/* EBITDA */}
                  <TableRow className="font-semibold bg-purple-50 dark:bg-purple-950/20 border-t">
                    <TableCell>(=) EBITDA</TableCell>
                    <TableCell className="text-right" data-testid="text-ebitda">
                      {(currentResult.ebitda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {currentResult.receitaBruta > 0 ? (((currentResult.ebitda || 0) / currentResult.receitaBruta) * 100).toFixed(1) : '0.0'}%
                    </TableCell>
                  </TableRow>
                  
                  {/* Depreciação */}
                  <TableRow>
                    <TableCell className="pl-6">(-) Depreciação e Amortização</TableCell>
                    <TableCell className="text-right text-red-500">
                      ({(currentResult.depreciacao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {currentResult.receitaBruta > 0 ? (((currentResult.depreciacao || 0) / currentResult.receitaBruta) * 100).toFixed(1) : '0.0'}%
                    </TableCell>
                  </TableRow>
                  
                  {/* LAIR */}
                  <TableRow className="font-semibold bg-yellow-50 dark:bg-yellow-950/20 border-t">
                    <TableCell>(=) LAIR (Lucro Antes do IR)</TableCell>
                    <TableCell className="text-right" data-testid="text-lair">
                      {(currentResult.lair || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {currentResult.receitaBruta > 0 ? (((currentResult.lair || 0) / currentResult.receitaBruta) * 100).toFixed(1) : '0.0'}%
                    </TableCell>
                  </TableRow>
                  
                  {/* IR e CSLL */}
                  <TableRow>
                    <TableCell className="pl-6">(-) IR e CSLL</TableCell>
                    <TableCell className="text-right text-red-500">
                      ({(currentResult.irCsll || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {currentResult.receitaBruta > 0 ? (((currentResult.irCsll || 0) / currentResult.receitaBruta) * 100).toFixed(1) : '0.0'}%
                    </TableCell>
                  </TableRow>
                  
                  {/* Lucro Líquido */}
                  <TableRow className="font-bold bg-green-100 dark:bg-green-900/30 border-t-2">
                    <TableCell>(=) LUCRO LÍQUIDO DO EXERCÍCIO</TableCell>
                    <TableCell className="text-right text-green-700 dark:text-green-300" data-testid="text-lucro-liquido">
                      {(currentResult.lucroLiquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {currentResult.receitaBruta > 0 ? (((currentResult.lucroLiquido || 0) / currentResult.receitaBruta) * 100).toFixed(1) : '0.0'}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-2 border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-muted/30">
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#1447e6] flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  Balanço Patrimonial
                </CardTitle>
                <CardDescription>Demonstração da posição patrimonial e financeira</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#1aa15c]" />
                      ATIVO
                    </h3>
                    <Table>
                      <TableBody>
                        <TableRow className="bg-muted/30">
                          <TableCell className="font-semibold">ATIVO CIRCULANTE</TableCell>
                          <TableCell className="text-right font-semibold">
                            {(currentResult.ativoCirculante || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6">Caixa e Equivalentes</TableCell>
                          <TableCell className="text-right">
                            {(currentResult.caixa || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6">Contas a Receber</TableCell>
                          <TableCell className="text-right">
                            {(currentResult.contasReceber || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6">Estoques</TableCell>
                          <TableCell className="text-right">
                            {(currentResult.estoques || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                        
                        <TableRow className="bg-muted/30 border-t">
                          <TableCell className="font-semibold">ATIVO NÃO CIRCULANTE</TableCell>
                          <TableCell className="text-right font-semibold">
                            {(currentResult.ativoNaoCirculante || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6">Imobilizado</TableCell>
                          <TableCell className="text-right">
                            {(currentResult.imobilizado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6">Intangível (Marcas)</TableCell>
                          <TableCell className="text-right">
                            {(currentResult.intangivel || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                        
                        <TableRow className="font-bold bg-blue-50 dark:bg-blue-950/20 border-t-2">
                          <TableCell>TOTAL DO ATIVO</TableCell>
                          <TableCell className="text-right" data-testid="text-ativo-total">
                            {(currentResult.ativoTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      PASSIVO + PATRIMÔNIO LÍQUIDO
                    </h3>
                    <Table>
                      <TableBody>
                        <TableRow className="bg-muted/30">
                          <TableCell className="font-semibold">PASSIVO CIRCULANTE</TableCell>
                          <TableCell className="text-right font-semibold">
                            {(currentResult.passivoCirculante || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6">Fornecedores</TableCell>
                          <TableCell className="text-right">
                            {(currentResult.fornecedores || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6">Obrigações Fiscais</TableCell>
                          <TableCell className="text-right">
                            {(currentResult.obrigFiscais || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6">Outras Obrigações</TableCell>
                          <TableCell className="text-right">
                            {(currentResult.outrasObrig || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                        
                        <TableRow className="bg-muted/30 border-t">
                          <TableCell className="font-semibold">PASSIVO NÃO CIRCULANTE</TableCell>
                          <TableCell className="text-right font-semibold">
                            {(currentResult.passivoNaoCirculante || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6">Financiamentos LP</TableCell>
                          <TableCell className="text-right">
                            {(currentResult.financiamentosLP || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                        
                        <TableRow className="bg-muted/30 border-t">
                          <TableCell className="font-semibold">PATRIMÔNIO LÍQUIDO</TableCell>
                          <TableCell className="text-right font-semibold" data-testid="text-patrimonio-liquido">
                            {(currentResult.patrimonioLiquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6">Capital Social</TableCell>
                          <TableCell className="text-right">
                            {(currentResult.capitalSocial || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6">Lucros Acumulados</TableCell>
                          <TableCell className="text-right">
                            {(currentResult.lucrosAcumulados || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                        
                        <TableRow className="font-bold bg-blue-50 dark:bg-blue-950/20 border-t-2">
                          <TableCell>TOTAL PASSIVO + PL</TableCell>
                          <TableCell className="text-right" data-testid="text-passivo-pl-total">
                            {(currentResult.ativoTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <Alert className="mt-6">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Equação Patrimonial</AlertTitle>
                  <AlertDescription>
                    <strong>ATIVO = PASSIVO + PATRIMÔNIO LÍQUIDO</strong><br />
                    O balanço sempre se mantém equilibrado. Os ativos representam os bens e direitos da empresa, 
                    enquanto passivos e patrimônio líquido mostram as fontes de recursos (obrigações e capital próprio).
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                Evolução Financeira
              </CardTitle>
              <CardDescription>Histórico de receita, custos e lucro ao longo das rodadas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="rodada" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="receita"
                    name="Receita"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="custos"
                    name="Custos"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lucro"
                    name="Lucro"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Margem Bruta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{currentResult.margin.toFixed(2)}%</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Lucro sobre receita líquida
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Margem de Contribuição</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{currentResult.margemContribuicao.toFixed(2)}%</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Após custos variáveis
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {currentResult.roi.toFixed(2)}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Retorno sobre investimento
                </p>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Metodologia:</strong> Deduções estimadas em {currentResult.receitaBruta > 0
                ? (((currentResult.receitaBruta - currentResult.receitaLiquida) / currentResult.receitaBruta) * 100).toFixed(1)
                : '0.0'}% 
              (impostos, devoluções, descontos). Custos fixos representam 40% (infraestrutura, pessoal) e variáveis 60% (produção, logística, comissões).
              Para detalhes completos sobre cálculos e fórmulas, consulte o Manual do Aluno.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}
