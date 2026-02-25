"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity } from "lucide-react";
import { HealthStatusPanel } from "@/components/admin/actuator/health-status-panel";
import { JvmMetricsPanel } from "@/components/admin/actuator/jvm-metrics-panel";
import { HttpRequestStatsPanel } from "@/components/admin/actuator/http-request-stats-panel";
import { DbConnectionPoolPanel } from "@/components/admin/actuator/db-connection-pool-panel";
import { LogErrorRatePanel } from "@/components/admin/actuator/log-error-rate-panel";
import { HttpTracesPanel } from "@/components/admin/actuator/http-traces-panel";
import { HttpExchangesPanel } from "@/components/admin/actuator/http-exchanges-panel";
import { ServerUptimePanel } from "@/components/admin/actuator/server-uptime-panel";
import { ACTUATOR_BASE_URL } from "@/lib/actuator-api";

export default function ActuatorMonitoringPage() {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshSignal, setRefreshSignal] = useState(0);

    const handleRefreshAll = () => {
        setIsRefreshing(true);
        setRefreshSignal((prev) => prev + 1);
        setTimeout(() => setIsRefreshing(false), 1500);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">System Status</h1>
                    <p className="mt-1 text-muted-foreground">
                        Live, health, and HTTP monitoring for the backend
                    </p>
                    {/* <p className="mt-1 font-mono text-xs text-muted-foreground/60">
                        {ACTUATOR_BASE_URL}
                    </p> */}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshAll}
                    disabled={isRefreshing}
                    className="gap-2 shrink-0"
                    id="actuator-refresh-all"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    Refresh All
                </Button>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-primary/5 px-4 py-2.5">
                <Activity className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">
                    Health &amp; metrics panels refresh every <strong className="text-foreground">30 seconds</strong>.
                    HTTP traces refresh every <strong className="text-foreground">60 seconds</strong>.
                    Click <strong className="text-foreground">Refresh All</strong> to poll immediately.
                </p>
            </div>

            <div className="grid gap-5 md:grid-cols-5">
                <HealthStatusPanel refreshSignal={refreshSignal} />
                <ServerUptimePanel refreshSignal={refreshSignal} />
                <JvmMetricsPanel refreshSignal={refreshSignal} />
                <HttpRequestStatsPanel refreshSignal={refreshSignal} />
                {/* <LogErrorRatePanel refreshSignal={refreshSignal} /> */}
                <DbConnectionPoolPanel refreshSignal={refreshSignal} />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
                <HttpTracesPanel refreshSignal={refreshSignal} />
                <HttpExchangesPanel refreshSignal={refreshSignal} />
            </div>
        </div>
    );
}
