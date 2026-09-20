import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Calendar,
  Lightbulb,
  Target,
  Zap,
  Users,
  CheckCircle2,
  Clock,
  LogOut,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/generated_images/Simula_logo_navy_dourado_final.png";
import {
  ONBOARDING_SECTION_IDS,
  ONBOARDING_MIN_SECONDS_PER_SECTION,
  type OnboardingSectionId,
  type OnboardingProgress,
} from "@shared/onboarding";

interface OnboardingStatus {
  completed: boolean;
  completedAt: string | null;
  progress: OnboardingProgress;
  sectionIds: OnboardingSectionId[];
  minSecondsPerSection: number;
}

interface SectionContent {
  id: OnboardingSectionId;
  title: string;
  icon: React.ElementType;
  color: string;
  body: string[];
}

// Pedido do professor (2026-09): conteúdo redigido a partir do Manual do
// Aluno (client/src/pages/manual.tsx), resumido para uma primeira leitura
// obrigatória antes do aluno acessar o resto do jogo. O texto completo e
// detalhado continua disponível no Manual, liberado no menu depois desta
// Rodada 0.
const SECTIONS: SectionContent[] = [
  {
    id: "boas-vindas",
    title: "Bem-vindo ao Simula+",
    icon: Sparkles,
    color: "#1447e6",
    body: [
      "O Simula+ é um simulador educacional de marketing: você e sua equipe vão administrar uma empresa fictícia, tomando decisões reais de negócio dentro de um mercado competitivo simulado, junto com outras equipes da sua turma.",
      "O objetivo não é só \"vencer\" — é aplicar, na prática, os conceitos de marketing que você estuda em sala: segmentação, posicionamento, mix de marketing, análise competitiva, indicadores de desempenho. Cada decisão que sua equipe toma tem uma consequência mensurável no resultado da rodada.",
      "O jogo acontece em ciclos chamados Rodadas. Cada rodada tem um prazo definido pelo professor: dentro dele, sua equipe analisa o mercado, define sua estratégia e toma as decisões do Mix de Marketing. Quando a rodada fecha, o sistema calcula os resultados e uma nova rodada começa — com o mercado já tendo reagido às decisões anteriores.",
      "Esta introdução (Rodada 0) não conta para nenhuma nota nem estatística do jogo. Ela existe só para garantir que todo mundo começa com o mesmo entendimento de como o Simula+ funciona antes de tomar a primeira decisão real. Cada seção pede uma leitura mínima de 2 minutos — não dá pra pular, mas dá pra ler com calma.",
    ],
  },
  {
    id: "rodadas",
    title: "Como o Jogo Funciona: Rodadas",
    icon: Calendar,
    color: "#7c3aed",
    body: [
      "O professor controla o ritmo do jogo: ele inicia cada rodada, define o prazo (data e hora de encerramento) e, quando o prazo chega, encerra a rodada e processa os resultados. Fique de olho no prazo — depois que a rodada fecha, não dá mais para enviar ou alterar decisões daquela rodada.",
      "Dentro de uma rodada ativa, sua equipe pode revisar as análises estratégicas, ajustar o Mix de Marketing quantas vezes quiser, e só precisa enviar (submeter) a decisão final quando estiver pronta. Depois de enviada, ela fica travada até o fechamento da rodada.",
      "Um detalhe importante: as suas análises estratégicas (que você vai conhecer daqui a pouco) não precisam ser refeitas a cada rodada. O que você preencheu continua valendo automaticamente nas rodadas seguintes — você só edita se a sua estratégia realmente mudou. Isso existe porque, na vida real, uma empresa não reinventa sua estratégia toda semana.",
      "Ao final de cada rodada, o sistema calcula indicadores (KPIs) como participação de mercado, faturamento e satisfação do cliente, considerando as decisões de todas as equipes, as condições do mercado e eventuais eventos de mercado daquele período. Você vai poder comparar seu desempenho com o das outras equipes da turma.",
    ],
  },
  {
    id: "mix-marketing",
    title: "O Mix de Marketing (4 Ps)",
    icon: Lightbulb,
    color: "#ff8c1a",
    body: [
      "A cada rodada, sua equipe toma decisões nos famosos 4 Ps do marketing: Produto (características, qualidade, portfólio), Preço (quanto cobrar e com que estratégia de precificação), Praça (canais de distribuição, onde o produto chega ao cliente) e Promoção (como e quanto investir em comunicação e divulgação).",
      "O ponto-chave é a coerência entre os 4 Ps: eles precisam contar a mesma história. Um produto posicionado como premium não combina com preço baixo e distribuição de massa, por exemplo. O sistema avalia se suas decisões fazem sentido entre si e também se conversam com as análises estratégicas que sua equipe registrou.",
      "Antes de conseguir enviar (submeter) o Mix de Marketing de uma rodada, o sistema exige que sua equipe já tenha preenchido as análises estratégicas — é assim que garantimos que a decisão não é feita \"no chute\", mas com uma leitura prévia do cenário.",
    ],
  },
  {
    id: "ferramentas-estrategicas",
    title: "Ferramentas Estratégicas",
    icon: Target,
    color: "#1aa15c",
    body: [
      "Antes de decidir o Mix de Marketing, sua equipe conta com 5 ferramentas clássicas de análise estratégica: SWOT (forças, fraquezas, oportunidades e ameaças), 5 Forças de Porter (competitividade do setor), Matriz BCG (portfólio de produtos), PESTEL (fatores macroambientais) e Segmentação de Mercado (quem é o seu público-alvo).",
      "Na Rodada 1, a Inteligência Artificial já gera uma versão inicial dessas análises para a sua turma, como ponto de partida — mas o valor real está em você revisar, editar e personalizar com a visão da sua equipe, não só aceitar o que veio pronto.",
      "Cada ferramenta é preenchida uma vez e continua valendo nas rodadas seguintes (você edita quando quiser). O sistema mede o alinhamento entre o que você registrou nessas análises e o que sua equipe realmente pratica no Mix de Marketing — quanto mais coerente, melhor sua pontuação de alinhamento estratégico. Se a análise não bate com a prática, isso é penalizado.",
    ],
  },
  {
    id: "eventos-resultados",
    title: "Eventos de Mercado e Resultados",
    icon: Zap,
    color: "#e5352b",
    body: [
      "Durante o jogo, o professor pode introduzir Eventos de Mercado: situações que representam mudanças no ambiente de negócios (econômicas, tecnológicas, sociais, competitivas, regulatórias). Cada evento tem uma severidade e um efeito — ele pode favorecer o mercado, prejudicar, ou ser neutro, dependendo do que representa.",
      "Fique atento aos eventos ativos na sua rodada: eles fazem parte da leitura de cenário que deveria influenciar suas decisões de Mix de Marketing, do mesmo jeito que aconteceria numa empresa real reagindo a uma mudança no mercado.",
      "Ao fechar a rodada, o sistema calcula os resultados combinando suas decisões do Mix, as condições de mercado, os eventos ativos e o alinhamento estratégico da sua equipe. Os indicadores (participação de mercado, faturamento, satisfação do cliente, entre outros) ficam disponíveis para você acompanhar sua evolução e se comparar com as demais equipes da turma.",
    ],
  },
  {
    id: "equipe-regras",
    title: "Trabalho em Equipe e Regras",
    icon: Users,
    color: "#0891b2",
    body: [
      "O Simula+ é jogado em equipe, e por isso cada integrante — não só um representante — precisa concluir esta introdução individualmente. Discutir as decisões junto com o time antes de enviar é o que torna a experiência mais próxima de uma gestão real.",
      "Sobre o uso da IA nas análises estratégicas: ela existe para te dar um ponto de partida, não para substituir o raciocínio da equipe. Analises copiadas sem revisão tendem a não bater com as decisões reais do Mix de Marketing — e isso reduz sua pontuação de alinhamento.",
      "Fique de olho nos prazos de cada rodada: submissões fora do prazo não são aceitas. Se tiver dúvidas sobre qualquer mecânica do jogo, o Manual do Aluno completo (liberado no menu assim que você concluir esta introdução) traz o detalhamento de cada ferramenta, fórmula e regra do simulador.",
    ],
  },
];

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface OnboardingProps {
  onLogout: () => void;
}

