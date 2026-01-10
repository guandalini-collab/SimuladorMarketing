import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Label } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, DollarSign, HelpCircle, XCircle } from "lucide-react";

interface BcgProduct {
  id: string;
  productName: string;
  marketGrowth: number;
  relativeMarketShare: number;
  quadrant: string;
}

interface BcgMatrixChartProps {
  products: BcgProduct[];
}

const QUADRANT_COLORS = {
  "Estrela": "#10b981",
  "Vaca Leiteira": "#3b82f6",
  "Ponto de Interrogação": "#f59e0b",
  "Abacaxi": "#ef4444",
};

const QUADRANT_ICONS = {
  "Estrela": Star,
  "Vaca Leiteira": DollarSign,
  "Ponto de Interrogação": HelpCircle,
  "Abacaxi": XCircle,
};

const QUADRANT_LABELS = {
  "Estrela": "Estrela",
  "Vaca Leiteira": "Vaca Leiteira",
  "Ponto de Interrogação": "Ponto de Interrogação",
  "Abacaxi": "Abacaxi",
};

export default function BcgMatrixChart({ products }: BcgMatrixChartProps) {
  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Matriz BCG - Visualização Gráfica</CardTitle>
          <CardDescription>Adicione produtos para visualizar a matriz</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <p>Nenhum produto mapeado ainda</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = products.map(product => ({
    name: product.productName,
    x: product.relativeMarketShare,
    y: product.marketGrowth,
    quadrant: product.quadrant,
  }));

  const quadrantCounts = products.reduce((acc, p) => {
    acc[p.quadrant] = (acc[p.quadrant] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border rounded-lg shadow-lg p-3 space-y-1">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">Participação: {data.x}%</p>
          <p className="text-sm text-muted-foreground">Crescimento: {data.y}%</p>
          <Badge style={{ backgroundColor: QUADRANT_COLORS[data.quadrant as keyof typeof QUADRANT_COLORS] }}>
            {data.quadrant}
          </Badge>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matriz BCG - Visualização Gráfica</CardTitle>
        <CardDescription>Posicionamento estratégico dos produtos por crescimento e participação de mercado</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              
              <XAxis 
                type="number" 
                dataKey="x" 
                domain={[0, 100]}
                name="Participação Relativa"
                label={{ 
                  value: 'Participação Relativa de Mercado (%)', 
                  position: 'bottom',
                  offset: 40,
                  style: { fontSize: 14, fontWeight: 600 }
                }}
                tick={{ fontSize: 12 }}
              />
              
              <YAxis 
                type="number" 
                dataKey="y" 
                domain={[0, 20]}
                name="Crescimento"
                label={{ 
                  value: 'Taxa de Crescimento do Mercado (%)', 
                  angle: -90, 
                  position: 'left',
                  offset: 40,
                  style: { fontSize: 14, fontWeight: 600 }
                }}
                tick={{ fontSize: 12 }}
              />
              
              <ReferenceLine x={50} stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" />
              <ReferenceLine y={10} stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" />
              
              <text x="75%" y="15%" textAnchor="middle" className="fill-green-600 font-semibold text-sm">
                Estrela
              </text>
              <text x="25%" y="15%" textAnchor="middle" className="fill-orange-600 font-semibold text-sm">
                ?
              </text>
              <text x="75%" y="85%" textAnchor="middle" className="fill-blue-600 font-semibold text-sm">
                Vaca Leiteira
              </text>
              <text x="25%" y="85%" textAnchor="middle" className="fill-red-600 font-semibold text-sm">
                Abacaxi
              </text>
              
              <Tooltip content={<CustomTooltip />} />
              
              <Scatter 
                name="Produtos" 
                data={chartData} 
                fill="#8884d8"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={QUADRANT_COLORS[entry.quadrant as keyof typeof QUADRANT_COLORS]}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(QUADRANT_LABELS).map(([key, label]) => {
            const Icon = QUADRANT_ICONS[key as keyof typeof QUADRANT_ICONS];
            const testId = key.toLowerCase().replace(/ /g, '-');
            return (
              <div 
                key={key}
                className="flex items-center justify-between p-3 border rounded-lg"
                style={{ borderColor: QUADRANT_COLORS[key as keyof typeof QUADRANT_COLORS] }}
                data-testid={`bcg-legend-${testId}`}
              >
                <div className="flex items-center gap-2">
                  <Icon 
                    className="h-4 w-4"
                    style={{ color: QUADRANT_COLORS[key as keyof typeof QUADRANT_COLORS] }}
                  />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <Badge 
                  style={{ backgroundColor: QUADRANT_COLORS[key as keyof typeof QUADRANT_COLORS] }}
                  data-testid={`bcg-count-${testId}`}
                >
                  {quadrantCounts[key] || 0}
                </Badge>
              </div>
            );
          })}
        </div>

        <div className="bg-muted/50 p-4 rounded-lg space-y-2" data-testid="bcg-interpretation">
          <p className="text-sm font-semibold">Interpretação dos Quadrantes:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-start gap-2" data-testid="interpretation-estrela">
              <Star className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><span className="font-medium text-green-600">Estrela:</span> Alto crescimento + Alta participação → Investir para manter liderança</span>
            </li>
            <li className="flex items-start gap-2" data-testid="interpretation-vaca-leiteira">
              <DollarSign className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span><span className="font-medium text-blue-600">Vaca Leiteira:</span> Baixo crescimento + Alta participação → Gerar caixa</span>
            </li>
            <li className="flex items-start gap-2" data-testid="interpretation-ponto-de-interrogação">
              <HelpCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <span><span className="font-medium text-orange-600">Ponto de Interrogação:</span> Alto crescimento + Baixa participação → Decisão estratégica</span>
            </li>
            <li className="flex items-start gap-2" data-testid="interpretation-abacaxi">
              <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span><span className="font-medium text-red-600">Abacaxi:</span> Baixo crescimento + Baixa participação → Considerar descontinuar</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
