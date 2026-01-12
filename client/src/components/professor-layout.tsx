import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Trophy,
  Settings,
  ChevronDown,
  Zap,
  Play,
  Pause,
  BarChart3,
  UserCheck,
  HelpCircle,
  LogOut,
  GraduationCap,
  ArrowRight,
  MapPin,
  Shield,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeVariant?: "default" | "secondary" | "outline" | "destructive";
}

const navigationItems: NavItem[] = [
  { title: "Painel", href: "/professor", icon: LayoutDashboard },
  { title: "Aprovações", href: "/aprovacoes", icon: UserCheck },
  { title: "Admin", href: "/admin", icon: Shield },
];

interface HelpMapItem {
  section: string;
  description: string;
  path: string;
  icon: React.ElementType;
}

const helpMap: HelpMapItem[] = [
  { section: "Iniciar/Encerrar Rodada", description: "Controle o fluxo das rodadas para os alunos", path: "Painel → Selecione turma → Aba 'Rodadas'", icon: Play },
  { section: "Ver Submissões", description: "Acompanhe quais equipes já enviaram decisões", path: "Painel → Selecione turma → Aba 'Equipes'", icon: UserCheck },
  { section: "Processar Resultados", description: "Calcule KPIs e resultados após encerrar rodada", path: "Painel → Aba 'Rodadas' → Botão 'Processar'", icon: BarChart3 },
  { section: "Ver Ranking", description: "Visualize a classificação das equipes", path: "Painel → Selecione turma → Aba 'Resultados'", icon: Trophy },
  { section: "Aprovar Alunos", description: "Aprove cadastros de emails não-institucionais", path: "Menu superior → 'Aprovações'", icon: UserCheck },
  { section: "Analytics Detalhado", description: "Análise aprofundada de KPIs e engajamento", path: "Painel → Selecione turma → Ícone de gráfico", icon: BarChart3 },
  { section: "Gerenciar Equipes", description: "Adicione, edite ou remova equipes", path: "Painel → Selecione turma → Aba 'Equipes'", icon: Users },
  { section: "Configurar Turma", description: "Ajuste parâmetros do jogo e orçamento", path: "Painel → Selecione turma → Aba 'Visão Geral'", icon: Settings },
  { section: "Notas e Avaliação", description: "Avalie o desempenho das equipes", path: "Painel → Selecione turma → Aba 'Notas'", icon: Trophy },
  { section: "Relatório de Acessos", description: "Monitore atividade dos alunos", path: "Painel → Selecione turma → Aba 'Acessos'", icon: Calendar },
];

function HelpModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" data-testid="button-help-modal">
          <HelpCircle className="h-4 w-4" />
          <span className="hidden md:inline">Onde está o quê?</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa do Painel do Professor
          </DialogTitle>
          <DialogDescription>
            Encontre rapidamente as funções que você precisa
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {helpMap.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              data-testid={`help-item-${index}`}
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.section}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                <p className="text-xs text-primary mt-1 flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" />
                  {item.path}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function QuickActionsDropdown() {
  const [, setLocation] = useLocation();

  const quickActions = [
    { label: "Painel do Professor", icon: LayoutDashboard, action: () => setLocation("/professor") },
    { label: "Aprovações Pendentes", icon: UserCheck, action: () => setLocation("/aprovacoes") },
    { label: "Admin Avançado", icon: Settings, action: () => setLocation("/admin") },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size="sm" className="gap-2" data-testid="button-quick-actions">
          <Zap className="h-4 w-4" />
          Ações Rápidas
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Ações Frequentes</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {quickActions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={action.action}
            className="gap-2 cursor-pointer"
            data-testid={`quick-action-${index}`}
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ProfessorLayoutProps {
  children: React.ReactNode;
}

export function ProfessorLayout({ children }: ProfessorLayoutProps) {
  const [location] = useLocation();
  const { toast } = useToast();

  const { data: user } = useQuery<User>({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Not authenticated");
      return res.json();
    },
  });

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      queryClient.clear();
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link href="/professor">
              <div className="flex items-center gap-2 cursor-pointer" data-testid="link-professor-home">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-semibold hidden sm:inline">Simula+</span>
                <Badge variant="secondary" className="hidden sm:flex">Professor</Badge>
              </div>
            </Link>
            
            <Separator orientation="vertical" className="h-6 hidden md:block" />
            
            <nav className="hidden md:flex items-center gap-1">
              {navigationItems.slice(0, 4).map((item) => {
                const isActive = location === item.href || 
                  (item.href === "/professor" && location === "/") ||
                  (item.href !== "/professor" && location.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className="gap-2"
                      data-testid={`nav-${item.title.toLowerCase()}`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                      {item.badge && (
                        <Badge variant={item.badgeVariant || "outline"} className="ml-1 h-5 px-1.5 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
            <QuickActionsDropdown />
            <HelpModal />
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2" data-testid="button-user-menu">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <span className="hidden sm:inline text-sm">{user?.name || "Professor"}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/aprovacoes">
                  <DropdownMenuItem className="gap-2 cursor-pointer" data-testid="menu-aprovacoes">
                    <UserCheck className="h-4 w-4" />
                    Aprovações
                  </DropdownMenuItem>
                </Link>
                <Link href="/admin">
                  <DropdownMenuItem className="gap-2 cursor-pointer" data-testid="menu-admin">
                    <Settings className="h-4 w-4" />
                    Admin Avançado
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive" 
                  onClick={handleLogout}
                  data-testid="menu-logout"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <nav className="md:hidden border-t px-4 py-2 overflow-x-auto">
          <div className="flex items-center gap-1">
            {navigationItems.map((item) => {
              const isActive = location === item.href || 
                (item.href === "/professor" && location === "/");
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-1 text-xs whitespace-nowrap"
                  >
                    <item.icon className="h-3 w-3" />
                    {item.title}
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      
      <main className="container px-4 py-6">
        {children}
      </main>
    </div>
  );
}
