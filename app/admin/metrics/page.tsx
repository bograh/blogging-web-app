"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Clock, BarChart3, Loader2, RefreshCw, Download, Trash2, CheckCircle, XCircle, Database, Zap } from "lucide-react";
import { toast } from "sonner";
import type { MetricsResponse, MetricsSummary, MethodMetric, CacheMetricsResponse, CacheSummary } from "@/types";

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetricsResponse | null>(null);
  const [cacheSummary, setCacheSummary] = useState<CacheSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const [metricsRes, summaryRes, cacheMetricsRes, cacheSummaryRes] = await Promise.all([
        api.metrics.getAll(),
        api.metrics.getSummary(),
        api.metrics.getCacheMetrics(),
        api.metrics.getCacheSummary(),
      ]);

      if (metricsRes.data) {
        setMetrics(metricsRes.data);
      }
      if (summaryRes.data) {
        setSummary(summaryRes.data);
      }
      if (cacheMetricsRes.data) {
        setCacheMetrics(cacheMetricsRes.data);
      }
      if (cacheSummaryRes.data) {
        setCacheSummary(cacheSummaryRes.data);
      }
    } catch (error) {
      console.log("Error loading metrics:", error);
      toast.error("Failed to load metrics");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMetrics();
    setIsRefreshing(false);
    toast.success("Metrics refreshed");
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await api.metrics.exportToLog();
      toast.success("Metrics exported to logs");
    } catch (error) {
      console.log("Error exporting metrics:", error);
      toast.error("Failed to export metrics");
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await api.metrics.reset();
      toast.success("Metrics reset successfully");
      await loadMetrics();
    } catch (error) {
      console.log("Error resetting metrics:", error);
      toast.error("Failed to reset metrics");
    } finally {
      setIsResetting(false);
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getSuccessRate = (metric: MethodMetric) => {
    if (metric.totalCalls === 0) return 0;
    return ((metric.successfulCalls / metric.totalCalls) * 100).toFixed(1);
  };

  // Convert metrics map to sorted array
  const getMetricsArray = () => {
    if (!metrics?.metrics) return [];
    return Object.entries(metrics.metrics)
      .map(([_, metric]) => metric)
      .sort((a, b) => b.totalCalls - a.totalCalls);
  };

  const metricsArray = getMetricsArray();
  const topMethods = metricsArray.slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">API Metrics</h1>
          <p className="mt-1 text-muted-foreground">Monitor API performance and usage statistics</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleReset}
            disabled={isResetting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalExecutions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Method calls</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Execution Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.overallAverageExecutionTime}</div>
              <p className="text-xs text-muted-foreground">Average latency</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Methods Monitored</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalMethodsMonitored}</div>
              <p className="text-xs text-muted-foreground">Active methods</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Failures</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{summary.totalFailures}</div>
              <p className="text-xs text-muted-foreground">Failed calls</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cache Metrics Summary */}
      {cacheSummary && (
        <div>
          <h2 className="mb-4 text-2xl font-bold text-foreground flex items-center gap-2">
            <Database className="h-6 w-6" />
            Cache Performance
          </h2>
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cacheSummary.totalRequests.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {cacheSummary.totalHits} hits · {cacheSummary.totalMisses} misses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Hit Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cacheSummary.overallHitRate}</div>
                <p className="text-xs text-muted-foreground">Cache efficiency</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Caches</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cacheSummary.totalCaches}</div>
                <p className="text-xs text-muted-foreground">{cacheSummary.totalPuts} puts total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Evictions</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{cacheSummary.totalEvictions}</div>
                <p className="text-xs text-muted-foreground">Cache evictions</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Individual Cache Metrics */}
      {cacheMetrics && cacheMetrics.caches && Object.keys(cacheMetrics.caches).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Cache Details
            </CardTitle>
            <CardDescription>Performance metrics for individual caches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.values(cacheMetrics.caches).map((cache) => (
                <div
                  key={cache.cacheName}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono font-medium">{cache.cacheName}</code>
                        <Badge variant={parseFloat(cache.hitRate) > 50 ? "default" : "secondary"}>
                          {cache.hitRate} hit rate
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {cache.hits} hits
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <XCircle className="h-3 w-3 text-destructive" />
                          {cache.misses} misses
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Requests: </span>
                        <span className="font-medium">{cache.totalRequests}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Puts: </span>
                        <span className="font-medium">{cache.puts}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Evictions: </span>
                        <span className="font-medium">{cache.evictions}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Clears: </span>
                        <span className="font-medium">{cache.clears}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Miss Rate: </span>
                        <span className={`font-medium ${parseFloat(cache.missRate) > 50 ? 'text-destructive' : ''}`}>
                          {cache.missRate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Methods */}
      {topMethods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Methods by Call Count
            </CardTitle>
            <CardDescription>Most frequently called methods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topMethods.map((method, index) => (
                <div
                  key={`${method.methodName}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono font-medium">{method.methodName}</code>
                        <Badge variant={method.failedCalls > 0 ? "destructive" : "default"}>
                          {getSuccessRate(method)}% success
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {method.totalCalls.toLocaleString()} calls · Avg {formatTime(method.averageExecutionTime)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Methods */}
      {metricsArray.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Methods</CardTitle>
            <CardDescription>Complete list of monitored methods and their performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metricsArray.map((method, index) => (
                <div
                  key={`${method.methodName}-${index}`}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-mono font-medium">{method.methodName}</code>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {method.successfulCalls}
                        </Badge>
                        {method.failedCalls > 0 && (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            {method.failedCalls}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Calls: </span>
                        <span className="font-medium">{method.totalCalls}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg: </span>
                        <span className="font-medium">{formatTime(method.averageExecutionTime)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Min: </span>
                        <span className="font-medium">{formatTime(method.minExecutionTime)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Max: </span>
                        <span className="font-medium">{formatTime(method.maxExecutionTime)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Time: </span>
                        <span className="font-medium">{formatTime(method.totalExecutionTime)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Success Rate: </span>
                        <span className={`font-medium ${method.failedCalls > 0 ? 'text-destructive' : 'text-green-500'}`}>
                          {getSuccessRate(method)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {metricsArray.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-center text-muted-foreground">
              No metrics data available yet. Start making API requests to see metrics.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
