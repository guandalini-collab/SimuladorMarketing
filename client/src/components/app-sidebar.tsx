import {
  LayoutDashboard,
  Megaphone,
  Lightbulb,
  BarChart3,
  Wallet,
  TrendingUp,
  Building2,
  Target,
  LogOut,
  BookOpen,
  Sparkles,
  Tv,
  User,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Identidade da Empresa",
    url: "/empresa",
    icon: Building2,
  },
  {
    title: "Mix de Marketing (4 Ps)",
    url: "/decisoes",
    icon: Lightbulb,
  },
  {
    title: "Análise de Mercado",
    url: "/mercado",
    icon: TrendingUp,
  },
  {
    title: "Ferramentas Estratégicas",
    url: "/estrategia",
    icon: Target,
  },
  {
    title: "Resultados",
    url: "/analises",
    icon: BarChart3,
  },
  {
    title: "Insights de Mercado",
    url: "/insights",
    icon: Sparkles,
  },
  {
    title: "Orçamento",
    url: "/orcamento",
    icon: Wallet,
  },
  {
    title: "Feedback Inteligente",
    url: "/feedback",
    icon: Sparkles,
  },
  {
    title: "Manual do Aluno",
    url: "/manual",
    icon: BookOpen,
  },
  {
    title: "Guia de Mídias",
    url: "/guia-midias",
    icon: Tv,
  },
  {
    title: "Meu Perfil",
    url: "/perfil",
    icon: User,
  },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();

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

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-accent font-bold text-lg">Simula +</h2>
            <p className="text-xs text-muted-foreground">Simulador de Marketing no Mercado</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={isActive}
                      className="data-[active=true]:bg-sidebar-accent"
                    >
                      <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Nível</span>
              <span className="font-semibold">3</span>
            </div>
            <Progress value={65} className="h-2" />
            <p className="text-xs text-muted-foreground">350 / 500 XP</p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
