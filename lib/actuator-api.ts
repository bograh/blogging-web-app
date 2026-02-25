import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
    ActuatorHealthResponse,
    ActuatorMetricResponse,
    ActuatorHttpExchangesResponse,
    JvmMetrics,
    HttpRequestStats,
    DbConnectionPoolMetrics,
    LogEventCounts,
    EndpointBreakdown,
    ServerUptime,
} from '@/types/actuator';
import {
    tokenManager,
    refreshAccessToken,
    isRefreshing,
    subscribeTokenRefresh,
    onTokenRefreshed
} from '@/lib/api';

// --- CONFIGURATION ---
export const ACTUATOR_BASE_URL =
    process.env.NEXT_PUBLIC_ACTUATOR_BASE_URL ?? 'http://localhost:8080/actuator';

const BYTES_PER_MB = 1_048_576;

const actuatorClient = axios.create({
    baseURL: ACTUATOR_BASE_URL,
    timeout: 15_000,
    withCredentials: true,
});

// Request interceptor: add auth header and proactively check for expiration
actuatorClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    let token = tokenManager.getToken();

    // Proactive refresh before the token actually expires
    if (token && tokenManager.isTokenExpired(token)) {
        if (!isRefreshing) {
            // Need to cast to any because of how 'let' exports work or just use the local state if it were shared
            // But importing from api.ts means we share the same state.
            // However, we can't re-assign isRefreshing because it's a let-export from another module (read-only)
            // So we have to rely on the shared logic in api.ts to handle the state.
            // Wait, let exports are read-only in the importing module.

            const newToken = await refreshAccessToken();
            if (newToken) {
                token = newToken;
            }
        } else {
            token = await new Promise<string>((resolve) => {
                subscribeTokenRefresh(resolve);
            });
        }
    }

    if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
});

// Response interceptor: handle reactive 401 errors
actuatorClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const newToken = await refreshAccessToken();
            if (newToken) {
                originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
                return actuatorClient(originalRequest);
            }
        }

        return Promise.reject(error);
    }
);

// --- LOW-LEVEL FETCH ---


async function fetchMetric(metricName: string, tags?: string): Promise<ActuatorMetricResponse> {
    const url = tags ? `/metrics/${metricName}?tag=${tags}` : `/metrics/${metricName}`;
    const response = await actuatorClient.get<ActuatorMetricResponse>(url);
    return response.data;
}

async function fetchMetricMultiTag(
    metricName: string,
    tags: string[],
): Promise<ActuatorMetricResponse> {
    const params = tags.map((t) => `tag=${t}`).join('&');
    const url = `/metrics/${metricName}?${params}`;
    const response = await actuatorClient.get<ActuatorMetricResponse>(url);
    return response.data;
}

function measurementValue(metric: ActuatorMetricResponse, statistic = 'VALUE'): number {
    const found = metric.measurements.find((m) => m.statistic === statistic);
    return found?.value ?? 0;
}

// --- HEALTH ---

export async function fetchHealth(): Promise<ActuatorHealthResponse> {
    const response = await actuatorClient.get<ActuatorHealthResponse>('/health');
    return response.data;
}

// --- JVM METRICS ---

export async function fetchJvmMetrics(): Promise<JvmMetrics> {
    const [heapUsed, heapMax, processCpu, systemCpu, liveThreads] = await Promise.all([
        fetchMetric('jvm.memory.used', 'area:heap'),
        fetchMetric('jvm.memory.max', 'area:heap'),
        fetchMetric('process.cpu.usage'),
        fetchMetric('system.cpu.usage'),
        fetchMetric('jvm.threads.live'),
    ]);

    const heapUsedBytes = measurementValue(heapUsed);
    const heapMaxBytes = measurementValue(heapMax);
    const heapUsedPercent = heapMaxBytes > 0 ? (heapUsedBytes / heapMaxBytes) * 100 : 0;

    return {
        memory: {
            heapUsedBytes,
            heapMaxBytes,
            heapUsedPercent: Math.round(heapUsedPercent * 10) / 10,
        },
        cpu: {
            processCpuUsage: Math.round(measurementValue(processCpu) * 1000) / 10,
            systemCpuUsage: Math.round(measurementValue(systemCpu) * 1000) / 10,
        },
        threads: {
            liveThreads: Math.round(measurementValue(liveThreads)),
        },
    };
}

// --- SERVER UPTIME ---

export async function fetchServerUptime(): Promise<ServerUptime> {
    const [startTime, uptime] = await Promise.all([
        fetchMetric('process.start.time'),
        fetchMetric('process.uptime'),
    ]);

    const startTimeSeconds = measurementValue(startTime);
    const uptimeSeconds = measurementValue(uptime);

    // Format uptime into human-readable string (e.g., "2d 4h 15m 30s")
    const d = Math.floor(uptimeSeconds / (3600 * 24));
    const h = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
    const m = Math.floor((uptimeSeconds % 3600) / 60);
    const s = Math.floor(uptimeSeconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0 || h > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);

    return {
        startTimeMs: startTimeSeconds * 1000,
        uptimeSeconds,
        uptimeFormatted: parts.join(' '),
    };
}

export function formatMegabytes(bytes: number): string {
    return `${(bytes / BYTES_PER_MB).toFixed(0)} MB`;
}

// --- HTTP REQUEST STATS ---

