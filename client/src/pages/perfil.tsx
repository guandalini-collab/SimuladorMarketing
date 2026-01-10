import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Lock, Shield, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Perfil() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/auth/me");
      if (!res.ok) throw new Error("Falha ao carregar usuário");
      return res.json();
    },
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter no mínimo 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await apiRequest("POST", "/api/auth/change-password", {
        currentPassword,
        newPassword,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao alterar senha");
      }

      toast({
        title: "Senha alterada!",
        description: "Sua senha foi alterada com sucesso.",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao alterar senha",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-accent" data-testid="text-title">
          Meu Perfil
        </h1>
        <p className="text-muted-foreground mt-1" data-testid="text-description">
          Gerencie suas informações pessoais e configurações de segurança
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Pessoais */}
        <Card data-testid="card-personal-info">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>Suas informações de cadastro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome
              </Label>
              <p className="font-medium" data-testid="text-user-name">{user.name}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <p className="font-medium" data-testid="text-user-email">{user.email}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Função
              </Label>
              <p className="font-medium capitalize" data-testid="text-user-role">
                {user.role === "professor" ? "Professor" : "Aluno"}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Status
              </Label>
              <p className="font-medium capitalize" data-testid="text-user-status">
                {user.status === "approved" ? "Aprovado" : user.status === "pending" ? "Pendente" : "Rejeitado"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Alterar Senha */}
        <Card data-testid="card-change-password">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>Altere sua senha de acesso</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={isChangingPassword}
                  data-testid="input-current-password"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isChangingPassword}
                  data-testid="input-new-password"
                  className="h-11"
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isChangingPassword}
                  data-testid="input-confirm-password"
                  className="h-11"
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-semibold"
                disabled={isChangingPassword}
                data-testid="button-change-password"
              >
                {isChangingPassword ? "Alterando..." : "Alterar Senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Dicas de Segurança */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Dicas de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
          <ul className="list-disc list-inside space-y-1">
            <li>Use uma senha forte com no mínimo 8 caracteres</li>
            <li>Combine letras maiúsculas, minúsculas, números e símbolos</li>
            <li>Não compartilhe sua senha com outras pessoas</li>
            <li>Altere sua senha periodicamente para maior segurança</li>
            <li>Não use a mesma senha em diferentes serviços</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
