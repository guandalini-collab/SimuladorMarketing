import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BcgLegenda, BcgMatriz, type ProdutoBcg } from "@/components/bcg-matriz";

// Página Estratégia. Desde out/2026 desenha a matriz no modelo original da
// Boston Consulting Group (ver components/bcg-matriz.tsx).
export default function BcgMatrixChart({ products }: { products: ProdutoBcg[] }) {
  return (
    <Card className="border-2 border-slate-200 dark:border-slate-800">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2f2a8f]">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle>Matriz BCG — portfólio de produtos</CardTitle>
            <CardDescription>Crescimento do mercado × participação relativa, conforme o modelo da Boston Consulting Group</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {products.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">Nenhum produto mapeado ainda</p>
        ) : (
          <>
            <BcgMatriz produtos={products} />
            <BcgLegenda produtos={products} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
