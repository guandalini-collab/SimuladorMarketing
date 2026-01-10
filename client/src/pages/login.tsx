import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrendingUp, Target, BarChart3, Users, GraduationCap, Lightbulb, AlertTriangle, Eye, EyeOff, Copy, CheckCircle2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import logoImage from "@assets/generated_images/Vibrant_marketing_logo_Simula+_e9b50ad9.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    role: "equipe",
  });
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Estado para mostrar código de recuperação após cadastro
  const [showRecoveryCodeModal, setShowRecoveryCodeModal] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [registeredUserData, setRegisteredUserData] = useState<any>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest("POST", "/api/auth/login", loginData);
      
      if (!res.ok) {
        const errorData = await res.json();
        
        if (errorData.error === "Aguardando aprovação") {
          toast({
            title: "⏳ Aguardando Aprovação",
            description: errorData.message || "Seu cadastro está aguardando aprovação do professor. Você receberá um email quando for aprovado.",
            variant: "default",
          });
          return;
        }
        
        if (errorData.error === "Cadastro rejeitado") {
          toast({
            title: "❌ Cadastro Rejeitado",
            description: errorData.message || "Seu cadastro foi rejeitado. Entre em contato com o professor.",
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "Erro no login",
          description: "Email ou senha incorretos",
          variant: "destructive",
        });
        return;
      }
      
      const user = await res.json();
      
      // Verifica se precisa trocar senha temporária
      if (user.mustChangePassword) {
        setMustChangePassword(true);
        toast({
          title: "Troca de senha obrigatória",
          description: "Por segurança, você deve criar uma nova senha.",
        });
        return;
      }
      
      toast({
        title: "Login realizado!",
        description: `Bem-vindo, ${user.name}!`,
      });
      window.location.href = user.role === "professor" ? "/professor" : "/";
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Email ou senha incorretos",
        variant: "destructive",
      });
    }
  };

  const handleChangeTemporaryPassword = async (e: React.FormEvent) => {
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

    setIsChangingPassword(true);
    try {
      const res = await apiRequest("POST", "/api/auth/change-temporary-password", {
        newPassword,
      });

      if (!res.ok) {
        throw new Error("Erro ao trocar senha");
      }

      const data = await res.json();
      toast({
        title: "Senha alterada!",
        description: data.message || "Senha alterada com sucesso. Faça login novamente.",
      });
      
      // Limpa os campos e fecha o modal
      setMustChangePassword(false);
      setNewPassword("");
      setConfirmPassword("");
      setLoginData({ email: "", password: "" });
      
      // Força logout e recarrega a página
      await apiRequest("POST", "/api/auth/logout", {});
      window.location.reload();
    } catch (error) {
      toast({
        title: "Erro ao alterar senha",
        description: "Não foi possível alterar a senha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest("POST", "/api/auth/register", registerData);
      const data = await res.json();
      
      if (!res.ok) {
        toast({
          title: "Erro no cadastro",
          description: data.error || "Email já cadastrado ou dados inválidos",
          variant: "destructive",
        });
        return;
      }
      
      // Salva o código de recuperação para mostrar no modal
      if (data.recoveryCode) {
        setRecoveryCode(data.recoveryCode);
        setRegisteredUserData(data);
        setShowRecoveryCodeModal(true);
      }
      
      if (data.status === "pending") {
        toast({
          title: "⏳ Cadastro Aguardando Aprovação",
          description: data.message || "Você receberá um email quando o professor aprovar seu cadastro.",
          variant: "default",
        });
        return;
      }
      
      // Se não houver código (fallback), faz login direto
      if (!data.recoveryCode) {
        toast({
          title: "Cadastro realizado!",
          description: `Bem-vindo, ${data.name}!`,
        });
        window.location.href = data.role === "professor" ? "/professor" : "/";
      }
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: "Email já cadastrado ou dados inválidos",
        variant: "destructive",
      });
    }
  };
  
  const handleCopyRecoveryCode = () => {
    navigator.clipboard.writeText(recoveryCode);
    setCodeCopied(true);
    toast({
      title: "Código copiado!",
      description: "O código de recuperação foi copiado para a área de transferência.",
    });
    setTimeout(() => setCodeCopied(false), 3000);
  };
  
  const handleCloseRecoveryModal = () => {
    setShowRecoveryCodeModal(false);
    if (registeredUserData) {
      if (registeredUserData.status === "pending") {
        // Já mostrou toast, apenas limpa
      } else {
        toast({
          title: "Cadastro realizado!",
          description: `Bem-vindo, ${registeredUserData.name}!`,
        });
        window.location.href = registeredUserData.role === "professor" ? "/professor" : "/";
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Hero Section - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 border-4 border-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-40 right-20 w-48 h-48 border-4 border-white rounded-lg rotate-45 animate-pulse delay-75"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 border-4 border-white rounded-full animate-pulse delay-150"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-12">
            <img src={logoImage} alt="Simula+" className="h-24 w-24 drop-shadow-2xl" data-testid="img-logo-hero" />
            <div>
              <h1 className="text-6xl font-bold text-white font-accent drop-shadow-lg" data-testid="text-app-title-hero">Simula +</h1>
              <p className="text-primary-foreground/90 text-base mt-1" data-testid="text-app-subtitle-hero">Simulador de Marketing no Mercado</p>
            </div>
          </div>

          <div className="space-y-6 text-white/95">
            <h2 className="text-3xl font-semibold font-accent leading-tight" data-testid="text-hero-headline">
              Aprenda Marketing na Prática
            </h2>
            <p className="text-lg text-white/80 leading-relaxed max-w-md" data-testid="text-hero-description">
              Simule estratégias reais de marketing, tome decisões estratégicas e veja os resultados em tempo real.
            </p>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="relative z-10 grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20" data-testid="card-feature-kpis">
            <TrendingUp className="h-8 w-8 text-white mb-2" />
            <h3 className="text-white font-semibold mb-1">Análises em Tempo Real</h3>
            <p className="text-white/70 text-sm">19 KPIs automáticos de performance</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20" data-testid="card-feature-decisions">
            <Target className="h-8 w-8 text-white mb-2" />
            <h3 className="text-white font-semibold mb-1">Decisões Estratégicas</h3>
            <p className="text-white/70 text-sm">4 Ps do Marketing + Ferramentas</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20" data-testid="card-feature-insights">
            <BarChart3 className="h-8 w-8 text-white mb-2" />
            <h3 className="text-white font-semibold mb-1">Insights de Mercado</h3>
            <p className="text-white/70 text-sm">12 setores brasileiros simulados</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20" data-testid="card-feature-ai">
            <Lightbulb className="h-8 w-8 text-white mb-2" />
            <h3 className="text-white font-semibold mb-1">Feedback Inteligente</h3>
            <p className="text-white/70 text-sm">Análise educacional personalizada</p>
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <div className="text-center">
              <img src={logoImage} alt="Simula+" className="h-28 w-28 mx-auto mb-4 drop-shadow-xl" data-testid="img-logo-mobile" />
              <h1 className="text-4xl font-bold font-accent mb-2" data-testid="text-app-title-mobile">Simula +</h1>
              <p className="text-muted-foreground" data-testid="text-app-subtitle-mobile">Simulador de Marketing no Mercado</p>
            </div>
          </div>

          <Card className="border-2 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-accent text-center lg:text-left">Bem-vindo de volta!</CardTitle>
              <CardDescription className="text-center lg:text-left">
                Entre com sua conta ou crie uma nova para começar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" data-testid="tab-login" className="font-medium">
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger value="register" data-testid="tab-register" className="font-medium">
                    Cadastrar
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                        data-testid="input-login-email"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          required
                          data-testid="input-login-password"
                          className="h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-11 w-10 hover:bg-transparent"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          data-testid="button-toggle-login-password"
                        >
                          {showLoginPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-11 font-semibold" data-testid="button-login">
                      Entrar
                    </Button>
                    <div className="text-center pt-2">
                      <a 
                        href="/forgot-password" 
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        data-testid="link-forgot-password"
                      >
                        Esqueci minha senha
                      </a>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Nome Completo</Label>
                      <Input
                        id="register-name"
                        placeholder="João da Silva"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        required
                        data-testid="input-register-name"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        required
                        data-testid="input-register-email"
                        className="h-11"
                      />
                      <div className="bg-muted/50 p-3 rounded-md border">
                        <p className="text-xs text-muted-foreground flex items-start gap-2">
                          <GraduationCap className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>
                            Email institucional (@iffarroupilha.edu.br) é aprovado automaticamente. 
                            Outros emails precisam de aprovação do professor.
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          required
                          data-testid="input-register-password"
                          className="h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-11 w-10 hover:bg-transparent"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          data-testid="button-toggle-register-password"
                        >
                          {showRegisterPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-11 font-semibold" data-testid="button-register">
                      Cadastrar
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Mobile Features */}
          <div className="lg:hidden mt-8 grid grid-cols-2 gap-3">
            <div className="bg-card p-3 rounded-lg border text-center">
              <TrendingUp className="h-6 w-6 text-primary mx-auto mb-1" />
              <p className="text-xs font-medium">19 KPIs</p>
            </div>
            <div className="bg-card p-3 rounded-lg border text-center">
              <Target className="h-6 w-6 text-primary mx-auto mb-1" />
              <p className="text-xs font-medium">4 Ps Marketing</p>
            </div>
            <div className="bg-card p-3 rounded-lg border text-center">
              <BarChart3 className="h-6 w-6 text-primary mx-auto mb-1" />
              <p className="text-xs font-medium">12 Setores</p>
            </div>
            <div className="bg-card p-3 rounded-lg border text-center">
              <Lightbulb className="h-6 w-6 text-primary mx-auto mb-1" />
              <p className="text-xs font-medium">Feedback Inteligente</p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={mustChangePassword} onOpenChange={setMustChangePassword}>
        <DialogContent data-testid="dialog-change-password" className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <DialogTitle>Troca de Senha Obrigatória</DialogTitle>
            </div>
            <DialogDescription>
              Por segurança, você deve criar uma nova senha permanente antes de continuar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangeTemporaryPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  data-testid="input-new-password"
                  className="h-11 pr-10"
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
                  required
                  minLength={6}
                  data-testid="input-confirm-password"
                  className="h-11 pr-10"
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
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Após definir sua nova senha, você precisará fazer login novamente.
              </p>
            </div>
            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={isChangingPassword}
              data-testid="button-submit-change-password"
            >
              {isChangingPassword ? "Alterando..." : "Confirmar Nova Senha"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Código de Recuperação */}
      <Dialog open={showRecoveryCodeModal} onOpenChange={() => {}}>
        <DialogContent data-testid="dialog-recovery-code" className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-green-500" />
              <DialogTitle>Guarde seu Código de Recuperação</DialogTitle>
            </div>
            <DialogDescription>
              Este código permite recuperar sua senha caso você a esqueça. Anote ou fotografe - ele não será mostrado novamente!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
              <p className="text-sm text-amber-900 dark:text-amber-100 font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Importante!
              </p>
              <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                <li>• Este código só será exibido agora</li>
                <li>• Use na tela "Esqueci minha senha"</li>
                <li>• Guarde em local seguro</li>
              </ul>
            </div>
            
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
              <p className="text-xs text-muted-foreground mb-2 text-center">Seu código de recuperação:</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-2xl font-mono font-bold tracking-wider text-center" data-testid="text-recovery-code">
                  {recoveryCode}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyRecoveryCode}
                  data-testid="button-copy-recovery-code"
                >
                  {codeCopied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button
              onClick={handleCloseRecoveryModal}
              className="w-full h-11 font-semibold"
              data-testid="button-confirm-recovery-code"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Já anotei o código, continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
