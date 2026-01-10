import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, Play, Pause, Users, CheckCircle2, Database, Trophy, TrendingUp, TrendingDown, Minus, Activity, 
  Building2, Settings, Trash2, LogOut, Sparkles, UserPlus, ChevronDown, ChevronUp, UserMinus, 
  DollarSign, BarChart3, Clock, RefreshCw, BookOpen, Search, Filter, Calendar, Target, 
  PieChart, Layers, GraduationCap, CircleDot, CircleCheck, CirclePause, LayoutDashboard,
  Award, Download, Info, Medal, Star, AlertCircle, Mail, Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import type { Class, Round } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, Zap, AlertTriangle, Key } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { insertMarketEventSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlignmentTeamReport } from "@/components/alignment-team-report";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";

const eventFormSchema = insertMarketEventSchema.extend({
  type: z.string().min(1, "Tipo é obrigatório"),
  title: z.string().min(1, "Título é obrigatório").max(200, "Título muito longo"),
  description: z.string().min(1, "Descrição é obrigatória"),
  impact: z.string().min(1, "Impacto é obrigatório"),
  severity: z.string().min(1, "Severidade é obrigatória"),
  roundId: z.string().min(1, "Rodada é obrigatória"),
  classId: z.string().min(1),
  active: z.boolean(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface AccessLog {
  id: string;
  roundId: string;
  classId: string;
  userId: string;
  userRole: string;
  action: string;
  roundNumber: number;
  teamName: string;
  userName?: string;
  timestamp: string;
}

/* ============================================
   COMPONENTE: Relatório de Acessos às Rodadas
   ============================================ */
function AccessLogsReport({ classId, rounds, teams }: { classId: string; rounds: Round[]; teams: any[] }) {
  const [selectedRound, setSelectedRound] = useState<string>("all");
  const { data: allLogs = [], isLoading, dataUpdatedAt } = useQuery<AccessLog[]>({
    queryKey: ["/api/classes", classId, "round-access-logs"],
    queryFn: async () => {
      const res = await fetch(`/api/classes/${classId}/round-access-logs`, { credentials: "include" });
      return res.json();
    },
    refetchInterval: 10000, // Atualiza a cada 10 segundos
  });

  // Formatar última atualização
  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('pt-BR') : null;

  // Função para traduzir ação em descrição detalhada
  const getActionDescription = (action: string): { label: string; description: string } => {
    switch (action) {
      case "dashboard_access":
        return { label: "Dashboard", description: "Acessou o Painel Principal com visão geral da simulação" };
      case "strategy_access":
        return { label: "Estratégia", description: "Acessou a página de Análises Estratégicas (SWOT, Porter, BCG, PESTEL)" };
      case "marketing_mix_access":
        return { label: "Mix de Marketing", description: "Acessou a página de configuração dos 4Ps de Marketing" };
      case "results_access":
        return { label: "Resultados", description: "Acessou a página de Resultados e KPIs da rodada" };
      case "products_access":
        return { label: "Produtos", description: "Acessou a página de configuração de Produtos" };
      default:
        return { label: action, description: action };
    }
  };

  // Ordenar logs por nome da equipe (alfabético) e depois por timestamp
  const sortedLogs = useMemo(() => {
    return [...allLogs].sort((a, b) => {
      const teamA = (a.teamName || "ZZZ").toLowerCase();
      const teamB = (b.teamName || "ZZZ").toLowerCase();
      if (teamA !== teamB) return teamA.localeCompare(teamB);
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [allLogs]);

  // Agrupar logs por rodada
  const logsByRound = useMemo(() => {
    const grouped = new Map<number, AccessLog[]>();
    sortedLogs.forEach((log) => {
      const roundNum = log.roundNumber;
      if (!grouped.has(roundNum)) {
        grouped.set(roundNum, []);
      }
      grouped.get(roundNum)!.push(log);
    });
    return new Map(Array.from(grouped.entries()).sort((a, b) => b[0] - a[0])); // Descendente por rodada
  }, [sortedLogs]);

  // Filtrar logs baseado na rodada selecionada
  const filteredLogs = selectedRound && selectedRound !== "all"
    ? logsByRound.get(parseInt(selectedRound)) || []
    : Array.from(logsByRound.values()).flat();

  // Contar acessos por rodada
  const roundAccessCount = useMemo(() => {
    const counts = new Map<number, number>();
    logsByRound.forEach((logs, roundNum) => {
      counts.set(roundNum, logs.length);
    });
    return counts;
  }, [logsByRound]);

  return (
    <Card data-testid="card-access-logs">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Relatório de Acessos às Rodadas
            </CardTitle>
            <CardDescription>
              Histórico completo de acessos para fins de auditoria
            </CardDescription>
          </div>
          {lastUpdate && (
            <Badge variant="outline" className="text-xs gap-1">
              <RefreshCw className="h-3 w-3" />
              Atualizado: {lastUpdate}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros */}
        <div className="flex gap-4 flex-wrap">
          <div className="space-y-2 min-w-[200px]">
            <Label htmlFor="filter-round">Filtrar por Rodada</Label>
            <Select value={selectedRound} onValueChange={setSelectedRound}>
              <SelectTrigger id="filter-round" data-testid="select-filter-round">
                <SelectValue placeholder="Todas as rodadas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as rodadas</SelectItem>
                {rounds.map((round) => (
                  <SelectItem key={round.id} value={String(round.roundNumber)} data-testid={`option-round-${round.roundNumber}`}>
                    Rodada {round.roundNumber} ({roundAccessCount.get(round.roundNumber) || 0} acessos)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabela de acessos */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="text-muted-foreground">Carregando...</div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              {selectedRound ? "Nenhum acesso nesta rodada" : "Nenhum acesso registrado"}
            </p>
          </div>
        ) : (
          <>
            {/* Se nenhuma rodada selecionada, agrupar por rodada */}
            {selectedRound === "all" ? (
              <div className="space-y-6">
                {Array.from(logsByRound.entries()).map(([roundNum, roundLogs]) => (
                  <Collapsible key={roundNum} defaultOpen={roundNum === Math.max(...Array.from(logsByRound.keys()))} data-testid={`collapsible-round-${roundNum}`}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between" data-testid={`button-expand-round-${roundNum}`}>
                        <span className="font-semibold">Rodada {roundNum} - {roundLogs.length} acessos</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      <div className="overflow-x-auto border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Equipe</TableHead>
                              <TableHead>Usuário</TableHead>
                              <TableHead>Local Acessado</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead>Data/Hora</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {roundLogs.map((log, idx) => {
                              const actionInfo = getActionDescription(log.action);
                              return (
                                <TableRow key={log.id || idx} data-testid={`row-access-log-round-${roundNum}-${idx}`}>
                                  <TableCell className="font-semibold">{log.teamName || "Sem equipe"}</TableCell>
                                  <TableCell>{log.userName}</TableCell>
                                  <TableCell>
                                    <Badge variant="secondary">
                                      {actionInfo.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground max-w-[250px]">
                                    {actionInfo.description}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                    {log.timestamp ? new Date(log.timestamp).toLocaleString("pt-BR") : "-"}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            ) : (
              /* Se rodada selecionada, mostrar apenas aquela rodada */
              <div className="overflow-x-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipe</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Local Acessado</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Data/Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log, idx) => {
                      const actionInfo = getActionDescription(log.action);
                      return (
                        <TableRow key={log.id || idx} data-testid={`row-access-log-${idx}`}>
                          <TableCell className="font-semibold">{log.teamName || "Sem equipe"}</TableCell>
                          <TableCell>{log.userName}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {actionInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[250px]">
                            {actionInfo.description}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString("pt-BR") : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

/* ============================================
   COMPONENTE: Envio de Email para Equipes
   ============================================ */
function SendEmailToTeams({ classId, teams, className }: { classId: string; teams: any[]; className: string }) {
  const { toast } = useToast();
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  const sendEmailMutation = useMutation({
    mutationFn: async (data: { teamIds: string[]; subject: string; message: string }) => {
      const res = await apiRequest("POST", `/api/classes/${classId}/send-email`, data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Emails enviados!" : "Atenção",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
      if (data.success) {
        setSubject("");
        setMessage("");
        setSelectedTeams([]);
        setSelectAll(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar emails",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedTeams(teams.map(t => t.id));
    } else {
      setSelectedTeams([]);
    }
  };

  const handleTeamToggle = (teamId: string, checked: boolean) => {
    if (checked) {
      setSelectedTeams(prev => [...prev, teamId]);
    } else {
      setSelectedTeams(prev => prev.filter(id => id !== teamId));
      setSelectAll(false);
    }
  };

  const handleSend = () => {
    if (selectedTeams.length === 0) {
      toast({
        title: "Selecione equipes",
        description: "Escolha pelo menos uma equipe para enviar o email",
        variant: "destructive",
      });
      return;
    }
    if (!subject.trim()) {
      toast({
        title: "Assunto obrigatório",
        description: "Digite um assunto para o email",
        variant: "destructive",
      });
      return;
    }
    if (!message.trim()) {
      toast({
        title: "Mensagem obrigatória",
        description: "Digite uma mensagem para o email",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate({
      teamIds: selectedTeams,
      subject,
      message,
    });
  };

  return (
    <Card data-testid="card-send-email">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Enviar Email para Equipes
        </CardTitle>
        <CardDescription>
          Envie mensagens para as equipes da turma. Uma cópia será enviada para seu email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {teams.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhuma equipe na turma</p>
          </div>
        ) : (
          <>
            {/* Seleção de equipes */}
            <div className="space-y-3">
              <Label>Selecionar Equipes</Label>
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2 pb-3 border-b">
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                    data-testid="checkbox-select-all"
                  />
                  <Label htmlFor="select-all" className="font-semibold cursor-pointer">
                    Selecionar Todas ({teams.length} equipes)
                  </Label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {teams.map((team) => (
                    <div key={team.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`team-${team.id}`}
                        checked={selectedTeams.includes(team.id)}
                        onChange={(e) => handleTeamToggle(team.id, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                        data-testid={`checkbox-team-${team.id}`}
                      />
                      <Label htmlFor={`team-${team.id}`} className="cursor-pointer text-sm">
                        {team.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              {selectedTeams.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedTeams.length} equipe(s) selecionada(s)
                </p>
              )}
            </div>

            {/* Assunto */}
            <div className="space-y-2">
              <Label htmlFor="email-subject">Assunto</Label>
              <Input
                id="email-subject"
                placeholder="Ex: Lembrete sobre prazo da Rodada 2"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                data-testid="input-email-subject"
              />
            </div>

            {/* Mensagem */}
            <div className="space-y-2">
              <Label htmlFor="email-message">Mensagem</Label>
              <Textarea
                id="email-message"
                placeholder="Digite sua mensagem aqui..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="resize-none"
                data-testid="textarea-email-message"
              />
            </div>

            {/* Botão enviar */}
            <div className="flex justify-end">
              <Button
                onClick={handleSend}
                disabled={sendEmailMutation.isPending || selectedTeams.length === 0}
                data-testid="button-send-email"
              >
                {sendEmailMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Email
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ============================================
   COMPONENTE: Card de Estatística do Dashboard
   ============================================ */
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  color = "primary",
  tooltip
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: any; 
  trend?: "up" | "down" | "neutral";
  color?: "primary" | "success" | "warning" | "destructive";
  tooltip?: string;
}) {
  const colorClasses = {
    primary: "from-blue-500 to-blue-600",
    success: "from-green-500 to-green-600", 
    warning: "from-amber-500 to-amber-600",
    destructive: "from-red-500 to-red-600"
  };
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className="overflow-hidden hover-elevate cursor-help">
          <CardContent className="p-0">
            <div className="flex items-stretch">
              <div className={`w-2 bg-gradient-to-b ${colorClasses[color]}`} />
              <div className="flex-1 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                    {subtitle && (
                      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                    )}
                  </div>
                  <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TooltipTrigger>
      {tooltip && <TooltipContent>{tooltip}</TooltipContent>}
    </Tooltip>
  );
}

/* ============================================
   COMPONENTE: Card de Equipe Expandível
   ============================================ */
function TeamCard({ 
  team, 
  users,
  isExpanded,
  onToggle,
  onAddMember,
  onRemoveMember,
  onViewDecisions
}: { 
  team: any; 
  users: any[];
  isExpanded: boolean;
  onToggle: (open: boolean) => void;
  onAddMember: () => void;
  onRemoveMember: (teamId: string, userId: string, userName: string) => void;
  onViewDecisions: () => void;
}) {
  const leader = users.find((u: any) => u.id === team.leaderId);
  const memberCount = team.memberIds?.length || 0;
  
  const { data: teamMembers = [], isLoading: membersLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/teams", team.id, "members"],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${team.id}/members`);
      if (!res.ok) throw new Error("Erro ao buscar membros");
      return res.json();
    },
    enabled: isExpanded,
  });
  
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="p-4 border-2 border-slate-200 dark:border-slate-800 rounded-lg hover-elevate transition-all">
        <div className="flex items-center justify-between">
          <CollapsibleTrigger className="flex items-center gap-3 flex-1 text-left">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-md flex-shrink-0">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base truncate">{team.name}</p>
              <p className="text-xs text-muted-foreground">
                {isExpanded ? "Clique para ocultar" : "Clique para expandir"}
              </p>
            </div>
            {isExpanded ? <ChevronUp className="h-5 w-5 flex-shrink-0" /> : <ChevronDown className="h-5 w-5 flex-shrink-0" />}
          </CollapsibleTrigger>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onViewDecisions}
                  data-testid={`button-view-decisions-${team.id}`}
                  aria-label="Ver decisões"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver decisões da equipe</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onAddMember}
                  data-testid={`button-add-member-${team.id}`}
                  aria-label="Adicionar membro"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Adicionar membro à equipe</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium">R$ {team.budget.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium">{memberCount} {memberCount === 1 ? 'membro' : 'membros'}</p>
          </div>
          {leader && (
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <Badge variant="default" className="text-xs">{leader.name}</Badge>
            </div>
          )}
        </div>
        <CollapsibleContent className="mt-4">
          {membersLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando membros...</p>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum membro ainda</p>
            </div>
          ) : (
            <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border-2">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 rounded-lg border hover-elevate transition-all">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-300 to-cyan-300 flex items-center justify-center shadow flex-shrink-0">
                      <span className="text-sm font-bold text-white">{member.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge 
                      variant={member.status === "approved" ? "secondary" : member.status === "pending" ? "outline" : "destructive"}
                      className="text-xs"
                    >
                      {member.status === "approved" ? "Aprovado" : member.status === "pending" ? "Pendente" : "Rejeitado"}
                    </Badge>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveMember(team.id, member.id, member.name)}
                          data-testid={`button-remove-member-${member.id}`}
                          aria-label="Remover membro"
                        >
                          <UserMinus className="h-4 w-4 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Remover membro da equipe</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/* ============================================
   COMPONENTE: Visualizador de Decisões da Equipe
   ============================================ */
function TeamDecisionsViewer({ 
  teamId, 
  teamName, 
  classId,
  rounds,
  onClose 
}: { 
  teamId: string; 
  teamName: string; 
  classId: string;
  rounds: Round[];
  onClose: () => void;
}) {
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  
  const availableRounds = rounds.filter(r => r.status === "active" || r.status === "completed");
  
  useEffect(() => {
    if (availableRounds.length > 0 && !selectedRoundId) {
      const activeRound = availableRounds.find(r => r.status === "active");
      setSelectedRoundId(activeRound?.id || availableRounds[0]?.id || "");
    }
  }, [availableRounds, selectedRoundId]);
  
  const selectedRound = rounds.find(r => r.id === selectedRoundId);

  const { data: teamProducts = [], isLoading: loadingProducts } = useQuery<any[]>({
    queryKey: ["/api/team-products", teamId, selectedRoundId],
    queryFn: async () => {
      const res = await fetch(`/api/team-products/${teamId}/${selectedRoundId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedRoundId,
  });

  const { data: marketingMixes = [], isLoading: loadingMixes } = useQuery<any[]>({
    queryKey: ["/api/marketing-mix/team", teamId, "round", selectedRoundId, "products"],
    queryFn: async () => {
      const res = await fetch(`/api/marketing-mix/team/${teamId}/round/${selectedRoundId}/products`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedRoundId,
  });

  const { data: strategies, isLoading: loadingStrategies } = useQuery<any>({
    queryKey: ["/api/professor/strategy/team", teamId, "round", selectedRoundId],
    queryFn: async () => {
      const res = await fetch(`/api/professor/strategy/team/${teamId}/round/${selectedRoundId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!selectedRoundId,
  });

  const isLoading = loadingProducts || loadingMixes || loadingStrategies;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto" data-testid="dialog-team-decisions">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Decisões de {teamName}
          </DialogTitle>
          <DialogDescription>
            Visualize as decisões de marketing tomadas pela equipe
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Label>Rodada:</Label>
            <Select value={selectedRoundId} onValueChange={setSelectedRoundId}>
              <SelectTrigger className="w-48" data-testid="select-round-decisions">
                <SelectValue placeholder="Selecione a rodada" />
              </SelectTrigger>
              <SelectContent>
                {availableRounds.map((round) => (
                  <SelectItem key={round.id} value={round.id}>
                    Rodada {round.roundNumber} {round.status === "active" ? "(Ativa)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRound && (
              <Badge variant={selectedRound.status === "active" ? "default" : "secondary"}>
                {selectedRound.status === "active" ? "Em andamento" : "Concluída"}
              </Badge>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Carregando decisões...</p>
            </div>
          ) : !selectedRoundId ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Selecione uma rodada para visualizar</p>
            </div>
          ) : (
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="products" data-testid="tab-products-decisions">
                  <Layers className="h-4 w-4 mr-2" />
                  Produtos ({teamProducts.length})
                </TabsTrigger>
                <TabsTrigger value="mix" data-testid="tab-mix-decisions">
                  <PieChart className="h-4 w-4 mr-2" />
                  Marketing Mix ({marketingMixes.length})
                </TabsTrigger>
                <TabsTrigger value="strategy" data-testid="tab-strategy-decisions">
                  <Target className="h-4 w-4 mr-2" />
                  Estratégias
                </TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="mt-4 space-y-4">
                {teamProducts.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhum produto configurado nesta rodada</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {teamProducts.map((product: any) => (
                      <Card key={product.id} data-testid={`card-product-${product.productNumber}`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Badge variant="outline">P{product.productNumber}</Badge>
                            {product.productName || `Produto ${product.productNumber}`}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          {product.productDescription && (
                            <p className="text-muted-foreground">{product.productDescription}</p>
                          )}
                          {product.targetAudience && (
                            <div>
                              <span className="font-medium">Público-alvo:</span>{" "}
                              <span className="text-muted-foreground">{product.targetAudience}</span>
                            </div>
                          )}
                          {product.ageRange && (
                            <div>
                              <span className="font-medium">Faixa etária:</span>{" "}
                              <span className="text-muted-foreground">{product.ageRange}</span>
                            </div>
                          )}
                          {product.incomeLevel && (
                            <div>
                              <span className="font-medium">Renda:</span>{" "}
                              <span className="text-muted-foreground">{product.incomeLevel}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="mix" className="mt-4 space-y-4">
                {marketingMixes.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <PieChart className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhum marketing mix enviado nesta rodada</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {marketingMixes.map((mix: any, index: number) => (
                      <AccordionItem key={mix.id || index} value={`mix-${index}`} data-testid={`accordion-mix-${index}`}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">P{mix.productNumber || index + 1}</Badge>
                            <span>{mix.productName || `Produto ${mix.productNumber || index + 1}`}</span>
                            {mix.isSubmitted && (
                              <Badge variant="secondary" className="ml-2">Enviado</Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid gap-4 sm:grid-cols-2 p-4 bg-muted/50 rounded-lg">
                            <div>
                              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                <Target className="h-4 w-4" /> Produto
                              </h4>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p><span className="font-medium">Qualidade:</span> <span className="capitalize">{mix.productQuality || "-"}</span></p>
                                <p><span className="font-medium">Características:</span> <span className="capitalize">{mix.productFeatures || "-"}</span></p>
                                <p><span className="font-medium">Posicionamento:</span> <span className="capitalize">{mix.brandPositioning || "-"}</span></p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                <DollarSign className="h-4 w-4" /> Preço
                              </h4>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p><span className="font-medium">Estratégia:</span> <span className="capitalize">{mix.priceStrategy || "-"}</span></p>
                                <p><span className="font-medium">Valor:</span> {mix.priceValue ? formatCurrency(mix.priceValue) : "-"}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                <Building2 className="h-4 w-4" /> Praça
                              </h4>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p><span className="font-medium">Canais:</span> {Array.isArray(mix.distributionChannels) ? mix.distributionChannels.join(", ") : mix.distributionChannels || "-"}</p>
                                <p><span className="font-medium">Cobertura:</span> <span className="capitalize">{mix.distributionCoverage || "-"}</span></p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                <Sparkles className="h-4 w-4" /> Promoção
                              </h4>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p><span className="font-medium">Mix:</span> {Array.isArray(mix.promotionMix) ? mix.promotionMix.join(", ") : mix.promotionMix || "-"}</p>
                                <p><span className="font-medium">Intensidade:</span> <span className="capitalize">{mix.promotionIntensity || "-"}</span></p>
                                <p><span className="font-medium">Custo estimado:</span> {mix.estimatedCost ? formatCurrency(mix.estimatedCost) : "-"}</p>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </TabsContent>

              <TabsContent value="strategy" className="mt-4 space-y-4">
                {!strategies?.swot && !strategies?.porter && !strategies?.bcg?.length && !strategies?.pestel ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhuma análise estratégica realizada nesta rodada</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {strategies?.swot && (
                      <Card data-testid="card-swot">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            SWOT
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          <div><span className="font-medium">Forças:</span> {Array.isArray(strategies.swot.strengths) ? strategies.swot.strengths.slice(0, 2).join("; ") : strategies.swot.strengths?.substring?.(0, 100) || "-"}</div>
                          <div><span className="font-medium">Fraquezas:</span> {Array.isArray(strategies.swot.weaknesses) ? strategies.swot.weaknesses.slice(0, 2).join("; ") : strategies.swot.weaknesses?.substring?.(0, 100) || "-"}</div>
                          <div><span className="font-medium">Oportunidades:</span> {Array.isArray(strategies.swot.opportunities) ? strategies.swot.opportunities.slice(0, 2).join("; ") : strategies.swot.opportunities?.substring?.(0, 100) || "-"}</div>
                          <div><span className="font-medium">Ameaças:</span> {Array.isArray(strategies.swot.threats) ? strategies.swot.threats.slice(0, 2).join("; ") : strategies.swot.threats?.substring?.(0, 100) || "-"}</div>
                        </CardContent>
                      </Card>
                    )}
                    {strategies?.porter && (
                      <Card data-testid="card-porter">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            Porter's 5 Forças
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          <div><span className="font-medium">Rivalidade:</span> {strategies.porter.competitiveRivalry}/10</div>
                          <div><span className="font-medium">Novos entrantes:</span> {strategies.porter.threatOfNewEntry}/10</div>
                          <div><span className="font-medium">Substitutos:</span> {strategies.porter.threatOfSubstitutes}/10</div>
                          <div><span className="font-medium">Fornecedores:</span> {strategies.porter.supplierPower}/10</div>
                          <div><span className="font-medium">Compradores:</span> {strategies.porter.buyerPower}/10</div>
                        </CardContent>
                      </Card>
                    )}
                    {strategies?.bcg && strategies.bcg.length > 0 && (
                      <Card data-testid="card-bcg">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-purple-600" />
                            BCG Matrix ({strategies.bcg.length} produtos)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          {strategies.bcg.slice(0, 2).map((bcg: any, i: number) => (
                            <div key={i}>
                              <span className="font-medium">P{bcg.productNumber}:</span> {bcg.quadrant} - {bcg.justification?.substring(0, 60)}...
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                    {strategies?.pestel && (
                      <Card data-testid="card-pestel">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-orange-600" />
                            PESTEL
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          <div><span className="font-medium">Político:</span> {Array.isArray(strategies.pestel.political) ? strategies.pestel.political.slice(0, 2).join("; ") : strategies.pestel.political || "-"}</div>
                          <div><span className="font-medium">Econômico:</span> {Array.isArray(strategies.pestel.economic) ? strategies.pestel.economic.slice(0, 2).join("; ") : strategies.pestel.economic || "-"}</div>
                          <div><span className="font-medium">Social:</span> {Array.isArray(strategies.pestel.social) ? strategies.pestel.social.slice(0, 2).join("; ") : strategies.pestel.social || "-"}</div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-close-decisions">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================
   COMPONENTE: Botão de Feedback com IA
   ============================================ */
function FeedbackButton({ 
  teamId, 
  teamName,
  roundId,
  hasFeedback,
  isLoadingFeedbacks,
  isFetchingFeedbacks
}: { 
  teamId: string; 
  teamName: string;
  roundId: string;
  hasFeedback: boolean;
  isLoadingFeedbacks: boolean;
  isFetchingFeedbacks: boolean;
}) {
  const { toast } = useToast();

  const generateFeedbackMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/feedback/generate/${teamId}/${roundId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback", teamId] });
      queryClient.invalidateQueries({ queryKey: ["/api/feedbacks/teams"] });
      toast({
        title: "Feedback gerado com sucesso!",
        description: `O sistema analisou as decisões de ${teamName} e gerou o feedback educacional.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar feedback",
        description: error.message || "Não foi possível gerar o feedback inteligente",
        variant: "destructive",
      });
    },
  });

  if (isLoadingFeedbacks || isFetchingFeedbacks) {
    return (
      <Button variant="ghost" size="sm" disabled data-testid={`button-feedback-loading-${teamId}`}>
        <Activity className="h-4 w-4 mr-1 animate-spin" />
        ...
      </Button>
    );
  }

  if (hasFeedback) {
    return (
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" disabled data-testid={`button-feedback-generated-${teamId}`}>
              <CheckCircle2 className="h-4 w-4 text-green-600 mr-1" />
              Gerado
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Feedback já foi gerado para esta rodada</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateFeedbackMutation.mutate()}
              disabled={generateFeedbackMutation.isPending}
              data-testid={`button-regenerate-feedback-${teamId}`}
            >
              {generateFeedbackMutation.isPending ? (
                <Activity className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Regenerar feedback</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => generateFeedbackMutation.mutate()}
      disabled={generateFeedbackMutation.isPending}
      data-testid={`button-generate-feedback-${teamId}`}
    >
      {generateFeedbackMutation.isPending ? (
        <>
          <Activity className="h-4 w-4 mr-1 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-1" />
          Gerar IA
        </>
      )}
    </Button>
  );
}

/* ============================================
   COMPONENTE: Gerenciador de Eventos de Mercado
   ============================================ */
function MarketEventsManager({ classId, rounds }: { classId: string; rounds: Round[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [aiEventQuantity, setAiEventQuantity] = useState(3);
  const { toast } = useToast();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      type: "",
      title: "",
      description: "",
      impact: "",
      severity: "medio",
      roundId: "",
      classId,
      active: true,
    },
  });

  const { data: events = [] } = useQuery<any[]>({
    queryKey: ["/api/events/class", classId],
    queryFn: async () => {
      const res = await fetch(`/api/events/class/${classId}`);
      if (!res.ok) throw new Error("Erro ao buscar eventos");
      return res.json();
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormValues) => {
      const res = await apiRequest("POST", "/api/market-events", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/class", classId] });
      toast({ title: "Evento criado!", description: "O evento de mercado foi criado com sucesso." });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar evento", description: error.message || "Não foi possível criar o evento", variant: "destructive" });
    },
  });

  const toggleEventMutation = useMutation({
    mutationFn: async ({ eventId, active }: { eventId: string; active: boolean }) => {
      const res = await apiRequest("PATCH", `/api/market-events/${eventId}`, { active });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/class", classId] });
      toast({ title: "Evento atualizado!", description: "O status do evento foi alterado." });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar evento", description: error.message, variant: "destructive" });
    },
  });

  const generateAIEventsMutation = useMutation({
    mutationFn: async (quantity: number) => {
      const res = await apiRequest("POST", "/api/ai/generate-events", { classId, quantity });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/class", classId] });
      toast({ title: "Eventos gerados com sucesso!", description: `${data.count || aiEventQuantity} eventos foram gerados pela IA.` });
      setIsAIDialogOpen(false);
      setAiEventQuantity(3);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao gerar eventos", description: error.message, variant: "destructive" });
    },
  });

  const activeRounds = rounds.filter(r => r.status !== "locked");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Eventos de Mercado
          </h3>
          <p className="text-sm text-muted-foreground">Crie eventos para simular mudanças no ambiente de negócios</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAIDialogOpen(true)} disabled={activeRounds.length === 0} data-testid="button-generate-ai-events">
            <Sparkles className="h-4 w-4 mr-2" />
            Gerar com IA
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} disabled={activeRounds.length === 0} variant="outline" data-testid="button-create-event">
            <Plus className="h-4 w-4 mr-2" />
            Criar Manual
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Nenhum evento criado ainda</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {events.map((event: any) => {
            const round = rounds.find(r => r.id === event.roundId);
            return (
              <div key={event.id} className="border rounded-lg p-4" data-testid={`event-card-${event.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-semibold text-sm">{event.title}</h4>
                      <Badge variant={event.severity === "critico" ? "destructive" : event.severity === "alto" ? "default" : "secondary"} className="text-xs">
                        {event.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">R{round?.roundNumber}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
                  </div>
                  <Switch
                    checked={event.active}
                    onCheckedChange={(active) => toggleEventMutation.mutate({ eventId: event.id, active })}
                    disabled={toggleEventMutation.isPending}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog para gerar eventos com IA */}
      <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Gerar Eventos com IA
            </DialogTitle>
            <DialogDescription>A IA irá gerar eventos contextualizados para sua turma</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quantidade de Eventos</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={aiEventQuantity}
                onChange={(e) => setAiEventQuantity(parseInt(e.target.value) || 1)}
                data-testid="input-ai-event-quantity"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAIDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => generateAIEventsMutation.mutate(Math.max(1, Math.min(10, aiEventQuantity)))}
              disabled={generateAIEventsMutation.isPending}
              data-testid="button-submit-ai-generation"
            >
              {generateAIEventsMutation.isPending ? "Gerando..." : `Gerar ${aiEventQuantity} Evento${aiEventQuantity !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para criar evento manual */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Evento Manualmente</DialogTitle>
            <DialogDescription>Crie um evento personalizado que afetará o mercado</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createEventMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="roundId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rodada</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeRounds.map((r) => (
                            <SelectItem key={r.id} value={r.id}>Rodada {r.roundNumber}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="economic">Econômico</SelectItem>
                          <SelectItem value="technological">Tecnológico</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                          <SelectItem value="competitive">Competitivo</SelectItem>
                          <SelectItem value="regulatory">Regulatório</SelectItem>
                          <SelectItem value="environmental">Ambiental</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Aumento da Taxa de Juros" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Descreva o evento..." rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="impact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Impacto</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Redução do consumo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severidade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="baixo">Baixa</SelectItem>
                          <SelectItem value="medio">Média</SelectItem>
                          <SelectItem value="alto">Alta</SelectItem>
                          <SelectItem value="critico">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { form.reset(); setIsDialogOpen(false); }}>Cancelar</Button>
                <Button type="submit" disabled={createEventMutation.isPending}>
                  {createEventMutation.isPending ? "Criando..." : "Criar Evento"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================================
   COMPONENTE: Visão Geral do Marketing Mix
   ============================================ */
function MarketingMixOverview({ classId }: { classId: string }) {
  const { data: mixesData = [] } = useQuery<any[]>({
    queryKey: ["/api/classes", classId, "marketing-mixes"],
    queryFn: async () => {
      const res = await fetch(`/api/classes/${classId}/marketing-mixes`);
      if (!res.ok) throw new Error("Erro ao buscar decisões");
      return res.json();
    },
  });

  const groupedByRound = mixesData.reduce((acc: Record<number, any[]>, mix) => {
    const roundNum = mix.roundNumber || 0;
    if (!acc[roundNum]) acc[roundNum] = [];
    acc[roundNum].push(mix);
    return acc;
  }, {});

  const roundNumbers = Object.keys(groupedByRound).map(Number).sort((a, b) => b - a);

  if (mixesData.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed rounded-lg">
        <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Nenhuma decisão de marketing mix enviada ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Eye className="h-5 w-5" />
        Decisões de Marketing Mix
      </h3>
      <Tabs defaultValue={`round-${roundNumbers[0]}`}>
        <TabsList className="flex-wrap h-auto gap-1">
          {roundNumbers.map((num) => (
            <TabsTrigger key={num} value={`round-${num}`} className="text-xs">Rodada {num}</TabsTrigger>
          ))}
        </TabsList>
        {roundNumbers.map((roundNum) => (
          <TabsContent key={roundNum} value={`round-${roundNum}`} className="mt-4">
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipe</TableHead>
                    <TableHead>Qualidade</TableHead>
                    <TableHead>Características</TableHead>
                    <TableHead>Posicionamento</TableHead>
                    <TableHead>Estratégia Preço</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Canais</TableHead>
                    <TableHead>Promoção</TableHead>
                    <TableHead>Enviado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedByRound[roundNum]?.map((mix: any) => (
                    <TableRow key={mix.id}>
                      <TableCell className="font-medium">{mix.teamName}</TableCell>
                      <TableCell className="capitalize">{mix.productQuality}</TableCell>
                      <TableCell className="capitalize">{mix.productFeatures}</TableCell>
                      <TableCell className="capitalize">{mix.brandPositioning}</TableCell>
                      <TableCell className="capitalize">{mix.priceStrategy}</TableCell>
                      <TableCell>R$ {mix.priceValue}</TableCell>
                      <TableCell>
                        <div className="text-xs">{mix.distributionChannels?.join(", ")}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">{mix.promotionMix?.join(", ")}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {mix.submittedAt ? new Date(mix.submittedAt).toLocaleString("pt-BR") : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

/* ============================================
   COMPONENTE: Timeline de Rodadas
   ============================================ */
function RoundsTimeline({ 
  rounds, 
  activeRound, 
  currentClass,
  onStartRound, 
  onEndRound,
  onScheduleRound,
  onAddRound,
  onRemoveRound,
  onUpdateMaxRounds,
  startRoundPending,
  endRoundPending,
  addRoundPending,
  removeRoundPending,
  updateMaxRoundsPending
}: { 
  rounds: Round[];
  activeRound: Round | undefined;
  currentClass: Class;
  onStartRound: () => void;
  onEndRound: (roundId: string) => void;
  onScheduleRound: (round: Round) => void;
  onAddRound: () => void;
  onRemoveRound: (roundNumber: number) => void;
  onUpdateMaxRounds: (maxRounds: number) => void;
  startRoundPending: boolean;
  endRoundPending: boolean;
  addRoundPending: boolean;
  removeRoundPending: boolean;
  updateMaxRoundsPending: boolean;
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CircleDot className="h-5 w-5 text-green-500" />;
      case "completed": return <CircleCheck className="h-5 w-5 text-blue-500" />;
      default: return <CirclePause className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700";
      case "completed": return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      default: return "bg-muted/30 border-muted";
    }
  };

  // Find the last round (highest roundNumber)
  const sortedRounds = [...rounds].sort((a, b) => a.roundNumber - b.roundNumber);
  const lastRound = sortedRounds[sortedRounds.length - 1];
  const canRemoveRound = lastRound && lastRound.status === "locked" && lastRound.roundNumber > currentClass.currentRound;

  const [editMaxRounds, setEditMaxRounds] = useState(currentClass.maxRounds);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold">Rodadas da Turma</h3>
          <p className="text-sm text-muted-foreground">
            {currentClass.currentRound} de {rounds.length} rodadas criadas
          </p>
        </div>
        {!activeRound && currentClass.currentRound < currentClass.maxRounds ? (
          <Button onClick={onStartRound} disabled={startRoundPending} data-testid="button-start-round">
            <Play className="h-4 w-4 mr-2" />
            Iniciar Próxima Rodada
          </Button>
        ) : activeRound ? (
          <Button variant="destructive" onClick={() => onEndRound(activeRound.id)} disabled={endRoundPending} data-testid="button-end-round">
            <Pause className="h-4 w-4 mr-2" />
            Encerrar Rodada
          </Button>
        ) : (
          <Badge variant="outline">Rodadas concluídas</Badge>
        )}
      </div>

      {/* Configurar número total de rodadas */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2">
          <Label htmlFor="maxRounds" className="text-sm font-medium">Total de Rodadas:</Label>
          <Input
            id="maxRounds"
            type="number"
            min={currentClass.currentRound}
            max={20}
            value={editMaxRounds}
            onChange={(e) => setEditMaxRounds(parseInt(e.target.value) || currentClass.maxRounds)}
            onBlur={() => {
              if (editMaxRounds !== currentClass.maxRounds && editMaxRounds >= currentClass.currentRound) {
                onUpdateMaxRounds(editMaxRounds);
              }
              setEditMaxRounds(currentClass.maxRounds);
            }}
            disabled={updateMaxRoundsPending}
            className="w-16"
            data-testid="input-max-rounds-edit"
          />
          <span className="text-xs text-muted-foreground">(mín: {currentClass.currentRound})</span>
        </div>
      </div>

      {/* Controles de gerenciamento de rodadas */}
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
        <span className="text-sm font-medium mr-2">Adicionar/Remover Rodadas:</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddRound}
              disabled={addRoundPending}
              data-testid="button-add-round"
            >
              <Plus className="h-4 w-4 mr-1" />
              {addRoundPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Adiciona uma nova rodada bloqueada ao final</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => lastRound && onRemoveRound(lastRound.roundNumber)}
              disabled={removeRoundPending || !canRemoveRound}
              data-testid="button-remove-round"
            >
              <Minus className="h-4 w-4 mr-1" />
              {removeRoundPending ? "Removendo..." : "Remover Última"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {canRemoveRound 
              ? <p>Remove a Rodada {lastRound?.roundNumber} (bloqueada e sem dados)</p>
              : <p>Só é possível remover rodadas bloqueadas sem dados</p>
            }
          </TooltipContent>
        </Tooltip>
        <span className="text-xs text-muted-foreground ml-auto">
          Total: {rounds.length} rodadas
        </span>
      </div>

      {rounds.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Nenhuma rodada configurada ainda</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={onAddRound}
            disabled={addRoundPending}
            data-testid="button-add-first-round"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Primeira Rodada
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedRounds.map((round) => (
            <div
              key={round.id}
              className={`p-4 border-2 rounded-lg ${getStatusColor(round.status)} ${
                round.id === lastRound?.id && canRemoveRound ? "ring-2 ring-orange-300 dark:ring-orange-700" : ""
              }`}
              data-testid={`round-card-${round.id}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(round.status)}
                  <span className="font-semibold">Rodada {round.roundNumber}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={round.status === "active" ? "default" : round.status === "completed" ? "secondary" : "outline"}>
                    {round.status === "active" ? "Ativa" : round.status === "completed" ? "Completa" : "Bloqueada"}
                  </Badge>
                  {round.id === lastRound?.id && canRemoveRound && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                          onClick={() => onRemoveRound(round.roundNumber)}
                          disabled={removeRoundPending}
                          data-testid={`button-remove-round-${round.roundNumber}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remover esta rodada</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
              
              {(round.scheduledStartAt || round.scheduledEndAt) && (
                <div className="text-xs text-muted-foreground space-y-1 mb-2">
                  {round.scheduledStartAt && (
                    <p className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Início: {new Date(round.scheduledStartAt).toLocaleString("pt-BR")}
                    </p>
                  )}
                  {round.scheduledEndAt && (
                    <p className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Término: {new Date(round.scheduledEndAt).toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
              )}

              {round.status === "locked" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => onScheduleRound(round)}
                  data-testid={`button-schedule-round-${round.id}`}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {round.scheduledStartAt || round.scheduledEndAt ? "Editar" : "Agendar"}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================
   COMPONENTE: Ranking de Notas Acadêmicas
   ============================================ */
function GradesRanking({ 
  classId, 
  teams,
  rounds,
  users
}: { 
  classId: string;
  teams: any[];
  rounds: Round[];
  users: any[];
}) {
  const { toast } = useToast();
  
  const userMap = useMemo(() => {
    const map = new Map<string, { name: string; email: string }>();
    users.forEach(u => map.set(u.id, { name: u.name, email: u.email }));
    return map;
  }, [users]);
  
  const getTeamMemberNames = (team: any): string[] => {
    if (!team.memberIds || !Array.isArray(team.memberIds)) return [];
    return team.memberIds.map((id: string) => {
      const user = userMap.get(id);
      return user ? user.name : "Aluno";
    }).filter(Boolean);
  };
  
  const completedRounds = rounds.filter(r => r.status === "completed");
  const gradableRounds = completedRounds.filter(r => r.roundNumber > 1);
  
  const { data: allResults = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/results"],
    enabled: !!classId,
  });

  const teamIdSet = useMemo(() => new Set(teams.map(t => t.id)), [teams]);
  const gradableRoundIdSet = useMemo(() => new Set(gradableRounds.map(r => r.id)), [gradableRounds]);
  
  const classGradableResults = useMemo(() => {
    return allResults.filter(r => {
      if (!teamIdSet.has(r.teamId)) return false;
      if (!gradableRoundIdSet.has(r.roundId)) return false;
      const round = rounds.find(rd => rd.id === r.roundId);
      if (!round || round.roundNumber <= 1 || round.status !== "completed") return false;
      return true;
    });
  }, [allResults, teamIdSet, gradableRoundIdSet, rounds]);
  
  const calculateBenchmarks = useMemo(() => {
    if (classGradableResults.length === 0) return null;
    
    const profits = classGradableResults.map(r => r.profit);
    const rois = classGradableResults.map(r => r.roi);
    const marketShares = classGradableResults.map(r => r.marketShare);
    const npss = classGradableResults.map(r => r.nps);
    const margins = classGradableResults.map(r => r.margin);
    
    return {
      profit: { min: Math.min(...profits), max: Math.max(...profits) },
      roi: { min: Math.min(...rois), max: Math.max(...rois) },
      marketShare: { min: Math.min(...marketShares), max: Math.max(...marketShares) },
      nps: { min: Math.min(...npss), max: Math.max(...npss) },
      margin: { min: Math.min(...margins), max: Math.max(...margins) }
    };
  }, [classGradableResults]);
  
  const normalizeScore = (value: number, min: number, max: number): number => {
    if (max === min) return 50;
    const normalized = ((value - min) / (max - min)) * 100;
    return Math.min(100, Math.max(0, normalized));
  };
  
  const calculateGrade = (results: any[], benchmarks: typeof calculateBenchmarks): number => {
    if (results.length === 0 || !benchmarks) return 0;
    
    const weights = {
      profit: 0.25,
      roi: 0.20,
      marketShare: 0.15,
      nps: 0.15,
      margin: 0.15,
      alignmentScore: 0.10
    };
    
    let totalScore = 0;
    let validRounds = 0;
    
    results.forEach(result => {
      let roundScore = 0;
      
      const profitScore = normalizeScore(result.profit, benchmarks.profit.min, benchmarks.profit.max);
      roundScore += profitScore * weights.profit;
      
      const roiScore = normalizeScore(result.roi, benchmarks.roi.min, benchmarks.roi.max);
      roundScore += roiScore * weights.roi;
      
      const marketShareScore = normalizeScore(result.marketShare, benchmarks.marketShare.min, benchmarks.marketShare.max);
      roundScore += marketShareScore * weights.marketShare;
      
      const npsScore = normalizeScore(result.nps, benchmarks.nps.min, benchmarks.nps.max);
      roundScore += npsScore * weights.nps;
      
      const marginScore = normalizeScore(result.margin, benchmarks.margin.min, benchmarks.margin.max);
      roundScore += marginScore * weights.margin;
      
      if (result.alignmentScore !== null && result.alignmentScore !== undefined) {
        roundScore += result.alignmentScore * weights.alignmentScore;
      } else {
        const redistributedWeight = weights.alignmentScore / 5;
        roundScore += profitScore * redistributedWeight;
        roundScore += roiScore * redistributedWeight;
        roundScore += marketShareScore * redistributedWeight;
        roundScore += npsScore * redistributedWeight;
        roundScore += marginScore * redistributedWeight;
      }
      
      totalScore += roundScore;
      validRounds++;
    });
    
    return validRounds > 0 ? Math.round(totalScore / validRounds) : 0;
  };
  
  const getGradeColor = (grade: number): string => {
    if (grade >= 90) return "text-green-600";
    if (grade >= 70) return "text-blue-600";
    if (grade >= 50) return "text-yellow-600";
    return "text-red-600";
  };
  
  const getGradeBadge = (grade: number): { label: string; color: string } => {
    if (grade >= 90) return { label: "Excelente", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" };
    if (grade >= 70) return { label: "Bom", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" };
    if (grade >= 50) return { label: "Regular", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" };
    return { label: "Insuficiente", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
  };
  
  const teamGrades = useMemo(() => {
    if (!calculateBenchmarks) return [];
    
    return teams.map(team => {
      const teamResults = classGradableResults.filter(r => r.teamId === team.id);
      
      const grade = calculateGrade(teamResults, calculateBenchmarks);
      
      const roundGrades = gradableRounds.map(round => {
        const roundResult = classGradableResults.find(r => r.teamId === team.id && r.roundId === round.id);
        return {
          roundNumber: round.roundNumber,
          roundId: round.id,
          grade: roundResult ? calculateGrade([roundResult], calculateBenchmarks) : null
        };
      });
      
      const memberNames = getTeamMemberNames(team);
      
      return {
        teamId: team.id,
        teamName: team.name,
        companyName: team.companyName,
        memberCount: team.memberIds?.length || 0,
        memberNames,
        finalGrade: grade,
        roundGrades,
        roundsParticipated: teamResults.length
      };
    }).sort((a, b) => b.finalGrade - a.finalGrade);
  }, [teams, classGradableResults, gradableRounds, calculateBenchmarks, userMap]);
  
  const exportToExcel = () => {
    const headers = ["Posição", "Equipe", "Empresa", "Alunos", ...gradableRounds.map(r => `Rodada ${r.roundNumber}`), "Nota Final"];
    const rows = teamGrades.map((team, index) => {
      const roundColumns = team.roundGrades.map(rg => rg.grade !== null ? rg.grade.toString() : "-");
      const memberNamesStr = team.memberNames.join("; ");
      return [
        (index + 1).toString(),
        team.teamName,
        team.companyName || "-",
        `"${memberNamesStr}"`,
        ...roundColumns,
        team.finalGrade.toString()
      ];
    });
    
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notas_simulador_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Notas exportadas!", description: "Arquivo CSV gerado com sucesso." });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (gradableRounds.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <Award className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground font-medium">Nenhuma rodada avaliável ainda</p>
        <p className="text-sm text-muted-foreground mt-1">
          As notas serão calculadas a partir da Rodada 2.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          A Rodada 1 é considerada de aprendizado e não impacta a nota.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                <Award className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Ranking de Notas</CardTitle>
                <CardDescription>
                  Avaliação de 0 a 100 baseada no desempenho das equipes
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">Critérios de Avaliação:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Lucro Líquido: 25%</li>
                    <li>• ROI: 20%</li>
                    <li>• Market Share: 15%</li>
                    <li>• NPS: 15%</li>
                    <li>• Margem: 15%</li>
                    <li>• Alinhamento Estratégico: 10%</li>
                  </ul>
                  <p className="text-xs mt-2 text-muted-foreground">
                    * Rodada 1 não é considerada (aprendizado)
                  </p>
                </TooltipContent>
              </Tooltip>
              <Button variant="outline" size="sm" onClick={exportToExcel} data-testid="button-export-grades">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Equipe</TableHead>
                  <TableHead>Alunos</TableHead>
                  {gradableRounds.map(round => (
                    <TableHead key={round.id} className="text-center w-20">
                      R{round.roundNumber}
                    </TableHead>
                  ))}
                  <TableHead className="text-center w-28">Nota Final</TableHead>
                  <TableHead className="text-center w-28">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamGrades.map((team, index) => {
                  const badge = getGradeBadge(team.finalGrade);
                  return (
                    <TableRow key={team.teamId} data-testid={`row-grade-${team.teamId}`}>
                      <TableCell className="font-medium">
                        {index === 0 && <Medal className="h-4 w-4 text-yellow-500 inline mr-1" />}
                        {index === 1 && <Medal className="h-4 w-4 text-gray-400 inline mr-1" />}
                        {index === 2 && <Medal className="h-4 w-4 text-amber-600 inline mr-1" />}
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{team.companyName || team.teamName}</p>
                          {team.companyName && (
                            <p className="text-xs text-muted-foreground">{team.teamName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {team.memberNames.length > 0 ? (
                            team.memberNames.map((name: string, idx: number) => (
                              <p key={idx} className="text-sm">{name}</p>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground">Sem membros</p>
                          )}
                        </div>
                      </TableCell>
                      {team.roundGrades.map(rg => (
                        <TableCell key={rg.roundId} className="text-center">
                          {rg.grade !== null ? (
                            <span className={`font-medium ${getGradeColor(rg.grade)}`}>
                              {rg.grade}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <span className={`text-xl font-bold ${getGradeColor(team.finalGrade)}`}>
                          {team.finalGrade}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${badge.color} font-medium`}>
                          {badge.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {teamGrades.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma equipe encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Legenda de Notas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm">90-100: Excelente</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-sm">70-89: Bom</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-sm">50-69: Regular</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-sm">0-49: Insuficiente</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================
   COMPONENTE PRINCIPAL: Página do Professor
   ============================================ */
export default function Professor() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState("overview");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMarketDialogOpen, setIsMarketDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [teamBudgetEdits, setTeamBudgetEdits] = useState<Record<string, number>>({});
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [marketConfigEdits, setMarketConfigEdits] = useState<any>(null);
  const [addMemberDialog, setAddMemberDialog] = useState<{open: boolean; teamId: string | null; teamName: string}>({
    open: false, teamId: null, teamName: ""
  });
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
  const [memberToRemove, setMemberToRemove] = useState<{teamId: string; userId: string; userName: string} | null>(null);
  const [studentToRemove, setStudentToRemove] = useState<{studentId: string; studentName: string; classId?: string} | null>(null);
  const [passwordResetStudent, setPasswordResetStudent] = useState<{studentId: string; studentName: string; studentEmail: string} | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<{password: string; userName: string; userEmail: string} | null>(null);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState<string>("");
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isCreateStudentDialogOpen, setIsCreateStudentDialogOpen] = useState(false);
  const [newStudentData, setNewStudentData] = useState({ name: "", email: "", password: "", classId: "" as string | null });
  const [teamToReset, setTeamToReset] = useState<{teamId: string; teamName: string; roundId: string; roundNumber: number} | null>(null);
  const [roundBeingScheduled, setRoundBeingScheduled] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<{scheduledStartAt: string; scheduledEndAt: string}>({ scheduledStartAt: "", scheduledEndAt: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [viewDecisionsTeam, setViewDecisionsTeam] = useState<{teamId: string; teamName: string; classId: string} | null>(null);
  const [newClass, setNewClass] = useState({ 
    name: "", maxRounds: 10, defaultBudget: 100000, sector: "", businessType: "",
    marketSize: 0, marketGrowthRate: 0, competitionLevel: "", numberOfCompetitors: null as number | null,
    marketConcentration: "", competitorStrength: "", targetConsumers: 0,
  });

  // Queries
  const { data: classes = [] } = useQuery<Class[]>({ queryKey: ["/api/classes"] });
  const { data: marketSectors = [] } = useQuery<any[]>({ queryKey: ["/api/market/sectors"] });
  const { data: businessTypes = [] } = useQuery<any[]>({ queryKey: ["/api/market/business-types"] });
  const { data: competitionLevels = [] } = useQuery<any[]>({ queryKey: ["/api/market/competition-levels"] });
  const { data: rounds = [] } = useQuery<Round[]>({ queryKey: ["/api/rounds", selectedClass], enabled: !!selectedClass });
  const { data: teams = [] } = useQuery<any[]>({ queryKey: ["/api/classes", selectedClass, "teams"], enabled: !!selectedClass });
  const { data: economicData } = useQuery<any>({ queryKey: ["/api/economic/latest"] });
  const { data: users = [] } = useQuery<any[]>({ queryKey: ["/api/admin/users"] });
  const { data: enrolledStudents = [] } = useQuery<any[]>({ queryKey: ["/api/classes", selectedClass, "students"], enabled: !!selectedClass });
  const { data: allProfessorStudents = [] } = useQuery<any[]>({ queryKey: ["/api/professor/students/all"] });

  const lastCompletedRound = rounds.filter(r => r.status === "completed").sort((a, b) => b.roundNumber - a.roundNumber)[0];
  
  const { data: rankingResults = [] } = useQuery<any[]>({
    queryKey: ["/api/results/round", lastCompletedRound?.id],
    enabled: !!lastCompletedRound,
  });

  const teamIds = teams.map((t: any) => t.id);
  const { data: allFeedbacks = [], isLoading: feedbacksLoading, isFetching: feedbacksFetching } = useQuery<any[]>({
    queryKey: ["/api/feedbacks/teams", teamIds, lastCompletedRound?.id],
    queryFn: async () => {
      if (!lastCompletedRound || teamIds.length === 0) return [];
      const feedbackPromises = teamIds.map(async (teamId: string) => {
        try {
          const res = await fetch(`/api/feedback/${teamId}`);
          if (!res.ok) return { teamId, feedbacks: [] };
          const feedbacks = await res.json();
          return { teamId, feedbacks };
        } catch (error) {
          return { teamId, feedbacks: [] };
        }
      });
      return Promise.all(feedbackPromises);
    },
    enabled: !!lastCompletedRound && teamIds.length > 0,
  });

  const feedbackMap = new Map<string, boolean>();
  allFeedbacks.forEach(({ teamId, feedbacks }: any) => {
    const hasFeedback = feedbacks.some((f: any) => f.roundId === lastCompletedRound?.id);
    feedbackMap.set(teamId, hasFeedback);
  });

  // Computed values
  const currentClass = classes.find((c) => c.id === selectedClass);
  const activeRound = rounds.find((r) => r.status === "active");
  const allStudents = users.filter((u: any) => u.role === "equipe");
  const unenrolledStudents = allStudents.filter((student: any) => 
    !enrolledStudents.some((enrolled: any) => enrolled.id === student.id)
  ).sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
  const sortedEnrolledStudents = [...enrolledStudents].sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
  const sortedAllProfessorStudents = [...allProfessorStudents].sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));

  // Estatísticas do dashboard
  const stats = useMemo(() => {
    const totalTeams = classes.reduce((acc, cls) => {
      const classTeams = teams.filter((t: any) => t.classId === cls.id);
      return acc + classTeams.length;
    }, 0);
    
    const activeRoundsCount = rounds.filter(r => r.status === "active").length;
    const completedRoundsCount = rounds.filter(r => r.status === "completed").length;
    
    return {
      totalClasses: classes.length,
      totalTeams: selectedClass ? teams.length : totalTeams,
      activeRounds: activeRoundsCount,
      completedRounds: completedRoundsCount,
      totalStudents: sortedAllProfessorStudents.length
    };
  }, [classes, teams, rounds, sortedAllProfessorStudents, selectedClass]);

  // Filtrar equipes por busca
  const filteredTeams = useMemo(() => {
    if (!searchTerm) return teams;
    return teams.filter((team: any) => 
      team.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teams, searchTerm]);

  // Mutations
  const createClassMutation = useMutation({
    mutationFn: async (data: typeof newClass) => {
      const res = await apiRequest("POST", "/api/classes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({ title: "Turma criada!", description: "A turma foi criada com sucesso." });
      setIsDialogOpen(false);
      setNewClass({ name: "", maxRounds: 10, defaultBudget: 100000, sector: "", businessType: "",
        marketSize: 0, marketGrowthRate: 0, competitionLevel: "", numberOfCompetitors: null,
        marketConcentration: "", competitorStrength: "", targetConsumers: 0 });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar turma", description: error.message, variant: "destructive" });
    },
  });

  const updateMarketConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/classes/${data.classId}/market`, {
        sector: data.sector, businessType: data.businessType, marketSize: data.marketSize,
        marketGrowthRate: data.marketGrowthRate, defaultBudget: data.defaultBudget,
        competitionLevel: data.competitionLevel, numberOfCompetitors: data.numberOfCompetitors,
        marketConcentration: data.marketConcentration, competitorStrength: data.competitorStrength,
        targetConsumers: data.targetConsumers,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({ title: "Configurações atualizadas!" });
      setIsMarketDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const updateTeamBudgetMutation = useMutation({
    mutationFn: async (data: { teamId: string; budget: number }) => {
      const res = await apiRequest("PATCH", `/api/teams/${data.teamId}/budget`, { budget: data.budget });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClass, "teams"] });
      toast({ title: "Orçamento atualizado!" });
      const newEdits = { ...teamBudgetEdits };
      delete newEdits[variables.teamId];
      setTeamBudgetEdits(newEdits);
    },
    onError: (error: any, variables) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      const newEdits = { ...teamBudgetEdits };
      delete newEdits[variables.teamId];
      setTeamBudgetEdits(newEdits);
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (classId: string) => {
      const res = await apiRequest("DELETE", `/api/classes/${classId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({ title: "Turma excluída!" });
      setClassToDelete(null);
      if (selectedClass === classToDelete) setSelectedClass(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setClassToDelete(null);
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const res = await apiRequest("DELETE", `/api/teams/${teamId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClass, "teams"] });
      toast({ title: "Equipe excluída!" });
      setTeamToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setTeamToDelete(null);
    },
  });

  const addTeamMemberMutation = useMutation({
    mutationFn: async (data: { teamId: string; email: string }) => {
      const res = await apiRequest("POST", `/api/teams/${data.teamId}/members`, { email: data.email });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", variables.teamId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClass, "teams"] });
      toast({ title: "Membro adicionado!" });
      setAddMemberDialog({ open: false, teamId: null, teamName: "" });
      setNewMemberEmail("");
    },
    onError: (error: any) => {
      toast({ title: "Erro ao adicionar membro", description: error.message, variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (data: { teamId: string; userId: string }) => {
      const res = await apiRequest("DELETE", `/api/teams/${data.teamId}/members/${data.userId}`);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", variables.teamId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClass, "teams"] });
      toast({ title: "Membro removido!" });
      setMemberToRemove(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setMemberToRemove(null);
    },
  });

  const startRoundMutation = useMutation({
    mutationFn: async (classId: string) => {
      const res = await apiRequest("POST", `/api/rounds/${classId}/start`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rounds", selectedClass] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({ title: "Rodada iniciada!", description: "Os alunos já podem tomar decisões." });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const scheduleRoundMutation = useMutation({
    mutationFn: async (data: { roundId: string; scheduledStartAt?: string; scheduledEndAt?: string }) => {
      const res = await apiRequest("POST", `/api/rounds/${data.roundId}/schedule`, {
        scheduledStartAt: data.scheduledStartAt || null,
        scheduledEndAt: data.scheduledEndAt || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rounds", selectedClass] });
      toast({ title: "Agendamento salvo!" });
      setIsScheduleDialogOpen(false);
      setRoundBeingScheduled(null);
      setScheduleData({ scheduledStartAt: "", scheduledEndAt: "" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao agendar", description: error.message, variant: "destructive" });
    },
  });

  const endRoundMutation = useMutation({
    mutationFn: async (roundId: string) => {
      const res = await apiRequest("POST", `/api/rounds/${roundId}/end`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rounds", selectedClass] });
      toast({ title: "Rodada encerrada!" });
    },
  });

  const addRoundMutation = useMutation({
    mutationFn: async (classId: string) => {
      const res = await apiRequest("POST", `/api/classes/${classId}/rounds/add`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rounds", selectedClass] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({ title: "Rodada adicionada!", description: data.message });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const removeRoundMutation = useMutation({
    mutationFn: async ({ classId, roundNumber }: { classId: string; roundNumber: number }) => {
      const res = await apiRequest("DELETE", `/api/classes/${classId}/rounds/${roundNumber}`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rounds", selectedClass] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({ title: "Rodada removida!", description: data.message });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao remover rodada", description: error.message, variant: "destructive" });
    },
  });

  const updateMaxRoundsMutation = useMutation({
    mutationFn: async ({ classId, maxRounds }: { classId: string; maxRounds: number }) => {
      const res = await apiRequest("PATCH", `/api/classes/${classId}`, { maxRounds });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rounds", selectedClass] });
      toast({ title: "Número de rodadas atualizado!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar rodadas", description: error.message, variant: "destructive" });
    },
  });

  const generateAnalysesMutation = useMutation({
    mutationFn: async (roundId: string) => {
      const res = await apiRequest("POST", `/api/ai/generate-strategic-analyses/${roundId}`);
      return res.json();
    },
    onSuccess: (data) => {
      const successCount = data.results?.filter((r: any) => r.success).length || 0;
      const totalCount = data.results?.length || 0;
      toast({
        title: "Análises Geradas!",
        description: `${successCount} de ${totalCount} equipes receberam análises automáticas.`,
      });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao gerar análises", description: error.message, variant: "destructive" });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/auth/logout"); },
    onSuccess: () => {
      queryClient.setQueryData(["user"], null);
      queryClient.invalidateQueries();
      setLocation("/");
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClass, "teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rounds", selectedClass] });
      toast({ title: "Decisões resetadas!", description: data.message });
      setTeamToReset(null);
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao resetar decisões", description: error.message, variant: "destructive" });
    },
  });

  const addStudentToClassMutation = useMutation({
    mutationFn: async (data: { classId: string; studentId: string }) => {
      const res = await apiRequest("POST", `/api/classes/${data.classId}/students`, { studentId: data.studentId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClass, "students"] });
      toast({ title: "Aluno matriculado!" });
      setSelectedStudentToAdd("");
    },
    onError: (error: any) => {
      toast({ title: "Erro ao matricular aluno", description: error.message, variant: "destructive" });
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string; classId?: string | null }) => {
      const res = await apiRequest("POST", "/api/professor/students", {
        name: data.name, email: data.email, password: data.password, classId: data.classId || undefined
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClass, "students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/professor/students/all"] });
      toast({ title: "Aluno cadastrado!", description: data.message });
      setIsCreateStudentDialogOpen(false);
      setNewStudentData({ name: "", email: "", password: "", classId: "" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao cadastrar aluno", description: error.message, variant: "destructive" });
    },
  });

  const removeStudentFromClassMutation = useMutation({
    mutationFn: async (data: { classId: string; studentId: string }) => {
      const res = await apiRequest("DELETE", `/api/classes/${data.classId}/students/${data.studentId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClass, "students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClass, "teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/professor/students/all"] });
      toast({ title: "Aluno removido!" });
      setStudentToRemove(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao remover aluno", description: error.message, variant: "destructive" });
      setStudentToRemove(null);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const res = await apiRequest("POST", `/api/users/${studentId}/generate-temporary-password`);
      return res.json();
    },
    onSuccess: (data) => {
      setPasswordResetStudent(null);
      setGeneratedPassword({
        password: data.temporaryPassword,
        userName: data.userName,
        userEmail: data.userEmail
      });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao redefinir senha", description: error.message, variant: "destructive" });
      setPasswordResetStudent(null);
    },
  });

  // Effects
  useEffect(() => {
    if (isMarketDialogOpen && currentClass) {
      setMarketConfigEdits({
        sector: currentClass.sector || "", businessType: currentClass.businessType || "",
        marketSize: currentClass.marketSize || 0, marketGrowthRate: currentClass.marketGrowthRate || 0,
        defaultBudget: currentClass.defaultBudget || 100000, competitionLevel: currentClass.competitionLevel || "",
        numberOfCompetitors: currentClass.numberOfCompetitors || null, marketConcentration: currentClass.marketConcentration || "",
        competitorStrength: currentClass.competitorStrength || "", targetConsumers: currentClass.targetConsumers || 0,
      });
    } else if (!isMarketDialogOpen) {
      setMarketConfigEdits(null);
    }
  }, [isMarketDialogOpen, currentClass]);

  const handleScheduleRound = (round: Round) => {
    setRoundBeingScheduled(round.id);
    const formatLocalDateTime = (date: string | Date) => {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    setScheduleData({
      scheduledStartAt: round.scheduledStartAt ? formatLocalDateTime(round.scheduledStartAt) : "",
      scheduledEndAt: round.scheduledEndAt ? formatLocalDateTime(round.scheduledEndAt) : "",
    });
    setIsScheduleDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ======== HEADER COMPACTO ======== */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <LayoutDashboard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Painel do Professor</h1>
                <p className="text-xs text-muted-foreground">Simula+</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/aprovacoes">
                    <Button variant="ghost" size="icon" data-testid="button-aprovacoes">
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Aprovações Pendentes</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/admin">
                    <Button variant="ghost" size="icon" data-testid="button-admin">
                      <Database className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Painel de Dados</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => window.open('/api/manual/professor', '_blank')} data-testid="button-manual-professor">
                    <BookOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Manual do Professor</TooltipContent>
              </Tooltip>
              <Button size="sm" onClick={() => setIsDialogOpen(true)} data-testid="button-create-class">
                <Plus className="h-4 w-4 mr-1" />
                Nova Turma
              </Button>
              <Button variant="ghost" size="icon" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending} data-testid="button-logout-professor">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ======== CONTEXT BAR STICKY ======== */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Seletor de Turma */}
            <div className="flex items-center gap-3">
              <Select value={selectedClass ?? undefined} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[220px]" data-testid="select-class-context">
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {cls.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {currentClass && (
                <div className="flex items-center gap-2">
                  <Badge variant={activeRound ? "default" : "secondary"} className="gap-1">
                    {activeRound ? (
                      <>
                        <CircleDot className="h-3 w-3 animate-pulse" />
                        Rodada {activeRound.roundNumber} Ativa
                      </>
                    ) : (
                      <>
                        <CirclePause className="h-3 w-3" />
                        Sem rodada ativa
                      </>
                    )}
                  </Badge>
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {currentClass.currentRound}/{currentClass.maxRounds} rodadas
                  </span>
                </div>
              )}
            </div>

            {/* Ações Rápidas */}
            {currentClass && (
              <div className="flex items-center gap-2">
                {!activeRound && rounds.length < currentClass.maxRounds && (
                  <Button 
                    size="sm" 
                    onClick={() => selectedClass && startRoundMutation.mutate(selectedClass)}
                    disabled={startRoundMutation.isPending}
                    data-testid="button-quick-start-round"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Iniciar Rodada
                  </Button>
                )}
                {activeRound && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => endRoundMutation.mutate(activeRound.id)}
                    disabled={endRoundMutation.isPending}
                    data-testid="button-quick-end-round"
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Encerrar
                  </Button>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => setIsMarketDialogOpen(true)} data-testid="button-configure-market">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Configurar Mercado</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setLocation(`/professor/analytics/${selectedClass}`)}
                      data-testid="button-quick-analytics"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Analytics da Turma</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* ======== HERO STRIP - KPIS ======== */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Turmas" 
            value={stats.totalClasses} 
            icon={GraduationCap} 
            color="primary" 
            tooltip="Total de turmas que você gerencia"
          />
          <StatCard 
            title="Equipes" 
            value={stats.totalTeams} 
            subtitle={currentClass?.name || "Todas"} 
            icon={Users} 
            color="success"
            tooltip="Equipes na turma selecionada"
          />
          <StatCard 
            title="Rodadas" 
            value={`${stats.activeRounds} ativa${stats.activeRounds !== 1 ? 's' : ''}`} 
            subtitle={`${stats.completedRounds} concluídas`} 
            icon={Target} 
            color="warning"
            tooltip="Status das rodadas"
          />
          <StatCard 
            title="Alunos" 
            value={stats.totalStudents} 
            icon={Users} 
            color="primary"
            tooltip="Total de alunos matriculados"
          />
        </div>

        {/* ======== SEM TURMA SELECIONADA ======== */}
        {!selectedClass && (
          <Card className="border-dashed">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
                {classes.length === 0 ? (
                  <>
                    <h3 className="text-lg font-semibold mb-2">Nenhuma turma criada</h3>
                    <p className="text-muted-foreground mb-4">Crie sua primeira turma para começar</p>
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Turma
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold mb-2">Selecione uma turma</h3>
                    <p className="text-muted-foreground mb-4">Use o seletor acima para gerenciar uma turma</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {classes.slice(0, 3).map((cls) => (
                        <Button 
                          key={cls.id} 
                          variant="outline" 
                          onClick={() => setSelectedClass(cls.id)}
                          data-testid={`button-quick-select-${cls.id}`}
                        >
                          {cls.name}
                        </Button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ======== CONTEÚDO DA TURMA SELECIONADA ======== */}
        {selectedClass && currentClass && (
          <>
            {/* Navegação por Seções */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="h-auto p-1 bg-muted/50">
                  <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background" data-testid="tab-overview">
                    <LayoutDashboard className="h-4 w-4" />
                    Visão Geral
                  </TabsTrigger>
                  <TabsTrigger value="teams" className="gap-2 data-[state=active]:bg-background" data-testid="tab-teams">
                    <Users className="h-4 w-4" />
                    Equipes
                    {teams.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{teams.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="rounds" className="gap-2 data-[state=active]:bg-background" data-testid="tab-rounds">
                    <Calendar className="h-4 w-4" />
                    Rodadas
                    <div className="flex items-center gap-1 ml-1">
                      {activeRound && (
                        <Badge className="h-5 px-1.5 text-xs bg-green-500">Ativa</Badge>
                      )}
                      {rounds.filter(r => r.status === "completed").length > 0 && (
                        <Badge variant="outline" className="h-5 px-1.5 text-xs">
                          {rounds.filter(r => r.status === "completed").length} concl.
                        </Badge>
                      )}
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="results" className="gap-2 data-[state=active]:bg-background" data-testid="tab-results">
                    <Trophy className="h-4 w-4" />
                    Resultados
                    {lastCompletedRound && (
                      <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                        R{lastCompletedRound.roundNumber}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="grades" className="gap-2 data-[state=active]:bg-background" data-testid="tab-grades">
                    <Award className="h-4 w-4" />
                    Notas
                    {rounds.filter(r => r.status === "completed" && r.roundNumber > 1).length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        {rounds.filter(r => r.status === "completed" && r.roundNumber > 1).length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="access-logs" className="gap-2 data-[state=active]:bg-background" data-testid="tab-access-logs">
                    <AlertCircle className="h-4 w-4" />
                    Acessos
                  </TabsTrigger>
                  <TabsTrigger value="email" className="gap-2 data-[state=active]:bg-background" data-testid="tab-email">
                    <Mail className="h-4 w-4" />
                    Emails
                  </TabsTrigger>
                </TabsList>

                {/* ======== ABA: VISÃO GERAL ======== */}
                <TabsContent value="overview" className="mt-6 space-y-6">
                  {/* Resumo rápido com tooltips */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Card className="hover-elevate cursor-help" data-testid="card-kpi-teams">
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-2xl font-bold" data-testid="text-kpi-teams">{teams.length}</p>
                                <p className="text-sm text-muted-foreground">Equipes</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TooltipTrigger>
                      <TooltipContent>Total de equipes nesta turma</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Card className="hover-elevate cursor-help" data-testid="card-kpi-active-round">
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <Target className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="text-2xl font-bold" data-testid="text-kpi-active-round">{rounds.filter(r => r.status === "active").length}</p>
                                <p className="text-sm text-muted-foreground">Rodada Ativa</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TooltipTrigger>
                      <TooltipContent>Rodadas em andamento para os alunos</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Card className="hover-elevate cursor-help" data-testid="card-kpi-budget">
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-2xl font-bold" data-testid="text-kpi-budget">R$ {(currentClass.defaultBudget / 1000).toFixed(0)}k</p>
                                <p className="text-sm text-muted-foreground">Orçamento Base</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TooltipTrigger>
                      <TooltipContent>Orçamento inicial das equipes por rodada</TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Dados Econômicos */}
                  {economicData && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Activity className="h-5 w-5" />
                          Dados Econômicos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Taxa USD/BRL</p>
                            <p className="text-xl font-bold">R$ {economicData.exchangeRateUSD?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Tendência</p>
                            <div className="flex items-center gap-2">
                              {economicData.analysis?.trend === "up" && <TrendingUp className="h-5 w-5 text-green-600" />}
                              {economicData.analysis?.trend === "down" && <TrendingDown className="h-5 w-5 text-red-600" />}
                              {economicData.analysis?.trend === "stable" && <Minus className="h-5 w-5 text-blue-600" />}
                              <span className="font-medium capitalize">{economicData.analysis?.trend}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Condição</p>
                            <Badge variant={economicData.analysis?.condition === "favorable" ? "default" : "secondary"}>
                              {economicData.analysis?.condition === "favorable" ? "Favorável" : "Neutra"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Eventos de Mercado */}
                  {rounds.length > 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <MarketEventsManager classId={selectedClass} rounds={rounds} />
                      </CardContent>
                    </Card>
                  )}

                  {/* Marketing Mix */}
                  <Card>
                    <CardContent className="pt-6">
                      <MarketingMixOverview classId={selectedClass} />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ======== ABA: EQUIPES ======== */}
                <TabsContent value="teams" className="mt-6 space-y-6">
                  {/* Barra de busca e ações */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar equipe..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-teams"
                      />
                    </div>
                    <Button onClick={() => { setNewStudentData({ ...newStudentData, classId: selectedClass }); setIsCreateStudentDialogOpen(true); }} data-testid="button-create-student">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Cadastrar Aluno
                    </Button>
                  </div>

                  {/* Lista de Equipes */}
                  {filteredTeams.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        {searchTerm ? "Nenhuma equipe encontrada" : "Nenhuma equipe criada ainda"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {filteredTeams.map((team: any) => (
                        <TeamCard
                          key={team.id}
                          team={team}
                          users={users}
                          isExpanded={expandedTeams[team.id] || false}
                          onToggle={(open) => setExpandedTeams({ ...expandedTeams, [team.id]: open })}
                          onAddMember={() => setAddMemberDialog({ open: true, teamId: team.id, teamName: team.name })}
                          onRemoveMember={(teamId, userId, userName) => setMemberToRemove({ teamId, userId, userName })}
                          onViewDecisions={() => setViewDecisionsTeam({ teamId: team.id, teamName: team.name, classId: selectedClass })}
                        />
                      ))}
                    </div>
                  )}

                  {/* Alunos Matriculados */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Alunos Matriculados</CardTitle>
                      <CardDescription>
                        {sortedEnrolledStudents.length} alunos na turma
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-4">
                        <Select value={selectedStudentToAdd} onValueChange={setSelectedStudentToAdd} disabled={unenrolledStudents.length === 0}>
                          <SelectTrigger className="flex-1" data-testid="select-student-to-add">
                            <SelectValue placeholder={unenrolledStudents.length === 0 ? "Todos matriculados" : "Selecione um aluno"} />
                          </SelectTrigger>
                          <SelectContent>
                            {unenrolledStudents.map((student: any) => (
                              <SelectItem key={student.id} value={student.id}>{student.name} ({student.email})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => { if (selectedStudentToAdd && selectedClass) addStudentToClassMutation.mutate({ classId: selectedClass, studentId: selectedStudentToAdd }); }}
                          disabled={!selectedStudentToAdd || addStudentToClassMutation.isPending}
                          data-testid="button-add-student"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Adicionar
                        </Button>
                      </div>

                      {sortedEnrolledStudents.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sortedEnrolledStudents.map((student: any) => (
                                <TableRow key={student.id}>
                                  <TableCell className="font-medium">{student.name}</TableCell>
                                  <TableCell className="text-muted-foreground">{student.email}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setPasswordResetStudent({ studentId: student.id, studentName: student.name, studentEmail: student.email })}
                                            data-testid={`button-reset-password-${student.id}`}
                                          >
                                            <Key className="h-4 w-4 text-primary" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Redefinir Senha</TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setStudentToRemove({ studentId: student.id, studentName: student.name })}
                                            data-testid={`button-remove-student-${student.id}`}
                                          >
                                            <UserMinus className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Remover da Turma</TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Orçamentos das Equipes */}
                  {teams.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Orçamentos das Equipes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Equipe</TableHead>
                                <TableHead>Membros</TableHead>
                                <TableHead className="text-right">Orçamento (R$)</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {teams.map((team: any) => (
                                <TableRow key={team.id}>
                                  <TableCell className="font-medium">{team.name}</TableCell>
                                  <TableCell><Badge variant="outline">{team.memberIds?.length || 0}</Badge></TableCell>
                                  <TableCell className="text-right">
                                    <Input
                                      type="number"
                                      min="0"
                                      step="1000"
                                      value={teamBudgetEdits[team.id] ?? team.budget}
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value);
                                        if (!isNaN(value)) setTeamBudgetEdits({ ...teamBudgetEdits, [team.id]: value });
                                      }}
                                      onBlur={() => {
                                        const editedValue = teamBudgetEdits[team.id];
                                        if (editedValue !== undefined && editedValue !== team.budget && editedValue > 0) {
                                          updateTeamBudgetMutation.mutate({ teamId: team.id, budget: editedValue });
                                        }
                                      }}
                                      disabled={updateTeamBudgetMutation.isPending}
                                      className="w-28 text-right"
                                      data-testid={`input-budget-${team.id}`}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => setTeamToDelete(team.id)} data-testid={`button-delete-team-${team.id}`}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* ======== ABA: RODADAS ======== */}
                <TabsContent value="rounds" className="mt-6 space-y-6">
                  <RoundsTimeline
                    rounds={rounds}
                    activeRound={activeRound}
                    currentClass={currentClass}
                    onStartRound={() => startRoundMutation.mutate(selectedClass)}
                    onEndRound={(roundId) => endRoundMutation.mutate(roundId)}
                    onScheduleRound={handleScheduleRound}
                    onAddRound={() => addRoundMutation.mutate(selectedClass)}
                    onRemoveRound={(roundNumber) => removeRoundMutation.mutate({ classId: selectedClass, roundNumber })}
                    onUpdateMaxRounds={(maxRounds) => updateMaxRoundsMutation.mutate({ classId: selectedClass, maxRounds })}
                    startRoundPending={startRoundMutation.isPending}
                    endRoundPending={endRoundMutation.isPending}
                    addRoundPending={addRoundMutation.isPending}
                    removeRoundPending={removeRoundMutation.isPending}
                    updateMaxRoundsPending={updateMaxRoundsMutation.isPending}
                  />

                  {/* Gerar Análises Estratégicas */}
                  {activeRound && teams.length > 0 && (
                    <Card className="border-primary/50">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-5 w-5 text-primary" />
                              <h4 className="font-semibold">Análises Estratégicas Automáticas</h4>
                              <Badge variant="secondary">IA</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Gere análises SWOT, Porter, BCG e PESTEL automaticamente via IA para todas as equipes.
                            </p>
                          </div>
                          <Button
                            onClick={() => generateAnalysesMutation.mutate(activeRound.id)}
                            disabled={generateAnalysesMutation.isPending}
                            data-testid="button-generate-analyses"
                          >
                            {generateAnalysesMutation.isPending ? (
                              <>
                                <Activity className="h-4 w-4 mr-2 animate-spin" />
                                Gerando...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Gerar Análises
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Reset de Decisões */}
                  {teams.length > 0 && rounds.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <RefreshCw className="h-5 w-5" />
                          Gerenciamento de Decisões
                        </CardTitle>
                        <CardDescription>Resete as decisões de uma equipe para permitir que refaçam suas escolhas</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Equipe</TableHead>
                                <TableHead>Resetar Decisões</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {teams.map((team: any) => (
                                <TableRow key={team.id}>
                                  <TableCell className="font-medium">{team.name}</TableCell>
                                  <TableCell>
                                    <Select
                                      onValueChange={(roundId) => {
                                        const round = rounds.find(r => r.id === roundId);
                                        if (round) setTeamToReset({ teamId: team.id, teamName: team.name, roundId, roundNumber: round.roundNumber });
                                      }}
                                    >
                                      <SelectTrigger className="w-[160px]" data-testid={`select-reset-round-${team.id}`}>
                                        <SelectValue placeholder="Selecionar rodada" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {rounds.map((round) => (
                                          <SelectItem key={round.id} value={round.id}>
                                            Rodada {round.roundNumber} ({round.status === 'active' ? 'Ativa' : round.status === 'completed' ? 'Concluída' : 'Bloqueada'})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* ======== ABA: RESULTADOS ======== */}
                <TabsContent value="results" className="mt-6 space-y-6">
                  {/* Ranking */}
                  {rankingResults.length > 0 && lastCompletedRound && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-yellow-500" />
                          Ranking - Rodada {lastCompletedRound.roundNumber}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-lg overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>Equipe</TableHead>
                                <TableHead className="text-right">Receita</TableHead>
                                <TableHead className="text-right">Lucro</TableHead>
                                <TableHead className="text-right">ROI</TableHead>
                                <TableHead className="text-right">Market Share</TableHead>
                                <TableHead className="text-right">Feedback</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {[...rankingResults].sort((a, b) => b.profit - a.profit).map((result: any, index: number) => (
                                <TableRow key={result.id}>
                                  <TableCell className="font-medium">
                                    {index === 0 && <Trophy className="h-4 w-4 text-yellow-600 inline mr-1" />}
                                    {index + 1}
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{result.companyName || result.teamName}</p>
                                      {result.companyName && <p className="text-xs text-muted-foreground">{result.teamName}</p>}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">R$ {result.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                  <TableCell className="text-right">
                                    <span className={result.profit > 0 ? "text-green-600" : "text-red-600"}>
                                      R$ {result.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">{result.roi.toFixed(1)}%</TableCell>
                                  <TableCell className="text-right">{result.marketShare.toFixed(1)}%</TableCell>
                                  <TableCell className="text-right">
                                    <FeedbackButton
                                      teamId={result.teamId}
                                      roundId={lastCompletedRound.id}
                                      teamName={result.companyName || result.teamName}
                                      hasFeedback={feedbackMap.get(result.teamId) || false}
                                      isLoadingFeedbacks={feedbacksLoading}
                                      isFetchingFeedbacks={feedbacksFetching}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Relatório de Alinhamento */}
                  {teams.length > 0 && (
                    <AlignmentTeamReport classId={selectedClass} lastCompletedRound={lastCompletedRound || null} />
                  )}

                  {/* Mensagem quando não há resultados */}
                  {!lastCompletedRound && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Nenhuma rodada concluída ainda</p>
                      <p className="text-sm text-muted-foreground mt-1">Os resultados aparecerão após a primeira rodada ser encerrada</p>
                    </div>
                  )}
                </TabsContent>

                {/* ======== ABA: NOTAS ======== */}
                <TabsContent value="grades" className="mt-6">
                  <GradesRanking 
                    classId={selectedClass} 
                    teams={teams} 
                    rounds={rounds}
                    users={users}
                  />
                </TabsContent>

                {/* ======== ABA: RELATÓRIO DE ACESSOS ======== */}
                <TabsContent value="access-logs" className="mt-6">
                  <AccessLogsReport classId={selectedClass} rounds={rounds} teams={teams} />
                </TabsContent>

                {/* ======== ABA: ENVIO DE EMAILS ======== */}
                <TabsContent value="email" className="mt-6">
                  <SendEmailToTeams classId={selectedClass} teams={teams} className={currentClass.name} />
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </div>

      {/* ======== DIALOGS E MODAIS ======== */}
      
      {/* Dialog para criar nova turma */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-class">
          <DialogHeader>
            <DialogTitle>Criar Nova Turma</DialogTitle>
            <DialogDescription>Configure os parâmetros iniciais da turma</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Turma *</Label>
                <Input id="name" value={newClass.name} onChange={(e) => setNewClass({ ...newClass, name: e.target.value })} placeholder="Ex: Marketing 2025-1" data-testid="input-class-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxRounds">Número de Rodadas</Label>
                <Input id="maxRounds" type="number" min={1} max={20} value={newClass.maxRounds} onChange={(e) => setNewClass({ ...newClass, maxRounds: parseInt(e.target.value) || 10 })} data-testid="input-max-rounds" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sector">Setor de Mercado</Label>
                <Select value={newClass.sector} onValueChange={(value) => setNewClass({ ...newClass, sector: value })}>
                  <SelectTrigger id="sector" data-testid="select-sector">
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {marketSectors.map((sector: any) => (
                      <SelectItem key={sector.id} value={sector.id}>{sector.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessType">Tipo de Comércio</Label>
                <Select value={newClass.businessType} onValueChange={(value) => setNewClass({ ...newClass, businessType: value })}>
                  <SelectTrigger id="businessType" data-testid="select-business-type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((type: any) => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultBudget">Orçamento Padrão (R$)</Label>
                <Input id="defaultBudget" type="number" min={10000} step={10000} value={newClass.defaultBudget} onChange={(e) => setNewClass({ ...newClass, defaultBudget: parseInt(e.target.value) || 100000 })} data-testid="input-default-budget" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="competitionLevel">Nível de Concorrência</Label>
                <Select value={newClass.competitionLevel} onValueChange={(value) => setNewClass({ ...newClass, competitionLevel: value })}>
                  <SelectTrigger id="competitionLevel" data-testid="select-competition-level">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {competitionLevels.map((level: any) => (
                      <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => createClassMutation.mutate(newClass)} disabled={!newClass.name || createClassMutation.isPending} data-testid="button-submit-class">
              {createClassMutation.isPending ? "Criando..." : "Criar Turma"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para configurar mercado */}
      <Dialog open={isMarketDialogOpen} onOpenChange={setIsMarketDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-market-config">
          <DialogHeader>
            <DialogTitle>Configurações de Mercado</DialogTitle>
            <DialogDescription>Ajuste os parâmetros de mercado da turma</DialogDescription>
          </DialogHeader>
          {marketConfigEdits && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Setor</Label>
                  <Select value={marketConfigEdits.sector} onValueChange={(value) => setMarketConfigEdits({ ...marketConfigEdits, sector: value })}>
                    <SelectTrigger data-testid="select-edit-sector"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {marketSectors.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Comércio</Label>
                  <Select value={marketConfigEdits.businessType} onValueChange={(value) => setMarketConfigEdits({ ...marketConfigEdits, businessType: value })}>
                    <SelectTrigger data-testid="select-edit-business-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Orçamento Padrão (R$)</Label>
                  <Input type="number" value={marketConfigEdits.defaultBudget} onChange={(e) => setMarketConfigEdits({ ...marketConfigEdits, defaultBudget: parseInt(e.target.value) || 100000 })} data-testid="input-edit-default-budget" />
                </div>
                <div className="space-y-2">
                  <Label>Nível de Concorrência</Label>
                  <Select value={marketConfigEdits.competitionLevel} onValueChange={(value) => setMarketConfigEdits({ ...marketConfigEdits, competitionLevel: value })}>
                    <SelectTrigger data-testid="select-edit-competition"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {competitionLevels.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número de Concorrentes</Label>
                  <Input type="number" value={marketConfigEdits.numberOfCompetitors ?? ""} onChange={(e) => setMarketConfigEdits({ ...marketConfigEdits, numberOfCompetitors: e.target.value ? parseInt(e.target.value) : null })} data-testid="input-edit-num-competitors" />
                </div>
                <div className="space-y-2">
                  <Label>Concentração de Mercado</Label>
                  <Select value={marketConfigEdits.marketConcentration} onValueChange={(value) => setMarketConfigEdits({ ...marketConfigEdits, marketConcentration: value })}>
                    <SelectTrigger data-testid="select-edit-market-concentration"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monopolio">Monopólio</SelectItem>
                      <SelectItem value="oligopolio">Oligopólio</SelectItem>
                      <SelectItem value="concorrencia_monopolistica">Concorrência Monopolística</SelectItem>
                      <SelectItem value="concorrencia_perfeita">Concorrência Perfeita</SelectItem>
                      <SelectItem value="fragmentado">Fragmentado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Força dos Concorrentes</Label>
                <Select value={marketConfigEdits.competitorStrength} onValueChange={(value) => setMarketConfigEdits({ ...marketConfigEdits, competitorStrength: value })}>
                  <SelectTrigger data-testid="select-edit-competitor-strength"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fraca">Fraca</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="forte">Forte</SelectItem>
                    <SelectItem value="muito_forte">Muito Forte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMarketDialogOpen(false)} data-testid="button-close-market-dialog">Cancelar</Button>
            <Button
              onClick={() => {
                if (selectedClass && marketConfigEdits) {
                  updateMarketConfigMutation.mutate({ classId: selectedClass, ...marketConfigEdits });
                }
              }}
              disabled={updateMarketConfigMutation.isPending}
              data-testid="button-save-market-config"
            >
              {updateMarketConfigMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar membro à equipe */}
      <Dialog open={addMemberDialog.open} onOpenChange={(open) => !open && setAddMemberDialog({ open: false, teamId: null, teamName: "" })}>
        <DialogContent data-testid="dialog-add-team-member">
          <DialogHeader>
            <DialogTitle>Adicionar Membro</DialogTitle>
            <DialogDescription>Adicione um aluno à equipe "{addMemberDialog.teamName}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email do Aluno</Label>
              <Input type="email" placeholder="aluno@email.com" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} data-testid="input-member-email" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddMemberDialog({ open: false, teamId: null, teamName: "" }); setNewMemberEmail(""); }} data-testid="button-cancel-add-member">Cancelar</Button>
            <Button
              onClick={() => { if (addMemberDialog.teamId && newMemberEmail) addTeamMemberMutation.mutate({ teamId: addMemberDialog.teamId, email: newMemberEmail }); }}
              disabled={!newMemberEmail || addTeamMemberMutation.isPending}
              data-testid="button-submit-add-member"
            >
              {addTeamMemberMutation.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para agendar rodada */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={(open) => { setIsScheduleDialogOpen(open); if (!open) { setRoundBeingScheduled(null); setScheduleData({ scheduledStartAt: "", scheduledEndAt: "" }); } }}>
        <DialogContent data-testid="dialog-schedule-round">
          <DialogHeader>
            <DialogTitle>Agendar Rodada</DialogTitle>
            <DialogDescription>Defina as datas para ativação e encerramento automático</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Data/Hora de Início</Label>
              <Input type="datetime-local" value={scheduleData.scheduledStartAt} onChange={(e) => setScheduleData({ ...scheduleData, scheduledStartAt: e.target.value })} data-testid="input-scheduled-start" />
            </div>
            <div className="space-y-2">
              <Label>Data/Hora de Término</Label>
              <Input type="datetime-local" value={scheduleData.scheduledEndAt} onChange={(e) => setScheduleData({ ...scheduleData, scheduledEndAt: e.target.value })} data-testid="input-scheduled-end" />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <div>
              {(scheduleData.scheduledStartAt || scheduleData.scheduledEndAt) && (
                <Button
                  variant="destructive"
                  onClick={() => { if (roundBeingScheduled) scheduleRoundMutation.mutate({ roundId: roundBeingScheduled, scheduledStartAt: undefined, scheduledEndAt: undefined }); }}
                  disabled={!roundBeingScheduled || scheduleRoundMutation.isPending}
                  data-testid="button-remove-schedule"
                >
                  Remover Agendamento
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)} data-testid="button-cancel-schedule">Cancelar</Button>
              <Button
                onClick={() => { if (roundBeingScheduled) scheduleRoundMutation.mutate({ roundId: roundBeingScheduled, scheduledStartAt: scheduleData.scheduledStartAt || undefined, scheduledEndAt: scheduleData.scheduledEndAt || undefined }); }}
                disabled={!roundBeingScheduled || scheduleRoundMutation.isPending}
                data-testid="button-submit-schedule"
              >
                {scheduleRoundMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para cadastrar novo aluno */}
      <Dialog open={isCreateStudentDialogOpen} onOpenChange={setIsCreateStudentDialogOpen}>
        <DialogContent data-testid="dialog-create-student">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Cadastrar Novo Aluno
            </DialogTitle>
            <DialogDescription>O aluno será automaticamente aprovado</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input value={newStudentData.name} onChange={(e) => setNewStudentData({ ...newStudentData, name: e.target.value })} placeholder="Nome do aluno" data-testid="input-student-name" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={newStudentData.email} onChange={(e) => setNewStudentData({ ...newStudentData, email: e.target.value })} placeholder="email@exemplo.com" data-testid="input-student-email" />
            </div>
            <div className="space-y-2">
              <Label>Senha Inicial *</Label>
              <Input type="password" value={newStudentData.password} onChange={(e) => setNewStudentData({ ...newStudentData, password: e.target.value })} placeholder="Senha inicial" data-testid="input-student-password" />
            </div>
            <div className="space-y-2">
              <Label>Matricular na Turma</Label>
              <Select value={newStudentData.classId || "none"} onValueChange={(value) => setNewStudentData({ ...newStudentData, classId: value === "none" ? null : value })}>
                <SelectTrigger data-testid="select-student-class"><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não matricular ainda</SelectItem>
                  {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateStudentDialogOpen(false); setNewStudentData({ name: "", email: "", password: "", classId: "" }); }}>Cancelar</Button>
            <Button
              onClick={() => createStudentMutation.mutate(newStudentData)}
              disabled={!newStudentData.name || !newStudentData.email || !newStudentData.password || createStudentMutation.isPending}
              data-testid="button-submit-create-student"
            >
              {createStudentMutation.isPending ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialogs de confirmação */}
      <AlertDialog open={!!classToDelete} onOpenChange={(open) => !open && setClassToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-class">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => classToDelete && deleteClassMutation.mutate(classToDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete-class">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!teamToDelete} onOpenChange={(open) => !open && setTeamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta equipe?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-team">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => teamToDelete && deleteTeamMutation.mutate(teamToDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete-team">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>Remover {memberToRemove?.userName} da equipe?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-remove-member">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => memberToRemove && removeMemberMutation.mutate({ teamId: memberToRemove.teamId, userId: memberToRemove.userId })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-remove-member">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!studentToRemove} onOpenChange={(open) => !open && setStudentToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>Remover {studentToRemove?.studentName} da turma?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-remove-student">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (studentToRemove) {
                  const classIdToUse = studentToRemove.classId || selectedClass;
                  if (classIdToUse) removeStudentFromClassMutation.mutate({ classId: classIdToUse, studentId: studentToRemove.studentId });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-remove-student"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!teamToReset} onOpenChange={(open) => !open && setTeamToReset(null)}>
        <AlertDialogContent data-testid="dialog-reset-decisions">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-orange-600" />
              Resetar Decisões
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Resetar decisões de <strong>{teamToReset?.teamName}</strong> (Rodada {teamToReset?.roundNumber})?</p>
              <p className="text-xs text-muted-foreground">Isso apagará: Análises Estratégicas, Recomendações IA, Mix de Marketing e Configuração de Produtos.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-reset">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => teamToReset && resetTeamDecisionsMutation.mutate({ teamId: teamToReset.teamId, roundId: teamToReset.roundId })}
              disabled={resetTeamDecisionsMutation.isPending}
              className="bg-orange-600 text-white hover:bg-orange-700"
              data-testid="button-confirm-reset"
            >
              {resetTeamDecisionsMutation.isPending ? "Resetando..." : "Confirmar Reset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para visualizar decisões da equipe */}
      {viewDecisionsTeam && (
        <TeamDecisionsViewer
          teamId={viewDecisionsTeam.teamId}
          teamName={viewDecisionsTeam.teamName}
          classId={viewDecisionsTeam.classId}
          rounds={rounds}
          onClose={() => setViewDecisionsTeam(null)}
        />
      )}

      {/* Dialog de confirmação para redefinir senha */}
      <AlertDialog open={!!passwordResetStudent} onOpenChange={(open) => !open && setPasswordResetStudent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Redefinir Senha
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Deseja gerar uma senha temporária para <strong>{passwordResetStudent?.studentName}</strong>?</p>
              <p className="text-xs text-muted-foreground">
                Email: {passwordResetStudent?.studentEmail}
              </p>
              <p className="text-xs text-muted-foreground">
                A senha temporária expira em 1 hora. O aluno deverá alterá-la após o primeiro login.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-reset-password">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => passwordResetStudent && resetPasswordMutation.mutate(passwordResetStudent.studentId)}
              disabled={resetPasswordMutation.isPending}
              data-testid="button-confirm-reset-password"
            >
              {resetPasswordMutation.isPending ? "Gerando..." : "Gerar Senha"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog com a senha temporária gerada */}
      <Dialog open={!!generatedPassword} onOpenChange={(open) => !open && setGeneratedPassword(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Senha Temporária Gerada
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Aluno:</p>
              <p className="font-medium">{generatedPassword?.userName}</p>
              <p className="text-sm text-muted-foreground">{generatedPassword?.userEmail}</p>
            </div>
            <div className="p-4 bg-primary/10 border-2 border-primary rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Senha Temporária:</p>
              <p className="text-2xl font-mono font-bold tracking-widest text-primary" data-testid="text-temporary-password">
                {generatedPassword?.password}
              </p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                A senha expira em 1 hora
              </p>
              <p className="text-xs">
                Informe esta senha ao aluno. Após o login, ele deverá criar uma nova senha.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setGeneratedPassword(null)} data-testid="button-close-password-dialog">
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
