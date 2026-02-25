"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Globe } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { fetchHttpRequestStats } from "@/lib/actuator-api";
import type { HttpRequestStats } from "@/types/actuator";

const HTTP_POLL_INTERVAL_MS = 30_000;

interface HttpRequestStatsPanelProps {
    refreshSignal: number;
}

interface StatCardProps {
    label: string;
    value: string | number;
    unit?: string;
    colorClassName?: string;
}

function StatCard({ label, value, unit, colorClassName = "text-foreground" }: StatCardProps) {
    return (
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-center">
            <div className={`flex items-baseline justify-center gap-1 whitespace-nowrap ${colorClassName}`}>
                <span className="text-xl font-bold tabular-nums">{value}</span>
                {unit && <span className="text-xs font-medium text-muted-foreground">{unit}</span>}
            </div>
            <div className="mt-1 text-xs text-muted-foreground truncate">{label}</div>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
            <p className="font-medium text-foreground">{label}</p>
            <p className="text-muted-foreground">{payload[0].value} requests</p>
        </div>
    );
};

export function HttpRequestStatsPanel({ refreshSignal }: HttpRequestStatsPanelProps) {
    const [stats, setStats] = useState<HttpRequestStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadStats = async () => {
        try {
            const data = await fetchHttpRequestStats();
            setStats(data);
            setErrorMessage(null);
        } catch (err: any) {
            const message = err?.response?.data?.message ?? err?.message ?? "Unable to fetch HTTP request metrics";
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
        intervalRef.current = setInterval(loadStats, HTTP_POLL_INTERVAL_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (refreshSignal > 0) loadStats();
    }, [refreshSignal]);

    const chartData = stats
        ? [
            { name: "2xx", value: stats.totalRequestCount - stats.errorCount4xx - stats.errorCount5xx },
            { name: "4xx", value: stats.errorCount4xx },
            { name: "5xx", value: stats.errorCount5xx },
        ]
        : [];

    const chartColors: Record<string, string> = {
        "2xx": "var(--primary)",
        "4xx": "#f97316",
        "5xx": "#ef4444",
    };

    return (
        <Card className="min-h-[400px]">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <div className="rounded-md bg-primary/10 p-2">
                    <Globe className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <CardTitle className="text-base">HTTP Request Stats</CardTitle>
                    <CardDescription className="text-xs">Server requests — 30s refresh</CardDescription>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {errorMessage && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {isLoading && !stats && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3].map((n) => <Skeleton key={n} className="h-16 w-full" />)}
                        </div>
                        <Skeleton className="h-24 w-full" />
                    </div>
                )}

                {stats && (
                    <>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                            <StatCard label="Total Requests" value={stats.totalRequestCount.toLocaleString()} />
                            <StatCard
                                label="4xx Errors"
                                value={stats.errorCount4xx.toLocaleString()}
                                colorClassName={stats.errorCount4xx > 0 ? "text-orange-400" : "text-foreground"}
                            />
                            <StatCard
                                label="5xx Errors"
                                value={stats.errorCount5xx.toLocaleString()}
                                colorClassName={stats.errorCount5xx > 0 ? "text-red-400" : "text-foreground"}
                            />
                            <StatCard
                                label="Avg Response"
                                value={stats.averageResponseTimeMs.toFixed(1)}
                                unit="ms"
                            />
                        </div>

                        {stats.totalRequestCount > 0 && (
                            <div className="mt-2">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Request Distribution
                                </p>
                                <ResponsiveContainer width="100%" height={150}>
                                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                                        <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                                        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                                            {chartData.map((entry) => (
                                                <Cell key={entry.name} fill={chartColors[entry.name]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {stats.totalRequestCount === 0 && (
                            <p className="text-center text-xs text-muted-foreground py-4">
                                No requests recorded yet
                            </p>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
