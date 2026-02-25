"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Cpu } from "lucide-react";
import { fetchJvmMetrics, formatMegabytes } from "@/lib/actuator-api";
import type { JvmMetrics } from "@/types/actuator";

const JVM_POLL_INTERVAL_MS = 30_000;

interface JvmMetricsPanelProps {
    refreshSignal: number;
}

interface GaugeRowProps {
    label: string;
    value: number;
    maxValue?: number;
    displayValue: string;
    percent: number;
    progressClassName?: string;
}

function GaugeRow({ label, displayValue, percent, progressClassName }: GaugeRowProps) {
    const clampedPercent = Math.min(100, Math.max(0, percent));

    const barColor =
        clampedPercent >= 90
            ? "bg-red-500"
            : clampedPercent >= 70
                ? "bg-orange-500"
                : "bg-primary";

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium tabular-nums text-foreground">{displayValue}</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${progressClassName ?? barColor}`}
                    style={{ width: `${clampedPercent}%` }}
                />
            </div>
            <p className="text-right text-[10px] text-muted-foreground">{clampedPercent.toFixed(1)}%</p>
        </div>
    );
}

export function JvmMetricsPanel({ refreshSignal }: JvmMetricsPanelProps) {
    const [metrics, setMetrics] = useState<JvmMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadMetrics = async () => {
        try {
            const data = await fetchJvmMetrics();
            setMetrics(data);
            setErrorMessage(null);
        } catch (err: any) {
            const message = err?.response?.data?.message ?? err?.message ?? "Unable to fetch JVM metrics";
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadMetrics();
        intervalRef.current = setInterval(loadMetrics, JVM_POLL_INTERVAL_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (refreshSignal > 0) loadMetrics();
    }, [refreshSignal]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <div className="rounded-md bg-blue-500/10 p-2">
                    <Cpu className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                    <CardTitle className="text-base">JVM Metrics</CardTitle>
                    <CardDescription className="text-xs">Memory, CPU & threads — 30s refresh</CardDescription>
                </div>
                {metrics && (
                    <span className="ml-auto shrink-0 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">
                        {metrics.threads.liveThreads} threads
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

                {isLoading && !metrics && (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-2 w-full" />
                            </div>
                        ))}
                    </div>
                )}

                {metrics && (
                    <>
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Memory</p>
                            <GaugeRow
                                label="Heap Used"
                                displayValue={`${formatMegabytes(metrics.memory.heapUsedBytes)} / ${formatMegabytes(metrics.memory.heapMaxBytes)}`}
                                percent={metrics.memory.heapUsedPercent}
                                value={metrics.memory.heapUsedBytes}
                            />
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CPU</p>
                            <GaugeRow
                                label="Process CPU"
                                displayValue={`${metrics.cpu.processCpuUsage.toFixed(1)}%`}
                                percent={metrics.cpu.processCpuUsage}
                                value={metrics.cpu.processCpuUsage}
                                progressClassName="bg-purple-500"
                            />
                            <GaugeRow
                                label="System CPU"
                                displayValue={`${metrics.cpu.systemCpuUsage.toFixed(1)}%`}
                                percent={metrics.cpu.systemCpuUsage}
                                value={metrics.cpu.systemCpuUsage}
                                progressClassName="bg-violet-500"
                            />
                        </div>

                        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Live Threads</span>
                                <span className="text-lg font-bold text-foreground">
                                    {metrics.threads.liveThreads}
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
