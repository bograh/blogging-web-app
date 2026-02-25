"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Database } from "lucide-react";
import { fetchDbConnectionPoolMetrics } from "@/lib/actuator-api";
import type { DbConnectionPoolMetrics } from "@/types/actuator";

const DB_POOL_POLL_INTERVAL_MS = 30_000;

interface DbConnectionPoolPanelProps {
    refreshSignal: number;
}

function utilizationColor(percent: number): string {
    if (percent >= 90) return "bg-red-500";
    if (percent >= 70) return "bg-orange-500";
    if (percent >= 50) return "bg-yellow-500";
    return "bg-primary";
}

function utilizationTextColor(percent: number): string {
    if (percent >= 90) return "text-red-400";
    if (percent >= 70) return "text-orange-400";
    return "text-green-400";
}

export function DbConnectionPoolPanel({ refreshSignal }: DbConnectionPoolPanelProps) {
    const [pool, setPool] = useState<DbConnectionPoolMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadPool = async () => {
        try {
            const data = await fetchDbConnectionPoolMetrics();
            setPool(data);
            setErrorMessage(null);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ?? err?.message ?? "Unable to fetch HikariCP metrics";
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPool();
        intervalRef.current = setInterval(loadPool, DB_POOL_POLL_INTERVAL_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (refreshSignal > 0) loadPool();
    }, [refreshSignal]);

    const clampedPercent = pool
        ? Math.min(100, Math.max(0, pool.utilizationPercent))
        : 0;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <div className="rounded-md bg-amber-500/10 p-2">
                    <Database className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                    <CardTitle className="text-base">DB Connection Pool</CardTitle>
                    <CardDescription className="text-xs">HikariCP — 30s refresh</CardDescription>
                </div>
                {pool && (
                    <span
                        className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${utilizationTextColor(pool.utilizationPercent)} bg-current/10`}
                    >
                        {pool.utilizationPercent.toFixed(1)}% utilised
                    </span>
                )}
            </CardHeader>

            <CardContent className="space-y-4">
                {errorMessage && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {isLoading && !pool && (
                    <div className="space-y-3">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-2 w-full" />
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3].map((n) => <Skeleton key={n} className="h-14 w-full" />)}
                        </div>
                    </div>
                )}

                {pool && (
                    <>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Pool Utilisation</span>
                                <span className={`font-bold tabular-nums ${utilizationTextColor(pool.utilizationPercent)}`}>
                                    {pool.activeConnections} / {pool.maxConnections}
                                </span>
                            </div>
                            <div className="relative h-3 w-full overflow-hidden rounded-full bg-primary/20">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${utilizationColor(pool.utilizationPercent)}`}
                                    style={{ width: `${clampedPercent}%` }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-center">
                                <div className="text-lg font-bold text-foreground">{pool.activeConnections}</div>
                                <div className="mt-0.5 text-xs text-muted-foreground">Active</div>
                            </div>
                            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-center">
                                <div className={`text-lg font-bold ${pool.pendingConnections > 0 ? "text-orange-400" : "text-foreground"}`}>
                                    {pool.pendingConnections}
                                </div>
                                <div className="mt-0.5 text-xs text-muted-foreground">Pending</div>
                            </div>
                            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-center">
                                <div className="text-lg font-bold text-foreground">{pool.maxConnections}</div>
                                <div className="mt-0.5 text-xs text-muted-foreground">Max</div>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
