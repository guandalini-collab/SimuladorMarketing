import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Building2, FileText, Image, Target, Package, Upload, Link as LinkIcon, CheckCircle2, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, apiUpload, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Team, Class, Round, TeamProduct } from "@shared/schema";

export default function Empresa() {
  const { toast } = useToast();
  
  const [companyName, setCompanyName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoMethod, setLogoMethod] = useState<"upload" | "url">("upload");
  
  // State para configuração de produtos (público-alvo)
  const [productConfigs, setProductConfigs] = useState<Record<string, {
    targetClass: string;
    targetAge: string;
    targetProfile: string;
  }>>({});

  const { data: team, isLoading } = useQuery<Team>({
    queryKey: ["/api/team/current"],
  });

  const { data: currentClass } = useQuery<Class>({
    queryKey: ["/api/classes", team?.classId],
    enabled: !!team?.classId,
  });

  const { data: marketSector } = useQuery<any>({
    queryKey: ["/api/market/sectors", currentClass?.sector],
    enabled: !!currentClass?.sector,
  });

  const { data: audiences } = useQuery<{
    socialClass: any[];
    ageRanges: any[];
    profiles: any[];
  }>({
    queryKey: ["/api/market/audiences"],
  });

  const { data: activeRound } = useQuery<Round>({
    queryKey: ["/api/rounds/active/current"],
    enabled: !!team?.classId,
  });

  const { data: classProducts } = useQuery<any[]>({
    queryKey: ["/api/products/class", team?.classId],
    enabled: !!team?.classId,
  });

  const { data: teamProducts } = useQuery<TeamProduct[]>({
    queryKey: ["/api/team-products", team?.id, activeRound?.id],
    enabled: !!team?.id && !!activeRound?.id,
  });

  useEffect(() => {
    if (team) {
      setCompanyName(team.companyName || "");
      setSlogan(team.slogan || "");
      setLogoUrl(team.logoUrl || "");
    }
  }, [team]);

  // Inicializar productConfigs quando os dados carregarem
  useEffect(() => {
    if (classProducts && classProducts.length > 0) {
      const initialConfigs: Record<string, { targetClass: string; targetAge: string; targetProfile: string }> = {};
      
      classProducts.forEach((product: any) => {
        const existingTeamProduct = teamProducts?.find((tp) => tp.productId === product.id);
        initialConfigs[product.id] = {
          targetClass: existingTeamProduct?.targetAudienceClass || "",
          targetAge: existingTeamProduct?.targetAudienceAge || "",
          targetProfile: existingTeamProduct?.targetAudienceProfile || "",
        };
      });
      
      setProductConfigs(initialConfigs);
    }
  }, [classProducts, teamProducts]);

  // Cleanup blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (logoUrl && logoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(logoUrl);
      }
    };
  }, [logoUrl]);

  const updateIdentityMutation = useMutation({
    mutationFn: async (data: { companyName: string; slogan: string }) => {
      const res = await apiRequest("PATCH", "/api/team/identity", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/current"] });
      toast({
        title: "Identidade atualizada!",
        description: "Nome da empresa e slogan foram salvos com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a identidade",
        variant: "destructive",
      });
    },
  });

  const updateLogoMutation = useMutation({
    mutationFn: async (logoUrl: string) => {
      const res = await apiRequest("POST", "/api/team/logo", { logoUrl });
      return res.json();
    },
    onMutate: async (newLogoUrl) => {
      // Atualiza state local imediatamente para preview otimista
      setLogoUrl(newLogoUrl);
      
      // Cancela refetches em andamento
      await queryClient.cancelQueries({ queryKey: ["/api/team/current"] });
      
      // Snapshot do valor anterior
      const previousTeam = queryClient.getQueryData(["/api/team/current"]);
      
      // Atualiza cache otimisticamente
      if (previousTeam) {
        queryClient.setQueryData(["/api/team/current"], {
          ...previousTeam,
          logoUrl: newLogoUrl,
        });
      }
      
      return { previousTeam };
    },
    onSuccess: () => {
      // Toast aparece SEMPRE após sucesso, independente de refetch
      toast({
        title: "Logo atualizado!",
        description: "A logomarca foi salva com sucesso.",
      });
      setLogoFile(null);
      
      // Invalida para garantir sincronização com servidor
      queryClient.invalidateQueries({ queryKey: ["/api/team/current"] });
    },
    onError: (error: any, _newLogoUrl, context) => {
      // Reverte cache em caso de erro
      if (context?.previousTeam) {
        queryClient.setQueryData(["/api/team/current"], context.previousTeam);
      }
      
      toast({
        title: "Erro ao salvar logo",
        description: error.message || "Não foi possível salvar a logomarca",
        variant: "destructive",
      });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await apiUpload('/api/team/logo/upload', formData);
      return res.json();
    },
    onMutate: async (file) => {
      // Cria preview local temporária do arquivo
      const previewUrl = URL.createObjectURL(file);
      setLogoUrl(previewUrl);
      
      // Cancela refetches em andamento
      await queryClient.cancelQueries({ queryKey: ["/api/team/current"] });
      
      // Snapshot do valor anterior
      const previousTeam = queryClient.getQueryData(["/api/team/current"]);
      
      // Atualiza cache otimisticamente com preview local
      if (previousTeam) {
        queryClient.setQueryData(["/api/team/current"], {
          ...previousTeam,
          logoUrl: previewUrl,
        });
      }
      
      return { previousTeam, previewUrl };
    },
    onSuccess: (_data, _variables, context) => {
      // Revoga preview local blob URL
      if (context?.previewUrl) {
        URL.revokeObjectURL(context.previewUrl);
      }
      
      // Toast aparece SEMPRE após sucesso
      toast({
        title: "Logo atualizado!",
        description: "A logomarca foi enviada e salva com sucesso.",
      });
      setLogoFile(null);
      
      // Invalida para obter URL real do servidor
      queryClient.invalidateQueries({ queryKey: ["/api/team/current"] });
    },
    onError: (error: any, _variables, context) => {
      // Revoga preview local blob URL
      if (context?.previewUrl) {
        URL.revokeObjectURL(context.previewUrl);
      }
      
      // Reverte cache em caso de erro
      if (context?.previousTeam) {
        queryClient.setQueryData(["/api/team/current"], context.previousTeam);
      }
      
      toast({
        title: "Erro ao fazer upload",
        description: error.message || "Não foi possível fazer upload da logomarca",
        variant: "destructive",
      });
    },
  });

  const saveTeamProductMutation = useMutation({
    mutationFn: async (data: {
      teamId: string;
      roundId: string;
      productId: string;
      productName: string;
      productDescription: string;
      targetAudienceClass: string;
      targetAudienceAge: string;
      targetAudienceProfile: string;
      isDraft: boolean;
    }) => {
      const res = await apiRequest("POST", "/api/team-products", data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-products", team?.id, activeRound?.id] });
      toast({
        title: variables.isDraft ? "Rascunho salvo!" : "Produto configurado!",
        description: variables.isDraft 
          ? "Suas alterações foram salvas como rascunho."
          : "A configuração do produto foi finalizada e não poderá mais ser editada nesta rodada.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a configuração do produto",
        variant: "destructive",
      });
    },
  });

  const handleSaveIdentity = () => {
    if (!companyName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome da empresa é obrigatório",
        variant: "destructive",
      });
      return;
    }

    updateIdentityMutation.mutate({ companyName, slogan });
  };

  const handleSaveLogo = () => {
    if (logoMethod === "upload") {
      if (!logoFile) {
        toast({
          title: "Arquivo necessário",
          description: "Selecione um arquivo de imagem para fazer upload",
          variant: "destructive",
        });
        return;
      }
      uploadLogoMutation.mutate(logoFile);
    } else {
      if (!logoUrl.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "A URL do logo é obrigatória",
          variant: "destructive",
        });
        return;
      }
      updateLogoMutation.mutate(logoUrl);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Valida tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }
      // Valida tipo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Apenas imagens são permitidas (JPG, PNG, GIF, WEBP, SVG)",
          variant: "destructive",
        });
        return;
      }
      setLogoFile(file);
    }
  };

  const socialClasses = audiences?.socialClass || [];
  const ageGroups = audiences?.ageRanges || [];
  const profiles = audiences?.profiles || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!team) {
    return (
      <Alert>
        <AlertDescription>
          Você precisa estar em uma equipe para configurar a identidade da empresa.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-accent font-bold">Identidade da Empresa</h1>
        <p className="text-muted-foreground">
          Configure o nome, slogan e logomarca da sua empresa simulada
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Nome da Empresa
            </CardTitle>
            <CardDescription>
              Escolha um nome criativo e memorável para sua empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nome da Empresa</Label>
              <Input
                id="company-name"
                data-testid="input-company-name"
                placeholder="Ex: Tech Innovations Ltda"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {companyName.length}/100 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slogan">Slogan</Label>
              <Textarea
                id="slogan"
                data-testid="input-slogan"
                placeholder="Ex: Inovando o futuro com tecnologia"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {slogan.length}/200 caracteres
              </p>
            </div>

            <Button
              onClick={handleSaveIdentity}
              disabled={updateIdentityMutation.isPending}
              className="w-full"
              data-testid="button-save-identity"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateIdentityMutation.isPending ? "Salvando..." : "Salvar Identidade"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Logomarca
            </CardTitle>
            <CardDescription>
              Envie uma imagem do seu computador ou cole a URL de uma imagem online
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(team?.logoUrl || logoUrl) && (
              <div className="flex justify-center p-4 border rounded-lg bg-muted/30">
                <img
                  src={team?.logoUrl || logoUrl}
                  alt="Logo da empresa"
                  className="max-h-32 object-contain"
                  data-testid="img-logo-preview"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/150?text=Logo";
                  }}
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <Button
                  type="button"
                  variant={logoMethod === "upload" ? "default" : "ghost"}
                  onClick={() => setLogoMethod("upload")}
                  className="flex-1"
                  data-testid="tab-upload"
                  aria-pressed={logoMethod === "upload"}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Arquivo
                </Button>
                <Button
                  type="button"
                  variant={logoMethod === "url" ? "default" : "ghost"}
                  onClick={() => setLogoMethod("url")}
                  className="flex-1"
                  data-testid="tab-url"
                  aria-pressed={logoMethod === "url"}
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  URL Externa
                </Button>
              </div>

              {logoMethod === "upload" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="logo-file">Arquivo de Imagem</Label>
                    <Input
                      id="logo-file"
                      data-testid="input-logo-file"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                      onChange={handleFileChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      {logoFile 
                        ? `Arquivo selecionado: ${logoFile.name} (${(logoFile.size / 1024).toFixed(1)} KB)`
                        : "Selecione uma imagem (JPG, PNG, GIF, WEBP, SVG - máx. 5MB)"}
                    </p>
                  </div>
                </div>
              )}

              {logoMethod === "url" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="logo-url">URL da Logomarca</Label>
                    <Input
                      id="logo-url"
                      data-testid="input-logo-url"
                      type="url"
                      placeholder="https://exemplo.com/logo.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Cole a URL de uma imagem hospedada online
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleSaveLogo}
              disabled={updateLogoMutation.isPending || uploadLogoMutation.isPending}
              className="w-full"
              data-testid="button-save-logo"
            >
              <Save className="h-4 w-4 mr-2" />
              {(updateLogoMutation.isPending || uploadLogoMutation.isPending) ? "Salvando..." : "Salvar Logo"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {classProducts && classProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos e Público-Alvo
            </CardTitle>
            <CardDescription>
              Configure cada um dos 4 produtos individualmente com nome, descrição e público-alvo específico.
              {!activeRound ? (
                <span className="block mt-2 text-amber-600 font-medium">
                  ⚠️ Você pode salvar rascunhos agora, mas só poderá finalizar quando o professor liberar uma rodada de decisão.
                </span>
              ) : (
                <span className="block mt-2 text-blue-600 font-medium">
                  ✓ Rodada {activeRound.roundNumber} ativa - Você pode finalizar as configurações.
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={classProducts[0]?.id} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                {classProducts.map((product: any, index: number) => {
                  const teamProduct = teamProducts?.find((tp) => tp.productId === product.id);
                  const isSubmitted = !!teamProduct?.submittedAt;
                  
                  return (
                    <TabsTrigger 
                      key={product.id} 
                      value={product.id}
                      data-testid={`tab-product-${index + 1}`}
                      className="flex items-center gap-2 text-xs sm:text-sm"
                    >
                      {isSubmitted ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 flex-shrink-0" />
                      )}
                      <span className="truncate">{product.name}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {classProducts.map((product: any, index: number) => {
                const teamProduct = teamProducts?.find((tp) => tp.productId === product.id);
                const isSubmitted = !!teamProduct?.submittedAt;

                return (
                  <TabsContent key={product.id} value={product.id} className="space-y-4 mt-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`class-${product.id}`}>Classe Social *</Label>
                          <Select
                            value={productConfigs[product.id]?.targetClass || ""}
                            disabled={isSubmitted}
                            onValueChange={(value) => {
                              setProductConfigs(prev => ({
                                ...prev,
                                [product.id]: {
                                  ...prev[product.id],
                                  targetClass: value
                                }
                              }));
                            }}
                          >
                            <SelectTrigger id={`class-${product.id}`} data-testid={`select-class-${index + 1}`}>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {socialClasses.map((cls: any) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                  {cls.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`age-${product.id}`}>Faixa Etária *</Label>
                          <Select
                            value={productConfigs[product.id]?.targetAge || ""}
                            disabled={isSubmitted}
                            onValueChange={(value) => {
                              setProductConfigs(prev => ({
                                ...prev,
                                [product.id]: {
                                  ...prev[product.id],
                                  targetAge: value
                                }
                              }));
                            }}
                          >
                            <SelectTrigger id={`age-${product.id}`} data-testid={`select-age-${index + 1}`}>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {ageGroups.map((age: any) => (
                                <SelectItem key={age.id} value={age.id}>
                                  {age.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`profile-${product.id}`}>Perfil *</Label>
                          <Select
                            value={productConfigs[product.id]?.targetProfile || ""}
                            disabled={isSubmitted}
                            onValueChange={(value) => {
                              setProductConfigs(prev => ({
                                ...prev,
                                [product.id]: {
                                  ...prev[product.id],
                                  targetProfile: value
                                }
                              }));
                            }}
                          >
                            <SelectTrigger id={`profile-${product.id}`} data-testid={`select-profile-${index + 1}`}>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {profiles.map((profile: any) => (
                                <SelectItem key={profile.id} value={profile.id}>
                                  {profile.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {isSubmitted ? (
                        <Alert>
                          <CheckCircle2 className="h-4 w-4" />
                          <AlertDescription>
                            Este produto foi finalizado e não pode mais ser editado nesta rodada.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              const config = productConfigs[product.id];
                              const targetClass = config?.targetClass || "";
                              const targetAge = config?.targetAge || "";
                              const targetProfile = config?.targetProfile || "";

                              if (!targetClass || !targetAge || !targetProfile) {
                                toast({
                                  title: "Campos obrigatórios",
                                  description: "Preencha todos os campos antes de salvar",
                                  variant: "destructive",
                                });
                                return;
                              }

                              if (!activeRound) {
                                toast({
                                  title: "Rodada não disponível",
                                  description: "Não é possível salvar sem uma rodada ativa. Aguarde o professor liberar uma rodada.",
                                  variant: "destructive",
                                });
                                return;
                              }

                              saveTeamProductMutation.mutate({
                                teamId: team!.id,
                                roundId: activeRound.id,
                                productId: product.id,
                                productName: product.name,
                                productDescription: product.description || "",
                                targetAudienceClass: targetClass,
                                targetAudienceAge: targetAge,
                                targetAudienceProfile: targetProfile,
                                isDraft: true,
                              });
                            }}
                            variant="outline"
                            disabled={saveTeamProductMutation.isPending || !activeRound}
                            data-testid={`button-save-draft-${index + 1}`}
                            className="flex-1"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Salvar Rascunho
                          </Button>
                          <Button
                            onClick={() => {
                              const config = productConfigs[product.id];
                              const targetClass = config?.targetClass || "";
                              const targetAge = config?.targetAge || "";
                              const targetProfile = config?.targetProfile || "";

                              if (!targetClass || !targetAge || !targetProfile) {
                                toast({
                                  title: "Campos obrigatórios",
                                  description: "Preencha todos os campos antes de finalizar",
                                  variant: "destructive",
                                });
                                return;
                              }

                              if (!activeRound) {
                                toast({
                                  title: "Rodada não disponível",
                                  description: "Não é possível finalizar sem uma rodada ativa. Aguarde o professor liberar uma rodada.",
                                  variant: "destructive",
                                });
                                return;
                              }

                              saveTeamProductMutation.mutate({
                                teamId: team!.id,
                                roundId: activeRound.id,
                                productId: product.id,
                                productName: product.name,
                                productDescription: product.description || "",
                                targetAudienceClass: targetClass,
                                targetAudienceAge: targetAge,
                                targetAudienceProfile: targetProfile,
                                isDraft: false,
                              });
                            }}
                            disabled={saveTeamProductMutation.isPending || !activeRound}
                            data-testid={`button-finalize-${index + 1}`}
                            className="flex-1"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Finalizar
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {team.companyName && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resumo da Identidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {team.logoUrl && (
                <div className="flex flex-col items-center md:items-start">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Logomarca</p>
                  <div className="h-20 w-20 rounded-lg border-2 overflow-hidden bg-muted/30 flex items-center justify-center">
                    <img
                      src={team.logoUrl}
                      alt={`Logo ${team.companyName}`}
                      className="h-full w-full object-contain"
                      data-testid="img-logo-summary"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/80?text=Logo";
                      }}
                    />
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Nome da Empresa</p>
                <p className="text-lg font-semibold" data-testid="text-company-name-preview">
                  {team.companyName || "Não definido"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Slogan</p>
                <p className="text-sm" data-testid="text-slogan-preview">
                  {team.slogan || "Não definido"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Equipe</p>
                <p className="text-sm">{team.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
