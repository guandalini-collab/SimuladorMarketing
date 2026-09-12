import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tv, Download, FileText, TrendingUp, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function GuiaMidias() {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadPDF = async () => {
    setIsDownloading(true);
    toast({
      title: "Baixando Guia de Mídias...",
      description: "Aguarde enquanto o arquivo PDF é baixado.",
    });

    try {
      const response = await fetch('/api/guia-midias/pdf');
      
      if (!response.ok) {
        throw new Error('Erro ao baixar PDF');
      }

      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Guia_Midias_Simula.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download concluído!",
        description: "O Guia de Mídias foi baixado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao baixar PDF:", error);
      toast({
        title: "Erro ao baixar PDF",
        description: "Não foi possível baixar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-[#1447e6] flex items-center justify-center shadow-lg">
              <Tv className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold">Guia de Mídias - Simula+</h1>
          </div>
          <Button
            onClick={downloadPDF}
            disabled={isDownloading}
            data-testid="button-download-guia-midias"
            variant="default"
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? "Baixando..." : "Baixar PDF"}
          </Button>
        </div>
        <p className="text-muted-foreground">
          Guia completo sobre formatos de mídia e promoção para suas campanhas de marketing
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card data-testid="card-midias-tradicionais">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#ff8c1a] flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              Mídias Tradicionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Mídia Impressa (Jornais e Revistas)</li>
              <li>• Rádio (Spots e Testemunhais)</li>
              <li>• Televisão (Comerciais)</li>
              <li>• Cinema (Publicidade)</li>
              <li>• Mídia Exterior (Outdoors, Busdoors)</li>
            </ul>
          </CardContent>
        </Card>

        <Card data-testid="card-midias-digitais">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#1447e6] flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              Mídias Digitais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Influenciadores Digitais</li>
              <li>• Email Marketing</li>
              <li>• Podcasts</li>
              <li>• Marketing de Conteúdo</li>
              <li>• SMS Marketing</li>
            </ul>
          </CardContent>
        </Card>

        <Card data-testid="card-midias-diretas">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#1aa15c] flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              Marketing Direto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Mala Direta</li>
              <li>• Telemarketing</li>
              <li>• Catálogos de Produtos</li>
              <li>• Venda Direta (Porta a porta)</li>
              <li>• Eventos e Promoções</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#ffcc00]/5 border-[#ffcc00]/30 dark:bg-[#ffcc00]/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#ffcc00] flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-[#0a1830]" />
            </div>
            Informações Detalhadas no PDF
          </CardTitle>
          <CardDescription>
            O Guia de Mídias completo contém informações detalhadas sobre:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                📊 Formatos Disponíveis
              </h3>
              <p className="text-sm text-muted-foreground">
                Todos os formatos de mídia disponíveis para suas campanhas, com especificações técnicas e alcance esperado.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                💰 Valores e Quantidades
              </h3>
              <p className="text-sm text-muted-foreground">
                Tabelas completas com valores unitários, quantidades sugeridas e investimentos por tipo de mídia.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                🎯 Público-Alvo
              </h3>
              <p className="text-sm text-muted-foreground">
                Orientações sobre qual mídia utilizar para atingir diferentes perfis de público e maximizar resultados.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                📈 Impactos e Resultados
              </h3>
              <p className="text-sm text-muted-foreground">
                Análise do impacto de cada tipo de mídia no reconhecimento de marca, vendas e engajamento.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-center text-muted-foreground">
              💡 <strong>Dica:</strong> Use este guia para planejar suas campanhas de promoção e otimizar seu orçamento de marketing no simulador.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
