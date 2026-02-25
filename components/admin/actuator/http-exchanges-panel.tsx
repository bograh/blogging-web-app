"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowRightLeft } from "lucide-react";
import { fetchHttpExchanges, parseExchangeDurationMs } from "@/lib/actuator-api";
import type { ActuatorHttpExchange } from "@/types/actuator";

const EXCHANGES_POLL_INTERVAL_MS = 60_000;
const MAX_DISPLAYED_EXCHANGES = 15;

interface HttpExchangesPanelProps {
    refreshSignal: number;
}

function statusBadgeClassName(status: number): string {
    if (status >= 500) return "bg-red-500/15 text-red-400 border-red-500/30";
    if (status >= 400) return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    if (status >= 300) return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    return "bg-green-500/15 text-green-400 border-green-500/30";
}

function methodBadgeColor(method: string): string {
    const colors: Record<string, string> = {
        GET: "bg-blue-500/10 text-blue-400",
        POST: "bg-green-500/10 text-green-400",
        PUT: "bg-yellow-500/10 text-yellow-400",
        PATCH: "bg-purple-500/10 text-purple-400",
        DELETE: "bg-red-500/10 text-red-400",
    };
    return colors[method.toUpperCase()] ?? "bg-muted/50 text-muted-foreground";
}

function formatTimestamp(iso: string): string {
    try {
        return new Date(iso).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    } catch {
        return iso;
    }
}

function extractPath(fullUri: string): string {
    try {
        const url = new URL(fullUri);
        return url.pathname + url.search;
    } catch {
        return fullUri;
    }
}

function truncateUri(uri: string, maxLength = 52): string {
    return uri.length > maxLength ? `${uri.slice(0, maxLength)}…` : uri;
}

function durationColor(ms: number): string {
    if (ms >= 1000) return "text-red-400";
    if (ms >= 200) return "text-orange-400";
    return "text-muted-foreground";
}

export function HttpExchangesPanel({ refreshSignal }: HttpExchangesPanelProps) {
    const [exchanges, setExchanges] = useState<ActuatorHttpExchange[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadExchanges = async () => {
        try {
            const data = await fetchHttpExchanges();
            const recent = [...(data.exchanges ?? [])]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, MAX_DISPLAYED_EXCHANGES);
            setExchanges(recent);
            setErrorMessage(null);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ??
                err?.message ??
                "Unable to fetch /actuator/httpexchanges";
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadExchanges();
        intervalRef.current = setInterval(loadExchanges, EXCHANGES_POLL_INTERVAL_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (refreshSignal > 0) loadExchanges();
    }, [refreshSignal]);

    return (
        <Card className="col-span-full">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <div className="rounded-md bg-indigo-500/10 p-2">
                    <ArrowRightLeft className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                    <CardTitle className="text-base">Recent HTTP Exchanges</CardTitle>
                    <CardDescription className="text-xs">
                        Last {MAX_DISPLAYED_EXCHANGES} individual requests from /actuator/httpexchanges — 60s refresh
                    </CardDescription>
                </div>
                {exchanges.length > 0 && (
                    <span className="ml-auto shrink-0 rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400">
                        {exchanges.length} shown
                    </span>
                )}
            </CardHeader>

            <CardContent>
                {errorMessage && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {isLoading && exchanges.length === 0 && (
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                            <Skeleton key={n} className="h-10 w-full" />
                        ))}
                    </div>
                )}

                {!isLoading && exchanges.length === 0 && !errorMessage && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        No HTTP exchanges recorded yet
                    </p>
                )}

                {exchanges.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left">
                                    <th className="pb-2 pr-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Time
                                    </th>
                                    <th className="pb-2 pr-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Method
                                    </th>
                                    <th className="pb-2 pr-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        URI
                                    </th>
                                    <th className="pb-2 pr-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Status
                                    </th>
                                    <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Duration
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {exchanges.map((exchange, index) => {
                                    const durationMs = parseExchangeDurationMs(exchange.timeTaken);
                                    const path = extractPath(exchange.request?.uri ?? "");

                                    return (
                                        <tr
                                            key={`${exchange.timestamp}-${index}`}
                                            className="hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="py-2.5 pr-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                                                {formatTimestamp(exchange.timestamp)}
                                            </td>
                                            <td className="py-2.5 pr-3">
                                                <span
                                                    className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${methodBadgeColor(
                                                        exchange.request?.method ?? ""
                                                    )}`}
                                                >
                                                    {exchange.request?.method ?? "—"}
                                                </span>
                                            </td>
                                            <td className="py-2.5 pr-3 font-mono text-xs text-foreground max-w-[300px]">
                                                <span title={path}>{truncateUri(path)}</span>
                                            </td>
                                            <td className="py-2.5 pr-3">
                                                <span
                                                    className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${statusBadgeClassName(
                                                        exchange.response?.status ?? 0
                                                    )}`}
                                                >
                                                    {exchange.response?.status ?? "—"}
                                                </span>
                                            </td>
                                            <td
                                                className={`py-2.5 text-right font-mono text-xs tabular-nums whitespace-nowrap ${durationColor(durationMs)}`}
                                            >
                                                {durationMs.toFixed(1)} ms
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
