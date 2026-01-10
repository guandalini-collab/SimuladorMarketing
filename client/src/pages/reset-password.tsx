import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import logoImage from "@assets/generated_images/Vibrant_marketing_logo_Simula+_e9b50ad9.png";

export default function ResetPassword() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast({
        title: "Token inválido",
        description: "O link de recuperação está incompleto ou inválido.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter no mínimo 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/auth/reset-password", {
        token,
        newPassword,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao redefinir senha");
      }

      setResetSuccess(true);
      toast({
        title: "Senha redefinida!",
        description: "Sua senha foi redefinida com sucesso. Você já pode fazer login.",
      });

      setTimeout(() => {
        setLocation("/");
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message || "Ocorreu um erro. Tente novamente ou solicite um novo link.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Link href="/">
              <img 
                src={logoImage} 
                alt="Simula+" 
                className="h-20 w-20 drop-shadow-2xl cursor-pointer hover:scale-105 transition-transform" 
                data-testid="img-logo"
              />
            </Link>
          </div>

          <Card className="border-2" data-testid="card-invalid-token">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-16 w-16 text-destructive" data-testid="icon-error" />
              </div>
              <CardTitle className="text-2xl text-center" data-testid="text-error-title">
                Link Inválido
              </CardTitle>
              <CardDescription className="text-center" data-testid="text-error-description">
                O link de recuperação está incompleto ou inválido.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Certifique-se de usar o link completo enviado por email ou solicite um novo link de recuperação.
              </p>
              <Link href="/forgot-password">
                <Button className="w-full" data-testid="link-request-new">
                  Solicitar Novo Link
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full gap-2" data-testid="link-back-to-login">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <img 
              src={logoImage} 
              alt="Simula+" 
              className="h-20 w-20 drop-shadow-2xl cursor-pointer hover:scale-105 transition-transform" 
              data-testid="img-logo"
            />
          </Link>
        </div>

        <Card className="border-2" data-testid="card-reset-password">
          <CardHeader>
            <CardTitle className="text-2xl" data-testid="text-title">
              {resetSuccess ? "Senha Redefinida!" : "Nova Senha"}
            </CardTitle>
            <CardDescription data-testid="text-description">
              {resetSuccess 
                ? "Sua senha foi alterada com sucesso"
                : "Digite sua nova senha abaixo"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!resetSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                      disabled={isLoading}
                      data-testid="input-new-password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Digite a senha novamente"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                      disabled={isLoading}
                      data-testid="input-confirm-password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-submit"
                >
                  {isLoading ? "Redefinindo..." : "Redefinir Senha"}
                </Button>

                <div className="text-center">
                  <Link href="/">
                    <Button
                      type="button"
                      variant="ghost"
                      className="gap-2"
                      data-testid="link-back-to-login"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Voltar para o Login
                    </Button>
                  </Link>
                </div>
              </form>
            ) : (
              <div className="space-y-6 text-center py-8">
                <div className="flex justify-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500" data-testid="icon-success" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold" data-testid="text-success-title">
                    Senha Redefinida com Sucesso!
                  </h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-success-message">
                    Sua senha foi alterada. Você será redirecionado para a página de login.
                  </p>
                </div>

                <Link href="/">
                  <Button className="gap-2" data-testid="link-go-to-login">
                    Ir para o Login
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-white/70 mt-6">
          Simula+ © 2025 - Simulador de Marketing no Mercado
        </p>
      </div>
    </div>
  );
}
