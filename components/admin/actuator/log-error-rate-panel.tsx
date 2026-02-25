"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { fetchLogEventCounts } from "@/lib/actuator-api";
import type { LogEventCounts } from "@/types/actuator";

const LOG_POLL_INTERVAL_MS = 30_000;

interface LogErrorRatePanelProps {
    refreshSignal: number;
}

type Trend = "up" | "down" | "same";

function computeTrend(current: number, previous: number): Trend {
    if (current > previous) return "up";
    if (current < previous) return "down";
    return "same";
}

function TrendIndicator({ trend, isError }: { trend: Trend; isError: boolean }) {
    if (trend === "up") {
        return (
            <TrendingUp
                className={`h-4 w-4 ${isError ? "text-red-400" : "text-orange-400"}`}
                aria-label="Increasing"
            />
        );
    }
    if (trend === "down") {
        return <TrendingDown className="h-4 w-4 text-green-400" aria-label="Decreasing" />;
    }
    return <Minus className="h-4 w-4 text-muted-foreground" aria-label="Stable" />;
}

export function LogErrorRatePanel({ refreshSignal }: LogErrorRatePanelProps) {
    const [counts, setCounts] = useState<LogEventCounts | null>(null);
    const [previousCounts, setPreviousCounts] = useState<LogEventCounts | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadCounts = async () => {
        try {
            const data = await fetchLogEventCounts();

            setCounts((prev) => {
                if (prev) setPreviousCounts(prev);
                return data;
            });

            setErrorMessage(null);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ?? err?.message ?? "Unable to fetch logback metrics";
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCounts();
        intervalRef.current = setInterval(loadCounts, LOG_POLL_INTERVAL_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (refreshSignal > 0) loadCounts();
    }, [refreshSignal]);

    const errorTrend = counts && previousCounts
        ? computeTrend(counts.errorCount, previousCounts.errorCount)
        : "same";

    const warnTrend = counts && previousCounts
        ? computeTrend(counts.warnCount, previousCounts.warnCount)
        : "same";

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <div className="rounded-md bg-red-500/10 p-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                </div>
                <div>
                    <CardTitle className="text-base">Log Error Rate</CardTitle>
                    <CardDescription className="text-xs">Logback events — 30s refresh</CardDescription>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {errorMessage && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {isLoading && !counts && (
                    <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                )}

                {counts && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
                                    ERROR
                                </span>
                                <TrendIndicator trend={errorTrend} isError={true} />
                            </div>
                            <div className="mt-3 text-3xl font-bold tabular-nums text-red-400">
                                {counts.errorCount.toLocaleString()}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">cumulative count</p>
                        </div>

                        <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                                    WARN
                                </span>
                                <TrendIndicator trend={warnTrend} isError={false} />
                            </div>
                            <div className="mt-3 text-3xl font-bold tabular-nums text-orange-400">
                                {counts.warnCount.toLocaleString()}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">cumulative count</p>
                        </div>
                    </div>
                )}

                {counts && counts.errorCount === 0 && counts.warnCount === 0 && (
                    <p className="text-center text-xs text-muted-foreground">
                        No ERROR or WARN events recorded
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
