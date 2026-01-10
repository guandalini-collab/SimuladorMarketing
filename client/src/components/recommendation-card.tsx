import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

interface RecommendationCardProps {
  title: string;
  recommendations?: string[];
  isLoading: boolean;
  emptyMessage: string;
  testId: string;
}

export function RecommendationCard({
  title,
  recommendations,
  isLoading,
  emptyMessage,
  testId,
}: RecommendationCardProps) {
  if (isLoading) {
    return (
      <Card data-testid={`${testId}-loading`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card className="border-2 border-dashed" data-testid={`${testId}-empty`}>
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-indigo-200 dark:border-indigo-900" data-testid={testId}>
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-950/30 dark:to-cyan-950/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">
              {title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="list-disc list-inside space-y-2">
          {recommendations.map((recommendation, index) => (
            <li key={index} className="text-sm text-foreground" data-testid={`text-recommendation-${testId}-${index}`}>
              {recommendation}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
