"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Zap,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { TrendingPost } from "@/types";

const TrendIcon = ({ trend }: { trend: TrendingPost["trend"] }) => {
  if (trend === "UP") return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === "DOWN") return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const TREND_BADGE: Record<TrendingPost["trend"], "default" | "secondary" | "destructive"> = {
  UP: "default",
  DOWN: "destructive",
  STABLE: "secondary",
};

export default function AdminFeedPage() {
  const [scores, setScores] = useState<TrendingPost[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadLive();
  }, []);

  const loadLive = async () => {
    setIsLoading(true);
    try {
      const res = await api.feed.getTrendingLive(50);
      if (res.data) {
        setScores(res.data.trendingPosts ?? []);
        setGeneratedAt(res.data.snapshotTime ?? null);
      }
    } catch {
      toast.error("Failed to load live trending scores");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await api.feed.refreshTrending();
      toast.success("Trending snapshot refreshed");
      await loadLive();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "errorMessage" in err
          ? String((err as { errorMessage: unknown }).errorMessage)
          : "Failed to refresh trending scores";
      toast.error(msg);
    } finally {
      setIsRefreshing(false);
    }
  };

  const ups = scores.filter((s) => s.trend === "UP").length;
  const downs = scores.filter((s) => s.trend === "DOWN").length;
  const stable = scores.filter((s) => s.trend === "STABLE").length;

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Zap className="h-6 w-6 text-yellow-500" /> Feed Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor live trending scores and force-refresh the trending snapshot.
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing || isLoading}>
          {isRefreshing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Refreshing...</>
          ) : (
            <><RefreshCw className="mr-2 h-4 w-4" />Force Refresh Trending</>
          )}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rising</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl text-green-500">
              {isLoading ? <Skeleton className="h-8 w-12" /> : ups}
              <TrendingUp className="h-6 w-6" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Falling</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl text-destructive">
              {isLoading ? <Skeleton className="h-8 w-12" /> : downs}
              <TrendingDown className="h-6 w-6" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Stable</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl text-muted-foreground">
              {isLoading ? <Skeleton className="h-8 w-12" /> : stable}
              <Minus className="h-6 w-6" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Live scores table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Live Trending Scores</CardTitle>
            {generatedAt && (
              <CardDescription>
                Snapshot generated at {new Date(generatedAt).toLocaleString()}
              </CardDescription>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={loadLive} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Reload
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : scores.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No trending scores available. Try forcing a refresh.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Rank</th>
                    <th className="pb-3 pr-4 font-medium">Post</th>
                    <th className="pb-3 pr-4 font-medium">Score</th>
                    <th className="pb-3 pr-4 font-medium">Delta</th>
                    <th className="pb-3 font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {scores.map((item) => (
                    <tr key={item.postId} className="group">
                      <td className="py-3 pr-4 font-bold text-muted-foreground">
                        #{item.rank}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-medium text-foreground group-hover:underline">
                          {item.title}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          ID:{item.postId}
                        </span>
                      </td>
                      <td className="py-3 pr-4 tabular-nums">{item.currentScore.toFixed(3)}</td>
                      <td className="py-3 pr-4 tabular-nums">
                        {item.scoreChange !== undefined ? (
                          <span className={item.scoreChange > 0 ? "text-green-500" : item.scoreChange < 0 ? "text-destructive" : "text-muted-foreground"}>
                            {item.scoreChange > 0 ? "+" : ""}
                            {item.scoreChange.toFixed(3)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <TrendIcon trend={item.trend} />
                          <Badge
                            variant={TREND_BADGE[item.trend]}
                            className="px-1.5 py-0 text-xs"
                          >
                            {item.trend}
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
