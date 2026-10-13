import {
  LayoutDashboard,
  Lightbulb,
  BarChart3,
  Wallet,
  TrendingUp,
  Building2,
  Target,
  BookOpen,
  Sparkles,
  Tv,
  User,
  Newspaper,
  Lock,
  CheckCircle2,
  CalendarCheck,
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
import { useJourney, stepForPath } from "@/components/round-journey";
import logoImage from "@assets/brand/simula-logo-compacta.svg";

// Menu na ordem do percurso da rodada (out/2026 — round-journey.tsx):
// as etapas numeradas abrem uma depois da outra; as de consulta ficam
// sempre livres.
const roundItems = [
  { title: "Feedback Inteligente", url: "/feedback", icon: Sparkles },
  { title: "Resultados", url: "/analises", icon: BarChart3 },
  { title: "Simula+ News", url: "/news", icon: Newspaper },
  { title: "Análise de Mercado", url: "/mercado", icon: TrendingUp },
  { title: "Ferramentas Estratégicas", url: "/estrategia", icon: Target },
  { title: "Identidade da Empresa", url: "/empresa", icon: Building2 },
  { title: "Mix de Marketing (4 Ps)", url: "/decisoes", icon: Lightbulb },
];

const consultItems = [
  { title: "Fechamento anual", url: "/fechamento-anual", icon: CalendarCheck },
  { title: "Insights de Mercado", url: "/insights", icon: Sparkles },
  { title: "Orçamento", url: "/orcamento", icon: Wallet },
  { title: "Manual do Aluno", url: "/manual", icon: BookOpen },
  { title: "Guia de Mídias", url: "/guia-midias", icon: Tv },
  { title: "Meu Perfil", url: "/perfil", icon: User },
];

type Item = { title: string; url: string; icon: typeof LayoutDashboard };

export function AppSidebar() {
  const [location] = useLocation();
  const { journey } = useJourney();

  const renderItem = (item: Item, opts?: { number?: number; locked?: boolean; done?: boolean }) => {
    const isActive = location === item.url;
    if (opts?.locked) {
      return (
        <SidebarMenuItem key={item.title}>
          <div
            className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm text-white/40 cursor-not-allowed"
            title="Conclua a etapa anterior para abrir"
            data-testid={`link-${item.title.toLowerCase()}-locked`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{item.title}</span>
            <Lock className="h-3.5 w-3.5 shrink-0" />
          </div>
        </SidebarMenuItem>
      );
    }
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          data-active={isActive}
          className="data-[active=true]:bg-sidebar-accent"
        >
          <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
            <item.icon />
            <span className="flex-1">{item.title}</span>
            {opts?.done && <CheckCircle2 className="h-3.5 w-3.5 text-[#7ee2a8]" />}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  // Agrupa os itens da rodada por etapa (1 a 5).
  const grupos: { number: number; label: string; items: Item[]; locked: boolean; done: boolean }[] = [];
  for (const item of roundItems) {
    const step = stepForPath(journey, item.url);
    const number = step?.required ? step.number : 0;
    const label = step?.label ?? item.title;
    let g = grupos.find((x) => x.label === label && x.number === number);
    if (!g) {
      g = { number, label, items: [], locked: !!step?.locked, done: !!step?.done && !!step?.required };
      grupos.push(g);
    }
    g.items.push(item);
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="bg-white rounded-xl px-3 py-2.5 shadow-md">
          <img src={logoImage} alt="Simula+" className="h-8 w-auto" data-testid="img-logo-sidebar" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{renderItem({ title: "Dashboard", url: "/", icon: LayoutDashboard })}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{journey ? `Rodada ${journey.roundNumber} — siga a ordem` : "Rodada"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {journey
                ? grupos.map((g) => (
                    <div key={`${g.number}-${g.label}`} className="mb-1">
                      {g.number > 0 && (
                        <p className="px-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-white/50">
                          {g.number}. {g.label}
                        </p>
                      )}
                      {g.items.map((item) => renderItem(item, { locked: g.locked, done: g.done }))}
                    </div>
                  ))
                : roundItems.map((item) => renderItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Consulta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{consultItems.map((item) => renderItem(item))}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Nível</span>
            <span className="font-semibold text-white">3</span>
          </div>
          <Progress value={65} className="h-2 bg-white/15 [&>div]:bg-[#ffcc00]" />
          <p className="text-xs text-white/70">350 / 500 XP</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
