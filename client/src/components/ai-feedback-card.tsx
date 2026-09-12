import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Sparkles, TrendingUp, TrendingDown, Lightbulb, BookOpen, Award, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface AiFeedbackCardProps {
  teamId: string;
  roundId: string;
}

interface LiteratureRecommendation {
  title: string;
  author: string;
  chapter?: string;
  reason: string;
}

interface AiFeedback {
  id: string;
  teamId: string;
  roundId: string;
  overallAnalysis: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  literatureRecommendations: LiteratureRecommendation[];
  createdAt: string;
}

export function AiFeedbackCard({ teamId, roundId }: AiFeedbackCardProps) {
  const { data: feedback, isLoading, error } = useQuery<AiFeedback | undefined>({
    queryKey: [`/api/feedback/${teamId}/${roundId}`],
    enabled: !!teamId && !!roundId,
    retry: false,
    queryFn: async () => {
      const res = await fetch(`/api/feedback/${teamId}/${roundId}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 404) {
        return undefined;
      }

      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }

      return await res.json();
    },
  });

  if (isLoading) {
    return (
      <Card data-testid="card-ai-feedback">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const isNotFound = (error as any)?.response?.status === 404;
    
    if (!isNotFound) {
      return (
        <Card data-testid="card-ai-feedback">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-xl">Feedback Inteligente com IA</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Erro ao carregar feedback
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" data-testid="alert-feedback-error">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Ocorreu um erro ao carregar o feedback. Por favor, tente novamente mais tarde ou entre em contato com seu professor.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }
  }

  if (!feedback) {
    return (
      <Card data-testid="card-ai-feedback">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#7c3aed] flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Feedback Inteligente com IA</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Análise pedagógica das suas decisões estratégicas
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert data-testid="alert-no-feedback">
            <Info className="h-4 w-4" />
            <AlertDescription>
              O feedback ainda não foi gerado para esta rodada. O professor pode gerar o feedback após o encerramento da rodada.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-ai-feedback" className="border-2 border-[#7c3aed]/20">
      <CardHeader className="bg-muted/30">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-[#7c3aed] flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">Feedback Inteligente</CardTitle>
                <Badge className="gap-1 bg-[#fff3d6] text-[#7a5300] dark:bg-yellow-900/30 dark:text-yellow-400 border-0">
                  <Sparkles className="h-3 w-3" />
                  IA
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Análise pedagógica gerada por GPT-4o-mini
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 mt-6">
        {/* Overall Analysis */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[#2f2a8f]" />
            <h3 className="text-lg font-semibold">Visão Geral</h3>
          </div>
          <p className="text-muted-foreground leading-relaxed" data-testid="text-overall-analysis">
            {feedback.overallAnalysis}
          </p>
        </div>

        {/* Accordion for Details */}
        <Accordion type="multiple" className="w-full" data-testid="accordion-feedback-details">
          {/* Strengths */}
          {feedback.strengths && feedback.strengths.length > 0 && (
            <AccordionItem value="strengths">
              <AccordionTrigger className="hover:no-underline" data-testid="trigger-strengths">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#1aa15c] flex items-center justify-center">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold">Pontos Fortes</span>
                  <Badge variant="outline" className="ml-2">{feedback.strengths.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-3 mt-2">
                  {feedback.strengths.map((strength, index) => (
                    <li key={index} className="flex gap-3" data-testid={`text-strength-${index}`}>
                      <TrendingUp className="h-5 w-5 text-[#1aa15c] flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{strength}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Weaknesses */}
          {feedback.weaknesses && feedback.weaknesses.length > 0 && (
            <AccordionItem value="weaknesses">
              <AccordionTrigger className="hover:no-underline" data-testid="trigger-weaknesses">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#ff8c1a] flex items-center justify-center">
                    <TrendingDown className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold">Oportunidades de Aprendizado</span>
                  <Badge variant="outline" className="ml-2">{feedback.weaknesses.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-3 mt-2">
                  {feedback.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex gap-3" data-testid={`text-weakness-${index}`}>
                      <Info className="h-5 w-5 text-[#ff8c1a] flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Suggestions */}
          {feedback.suggestions && feedback.suggestions.length > 0 && (
            <AccordionItem value="suggestions">
              <AccordionTrigger className="hover:no-underline" data-testid="trigger-suggestions">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#1447e6] flex items-center justify-center">
                    <Lightbulb className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold">Sugestões para Reflexão</span>
                  <Badge variant="outline" className="ml-2">{feedback.suggestions.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-3 mt-2">
                  {feedback.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex gap-3" data-testid={`text-suggestion-${index}`}>
                      <Lightbulb className="h-5 w-5 text-[#1447e6] flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Literature Recommendations */}
          {feedback.literatureRecommendations && feedback.literatureRecommendations.length > 0 && (
            <AccordionItem value="literature">
              <AccordionTrigger className="hover:no-underline" data-testid="trigger-literature">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#2f2a8f] flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold">Leituras Recomendadas</span>
                  <Badge variant="outline" className="ml-2">{feedback.literatureRecommendations.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 mt-2">
                  {feedback.literatureRecommendations.map((book, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border bg-card"
                      data-testid={`card-literature-${index}`}
                    >
                      <div className="flex items-start gap-3">
                        <BookOpen className="h-5 w-5 text-[#2f2a8f] flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <p className="font-medium" data-testid={`text-book-title-${index}`}>
                            {book.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1" data-testid={`text-book-author-${index}`}>
                            {book.author}
                            {book.chapter && ` - ${book.chapter}`}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2 italic" data-testid={`text-book-reason-${index}`}>
                            {book.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        <Alert data-testid="alert-socratic-method" className="border-[#7c3aed]/30 bg-[#7c3aed]/5">
          <Sparkles className="h-4 w-4 text-[#7c3aed]" />
          <AlertDescription className="text-xs">
            <strong>Método Socrático:</strong> Este feedback usa perguntas reflexivas para estimular seu pensamento crítico. 
            Não esperamos respostas prontas, mas que você investigue, discuta com sua equipe e chegue às suas próprias conclusões. 
            O aprendizado acontece quando você mesmo descobre as respostas!
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
