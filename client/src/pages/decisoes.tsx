import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Package, DollarSign, Store, Megaphone, Lock, AlertTriangle, Send, AlertCircle, CheckCircle2, XCircle, Users, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "wouter";
import { Clock, ArrowLeft } from "lucide-react";
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
import { formatarNumeroBR } from "@/lib/formatters";
import { ChoiceCards, ScaleSelector, ToggleTiles, PriceSlider, MediaTile, BudgetMeter, type ChoiceOption } from "@/components/decision-choices";
import {
  Award, Tag, Lightbulb, ShoppingCart, Boxes, Warehouse, Network, Handshake,
  MapPin, Map as MapIcon, Flag, Globe,
  TrendingDown, Scale, Crown, Gem, Volume, Volume1, Volume2, Megaphone as MegaphoneIcon,
} from "lucide-react";

// Opções das decisões de Produto e Praça. Os "value" são exatamente os
// valores já aceitos pelo servidor/motor (shared/schema.ts → marketing_mix);
// os testId são os mesmos data-testid dos controles anteriores.
const QUALITY_OPTIONS: ChoiceOption[] = [
  { value: "basico", label: "Básico", description: "Funcional, atende necessidades essenciais", level: 1, testId: "radio-qual-basico" },
  { value: "medio", label: "Médio", description: "Boa qualidade, custo-benefício equilibrado", level: 2, testId: "radio-qual-medio" },
  { value: "premium", label: "Premium", description: "Qualidade superior, diferenciação máxima", level: 3, testId: "radio-qual-premium" },
];

const FEATURES_OPTIONS: ChoiceOption[] = [
  { value: "basico", label: "Básico", description: "Recursos essenciais apenas", level: 1, testId: "radio-feat-basico" },
  { value: "intermediario", label: "Intermediário", description: "Recursos principais + extras", level: 2, testId: "radio-feat-inter" },
  { value: "completo", label: "Completo", description: "Todos os recursos possíveis", level: 3, testId: "radio-feat-completo" },
];

const POSITIONING_OPTIONS: ChoiceOption[] = [
  { value: "qualidade", label: "Qualidade", description: "Líder em qualidade", icon: Award, testId: "radio-pos-qual" },
  { value: "preco", label: "Preço", description: "Melhor custo-benefício", icon: Tag, testId: "radio-pos-preco" },
  { value: "inovacao", label: "Inovação", description: "Pioneiro em tecnologia", icon: Lightbulb, testId: "radio-pos-inov" },
];

const CHANNEL_OPTIONS: ChoiceOption[] = [
  { value: "varejo", label: "Varejo Físico", description: "Lojas físicas tradicionais", icon: Store, testId: "checkbox-varejo" },
  { value: "ecommerce", label: "E-commerce Próprio", description: "Loja online própria", icon: ShoppingCart, testId: "checkbox-ecommerce" },
  { value: "marketplace", label: "Marketplaces", description: "Amazon, Mercado Livre, etc", icon: Boxes, testId: "checkbox-marketplace" },
  { value: "atacado", label: "Atacado", description: "Distribuidores e atacadistas", icon: Warehouse, testId: "checkbox-atacado" },
  { value: "franquias", label: "Franquias", description: "Rede de franquias", icon: Network, testId: "checkbox-franquias" },
  { value: "direto", label: "Venda Direta", description: "Vendedores e consultores", icon: Handshake, testId: "checkbox-direto" },
];

const CHANNEL_LABELS: Record<string, string> = Object.fromEntries(
  CHANNEL_OPTIONS.map((o) => [o.value, o.label]),
);

const COVERAGE_OPTIONS: ChoiceOption[] = [
  { value: "local", label: "Local", description: "Cidade ou região específica", icon: MapPin, testId: "radio-cob-local" },
  { value: "regional", label: "Regional", description: "Múltiplas cidades/estados", icon: MapIcon, testId: "radio-cob-regional" },
  { value: "nacional", label: "Nacional", description: "Todo o país", icon: Flag, testId: "radio-cob-nacional" },
  { value: "internacional", label: "Internacional", description: "Exportação para outros países", icon: Globe, testId: "radio-cob-inter" },
];

