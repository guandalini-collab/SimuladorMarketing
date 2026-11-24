import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Repeat } from "lucide-react";

/**
 * Nov/2026 (aprovado pelo professor em 24/11): aviso fixo nas telas de
 * relatórios e de decisões, e quadro com as incoerências do alinhamento que
 * se repetem da rodada anterior. Só fatos; não diz o que a equipe deve fazer.
 */

export function AvisoAntesDeDecidir({ className = "" }: { className?: string }) {
  return (
    <Alert className={`border-[#1447e6]/40 bg-[#1447e6]/5 ${className}`} data-testid="aviso-antes-de-decidir">
      <Info className="h-4 w-4 text-[#1447e6]" />
      <AlertTitle>Antes de decidir</AlertTitle>
      <AlertDescription>
        As decisões desta rodada devem se basear nos dados do Simula+ (relatório gerencial, resultados e mercado) e nas
        regras do Manual do Aluno. Ferramentas externas, como assistentes de inteligência artificial, não conhecem as
        regras deste mercado: os segmentos de consumidores, o peso de cada canal, as mídias que cada público consome e as
        combinações que o modelo considera contraditórias.
      </AlertDescription>
    </Alert>
  );
}

interface IncoerenciaResumo { produto: string; ferramenta: string; titulo: string; repetida: boolean }
interface ResumoIncoerencias { rodada: number; rodadaAnterior: number | null; incoerencias: IncoerenciaResumo[]; repetidas: number }

export function IncoerenciasRepetidas({ className = "" }: { className?: string }) {
  const { data } = useQuery<ResumoIncoerencias | null>({ queryKey: ["/api/team/incoerencias-repetidas"] });
  if (!data || data.rodadaAnterior == null || data.repetidas === 0) return null;
  const total = data.incoerencias.length;
  const repetidas = data.incoerencias.filter((i) => i.repetida);
  const frase = total === 1
    ? `A incoerência da Rodada ${data.rodada} já tinha aparecido na Rodada ${data.rodadaAnterior}.`
    : `${data.repetidas} das ${total} incoerências da Rodada ${data.rodada} já ${data.repetidas === 1 ? "tinha aparecido" : "tinham aparecido"} na Rodada ${data.rodadaAnterior}.`;
  return (
    <Alert className={`border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 ${className}`} data-testid="incoerencias-repetidas">
      <Repeat className="h-4 w-4 text-amber-600" />
      <AlertTitle>Incoerências repetidas</AlertTitle>
      <AlertDescription>
        <p>{frase}</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          {repetidas.map((i, k) => (
            <li key={k}>{i.produto}: {i.titulo} (repetida da Rodada {data.rodadaAnterior})</li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-muted-foreground">A explicação de cada uma está no relatório gerencial, seção 9.2.</p>
      </AlertDescription>
    </Alert>
  );
}
