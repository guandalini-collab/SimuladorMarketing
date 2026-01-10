import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Trash2, 
  Key, 
  Copy, 
  Check, 
  RotateCcw, 
  Users, 
  GraduationCap, 
  School, 
  UsersRound, 
  CircleDot, 
  Calendar,
  Search,
  Filter,
  Shield,
  UserCheck,
  Building,
  Activity,
  Zap,
  ChevronDown,
  ChevronUp,
  Eye,
  BarChart3,
  TrendingUp
} from "lucide-react";
import { useState, useMemo } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { User, Team, Round, MarketingMix, MarketEvent, Class } from "@shared/schema";

/* ============================================
   COMPONENTE: Card de Estatística
   ============================================ */
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = "blue",
  trend
}: { 
  title: string; 
  value: number | string; 
  subtitle?: string; 
  icon: any;
  color?: "blue" | "green" | "purple" | "orange" | "red" | "cyan";
  trend?: { value: number; label: string };
}) {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/5 text-blue-600 dark:text-blue-400",
    green: "from-green-500/20 to-green-600/5 text-green-600 dark:text-green-400",
    purple: "from-purple-500/20 to-purple-600/5 text-purple-600 dark:text-purple-400",
    orange: "from-orange-500/20 to-orange-600/5 text-orange-600 dark:text-orange-400",
    red: "from-red-500/20 to-red-600/5 text-red-600 dark:text-red-400",
    cyan: "from-cyan-500/20 to-cyan-600/5 text-cyan-600 dark:text-cyan-400",
  };

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-50`} />
      <CardContent className="relative p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600">{trend.value}% {trend.label}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-gradient-to-br ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================
   COMPONENTE: Barra de Busca com Filtros
   ============================================ */
function SearchBar({ 
  value, 
  onChange, 
  placeholder,
  roleFilter,
  onRoleFilterChange,
  showRoleFilter = false
}: { 
  value: string; 
  onChange: (value: string) => void;
  placeholder: string;
  roleFilter?: string;
  onRoleFilterChange?: (value: string) => void;
  showRoleFilter?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9"
          data-testid="input-search"
        />
      </div>
      {showRoleFilter && onRoleFilterChange && (
        <Select value={roleFilter} onValueChange={onRoleFilterChange}>
          <SelectTrigger className="w-[150px]" data-testid="select-role-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="professor">Professores</SelectItem>
            <SelectItem value="equipe">Alunos</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

/* ============================================
   COMPONENTE: Linha de Usuário Expandível
   ============================================ */
function UserRow({ 
  user, 
  onDelete, 
  onGeneratePassword,
  isGeneratingPassword,
  teams,
  classes
}: { 
  user: Omit<User, 'password'>; 
  onDelete: () => void;
  onGeneratePassword: () => void;
  isGeneratingPassword: boolean;
  teams?: Team[];
  classes?: Class[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const userTeam = teams?.find(t => t.memberIds.includes(user.id));
  const userClass = userTeam ? classes?.find(c => c.id === userTeam.classId) : null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <TableRow data-testid={`row-user-${user.id}`} className="group">
        <TableCell>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
              {isOpen ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
              <span className="font-medium" data-testid={`text-user-name-${user.id}`}>{user.name}</span>
            </Button>
          </CollapsibleTrigger>
        </TableCell>
        <TableCell data-testid={`text-user-email-${user.id}`} className="text-muted-foreground">
          {user.email}
        </TableCell>
        <TableCell>
          <Badge 
            variant={user.role === 'professor' ? 'default' : 'secondary'} 
            data-testid={`badge-role-${user.id}`}
            className="gap-1"
          >
            {user.role === 'professor' ? (
              <><GraduationCap className="h-3 w-3" /> Professor</>
            ) : (
              <><Users className="h-3 w-3" /> Aluno</>
            )}
          </Badge>
        </TableCell>
        <TableCell>
          {userTeam ? (
            <Badge variant="outline" className="gap-1">
              <UsersRound className="h-3 w-3" />
              {userTeam.name}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            {user.role !== 'professor' && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onGeneratePassword}
                      disabled={isGeneratingPassword}
                      data-testid={`button-generate-temp-password-${user.id}`}
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Gerar senha temporária</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onDelete}
                      data-testid={`button-delete-user-${user.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Excluir usuário</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
      <CollapsibleContent asChild>
        <TableRow className="bg-muted/30">
          <TableCell colSpan={5} className="py-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">ID:</span>
                <p className="font-mono text-xs truncate" title={user.id}>{user.id.slice(0, 8)}...</p>
              </div>
              <div>
                <span className="text-muted-foreground">Turma:</span>
                <p>{userClass?.name || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Equipe:</span>
                <p>{userTeam?.name || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={user.status === 'approved' ? 'default' : 'outline'} className="mt-1">
                  {user.status === 'approved' ? 'Aprovado' : user.status}
                </Badge>
              </div>
            </div>
          </TableCell>
        </TableRow>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ============================================
   COMPONENTE: Card de Turma
   ============================================ */
function ClassCard({ 
  cls, 
  teams, 
  rounds, 
  users 
}: { 
  cls: Class; 
  teams?: Team[]; 
  rounds?: Round[];
  users?: Omit<User, 'password'>[];
}) {
  const classTeams = teams?.filter(t => t.classId === cls.id) || [];
  const classRounds = rounds?.filter(r => r.classId === cls.id) || [];
  const activeRound = classRounds.find(r => r.status === 'active');
  const professor = users?.find(u => u.id === cls.professorId);
  
  const totalStudents = classTeams.reduce((acc, t) => acc + t.memberIds.length, 0);

  return (
    <Card className="hover-elevate">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <School className="h-5 w-5 text-primary" />
              {cls.name}
            </CardTitle>
            <CardDescription className="mt-1">
              Prof. {professor?.name || "Desconhecido"}
            </CardDescription>
          </div>
          {activeRound && (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              <CircleDot className="h-3 w-3 mr-1 animate-pulse" />
              Rodada {activeRound.roundNumber}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{classTeams.length}</p>
            <p className="text-xs text-muted-foreground">Equipes</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{totalStudents}</p>
            <p className="text-xs text-muted-foreground">Alunos</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{classRounds.length}/{cls.maxRounds}</p>
            <p className="text-xs text-muted-foreground">Rodadas</p>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Criada em {new Date(cls.createdAt).toLocaleDateString('pt-BR')}</span>
            <span className="font-mono">{cls.id.slice(0, 8)}...</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================
   COMPONENTE: Card de Equipe
   ============================================ */
function TeamCard({ 
  team, 
  rounds, 
  classes,
  users,
  onReset
}: { 
  team: Team; 
  rounds?: Round[];
  classes?: Class[];
  users?: Omit<User, 'password'>[];
  onReset: (teamId: string, roundId: string) => void;
}) {
  const teamClass = classes?.find(c => c.id === team.classId);
  const teamRounds = rounds?.filter(r => r.classId === team.classId) || [];
  const members = users?.filter(u => team.memberIds.includes(u.id)) || [];
  const leader = users?.find(u => u.id === team.leaderId);

  return (
    <Card className="hover-elevate">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {team.logoUrl ? (
              <img src={team.logoUrl} alt={team.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UsersRound className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{team.name}</CardTitle>
              <CardDescription>{teamClass?.name || "Sem turma"}</CardDescription>
            </div>
          </div>
          <Badge variant="outline">
            R$ {team.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {members.map(m => (
              <Badge key={m.id} variant="secondary" className="text-xs">
                {m.id === team.leaderId && <Shield className="h-3 w-3 mr-1" />}
                {m.name.split(' ')[0]}
              </Badge>
            ))}
            {members.length === 0 && (
              <span className="text-xs text-muted-foreground">Nenhum membro</span>
            )}
          </div>
          
          <div className="flex items-center gap-2 pt-2 border-t">
            <Select onValueChange={(roundId) => onReset(team.id, roundId)}>
              <SelectTrigger className="flex-1 h-8 text-xs" data-testid={`select-reset-round-${team.id}`}>
                <RotateCcw className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Resetar rodada" />
              </SelectTrigger>
              <SelectContent>
                {teamRounds.map((round) => (
                  <SelectItem key={round.id} value={round.id}>
                    Rodada {round.roundNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================
   COMPONENTE: Timeline de Rodadas
   ============================================ */
function RoundTimeline({ rounds, classes }: { rounds?: Round[]; classes?: Class[] }) {
  const sortedRounds = useMemo(() => {
    if (!rounds) return [];
    return [...rounds].sort((a, b) => {
      const classA = classes?.find(c => c.id === a.classId)?.name || '';
      const classB = classes?.find(c => c.id === b.classId)?.name || '';
      if (classA !== classB) return classA.localeCompare(classB);
      return a.roundNumber - b.roundNumber;
    });
  }, [rounds, classes]);

  const groupedByClass = useMemo(() => {
    const grouped: Record<string, Round[]> = {};
    sortedRounds.forEach(r => {
      const className = classes?.find(c => c.id === r.classId)?.name || 'Sem turma';
      if (!grouped[className]) grouped[className] = [];
      grouped[className].push(r);
    });
    return grouped;
  }, [sortedRounds, classes]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'completed': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedByClass).map(([className, classRounds]) => (
        <div key={className} className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <School className="h-4 w-4" />
            {className}
          </h4>
          <div className="flex flex-wrap gap-2">
            {classRounds.map(round => (
              <Tooltip key={round.id}>
                <TooltipTrigger asChild>
                  <div 
                    className={`px-3 py-2 rounded-lg text-sm font-medium cursor-default ${getStatusStyle(round.status)}`}
                    data-testid={`round-badge-${round.id}`}
                  >
                    R{round.roundNumber}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs space-y-1">
                    <p><strong>Status:</strong> {round.status}</p>
                    {round.startedAt && <p><strong>Início:</strong> {new Date(round.startedAt as Date).toLocaleDateString('pt-BR')}</p>}
                    {round.endedAt && <p><strong>Fim:</strong> {new Date(round.endedAt as Date).toLocaleDateString('pt-BR')}</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================
   COMPONENTE PRINCIPAL: Painel de Administração
   ============================================ */
export default function AdminPage() {
  const { toast } = useToast();
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; email: string } | null>(null);
  const [tempPasswordDialog, setTempPasswordDialog] = useState<{ open: boolean; userId: string; userName: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [teamToReset, setTeamToReset] = useState<{ id: string; name: string; roundId: string } | null>(null);
  
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [classSearch, setClassSearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");

  const { data: users, isLoading: usersLoading } = useQuery<Omit<User, 'password'>[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: teams, isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/admin/teams"],
  });

  const { data: rounds, isLoading: roundsLoading } = useQuery<Round[]>({
    queryKey: ["/api/admin/rounds"],
  });

  const { data: mixes, isLoading: mixesLoading } = useQuery<MarketingMix[]>({
    queryKey: ["/api/admin/marketing-mixes"],
  });

  const { data: events, isLoading: eventsLoading } = useQuery<MarketEvent[]>({
    queryKey: ["/api/admin/market-events"],
  });

  const { data: classes, isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => {
      const matchesSearch = userSearch === "" || 
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, roleFilter]);

  const filteredClasses = useMemo(() => {
    if (!classes) return [];
    return classes.filter(c => 
      classSearch === "" || c.name.toLowerCase().includes(classSearch.toLowerCase())
    );
  }, [classes, classSearch]);

  const filteredTeams = useMemo(() => {
    if (!teams) return [];
    return teams.filter(t => 
      teamSearch === "" || t.name.toLowerCase().includes(teamSearch.toLowerCase())
    );
  }, [teams, teamSearch]);

  const stats = useMemo(() => {
    const professors = users?.filter(u => u.role === 'professor').length || 0;
    const students = users?.filter(u => u.role === 'equipe').length || 0;
    const activeRounds = rounds?.filter(r => r.status === 'active').length || 0;
    const activeEvents = events?.filter(e => e.active).length || 0;
    return { 
      totalUsers: users?.length || 0, 
      professors, 
      students, 
      totalClasses: classes?.length || 0,
      totalTeams: teams?.length || 0,
      activeRounds,
      totalMixes: mixes?.length || 0,
      activeEvents
    };
  }, [users, classes, teams, rounds, mixes, events]);

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Usuário excluído",
        description: "O usuário foi removido do sistema com sucesso.",
      });
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateTempPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/users/${userId}/generate-temporary-password`
      );
      if (!response.ok) {
        throw new Error("Erro ao gerar senha temporária");
      }
      const data = await response.json();
      return data as { temporaryPassword: string };
    },
    onSuccess: (data, userId) => {
      const user = users?.find((u) => u.id === userId);
      setTempPasswordDialog({
        open: true,
        userId,
        userName: user?.name || "",
        password: data.temporaryPassword,
      });
      setCopied(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao gerar senha temporária",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCopyPassword = () => {
    if (tempPasswordDialog?.password) {
      navigator.clipboard.writeText(tempPasswordDialog.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Senha copiada!",
        description: "A senha foi copiada para a área de transferência.",
      });
    }
  };

  const resetTeamDecisionsMutation = useMutation({
    mutationFn: async ({ teamId, roundId }: { teamId: string; roundId: string }) => {
      const response = await apiRequest("DELETE", `/api/team-decisions/${teamId}/${roundId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao resetar decisões");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing-mixes"] });
      toast({
        title: "Decisões resetadas",
        description: data.message,
      });
      setTeamToReset(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao resetar decisões",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleResetTeam = (teamId: string, roundId: string) => {
    const team = teams?.find(t => t.id === teamId);
    if (team) {
      setTeamToReset({ id: teamId, name: team.name, roundId });
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-admin">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-admin-title">
                <Shield className="h-6 w-6 text-primary" />
                Painel de Administração
              </h1>
              <p className="text-muted-foreground mt-1" data-testid="text-admin-description">
                Visão geral do sistema e gestão de dados
              </p>
            </div>
            <Badge variant="outline" className="gap-1">
              <Activity className="h-3 w-3" />
              Sistema Ativo
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <StatCard title="Usuários" value={stats.totalUsers} icon={Users} color="blue" />
          <StatCard title="Professores" value={stats.professors} icon={GraduationCap} color="purple" />
          <StatCard title="Alunos" value={stats.students} icon={UserCheck} color="green" />
          <StatCard title="Turmas" value={stats.totalClasses} icon={School} color="orange" />
          <StatCard title="Equipes" value={stats.totalTeams} icon={UsersRound} color="cyan" />
          <StatCard title="Rodadas Ativas" value={stats.activeRounds} icon={CircleDot} color="green" />
          <StatCard title="Mix Marketing" value={stats.totalMixes} icon={BarChart3} color="blue" />
          <StatCard title="Eventos Ativos" value={stats.activeEvents} icon={Zap} color="orange" />
        </div>

        {/* Abas de Conteúdo */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="users" data-testid="tab-users" className="gap-1">
              <Users className="h-4 w-4" /> Usuários
            </TabsTrigger>
            <TabsTrigger value="classes" data-testid="tab-classes" className="gap-1">
              <School className="h-4 w-4" /> Turmas
            </TabsTrigger>
            <TabsTrigger value="teams" data-testid="tab-teams" className="gap-1">
              <UsersRound className="h-4 w-4" /> Equipes
            </TabsTrigger>
            <TabsTrigger value="rounds" data-testid="tab-rounds" className="gap-1">
              <Calendar className="h-4 w-4" /> Rodadas
            </TabsTrigger>
            <TabsTrigger value="mixes" data-testid="tab-mixes" className="gap-1">
              <BarChart3 className="h-4 w-4" /> Mix Marketing
            </TabsTrigger>
            <TabsTrigger value="events" data-testid="tab-events" className="gap-1">
              <Zap className="h-4 w-4" /> Eventos
            </TabsTrigger>
          </TabsList>

          {/* Aba: Usuários */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Usuários Cadastrados</CardTitle>
                    <CardDescription>
                      {filteredUsers.length} de {users?.length || 0} usuários
                    </CardDescription>
                  </div>
                  <SearchBar
                    value={userSearch}
                    onChange={setUserSearch}
                    placeholder="Buscar por nome ou email..."
                    roleFilter={roleFilter}
                    onRoleFilterChange={setRoleFilter}
                    showRoleFilter
                  />
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Equipe</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <UserRow
                            key={user.id}
                            user={user}
                            teams={teams}
                            classes={classes}
                            onDelete={() => setUserToDelete({ id: user.id, name: user.name, email: user.email })}
                            onGeneratePassword={() => generateTempPasswordMutation.mutate(user.id)}
                            isGeneratingPassword={generateTempPasswordMutation.isPending}
                          />
                        ))}
                        {filteredUsers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              Nenhum usuário encontrado
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Turmas */}
          <TabsContent value="classes" className="space-y-4">
            <div className="flex items-center justify-between">
              <SearchBar
                value={classSearch}
                onChange={setClassSearch}
                placeholder="Buscar turma..."
              />
            </div>
            {classesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClasses.map((cls) => (
                  <ClassCard 
                    key={cls.id} 
                    cls={cls} 
                    teams={teams} 
                    rounds={rounds}
                    users={users}
                  />
                ))}
                {filteredClasses.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    Nenhuma turma encontrada
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Aba: Equipes */}
          <TabsContent value="teams" className="space-y-4">
            <div className="flex items-center justify-between">
              <SearchBar
                value={teamSearch}
                onChange={setTeamSearch}
                placeholder="Buscar equipe..."
              />
            </div>
            {teamsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeams.map((team) => (
                  <TeamCard 
                    key={team.id} 
                    team={team} 
                    rounds={rounds}
                    classes={classes}
                    users={users}
                    onReset={handleResetTeam}
                  />
                ))}
                {filteredTeams.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    Nenhuma equipe encontrada
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Aba: Rodadas */}
          <TabsContent value="rounds" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline de Rodadas
                </CardTitle>
                <CardDescription>Visualização do status de todas as rodadas por turma</CardDescription>
              </CardHeader>
              <CardContent>
                {roundsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : rounds && rounds.length > 0 ? (
                  <RoundTimeline rounds={rounds} classes={classes} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    Nenhuma rodada criada
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhes das Rodadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rodada</TableHead>
                        <TableHead>Turma</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Início</TableHead>
                        <TableHead>Fim</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rounds?.map((round) => {
                        const cls = classes?.find(c => c.id === round.classId);
                        return (
                          <TableRow key={round.id} data-testid={`row-round-${round.id}`}>
                            <TableCell className="font-medium">Rodada {round.roundNumber}</TableCell>
                            <TableCell>{cls?.name || "-"}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={round.status === 'active' ? 'default' : round.status === 'completed' ? 'secondary' : 'outline'}
                              >
                                {round.status === 'active' && <CircleDot className="h-3 w-3 mr-1" />}
                                {round.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{round.startedAt ? new Date(round.startedAt as Date).toLocaleDateString('pt-BR') : '-'}</TableCell>
                            <TableCell>{round.endedAt ? new Date(round.endedAt as Date).toLocaleDateString('pt-BR') : '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Mix Marketing */}
          <TabsContent value="mixes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Decisões de Mix de Marketing
                </CardTitle>
                <CardDescription>Todas as decisões submetidas pelas equipes</CardDescription>
              </CardHeader>
              <CardContent>
                {mixesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Equipe</TableHead>
                          <TableHead>Turma</TableHead>
                          <TableHead>Rodada</TableHead>
                          <TableHead>Qualidade</TableHead>
                          <TableHead>Estratégia Preço</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Submetido</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mixes?.map((mix) => {
                          const team = teams?.find(t => t.id === mix.teamId);
                          const cls = classes?.find(c => c.id === team?.classId);
                          const round = rounds?.find(r => r.id === mix.roundId);
                          return (
                            <TableRow key={mix.id} data-testid={`row-mix-${mix.id}`}>
                              <TableCell className="font-medium">{team?.name || "-"}</TableCell>
                              <TableCell>{cls?.name || "-"}</TableCell>
                              <TableCell>
                                <Badge variant="outline">R{round?.roundNumber || "?"}</Badge>
                              </TableCell>
                              <TableCell className="capitalize">{mix.productQuality}</TableCell>
                              <TableCell className="capitalize">{mix.priceStrategy}</TableCell>
                              <TableCell>R$ {mix.priceValue}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {mix.submittedAt ? new Date(mix.submittedAt as Date).toLocaleString('pt-BR') : '-'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {(!mixes || mixes.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              Nenhuma decisão de marketing mix registrada
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Eventos */}
          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Eventos de Mercado
                </CardTitle>
                <CardDescription>Eventos que afetam as simulações</CardDescription>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Severidade</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Turma</TableHead>
                          <TableHead>Rodada</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {events?.map((event) => {
                          const round = rounds?.find(r => r.id === event.roundId);
                          const cls = classes?.find(c => c.id === round?.classId);
                          return (
                            <TableRow key={event.id} data-testid={`row-event-${event.id}`}>
                              <TableCell className="font-medium max-w-[200px] truncate" title={event.title}>
                                {event.title}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{event.type}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={event.severity === 'high' ? 'destructive' : event.severity === 'medium' ? 'default' : 'secondary'}
                                >
                                  {event.severity}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={event.active ? 'default' : 'outline'} className="gap-1">
                                  {event.active ? (
                                    <><CircleDot className="h-3 w-3" /> Ativo</>
                                  ) : (
                                    "Inativo"
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>{cls?.name || "-"}</TableCell>
                              <TableCell>R{round?.roundNumber || "?"}</TableCell>
                            </TableRow>
                          );
                        })}
                        {(!events || events.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              Nenhum evento registrado
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Confirmar exclusão de usuário */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão de usuário</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Você está prestes a excluir permanentemente o usuário:</p>
              <div className="bg-muted p-3 rounded-md">
                <p className="font-semibold">{userToDelete?.name}</p>
                <p className="text-sm text-muted-foreground">{userToDelete?.email}</p>
              </div>
              <p className="text-sm"><strong>O que vai acontecer:</strong></p>
              <ul className="text-sm list-disc list-inside space-y-1">
                <li>O usuário será removido de todas as equipes</li>
                <li>Dados históricos (KPIs, decisões) serão preservados</li>
                <li>Esta ação não pode ser desfeita</li>
              </ul>
              <p className="text-sm text-destructive font-medium">
                Nota: Se o usuário for líder de alguma equipe, você precisa removê-lo da liderança primeiro.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
              disabled={deleteUserMutation.isPending}
              data-testid="button-confirm-delete"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? "Excluindo..." : "Excluir usuário"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Senha temporária */}
      <Dialog open={tempPasswordDialog?.open || false} onOpenChange={(open) => !open && setTempPasswordDialog(null)}>
        <DialogContent data-testid="dialog-temp-password">
          <DialogHeader>
            <DialogTitle>Senha Temporária Gerada</DialogTitle>
            <DialogDescription>
              Use esta senha para ajudar o aluno <strong>{tempPasswordDialog?.userName}</strong> a recuperar o acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm text-muted-foreground mb-2">Senha temporária (válida por 1 hora):</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-mono bg-background p-3 rounded border" data-testid="text-temp-password">
                  {tempPasswordDialog?.password}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopyPassword}
                  data-testid="button-copy-password"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md space-y-2">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Instruções:</p>
              <ol className="text-sm text-blue-800 dark:text-blue-200 list-decimal list-inside space-y-1">
                <li>Copie esta senha e envie para o aluno por email ou mensagem</li>
                <li>O aluno deve fazer login usando esta senha temporária</li>
                <li>Na primeira vez que logar, será <strong>obrigado a criar uma nova senha</strong></li>
                <li>A senha temporária expira em <strong>1 hora</strong></li>
              </ol>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setTempPasswordDialog(null)} data-testid="button-close-dialog">
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Resetar decisões */}
      <AlertDialog open={!!teamToReset} onOpenChange={(open) => !open && setTeamToReset(null)}>
        <AlertDialogContent data-testid="dialog-reset-decisions">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-600" />
              Resetar Todas as Decisões
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Você está prestes a resetar TODAS as decisões da equipe:</p>
              <div className="bg-muted p-3 rounded-md">
                <p className="font-semibold">{teamToReset?.name}</p>
                <p className="text-sm text-muted-foreground">
                  Rodada: {rounds?.find(r => r.id === teamToReset?.roundId)?.roundNumber || "?"}
                </p>
              </div>
              <p className="text-sm"><strong>O que será deletado:</strong></p>
              <ul className="text-sm list-disc list-inside space-y-1">
                <li>Análises Estratégicas (SWOT, Porter, BCG, PESTEL)</li>
                <li>Recomendações Estratégicas (geradas por IA)</li>
                <li>Mix de Marketing (todos os 4 produtos)</li>
                <li>Configuração de Produtos e Público-Alvo</li>
              </ul>
              <p className="text-sm text-destructive font-medium">
                Esta ação NÃO pode ser desfeita! A equipe voltará ao estado inicial da rodada.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-reset">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => teamToReset && resetTeamDecisionsMutation.mutate({ 
                teamId: teamToReset.id, 
                roundId: teamToReset.roundId 
              })}
              disabled={resetTeamDecisionsMutation.isPending}
              data-testid="button-confirm-reset"
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {resetTeamDecisionsMutation.isPending ? "Resetando..." : "Confirmar Reset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
