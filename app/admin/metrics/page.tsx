"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Clock, BarChart3, Loader2, RefreshCw, Download, Trash2, CheckCircle, XCircle, Database, Zap } from "lucide-react";
import { toast } from "sonner";
import type {
  MetricsResponse,
  MetricsSummary,
  MethodMetric,
  CacheMetricsResponse,
  CacheSummary,
  RuntimeMetricsResponse,
} from "@/types";

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetricsResponse | null>(null);
  const [cacheSummary, setCacheSummary] = useState<CacheSummary | null>(null);
  const [runtimeMetrics, setRuntimeMetrics] = useState<RuntimeMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isRuntimeExporting, setIsRuntimeExporting] = useState(false);
  const [isRuntimeResetting, setIsRuntimeResetting] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const [metricsRes, summaryRes, cacheMetricsRes, cacheSummaryRes, runtimeRes] = await Promise.all([
        api.metrics.getPerformanceMetrics(),
        api.metrics.getPerformanceSummary(),
        api.metrics.getCacheMetrics(),
        api.metrics.getCacheSummary(),
        api.metrics.getRuntimeMetrics(),
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
      if (runtimeRes.data) {
        setRuntimeMetrics(runtimeRes.data);
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
      await api.metrics.exportAllMetrics();
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
      await Promise.all([
        api.metrics.resetPerformanceMetrics(),
        api.metrics.resetCacheMetrics(),
      ]);
      toast.success("Metrics reset successfully");
      await loadMetrics();
    } catch (error) {
      console.log("Error resetting metrics:", error);
      toast.error("Failed to reset metrics");
    } finally {
      setIsResetting(false);
    }
  };

  const handleRuntimeExport = async () => {
    setIsRuntimeExporting(true);
    try {
      await api.metrics.exportRuntimeMetrics();
      toast.success("Runtime metrics exported to CSV");
    } catch (error) {
      console.log("Error exporting runtime metrics:", error);
      toast.error("Failed to export runtime metrics");
    } finally {
      setIsRuntimeExporting(false);
    }
  };

  const handleRuntimeReset = async () => {
    setIsRuntimeResetting(true);
    try {
      await api.metrics.resetRuntimeMetrics();
      toast.success("Runtime metrics reset successfully");
      await loadMetrics();
    } catch (error) {
      console.log("Error resetting runtime metrics:", error);
      toast.error("Failed to reset runtime metrics");
    } finally {
      setIsRuntimeResetting(false);
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
  const getMetricsArray = (): MethodMetric[] => {
    if (!metrics?.metrics) return [];

    const methodMetrics = Array.isArray(metrics.metrics)
      ? metrics.metrics
      : Object.values(metrics.metrics);

    return methodMetrics.sort((a, b) => b.totalCalls - a.totalCalls);
  };

  const getCacheArray = () => {
    if (!cacheMetrics?.caches) return [];
    return Array.isArray(cacheMetrics.caches)
      ? cacheMetrics.caches
      : Object.values(cacheMetrics.caches);
  };

  const getRateValue = (rate: string | number) => {
    if (typeof rate === "number") return rate;
    return parseFloat(rate.replace("%", ""));
  };

  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  const formatThroughput = (value: number) => `${value.toFixed(2)} req/s`;

  const getEndpointRequestCount = (endpoint: RuntimeMetricsResponse["endpoints"][number]) => {
    return endpoint.requestCount ?? endpoint.totalRequests ?? 0;
  };

  const getEndpointErrorCount = (endpoint: RuntimeMetricsResponse["endpoints"][number]) => {
    return endpoint.errorCount ?? endpoint.errorRequests ?? 0;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">API Metrics</h1>
          <p className="mt-1 text-muted-foreground">Monitor API performance and usage statistics</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 sm:flex-none"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleReset}
            disabled={isResetting}
            className="flex-1 sm:flex-none"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
      {runtimeMetrics && (
        <div>
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-6 w-6" />
              Runtime API Metrics
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRuntimeExport}
                disabled={isRuntimeExporting}
                className="flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRuntimeReset}
                disabled={isRuntimeResetting}
                className="flex-1 sm:flex-none"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{runtimeMetrics.totalRequests.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Since process start</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Latency</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{runtimeMetrics.averageLatencyMs.toFixed(2)}ms</div>
                <p className="text-xs text-muted-foreground">
                  Min {runtimeMetrics.minLatencyMs}ms · Max {runtimeMetrics.maxLatencyMs}ms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Throughput</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatThroughput(runtimeMetrics.throughputReqPerSec)}</div>
                <p className="text-xs text-muted-foreground">
                  Last 60s: {formatThroughput(runtimeMetrics.throughputLast60SecondsReqPerSec)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{formatPercent(runtimeMetrics.errorRatePercent)}</div>
                <p className="text-xs text-muted-foreground">{runtimeMetrics.totalErrors} total errors</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Runtime Endpoint Details</CardTitle>
              <CardDescription>Per-endpoint latency, throughput, and errors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(runtimeMetrics.endpoints || []).map((endpoint) => (
                  <div key={`${endpoint.endpoint}-${endpoint.method || 'ANY'}`} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-foreground">{endpoint.endpoint}</div>
                        {endpoint.method && (
                          <div className="text-xs text-muted-foreground mt-1">Method: {endpoint.method}</div>
                        )}
                      </div>
                      <Badge variant={endpoint.errorRatePercent > 1 ? "destructive" : "secondary"} className="w-fit">
                        {formatPercent(endpoint.errorRatePercent)} errors
                      </Badge>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Requests: </span>
                        <span className="font-medium">{getEndpointRequestCount(endpoint)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Errors: </span>
                        <span className="font-medium">{getEndpointErrorCount(endpoint)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg Latency: </span>
                        <span className="font-medium">{endpoint.averageLatencyMs.toFixed(2)}ms</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Throughput: </span>
                        <span className="font-medium">{formatThroughput(endpoint.throughputReqPerSec)}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {(!runtimeMetrics.endpoints || runtimeMetrics.endpoints.length === 0) && (
                  <div className="py-8 text-center text-muted-foreground">
                    No runtime endpoint metrics available
                  </div>
                )}
              </div>
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
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
      {cacheMetrics && getCacheArray().length > 0 && (
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
              {getCacheArray().map((cache) => (
                <div
                  key={cache.cacheName}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-sm font-mono font-medium">{cache.cacheName}</code>
                        <Badge variant={getRateValue(cache.hitRate) > 50 ? "default" : "secondary"}>
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
                        <span className={`font-medium ${getRateValue(cache.missRate) > 50 ? 'text-destructive' : ''}`}>
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      #{index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-sm font-mono font-medium truncate max-w-full">{method.methodName}</code>
                        <Badge variant={method.failedCalls > 0 ? "destructive" : "default"} className="shrink-0">
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
                        <span className="font-medium">{formatTime(method.totalExecutionTime ?? 0)}</span>
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
