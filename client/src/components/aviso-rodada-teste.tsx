import { FlaskConical } from "lucide-react";

/**
 * Rodada de teste (pedido do professor, out/2026): aviso fixo para os
 * alunos de que a rodada serve só para conhecer o simulador.
 */
export function AvisoRodadaTeste({ className }: { className?: string }) {
  return (
    <div
      className={`mt-2 flex items-start gap-2 rounded-lg border border-[#1447e6]/40 bg-[#eef2ff] p-3 text-sm text-[#0f2f99] dark:bg-blue-900/30 dark:text-blue-200 ${className ?? ""}`}
      data-testid="aviso-rodada-teste"
    >
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        <strong>Rodada de teste:</strong> serve para você conhecer o simulador. Não vale nota nem resultado — tudo o que for feito nela será apagado antes da Rodada 1.
      </p>
    </div>
  );
}
