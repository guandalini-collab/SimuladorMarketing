import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import emptyStateImg from "@assets/generated_images/Empty_campaigns_state_illustration_e1a3e311.png";

// Esta página ainda não tem um modelo de dados próprio de "campanhas" no
// backend — as decisões de promoção/mídia de cada equipe são configuradas
// por produto, na página Decisões (4 Ps de Marketing), e são elas que valem
// para a simulação. Antes esta tela mostrava campanhas fixas de exemplo e um
// formulário de "Nova Campanha" que não salvava nada (a campanha "criada"
// sumia ao recarregar a página) — foi substituída por este estado honesto,
// que direciona para onde a configuração realmente acontece.
export default function Campanhas() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-accent font-bold">Campanhas</h1>
          <p className="text-muted-foreground">Gerencie suas campanhas de marketing</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <img src={emptyStateImg} alt="Campanhas" className="w-48 h-48 mb-6 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">Configure suas campanhas em Decisões</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          A escolha de canais de mídia e o orçamento de promoção de cada produto são definidos
          na página Decisões, dentro do 4º P (Promoção). É lá que suas campanhas da rodada
          realmente entram na simulação.
        </p>
        <Link href="/decisoes">
          <Button data-testid="button-go-to-decisoes">
            Ir para Decisões
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
