import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Building2,
  Lightbulb,
  TrendingUp,
  Target,
  BarChart3,
  Wallet,
  Users,
  PlayCircle,
  PartyPopper,
  Sparkles,
  Loader2,
} from "lucide-react";
import type { Team, PracticeRound } from "@shared/schema";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface PracticeResultSummary {
  alcanceEstimado: number;
  engajamentoEstimado: number;
  roiEstimado: number;
  dicas: string[];
}

const TOUR_ITEMS = [
  { icon: LayoutDashboard, title: "Painel", description: "Visão geral da sua equipe: orçamento, rodada atual e indicadores." },
  { icon: Building2, title: "Identidade da Empresa", description: "Nome, marca e posicionamento da empresa que vocês vão construir." },
  { icon: Lightbulb, title: "Mix de Marketing (4 Ps)", description: "As decisões de produto, preço, praça e promoção de cada rodada." },
  { icon: TrendingUp, title: "Análise de Mercado", description: "O comportamento do mercado e da concorrência a cada rodada." },
  { icon: Target, title: "Ferramentas Estratégicas", description: "SWOT, Porter, BCG e outras análises para embasar as decisões." },
  { icon: BarChart3, title: "Resultados", description: "O desempenho da equipe depois que cada rodada é processada." },
  { icon: Wallet, title: "Orçamento", description: "Quanto a equipe tem disponível para investir a cada rodada." },
];

const CHANNEL_OPTIONS = [
  { value: "digital", label: "Marketing Digital" },
  { value: "redes_sociais", label: "Redes Sociais" },
  { value: "influenciadores", label: "Influenciadores" },
  { value: "tv", label: "TV" },
  { value: "ponto_de_venda", label: "Ponto de Venda" },
];

const QUALITY_OPTIONS = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
];

