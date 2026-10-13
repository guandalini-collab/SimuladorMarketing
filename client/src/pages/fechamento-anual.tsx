import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarCheck, Send, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { YearIndicators, YearTitle, useSelectedYear, type YearReview } from "@/components/annual-review";

// Fechamento anual da equipe (server/services/annualReview.ts): relatório
// do ano e reflexão escrita pela própria equipe.
export default function FechamentoAnual() {
  const { toast } = useToast();
  const { data: team } = useQuery<any>({ queryKey: ["/api/team/current"] });
  const key = [`/api/annual-review/team/${team?.id}`];
  const { data: reviews, isLoading } = useQuery<YearReview[]>({ queryKey: key, enabled: !!team?.id });
  const [review, setYear] = useSelectedYear(reviews);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setAnswers(review?.reflection?.answers ?? {});
  }, [review?.year, review?.reflection?.updatedAt]);

  const save = useMutation({
    mutationFn: async (submit: boolean) => {
      const res = await apiRequest("PUT", `/api/annual-review/team/${team.id}/${review!.year}`, { answers, submit });
      return res.json();
    },
    onSuccess: (data, submit) => {
      queryClient.setQueryData(key, data);
      queryClient.invalidateQueries({ queryKey: ["/api/team/current-round-status"] });
      toast({
        title: submit ? "Reflexão enviada" : "Rascunho salvo",
        description: submit ? "O professor já pode ler as respostas da equipe." : "As respostas foram guardadas. Envie quando a equipe terminar.",
      });
    },
    onError: (error: any) => toast({ title: "Não foi possível salvar", description: error.message, variant: "destructive" }),
  });

  const enviado = !!review?.reflection?.submittedAt;
  const completas = review ? review.questions.every((q) => (answers[q.id] ?? "").trim().length > 0) : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-accent font-bold">
          <CalendarCheck className="h-7 w-7" />
          Fechamento anual
        </h1>
        <p className="text-muted-foreground">
          A cada 12 meses (12 rodadas), a equipe olha para o ano inteiro e analisa o que deu certo e o que deu errado.
        </p>
      </div>

      {isLoading && <p className="text-muted-foreground">Carregando…</p>}

      {!isLoading && (!reviews || reviews.length === 0) && (
        <Alert>
          <AlertDescription>
            O fechamento fica disponível quando o ano termina, depois da 12ª rodada (e ao fim do jogo). Até lá, acompanhe a evolução da equipe em Resultados e no Dashboard.
          </AlertDescription>
        </Alert>
      )}

      {reviews && reviews.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {reviews.map((r) => (
            <Button key={r.year} variant={r.year === review?.year ? "default" : "outline"} size="sm" onClick={() => setYear(r.year)}>
              Ano {r.year}
            </Button>
          ))}
        </div>
      )}

      {review && (
        <>
          <YearTitle review={review} />
          <YearIndicators review={review} />

          <Card className="border-2 border-[#1447e6]/25">
            <CardHeader>
              <CardTitle>Reflexão da equipe</CardTitle>
              <CardDescription>
                As perguntas partem dos números da própria equipe. Não há resposta certa: o objetivo é a equipe explicar, com as próprias palavras, o que aconteceu e por quê. As respostas ficam visíveis para o professor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {review.questions.map((q, i) => (
                <div key={q.id} className="space-y-2">
                  <Label htmlFor={`q-${q.id}`} className="leading-relaxed">
                    <span className="mr-1 font-semibold text-[#1447e6]">{i + 1}.</span>
                    {q.text}
                  </Label>
                  {enviado ? (
                    <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">{answers[q.id] || "—"}</p>
                  ) : (
                    <Textarea
                      id={`q-${q.id}`}
                      rows={4}
                      maxLength={4000}
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      data-testid={`textarea-reflection-${q.id}`}
                    />
                  )}
                </div>
              ))}

              {enviado ? (
                <p className="text-sm text-muted-foreground">
                  Reflexão enviada em {new Date(review.reflection!.submittedAt!).toLocaleString("pt-BR")}.
                </p>
              ) : (
                <div className={cn("flex flex-col gap-2 sm:flex-row sm:justify-end")}>
                  <Button variant="outline" onClick={() => save.mutate(false)} disabled={save.isPending} data-testid="button-reflection-draft">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar rascunho
                  </Button>
                  <Button onClick={() => setConfirmOpen(true)} disabled={save.isPending || !completas} data-testid="button-reflection-submit">
                    <Send className="mr-2 h-4 w-4" />
                    Enviar reflexão
                  </Button>
                </div>
              )}
              {!enviado && !completas && (
                <p className="text-right text-xs text-muted-foreground">Responda todas as perguntas para poder enviar.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar a reflexão do Ano {review?.year}?</AlertDialogTitle>
            <AlertDialogDescription>
              Depois de enviada, a reflexão não pode mais ser alterada e fica disponível para o professor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revisar</AlertDialogCancel>
            <AlertDialogAction onClick={() => save.mutate(true)}>Enviar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
