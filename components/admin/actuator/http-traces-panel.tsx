"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, List } from "lucide-react";
import { fetchEndpointBreakdowns } from "@/lib/actuator-api";
import type { EndpointBreakdown } from "@/types/actuator";

const ENDPOINT_POLL_INTERVAL_MS = 60_000;

interface HttpTracesPanelProps {
    refreshSignal: number;
}

function statusBadgeClassName(status: string): string {
    const code = parseInt(status, 10);
    if (code >= 500) return "bg-red-500/15 text-red-400 border-red-500/30";
    if (code >= 400) return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    if (code >= 300) return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
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

function truncateUri(uri: string, maxLength = 48): string {
    return uri.length > maxLength ? `${uri.slice(0, maxLength)}…` : uri;
}

export function HttpTracesPanel({ refreshSignal }: HttpTracesPanelProps) {
    const [endpoints, setEndpoints] = useState<EndpointBreakdown[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadBreakdowns = async () => {
        try {
            const data = await fetchEndpointBreakdowns();
            setEndpoints(data);
            setErrorMessage(null);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ??
                err?.message ??
                "Unable to fetch endpoint breakdowns from http.server.requests metric";
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadBreakdowns();
        intervalRef.current = setInterval(loadBreakdowns, ENDPOINT_POLL_INTERVAL_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (refreshSignal > 0) loadBreakdowns();
    }, [refreshSignal]);

    const totalRequests = endpoints.reduce((sum, ep) => sum + ep.requestCount, 0);

    return (
        <Card className="col-span-full">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <div className="rounded-md bg-violet-500/10 p-2">
                    <List className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                    <CardTitle className="text-base">Endpoint Breakdown</CardTitle>
                    <CardDescription className="text-xs">
                        Per-URI request counts, methods, status codes & latency — refreshes every 60 seconds
                    </CardDescription>
                </div>
                {endpoints.length > 0 && (
                    <span className="ml-auto shrink-0 rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-400">
                        {endpoints.length} endpoints • {totalRequests.toLocaleString()} total
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

                {isLoading && endpoints.length === 0 && (
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                            <Skeleton key={n} className="h-12 w-full" />
                        ))}
                    </div>
                )}

                {!isLoading && endpoints.length === 0 && !errorMessage && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        No HTTP request metrics available yet
                    </p>
                )}

                {endpoints.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left">
                                    <th className="pb-2 pr-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        URI
                                    </th>
                                    <th className="pb-2 pr-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Methods
                                    </th>
                                    <th className="pb-2 pr-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Requests
                                    </th>
                                    <th className="pb-2 pr-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Status Codes
                                    </th>
                                    <th className="pb-2 pr-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Avg Latency
                                    </th>
                                    <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Max Latency
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {endpoints.map((ep) => (
                                    <tr key={ep.uri} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-2.5 pr-3 font-mono text-xs text-foreground max-w-[280px]">
                                            <span title={ep.uri}>{truncateUri(ep.uri)}</span>
                                        </td>
                                        <td className="py-2.5 pr-3">
                                            <div className="flex flex-wrap gap-1">
                                                {ep.methods.map((method) => (
                                                    <span
                                                        key={method}
                                                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${methodBadgeColor(method)}`}
                                                    >
                                                        {method}
                                                    </span>
                                                ))}
                                                {ep.methods.length === 0 && (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-2.5 pr-3 text-right font-mono text-xs tabular-nums font-medium text-foreground">
                                            {ep.requestCount.toLocaleString()}
                                        </td>
                                        <td className="py-2.5 pr-3">
                                            <div className="flex flex-wrap gap-1">
                                                {Object.entries(ep.statusBreakdown)
                                                    .sort(([a], [b]) => a.localeCompare(b))
                                                    .map(([status, count]) => (
                                                        <span
                                                            key={status}
                                                            className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClassName(status)}`}
                                                        >
                                                            {status}: {count}
                                                        </span>
                                                    ))}
                                                {Object.keys(ep.statusBreakdown).length === 0 && (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-2.5 pr-3 text-right font-mono text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                                            {ep.avgResponseTimeMs.toFixed(1)} ms
                                        </td>
                                        <td className="py-2.5 text-right font-mono text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                                            {ep.maxResponseTimeMs.toFixed(1)} ms
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
