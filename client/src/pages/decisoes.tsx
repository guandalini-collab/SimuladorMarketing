import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Save, Package, DollarSign, Store, Megaphone, Lock, AlertTriangle, Send, AlertCircle, CheckCircle2, XCircle, Users, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RecommendationCard } from "@/components/recommendation-card";
import { FormattedMoneyInput } from "@/components/formatted-input";
import { formatarNumeroBR } from "@/lib/formatters";

interface ProductDecisions {
  productQuality: string;
  productFeatures: string;
  brandPositioning: string;
  priceStrategy: string;
  priceValue: number;
  distributionChannels: string[];
  distributionCoverage: string;
  promotionMix: string[];
  promotionIntensity: string;
  promotionBudgets: Record<string, number>;
  submittedAt?: string | null;
}

const createDefaultDecisions = (): ProductDecisions => ({
  productQuality: "medio",
  productFeatures: "basico",
  brandPositioning: "qualidade",
  priceStrategy: "competitivo",
  priceValue: 50,
  distributionChannels: ["varejo"],
  distributionCoverage: "regional",
  promotionMix: [],
  promotionIntensity: "medio",
  promotionBudgets: {},
  submittedAt: null,
});

export default function Decisoes() {
  const { toast } = useToast();
  
  const [productDecisions, setProductDecisions] = useState<Record<string, ProductDecisions>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  interface RoundStatusResponse {
    round: { id: string; roundNumber: number; status: string } | null;
    id?: string;
    roundNumber?: number;
    status?: string;
    decisionsAllowed: boolean;
    reason: "no_team" | "no_active_round" | "round_active";
    message: string;
  }

  const { data: roundStatus, isLoading: isLoadingRound } = useQuery<RoundStatusResponse>({
    queryKey: ["/api/rounds/active/current"],
  });

  // Backward compatibility: extract activeRound from new structure
  const activeRound = roundStatus?.round || (roundStatus?.id ? { 
    id: roundStatus.id, 
    roundNumber: roundStatus.roundNumber!, 
    status: roundStatus.status! 
  } : null);

  const { data: team } = useQuery<any>({
    queryKey: ["/api/team/current"],
  });

  const { data: currentClass } = useQuery<any>({
    queryKey: ["/api/classes/" + team?.classId],
    enabled: !!team?.classId,
  });

  const { data: midias = [] } = useQuery<any[]>({
    queryKey: ["/api/midias"],
  });

  const { data: marketSector } = useQuery<any>({
    queryKey: ["/api/market/sectors/" + currentClass?.sector],
    enabled: !!currentClass?.sector,
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products/class", currentClass?.id],
    enabled: !!currentClass?.id,
  });

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const selectedProduct = products.find((p: any) => p.id === selectedProductId);

  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  // Inicializar decisões para todos os produtos
  useEffect(() => {
    if (products.length > 0) {
      setProductDecisions(prev => {
        const newDecisions = { ...prev };
        products.forEach((product: any) => {
          if (!newDecisions[product.id]) {
            newDecisions[product.id] = createDefaultDecisions();
          }
        });
        return newDecisions;
      });
    }
  }, [products]);

  // Obter decisões do produto atual
  const getCurrentDecisions = (): ProductDecisions => {
    if (!selectedProductId) return createDefaultDecisions();
    return productDecisions[selectedProductId] || createDefaultDecisions();
  };

  // Atualizar decisões do produto atual
  const updateCurrentDecisions = (updates: Partial<ProductDecisions>) => {
    if (!selectedProductId) return;
    setProductDecisions(prev => ({
      ...prev,
      [selectedProductId]: {
        ...getCurrentDecisions(),
        ...updates,
      },
    }));
  };

  // Variáveis derivadas para o produto atual
  const currentProductDecisions = getCurrentDecisions();
  const productQuality = currentProductDecisions.productQuality;
  const productFeatures = currentProductDecisions.productFeatures;
  const brandPositioning = currentProductDecisions.brandPositioning;
  const priceStrategy = currentProductDecisions.priceStrategy;
  const price = currentProductDecisions.priceValue;
  const distributionChannels = currentProductDecisions.distributionChannels;
  const distributionCoverage = currentProductDecisions.distributionCoverage;
  const promotionMix = currentProductDecisions.promotionMix;
  const promotionIntensity = currentProductDecisions.promotionIntensity;
  const promotionBudgets = currentProductDecisions.promotionBudgets;

  // Funções setters individuais para manter compatibilidade
  const setProductQuality = (value: string) => updateCurrentDecisions({ productQuality: value });
  const setProductFeatures = (value: string) => updateCurrentDecisions({ productFeatures: value });
  const setBrandPositioning = (value: string) => updateCurrentDecisions({ brandPositioning: value });
  const setPriceStrategy = (value: string) => updateCurrentDecisions({ priceStrategy: value });
  const setPrice = (value: number) => updateCurrentDecisions({ priceValue: value });
  const setDistributionChannels = (value: string[]) => updateCurrentDecisions({ distributionChannels: value });
  const setDistributionCoverage = (value: string) => updateCurrentDecisions({ distributionCoverage: value });
  const setPromotionMix = (value: string[]) => updateCurrentDecisions({ promotionMix: value });
  const setPromotionIntensity = (value: string) => updateCurrentDecisions({ promotionIntensity: value });
  const setPromotionBudgets = (value: Record<string, number>) => updateCurrentDecisions({ promotionBudgets: value });

  // Buscar decisões de todos os produtos
  const { data: savedProductMixes = [] } = useQuery<any[]>({
    queryKey: ["/api/marketing-mix/team", team?.id, "round", (activeRound as any)?.id, "products"],
    enabled: !!team?.id && !!(activeRound as any)?.id,
  });

  // Buscar status das ferramentas estratégicas para validação obrigatória
  const { data: strategicTools } = useQuery<any>({
    queryKey: ["/api/strategy", (activeRound as any)?.id],
    enabled: !!(activeRound as any)?.id,
  });

  // Buscar recomendações estratégicas automáticas via IA
  const { data: recommendations, isLoading: isLoadingRecommendations } = useQuery<{
    product: string[];
    price: string[];
    place: string[];
    promotion: string[];
    updatedAt: string;
  } | null>({
    queryKey: ["/api/ai/strategic-recommendations/current"],
    enabled: !!activeRound && !!team,
  });

  // Verificar se todas as ferramentas estratégicas foram preenchidas
  const isSwotComplete = strategicTools?.swot && (
    strategicTools.swot.strengths.length > 0 ||
    strategicTools.swot.weaknesses.length > 0 ||
    strategicTools.swot.opportunities.length > 0 ||
    strategicTools.swot.threats.length > 0
  );

  // Porter: Exigir pelo menos UMA nota preenchida (evidência de análise consciente)
  const isPorterComplete = strategicTools?.porter && (
    (strategicTools.porter.rivalryNotes && strategicTools.porter.rivalryNotes.trim().length > 0) ||
    (strategicTools.porter.supplierNotes && strategicTools.porter.supplierNotes.trim().length > 0) ||
    (strategicTools.porter.buyerNotes && strategicTools.porter.buyerNotes.trim().length > 0) ||
    (strategicTools.porter.substitutesNotes && strategicTools.porter.substitutesNotes.trim().length > 0) ||
    (strategicTools.porter.newEntryNotes && strategicTools.porter.newEntryNotes.trim().length > 0)
  );

  const isBcgComplete = strategicTools?.bcg && strategicTools.bcg.length > 0;

  const isPestelComplete = strategicTools?.pestel && (
    strategicTools.pestel.political.length > 0 ||
    strategicTools.pestel.economic.length > 0 ||
    strategicTools.pestel.social.length > 0 ||
    strategicTools.pestel.technological.length > 0 ||
    strategicTools.pestel.environmental.length > 0 ||
    strategicTools.pestel.legal.length > 0
  );

  const allToolsComplete = isSwotComplete && isPorterComplete && isBcgComplete && isPestelComplete;

  // Carregar decisões salvas para todos os produtos
  useEffect(() => {
    if (savedProductMixes.length > 0) {
      setProductDecisions(prev => {
        const newDecisions = { ...prev };
        savedProductMixes.forEach((mix: any) => {
          if (mix.productId) {
            // Normalizar promotionMix: filtrar strings legadas e manter apenas IDs válidos de mídias
            const validMidiaIds = midias.map((m: any) => m.id);
            const normalizedPromotionMix = (mix.promotionMix || []).filter((id: string) => 
              validMidiaIds.includes(id)
            );
            
            // Normalizar promotionBudgets: remover entradas com chaves legadas
            const normalizedBudgets: Record<string, number> = {};
            if (mix.promotionBudgets && typeof mix.promotionBudgets === 'object') {
              Object.entries(mix.promotionBudgets).forEach(([key, value]) => {
                if (validMidiaIds.includes(key)) {
                  normalizedBudgets[key] = value as number;
                }
              });
            }
            
            newDecisions[mix.productId] = {
              productQuality: mix.productQuality || "medio",
              productFeatures: mix.productFeatures || "basico",
              brandPositioning: mix.brandPositioning || "qualidade",
              priceStrategy: mix.priceStrategy || "competitivo",
              priceValue: mix.priceValue ?? 50,
              distributionChannels: mix.distributionChannels || ["varejo"],
              distributionCoverage: mix.distributionCoverage || "regional",
              promotionMix: normalizedPromotionMix,
              promotionIntensity: mix.promotionIntensity || "medio",
              promotionBudgets: normalizedBudgets,
              submittedAt: mix.submittedAt,
            };
          }
        });
        return newDecisions;
      });
    }
  }, [savedProductMixes, midias]);

  // Mutation para salvar rascunho de um produto (pode editar múltiplas vezes)
  const saveDraftMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedProductId) throw new Error("Nenhum produto selecionado");
      if (!team?.id) throw new Error("Equipe não encontrada");
      if (!(activeRound as any)?.id) throw new Error("Rodada ativa não encontrada");
      
      const res = await apiRequest("POST", "/api/marketing-mix/product", {
        ...data,
        teamId: team.id,
        roundId: (activeRound as any).id,
        productId: selectedProductId,
        isDraft: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-mix/team", team?.id, "round", (activeRound as any)?.id, "products"] });
      toast({
        title: "Rascunho salvo!",
        description: `Decisões do produto ${selectedProduct?.name} foram salvas. Você pode continuar editando.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar rascunho",
        description: error.message || "Não foi possível salvar o rascunho",
        variant: "destructive",
      });
    },
  });

  // Mutation para submeter decisão final de todos os produtos (bloqueia edições)
  const submitMutation = useMutation({
    mutationFn: async () => {
      // Filtrar apenas produtos que ainda não foram submetidos
      const productsToSubmit = products.filter((product: any) => {
        const decisions = productDecisions[product.id];
        return !decisions?.submittedAt;
      });

      if (productsToSubmit.length === 0) {
        throw new Error("Todos os produtos já foram submetidos.");
      }

      // Submeter apenas produtos pendentes e coletar erros
      const results = await Promise.allSettled(
        productsToSubmit.map(async (product: any) => {
          try {
            const decisions = productDecisions[product.id] || createDefaultDecisions();
            // Remover submittedAt do payload (não aceito pelo backend)
            const { submittedAt, ...decisionsPayload } = decisions;
            const res = await apiRequest("POST", "/api/marketing-mix/product", {
              teamId: team?.id,
              roundId: (activeRound as any)?.id,
              productId: product.id,
              isDraft: false,
              ...decisionsPayload,
            });
            const data = await res.json();
            return { product, data };
          } catch (error: any) {
            throw new Error(`Produto ${product.name}: ${error.message || 'Erro desconhecido'}`);
          }
        })
      );

      // Verificar se houve falhas e coletar detalhes
      const failures = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];
      if (failures.length > 0) {
        const errorDetails = failures.map(f => f.reason.message).join('; ');
        throw new Error(`Falha ao submeter ${failures.length} produto(s): ${errorDetails}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-mix/team", team?.id, "round", (activeRound as any)?.id, "products"] });
      toast({
        title: "Decisão enviada com sucesso!",
        description: "Todas as decisões dos produtos foram submetidas e não poderão mais ser alteradas.",
      });
      setShowConfirmDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar decisão",
        description: error.message || "Não foi possível enviar a decisão final",
        variant: "destructive",
      });
      setShowConfirmDialog(false);
    },
  });

  const handleChannelToggle = (channel: string) => {
    const newChannels = distributionChannels.includes(channel)
      ? distributionChannels.filter((c) => c !== channel)
      : [...distributionChannels, channel];
    setDistributionChannels(newChannels);
  };

  const handlePromotionToggle = (promo: string) => {
    const newPromotion = promotionMix.includes(promo)
      ? promotionMix.filter((p) => p !== promo)
      : [...promotionMix, promo];
    setPromotionMix(newPromotion);
  };

  const handleSaveDraft = () => {
    saveDraftMutation.mutate({
      productQuality,
      productFeatures,
      brandPositioning,
      priceStrategy,
      priceValue: price,
      distributionChannels,
      distributionCoverage,
      promotionMix,
      promotionIntensity,
      promotionBudgets,
    });
  };

  const handleSubmitDecision = async () => {
    // Validar ferramentas estratégicas
    if (!allToolsComplete) {
      toast({
        title: "Ferramentas estratégicas incompletas",
        description: "Complete todas as ferramentas estratégicas (SWOT, Porter, BCG e PESTEL) antes de submeter suas decisões.",
        variant: "destructive",
      });
      return;
    }

    // Bloquear se o produto atual já foi submetido
    if (currentProductDecisions.submittedAt) {
      toast({
        title: "Produto já submetido",
        description: `As decisões do produto ${selectedProduct?.name} já foram enviadas. Navegue para um produto pendente para continuar.`,
        variant: "destructive",
      });
      return;
    }

    // Bloquear se todos os produtos já foram submetidos
    const allSubmitted = products.every((product: any) => 
      productDecisions[product.id]?.submittedAt
    );
    if (allSubmitted) {
      toast({
        title: "Decisões já submetidas",
        description: "Todas as decisões dos produtos já foram enviadas e não podem ser alteradas.",
        variant: "destructive",
      });
      return;
    }

    // Salvar drafts de TODOS os produtos pendentes antes da submissão final
    try {
      const productsToSave = products.filter((product: any) => 
        !productDecisions[product.id]?.submittedAt
      );

      for (const product of productsToSave) {
        const decisions = productDecisions[product.id] || createDefaultDecisions();
        const { submittedAt, ...decisionsPayload } = decisions;
        
        await apiRequest("POST", "/api/marketing-mix/product", {
          teamId: team?.id,
          roundId: (activeRound as any)?.id,
          productId: product.id,
          isDraft: true,
          ...decisionsPayload,
        });
      }

      // Invalidar queries para recarregar dados salvos
      await queryClient.invalidateQueries({ 
        queryKey: ["/api/marketing-mix/team", team?.id, "round", (activeRound as any)?.id, "products"] 
      });

      // Abrir dialog de confirmação
      setShowConfirmDialog(true);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar rascunhos",
        description: error.message || "Não foi possível salvar todos os rascunhos. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmSubmit = () => {
    submitMutation.mutate();
  };

  const handlePromotionBudgetChange = (promo: string, value: number) => {
    const newBudgets = { ...promotionBudgets, [promo]: value };
    setPromotionBudgets(newBudgets);
  };

  const totalPromotionBudget = Object.values(promotionBudgets).reduce((sum, val) => sum + val, 0);

  // Use decisionsAllowed from backend as source of truth
  // Only lock if we have data AND decisions are not allowed
  // During loading, don't show locked state yet
  const isLocked = !isLoadingRound && roundStatus && !roundStatus.decisionsAllowed;
  const lockReason = roundStatus?.reason;
  const lockMessage = roundStatus?.message;
  
  // Derivar isSubmitted diretamente da fonte autoritativa (savedProductMixes)
  // para evitar lag entre troca de produto e atualização do estado local
  const savedMix = savedProductMixes.find((mix: any) => mix.productId === selectedProductId);
  const isSubmitted = !!savedMix?.submittedAt || !!currentProductDecisions.submittedAt;
  const canEdit = !isLocked && !isSubmitted;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-20 w-32 h-32 border-4 border-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 left-20 w-40 h-40 border-4 border-white rounded-lg rotate-45 animate-pulse delay-75"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Megaphone className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                Mix de Marketing
              </h1>
              <p className="text-white/80 text-lg mt-1">
                Configure as decisões estratégicas dos 4 Ps
              </p>
            </div>
          </div>
          {team && (
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <Users className="h-4 w-4 text-white" />
                <span className="text-sm text-white font-medium">{team.name}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <DollarSign className="h-4 w-4 text-white" />
                <span className="text-sm text-white font-medium">R$ {team.budget?.toLocaleString('pt-BR') || '0'}</span>
              </div>
              {activeRound && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Activity className="h-4 w-4 text-white" />
                  <span className="text-sm text-white font-medium">Rodada {(activeRound as any).roundNumber}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isLocked && (
        <Alert data-testid="alert-locked" className={lockReason === "no_team" ? "border-amber-500/50 bg-amber-50 dark:bg-amber-950/20" : ""}>
          <Lock className={`h-4 w-4 ${lockReason === "no_team" ? "text-amber-600" : ""}`} />
          <AlertDescription className={lockReason === "no_team" ? "text-amber-800 dark:text-amber-200" : ""}>
            {lockMessage || "Sem rodada ativa. Aguarde o professor iniciar uma rodada."}
          </AlertDescription>
        </Alert>
      )}

      {isSubmitted && (
        <Alert data-testid="alert-submitted" className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
          <Lock className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Decisão já enviada!</strong> Suas decisões de Mix de Marketing para o produto {selectedProduct?.name} foram submetidas com sucesso. 
            Não é possível fazer alterações até a próxima rodada.
            {currentProductDecisions.submittedAt && (
              <span className="block text-sm mt-1">
                Enviado em: {new Date(currentProductDecisions.submittedAt).toLocaleString('pt-BR')}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Selecione o Produto
            </CardTitle>
            <CardDescription>Defina o Mix de Marketing para cada produto individualmente</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedProductId || undefined} onValueChange={setSelectedProductId} className="w-full">
              <TabsList className="grid w-full h-auto p-1" style={{ gridTemplateColumns: `repeat(${products.length}, 1fr)` }}>
                {products.map((product: any) => (
                  <TabsTrigger
                    key={product.id}
                    value={product.id}
                    data-testid={`tab-product-${product.id}`}
                    className="flex flex-col items-center gap-1 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Package className="h-4 w-4" />
                    <span className="text-xs font-medium text-center">{product.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {selectedProduct && (
        <Alert className="bg-primary/5 border-primary/20">
          <Package className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <strong>Produto Selecionado:</strong> {selectedProduct.name}
            {isSubmitted && <span className="ml-2 text-green-600 dark:text-green-400">(Decisão Submetida)</span>}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="produto" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-slate-100 dark:bg-slate-900">
          <TabsTrigger 
            value="produto" 
            data-testid="tab-produto"
            className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-950"
          >
            <Package className="h-5 w-5" />
            <span className="font-semibold">Produto</span>
          </TabsTrigger>
          <TabsTrigger 
            value="preco" 
            data-testid="tab-preco"
            className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-950"
          >
            <DollarSign className="h-5 w-5" />
            <span className="font-semibold">Preço</span>
          </TabsTrigger>
          <TabsTrigger 
            value="praca" 
            data-testid="tab-praca"
            className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-950"
          >
            <Store className="h-5 w-5" />
            <span className="font-semibold">Praça</span>
          </TabsTrigger>
          <TabsTrigger 
            value="promocao" 
            data-testid="tab-promocao"
            className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-950"
          >
            <Megaphone className="h-5 w-5" />
            <span className="font-semibold">Promoção</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="produto" className="space-y-6 mt-6">
          <RecommendationCard
            title="Orientações Estratégicas - Produto"
            recommendations={recommendations?.product}
            isLoading={isLoadingRecommendations}
            emptyMessage="Nenhuma recomendação estratégica disponível"
            testId="card-recommendation-product"
          />

          {marketSector && (
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                <strong>Informações do Setor:</strong> {marketSector.name} - Margem média de {marketSector.averageMargin}%. 
                {marketSector.categories && marketSector.categories.length > 0 && (
                  <span> Preço médio de produtos: R$ {marketSector.categories[0].averagePrice?.toLocaleString('pt-BR')}.</span>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-2 border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-950">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Qualidade do Produto</CardTitle>
                    <CardDescription className="text-sm">Nível de qualidade oferecido</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <RadioGroup value={productQuality} onValueChange={setProductQuality} disabled={!canEdit}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate">
                      <RadioGroupItem value="basico" id="qual-basico" data-testid="radio-qual-basico" />
                      <Label htmlFor="qual-basico" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-semibold">Básico</p>
                          <p className="text-sm text-muted-foreground">
                            Funcional, atende necessidades essenciais
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate">
                      <RadioGroupItem value="medio" id="qual-medio" data-testid="radio-qual-medio" />
                      <Label htmlFor="qual-medio" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-semibold">Médio</p>
                          <p className="text-sm text-muted-foreground">
                            Boa qualidade, custo-benefício equilibrado
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate">
                      <RadioGroupItem value="premium" id="qual-premium" data-testid="radio-qual-premium" />
                      <Label htmlFor="qual-premium" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-semibold">Premium</p>
                          <p className="text-sm text-muted-foreground">
                            Qualidade superior, diferenciação máxima
                          </p>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-white dark:from-cyan-950/30 dark:to-slate-950">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Características do Produto</CardTitle>
                    <CardDescription className="text-sm">Nível de recursos oferecidos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <RadioGroup value={productFeatures} onValueChange={setProductFeatures} disabled={!canEdit}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate">
                      <RadioGroupItem value="basico" id="feat-basico" data-testid="radio-feat-basico" />
                      <Label htmlFor="feat-basico" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-semibold">Básico</p>
                          <p className="text-sm text-muted-foreground">
                            Recursos essenciais apenas
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate">
                      <RadioGroupItem value="intermediario" id="feat-inter" data-testid="radio-feat-inter" />
                      <Label htmlFor="feat-inter" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-semibold">Intermediário</p>
                          <p className="text-sm text-muted-foreground">
                            Recursos principais + extras
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate">
                      <RadioGroupItem value="completo" id="feat-completo" data-testid="radio-feat-completo" />
                      <Label htmlFor="feat-completo" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-semibold">Completo</p>
                          <p className="text-sm text-muted-foreground">
                            Todos os recursos possíveis
                          </p>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-2 border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white dark:from-purple-950/30 dark:to-slate-950">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Posicionamento de Marca</CardTitle>
                    <CardDescription className="text-sm">Como você quer que sua marca seja percebida</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <RadioGroup value={brandPositioning} onValueChange={setBrandPositioning} disabled={!canEdit}>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate">
                      <RadioGroupItem value="qualidade" id="pos-qual" data-testid="radio-pos-qual" />
                      <Label htmlFor="pos-qual" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-semibold">Qualidade</p>
                          <p className="text-sm text-muted-foreground">Líder em qualidade</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate">
                      <RadioGroupItem value="preco" id="pos-preco" data-testid="radio-pos-preco" />
                      <Label htmlFor="pos-preco" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-semibold">Preço</p>
                          <p className="text-sm text-muted-foreground">Melhor custo-benefício</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate">
                      <RadioGroupItem value="inovacao" id="pos-inov" data-testid="radio-pos-inov" />
                      <Label htmlFor="pos-inov" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-semibold">Inovação</p>
                          <p className="text-sm text-muted-foreground">Pioneiro em tecnologia</p>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preco" className="space-y-6 mt-6">
          <RecommendationCard
            title="Orientações Estratégicas - Preço"
            recommendations={recommendations?.price}
            isLoading={isLoadingRecommendations}
            emptyMessage="Nenhuma recomendação estratégica disponível"
            testId="card-recommendation-price"
          />

          {marketSector && (
            <Alert>
              <DollarSign className="h-4 w-4" />
              <AlertDescription>
                <strong>Margem do Setor:</strong> {marketSector.averageMargin}% em média. 
                Nível de concorrência: <strong>{currentClass?.competitionLevel || marketSector.competitionLevel}</strong> - 
                {currentClass?.competitionLevel === 'alta' && ' margens mais apertadas, foco em volume.'}
                {currentClass?.competitionLevel === 'media' && ' margem moderada, balanceie preço e qualidade.'}
                {currentClass?.competitionLevel === 'baixa' && ' maior flexibilidade de preço.'}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Estratégia de Precificação</CardTitle>
                <CardDescription>Abordagem para definir preços</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={priceStrategy} onValueChange={setPriceStrategy} disabled={!canEdit}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate">
                      <RadioGroupItem value="penetracao" id="preco-pen" data-testid="radio-preco-pen" />
                      <Label htmlFor="preco-pen" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-semibold">Penetração</p>
                          <p className="text-sm text-muted-foreground">
                            Preço baixo para ganhar mercado rapidamente
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate">
                      <RadioGroupItem value="competitivo" id="preco-comp" data-testid="radio-preco-comp" />
                      <Label htmlFor="preco-comp" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-semibold">Competitivo</p>
                          <p className="text-sm text-muted-foreground">
                            Preço similar aos concorrentes
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate">
                      <RadioGroupItem value="skimming" id="preco-skim" data-testid="radio-preco-skim" />
                      <Label htmlFor="preco-skim" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-semibold">Desnatamento (Skimming)</p>
                          <p className="text-sm text-muted-foreground">
                            Preço alto para maximizar margem
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate">
                      <RadioGroupItem value="valor" id="preco-valor" data-testid="radio-preco-valor" />
                      <Label htmlFor="preco-valor" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-semibold">Baseado em Valor</p>
                          <p className="text-sm text-muted-foreground">
                            Preço baseado no valor percebido
                          </p>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-white dark:from-cyan-950/30 dark:to-slate-950">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Valor do Preço</CardTitle>
                    <CardDescription>Defina o preço unitário do produto</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-3">
                  <Label htmlFor="price-input" className="text-base font-semibold">
                    Preço Unitário
                  </Label>
                  <FormattedMoneyInput
                    id="price-input"
                    value={price}
                    onChange={setPrice}
                    disabled={!canEdit}
                    placeholder="50"
                    testId="input-price"
                  />
                  <p className="text-sm text-muted-foreground">
                    Digite o preço que você deseja cobrar por unidade do produto
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-sm">
                    <strong>Posicionamento:</strong> Seu preço de R$ {price.toFixed(2)} posiciona o produto na faixa{" "}
                    {price < 50 ? "econômica" : price < 100 ? "média" : "premium"}.
                  </p>
                  <p className="text-sm">
                    <strong>Margem estimada:</strong>{" "}
                    {priceStrategy === "penetracao" ? "Baixa (15-25%)" : 
                     priceStrategy === "competitivo" ? "Média (25-40%)" :
                     priceStrategy === "skimming" ? "Alta (40-60%)" :
                     "Variável (20-50%)"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="praca" className="space-y-6 mt-6">
          <RecommendationCard
            title="Orientações Estratégicas - Praça"
            recommendations={recommendations?.place}
            isLoading={isLoadingRecommendations}
            emptyMessage="Nenhuma recomendação estratégica disponível"
            testId="card-recommendation-place"
          />

          {currentClass?.businessType && (
            <Alert>
              <Store className="h-4 w-4" />
              <AlertDescription>
                <strong>Tipo de Negócio:</strong> {currentClass.businessType}. 
                {currentClass.businessType === 'B2C' && ' Recomendado: Varejo, E-commerce, Marketplaces.'}
                {currentClass.businessType === 'B2B' && ' Recomendado: Venda Direta, Atacado, Representantes.'}
                {currentClass.businessType === 'Híbrido' && ' Combine canais B2B e B2C para maximizar alcance.'}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Canais de Distribuição</CardTitle>
                <CardDescription>Selecione os canais onde o produto será vendido</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { value: "varejo", label: "Varejo Físico", desc: "Lojas físicas tradicionais" },
                    { value: "ecommerce", label: "E-commerce Próprio", desc: "Loja online própria" },
                    { value: "marketplace", label: "Marketplaces", desc: "Amazon, Mercado Livre, etc" },
                    { value: "atacado", label: "Atacado", desc: "Distribuidores e atacadistas" },
                    { value: "franquias", label: "Franquias", desc: "Rede de franquias" },
                    { value: "direto", label: "Venda Direta", desc: "Vendedores e consultores" },
                  ].map((channel) => (
                    <div key={channel.value} className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate">
                      <Checkbox
                        id={channel.value}
                        checked={distributionChannels.includes(channel.value)}
                        onCheckedChange={() => handleChannelToggle(channel.value)}
                        disabled={!canEdit}
                        data-testid={`checkbox-${channel.value}`}
                      />
                      <Label htmlFor={channel.value} className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-semibold">{channel.label}</p>
                          <p className="text-sm text-muted-foreground">{channel.desc}</p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cobertura de Distribuição</CardTitle>
                <CardDescription>Amplitude geográfica da distribuição</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={distributionCoverage} onValueChange={setDistributionCoverage} disabled={!canEdit}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate">
                      <RadioGroupItem value="local" id="cob-local" data-testid="radio-cob-local" />
                      <Label htmlFor="cob-local" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-semibold">Local</p>
                          <p className="text-sm text-muted-foreground">
                            Cidade ou região específica
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate">
                      <RadioGroupItem value="regional" id="cob-regional" data-testid="radio-cob-regional" />
                      <Label htmlFor="cob-regional" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-semibold">Regional</p>
                          <p className="text-sm text-muted-foreground">
                            Múltiplas cidades/estados
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate">
                      <RadioGroupItem value="nacional" id="cob-nacional" data-testid="radio-cob-nacional" />
                      <Label htmlFor="cob-nacional" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-semibold">Nacional</p>
                          <p className="text-sm text-muted-foreground">
                            Todo o país
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover-elevate">
                      <RadioGroupItem value="internacional" id="cob-inter" data-testid="radio-cob-inter" />
                      <Label htmlFor="cob-inter" className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-semibold">Internacional</p>
                          <p className="text-sm text-muted-foreground">
                            Exportação para outros países
                          </p>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
                <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm">
                    <strong className="text-primary">Canais selecionados:</strong>{" "}
                    {distributionChannels.length > 0
                      ? distributionChannels.join(", ")
                      : "Nenhum canal selecionado"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="promocao" className="space-y-6 mt-6">
          <RecommendationCard
            title="Orientações Estratégicas - Promoção"
            recommendations={recommendations?.promotion}
            isLoading={isLoadingRecommendations}
            emptyMessage="Nenhuma recomendação estratégica disponível"
            testId="card-recommendation-promotion"
          />

          {currentClass?.competitionLevel && (
            <Alert>
              <Megaphone className="h-4 w-4" />
              <AlertDescription>
                <strong>Concorrência {currentClass.competitionLevel}:</strong> 
                {currentClass.competitionLevel === 'alta' && ' Necessário alto investimento em promoção para se destacar.'}
                {currentClass.competitionLevel === 'media' && ' Investimento balanceado em comunicação.'}
                {currentClass.competitionLevel === 'baixa' && ' Menor pressão promocional, foco em construção de marca.'}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Catálogo de Mídias</CardTitle>
                <CardDescription>Selecione as mídias promocionais para sua campanha</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {midias.length === 0 && (
                    <p className="text-sm text-muted-foreground">Carregando catálogo de mídias...</p>
                  )}
                  {Object.entries(
                    midias.reduce((acc: any, midia: any) => {
                      if (!acc[midia.categoria]) acc[midia.categoria] = [];
                      acc[midia.categoria].push(midia);
                      return acc;
                    }, {})
                  ).map(([categoria, categoriaMidias]: [string, any]) => (
                    <div key={categoria} className="space-y-3">
                      <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground border-b pb-1">
                        {categoria}
                      </h4>
                      {categoriaMidias.map((midia: any) => (
                        <div key={midia.id} className="space-y-2">
                          <div className="flex items-start space-x-3 p-3 border rounded-lg hover-elevate">
                            <Checkbox
                              id={midia.id}
                              checked={promotionMix.includes(midia.id)}
                              onCheckedChange={() => handlePromotionToggle(midia.id)}
                              disabled={!canEdit}
                              data-testid={`checkbox-${midia.id}`}
                            />
                            <Label htmlFor={midia.id} className="flex-1 cursor-pointer">
                              <div>
                                <p className="font-semibold">{midia.formato}</p>
                                {midia.especificacao && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{midia.especificacao}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                  <span>Preço unitário: R$ {(midia.custoUnitarioMinimo || 0).toFixed(2)}</span>
                                  <span>•</span>
                                  <span className="text-amber-600 font-medium">Investimento mínimo: R$ {(midia.valorMinimo || midia.custoUnitarioMinimo || 0).toFixed(2)}</span>
                                </div>
                              </div>
                            </Label>
                          </div>
                          {promotionMix.includes(midia.id) && (
                            <div className="ml-8 flex flex-col gap-2 p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`budget-${midia.id}`} className="text-sm font-medium whitespace-nowrap">
                                  Investimento:
                                </Label>
                                <FormattedMoneyInput
                                  id={`budget-${midia.id}`}
                                  value={promotionBudgets[midia.id] || 0}
                                  onChange={(value) => handlePromotionBudgetChange(midia.id, value)}
                                  disabled={!canEdit}
                                  placeholder="0"
                                  className="max-w-xs"
                                  testId={`input-budget-${midia.id}`}
                                />
                              </div>
                              {promotionBudgets[midia.id] > 0 && promotionBudgets[midia.id] < (midia.valorMinimo || midia.custoUnitarioMinimo || 0) && (
                                <Alert variant="destructive" className="py-2">
                                  <AlertCircle className="h-3 w-3" />
                                  <AlertDescription className="text-xs">
                                    Valor abaixo do mínimo de R$ {(midia.valorMinimo || midia.custoUnitarioMinimo || 0).toFixed(2)}
                                  </AlertDescription>
                                </Alert>
                              )}
                              {promotionBudgets[midia.id] >= (midia.valorMinimo || midia.custoUnitarioMinimo || 0) && (
                                <p className="text-xs text-muted-foreground">
                                  Quantidade estimada: {Math.floor(promotionBudgets[midia.id] / (midia.custoUnitarioMinimo || 1))} unidades
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo do Investimento</CardTitle>
                <CardDescription>Total investido em ferramentas promocionais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">Total Investido em Promoção</p>
                  <p className="text-3xl font-bold text-primary" data-testid="text-total-promotion-budget">
                    R$ {totalPromotionBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Orçamento Disponível:</strong> R$ {(team?.budget || 0).toLocaleString('pt-BR')}
                    <br />
                    <span className="text-sm text-muted-foreground">
                      Você pode investir livremente sem obrigação de usar 100% do orçamento. 
                      Os valores não gastos ficam disponíveis para as próximas rodadas.
                    </span>
                  </AlertDescription>
                </Alert>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Ferramentas Selecionadas ({promotionMix.length})</p>
                  <p className="text-xs text-muted-foreground">
                    {promotionMix.length > 0
                      ? promotionMix.join(", ")
                      : "Nenhuma ferramenta selecionada"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {!isSubmitted && activeRound && (
        <Card className="border-2" data-testid="card-strategic-tools-status">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Ferramentas Estratégicas Obrigatórias
            </CardTitle>
            <CardDescription>
              Você deve preencher todas as ferramentas estratégicas antes de enviar sua decisão final.
              Acesse a aba "Estratégia" para completar cada análise.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`flex items-center gap-2 p-3 rounded-lg ${isSwotComplete ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`} data-testid={`status-swot-${isSwotComplete ? 'complete' : 'incomplete'}`}>
                {isSwotComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <p className="font-medium">Análise SWOT</p>
                  <p className="text-xs text-muted-foreground">
                    {isSwotComplete ? 'Completa' : 'Preencha pelo menos um item'}
                  </p>
                </div>
              </div>

              <div className={`flex items-center gap-2 p-3 rounded-lg ${isPorterComplete ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`} data-testid={`status-porter-${isPorterComplete ? 'complete' : 'incomplete'}`}>
                {isPorterComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <p className="font-medium">5 Forças de Porter</p>
                  <p className="text-xs text-muted-foreground">
                    {isPorterComplete ? 'Completa' : 'Adicione justificativas para as forças'}
                  </p>
                </div>
              </div>

              <div className={`flex items-center gap-2 p-3 rounded-lg ${isBcgComplete ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`} data-testid={`status-bcg-${isBcgComplete ? 'complete' : 'incomplete'}`}>
                {isBcgComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <p className="font-medium">Matriz BCG</p>
                  <p className="text-xs text-muted-foreground">
                    {isBcgComplete ? 'Completa' : 'Adicione pelo menos um produto'}
                  </p>
                </div>
              </div>

              <div className={`flex items-center gap-2 p-3 rounded-lg ${isPestelComplete ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`} data-testid={`status-pestel-${isPestelComplete ? 'complete' : 'incomplete'}`}>
                {isPestelComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <p className="font-medium">Análise PESTEL</p>
                  <p className="text-xs text-muted-foreground">
                    {isPestelComplete ? 'Completa' : 'Preencha pelo menos um fator'}
                  </p>
                </div>
              </div>
            </div>

            {!allToolsComplete && (
              <Alert className="mt-4" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Complete todas as ferramentas estratégicas antes de enviar sua decisão.
                  As ferramentas faltantes estão marcadas em vermelho acima.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button 
          size="lg" 
          variant="outline"
          onClick={handleSaveDraft} 
          disabled={!canEdit || saveDraftMutation.isPending} 
          data-testid="button-save-draft"
        >
          <Save className="h-4 w-4 mr-2" />
          {saveDraftMutation.isPending ? "Salvando..." : "Salvar Rascunho"}
        </Button>
        
        <Button 
          size="lg" 
          onClick={handleSubmitDecision} 
          disabled={!canEdit || saveDraftMutation.isPending || submitMutation.isPending || !allToolsComplete} 
          data-testid="button-submit-decision"
        >
          <Send className="h-4 w-4 mr-2" />
          {submitMutation.isPending ? "Enviando..." : "Enviar Decisão da Equipe"}
        </Button>
      </div>

      {!isLocked && !isSubmitted && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Dica:</strong> Você pode salvar seu rascunho quantas vezes quiser. 
            Quando estiver satisfeito com suas decisões, clique em "Enviar Decisão da Equipe" 
            para submeter oficialmente. Após o envio, não será possível fazer alterações.
          </AlertDescription>
        </Alert>
      )}

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirmar Envio de Decisão Final
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                <strong>Atenção!</strong> Você está prestes a enviar sua decisão FINAL de Marketing Mix (4 Ps).
              </p>
              <p className="text-destructive font-semibold">
                ⚠️ Após o envio, NÃO será possível modificar esta decisão até a próxima rodada!
              </p>
              <p>
                Certifique-se de que todas as informações estão corretas antes de confirmar.
                Seu professor e você receberão um email de confirmação.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-confirm">Revisar Decisão</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit} data-testid="button-confirm-submit">
              Confirmar e Enviar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
