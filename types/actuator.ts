// --- Health endpoint types ---

export type ActuatorHealthStatus = 'UP' | 'DOWN' | 'OUT_OF_SERVICE' | 'UNKNOWN';

export interface ActuatorHealthComponent {
    status: ActuatorHealthStatus;
    details?: Record<string, unknown>;
}

export interface ActuatorHealthResponse {
    status: ActuatorHealthStatus;
    components?: Record<string, ActuatorHealthComponent>;
}

// --- Metrics endpoint types ---

export interface ActuatorMetricMeasurement {
    statistic: string;
    value: number;
}

export interface ActuatorMetricTag {
    tag: string;
    values: string[];
}

export interface ActuatorMetricResponse {
    name: string;
    description: string | null;
    baseUnit: string | null;
    measurements: ActuatorMetricMeasurement[];
    availableTags: ActuatorMetricTag[];
}

// --- JVM Metrics ---

export interface JvmMemoryMetrics {
    heapUsedBytes: number;
    heapMaxBytes: number;
    heapUsedPercent: number;
}

export interface JvmCpuMetrics {
    processCpuUsage: number;
    systemCpuUsage: number;
}

export interface JvmThreadMetrics {
    liveThreads: number;
}

export interface JvmMetrics {
    memory: JvmMemoryMetrics;
    cpu: JvmCpuMetrics;
    threads: JvmThreadMetrics;
}

// --- HTTP Server Request Stats types ---

export interface HttpRequestStats {
    totalRequestCount: number;
    errorCount4xx: number;
    errorCount5xx: number;
    averageResponseTimeMs: number;
    requestRate: number;
}

// --- HikariCP Connection Pool types ---

export interface DbConnectionPoolMetrics {
    activeConnections: number;
    pendingConnections: number;
    maxConnections: number;
    utilizationPercent: number;
}

// --- Logback Event types ---

export interface LogEventCounts {
    errorCount: number;
    warnCount: number;
    previousErrorCount: number;
    previousWarnCount: number;
}

// --- Per-Endpoint Breakdown types (from http.server.requests tags) ---

export interface EndpointBreakdown {
    uri: string;
    methods: string[];
    requestCount: number;
    avgResponseTimeMs: number;
    maxResponseTimeMs: number;
    statusBreakdown: Record<string, number>;
}

// --- HTTP Exchanges types ---

export interface ActuatorHttpExchange {
    timestamp: string;
    request: {
        uri: string;
        method: string;
        headers: Record<string, string[]>;
    };
    response: {
        status: number;
        headers: Record<string, string[]>;
    };
    timeTaken: string;
}

export interface ActuatorHttpExchangesResponse {
    exchanges: ActuatorHttpExchange[];
}

// --- Actuator API error ---

export interface ActuatorError {
    message: string;
    status: number;
}
