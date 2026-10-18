import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, ExternalLink } from "lucide-react";

// Out/2026: a tela "Manual do Aluno" passou a mostrar o PDF oficial do
// manual (server/assets/Manual_do_Aluno_Simula.pdf), o mesmo que é
// atualizado a cada mudança de regra. Antes, esta página repetia o manual
// inteiro em texto próprio, que tinha ficado desatualizado. A versão
// anterior está em client/src/pages/manual.tsx.backup.
const URL_PDF = "/api/manual/aluno/pdf";

export default function Manual() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#7c3aed]">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Manual do Aluno</CardTitle>
              <CardDescription>Regras do jogo, telas, fórmulas do mercado e referências.</CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" data-testid="button-open-pdf">
              <a href={`${URL_PDF}?inline=1`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Abrir em nova aba
              </a>
            </Button>
            <Button asChild data-testid="button-download-pdf">
              <a href={URL_PDF} download="Manual_do_Aluno_Simula.pdf">
                <Download className="mr-2 h-4 w-4" /> Baixar PDF
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <iframe
            title="Manual do Aluno"
            src={`${URL_PDF}?inline=1`}
            className="h-[78vh] w-full rounded-lg border"
            data-testid="iframe-manual"
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Se o manual não aparecer aqui (alguns celulares não exibem PDF dentro da página), use “Abrir em nova aba” ou “Baixar PDF”.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
