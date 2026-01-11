import { KPICard } from "@/components/kpi-card";
import { RoundChecklistCard } from "@/components/round-checklist-card";
import { DollarSign, TrendingUp, Users, Target, Plus, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import heroBanner from "@assets/generated_images/Marketing_dashboard_hero_banner_7c645c89.png";

const performanceData = [
  { name: "Jan", vendas: 4000, campanhas: 2400 },
  { name: "Fev", vendas: 3000, campanhas: 1398 },
  { name: "Mar", vendas: 2000, campanhas: 9800 },
  { name: "Abr", vendas: 2780, campanhas: 3908 },
  { name: "Mai", vendas: 1890, campanhas: 4800 },
  { name: "Jun", vendas: 2390, campanhas: 3800 },
];

interface Team {
  id: string;
  name: string;
  classId: string;
  budget: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [newTeamName, setNewTeamName] = useState("");
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  
  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  const { data: rounds = [] } = useQuery<any[]>({
    queryKey: ["/api/rounds"],
  });

  const { data: currentClass } = useQuery<any>({
    queryKey: ["/api/student/class"],
  });

  // Log access on component mount
  useEffect(() => {
    const activeRound = rounds.find((r) => r.status === "active");
    if (activeRound && currentUser && currentClass) {
      apiRequest("POST", "/api/classes/" + currentClass.id + "/log-access", {
        roundId: activeRound.id,
        action: "dashboard_access"
      }).catch(() => {}); // Silent catch for non-critical logging
    }
  }, [rounds, currentUser, currentClass]);
  
  const { data: team, isLoading: teamLoading } = useQuery<any>({
    queryKey: ["/api/team/current"],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/team/members"],
    enabled: !!team,
  });

  const { data: studentClass, isLoading: classLoading } = useQuery<any>({
    queryKey: ["/api/student/class"],
    enabled: !team && !teamLoading,
  });

  const { data: teams = [], isLoading: teamsLoading } = useQuery<any[]>({
    queryKey: ["/api/teams/class", studentClass?.id],
    enabled: !!studentClass?.id && !team,
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: { classId: string; name: string }) => {
      const res = await apiRequest("POST", "/api/teams/create", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/current"] });
      toast({
        title: "Equipe criada!",
        description: "Sua equipe foi criada com sucesso.",
      });
      setNewTeamName("");
      setShowCreateTeam(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a equipe",
        variant: "destructive",
      });
    },
  });

  const joinTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const res = await apiRequest("POST", "/api/teams/join", { teamId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/current"] });
      toast({
        title: "Equipe selecionada!",
        description: "Você entrou na equipe com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível entrar na equipe",
        variant: "destructive",
      });
    },
  });

  const updateLeaderMutation = useMutation({
    mutationFn: async (leaderId: string) => {
      const res = await apiRequest("PATCH", "/api/team/leader", { leaderId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/current"] });
      toast({
        title: "Líder atualizado!",
        description: "O líder da equipe foi alterado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o líder",
        variant: "destructive",
      });
    },
  });

  if (!team) {
    if (currentUser?.role === "equipe" && currentUser?.status === "pending") {
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cadastro Pendente de Aprovação</CardTitle>
              <CardDescription>
                Sua conta está aguardando aprovação do professor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Aguardando Aprovação
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                      <p>
                        Seu cadastro foi realizado com sucesso e está aguardando aprovação do professor.
                        Você receberá um email quando sua conta for aprovada.
                      </p>
                      <p className="mt-2">
                        Enquanto isso, você não pode criar ou entrar em equipes. Por favor, aguarde a aprovação.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    if (classLoading) {
      return (
        <div className="space-y-6">
          <Card>
            <CardContent className="py-8">
              <p className="text-muted-foreground text-center">
                Carregando informações da turma...
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!studentClass) {
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Você não está matriculado em nenhuma turma</CardTitle>
              <CardDescription>
                Aguarde o professor matricular você em uma turma para começar a participar das atividades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Como funciona?
                    </h3>
                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-2">
                      <p>1. O professor irá matricular você em uma turma</p>
                      <p>2. Após a matrícula, você poderá criar ou entrar em uma equipe</p>
                      <p>3. As equipes são compostas por até 5 alunos da mesma turma</p>
                      <p>4. Depois de formar sua equipe, você participará das atividades de marketing</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card className="border-2 border-slate-200 dark:border-slate-800">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Selecione ou Crie uma Equipe</CardTitle>
                <CardDescription className="text-base mt-1">
                  {studentClass.name} - Escolha uma equipe existente ou crie uma nova
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {teamsLoading ? (
              <p className="text-muted-foreground text-center py-8">
                Carregando equipes...
              </p>
            ) : (
              <>
                {teams.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="font-bold text-xl">Equipes Disponíveis</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {teams.map((t: any) => (
                        <Card key={t.id} className="hover-elevate border-2 border-slate-200 dark:border-slate-800 transition-all">
                          <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-md">
                                <Users className="h-5 w-5 text-white" />
                              </div>
                              <CardTitle className="text-lg">{t.name}</CardTitle>
                            </div>
                            <CardDescription className="text-base">
                              {t.memberIds.length} {t.memberIds.length === 1 ? 'membro' : 'membros'}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <Button 
                              className="w-full" 
                              size="lg"
                              onClick={() => joinTeamMutation.mutate(t.id)}
                              disabled={joinTeamMutation.isPending}
                              data-testid={`button-join-team-${t.id}`}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              {joinTeamMutation.isPending ? "Entrando..." : "Entrar na Equipe"}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {!showCreateTeam ? (
                    <Button 
                      onClick={() => setShowCreateTeam(true)}
                      variant="outline"
                      size="lg"
                      className="w-full border-2 border-dashed"
                      data-testid="button-show-create-team"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Criar Nova Equipe
                    </Button>
                  ) : (
                    <Card className="border-2 border-blue-200 dark:border-blue-800">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-950">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <Plus className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle>Criar Nova Equipe</CardTitle>
                            <CardDescription className="text-base mt-1">
                              Defina um nome para sua equipe
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                          <Label htmlFor="team-name" className="text-base">Nome da Equipe</Label>
                          <Input
                            id="team-name"
                            placeholder="Ex: Equipe Inovadora"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            className="text-base h-11"
                            data-testid="input-team-name"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => {
                              if (newTeamName.trim()) {
                                createTeamMutation.mutate({
                                  classId: studentClass.id,
                                  name: newTeamName.trim(),
                                });
                              }
                            }}
                            disabled={!newTeamName.trim() || createTeamMutation.isPending}
                            className="flex-1"
                            size="lg"
                            data-testid="button-create-team"
                          >
                            {createTeamMutation.isPending ? "Criando..." : "Criar Equipe"}
                          </Button>
                          <Button 
                            variant="outline"
                            size="lg"
                            onClick={() => {
                              setShowCreateTeam(false);
                              setNewTeamName("");
                            }}
                            data-testid="button-cancel-create-team"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section - Professional Gradient */}
      <div className="relative h-64 rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-20 w-32 h-32 border-4 border-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-40 h-40 border-4 border-white rounded-lg rotate-45 animate-pulse delay-75"></div>
        </div>
        
        <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg overflow-hidden">
              {team.logoUrl ? (
                <img 
                  src={team.logoUrl} 
                  alt={`Logo ${team.companyName || team.name}`}
                  className="h-full w-full object-cover"
                  data-testid="img-team-logo-dashboard"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>';
                  }}
                />
              ) : (
                <Users className="h-8 w-8 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                {team.companyName || team.name}
              </h1>
              <p className="text-white/80 text-lg mt-1">
                {team.companyName ? team.name : "Sua equipe de marketing estratégico"}
              </p>
            </div>
          </div>
          <p className="text-white/90 text-lg max-w-2xl">
            Continue desenvolvendo suas estratégias e acompanhe o desempenho em tempo real.
          </p>
        </div>
      </div>

      <RoundChecklistCard />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Orçamento Disponível"
          value={`R$ ${team.budget?.toLocaleString('pt-BR') || '0'}`}
          icon={DollarSign}
          testId="text-budget"
        />
        <KPICard
          title="ROI Médio"
          value="124%"
          trend={{ value: 8, isPositive: true }}
          icon={TrendingUp}
          testId="text-roi"
        />
        <KPICard
          title="Alcance Total"
          value="45.2K"
          trend={{ value: 15, isPositive: true }}
          icon={Users}
          testId="text-reach"
        />
        <KPICard
          title="Campanhas Ativas"
          value="3"
          icon={Target}
          testId="text-active-campaigns"
        />
      </div>

      {/* Team Management Section */}
      <Card className="border-2 border-slate-200 dark:border-slate-800">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Gerenciamento de Equipe</CardTitle>
              <CardDescription className="text-base">
                {team.memberIds?.length || 0} {team.memberIds?.length === 1 ? 'membro' : 'membros'} cadastrados
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {team.memberIds?.map((memberId: string) => {
              const member = users.find((u: any) => u.id === memberId);
              const isLeader = team.leaderId === memberId;
              
              if (!member) return null;
              
              return (
                <div 
                  key={memberId}
                  className="flex items-center justify-between p-4 border-2 rounded-lg hover-elevate transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-md">
                      <span className="text-lg font-bold text-white">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-base">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLeader ? (
                      <Badge variant="default" className="px-4 py-1.5" data-testid={`badge-leader-${memberId}`}>
                        Líder da Equipe
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateLeaderMutation.mutate(memberId)}
                        disabled={updateLeaderMutation.isPending}
                        data-testid={`button-set-leader-${memberId}`}
                      >
                        Definir como Líder
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-2 border-slate-200 dark:border-slate-800">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-950">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-lg">Desempenho Mensal</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="vendas" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="campanhas" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 dark:border-slate-800">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-white dark:from-cyan-950/30 dark:to-slate-950">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-lg">Tendência de Crescimento</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="vendas"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="campanhas"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
