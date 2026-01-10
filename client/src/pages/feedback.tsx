import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, AlertCircle, BookOpen, Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

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

interface Round {
  id: string;
  roundNumber: number;
  status: string;
}

export default function FeedbackPage() {
  const { data: team, isLoading: teamLoading } = useQuery<any>({
    queryKey: ["/api/team/current"],
  });

  const { data: feedbacks = [], isLoading: feedbacksLoading } = useQuery<AiFeedback[]>({
    queryKey: ["/api/feedback", team?.id],
    queryFn: async () => {
      const res = await fetch(`/api/feedback/${team?.id}`);
      if (!res.ok) throw new Error("Failed to fetch feedbacks");
      return res.json();
    },
    enabled: !!team?.id,
  });

  const { data: rounds = [] } = useQuery<Round[]>({
    queryKey: ["/api/rounds"],
    enabled: !!team?.classId,
  });

  if (teamLoading || feedbacksLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma Equipe</CardTitle>
            <CardDescription>
              Você precisa fazer parte de uma equipe para ver feedbacks inteligentes.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Feedback Inteligente
          </h1>
          <p className="text-muted-foreground mt-2">
            Análises personalizadas das suas decisões de marketing
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nenhum Feedback Disponível</CardTitle>
            <CardDescription>
              Ainda não há feedbacks gerados para sua equipe. O professor gerará análises inteligentes após o encerramento das rodadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Sparkles className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground max-w-md">
                Quando um feedback for gerado, você verá uma análise educacional completa das suas decisões, 
                incluindo pontos fortes, oportunidades de melhoria e sugestões de literatura.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const feedbacksWithRounds = feedbacks.map(feedback => {
    const round = rounds.find(r => r.id === feedback.roundId);
    return { ...feedback, roundNumber: round?.roundNumber || 0 };
  }).sort((a, b) => b.roundNumber - a.roundNumber);

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-feedback">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          Feedback Inteligente
        </h1>
        <p className="text-muted-foreground mt-2">
          Análises personalizadas para impulsionar seu aprendizado em marketing
        </p>
      </div>

      <div className="grid gap-6">
        {feedbacksWithRounds.map((feedback) => (
          <Card key={feedback.id} className="overflow-hidden" data-testid={`feedback-card-${feedback.roundNumber}`}>
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Rodada {feedback.roundNumber}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Análise gerada em {new Date(feedback.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-sm">
                  Educacional
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {/* Overall Analysis */}
              <div className="space-y-3" data-testid="section-analysis">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Análise Geral
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {feedback.overallAnalysis}
                </p>
              </div>

              <Separator />

              {/* Strengths */}
              {feedback.strengths.length > 0 && (
                <div className="space-y-3" data-testid="section-strengths">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Pontos Fortes
                  </h3>
                  <ul className="space-y-2">
                    {feedback.strengths.map((strength, idx) => (
                      <li 
                        key={idx} 
                        className="flex gap-3 text-sm"
                        data-testid={`strength-${idx}`}
                      >
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="leading-relaxed">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Separator />

              {/* Weaknesses/Opportunities */}
              {feedback.weaknesses.length > 0 && (
                <div className="space-y-3" data-testid="section-weaknesses">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    Oportunidades de Melhoria
                  </h3>
                  <ul className="space-y-2">
                    {feedback.weaknesses.map((weakness, idx) => (
                      <li 
                        key={idx} 
                        className="flex gap-3 text-sm"
                        data-testid={`weakness-${idx}`}
                      >
                        <span className="text-amber-600 font-bold">?</span>
                        <span className="leading-relaxed text-muted-foreground">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Separator />

              {/* Suggestions */}
              {feedback.suggestions.length > 0 && (
                <div className="space-y-3" data-testid="section-suggestions">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-blue-600" />
                    Sugestões para Próximas Rodadas
                  </h3>
                  <ul className="space-y-2">
                    {feedback.suggestions.map((suggestion, idx) => (
                      <li 
                        key={idx} 
                        className="flex gap-3 text-sm"
                        data-testid={`suggestion-${idx}`}
                      >
                        <span className="text-blue-600 font-bold">→</span>
                        <span className="leading-relaxed text-muted-foreground">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Literature Recommendations */}
              {feedback.literatureRecommendations.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-4" data-testid="section-literature">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-purple-600" />
                      Literatura Recomendada
                    </h3>
                    <div className="grid gap-4">
                      {feedback.literatureRecommendations.map((book, idx) => (
                        <Card key={idx} className="bg-muted/30" data-testid={`literature-${idx}`}>
                          <CardContent className="pt-4">
                            <div className="space-y-2">
                              <div>
                                <p className="font-semibold text-sm">{book.title}</p>
                                <p className="text-xs text-muted-foreground">{book.author}</p>
                              </div>
                              {book.chapter && (
                                <Badge variant="outline" className="text-xs">
                                  {book.chapter}
                                </Badge>
                              )}
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {book.reason}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
