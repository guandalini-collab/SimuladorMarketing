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
import { CORES_BCG } from "@/components/bcg-matriz";
import { classificarBcg, participacaoRelativa } from "@shared/bcg";
import { SwotSomenteLeitura, PorterSomenteLeitura, BcgSomenteLeitura, PestelSomenteLeitura } from "@/components/analises-prontas";

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
    analisesDaIA?: boolean;
  }>({
    queryKey: ["/api/strategy", currentRound?.id],
    enabled: !!currentRound,
  });

  // Out/2026 (pedido do professor): só o líder grava as ferramentas e a
  // segmentação; os demais membros (e equipe sem líder) veem em modo
  // visualização. O servidor também recusa.
  const { data: minhaEquipe } = useQuery<any>({ queryKey: ["/api/team/current"] });
  const semLider = !!minhaEquipe && !minhaEquipe.leaderId;
  const naoLider = !!minhaEquipe && !!currentUser?.id && minhaEquipe.leaderId !== currentUser.id;
  const statusEdicao = naoLider ? "visualizacao" : (currentRound?.status ?? "");

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
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
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
        <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-muted overflow-x-auto">
          <TabsTrigger
            value="swot"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 sm:py-3 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-950"
          >
            <Target className="h-5 w-5" />
            <span className="font-semibold text-[11px] sm:text-sm">SWOT</span>
          </TabsTrigger>
          <TabsTrigger
            value="porter"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 sm:py-3 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-950"
          >
            <Shield className="h-5 w-5" />
            <span className="font-semibold text-[11px] sm:text-sm">5 Forças</span>
          </TabsTrigger>
          <TabsTrigger
            value="bcg"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 sm:py-3 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-950"
          >
            <TrendingUp className="h-5 w-5" />
            <span className="font-semibold text-[11px] sm:text-sm">BCG</span>
          </TabsTrigger>
          <TabsTrigger
            value="pestel"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 sm:py-3 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-950"
          >
            <Globe className="h-5 w-5" />
            <span className="font-semibold text-[11px] sm:text-sm">PESTEL</span>
          </TabsTrigger>
          <TabsTrigger
            value="segmentacao"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 sm:py-3 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-950"
          >
            <Users className="h-5 w-5" />
            <span className="font-semibold text-[11px] sm:text-sm">Segmentação</span>
          </TabsTrigger>
        </TabsList>

        {naoLider && currentRound.status === "active" && (
          <div className="mt-4 rounded-lg border border-[#1447e6]/40 bg-[#eef2ff] p-4 text-sm text-[#1447e6] dark:bg-blue-950/20 dark:text-blue-200" data-testid="alert-strategy-view-only">
            <p className="font-semibold">Modo visualização</p>
            <p>{semLider
              ? "A equipe ainda não escolheu o líder. Combinem entre vocês e usem \"Definir como Líder\" no Dashboard: só o líder grava as ferramentas e a segmentação."
              : "Apenas o líder grava as ferramentas e a segmentação. Discuta com a equipe e proponha as mudanças ao líder."}</p>
          </div>
        )}

        {/* Out/2026: nas turmas com análises prontas da rodada, SWOT, Porter,
            BCG e PESTEL são somente leitura; a Segmentação segue com a equipe. */}
        <TabsContent value="swot" forceMount className="data-[state=inactive]:hidden">
          {strategy?.analisesDaIA
            ? <SwotSomenteLeitura data={strategy?.swot} />
            : <SwotTab roundId={currentRound.id} roundNumber={currentRound.roundNumber} roundStatus={statusEdicao} data={strategy?.swot} />}
        </TabsContent>

        <TabsContent value="porter" forceMount className="data-[state=inactive]:hidden">
          {strategy?.analisesDaIA
            ? <PorterSomenteLeitura data={strategy?.porter} />
            : <PorterTab roundId={currentRound.id} roundNumber={currentRound.roundNumber} roundStatus={statusEdicao} data={strategy?.porter} />}
        </TabsContent>

        <TabsContent value="bcg" forceMount className="data-[state=inactive]:hidden">
          {strategy?.analisesDaIA
            ? <BcgSomenteLeitura data={strategy?.bcg || []} />
            : <BcgTab roundId={currentRound.id} roundNumber={currentRound.roundNumber} roundStatus={statusEdicao} data={strategy?.bcg || []} />}
        </TabsContent>

        <TabsContent value="pestel" forceMount className="data-[state=inactive]:hidden">
          {strategy?.analisesDaIA
            ? <PestelSomenteLeitura data={strategy?.pestel} />
            : <PestelTab roundId={currentRound.id} roundNumber={currentRound.roundNumber} roundStatus={statusEdicao} data={strategy?.pestel} />}
        </TabsContent>

        <TabsContent value="segmentacao" forceMount className="data-[state=inactive]:hidden">
          <SegmentacaoTab
            roundId={currentRound.id}
            roundNumber={currentRound.roundNumber}
            roundStatus={statusEdicao}
            businessType={businessType}
            b2cData={strategy?.segmentation?.b2c}
            b2bData={strategy?.segmentation?.b2b}
            analisesProntas={!!strategy?.analisesDaIA}
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
      queryClient.invalidateQueries({ queryKey: ["/api/team/current-round-status"] });
      toast({ title: "Análise SWOT salva!", description: "Sua análise foi atualizada com sucesso." });
    },
    onError: (e: any) => toast({ title: "Não foi possível salvar", description: e?.message || "Verifique a conexão e tente de novo.", variant: "destructive" }),
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
                  ? "✨ Rodada 1: Análise inicial já disponível"
                  : hasData
                    ? "📋 Análise herdada da rodada anterior"
                    : "📝 Preencha sua análise estratégica"}
              </p>
              <p className="text-sm text-muted-foreground">
                {roundNumber === 1
                  ? "Esta é uma versão inicial fornecida como ponto de partida. Personalize, adicione suas próprias ideias e clique em 'Salvar' para preservar suas alterações."
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
                    onKeyPress={(e) => e.key === "Enter" && roundStatus === "active" && addItem(cat.key)}
                    disabled={roundStatus !== "active"}
                  />
                  <Button size="icon" onClick={() => addItem(cat.key)} disabled={roundStatus !== "active"}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {swot[cat.key].map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                      <span className="flex-1 text-sm">{item}</span>
                      <Button size="icon" variant="ghost" onClick={() => removeItem(cat.key, idx)} disabled={roundStatus !== "active"}>
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
      queryClient.invalidateQueries({ queryKey: ["/api/team/current-round-status"] });
      toast({ title: "5 Forças de Porter salvas!", description: "Sua análise foi atualizada." });
    },
    onError: (e: any) => toast({ title: "Não foi possível salvar", description: e?.message || "Verifique a conexão e tente de novo.", variant: "destructive" }),
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
                  ? "✨ Rodada 1: Análise inicial já disponível"
                  : hasData
                    ? "📋 Análise herdada da rodada anterior"
                    : "📝 Preencha sua análise estratégica"}
              </p>
              <p className="text-sm text-muted-foreground">
                {roundNumber === 1
                  ? "Esta é uma versão inicial fornecida como ponto de partida. Personalize, adicione suas próprias ideias e clique em 'Salvar' para preservar suas alterações."
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

// Matriz BCG no modelo da Boston Consulting Group (pedido do professor,
// out/2026). O aluno informa o crescimento do mercado e as participações (%)
// da empresa e do maior concorrente; a participação relativa e o quadrante
// são calculados pela regra única de shared/bcg.ts (a mesma do servidor).
// Os dados reais do jogo (crescimento da turma, participações e receita do
// última rodada com resultado) vêm de /api/strategy/:roundId/bcg-contexto.
interface BcgContexto {
  crescimentoMercado: number | null;
  fonteCrescimento: string | null;
  referencia: { roundNumber: number; participacaoEquipe: number; participacaoMaiorConcorrente: number | null } | null;
  participacaoRelativa: number | null;
  receitas: { productId: string; productName: string; revenue: number }[];
}

const numBR = (v: number | null | undefined, casas = 1) =>
  v === null || v === undefined || !Number.isFinite(v) ? "—" : v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

function BcgTab({ roundId, roundNumber, roundStatus, data }: { roundId: string; roundNumber: number; roundStatus: string; data: any[] }) {
  const { toast } = useToast();
  const hasData = data.length > 0;
  const { data: contexto } = useQuery<BcgContexto>({ queryKey: [`/api/strategy/${roundId}/bcg-contexto`] });
  const formVazio = { productName: "", crescimento: "", participacaoEmpresa: "", participacaoConcorrente: "" };
  const [form, setForm] = useState(formVazio);
  const [crescimentoPreenchido, setCrescimentoPreenchido] = useState(false);

  useEffect(() => {
    if (!crescimentoPreenchido && contexto?.crescimentoMercado != null) {
      setForm((f) => ({ ...f, crescimento: String(contexto.crescimentoMercado) }));
      setCrescimentoPreenchido(true);
    }
  }, [contexto, crescimentoPreenchido]);

  const lerNumero = (s: string) => {
    const v = Number(String(s).replace(",", "."));
    return s.trim() === "" || !Number.isFinite(v) ? null : v;
  };
  const crescimento = lerNumero(form.crescimento);
  const relativa = participacaoRelativa(lerNumero(form.participacaoEmpresa) ?? NaN, lerNumero(form.participacaoConcorrente) ?? NaN);
  const quadrantePrevisto = crescimento !== null && relativa !== null ? classificarBcg(crescimento, relativa) : null;

  const usarDadosDoJogo = () => {
    const ref = contexto?.referencia;
    if (!ref) return;
    setForm((f) => ({
      ...f,
      participacaoEmpresa: String(Math.round(ref.participacaoEquipe * 100) / 100),
      participacaoConcorrente: ref.participacaoMaiorConcorrente != null ? String(Math.round(ref.participacaoMaiorConcorrente * 100) / 100) : f.participacaoConcorrente,
      crescimento: contexto?.crescimentoMercado != null ? String(contexto.crescimentoMercado) : f.crescimento,
    }));
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      if (crescimento === null || relativa === null) throw new Error("Preencha o crescimento e as duas participações.");
      const produto = contexto?.receitas?.find((r) => r.productName && r.productName.trim().toLowerCase() === form.productName.trim().toLowerCase());
      const res = await apiRequest("POST", "/api/strategy/bcg", {
        roundId,
        productName: form.productName.trim(),
        productId: produto?.productId,
        marketGrowth: crescimento,
        relativeMarketShare: Math.round(relativa * 100) / 100,
        quadrant: classificarBcg(crescimento, relativa),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategy", roundId] });
      queryClient.invalidateQueries({ queryKey: ["/api/team/current-round-status"] });
      toast({ title: "Produto adicionado!", description: "Produto inserido na Matriz BCG." });
      setForm((f) => ({ ...formVazio, crescimento: f.crescimento }));
    },
    onError: (e: any) => toast({ title: "Não foi possível adicionar", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/strategy/bcg/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategy", roundId] });
      queryClient.invalidateQueries({ queryKey: ["/api/team/current-round-status"] });
      toast({ title: "Produto removido", description: "Produto removido da matriz." });
    },
    onError: (e: any) => toast({ title: "Não foi possível salvar", description: e?.message || "Verifique a conexão e tente de novo.", variant: "destructive" }),
  });

  // Receita do produto na última rodada: pelo id; senão, pelo nome (igual ou
  // contido — ex.: "Smartphone Recondicionado" ↔ "Smartphone").
  const receitaDe = (p: any) => {
    const lista = contexto?.receitas ?? [];
    const nome = String(p.productName || "").trim().toLowerCase();
    const porId = lista.find((r) => p.productId && r.productId === p.productId);
    if (porId) return porId.revenue;
    const n = (r: { productName: string }) => r.productName.trim().toLowerCase();
    const igual = lista.find((r) => r.productName && n(r) === nome);
    if (igual) return igual.revenue;
    const contido = lista.filter((r) => r.productName && nome && (nome.includes(n(r)) || n(r).includes(nome)));
    return contido.length === 1 ? contido[0].revenue : null;
  };
  const produtos = data.map((p: any) => ({ ...p, revenue: receitaDe(p) }));
  const nomesSugeridos = Array.from(new Set((contexto?.receitas ?? []).map((r) => r.productName).filter(Boolean)));
  const podeAdicionar = !!form.productName.trim() && crescimento !== null && relativa !== null && roundStatus === "active";

  return (
    <div className="space-y-4">
      {roundStatus === "active" && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">
                {roundNumber === 1
                  ? "✨ Rodada 1: Análise inicial já disponível"
                  : hasData
                    ? "📋 Análise herdada da rodada anterior"
                    : "📝 Preencha sua análise estratégica"}
              </p>
              <p className="text-sm text-muted-foreground">
                {roundNumber === 1
                  ? "Esta é uma versão inicial fornecida como ponto de partida. Personalize, adicione suas próprias ideias e clique em 'Salvar' para preservar suas alterações."
                  : hasData
                    ? "Você já mapeou seus produtos antes, e eles continuam valendo automaticamente nesta rodada — não precisa reinserir nada. Reveja se ainda fazem sentido com os números da última rodada: exclua e adicione de novo os produtos cuja posição mudou. Atenção: se o quadrante não bater com o que você está realmente praticando no mix de marketing, isso reduz sua pontuação de alinhamento estratégico."
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
              <CardDescription>Posicione cada produto pelo crescimento do mercado e pela participação relativa (modelo da Boston Consulting Group)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm" data-testid="bcg-dados-jogo">
            <p className="font-medium">Dados do jogo para a sua análise</p>
            <ul className="mt-1 space-y-0.5 text-muted-foreground">
              <li>
                Crescimento do mercado: <strong className="text-foreground">{numBR(contexto?.crescimentoMercado)}% ao ano</strong>
                {contexto?.fonteCrescimento ? ` (${contexto.fonteCrescimento})` : ""}
              </li>
              {contexto?.referencia ? (
                <li>
                  Rodada {contexto.referencia.roundNumber}: participação da equipe <strong className="text-foreground">{numBR(contexto.referencia.participacaoEquipe)}%</strong>
                  {contexto.referencia.participacaoMaiorConcorrente != null && (
                    <> · maior concorrente <strong className="text-foreground">{numBR(contexto.referencia.participacaoMaiorConcorrente)}%</strong> · relativa <strong className="text-foreground">{numBR(contexto.participacaoRelativa, 2)}×</strong></>
                  )}
                </li>
              ) : (
                <li>As participações aparecem aqui depois da primeira rodada com resultado.</li>
              )}
            </ul>
            {contexto?.referencia && roundStatus === "active" && (
              <Button variant="outline" size="sm" className="mt-2" onClick={usarDadosDoJogo} data-testid="button-bcg-usar-dados">
                Usar os números da rodada {contexto.referencia.roundNumber}
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome do produto</Label>
                <Input
                  placeholder="Ex.: Produto Premium"
                  list="bcg-produtos-sugeridos"
                  value={form.productName}
                  onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                  data-testid="input-bcg-produto"
                />
                <datalist id="bcg-produtos-sugeridos">
                  {nomesSugeridos.map((n) => <option key={n} value={n} />)}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Crescimento do mercado (% ao ano)</Label>
                <Input type="number" step="0.1" placeholder="Ex.: 8,5" value={form.crescimento} onChange={(e) => setForm((f) => ({ ...f, crescimento: e.target.value }))} data-testid="input-bcg-crescimento" />
                <p className="text-xs text-muted-foreground">Pode ser negativo, se o mercado estiver encolhendo. Corte do modelo: 10%.</p>
              </div>
              <div className="space-y-2">
                <Label>Participação de mercado da sua empresa (%)</Label>
                <Input type="number" step="0.1" min="0" placeholder="Ex.: 12" value={form.participacaoEmpresa} onChange={(e) => setForm((f) => ({ ...f, participacaoEmpresa: e.target.value }))} data-testid="input-bcg-part-empresa" />
              </div>
              <div className="space-y-2">
                <Label>Participação do maior concorrente (%)</Label>
                <Input type="number" step="0.1" min="0" placeholder="Ex.: 20" value={form.participacaoConcorrente} onChange={(e) => setForm((f) => ({ ...f, participacaoConcorrente: e.target.value }))} data-testid="input-bcg-part-concorrente" />
                <p className="text-xs text-muted-foreground">Se a sua empresa é a líder, informe o segundo colocado.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm" data-testid="bcg-previa">
              <span>
                Participação relativa: <strong>{relativa !== null ? `${numBR(relativa, 2)}×` : "—"}</strong>
                <span className="text-muted-foreground"> (empresa ÷ maior concorrente; corte em 1,0×)</span>
              </span>
              {quadrantePrevisto && (
                <Badge className="border-transparent text-white" style={{ backgroundColor: CORES_BCG[quadrantePrevisto] }}>
                  {quadrantePrevisto}
                </Badge>
              )}
            </div>

            <Button onClick={() => addMutation.mutate()} disabled={!podeAdicionar || addMutation.isPending} data-testid="button-bcg-adicionar">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Produto
            </Button>
          </div>

          {produtos.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Produtos mapeados</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {produtos.map((product: any) => {
                  const q = classificarBcg(Number(product.marketGrowth) || 0, Number(product.relativeMarketShare) || 0);
                  return (
                    <div key={product.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{product.productName}</p>
                          <Badge className="mt-1 border-transparent text-white" style={{ backgroundColor: CORES_BCG[q] }}>{q}</Badge>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(product.id)} disabled={roundStatus !== "active"}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Crescimento do mercado: {numBR(Number(product.marketGrowth))}%</p>
                        <p>Participação relativa: {numBR(Number(product.relativeMarketShare), 2)}×</p>
                        {product.revenue ? <p>Receita na última rodada: {Number(product.revenue).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}</p> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {produtos.length > 0 && <BcgMatrixChart products={produtos} />}
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
      queryClient.invalidateQueries({ queryKey: ["/api/team/current-round-status"] });
      toast({ title: "Análise PESTEL salva!", description: "Sua análise foi atualizada." });
    },
    onError: (e: any) => toast({ title: "Não foi possível salvar", description: e?.message || "Verifique a conexão e tente de novo.", variant: "destructive" }),
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
                  ? "✨ Rodada 1: Análise inicial já disponível"
                  : hasData
                    ? "📋 Análise herdada da rodada anterior"
                    : "📝 Preencha sua análise estratégica"}
              </p>
              <p className="text-sm text-muted-foreground">
                {roundNumber === 1
                  ? "Esta é uma versão inicial fornecida como ponto de partida. Personalize, adicione suas próprias ideias e clique em 'Salvar' para preservar suas alterações."
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
                  onKeyPress={(e) => e.key === "Enter" && roundStatus === "active" && addItem(cat.key)}
                    disabled={roundStatus !== "active"}
                />
                <Button size="icon" onClick={() => addItem(cat.key)} disabled={roundStatus !== "active"}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {pestel[cat.key].map((item: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                    <span className="flex-1 text-sm">{item}</span>
                    <Button size="icon" variant="ghost" onClick={() => removeItem(cat.key, idx)} disabled={roundStatus !== "active"}>
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
  analisesProntas = false,
}: {
  roundId: string;
  roundNumber: number;
  roundStatus: string;
  businessType: string;
  b2cData?: any;
  b2bData?: any;
  analisesProntas?: boolean;
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
          analisesProntas={analisesProntas}
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
          analisesProntas={analisesProntas}
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
  analisesProntas = false,
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
  analisesProntas?: boolean;
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
      queryClient.invalidateQueries({ queryKey: ["/api/team/current-round-status"] });
      toast({ title: "Segmentação salva!", description: "Sua análise foi atualizada." });
    },
    onError: (e: any) => toast({ title: "Não foi possível salvar", description: e?.message || "Verifique a conexão e tente de novo.", variant: "destructive" }),
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
              {analisesProntas ? (
                <>
                  <p className="font-medium">
                    {hasData ? "📋 Segmentação da equipe" : "📝 Segmentação a cargo da equipe"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hasData
                      ? "Esta é a segmentação registrada pela equipe. Ela continua valendo nas próximas rodadas e pode ser editada enquanto a rodada estiver aberta."
                      : "A segmentação de mercado é feita pela equipe. Depois de salva, ela continua valendo nas próximas rodadas e pode ser editada enquanto a rodada estiver aberta."}
                  </p>
                </>
              ) : (
                <>
              <p className="font-medium">
                {roundNumber === 1
                  ? "✨ Rodada 1: Análise inicial já disponível"
                  : hasData
                    ? "📋 Análise herdada da rodada anterior"
                    : "📝 Preencha sua análise estratégica"}
              </p>
              <p className="text-sm text-muted-foreground">
                {roundNumber === 1
                  ? "Esta é uma versão inicial fornecida como ponto de partida. Personalize, adicione suas próprias ideias e clique em 'Salvar' para preservar suas alterações."
                  : hasData
                    ? "Você já preencheu essa análise antes, e ela continua valendo automaticamente nesta rodada — não precisa reescrever nada. Reveja se ainda faz sentido: edite, exclua ou adicione itens se sua estratégia mudou. Atenção: se a segmentação não bater com o que você está realmente praticando no mix de marketing (preço, canais), isso reduz sua pontuação de alinhamento estratégico."
                    : "Preencha sua análise estratégica e clique em 'Salvar' — ela vai continuar valendo nas próximas rodadas até você decidir mudar algo."}
              </p>
                </>
              )}
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
                    onKeyPress={(e) => e.key === "Enter" && roundStatus === "active" && addItem(cat.key)}
                    disabled={roundStatus !== "active"}
                  />
                  <Button size="icon" onClick={() => addItem(cat.key)} disabled={roundStatus !== "active"}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {(segmentation[cat.key] || []).map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                      <span className="flex-1 text-sm">{item}</span>
                      <Button size="icon" variant="ghost" onClick={() => removeItem(cat.key, idx)} disabled={roundStatus !== "active"}>
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