const PRICE_OPTIONS = [
  { value: "economico", label: "Econômico" },
  { value: "competitivo", label: "Competitivo" },
  { value: "premium", label: "Premium" },
];

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Sala de espera: aparece enquanto a equipe ainda não tem membros
// suficientes, ou enquanto o líder ainda não confirmou que ela está
// completa.
function WaitingRoom({ team, isLeader }: { team: Team; isLeader: boolean }) {
  const { toast } = useToast();

  const { data: members = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/team/members"],
  });

  const confirmReadyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/teams/${team.id}/confirm-ready`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/practice/current"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Não foi possível confirmar a equipe",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const memberCount = team.memberIds.length;
  const canConfirm = memberCount >= 3;

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Montando a equipe</CardTitle>
          </div>
          <CardDescription>
            Antes de começar, sua equipe precisa ter entre 3 e 4 integrantes. Assim que
            estiver completa, vocês desbloqueiam a Rodada 0 — uma rodada de treino para
            se familiarizar com o jogo, que não conta para a pontuação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Integrantes</span>
            <Badge variant={canConfirm ? "default" : "outline"}>{memberCount}/4</Badge>
          </div>
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                <span>{member.name}</span>
                {member.id === team.leaderId && (
                  <Badge variant="secondary" className="text-xs">Líder</Badge>
                )}
              </div>
            ))}
          </div>

          {isLeader ? (
            <Button
              className="w-full"
              disabled={!canConfirm || confirmReadyMutation.isPending}
              onClick={() => confirmReadyMutation.mutate()}
              data-testid="button-confirm-team-ready"
            >
              {confirmReadyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {canConfirm
                ? "Confirmar equipe e iniciar Rodada 0"
                : `Faltam pelo menos ${3 - memberCount} colega(s) para confirmar`}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              {canConfirm
                ? "Avise seu líder de equipe para confirmar e liberar a Rodada 0."
                : "Aguardando mais colegas entrarem na equipe (mínimo de 3 integrantes)."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Passo 0 — tour guiado pelas telas do jogo.
function TourStep({ onNext }: { onNext: () => void }) {
  return (
    <Card className="max-w-2xl w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Bem-vindos ao Simula+</CardTitle>
        </div>
        <CardDescription>
          Antes da rodada valendo, vocês vão fazer a Rodada 0: uma rodada de treino,
          idêntica em estrutura à rodada real, mas que não afeta o orçamento nem o
          resultado da equipe. Ela serve só para vocês se familiarizarem com as telas
          abaixo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          {TOUR_ITEMS.map((item) => (
            <div key={item.title} className="flex gap-3 border rounded-md p-3">
              <item.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        <Button className="w-full" onClick={onNext} data-testid="button-start-practice">
          <PlayCircle className="h-4 w-4 mr-2" />
          Começar Rodada 0
        </Button>
      </CardContent>
    </Card>
  );
}

interface WizardProps {
  team: Team;
  practiceRound: PracticeRound;
}

// Passos 1 a 3 — mesmas etapas de decisão de uma rodada real (orçamento,
// campanha, produto/mercado), só que calculadas de forma isolada e
// simplificada, sem tocar a rodada real da turma.
function DecisionWizard({ team, practiceRound }: WizardProps) {
  const { toast } = useToast();
  const decisions = (practiceRound.decisions as Record<string, any>) || {};

  const [step, setStep] = useState<1 | 2 | 3 | 4>(
    !decisions.budget ? 1 : !decisions.campaign ? 2 : !decisions.product ? 3 : 4
  );

  const totalBudget = team.initialBudget || 100000;
  const [marketingAllocation, setMarketingAllocation] = useState(
    decisions.budget?.marketingAllocation ?? Math.round(totalBudget * 0.3)
  );
  const [channel, setChannel] = useState(decisions.campaign?.channel ?? "digital");
  const [duration, setDuration] = useState(decisions.campaign?.duration ?? 4);
  const [targetAudience, setTargetAudience] = useState(decisions.campaign?.targetAudience ?? "");
  const [quality, setQuality] = useState(decisions.product?.quality ?? "media");
  const [priceStrategy, setPriceStrategy] = useState(decisions.product?.priceStrategy ?? "competitivo");

  const [result, setResult] = useState<PracticeResultSummary | null>(
    practiceRound.status === "concluida" ? (practiceRound.resultSummary as PracticeResultSummary | null) : null
  );

  const saveDecisions = useMutation({
    mutationFn: async (partial: Record<string, any>) => {
      const res = await apiRequest("PATCH", "/api/practice/decisions", partial);
      return res.json();
    },
    onError: (error: Error) => {
      toast({ title: "Não foi possível salvar", description: error.message, variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/practice/complete");
      return res.json() as Promise<PracticeRound>;
    },
    onSuccess: (updated) => {
      setResult(updated.resultSummary as PracticeResultSummary);
      setStep(4);
    },
    onError: (error: Error) => {
      toast({ title: "Não foi possível concluir a Rodada 0", description: error.message, variant: "destructive" });
    },
  });

  const finishMutation = useMutation({
    mutationFn: async () => {
      // O time já foi marcado como treinado no back-end ao concluir a
      // Rodada 0; aqui só precisamos atualizar o estado local do app.
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/practice/current"] });
    },
  });

  const progress = (Math.min(step, 4) / 4) * 100;

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <div className="max-w-2xl w-full space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Rodada 0 · Treino</span>
            <span>Etapa {Math.min(step, 4)} de 4</span>
          </div>
          <Progress value={progress} />
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <CardTitle>Orçamento</CardTitle>
              </div>
              <CardDescription>
                Sua equipe tem {formatBRL(totalBudget)} disponíveis. Decida quanto desse
                valor vai para marketing nesta rodada de treino.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="marketing-allocation">Investimento em marketing</Label>
                <Input
                  id="marketing-allocation"
                  type="number"
                  min={0}
                  max={totalBudget}
                  step={1000}
                  value={marketingAllocation}
                  onChange={(e) => setMarketingAllocation(Number(e.target.value))}
                  data-testid="input-practice-marketing-allocation"
                />
                <p className="text-xs text-muted-foreground">
                  De {formatBRL(totalBudget)} disponíveis.
                </p>
              </div>
              <Button
                className="w-full"
                disabled={saveDecisions.isPending}
                onClick={() => {
                  saveDecisions.mutate({
                    budget: { totalBudget, marketingAllocation },
                  });
                  setStep(2);
                }}
                data-testid="button-practice-step1-continue"
              >
                Continuar
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <CardTitle>Campanha</CardTitle>
              </div>
              <CardDescription>Escolha o canal e o formato da campanha de treino.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Canal</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger data-testid="select-practice-channel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNEL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="practice-duration">Duração (semanas)</Label>
                <Input
                  id="practice-duration"
                  type="number"
                  min={1}
                  max={12}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  data-testid="input-practice-duration"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="practice-audience">Público-alvo</Label>
                <Input
                  id="practice-audience"
                  placeholder="Ex: Jovens de 18 a 25 anos"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  data-testid="input-practice-audience"
                />
              </div>
              <Button
                className="w-full"
                disabled={saveDecisions.isPending}
                onClick={() => {
                  saveDecisions.mutate({
                    campaign: { channel, duration, targetAudience },
                  });
                  setStep(3);
                }}
                data-testid="button-practice-step2-continue"
              >
                Continuar
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle>Produto e Mercado</CardTitle>
              </div>
              <CardDescription>Defina a qualidade do produto e a estratégia de preço.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Qualidade do produto</Label>
                <Select value={quality} onValueChange={setQuality}>
                  <SelectTrigger data-testid="select-practice-quality">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUALITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estratégia de preço</Label>
                <Select value={priceStrategy} onValueChange={setPriceStrategy}>
                  <SelectTrigger data-testid="select-practice-price">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                disabled={completeMutation.isPending}
                onClick={async () => {
                  await saveDecisions.mutateAsync({
                    product: { quality, priceStrategy },
                  });
                  completeMutation.mutate();
                }}
                data-testid="button-practice-step3-finish"
              >
                {completeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Concluir Rodada 0
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 4 && result && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PartyPopper className="h-5 w-5 text-primary" />
                <CardTitle>Treino concluído!</CardTitle>
              </div>
              <CardDescription>
                Veja como suas decisões teriam se comportado. Este resultado é só uma
                simulação de treino — não conta para a nota nem afeta o orçamento real.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="border rounded-md p-3 text-center">
                  <p className="text-xs text-muted-foreground">Alcance estimado</p>
                  <p className="text-lg font-semibold">{result.alcanceEstimado?.toLocaleString("pt-BR")}</p>
                </div>
                <div className="border rounded-md p-3 text-center">
                  <p className="text-xs text-muted-foreground">Engajamento estimado</p>
                  <p className="text-lg font-semibold">{result.engajamentoEstimado}%</p>
                </div>
                <div className="border rounded-md p-3 text-center">
                  <p className="text-xs text-muted-foreground">ROI estimado</p>
                  <p className="text-lg font-semibold">{result.roiEstimado}%</p>
                </div>
              </div>
              <div className="space-y-2">
                {(result.dicas || []).map((dica: string, idx: number) => (
                  <p key={idx} className="text-sm text-muted-foreground border-l-2 border-primary pl-3">
                    {dica}
                  </p>
                ))}
              </div>
              <Button
                className="w-full"
                disabled={finishMutation.isPending}
                onClick={() => finishMutation.mutate()}
                data-testid="button-practice-go-to-dashboard"
              >
                Concluir e ir para o painel
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export function RodadaZero({ team, isLeader }: { team: Team; isLeader: boolean }) {
  const [showTour, setShowTour] = useState(true);

  const { data, isLoading } = useQuery<{ team: Team; practiceRound: PracticeRound | null }>({
    queryKey: ["/api/practice/current"],
  });

  // Se a equipe ainda não foi confirmada pelo líder, mostra a sala de espera.
  if (!team.readyConfirmedAt) {
    return <WaitingRoom team={team} isLeader={isLeader} />;
  }

  if (isLoading || !data?.practiceRound) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const practiceRound = data.practiceRound;
  const hasStartedDecisions = Boolean((practiceRound.decisions as Record<string, any>)?.budget);

  if (showTour && !hasStartedDecisions) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-4">
        <TourStep onNext={() => setShowTour(false)} />
      </div>
    );
  }

  return <DecisionWizard team={team} practiceRound={practiceRound} />;
}
