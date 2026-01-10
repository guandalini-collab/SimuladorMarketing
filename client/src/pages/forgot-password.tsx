import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, CheckCircle2, KeyRound, Eye, EyeOff, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import logoImage from "@assets/generated_images/Vibrant_marketing_logo_Simula+_e9b50ad9.png";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Estado para recuperação por email
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Estado para recuperação por código
  const [codeEmail, setCodeEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/auth/forgot-password", { email });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao processar solicitação");
      }

      const data = await res.json();
      setEmailSent(true);
      toast({
        title: "Email Enviado!",
        description: data.message || "Verifique sua caixa de entrada e pasta de spam.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "A nova senha e a confirmação devem ser iguais.",
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
    
    setIsRecovering(true);

    try {
      const res = await apiRequest("POST", "/api/auth/recover-with-code", { 
        email: codeEmail,
        recoveryCode,
        newPassword
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Erro ao recuperar senha");
      }

      setRecoverySuccess(true);
      toast({
        title: "Senha Redefinida!",
        description: "Sua senha foi alterada com sucesso. Faça login com a nova senha.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Código de recuperação ou email inválido.",
        variant: "destructive",
      });
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
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

        <Card className="border-2" data-testid="card-forgot-password">
          <CardHeader>
            <CardTitle className="text-2xl" data-testid="text-title">
              Recuperar Senha
            </CardTitle>
            <CardDescription data-testid="text-description">
              Escolha como deseja recuperar sua senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="code" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="code" className="gap-2" data-testid="tab-code">
                  <KeyRound className="h-4 w-4" />
                  Código
                </TabsTrigger>
                <TabsTrigger value="email" className="gap-2" data-testid="tab-email">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
              </TabsList>
              
              {/* Recuperação por Código */}
              <TabsContent value="code">
                {!recoverySuccess ? (
                  <form onSubmit={handleCodeSubmit} className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                      <p className="text-xs text-blue-900 dark:text-blue-100 flex items-start gap-2">
                        <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>
                          Use o código de recuperação que você recebeu ao criar sua conta (formato: XXXX-XXXX-XXXX).
                        </span>
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="code-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="code-email"
                          type="email"
                          placeholder="seu.email@exemplo.com"
                          value={codeEmail}
                          onChange={(e) => setCodeEmail(e.target.value)}
                          className="pl-10 h-11"
                          required
                          disabled={isRecovering}
                          data-testid="input-code-email"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="recovery-code">Código de Recuperação</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="recovery-code"
                          type="text"
                          placeholder="XXXX-XXXX-XXXX"
                          value={recoveryCode}
                          onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                          className="pl-10 h-11 font-mono tracking-wider"
                          required
                          disabled={isRecovering}
                          data-testid="input-recovery-code"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nova Senha</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="h-11 pr-10"
                          required
                          minLength={6}
                          disabled={isRecovering}
                          data-testid="input-new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-11 w-10 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          data-testid="button-toggle-new-password"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-11 pr-10"
                          required
                          minLength={6}
                          disabled={isRecovering}
                          data-testid="input-confirm-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-11 w-10 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          data-testid="button-toggle-confirm-password"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11"
                      disabled={isRecovering}
                      data-testid="button-submit-code"
                    >
                      {isRecovering ? "Recuperando..." : "Redefinir Senha"}
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
                      <CheckCircle2 className="h-16 w-16 text-green-500" data-testid="icon-success-code" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold" data-testid="text-success-code-title">
                        Senha Redefinida!
                      </h3>
                      <p className="text-sm text-muted-foreground" data-testid="text-success-code-message">
                        Sua senha foi alterada com sucesso. Agora você pode fazer login com a nova senha.
                      </p>
                    </div>

                    <Link href="/">
                      <Button className="gap-2" data-testid="link-go-to-login">
                        <ArrowLeft className="h-4 w-4" />
                        Ir para o Login
                      </Button>
                    </Link>
                  </div>
                )}
              </TabsContent>
              
              {/* Recuperação por Email */}
              <TabsContent value="email">
                {!emailSent ? (
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="bg-muted/50 p-3 rounded-md border mb-4">
                      <p className="text-xs text-muted-foreground">
                        Um link de recuperação será enviado para o email cadastrado.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu.email@exemplo.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-11"
                          required
                          disabled={isLoading}
                          data-testid="input-email"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11"
                      disabled={isLoading}
                      data-testid="button-submit-email"
                    >
                      {isLoading ? "Enviando..." : "Enviar Email de Recuperação"}
                    </Button>

                    <div className="text-center">
                      <Link href="/">
                        <Button
                          type="button"
                          variant="ghost"
                          className="gap-2"
                          data-testid="link-back-to-login-email"
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
                      <CheckCircle2 className="h-16 w-16 text-green-500" data-testid="icon-success-email" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold" data-testid="text-success-email-title">
                        Email Enviado!
                      </h3>
                      <p className="text-sm text-muted-foreground" data-testid="text-success-email-message">
                        Um email de recuperação foi enviado para <strong className="text-foreground">{email}</strong>
                      </p>
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                        <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                          Próximos Passos:
                        </p>
                        <ul className="text-xs text-blue-800 dark:text-blue-200 text-left space-y-1">
                          <li>• Verifique sua caixa de entrada</li>
                          <li>• Verifique a pasta de SPAM/Lixo Eletrônico</li>
                          <li>• O link expira em 1 hora</li>
                          <li>• Se não receber, tente novamente</li>
                        </ul>
                      </div>
                    </div>

                    <Link href="/">
                      <Button variant="outline" className="gap-2" data-testid="link-back-to-login-success">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar para o Login
                      </Button>
                    </Link>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-white/70 mt-6">
          Simula+ © 2025 - Simulador de Marketing no Mercado
        </p>
      </div>
    </div>
  );
}
