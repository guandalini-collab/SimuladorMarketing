import { Switch, Route, Redirect, useLocation } from "wouter";
import { apiRequest, queryClient } from "./lib/queryClient";
import { QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfessorLayout } from "@/components/professor-layout";
import { LogOut } from "lucide-react";
import { RodadaZero } from "@/components/rodada-zero";
import type { Team } from "@shared/schema";
import Dashboard from "@/pages/dashboard";
import Campanhas from "@/pages/campanhas";
import Decisoes from "@/pages/decisoes";
import Mercado from "@/pages/mercado";
import Analises from "@/pages/analises";
import InsightsMercado from "@/pages/insights-mercado";
import Orcamento from "@/pages/orcamento";
import Empresa from "@/pages/empresa";
import Estrategia from "@/pages/estrategia";
import FeedbackPage from "@/pages/feedback";
import Manual from "@/pages/manual";
import GuiaMidias from "@/pages/guia-midias";
import Perfil from "@/pages/perfil";
import Login from "@/pages/login";
import Professor from "@/pages/professor";
import ProfessorAnalytics from "@/pages/professor-analytics";
import Admin from "@/pages/admin";
import Aprovacoes from "@/pages/aprovacoes";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import NotFound from "@/pages/not-found";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

function AuthenticatedApp() {
  const [, setLocation] = useLocation();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Not authenticated");
      return res.json();
    },
    retry: false,
  });

  const { data: team } = useQuery<Team>({
    queryKey: ["/api/team/current"],
    enabled: !!user && user.role === "equipe",
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["user"], null);
      queryClient.invalidateQueries();
      setLocation("/");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (user.role === "professor") {
    return (
      <ProfessorLayout>
        <Switch>
          <Route path="/admin" component={Admin} />
          <Route path="/professor" component={Professor} />
          <Route path="/professor/analytics/:classId">
            {(params) => <ProfessorAnalytics classId={params.classId} />}
          </Route>
          <Route path="/aprovacoes" component={Aprovacoes} />
          <Route path="/" component={Professor} />
        </Switch>
      </ProfessorLayout>
    );
  }

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold" data-testid="text-team-name">{team?.name || user.name}</p>
                <p className="text-xs text-muted-foreground">
                  Orçamento: R$ {team?.budget?.toLocaleString('pt-BR') || '0'}
                </p>
              </div>
              <ThemeToggle />
              <Button
                variant="outline"
                size="icon"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-8">
            {team && !team.tutorialCompletedAt ? (
              <RodadaZero team={team} isLeader={team.leaderId === user.id} />
            ) : (
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/empresa" component={Empresa} />
                <Route path="/campanhas" component={Campanhas} />
                <Route path="/decisoes" component={Decisoes} />
                <Route path="/mercado" component={Mercado} />
                <Route path="/estrategia" component={Estrategia} />
                <Route path="/analises" component={Analises} />
                <Route path="/insights" component={InsightsMercado} />
                <Route path="/orcamento" component={Orcamento} />
                <Route path="/feedback" component={FeedbackPage} />
                <Route path="/manual" component={Manual} />
                <Route path="/guia-midias" component={GuiaMidias} />
                <Route path="/perfil" component={Perfil} />
                <Route component={NotFound} />
              </Switch>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route component={AuthenticatedApp} />
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
