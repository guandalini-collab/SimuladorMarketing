import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Target, Shield, TrendingUp, Globe, Sparkles, Edit3, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import BcgMatrixChart from "@/components/BcgMatrixChart";

export default function Estrategia() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("swot");

  const { data: rounds = [] } = useQuery<any[]>({
    queryKey: ["/api/rounds"],
  });

  const { data: currentClass } = useQuery<any>({
    queryKey: ["/api/student/class"],
  });

  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  const activeRound = rounds.find((r) => r.status === "active");
  const lastRound = rounds[rounds.length - 1];
  const currentRound = activeRound || lastRound;

  // Log access on component mount
  useEffect(() => {
    if (currentRound && currentUser && currentClass) {
      apiRequest("POST", "/api/classes/" + currentClass.id + "/log-access", {
        roundId: currentRound.id,
        action: "strategy_access"
      }).catch(() => {}); // Silent catch
    }
  }, [currentRound, currentUser, currentClass]);

  const { data: strategy, isLoading } = useQuery<{
    swot?: any;
    porter?: any;
    bcg?: any[];
    pestel?: any;
    segmentation?: { b2c?: any; b2b?: any };
  }>({
    queryKey: ["/api/strategy", currentRound?.id],
    enabled: !!currentRound,
  });

  // Pedido do professor (2026-09): a Segmentação de Mercado usa critérios
  // diferentes conforme o tipo de negócio da turma (B2C = consumidor
  // pessoa física, B2B = empresas) — turma "hibrido" preenche as duas.
  const businessType = currentClass?.businessType || "b2c";

  if (!currentRound) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma rodada disponível ainda</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[#0a1830] via-[#0d2348] to-[#0a1830] p-8">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-20 w-32 h-32 border-4 border-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 left-20 w-40 h-40 border-4 border-white rounded-lg rotate-45 animate-pulse delay-75"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="h-16 w-16 rounded-full bg-[#7c3aed] flex items-center justify-center shadow-lg">
              <Target className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                Ferramentas Estratégicas
              </h1>
              <p className="text-white/80 text-lg mt-1">
                Analise seu ambiente competitivo - Rodada {currentRound.roundNumber}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-muted">
          <TabsTrigger
            value="swot"
            className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-950"
          >
            <Target className="h-5 w-5" />
            <span className="font-semibold">SWOT</span>
          </TabsTrigger>
          <TabsTrigger
            value="porter"
            className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-950"
          >
            <Shield className="h-5 w-5" />
            <span className="font-semibold">5 Forças</span>
          </TabsTrigger>
          <TabsTrigger
            value="bcg"
            className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-950"
          >
            <TrendingUp className="h-5 w-5" />
            <span className="font-semibold">BCG</span>
          </TabsTrigger>
          <TabsTrigger
            value="pestel"
            className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-950"
          >
            <Globe className="h-5 w-5" />
            <span className="font-semibold">PESTEL</span>
          </TabsTrigger>
          <TabsTrigger
            value="segmentacao"
            className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-950"
          >
            <Users className="h-5 w-5" />
            <span className="font-semibold">Segmentação</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="swot">
          <SwotTab roundId={currentRound.id} roundNumber={currentRound.roundNumber} roundStatus={currentRound.status} data={strategy?.swot} />
        </TabsContent>

        <TabsContent value="porter">
          <PorterTab roundId={currentRound.id} roundNumber={currentRound.roundNumber} roundStatus={currentRound.status} data={strategy?.porter} />
        </TabsContent>

        <TabsContent value="bcg">
          <BcgTab roundId={currentRound.id} roundNumber={currentRound.roundNumber} roundStatus={currentRound.status} data={strategy?.bcg || []} />
        </TabsContent>

        <TabsContent value="pestel">
          <PestelTab roundId={currentRound.id} roundNumber={currentRound.roundNumber} roundStatus={currentRound.status} data={strategy?.pestel} />
        </TabsContent>

        <TabsContent value="segmentacao">
          <SegmentacaoTab
            roundId={currentRound.id}
            roundNumber={currentRound.roundNumber}
            roundStatus={currentRound.status}
            businessType={businessType}
            b2cData={strategy?.segmentation?.b2c}
            b2bData={strategy?.segmentation?.b2b}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SwotTab({ roundId, roundNumber, roundStatus, data }: { roundId: string; roundNumber: number; roundStatus: string; data?: any }) {
  const { toast } = useToast();
  const hasData = Boolean(data);
  const [swot, setSwot] = useState({
    strengths: data?.strengths || [],
    weaknesses: data?.weaknesses || [],
    opportunities: data?.opportunities || [],
    threats: data?.threats || [],
  });
  const [newItem, setNewItem] = useState({ strengths: "", weaknesses: "", opportunities: "", threats: "" });

  useEffect(() => {
    setSwot({
      strengths: data?.strengths || [],
      weaknesses: data?.weaknesses || [],
      opportunities: data?.opportunities || [],
      threats: data?.threats || [],
    });
  }, [data, roundId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const finalSwot = { ...swot };
      (Object.keys(newItem) as Array<keyof typeof newItem>).forEach((key) => {
        if (newItem[key].trim()) {
          finalSwot[key] = [...finalSwot[key], newItem[key]];
        }
      });
      const res = await apiRequest("POST", "/api/strategy/swot", { roundId, ...finalSwot });
      return res.json();
    },
    onSuccess: () => {
      setNewItem({ strengths: "", weaknesses: "", opportunities: "", threats: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/strategy", roundId] });
      toast({ title: "Análise SWOT salva!", description: "Sua análise foi atualizada com sucesso." });
    },
  });

  const addItem = (category: keyof typeof swot) => {
    if (newItem[category].trim()) {
      setSwot((prev) => ({ ...prev, [category]: [...prev[category], newItem[category]] }));
      setNewItem((prev) => ({ ...prev, [category]: "" }));
    }
  };

  const removeItem = (category: keyof typeof swot, index: number) => {
    setSwot((prev) => ({ ...prev, [category]: prev[category].filter((_: any, i: number) => i !== index) }));
  };

  const categories = [
    { key: "strengths" as const, label: "Forças", icon: Shield, color: "text-green-600" },
    { key: "weaknesses" as const, label: "Fraquezas", icon: Shield, color: "text-red-600" },
    { key: "opportunities" as const, label: "Oportunidades", icon: TrendingUp, color: "text-blue-600" },
    { key: "threats" as const, label: "Ameaças", icon: TrendingUp, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-4">
      {roundStatus === "active" && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">
                {roundNumber === 1
                  ? "✨ Rodada 1: Análise gerada automaticamente pela IA"
                  : hasData
                    ? "📋 Análise herdada da rodada anterior"
                    : "📝 Preencha sua análise estratégica"}
              </p>
              <p className="text-sm text-muted-foreground">
                {roundNumber === 1
                  ? "Esta análise foi criada pela IA como ponto de partida. Personalize, adicione suas próprias ideias e clique em 'Salvar' para preservar suas alterações."
                  : hasData
                    ? "Você já preencheu essa análise antes, e ela continua valendo automaticamente nesta rodada — não precisa reescrever nada. Reveja se ainda faz sentido: edite, exclua ou adicione itens se sua estratégia mudou. Atenção: se a análise não bater com o que você está realmente praticando no mix de marketing, isso reduz sua pontuação de alinhamento estratégico."
                    : "Preencha sua análise estratégica e clique em 'Salvar' — ela vai continuar valendo nas próximas rodadas até você decidir mudar algo."}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <Card className="border-2 border-slate-200 dark:border-slate-800">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#1447e6] flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Análise SWOT</CardTitle>
              <CardDescription>Identifique Forças, Fraquezas, Oportunidades e Ameaças</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {categories.map((cat) => (
              <div key={cat.key} className="space-y-3">
                <div className="flex items-center gap-2">
                  <cat.icon className={`h-5 w-5 ${cat.color}`} />
                  <h3 className="font-semibold">{cat.label}</h3>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder={`Adicionar ${cat.label.toLowerCase()}...`}
                    value={newItem[cat.key]}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                    onKeyPress={(e) => e.key === "Enter" && addItem(cat.key)}
                  />
                  <Button size="icon" onClick={() => addItem(cat.key)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {swot[cat.key].map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                      <span className="flex-1 text-sm">{item}</span>
                      <Button size="icon" variant="ghost" onClick={() => removeItem(cat.key, idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || roundStatus !== "active"}>
            Salvar Análise SWOT
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PorterTab({ roundId, roundNumber, roundStatus, data }: { roundId: string; roundNumber: number; roundStatus: string; data?: any }) {
  const { toast } = useToast();
  const hasData = Boolean(data);
  const [porter, setPorter] = useState({
    competitiveRivalry: data?.competitiveRivalry || 5,
    supplierPower: data?.supplierPower || 5,
    buyerPower: data?.buyerPower || 5,
    threatOfSubstitutes: data?.threatOfSubstitutes || 5,
    threatOfNewEntry: data?.threatOfNewEntry || 5,
    rivalryNotes: data?.rivalryNotes || "",
    supplierNotes: data?.supplierNotes || "",
    buyerNotes: data?.buyerNotes || "",
    substitutesNotes: data?.substitutesNotes || "",
    newEntryNotes: data?.newEntryNotes || "",
  });

  useEffect(() => {
    setPorter({
      competitiveRivalry: data?.competitiveRivalry || 5,
      supplierPower: data?.supplierPower || 5,
      buyerPower: data?.buyerPower || 5,
      threatOfSubstitutes: data?.threatOfSubstitutes || 5,
      threatOfNewEntry: data?.threatOfNewEntry || 5,
      rivalryNotes: data?.rivalryNotes || "",
      supplierNotes: data?.supplierNotes || "",
      buyerNotes: data?.buyerNotes || "",
      substitutesNotes: data?.substitutesNotes || "",
      newEntryNotes: data?.newEntryNotes || "",
    });
  }, [data, roundId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/strategy/porter", { roundId, ...porter });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategy", roundId] });
      toast({ title: "5 Forças de Porter salvas!", description: "Sua análise foi atualizada." });
    },
  });

  const forces = [
    { key: "competitiveRivalry", notesKey: "rivalryNotes", label: "Rivalidade Competitiva" },
    { key: "supplierPower", notesKey: "supplierNotes", label: "Poder de Barganha dos Fornecedores" },
    { key: "buyerPower", notesKey: "buyerNotes", label: "Poder de Barganha dos Compradores" },
    { key: "threatOfSubstitutes", notesKey: "substitutesNotes", label: "Ameaça de Substitutos" },
    { key: "threatOfNewEntry", notesKey: "newEntryNotes", label: "Ameaça de Novos Entrantes" },
  ];

  return (
    <div className="space-y-4">
      {roundStatus === "active" && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">
                {roundNumber === 1
                  ? "✨ Rodada 1: Análise gerada automaticamente pela IA"
                  : hasData
                    ? "📋 Análise herdada da rodada anterior"
                    : "📝 Preencha sua análise estratégica"}
              </p>
              <p className="text-sm text-muted-foreground">
                {roundNumber === 1
                  ? "Esta análise foi criada pela IA como ponto de partida. Personalize, adicione suas próprias ideias e clique em 'Salvar' para preservar suas alterações."
                  : hasData
                    ? "Você já preencheu essa análise antes, e ela continua valendo automaticamente nesta rodada — não precisa reescrever nada. Reveja se ainda faz sentido: edite, exclua ou adicione itens se sua estratégia mudou. Atenção: se a análise não bater com o que você está realmente praticando no mix de marketing, isso reduz sua pontuação de alinhamento estratégico."
                    : "Preencha sua análise estratégica e clique em 'Salvar' — ela vai continuar valendo nas próximas rodadas até você decidir mudar algo."}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <Card className="border-2 border-slate-200 dark:border-slate-800">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#7c3aed] flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>5 Forças de Porter</CardTitle>
              <CardDescription>Avalie a intensidade das forças competitivas (1 = Baixa, 10 = Alta)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
        {forces.map((force) => (
          <div key={force.key} className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{force.label}</Label>
              <Badge variant="outline">{porter[force.key as keyof typeof porter] as number}/10</Badge>
            </div>
            <Slider
              value={[porter[force.key as keyof typeof porter] as number]}
              onValueChange={([val]) => setPorter((prev) => ({ ...prev, [force.key]: val }))}
              min={1}
              max={10}
              step={1}
            />
            <Textarea
              placeholder="Notas sobre esta força..."
              value={porter[force.notesKey as keyof typeof porter] as string || ""}
              onChange={(e) => setPorter((prev) => ({ ...prev, [force.notesKey]: e.target.value }))}
              rows={2}
            />
          </div>
        ))}
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || roundStatus !== "active"}>
          Salvar Análise Porter
        </Button>
      </CardContent>
    </Card>
    </div>
  );
}

function BcgTab({ roundId, roundNumber, roundStatus, data }: { roundId: string; roundNumber: number; roundStatus: string; data: any[] }) {
  const { toast } = useToast();
  const hasData = data.length > 0;
  const [products, setProducts] = useState(data);
  const [newProduct, setNewProduct] = useState({
    productName: "",
    marketGrowth: 5,
    // Inconsistência de auditoria (2026-09), item 1: era uma % de 0 a 100
    // (escala usada só aqui), enquanto a IA (assistência automática nas
    // Rodadas 1-3) grava esse mesmo campo na escala padrão da Matriz BCG —
    // razão em torno de 1.0 (participação própria ÷ do maior concorrente),
    // sem nenhuma conversão. Corrigido adotando a mesma escala padrão aqui,
    // já que os dois tipos de registro convivem na mesma tabela/gráfico.
    relativeMarketShare: 1,
  });

  useEffect(() => {
    setProducts(data);
  }, [data]);

  const addMutation = useMutation({
    mutationFn: async () => {
      const quadrant = getQuadrant(newProduct.marketGrowth, newProduct.relativeMarketShare);
      const res = await apiRequest("POST", "/api/strategy/bcg", { roundId, ...newProduct, quadrant });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategy", roundId] });
      toast({ title: "Produto adicionado!", description: "Produto inserido na Matriz BCG." });
      setNewProduct({ productName: "", marketGrowth: 5, relativeMarketShare: 1 });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/strategy/bcg/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategy", roundId] });
      toast({ title: "Produto removido", description: "Produto removido da matriz." });
    },
  });

  function getQuadrant(growth: number, share: number) {
    // Limiar de crescimento (10%) alinhado com a linha de referência do
    // gráfico (BcgMatrixChart usa y={10}) — antes a classificação usava 5%,
    // fazendo produtos com crescimento entre 5% e 10% ficarem com um
    // quadrante/cor que não correspondia à posição real no gráfico.
    // Limiar de participação (1.0) alinhado com a escala padrão da Matriz
    // BCG (razão em relação ao maior concorrente) — ver comentário na
    // declaração de relativeMarketShare acima (inconsistência de auditoria,
    // item 1, 2026-09).
    if (growth >= 10 && share >= 1) return "Estrela";
    if (growth < 10 && share >= 1) return "Vaca Leiteira";
    if (growth >= 10 && share < 1) return "Ponto de Interrogação";
    return "Abacaxi";
  }

  return (
    <div className="space-y-4">
      {roundStatus === "active" && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">
                {roundNumber === 1
                  ? "✨ Rodada 1: Análise gerada automaticamente pela IA"
                  : hasData
                    ? "📋 Análise herdada da rodada anterior"
                    : "📝 Preencha sua análise estratégica"}
              </p>
              <p className="text-sm text-muted-foreground">
                {roundNumber === 1
                  ? "Esta análise foi criada pela IA como ponto de partida. Personalize, adicione suas próprias ideias e clique em 'Salvar' para preservar suas alterações."
                  : hasData
                    ? "Você já mapeou seus produtos antes, e eles continuam valendo automaticamente nesta rodada — não precisa reinserir nada. Reveja se ainda fazem sentido: edite, exclua ou adicione produtos se sua estratégia mudou. Atenção: se o quadrante não bater com o que você está realmente praticando no mix de marketing, isso reduz sua pontuação de alinhamento estratégico."
                    : "Adicione seus produtos à matriz — eles vão continuar valendo nas próximas rodadas até você decidir mudar algo."}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <Card className="border-2 border-slate-200 dark:border-slate-800">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#1aa15c] flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Matriz BCG</CardTitle>
              <CardDescription>Posicione seus produtos na matriz de crescimento-participação</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Nome do Produto</Label>
                <Input
                  placeholder="Ex: Produto Premium"
                  value={newProduct.productName}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, productName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Crescimento do Mercado (%) - {newProduct.marketGrowth}%</Label>
                <Slider
                  value={[newProduct.marketGrowth]}
                  onValueChange={([val]) => setNewProduct((prev) => ({ ...prev, marketGrowth: val }))}
                  min={0}
                  max={20}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Participação Relativa - {newProduct.relativeMarketShare.toFixed(1)}x (1.0 = mesma participação do líder)</Label>
                <Slider
                  value={[newProduct.relativeMarketShare]}
                  onValueChange={([val]) => setNewProduct((prev) => ({ ...prev, relativeMarketShare: val }))}
                  min={0}
                  max={3}
                  step={0.1}
                />
              </div>
            </div>
            <Button onClick={() => addMutation.mutate()} disabled={!newProduct.productName || addMutation.isPending || roundStatus !== "active"}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Produto
            </Button>
          </div>

          {products.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Produtos Mapeados</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {products.map((product: any) => (
                  <div key={product.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{product.productName}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className="mt-1">{product.quadrant}</Badge>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(product.id)} disabled={roundStatus !== "active"}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Crescimento: {product.marketGrowth}%</p>
                      <p>Participação: {Number(product.relativeMarketShare).toFixed(2)}x</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {products.length > 0 && <BcgMatrixChart products={products} />}
    </div>
  );
}

function PestelTab({ roundId, roundNumber, roundStatus, data }: { roundId: string; roundNumber: number; roundStatus: string; data?: any }) {
  const { toast } = useToast();
  const hasData = Boolean(data);
  const [pestel, setPestel] = useState({
    political: data?.political || [],
    economic: data?.economic || [],
    social: data?.social || [],
    technological: data?.technological || [],
    environmental: data?.environmental || [],
    legal: data?.legal || [],
  });
  const [newItem, setNewItem] = useState({
    political: "",
    economic: "",
    social: "",
    technological: "",
    environmental: "",
    legal: "",
  });

  useEffect(() => {
    setPestel({
      political: data?.political || [],
      economic: data?.economic || [],
      social: data?.social || [],
      technological: data?.technological || [],
      environmental: data?.environmental || [],
      legal: data?.legal || [],
    });
  }, [data, roundId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const finalPestel = { ...pestel };
      (Object.keys(newItem) as Array<keyof typeof newItem>).forEach((key) => {
        if (newItem[key].trim()) {
          finalPestel[key] = [...finalPestel[key], newItem[key]];
        }
      });
      const res = await apiRequest("POST", "/api/strategy/pestel", { roundId, ...finalPestel });
      return res.json();
    },
    onSuccess: () => {
      setNewItem({ political: "", economic: "", social: "", technological: "", environmental: "", legal: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/strategy", roundId] });
      toast({ title: "Análise PESTEL salva!", description: "Sua análise foi atualizada." });
    },
  });

  const addItem = (category: keyof typeof pestel) => {
    if (newItem[category].trim()) {
      setPestel((prev) => ({ ...prev, [category]: [...prev[category], newItem[category]] }));
      setNewItem((prev) => ({ ...prev, [category]: "" }));
    }
  };

  const removeItem = (category: keyof typeof pestel, index: number) => {
    setPestel((prev) => ({ ...prev, [category]: prev[category].filter((_: any, i: number) => i !== index) }));
  };

  const categories = [
    { key: "political" as const, label: "Político", icon: Globe },
    { key: "economic" as const, label: "Econômico", icon: TrendingUp },
    { key: "social" as const, label: "Social", icon: Globe },
    { key: "technological" as const, label: "Tecnológico", icon: TrendingUp },
    { key: "environmental" as const, label: "Ambiental", icon: Globe },
    { key: "legal" as const, label: "Legal", icon: Shield },
  ];

  return (
    <div className="space-y-4">
      {roundStatus === "active" && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">
                {roundNumber === 1
                  ? "✨ Rodada 1: Análise gerada automaticamente pela IA"
                  : hasData
                    ? "📋 Análise herdada da rodada anterior"
                    : "📝 Preencha sua análise estratégica"}
              </p>
              <p className="text-sm text-muted-foreground">
                {roundNumber === 1
                  ? "Esta análise foi criada pela IA como ponto de partida. Personalize, adicione suas próprias ideias e clique em 'Salvar' para preservar suas alterações."
                  : hasData
                    ? "Você já preencheu essa análise antes, e ela continua valendo automaticamente nesta rodada — não precisa reescrever nada. Reveja se ainda faz sentido: edite, exclua ou adicione itens se sua estratégia mudou. Atenção: se a análise não bater com o que você está realmente praticando no mix de marketing, isso reduz sua pontuação de alinhamento estratégico."
                    : "Preencha sua análise estratégica e clique em 'Salvar' — ela vai continuar valendo nas próximas rodadas até você decidir mudar algo."}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <Card className="border-2 border-slate-200 dark:border-slate-800">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#ff8c1a] flex items-center justify-center">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Análise PESTEL</CardTitle>
              <CardDescription>Identifique fatores macro-ambientais que afetam seu negócio</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {categories.map((cat) => (
            <div key={cat.key} className="space-y-3">
              <div className="flex items-center gap-2">
                <cat.icon className="h-5 w-5" />
                <h3 className="font-semibold">{cat.label}</h3>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={`Adicionar fator ${cat.label.toLowerCase()}...`}
                  value={newItem[cat.key]}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                  onKeyPress={(e) => e.key === "Enter" && addItem(cat.key)}
                />
                <Button size="icon" onClick={() => addItem(cat.key)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {pestel[cat.key].map((item: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                    <span className="flex-1 text-sm">{item}</span>
                    <Button size="icon" variant="ghost" onClick={() => removeItem(cat.key, idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || roundStatus !== "active"}>
          Salvar Análise PESTEL
        </Button>
      </CardContent>
    </Card>
    </div>
  );
}

// Pedido do professor (2026-09): 5ª ferramenta estratégica, no mesmo estilo
// de SWOT/Porter/BCG/PESTEL (preenche uma vez, herda automaticamente nas
// próximas rodadas, pode editar/excluir a qualquer momento). O conteúdo
// muda conforme o tipo de negócio da turma: B2C usa critérios de
// segmentação de consumidor (pessoa física), B2B usa critérios de
// segmentação empresarial. Turma "hibrido" preenche as duas seções.
const B2C_CATEGORIES = [
  { key: "demographic" as const, label: "Demográfica", hint: "idade, gênero, renda, escolaridade..." },
  { key: "geographic" as const, label: "Geográfica", hint: "região, cidade, urbano/rural, clima..." },
  { key: "psychographic" as const, label: "Psicográfica", hint: "estilo de vida, valores, personalidade..." },
  { key: "behavioral" as const, label: "Comportamental", hint: "frequência de uso, fidelidade, ocasião de compra..." },
];

const B2B_CATEGORIES = [
  { key: "firmographic" as const, label: "Firmográfica", hint: "porte da empresa, setor, faturamento..." },
  { key: "geographic" as const, label: "Geográfica", hint: "alcance regional/nacional das empresas-alvo..." },
  { key: "behavioral" as const, label: "Comportamental/Operacional", hint: "volume de compra, frequência, critérios de decisão..." },
  { key: "buyingCenter" as const, label: "Centro de Compras", hint: "quem decide: usuários, influenciadores, decisores, compradores..." },
];

type SegmentationCategoryKey = "demographic" | "geographic" | "psychographic" | "behavioral" | "firmographic" | "buyingCenter";

function SegmentacaoTab({
  roundId,
  roundNumber,
  roundStatus,
  businessType,
  b2cData,
  b2bData,
}: {
  roundId: string;
  roundNumber: number;
  roundStatus: string;
  businessType: string;
  b2cData?: any;
  b2bData?: any;
}) {
  const requiredTypes: Array<"b2c" | "b2b"> = businessType === "hibrido" ? ["b2c", "b2b"] : businessType === "b2b" ? ["b2b"] : ["b2c"];

  return (
    <div className="space-y-6">
      {requiredTypes.includes("b2c") && (
        <SegmentationSection
          segmentType="b2c"
          title="Segmentação de Mercado — Consumidor (B2C)"
          description="Defina os segmentos de pessoas físicas que sua empresa vai atender"
          color="#c026d3"
          categories={B2C_CATEGORIES}
          roundId={roundId}
          roundNumber={roundNumber}
          roundStatus={roundStatus}
          data={b2cData}
        />
      )}
      {requiredTypes.includes("b2b") && (
        <SegmentationSection
          segmentType="b2b"
          title="Segmentação de Mercado — Empresas (B2B)"
          description="Defina os segmentos de empresas-cliente que seu negócio vai atender"
          color="#0891b2"
          categories={B2B_CATEGORIES}
          roundId={roundId}
          roundNumber={roundNumber}
          roundStatus={roundStatus}
          data={b2bData}
        />
      )}
    </div>
  );
}

function SegmentationSection({
  segmentType,
  title,
  description,
  color,
  categories,
  roundId,
  roundNumber,
  roundStatus,
  data,
}: {
  segmentType: "b2c" | "b2b";
  title: string;
  description: string;
  color: string;
  categories: { key: SegmentationCategoryKey; label: string; hint: string }[];
  roundId: string;
  roundNumber: number;
  roundStatus: string;
  data?: any;
}) {
  const { toast } = useToast();
  const hasData = Boolean(data);

  const emptyState = () => {
    const state: Record<string, string[]> = {};
    categories.forEach(cat => { state[cat.key] = data?.[cat.key] || []; });
    return state;
  };
  const emptyNewItem = () => {
    const state: Record<string, string> = {};
    categories.forEach(cat => { state[cat.key] = ""; });
    return state;
  };

  const [segmentation, setSegmentation] = useState<Record<string, string[]>>(emptyState);
  const [newItem, setNewItem] = useState<Record<string, string>>(emptyNewItem);

  useEffect(() => {
    setSegmentation(emptyState());
    setNewItem(emptyNewItem());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, roundId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const finalSegmentation = { ...segmentation };
      categories.forEach(cat => {
        if (newItem[cat.key]?.trim()) {
          finalSegmentation[cat.key] = [...finalSegmentation[cat.key], newItem[cat.key]];
        }
      });
      const res = await apiRequest("POST", "/api/strategy/segmentation", { roundId, segmentType, ...finalSegmentation });
      return res.json();
    },
    onSuccess: () => {
      setNewItem(emptyNewItem());
      queryClient.invalidateQueries({ queryKey: ["/api/strategy", roundId] });
      toast({ title: "Segmentação salva!", description: "Sua análise foi atualizada." });
    },
  });

  const addItem = (category: SegmentationCategoryKey) => {
    if (newItem[category]?.trim()) {
      setSegmentation((prev) => ({ ...prev, [category]: [...prev[category], newItem[category]] }));
      setNewItem((prev) => ({ ...prev, [category]: "" }));
    }
  };

  const removeItem = (category: SegmentationCategoryKey, index: number) => {
    setSegmentation((prev) => ({ ...prev, [category]: prev[category].filter((_: any, i: number) => i !== index) }));
  };

  return (
    <div className="space-y-4">
      {roundStatus === "active" && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">
                {roundNumber === 1
                  ? "✨ Rodada 1: Análise gerada automaticamente pela IA"
                  : hasData
                    ? "📋 Análise herdada da rodada anterior"
                    : "📝 Preencha sua análise estratégica"}
              </p>
              <p className="text-sm text-muted-foreground">
                {roundNumber === 1
                  ? "Esta análise foi criada pela IA como ponto de partida. Personalize, adicione suas próprias ideias e clique em 'Salvar' para preservar suas alterações."
                  : hasData
                    ? "Você já preencheu essa análise antes, e ela continua valendo automaticamente nesta rodada — não precisa reescrever nada. Reveja se ainda faz sentido: edite, exclua ou adicione itens se sua estratégia mudou. Atenção: se a segmentação não bater com o que você está realmente praticando no mix de marketing (preço, canais), isso reduz sua pontuação de alinhamento estratégico."
                    : "Preencha sua análise estratégica e clique em 'Salvar' — ela vai continuar valendo nas próximas rodadas até você decidir mudar algo."}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <Card className="border-2 border-slate-200 dark:border-slate-800">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color }}>
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {categories.map((cat) => (
              <div key={cat.key} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" style={{ color }} />
                  <h3 className="font-semibold">{cat.label}</h3>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder={`Adicionar critério (${cat.hint})`}
                    value={newItem[cat.key] || ""}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                    onKeyPress={(e) => e.key === "Enter" && addItem(cat.key)}
                  />
                  <Button size="icon" onClick={() => addItem(cat.key)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {(segmentation[cat.key] || []).map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                      <span className="flex-1 text-sm">{item}</span>
                      <Button size="icon" variant="ghost" onClick={() => removeItem(cat.key, idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || roundStatus !== "active"}>
            Salvar Segmentação
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
