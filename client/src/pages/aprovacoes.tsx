import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Mail, AlertCircle, UserCheck, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PendingUser {
  id: string;
  email: string;
  name: string;
  status: string;
}

export default function Aprovacoes() {
  const { toast } = useToast();

  const { data: pendingUsers, isLoading } = useQuery<PendingUser[]>({
    queryKey: ["/api/users/pending"],
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/users/${userId}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to approve user");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário aprovado!",
        description: "O aluno foi notificado por email e já pode fazer login.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"], exact: false });
    },
    onError: () => {
      toast({
        title: "Erro ao aprovar",
        description: "Não foi possível aprovar este usuário.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/users/${userId}/reject`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reject user");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário rejeitado",
        description: "O cadastro foi rejeitado.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
    },
    onError: () => {
      toast({
        title: "Erro ao rejeitar",
        description: "Não foi possível rejeitar este usuário.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-[#2c2a9e] to-[#6d28d9] text-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Aprovações de Usuários</h1>
              <p className="text-white/75 mt-1">
                Gerencie cadastros de alunos que utilizaram emails não-institucionais
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-6">
      {!pendingUsers || pendingUsers.length === 0 ? (
        <Alert>
          <UserCheck className="h-4 w-4" />
          <AlertDescription>
            Não há usuários aguardando aprovação no momento.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-[#ff8c1a]" />
              Usuários Pendentes ({pendingUsers.length})
            </CardTitle>
            <CardDescription>
              Estes alunos se cadastraram com email não-institucional e precisam de aprovação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-5 border rounded-lg hover-elevate"
                  data-testid={`pending-user-${user.id}`}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-[#fff3d6] text-[#7a5300]">
                        <Mail className="h-3 w-3 mr-1" />
                        Aguardando Aprovação
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Nome Completo:</span>
                        <h3 className="text-base font-bold" data-testid={`text-name-${user.id}`}>{user.name}</h3>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Email:</span>
                        <p className="text-sm" data-testid={`text-email-${user.id}`}>{user.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-[#1aa15c] hover:bg-[#158a4d]"
                      onClick={() => approveMutation.mutate(user.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      data-testid={`button-approve-${user.id}`}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => rejectMutation.mutate(user.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      data-testid={`button-reject-${user.id}`}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Como funciona?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>Emails institucionais</strong> (@iffarroupilha.edu.br): Aprovados automaticamente
          </p>
          <p>
            <strong>Outros emails</strong>: Precisam de aprovação manual do professor
          </p>
          <p>
            <strong>Notificações</strong>: Alunos recebem emails quando o cadastro é aprovado ou rejeitado
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
