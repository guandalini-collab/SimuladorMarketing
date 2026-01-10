import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, ReferenceArea, Label } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, TrendingUp, DollarSign, HelpCircle, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BcgMatrixChartProps {
  teamId: string;
  roundId: string;
}

interface BcgAnalysis {
  id: string;
  teamId: string;
  roundId: string;
  productId: string;
  productName: string;
  marketGrowth: number;
  relativeMarketShare: number;
  quadrant: string;
  notes: string | null;
}

const QUADRANT_COLORS = {
  stars: "hsl(var(--chart-3))",
  cash_cows: "hsl(var(--chart-1))",
  question_marks: "hsl(var(--chart-5))",
  dogs: "hsl(var(--chart-4))",
};

const QUADRANT_LABELS = {
  stars: "Estrelas",
  cash_cows: "Vacas Leiteiras",
  question_marks: "Interrogações",
  dogs: "Abacaxis",
};

const QUADRANT_ICONS = {
  stars: Zap,
  cash_cows: DollarSign,
  question_marks: HelpCircle,
  dogs: TrendingUp,
};

export function BcgMatrixChart({ teamId, roundId }: BcgMatrixChartProps) {
  const { data: bcgData, isLoading } = useQuery<BcgAnalysis[]>({
    queryKey: [`/api/bcg/${teamId}/${roundId}`],
    enabled: !!teamId && !!roundId,
  });

  if (isLoading) {
    return (
      <Card data-testid="card-bcg-matrix">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!bcgData || bcgData.length === 0) {
    return (
      <Card data-testid="card-bcg-matrix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            Matriz BCG - Posicionamento de Produtos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Complete a análise BCG nas Ferramentas Estratégicas para visualizar o posicionamento dos seus produtos.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const chartData = bcgData.map((item) => ({
    ...item,
    x: item.relativeMarketShare,
    y: item.marketGrowth,
    name: item.productName,
  }));

  const growthThreshold = 0;
  
  const maxShare = Math.max(...chartData.map(d => d.x), 2);
  const minShare = Math.min(...chartData.map(d => d.x), 0);
  const maxGrowth = Math.max(...chartData.map(d => d.y), 15);
  const minGrowth = Math.min(...chartData.map(d => d.y), -5);

  const shareThreshold = 1.0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg" data-testid="tooltip-bcg-product">
          <p className="font-semibold capitalize mb-2" data-testid="tooltip-product-name">{data.name}</p>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              Market Share: <span className="font-medium text-foreground" data-testid="tooltip-market-share">{data.relativeMarketShare.toFixed(2)}x</span>
            </p>
            <p className="text-muted-foreground">
              Crescimento: <span className="font-medium text-foreground" data-testid="tooltip-growth">{data.marketGrowth.toFixed(1)}%</span>
            </p>
            <Badge variant="outline" className="mt-2" data-testid="tooltip-quadrant">
              {QUADRANT_LABELS[data.quadrant as keyof typeof QUADRANT_LABELS]}
            </Badge>
          </div>
        </div>
      );
    }
    return null;
  };

  const quadrantCounts = bcgData.reduce((acc, item) => {
    acc[item.quadrant] = (acc[item.quadrant] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card data-testid="card-bcg-matrix">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Matriz BCG - Posicionamento de Produtos</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Análise do portfólio baseada em crescimento e participação de mercado
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(QUADRANT_LABELS).map(([key, label]) => {
            const Icon = QUADRANT_ICONS[key as keyof typeof QUADRANT_ICONS];
            const count = quadrantCounts[key] || 0;
            return (
              <div
                key={key}
                className="p-3 rounded-lg border-2"
                style={{ borderColor: QUADRANT_COLORS[key as keyof typeof QUADRANT_COLORS] }}
                data-testid={`badge-quadrant-${key}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4" style={{ color: QUADRANT_COLORS[key as keyof typeof QUADRANT_COLORS] }} />
                  <span className="font-medium text-sm">{label}</span>
                </div>
                <p className="text-2xl font-bold" data-testid={`text-quadrant-count-${key}`}>{count}</p>
              </div>
            );
          })}
        </div>

        <div className="relative" data-testid="chart-bcg-matrix">
          <ResponsiveContainer width="100%" height={450}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
              <defs>
                <linearGradient id="starsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={QUADRANT_COLORS.stars} stopOpacity={0.1} />
                  <stop offset="100%" stopColor={QUADRANT_COLORS.stars} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="questionMarksGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={QUADRANT_COLORS.question_marks} stopOpacity={0.1} />
                  <stop offset="100%" stopColor={QUADRANT_COLORS.question_marks} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="cashCowsGradient" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor={QUADRANT_COLORS.cash_cows} stopOpacity={0.1} />
                  <stop offset="100%" stopColor={QUADRANT_COLORS.cash_cows} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="dogsGradient" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor={QUADRANT_COLORS.dogs} stopOpacity={0.1} />
                  <stop offset="100%" stopColor={QUADRANT_COLORS.dogs} stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />

              <ReferenceArea 
                x1={shareThreshold} 
                x2={maxShare} 
                y1={growthThreshold} 
                y2={maxGrowth} 
                fill="url(#starsGradient)" 
                fillOpacity={1}
                data-testid="area-stars"
              />
              <ReferenceArea 
                x1={minShare} 
                x2={shareThreshold} 
                y1={growthThreshold} 
                y2={maxGrowth} 
                fill="url(#questionMarksGradient)" 
                fillOpacity={1}
                data-testid="area-question-marks"
              />
              <ReferenceArea 
                x1={shareThreshold} 
                x2={maxShare} 
                y1={minGrowth} 
                y2={growthThreshold} 
                fill="url(#cashCowsGradient)" 
                fillOpacity={1}
                data-testid="area-cash-cows"
              />
              <ReferenceArea 
                x1={minShare} 
                x2={shareThreshold} 
                y1={minGrowth} 
                y2={growthThreshold} 
                fill="url(#dogsGradient)" 
                fillOpacity={1}
                data-testid="area-dogs"
              />

              <XAxis 
                type="number" 
                dataKey="x" 
                name="Market Share Relativo"
                domain={[minShare, maxShare]}
                label={{ 
                  value: 'Participação de Mercado Relativa (1.0 = líder)', 
                  position: 'bottom',
                  offset: 40
                }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Crescimento"
                domain={[minGrowth, maxGrowth]}
                label={{ 
                  value: 'Taxa de Crescimento do Mercado (%)', 
                  angle: -90, 
                  position: 'left',
                  offset: 40
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              <ReferenceLine 
                x={shareThreshold} 
                stroke="hsl(var(--border))" 
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ 
                  value: 'Threshold: 1.0 (líder de mercado)', 
                  position: 'top',
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 10
                }}
              />
              <ReferenceLine 
                y={growthThreshold} 
                stroke="hsl(var(--border))" 
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ 
                  value: 'Threshold: 0% crescimento', 
                  position: 'right',
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 10
                }}
              />

              <Scatter name="Produtos" data={chartData} fill="hsl(var(--primary))">
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={QUADRANT_COLORS[entry.quadrant as keyof typeof QUADRANT_COLORS]}
                    data-testid={`scatter-product-${index}`}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          <div className="absolute top-8 left-20 text-sm font-semibold" style={{ color: QUADRANT_COLORS.question_marks }}>
            Interrogações
          </div>
          <div className="absolute top-8 right-24 text-sm font-semibold" style={{ color: QUADRANT_COLORS.stars }}>
            Estrelas
          </div>
          <div className="absolute bottom-24 left-20 text-sm font-semibold" style={{ color: QUADRANT_COLORS.dogs }}>
            Abacaxis
          </div>
          <div className="absolute bottom-24 right-24 text-sm font-semibold" style={{ color: QUADRANT_COLORS.cash_cows }}>
            Vacas Leiteiras
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Dica:</strong> Estrelas e Vacas Leiteiras são seus produtos mais valiosos. 
            Interrogações precisam de investimento para se tornarem Estrelas. 
            Abacaxis devem ser reavaliados ou descontinuados.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
