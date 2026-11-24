import { FileText } from "lucide-react";
import { ListaRelatoriosGerenciais } from "@/components/relatorio-gerencial";
import { AvisoAntesDeDecidir, IncoerenciasRepetidas } from "@/components/aviso-decisao";

/**
 * Nov/2026 (decisão do professor, 17/11): esta página deixou de mostrar o
 * "Feedback Inteligente" escrito pela IA. Agora reúne os relatórios
 * gerenciais (PDF) de todas as rodadas encerradas, para a equipe baixar de
 * novo quando quiser. A rota (/feedback) e a etapa "Li e entendi" da jornada
 * continuam as mesmas.
 */
export default function FeedbackPage() {
  return (
    <div className="container mx-auto p-0 md:p-6 space-y-6" data-testid="page-relatorios-gerenciais">
      <div className="mb-2 flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-[#1447e6] flex items-center justify-center shadow-md">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios gerenciais</h1>
          <p className="text-muted-foreground mt-1">Resultados de cada rodada encerrada, em PDF</p>
        </div>
      </div>
      <AvisoAntesDeDecidir />
      <IncoerenciasRepetidas />
      <ListaRelatoriosGerenciais />
    </div>
  );
}