export default function Onboarding({ onLogout }: OnboardingProps) {
  const { toast } = useToast();
  const [activeIndex, setActiveIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(ONBOARDING_MIN_SECONDS_PER_SECTION);
  const [justFinished, setJustFinished] = useState(false);

  const { data: status, isLoading } = useQuery<OnboardingStatus>({
    queryKey: ["/api/onboarding/status"],
    queryFn: async () => {
      const res = await fetch("/api/onboarding/status", { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar status do onboarding");
      return res.json();
    },
  });

  // Retoma na primeira seção ainda não concluída (suporta terminar em
  // sessões diferentes, já que o servidor guarda o progresso por aluno).
  useEffect(() => {
    if (!status) return;
    const firstIncomplete = SECTIONS.findIndex((s) => !status.progress[s.id]?.completedAt);
    setActiveIndex(firstIncomplete === -1 ? SECTIONS.length - 1 : firstIncomplete);
  }, [status?.completed]);

  const currentSection = SECTIONS[activeIndex];

  const startMutation = useMutation({
    mutationFn: async (sectionId: OnboardingSectionId) => {
      const res = await apiRequest("POST", `/api/onboarding/section/${sectionId}/start`, {});
      return res.json();
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (sectionId: OnboardingSectionId) => {
      // apiRequest já lança um erro com a mensagem amigável do servidor
      // (ex.: "Tempo mínimo de leitura ainda não atingido") quando a
      // resposta não é ok — não precisa checar res.ok aqui de novo.
      const res = await apiRequest("POST", `/api/onboarding/section/${sectionId}/complete`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/onboarding/status"], (prev: OnboardingStatus | undefined) =>
        prev ? { ...prev, progress: data.progress, completed: data.completed, completedAt: data.completedAt } : prev
      );
      if (data.completed) {
        setJustFinished(true);
        queryClient.invalidateQueries({ queryKey: ["user"] });
      } else if (activeIndex < SECTIONS.length - 1) {
        setActiveIndex((i) => i + 1);
      }
    },
    onError: (error: any) => {
      toast({ title: "Ainda não dá para avançar", description: error.message, variant: "destructive" });
    },
  });

  // Inicia o cronômetro da seção atual assim que ela é exibida (o servidor
  // é quem decide se o tempo mínimo já passou de verdade — este timer aqui
  // é só para a experiência visual do aluno).
  useEffect(() => {
    if (!status || !currentSection) return;
    const existing = status.progress[currentSection.id];

    if (existing?.completedAt) {
      setRemainingSeconds(0);
      return;
    }

    if (!existing) {
      startMutation.mutate(currentSection.id);
    }

    const startedAt = existing ? new Date(existing.startedAt).getTime() : Date.now();
    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      setRemainingSeconds(Math.max(0, Math.ceil(ONBOARDING_MIN_SECONDS_PER_SECTION - elapsed)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSection?.id, status?.progress?.[currentSection?.id ?? ""]?.startedAt]);

  const canAdvance = remainingSeconds <= 0;

  const completedCount = useMemo(() => {
    if (!status) return 0;
    return SECTIONS.filter((s) => status.progress[s.id]?.completedAt).length;
  }, [status]);

  if (isLoading || !status || !currentSection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (justFinished || status.completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Introdução concluída!</h2>
            <p className="text-sm text-muted-foreground">
              Você já pode acessar o Simula+. O Manual do Aluno completo também ficou disponível no menu, caso precise consultar qualquer detalhe depois.
            </p>
            <Button className="w-full" onClick={() => window.location.assign("/")} data-testid="button-onboarding-continue">
              Entrar no Simula+
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = currentSection.icon;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="bg-white rounded-lg px-2 py-1.5 shadow-sm">
            <img src={logoImage} alt="Simula+" className="h-7 w-auto" />
          </div>
          <Button variant="ghost" size="sm" className="gap-2" onClick={onLogout} data-testid="button-onboarding-logout">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Rodada 0 — Introdução ao jogo</span>
            <span>{completedCount} de {SECTIONS.length} seções concluídas</span>
          </div>
          <Progress value={(completedCount / SECTIONS.length) * 100} className="h-2" />
        </div>

        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s, idx) => {
            const done = Boolean(status.progress[s.id]?.completedAt);
            return (
              <Badge
                key={s.id}
                variant={idx === activeIndex ? "default" : "outline"}
                className={`gap-1 ${done ? "opacity-70" : ""}`}
              >
                {done && <CheckCircle2 className="h-3 w-3" />}
                {idx + 1}. {s.title}
              </Badge>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: currentSection.color }}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>{currentSection.title}</CardTitle>
                <CardDescription>Seção {activeIndex + 1} de {SECTIONS.length}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentSection.body.map((paragraph, idx) => (
              <p key={idx} className="text-sm leading-relaxed">{paragraph}</p>
            ))}

            <div className="pt-4 border-t flex items-center justify-between gap-4">
              {!canAdvance ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Leitura mínima: libera em {formatTime(remainingSeconds)}
                </p>
              ) : (
                <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Pode avançar
                </p>
              )}
              <Button
                onClick={() => completeMutation.mutate(currentSection.id)}
                disabled={!canAdvance || completeMutation.isPending}
                data-testid="button-onboarding-advance"
              >
                {completeMutation.isPending
                  ? "Salvando..."
                  : activeIndex === SECTIONS.length - 1
                    ? "Concluir introdução"
                    : "Próxima seção"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
