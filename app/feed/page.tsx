"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AuthProvider } from "@/contexts/auth-context";
import { Header } from "@/components/header";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  RefreshCw,
  Zap,
  BarChart2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import type { Post, FeedPost, TrendingPost } from "@/types";

const toPost = (fp: FeedPost): Post => ({
  id: fp.postId, title: fp.title, body: fp.bodyPreview,
  author: fp.author, authorId: fp.authorId, tags: fp.tags,
  postedAt: fp.postedAt, lastUpdated: '', totalComments: fp.totalComments,
});

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

function FeedPage() {
  const [recent, setRecent] = useState<Post[]>([]);
  const [popular, setPopular] = useState<Post[]>([]);
  const [trending, setTrending] = useState<Post[]>([]);
  const [liveScores, setLiveScores] = useState<TrendingPost[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [isLiveLoading, setIsLiveLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveUpdatedAt, setLiveUpdatedAt] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setIsFeedLoading(true);
    try {
      const res = await api.feed.get(12);
      if (res.data) {
        setRecent((res.data.recentPosts ?? []).map(toPost));
        setPopular((res.data.popularPosts ?? []).map(toPost));
        setTrending((res.data.trendingPosts ?? []).map(toPost));
      }
    } catch {
      toast.error("Failed to load feed");
    } finally {
      setIsFeedLoading(false);
    }
  }, []);

  const loadLive = useCallback(async () => {
    setIsLiveLoading(true);
    try {
      const res = await api.feed.getTrendingLive(10);
      if (res.data) {
        setLiveScores(res.data.trendingPosts ?? []);
        setLiveUpdatedAt(res.data.snapshotTime ?? null);
      }
    } catch {
      // Live endpoint failing is non-fatal
    } finally {
      setIsLiveLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
    loadLive();
  }, [loadFeed, loadLive]);

  const handleRefreshTrending = async () => {
    setIsRefreshing(true);
    try {
      await api.feed.refreshTrending();
      toast.success("Trending scores refreshed");
      await loadLive();
    } catch {
      toast.error("Failed to refresh trending scores");
    } finally {
      setIsRefreshing(false);
    }
  };

  const PostGrid = ({ posts }: { posts: Post[] }) =>
    isFeedLoading ? (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    ) : posts.length === 0 ? (
      <div className="rounded-xl border border-dashed border-border py-20 text-center">
        <p className="text-muted-foreground">Nothing here yet.</p>
      </div>
    ) : (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground">Feed</h1>
          <p className="mt-1 text-muted-foreground">
            Your aggregated view of recent, popular, and trending posts.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-3">
          {/* Main feed tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="recent">
              <TabsList className="mb-6">
                <TabsTrigger value="recent" className="gap-2">
                  <Clock className="h-4 w-4" /> Recent
                </TabsTrigger>
                <TabsTrigger value="trending" className="gap-2">
                  <TrendingUp className="h-4 w-4" /> Trending
                </TabsTrigger>
                <TabsTrigger value="popular" className="gap-2">
                  <BarChart2 className="h-4 w-4" /> Popular
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recent">
                <PostGrid posts={recent} />
              </TabsContent>
              <TabsContent value="trending">
                <PostGrid posts={trending} />
              </TabsContent>
              <TabsContent value="popular">
                <PostGrid posts={popular} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Trending sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Zap className="h-4 w-4 text-yellow-500" /> Live Trending
                  </CardTitle>
                  {liveUpdatedAt && (
                    <CardDescription className="mt-0.5 text-xs">
                      Updated {new Date(liveUpdatedAt).toLocaleTimeString()}
                    </CardDescription>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefreshTrending}
                  disabled={isRefreshing || isLiveLoading}
                  title="Refresh trending scores"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                {isLiveLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 rounded-lg" />
                    ))}
                  </div>
                ) : liveScores.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No live scores available.
                  </p>
                ) : (
                  <ol className="divide-y divide-border">
                    {liveScores.map((item) => (
                      <li key={item.postId} className="flex items-center gap-3 py-3">
                        <span className="w-5 shrink-0 text-center text-xs font-bold text-muted-foreground">
                          {item.rank}
                        </span>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/posts/${item.postId}`}
                            className="line-clamp-1 text-sm font-medium text-foreground hover:underline"
                          >
                            {item.title}
                          </Link>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">
                              Score: {item.currentScore.toFixed(2)}
                            </span>
                            {item.scoreChange !== 0 && (
                              <span className={`text-xs font-medium ${item.scoreChange > 0 ? "text-green-500" : "text-destructive"}`}>
                                {item.scoreChange > 0 ? "+" : ""}{item.scoreChange.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <TrendIcon trend={item.trend} />
                          <Badge variant={TREND_BADGE[item.trend]} className="text-xs px-1.5 py-0">
                            {item.trend}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function FeedPageWrapper() {
  return (
    <AuthProvider>
      <FeedPage />
    </AuthProvider>
  );
}
