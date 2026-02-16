"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, FileText, MessageSquare, Activity, Database, Shield,
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, XCircle,
  PlayCircle, Zap, Timer, Gauge
} from "lucide-react";
import type {
  AdminStats, MetricsResponse, MetricsSummary, CacheMetricsResponse,
  CacheSummary, SecurityStats, SecurityEvent, MethodMetric, CacheMetric,
  PerformanceComparison, PerformanceSnapshot, SimulationResult,
  CachedSimulationMethodResult, UncachedSimulationMethodResult
} from "@/types";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<MetricsResponse | null>(null);
  const [performanceSummary, setPerformanceSummary] = useState<MetricsSummary | null>(null);
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetricsResponse | null>(null);
  const [cacheSummary, setCacheSummary] = useState<CacheSummary | null>(null);
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [comparison, setComparison] = useState<PerformanceComparison | null>(null);
  const [latestBaseline, setLatestBaseline] = useState<PerformanceSnapshot | null>(null);
  const [latestPostCache, setLatestPostCache] = useState<PerformanceSnapshot | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isComparisonLoading, setIsComparisonLoading] = useState(false);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === "performance" && !performanceMetrics) {
      loadPerformanceData();
    } else if (activeTab === "cache" && !cacheMetrics) {
      loadCacheData();
    } else if (activeTab === "security" && !securityStats) {
      loadSecurityData();
    } else if (activeTab === "comparison" && !comparison) {
      loadComparisonData();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await api.admin.getStats();
      if (response.data) {
        setStats(response.data);
      }
    } catch (err: any) {
      setError(err.errorMessage || "Failed to load statistics");
      toast.error("Failed to load dashboard statistics");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPerformanceData = async () => {
    try {
      const [metricsRes, summaryRes] = await Promise.all([
        api.metrics.getPerformanceMetrics(),
        api.metrics.getPerformanceSummary()
      ]);
      if (metricsRes.data) setPerformanceMetrics(metricsRes.data);
      if (summaryRes.data) setPerformanceSummary(summaryRes.data);
    } catch (err: any) {
      toast.error("Failed to load performance metrics");
    }
  };

  const loadCacheData = async () => {
    try {
      const [metricsRes, summaryRes] = await Promise.all([
        api.metrics.getCacheMetrics(),
        api.metrics.getCacheSummary()
      ]);
      if (metricsRes.data) setCacheMetrics(metricsRes.data);
      if (summaryRes.data) setCacheSummary(summaryRes.data);
    } catch (err: any) {
      toast.error("Failed to load cache metrics");
    }
  };

  const loadSecurityData = async () => {
    try {
      const [statsRes, eventsRes] = await Promise.all([
        api.security.getStats(),
        api.security.getEvents(0, 10)
      ]);
      if (statsRes.data) setSecurityStats(statsRes.data);
      if (eventsRes.data?.content) setSecurityEvents(eventsRes.data.content);
    } catch (err: any) {
      toast.error("Failed to load security audit data");
    }
  };

  const loadComparisonData = async () => {
    setIsComparisonLoading(true);
    try {
      const [baselineRes, postCacheRes] = await Promise.all([
        api.metrics.getLatestBaseline().catch(() => null),
        api.metrics.getLatestPostCache().catch(() => null)
      ]);
      if (baselineRes?.data) setLatestBaseline(baselineRes.data);
      if (postCacheRes?.data) setLatestPostCache(postCacheRes.data);

      // Try to load comparison if both exist
      if (baselineRes?.data && postCacheRes?.data) {
        const comparisonRes = await api.metrics.getDatabaseComparison().catch(() => null);
        if (comparisonRes?.data) setComparison(comparisonRes.data);
      }
    } catch (err: any) {
      // Silently handle - no baseline/postcache saved yet
    } finally {
      setIsComparisonLoading(false);
    }
  };

  const handleSaveBaseline = async () => {
    try {
      const res = await api.metrics.saveBaseline();
      if (res.data) {
        setLatestBaseline(res.data);
        setComparison(null); // Reset comparison when new baseline is saved
        toast.success("Baseline saved and metrics reset");
      }
    } catch (err: any) {
      toast.error(err.errorMessage || "Failed to save baseline");
    }
  };

  const handleSavePostCache = async () => {
    try {
      const res = await api.metrics.savePostCache();
      if (res.data) {
        setLatestPostCache(res.data);
        toast.success("Post-cache snapshot saved");
        // Automatically load comparison
        const comparisonRes = await api.metrics.getDatabaseComparison().catch(() => null);
        if (comparisonRes?.data) setComparison(comparisonRes.data);
      }
    } catch (err: any) {
      toast.error(err.errorMessage || "Failed to save post-cache snapshot");
    }
  };

  const handleRefreshComparison = async () => {
    setIsComparisonLoading(true);
    try {
      const comparisonRes = await api.metrics.getDatabaseComparison();
      if (comparisonRes.data) {
        setComparison(comparisonRes.data);
        toast.success("Comparison refreshed");
      }
    } catch (err: any) {
      toast.error(err.errorMessage || "Failed to load comparison");
    } finally {
      setIsComparisonLoading(false);
    }
  };

  const handleResetPerformanceMetrics = async () => {
    try {
      await api.metrics.resetPerformanceMetrics();
      toast.success("Performance metrics reset successfully");
      loadPerformanceData();
    } catch (err: any) {
      toast.error("Failed to reset performance metrics");
    }
  };

  const handleResetCacheMetrics = async () => {
    try {
      await api.metrics.resetCacheMetrics();
      toast.success("Cache metrics reset successfully");
      loadCacheData();
    } catch (err: any) {
      toast.error("Failed to reset cache metrics");
    }
  };

  const handleExportMetrics = async () => {
    try {
      await api.metrics.exportAllMetrics();
      toast.success("Metrics exported successfully");
    } catch (err: any) {
      toast.error("Failed to export metrics");
    }
  };

  const handleClearSecurityTracking = async () => {
    try {
      await api.security.clearTracking();
      toast.success("Security tracking cleared successfully");
      loadSecurityData();
    } catch (err: any) {
      toast.error("Failed to clear security tracking");
    }
  };

  const handleRunSimulation = async () => {
    setIsSimulationRunning(true);
    try {
      const res = await api.metrics.runSimulation();
      if (res.data) {
        setSimulationResult(res.data);
        toast.success(`Simulation complete! ${res.data.summary.totalMethodsSimulated} methods tested`);
      }
    } catch (err: any) {
      toast.error(err.errorMessage || "Failed to run simulation");
    } finally {
      setIsSimulationRunning(false);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers ?? 0,
      description: "Registered users",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Posts",
      value: stats?.totalPosts ?? 0,
      description: "Published posts",
      icon: FileText,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Total Comments",
      value: stats?.totalComments ?? 0,
      description: "User comments",
      icon: MessageSquare,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  const sessionCards = stats?.sessionStats ? [
    {
      title: "Active Sessions",
      value: stats.sessionStats.activeSessions,
      description: "Currently active user sessions",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Revoked Tokens",
      value: stats.sessionStats.revokedTokens,
      description: "Total revoked access tokens",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ] : [];

  const getMetricsArray = (): MethodMetric[] => {
    if (!performanceMetrics?.metrics) return [];
    if (Array.isArray(performanceMetrics.metrics)) {
      return performanceMetrics.metrics;
    }
    return Object.values(performanceMetrics.metrics);
  };

  const getCacheArray = (): CacheMetric[] => {
    if (!cacheMetrics?.caches) return [];
    if (Array.isArray(cacheMetrics.caches)) {
      return cacheMetrics.caches;
    }
    return Object.values(cacheMetrics.caches);
  };

  const formatHitRate = (rate: string | number): string => {
    if (typeof rate === 'number') return `${rate.toFixed(2)}%`;
    return rate;
  };

  const getEventIcon = (eventType: string, success: boolean) => {
    if (eventType.includes('BRUTE_FORCE') || eventType.includes('ACCESS_DENIED')) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getEventBadgeColor = (eventType: string): string => {
    if (eventType.includes('SUCCESS')) return 'bg-green-500/10 text-green-500';
    if (eventType.includes('FAILURE')) return 'bg-red-500/10 text-red-500';
    if (eventType.includes('BRUTE_FORCE')) return 'bg-red-500/10 text-red-500';
    if (eventType.includes('ACCESS_DENIED')) return 'bg-orange-500/10 text-orange-500';
    return 'bg-blue-500/10 text-blue-500';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor platform statistics, performance, and security
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {statCards.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-md p-2 ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-foreground">
                        {stat.value.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stat.description}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {stats?.sessionStats && (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-foreground">Session Statistics</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {sessionCards.map((stat) => (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <div className={`rounded-md p-2 ${stat.bgColor}`}>
                        <div className={`h-3 w-3 rounded-full ${stat.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <Skeleton className="h-8 w-20" />
                      ) : (
                        <>
                          <div className="text-2xl font-bold text-foreground">
                            {stat.value.toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {stat.description}
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <a
                  href="/admin/posts"
                  className="flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted"
                >
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-foreground">Manage Posts</div>
                    <div className="text-sm text-muted-foreground">
                      View, edit, or delete posts
                    </div>
                  </div>
                </a>
                <a
                  href="/admin/users"
                  className="flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted"
                >
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-foreground">Manage Users</div>
                    <div className="text-sm text-muted-foreground">
                      View user accounts and activity
                    </div>
                  </div>
                </a>
                <a
                  href="/admin/comments"
                  className="flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted"
                >
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-foreground">
                      Manage Comments
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Moderate user comments
                    </div>
                  </div>
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Info</CardTitle>
                <CardDescription>Platform information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Platform</span>
                  <span className="font-medium text-foreground">DevBlog</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">API Version</span>
                  <span className="font-medium text-foreground">v1.0</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Backend URL</span>
                  <span className="font-medium text-foreground">localhost:8080</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium text-foreground">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="performance" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Performance Metrics</h2>
              <p className="text-muted-foreground">Monitor method execution performance</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportMetrics}>
                Export
              </Button>
              <Button variant="destructive" size="sm" onClick={handleResetPerformanceMetrics}>
                Reset
              </Button>
            </div>
          </div>

          {performanceSummary && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {performanceSummary.totalMethodsMonitored}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Executions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {performanceSummary.totalExecutions.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg Execution Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {typeof performanceSummary.overallAverageExecutionTime === 'number'
                      ? `${performanceSummary.overallAverageExecutionTime.toFixed(2)} ms`
                      : performanceSummary.overallAverageExecutionTime}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {performanceSummary.overallSuccessRate
                      ? `${performanceSummary.overallSuccessRate.toFixed(2)}%`
                      : 'N/A'}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Method Metrics</CardTitle>
              <CardDescription>Detailed performance by method</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getMetricsArray().map((metric) => (
                  <div key={metric.methodName} className="rounded-lg border border-border p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <div className="font-medium text-foreground">{metric.methodName}</div>
                        <div className="text-sm text-muted-foreground">
                          {metric.totalCalls} calls • {metric.successfulCalls} successful • {metric.failedCalls} failed
                        </div>
                      </div>
                      {metric.successRate !== undefined && (
                        <Badge variant={metric.successRate > 95 ? "default" : "destructive"}>
                          {metric.successRate.toFixed(2)}% success
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Avg Time</div>
                        <div className="font-medium text-foreground">{metric.averageExecutionTime.toFixed(2)} ms</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Min Time</div>
                        <div className="font-medium text-foreground">{metric.minExecutionTime} ms</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Max Time</div>
                        <div className="font-medium text-foreground">{metric.maxExecutionTime} ms</div>
                      </div>
                    </div>
                  </div>
                ))}
                {getMetricsArray().length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No performance metrics available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Cache Metrics</h2>
              <p className="text-muted-foreground">Monitor cache performance and hit rates</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleResetCacheMetrics}>
              Reset
            </Button>
          </div>

          {cacheSummary && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Caches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {cacheSummary.totalCaches}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Hit Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {formatHitRate(cacheSummary.overallHitRate)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {cacheSummary.totalRequests.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Evictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {cacheSummary.totalEvictions}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {cacheSummary?.bestPerformingCache && cacheSummary?.worstPerformingCache && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-500">
                    Best Performing Cache
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-foreground">
                    {cacheSummary.bestPerformingCache.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatHitRate(cacheSummary.bestPerformingCache.hitRate)} hit rate
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-500">
                    Worst Performing Cache
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-foreground">
                    {cacheSummary.worstPerformingCache.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatHitRate(cacheSummary.worstPerformingCache.hitRate)} hit rate
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Cache Details</CardTitle>
              <CardDescription>Individual cache performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getCacheArray().map((cache) => (
                  <div key={cache.cacheName} className="rounded-lg border border-border p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <div className="font-medium text-foreground">{cache.cacheName}</div>
                        <div className="text-sm text-muted-foreground">
                          {cache.hits} hits • {cache.misses} misses • {cache.totalRequests} total
                        </div>
                      </div>
                      <Badge>
                        {formatHitRate(cache.hitRate)} hit rate
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Puts</div>
                        <div className="font-medium text-foreground">{cache.puts}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Evictions</div>
                        <div className="font-medium text-foreground">{cache.evictions}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Clears</div>
                        <div className="font-medium text-foreground">{cache.clears}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Miss Rate</div>
                        <div className="font-medium text-foreground">{formatHitRate(cache.missRate)}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {getCacheArray().length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No cache metrics available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Security Audit</h2>
              <p className="text-muted-foreground">Monitor security events and threats</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleClearSecurityTracking}>
              Clear Tracking
            </Button>
          </div>

          {securityStats && (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Successful Sign-ins (24h)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div className="text-2xl font-bold text-foreground">
                        {securityStats.sign_in_success_24h}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Failed Sign-ins (24h)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <div className="text-2xl font-bold text-foreground">
                        {securityStats.sign_in_failure_24h}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Access Denied (24h)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <div className="text-2xl font-bold text-foreground">
                        {securityStats.access_denied_24h}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Brute Force Suspected (24h)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-red-500" />
                      <div className="text-2xl font-bold text-foreground">
                        {securityStats.brute_force_suspected_24h}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Token Validation Failures
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {securityStats.token_validation_failure_24h}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Tracked Failed IPs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {securityStats.trackedFailedIps}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Tracked Failed Emails
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {securityStats.trackedFailedEmails}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>Latest 10 security audit logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityEvents.map((event) => (
                  <div key={event.id} className="rounded-lg border border-border p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getEventIcon(event.eventType, event.success)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {event.eventType.replace(/_/g, ' ')}
                            </span>
                            <Badge className={getEventBadgeColor(event.eventType)}>
                              {event.eventType}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {event.email || event.username || 'Unknown user'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-sm text-foreground">{event.details}</div>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">IP: </span>
                        <span className="font-medium text-foreground">{event.ipAddress}</span>
                      </div>
                      {event.endpoint && (
                        <div>
                          <span className="text-muted-foreground">Endpoint: </span>
                          <span className="font-medium text-foreground">
                            {event.method} {event.endpoint}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {securityEvents.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No security events recorded
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulation" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Cache Performance Simulation</h2>
              <p className="text-muted-foreground">Run automated PRE_CACHE vs POST_CACHE performance tests</p>
            </div>
            <Button
              onClick={handleRunSimulation}
              disabled={isSimulationRunning}
              className="gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              {isSimulationRunning ? "Running..." : "Run Full Simulation"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>How Simulation Works</CardTitle>
              <CardDescription>Understanding the automated cache performance test</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="outline" className="bg-red-500/10 text-red-500">PRE-CACHE</Badge>
                    <span className="font-medium text-foreground">Without Cache</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cache is cleared before each call. Every request hits the database, measuring baseline performance.
                    Runs 25 iterations to get average times.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-500">POST-CACHE</Badge>
                    <span className="font-medium text-foreground">With Cache</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    First call populates cache (cache miss), subsequent calls hit cache (cache hits).
                    Demonstrates real-world cached performance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {isSimulationRunning && (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin">
                  <Gauge className="h-12 w-12 text-primary" />
                </div>
                <p className="text-lg font-medium text-foreground">Running simulation...</p>
                <p className="text-sm text-muted-foreground">Testing all cached methods with 25 iterations each</p>
              </CardContent>
            </Card>
          )}

          {simulationResult && !isSimulationRunning && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Simulation Summary</CardTitle>
                  <CardDescription>
                    Completed at {new Date(simulationResult.simulationEndTime).toLocaleString()}
                    ({simulationResult.iterations} iterations per method)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-5">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Methods Tested
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                          {simulationResult.summary.totalMethodsSimulated}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Cached Methods
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-2xl font-bold text-foreground">
                            {simulationResult.summary.cachedMethods}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Avg PRE-CACHE
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                          {simulationResult.summary.overallAvgPreCacheMs} ms
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Avg POST-CACHE
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                          {simulationResult.summary.overallAvgPostCacheMs} ms
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Overall Improvement
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-yellow-500" />
                          <span className="text-2xl font-bold text-green-500">
                            {simulationResult.summary.overallImprovementPercent}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {simulationResult.summary.recommendation && (
                    <div className="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                      <p className="text-sm text-foreground">{simulationResult.summary.recommendation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Method Results</CardTitle>
                  <CardDescription>Detailed performance comparison per method</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {simulationResult.methodResults.map((result) => (
                      <div key={result.method} className="rounded-lg border border-border p-4">
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{result.method}</span>
                              {result.cached ? (
                                <Badge className="bg-green-500/10 text-green-500">Cached</Badge>
                              ) : (
                                <Badge variant="outline">Not Cached</Badge>
                              )}
                            </div>
                            {!result.cached && (
                              <p className="mt-1 text-xs text-muted-foreground">{result.note}</p>
                            )}
                          </div>
                          {result.cached && (
                            <Badge className="bg-yellow-500/10 text-yellow-500 gap-1">
                              <Zap className="h-3 w-3" />
                              {(result as CachedSimulationMethodResult).improvement.speedupFactor} faster
                            </Badge>
                          )}
                        </div>

                        {result.cached ? (() => {
                          const cached = result as CachedSimulationMethodResult;
                          return (
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded border border-red-500/20 bg-red-500/5 p-3">
                              <div className="mb-1 flex items-center gap-2 text-red-500">
                                <Timer className="h-4 w-4" />
                                <span className="text-xs font-medium">PRE-CACHE (No Cache)</span>
                              </div>
                              <div className="text-lg font-bold text-foreground">
                                {cached.preCache.avgMs.toFixed(1)} ms
                                <span className="text-xs font-normal text-muted-foreground"> avg</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Min: {cached.preCache.minMs} ms • Max: {cached.preCache.maxMs} ms
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Times: [{cached.preCache.timesMs.join(', ')}]
                              </div>
                            </div>

                            <div className="rounded border border-green-500/20 bg-green-500/5 p-3">
                              <div className="mb-1 flex items-center gap-2 text-green-500">
                                <Zap className="h-4 w-4" />
                                <span className="text-xs font-medium">POST-CACHE (With Cache)</span>
                              </div>
                              <div className="text-lg font-bold text-foreground">
                                {cached.postCache.cacheHitAvgMs.toFixed(1)} ms
                                <span className="text-xs font-normal text-muted-foreground"> cache hit avg</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Cache miss: {cached.postCache.cacheMissTimeMs} ms
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Hit times: [{cached.postCache.cacheHitTimesMs.join(', ')}]
                              </div>
                            </div>

                            <div className="rounded border border-yellow-500/20 bg-yellow-500/5 p-3">
                              <div className="mb-1 flex items-center gap-2 text-yellow-500">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-xs font-medium">IMPROVEMENT</span>
                              </div>
                              <div className="text-lg font-bold text-green-500">
                                {cached.improvement.avgTimeReductionPercent}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Avg reduction: {cached.improvement.avgTimeReductionMs.toFixed(1)} ms
                              </div>
                              <div className="mt-1 text-xs font-medium text-yellow-500">
                                {cached.improvement.speedupFactor}
                              </div>
                            </div>
                          </div>
                          );
                        })() : (() => {
                          const uncached = result as UncachedSimulationMethodResult;
                          return (
                          <div className="rounded border border-muted bg-muted/20 p-3">
                            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                              <Timer className="h-4 w-4" />
                              <span className="text-xs font-medium">DATABASE PERFORMANCE (Baseline)</span>
                            </div>
                            <div className="text-lg font-bold text-foreground">
                              {uncached.preCacheAvgMs.toFixed(1)} ms
                              <span className="text-xs font-normal text-muted-foreground"> avg</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Min: {uncached.preCacheMinMs} ms • Max: {uncached.preCacheMaxMs} ms
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              Times: [{uncached.preCacheTimesMs.join(', ')}]
                            </div>
                          </div>
                          );
                        })()}
                      </div>
                    ))}

                    {simulationResult.methodResults.length === 0 && (
                      <div className="py-8 text-center text-muted-foreground">
                        No simulation results available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {!simulationResult && !isSimulationRunning && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <PlayCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">No simulation run yet</p>
                <p className="text-sm">Click "Run Full Simulation" to test cache performance for all methods</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Performance Comparison</h2>
              <p className="text-muted-foreground">Compare pre-cache vs post-cache performance</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefreshComparison} disabled={isComparisonLoading}>
              {isComparisonLoading ? "Loading..." : "Refresh"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Comparison Workflow</CardTitle>
              <CardDescription>
                Follow these steps to compare pre-cache vs post-cache performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge>Step 1</Badge>
                    <span className="font-medium text-foreground">Reset & Run Tests</span>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Reset metrics and run your test requests without cache warm-up
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleResetPerformanceMetrics}
                  >
                    Reset Metrics
                  </Button>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge>Step 2</Badge>
                    <span className="font-medium text-foreground">Save Baseline</span>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Save current metrics as PRE_CACHE baseline (auto-resets metrics)
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={handleSaveBaseline}
                  >
                    Save Baseline
                  </Button>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge>Step 3</Badge>
                    <span className="font-medium text-foreground">Run & Save Post-Cache</span>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Run same tests with cache enabled, then save POST_CACHE snapshot
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={handleSavePostCache}
                  >
                    Save Post-Cache
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Latest Baseline (PRE_CACHE)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {latestBaseline ? (
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-foreground">
                          {new Date(latestBaseline.timestamp).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {latestBaseline.totalMethodsMonitored} methods • {latestBaseline.totalExecutions} executions
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Avg: {latestBaseline.overallAverageExecutionTime.toFixed(2)} ms
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No baseline saved yet</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Latest Post-Cache (POST_CACHE)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {latestPostCache ? (
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-foreground">
                          {new Date(latestPostCache.timestamp).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {latestPostCache.totalMethodsMonitored} methods • {latestPostCache.totalExecutions} executions
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Avg: {latestPostCache.overallAverageExecutionTime.toFixed(2)} ms
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No post-cache saved yet</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {comparison && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Comparison Summary</CardTitle>
                  <CardDescription>
                    Overall improvement from {comparison.preCacheFile}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-5">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {comparison.summary.methodsCompared}
                      </div>
                      <div className="text-sm text-muted-foreground">Methods Compared</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">
                        {comparison.summary.methodsImproved}
                      </div>
                      <div className="text-sm text-muted-foreground">Improved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-500">
                        {comparison.summary.methodsDegraded}
                      </div>
                      <div className="text-sm text-muted-foreground">Degraded</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-muted-foreground">
                        {comparison.summary.methodsUnchanged}
                      </div>
                      <div className="text-sm text-muted-foreground">Unchanged</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">
                        {comparison.summary.overallAvgImprovementPercent}
                      </div>
                      <div className="text-sm text-muted-foreground">Overall Improvement</div>
                    </div>
                  </div>

                  {comparison.summary.bestImprovedMethod && (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                        <div className="flex items-center gap-2 text-green-500">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm font-medium">Best Improved</span>
                        </div>
                        <div className="mt-1 font-medium text-foreground">
                          {comparison.summary.bestImprovedMethod}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {comparison.summary.bestImprovementPercent} faster
                        </div>
                      </div>
                      {comparison.summary.worstMethod && (
                        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                          <div className="flex items-center gap-2 text-red-500">
                            <TrendingDown className="h-4 w-4" />
                            <span className="text-sm font-medium">Needs Attention</span>
                          </div>
                          <div className="mt-1 font-medium text-foreground">
                            {comparison.summary.worstMethod}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {comparison.summary.worstChangePercent}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Method Comparisons</CardTitle>
                  <CardDescription>Detailed comparison per method</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {comparison.methodComparisons.map((method) => (
                      <div key={method.methodName} className="rounded-lg border border-border p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <div className="font-medium text-foreground">{method.methodName}</div>
                          </div>
                          <Badge
                            className={method.improvement.improved
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-red-500/10 text-red-500'}
                          >
                            {method.improvement.improved ? (
                              <TrendingUp className="mr-1 h-3 w-3" />
                            ) : (
                              <TrendingDown className="mr-1 h-3 w-3" />
                            )}
                            {method.improvement.avgTimeReductionPercent}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded border border-border p-2">
                            <div className="text-xs font-medium text-muted-foreground">PRE-CACHE</div>
                            <div className="text-sm">
                              Avg: <span className="font-medium">{method.preCache.avgExecutionTime} ms</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Min: {method.preCache.minExecutionTime} ms • Max: {method.preCache.maxExecutionTime} ms
                            </div>
                          </div>
                          <div className="rounded border border-border p-2">
                            <div className="text-xs font-medium text-muted-foreground">POST-CACHE</div>
                            <div className="text-sm">
                              Avg: <span className="font-medium">{method.postCache.avgExecutionTime} ms</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Min: {method.postCache.minExecutionTime} ms • Max: {method.postCache.maxExecutionTime} ms
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {comparison.methodComparisons.length === 0 && (
                      <div className="py-8 text-center text-muted-foreground">
                        No method comparisons available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {!comparison && !isComparisonLoading && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Database className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No comparison data available yet.</p>
                <p className="text-sm">Follow the workflow above to capture and compare performance.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}