export async function fetchHttpRequestStats(): Promise<HttpRequestStats> {
    const allRequests = await fetchMetric('http.server.requests');

    const totalRequestCount = Math.round(measurementValue(allRequests, 'COUNT'));
    const totalResponseTimeSeconds = measurementValue(allRequests, 'TOTAL_TIME');
    const averageResponseTimeMs =
        totalRequestCount > 0
            ? Math.round((totalResponseTimeSeconds / totalRequestCount) * 1000 * 100) / 100
            : 0;

    // Use Spring outcome tags for 4xx / 5xx breakdown
    const [clientErrors, serverErrors] = await Promise.all([
        fetchMetric('http.server.requests', 'outcome:CLIENT_ERROR').catch(() => null),
        fetchMetric('http.server.requests', 'outcome:SERVER_ERROR').catch(() => null),
    ]);

    const errorCount4xx = clientErrors ? Math.round(measurementValue(clientErrors, 'COUNT')) : 0;
    const errorCount5xx = serverErrors ? Math.round(measurementValue(serverErrors, 'COUNT')) : 0;

    return {
        totalRequestCount,
        errorCount4xx,
        errorCount5xx,
        averageResponseTimeMs,
        requestRate: totalRequestCount,
    };
}

// --- DB CONNECTION POOL (HikariCP) ---

export async function fetchDbConnectionPoolMetrics(): Promise<DbConnectionPoolMetrics> {
    const [active, pending, max] = await Promise.all([
        fetchMetric('hikaricp.connections.active'),
        fetchMetric('hikaricp.connections.pending'),
        fetchMetric('hikaricp.connections.max'),
    ]);

    const activeConnections = Math.round(measurementValue(active));
    const pendingConnections = Math.round(measurementValue(pending));
    const maxConnections = Math.round(measurementValue(max));
    const utilizationPercent =
        maxConnections > 0 ? Math.round((activeConnections / maxConnections) * 1000) / 10 : 0;

    return { activeConnections, pendingConnections, maxConnections, utilizationPercent };
}

// --- LOG ERROR RATE ---

export async function fetchLogEventCounts(): Promise<LogEventCounts> {
    const [errorMetric, warnMetric] = await Promise.all([
        fetchMetric('logback.events', 'level:error').catch(() => null),
        fetchMetric('logback.events', 'level:warn').catch(() => null),
    ]);

    return {
        errorCount: errorMetric ? Math.round(measurementValue(errorMetric)) : 0,
        warnCount: warnMetric ? Math.round(measurementValue(warnMetric)) : 0,
        previousErrorCount: 0,
        previousWarnCount: 0,
    };
}

// --- PER-ENDPOINT BREAKDOWN (from http.server.requests tags) ---

export async function fetchEndpointBreakdowns(): Promise<EndpointBreakdown[]> {
    // First, get the root metric to discover available URI tag values
    const rootMetric = await fetchMetric('http.server.requests');

    const uriTag = rootMetric.availableTags.find((t) => t.tag === 'uri');
    if (!uriTag || uriTag.values.length === 0) return [];

    // Fetch per-URI metrics in parallel
    const perUriPromises = uriTag.values.map(async (uri): Promise<EndpointBreakdown | null> => {
        try {
            const metric = await fetchMetric('http.server.requests', `uri:${uri}`);
            const count = Math.round(measurementValue(metric, 'COUNT'));
            const totalTimeSeconds = measurementValue(metric, 'TOTAL_TIME');
            const maxTimeSeconds = measurementValue(metric, 'MAX');

            const avgResponseTimeMs =
                count > 0 ? Math.round((totalTimeSeconds / count) * 1000 * 100) / 100 : 0;
            const maxResponseTimeMs = Math.round(maxTimeSeconds * 1000 * 100) / 100;

            // Discover which methods hit this URI
            const methodTag = metric.availableTags.find((t) => t.tag === 'method');
            const methods = methodTag?.values ?? [];

            // Discover which statuses this URI returned
            const statusTag = metric.availableTags.find((t) => t.tag === 'status');
            const statuses = statusTag?.values ?? [];

            // Fetch per-status counts for this URI
            const statusBreakdown: Record<string, number> = {};
            if (statuses.length > 0) {
                const statusPromises = statuses.map(async (status) => {
                    try {
                        const statusMetric = await fetchMetricMultiTag('http.server.requests', [
                            `uri:${uri}`,
                            `status:${status}`,
                        ]);
                        return { status, count: Math.round(measurementValue(statusMetric, 'COUNT')) };
                    } catch {
                        return { status, count: 0 };
                    }
                });

                const statusResults = await Promise.all(statusPromises);
                statusResults.forEach(({ status, count: statusCount }) => {
                    if (statusCount > 0) statusBreakdown[status] = statusCount;
                });
            }

            return {
                uri,
                methods,
                requestCount: count,
                avgResponseTimeMs,
                maxResponseTimeMs,
                statusBreakdown,
            };
        } catch {
            return null;
        }
    });

    const results = await Promise.all(perUriPromises);

    return results
        .filter((r): r is EndpointBreakdown => r !== null && r.requestCount > 0)
        .sort((a, b) => b.requestCount - a.requestCount);
}

// --- HTTP EXCHANGES (individual request traces) ---

export async function fetchHttpExchanges(): Promise<ActuatorHttpExchangesResponse> {
    const response = await actuatorClient.get<ActuatorHttpExchangesResponse>('/httpexchanges');
    return response.data;
}

export function parseExchangeDurationMs(timeTaken: string): number {
    if (!timeTaken) return 0;

    // ISO 8601 duration like PT0.123456789S or PT3.524163866S
    const match = timeTaken.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?/);
    if (!match) return 0;

    const hours = parseFloat(match[1] ?? '0');
    const minutes = parseFloat(match[2] ?? '0');
    const seconds = parseFloat(match[3] ?? '0');

    return Math.round((hours * 3_600_000 + minutes * 60_000 + seconds * 1000) * 100) / 100;
}
