import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Calendar,
  Users,
  Trophy,
  Settings,
  Play,
  Pause,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  Target,
  TrendingUp,
  UserCheck,
  Building2,
  Sparkles,
} from "lucide-react";
import type { Class, Round } from "@shared/schema";

interface Team {
  id: string;
  name: string;
  classId: string;
}

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  stats?: { label: string; value: string | number; variant?: "default" | "success" | "warning" | "destructive" }[];
  primaryAction: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  badges?: { label: string; variant: "default" | "secondary" | "outline" | "destructive" }[];
}

function ActionCard({
  title,
  description,
  icon: Icon,
  iconColor,
  stats,
  primaryAction,
  secondaryAction,
  badges,
}: ActionCardProps) {
  return (
    <Card className="hover-elevate transition-all" data-testid={`action-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className={`h-10 w-10 rounded-lg ${iconColor} flex items-center justify-center flex-shrink-0`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {badges.map((badge, i) => (
                <Badge key={i} variant={badge.variant} className="text-xs">
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <CardTitle className="text-lg mt-3">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-2 rounded-lg bg-muted/50">
                <p className={`text-lg font-bold ${
                  stat.variant === "success" ? "text-green-600" :
                  stat.variant === "warning" ? "text-amber-600" :
                  stat.variant === "destructive" ? "text-red-600" :
                  ""
                }`}>
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Button 
            onClick={primaryAction.onClick} 
            className="flex-1 gap-2"
            data-testid={`button-${title.toLowerCase().replace(/\s+/g, '-')}-primary`}
          >
            {primaryAction.label}
            <ArrowRight className="h-4 w-4" />
          </Button>
          {secondaryAction && (
            <Button 
              variant="outline" 
              onClick={secondaryAction.onClick}
              data-testid={`button-${title.toLowerCase().replace(/\s+/g, '-')}-secondary`}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ProfessorHomeProps {
  selectedClass: string | null;
  setSelectedClass: (id: string) => void;
  setActiveTab: (tab: string) => void;
  classes: Class[];
  rounds: Round[];
  teams: Team[];
  activeRound: Round | null;
}

export function ProfessorHome({
  selectedClass,
  setSelectedClass,
  setActiveTab,
  classes,
  rounds,
  teams,
  activeRound,
}: ProfessorHomeProps) {
  const currentClass = classes.find((c) => c.id === selectedClass);
  const completedRounds = rounds.filter((r) => r.status === "completed").length;
  const pendingSubmissions = teams.length - (activeRound ? teams.filter(t => {
    return true;
  }).length : 0);

  if (!selectedClass || !currentClass) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          {classes.length === 0 ? (
            <>
              <h2 className="text-xl font-semibold mb-2">Bem-vindo ao Simula+</h2>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Você ainda não criou nenhuma turma. Crie sua primeira turma para começar a simulação de marketing.
              </p>
              <Button onClick={() => setActiveTab("overview")} data-testid="button-create-first-class">
                <Building2 className="h-4 w-4 mr-2" />
                Criar Primeira Turma
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-2">Selecione uma Turma</h2>
              <p className="text-muted-foreground mb-4">
                Escolha uma turma para gerenciar
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {classes.map((cls) => (
                  <Button
                    key={cls.id}
                    variant="outline"
                    onClick={() => setSelectedClass(cls.id)}
                    className="gap-2"
                    data-testid={`button-select-class-${cls.id}`}
                  >
                    <Building2 className="h-4 w-4" />
                    {cls.name}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            {currentClass.name}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            O que você gostaria de fazer hoje?
          </p>
        </div>
        {activeRound && (
          <Badge className="bg-green-500 text-white gap-1 py-1 px-3" data-testid="badge-active-round">
            <Play className="h-3 w-3" />
            Rodada {activeRound.roundNumber} Ativa
          </Badge>
        )}
      </div>

      {!activeRound && rounds.length > 0 && (
        <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20" data-testid="alert-no-active-round">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">Nenhuma rodada ativa</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            Os alunos não podem fazer submissões no momento. Inicie uma nova rodada para liberar as decisões.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          title="Rodadas"
          description="Controle o fluxo das rodadas e processamento de resultados"
          icon={Calendar}
          iconColor="bg-blue-500"
          stats={[
            { label: "Ativas", value: activeRound ? 1 : 0, variant: activeRound ? "success" : "default" },
            { label: "Concluídas", value: completedRounds },
          ]}
          badges={activeRound ? [{ label: "Em Andamento", variant: "default" }] : undefined}
          primaryAction={{ label: "Gerenciar", onClick: () => setActiveTab("rounds") }}
        />

        <ActionCard
          title="Equipes & Alunos"
          description="Visualize status das equipes e acompanhe submissões"
          icon={Users}
          iconColor="bg-purple-500"
          stats={[
            { label: "Equipes", value: teams.length },
            { label: "Alunos", value: teams.length * 4 },
          ]}
          primaryAction={{ label: "Visualizar", onClick: () => setActiveTab("teams") }}
        />

        <ActionCard
          title="Resultados"
          description="Ranking, KPIs e comparativos entre equipes"
          icon={Trophy}
          iconColor="bg-amber-500"
          stats={[
            { label: "Rodadas", value: completedRounds },
            { label: "Rankings", value: completedRounds > 0 ? "Disponível" : "—" },
          ]}
          badges={completedRounds > 0 ? [{ label: `R${completedRounds}`, variant: "outline" }] : undefined}
          primaryAction={{ label: "Ver Resultados", onClick: () => setActiveTab("results") }}
        />

        <ActionCard
          title="Configurações"
          description="Parâmetros da turma, orçamento e simulação"
          icon={Settings}
          iconColor="bg-slate-500"
          stats={[
            { label: "Orçamento", value: `R$ ${((currentClass.defaultBudget || 100000) / 1000).toFixed(0)}k` },
            { label: "Setor", value: currentClass.sector || "—" },
          ]}
          primaryAction={{ label: "Configurar", onClick: () => setActiveTab("overview") }}
        />
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-quick-status">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Status da Simulação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rodada Atual</span>
              <Badge variant={activeRound ? "default" : "secondary"}>
                {activeRound ? `Rodada ${activeRound.roundNumber}` : "Nenhuma"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total de Rodadas</span>
              <span className="font-medium">{rounds.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Equipes Ativas</span>
              <span className="font-medium">{teams.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-recent-activity">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Ações Sugeridas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!activeRound && rounds.length === 0 && (
              <div className="flex items-center gap-2 text-sm p-2 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
                <Play className="h-4 w-4" />
                Criar e iniciar a primeira rodada
              </div>
            )}
            {!activeRound && rounds.length > 0 && (
              <div className="flex items-center gap-2 text-sm p-2 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300">
                <Play className="h-4 w-4" />
                Iniciar próxima rodada
              </div>
            )}
            {activeRound && (
              <div className="flex items-center gap-2 text-sm p-2 rounded bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4" />
                Rodada em andamento
              </div>
            )}
            {teams.length === 0 && (
              <div className="flex items-center gap-2 text-sm p-2 rounded bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300">
                <Users className="h-4 w-4" />
                Criar equipes para a turma
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-analytics-shortcut">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Acesse métricas detalhadas e evolução de KPIs da turma.
            </p>
            <Link href={`/professor/analytics/${selectedClass}`}>
              <Button variant="outline" className="w-full gap-2" data-testid="button-analytics">
                <TrendingUp className="h-4 w-4" />
                Abrir Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
