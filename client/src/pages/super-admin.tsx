import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Building2, Rocket, KeyRound } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isAdmin?: boolean;
}

// Pedido do professor (2026-09): "somente crie o admin" — este painel é
// intencionalmente mínimo por enquanto. A ideia é que, no futuro, o
// Simula+ passe a ser vendido como licença de uso para outras
// instituições/professores, e este espaço vai concentrar a administração
// da plataforma como um todo (turmas de outras organizações, cobrança,
// ativação/desativação de licenças) — algo que hoje não existe: o painel
// "Admin Avançado" em /admin é, na verdade, um painel de gestão de USUÁRIOS
// dentro da conta de UM professor, não um painel de dono da plataforma.
export default function SuperAdminPage() {
  const { data: user } = useQuery<User>({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Not authenticated");
      return res.json();
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-[#0a1830] flex items-center justify-center shrink-0">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Painel do Administrador</h1>
          <p className="text-sm text-muted-foreground">Área reservada à administração da plataforma Simula+</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" />
            Sua conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Nome</span>
            <span className="font-medium">{user?.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">E-mail</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Acesso</span>
            <Badge className="gap-1 bg-[#0a1830] text-white hover:bg-[#0a1830]">
              <ShieldCheck className="h-3 w-3" />
              Administrador da plataforma
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Rocket className="h-4 w-4" />
            Em construção
          </CardTitle>
          <CardDescription>
            Este painel foi criado como base para a futura administração comercial do Simula+.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Por enquanto, este espaço só confirma que sua conta tem acesso de administrador. As próximas etapas
            (quando você decidir avançar com elas) devem incluir: gestão de licenças de uso por instituição,
            ativação/desativação de acesso, e uma visão consolidada de todas as turmas cadastradas na plataforma —
            hoje, o painel "Admin Avançado" do professor só enxerga as turmas da própria conta.
          </p>
          <div className="flex items-center gap-2 text-xs pt-2 border-t">
            <Building2 className="h-3.5 w-3.5" />
            Nenhuma funcionalidade de licenciamento foi implementada ainda — este painel é só a fundação.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