const PRICE_STRATEGY_OPTIONS: ChoiceOption[] = [
  { value: "penetracao", label: "Penetração", description: "Preço baixo para ganhar mercado rapidamente", icon: TrendingDown, testId: "radio-preco-pen" },
  { value: "competitivo", label: "Competitivo", description: "Preço similar aos concorrentes", icon: Scale, testId: "radio-preco-comp" },
  { value: "skimming", label: "Desnatamento (Skimming)", description: "Preço alto para maximizar margem", icon: Crown, testId: "radio-preco-skim" },
  { value: "valor", label: "Baseado em Valor", description: "Preço baseado no valor percebido", icon: Gem, testId: "radio-preco-valor" },
];

const INTENSITY_OPTIONS: ChoiceOption[] = [
  { value: "baixo", label: "Baixa", description: "Investimento reduzido, menor visibilidade", icon: Volume, testId: "radio-promo-intensidade-baixo" },
  { value: "medio", label: "Média", description: "Investimento e visibilidade equilibrados", icon: Volume1, testId: "radio-promo-intensidade-medio" },
  { value: "alto", label: "Alta", description: "Presença forte na mídia, custo mais elevado", icon: Volume2, testId: "radio-promo-intensidade-alto" },
  { value: "intensivo", label: "Intensiva", description: "Máxima visibilidade possível, maior custo", icon: MegaphoneIcon, testId: "radio-promo-intensidade-intensivo" },
];

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  b2c: "B2C",
  b2b: "B2B",
  hibrido: "Híbrido (B2C + B2B)",
};

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
    decisionsAllowed: boolean;
    reason: "no_team" | "no_active_round" | "round_active";
    message: string;
  }

  const { data: roundStatus, isLoading: isLoadingRound, isFetching: isFetchingRound } = useQuery<RoundStatusResponse>({
    queryKey: ["/api/rounds/active/current"],
  });

  // Extract activeRound from the canonical response structure
  const activeRound = roundStatus?.round ?? null;
  
  // Derive decisionsAllowed with safe default during loading
  const decisionsAllowed = roundStatus?.decisionsAllowed ?? false;
  
  // Derive activeRoundId only when decisions are truly allowed - prevents queries during transition states
  const activeRoundId = decisionsAllowed ? activeRound?.id : undefined;

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
    queryKey: [
      "/api/products/class",
      currentClass?.id ? `${currentClass.id}${activeRoundId ? `?roundId=${activeRoundId}` : ""}` : undefined,
    ],
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
    queryKey: ["/api/marketing-mix/team", team?.id, "round", activeRoundId, "products"],
    enabled: !!team?.id && !!activeRoundId,
  });

  // Buscar status das ferramentas estratégicas para validação obrigatória
  const { data: strategicTools } = useQuery<any>({
    queryKey: ["/api/strategy", activeRoundId],
    enabled: !!activeRoundId,
  });

  // Buscar recomendações estratégicas automáticas via IA - only when decisions are allowed
  const { data: recommendations, isLoading: isLoadingRecommendations } = useQuery<{
    product: string[];
    price: string[];
    place: string[];
    promotion: string[];
    updatedAt: string;
  } | null>({
    queryKey: ["/api/ai/strategic-recommendations/current", activeRoundId],
    enabled: !!activeRoundId && !!team,
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

  // Segmentação de Mercado (5ª ferramenta): o servidor já a exige no envio
  // do mix (ver isSegmentationComplete em server/routes.ts), mas esta tela
  // só mostrava 4 ferramentas — a equipe via tudo verde e recebia erro ao
  // salvar/enviar. Em vez de duplicar a validação aqui, reaproveita o
  // status calculado pelo próprio servidor no endpoint do "Roteiro da
  // Rodada" (mesma função usada no bloqueio). Só exibição: nenhuma regra muda.
  const { data: roundChecklist } = useQuery<{ hasSegmentation?: boolean }>({
    queryKey: ["/api/team/current-round-status"],
    enabled: !!activeRoundId,
  });
  const isSegmentationComplete = !!roundChecklist?.hasSegmentation;

  const allToolsComplete = isSwotComplete && isPorterComplete && isBcgComplete && isPestelComplete && isSegmentationComplete;

  // Apenas o líder pode salvar/enviar (o servidor responde 403 aos demais).
  // Antes, o membro não-líder só descobria isso pelo erro ao clicar em salvar.
  const { data: currentUser } = useQuery<{ id: string }>({
    queryKey: ["/api/auth/me"],
  });
  const isNonLeader = !!team?.leaderId && !!currentUser?.id && team.leaderId !== currentUser.id;

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
      
      // Pull latest roundStatus from cache to avoid stale state during refetch
      const latestRoundStatus = queryClient.getQueryData<RoundStatusResponse>(["/api/rounds/active/current"]);
      const latestDecisionsAllowed = latestRoundStatus?.decisionsAllowed ?? false;
      const latestRoundId = latestDecisionsAllowed ? latestRoundStatus?.round?.id : undefined;
      
      if (!latestDecisionsAllowed || !latestRoundId) {
        throw new Error("Decisões não permitidas no momento. Verifique se a rodada está ativa.");
      }
      
      const res = await apiRequest("POST", "/api/marketing-mix/product", {
        ...data,
        teamId: team.id,
        roundId: latestRoundId,
        productId: selectedProductId,
        isDraft: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-mix/team", team?.id, "round", activeRoundId, "products"] });
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
      // Pull latest roundStatus from cache to avoid stale state during refetch
      const latestRoundStatus = queryClient.getQueryData<RoundStatusResponse>(["/api/rounds/active/current"]);
      const latestDecisionsAllowed = latestRoundStatus?.decisionsAllowed ?? false;
      const latestRoundId = latestDecisionsAllowed ? latestRoundStatus?.round?.id : undefined;
      
      if (!latestDecisionsAllowed || !latestRoundId) {
        throw new Error("Decisões não permitidas no momento. Verifique se a rodada está ativa.");
      }
      
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
              roundId: latestRoundId,
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
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-mix/team", team?.id, "round", activeRoundId, "products"] });
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
        description: "Complete todas as ferramentas estratégicas (SWOT, Porter, BCG, PESTEL e Segmentação de Mercado) antes de submeter suas decisões.",
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
          roundId: activeRoundId,
          productId: product.id,
          isDraft: true,
          ...decisionsPayload,
        });
      }

      // Invalidar queries para recarregar dados salvos
      await queryClient.invalidateQueries({ 
        queryKey: ["/api/marketing-mix/team", team?.id, "round", activeRoundId, "products"] 
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

  // Total em promoção somando todos os produtos (o orçamento é da equipe).
  // Só exibição no painel de investimento.
  const allProductsPromotionTotal = products.reduce((sum: number, product: any) => {
    const budgets = (product.id === selectedProductId ? promotionBudgets : productDecisions[product.id]?.promotionBudgets) || {};
    return sum + Object.values(budgets).reduce((s: number, v) => s + (Number(v) || 0), 0);
  }, 0);

  const midiaNames: Record<string, string> = Object.fromEntries(
    midias.map((m: any) => [m.id, m.formato ? `${m.nome} — ${m.formato}` : m.nome]),
  );

  // Categoria do setor correspondente ao produto (ex.: "Smartphone"), para
  // usar o preço médio certo. Antes a tela mostrava sempre a 1ª categoria.
  const productCategory = (marketSector?.categories ?? []).find((c: any) =>
    c.id === selectedProduct?.slug ||
    (c.name && selectedProduct?.name && c.name.toLowerCase() === String(selectedProduct.name).toLowerCase())
  ) ?? marketSector?.categories?.[0];

  // Use decisionsAllowed from backend as source of truth
  // Only show locked state after initial data has loaded to avoid flash
  // During refetch (isFetching but not isLoading), keep previous state to avoid control flashes
  const hasInitialData = !isLoadingRound && roundStatus !== undefined;
  const isLocked = hasInitialData && !decisionsAllowed;
  // Keep controls enabled during refetch if they were previously enabled
  const controlsDisabled = isLoadingRound || (hasInitialData && !decisionsAllowed);
  const lockReason = roundStatus?.reason;
  const lockMessage = roundStatus?.message;
  
  // Derivar isSubmitted diretamente da fonte autoritativa (savedProductMixes)
  // para evitar lag entre troca de produto e atualização do estado local
  const savedMix = savedProductMixes.find((mix: any) => mix.productId === selectedProductId);
  const isSubmitted = !!savedMix?.submittedAt || !!currentProductDecisions.submittedAt;
  // canEdit uses controlsDisabled which properly handles loading and refetch states
  const canEdit = !controlsDisabled && !isSubmitted;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[#0a1830] via-[#0d2348] to-[#0a1830] p-8">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-20 w-32 h-32 border-4 border-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 left-20 w-40 h-40 border-4 border-white rounded-lg rotate-45 animate-pulse delay-75"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-[#ffcc00] flex items-center justify-center shadow-lg">
              <Megaphone className="h-8 w-8 text-[#0a1830]" />
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
                <span className="text-sm text-white font-medium">R$ {(team.budget ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {activeRound && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Activity className="h-4 w-4 text-white" />
                  <span className="text-sm text-white font-medium">Rodada {activeRound?.roundNumber}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isLoadingRound && (
        <Alert data-testid="alert-loading" className="border-[#1447e6]/40 bg-[#eef2ff] dark:bg-blue-950/20">
          <Activity className="h-4 w-4 text-[#1447e6] animate-pulse" />
          <AlertDescription className="text-[#1447e6] dark:text-blue-200">
            Carregando informações da rodada...
          </AlertDescription>
        </Alert>
      )}

      {!isLoadingRound && isLocked && lockReason === "no_team" && (
        <Alert data-testid="alert-locked-no-team" className="border-[#ffcc00]/50 bg-[#fff3d6] dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-[#7a5300]" />
          <AlertTitle className="text-[#7a5300] dark:text-amber-200">Equipe não encontrada</AlertTitle>
          <AlertDescription className="text-[#7a5300] dark:text-amber-200">
            {lockMessage || "Você precisa estar em uma equipe para acessar as decisões."}
          </AlertDescription>
        </Alert>
      )}

      {!isLoadingRound && isLocked && lockReason === "no_active_round" && (
        <Alert data-testid="alert-locked-no-round" className="w-full border-2 border-[#ff8c1a]/50 bg-[#fff0e2] dark:bg-orange-950/30">
          <Clock className="h-5 w-5 text-[#ff8c1a]" />
          <AlertTitle className="text-lg font-semibold text-[#8a4a00] dark:text-orange-200">
            Rodada ainda não iniciada
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p className="text-[#8a4a00] dark:text-orange-300">
              Nenhuma rodada ativa no momento. Aguarde o professor iniciar a próxima rodada.
            </p>
            <p className="text-sm text-[#8a4a00]/80 dark:text-orange-400/80">
              Enquanto isso, revise suas análises estratégicas (SWOT, Porter, BCG, PESTEL).
            </p>
            <div className="pt-2">
              <Link href="/">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#ff8c1a] text-[#8a4a00] hover:bg-[#ffe4c7] dark:border-orange-500 dark:text-orange-300 dark:hover:bg-orange-900/40"
                  data-testid="button-back-dashboard"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Dashboard
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isSubmitted && (
        <Alert data-testid="alert-submitted" className="border-[#1aa15c]/40 bg-[#e6f7ee] dark:bg-green-950/20">
          <Lock className="h-4 w-4 text-[#0f7a44]" />
          <AlertDescription className="text-[#0f7a44] dark:text-green-200">
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

      {isNonLeader && !isSubmitted && !isLocked && (
        <Alert data-testid="alert-non-leader" className="border-[#1447e6]/40 bg-[#eef2ff] dark:bg-blue-950/20">
          <Users className="h-4 w-4 text-[#1447e6]" />
          <AlertTitle className="text-[#1447e6] dark:text-blue-200">Modo visualização</AlertTitle>
          <AlertDescription className="text-[#1447e6] dark:text-blue-200">
            Apenas o líder da equipe pode salvar e enviar as decisões. Você pode explorar as opções
            e discutir com a equipe, mas as alterações feitas aqui não serão gravadas.
          </AlertDescription>
        </Alert>
      )}

      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#1447e6] flex items-center justify-center">
                <Package className="h-4 w-4 text-white" />
              </div>
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
            {isSubmitted && <span className="ml-2 text-[#0f7a44] dark:text-green-400">(Decisão Submetida)</span>}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="produto" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50">
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
                  <span> Preço médio da categoria {productCategory?.name ?? ''}: R$ {(productCategory?.averagePrice ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.</span>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-6">
            <Card className="border-2 border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#1447e6] flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Qualidade do Produto</CardTitle>
                    <CardDescription className="text-sm">Nível de qualidade oferecido</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ChoiceCards
                  value={productQuality}
                  onValueChange={setProductQuality}
                  disabled={!canEdit}
                  options={QUALITY_OPTIONS}
                  columns={3}
                  ariaLabel="Qualidade do produto"
                />
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#1aa15c] flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Características do Produto</CardTitle>
                    <CardDescription className="text-sm">Nível de recursos oferecidos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ChoiceCards
                  value={productFeatures}
                  onValueChange={setProductFeatures}
                  disabled={!canEdit}
                  options={FEATURES_OPTIONS}
                  columns={3}
                  ariaLabel="Características do produto"
                />
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#7c3aed] flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Posicionamento de Marca</CardTitle>
                    <CardDescription className="text-sm">Como você quer que sua marca seja percebida</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ChoiceCards
                  value={brandPositioning}
                  onValueChange={setBrandPositioning}
                  disabled={!canEdit}
                  options={POSITIONING_OPTIONS}
                  columns={3}
                  ariaLabel="Posicionamento de marca"
                />
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
          
          <div className="grid gap-6">
            <Card className="border-2 border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#0a1830] flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-[#ffcc00]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Estratégia de Precificação</CardTitle>
                    <CardDescription className="text-sm">Abordagem para definir preços</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ChoiceCards
                  value={priceStrategy}
                  onValueChange={setPriceStrategy}
                  disabled={!canEdit}
                  options={PRICE_STRATEGY_OPTIONS}
                  columns={4}
                  ariaLabel="Estratégia de precificação"
                />
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 dark:border-slate-800">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#ff8c1a] flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Valor do Preço</CardTitle>
                    <CardDescription>Arraste para ajustar ou digite o valor exato</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <PriceSlider
                  value={price}
                  onChange={setPrice}
                  disabled={!canEdit}
                  reference={productCategory?.averagePrice}
                  inputId="price-input"
                />
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm">
                    <strong>Margem estimada para a estratégia escolhida:</strong>{" "}
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
                {/* O sistema grava "b2c" | "b2b" | "hibrido" (server/data/marketData.ts);
                    antes a comparação era com "B2C"/"B2B"/"Híbrido" e a
                    recomendação nunca aparecia. Só exibição. */}
                <strong>Tipo de Negócio:</strong> {BUSINESS_TYPE_LABELS[currentClass.businessType] ?? currentClass.businessType}.
                {currentClass.businessType === 'b2c' && ' Recomendado: Varejo, E-commerce, Marketplaces.'}
                {currentClass.businessType === 'b2b' && ' Recomendado: Venda Direta, Atacado, Representantes.'}
                {currentClass.businessType === 'hibrido' && ' Combine canais B2B e B2C para maximizar alcance.'}
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
                <ToggleTiles
                  values={distributionChannels}
                  onToggle={handleChannelToggle}
                  disabled={!canEdit}
                  options={CHANNEL_OPTIONS}
                  ariaLabel="Canais de distribuição"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cobertura de Distribuição</CardTitle>
                <CardDescription>Amplitude geográfica da distribuição</CardDescription>
              </CardHeader>
              <CardContent>
                <ScaleSelector
                  value={distributionCoverage}
                  onValueChange={setDistributionCoverage}
                  disabled={!canEdit}
                  options={COVERAGE_OPTIONS}
                  ariaLabel="Cobertura de distribuição"
                />
                <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm">
                    <strong className="text-primary">Canais selecionados:</strong>{" "}
                    {distributionChannels.length > 0
                      ? distributionChannels.map((c) => CHANNEL_LABELS[c] ?? c).join(", ")
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
          
          <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Catálogo de Mídias</CardTitle>
                <CardDescription>Ative as mídias da campanha e defina quanto investir em cada uma</CardDescription>
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
                      <h4 className="flex items-center justify-between border-b pb-1 text-sm font-semibold text-muted-foreground">
                        <span>{categoria}</span>
                        <span className="font-normal">
                          {categoriaMidias.filter((m: any) => promotionMix.includes(m.id)).length} de {categoriaMidias.length} ativas
                        </span>
                      </h4>
                      <div className="grid items-start gap-3 sm:grid-cols-2">
                        {categoriaMidias.map((midia: any) => (
                          <MediaTile
                            key={midia.id}
                            id={midia.id}
                            name={midia.formato ? `${midia.nome} — ${midia.formato}` : midia.nome}
                            description={midia.descricao}
                            minCost={midia.custoUnitarioMinimo || 0}
                            checked={promotionMix.includes(midia.id)}
                            onToggle={() => handlePromotionToggle(midia.id)}
                            budget={promotionBudgets[midia.id] || 0}
                            onBudgetChange={(value) => handlePromotionBudgetChange(midia.id, value)}
                            disabled={!canEdit}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
              <Card>
                <CardContent className="pt-6">
                  <BudgetMeter
                    productTotal={totalPromotionBudget}
                    allProductsTotal={allProductsPromotionTotal}
                    available={team?.budget || 0}
                    productName={products.length > 1 ? selectedProduct?.name : undefined}
                    mediaCount={promotionMix.length}
                    showAllProducts={products.length > 1}
                  />
                  {promotionMix.length > 0 && (
                    <ul className="mt-4 space-y-1.5 border-t pt-4 text-sm">
                      {promotionMix.map((id) => (
                        <li key={id} className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0 truncate text-muted-foreground">{midiaNames[id] ?? id}</span>
                          <span className="shrink-0 tabular-nums">{formatarNumeroBR(promotionBudgets[id] || 0, 'moeda')}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Intensidade de Promoção</CardTitle>
                  <CardDescription>Nível de investimento e agressividade da campanha</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScaleSelector
                    value={promotionIntensity}
                    onValueChange={setPromotionIntensity}
                    disabled={!canEdit}
                    options={INTENSITY_OPTIONS}
                    ariaLabel="Intensidade de promoção"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {!isSubmitted && activeRound && (
        <Card className="border-2" data-testid="card-strategic-tools-status">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#ff8c1a] flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              Ferramentas Estratégicas Obrigatórias
            </CardTitle>
            <CardDescription>
              Você deve preencher todas as ferramentas estratégicas antes de enviar sua decisão final.
              Acesse a aba "Estratégia" para completar cada análise.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`flex items-center gap-2 p-3 rounded-lg ${isSwotComplete ? 'bg-[#e6f7ee] dark:bg-green-950' : 'bg-[#fde8e6] dark:bg-red-950'}`} data-testid={`status-swot-${isSwotComplete ? 'complete' : 'incomplete'}`}>
                {isSwotComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-[#0f7a44]" />
                ) : (
                  <XCircle className="h-5 w-5 text-[#a3241c]" />
                )}
                <div>
                  <p className="font-medium">Análise SWOT</p>
                  <p className="text-xs text-muted-foreground">
                    {isSwotComplete ? 'Completa' : 'Preencha pelo menos um item'}
                  </p>
                </div>
              </div>

              <div className={`flex items-center gap-2 p-3 rounded-lg ${isPorterComplete ? 'bg-[#e6f7ee] dark:bg-green-950' : 'bg-[#fde8e6] dark:bg-red-950'}`} data-testid={`status-porter-${isPorterComplete ? 'complete' : 'incomplete'}`}>
                {isPorterComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-[#0f7a44]" />
                ) : (
                  <XCircle className="h-5 w-5 text-[#a3241c]" />
                )}
                <div>
                  <p className="font-medium">5 Forças de Porter</p>
                  <p className="text-xs text-muted-foreground">
                    {isPorterComplete ? 'Completa' : 'Adicione justificativas para as forças'}
                  </p>
                </div>
              </div>

              <div className={`flex items-center gap-2 p-3 rounded-lg ${isBcgComplete ? 'bg-[#e6f7ee] dark:bg-green-950' : 'bg-[#fde8e6] dark:bg-red-950'}`} data-testid={`status-bcg-${isBcgComplete ? 'complete' : 'incomplete'}`}>
                {isBcgComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-[#0f7a44]" />
                ) : (
                  <XCircle className="h-5 w-5 text-[#a3241c]" />
                )}
                <div>
                  <p className="font-medium">Matriz BCG</p>
                  <p className="text-xs text-muted-foreground">
                    {isBcgComplete ? 'Completa' : 'Adicione pelo menos um produto'}
                  </p>
                </div>
              </div>

              <div className={`flex items-center gap-2 p-3 rounded-lg ${isPestelComplete ? 'bg-[#e6f7ee] dark:bg-green-950' : 'bg-[#fde8e6] dark:bg-red-950'}`} data-testid={`status-pestel-${isPestelComplete ? 'complete' : 'incomplete'}`}>
                {isPestelComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-[#0f7a44]" />
                ) : (
                  <XCircle className="h-5 w-5 text-[#a3241c]" />
                )}
                <div>
                  <p className="font-medium">Análise PESTEL</p>
                  <p className="text-xs text-muted-foreground">
                    {isPestelComplete ? 'Completa' : 'Preencha pelo menos um fator'}
                  </p>
                </div>
              </div>

              <div className={`flex items-center gap-2 p-3 rounded-lg ${isSegmentationComplete ? 'bg-[#e6f7ee] dark:bg-green-950' : 'bg-[#fde8e6] dark:bg-red-950'}`} data-testid={`status-segmentation-${isSegmentationComplete ? 'complete' : 'incomplete'}`}>
                {isSegmentationComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-[#0f7a44]" />
                ) : (
                  <XCircle className="h-5 w-5 text-[#a3241c]" />
                )}
                <div>
                  <p className="font-medium">Segmentação de Mercado</p>
                  <p className="text-xs text-muted-foreground">
                    {isSegmentationComplete ? 'Completa' : 'Preencha todos os critérios exigidos para a turma'}
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
          disabled={!canEdit || isNonLeader || saveDraftMutation.isPending}
          data-testid="button-save-draft"
        >
          <Save className="h-4 w-4 mr-2" />
          {saveDraftMutation.isPending ? "Salvando..." : "Salvar Rascunho"}
        </Button>
        
        <Button 
          size="lg" 
          onClick={handleSubmitDecision} 
          disabled={!canEdit || isNonLeader || saveDraftMutation.isPending || submitMutation.isPending || !allToolsComplete}
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
              <AlertTriangle className="h-5 w-5 text-[#ff8c1a]" />
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
