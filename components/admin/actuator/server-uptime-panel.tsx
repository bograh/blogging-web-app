"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar, Timer } from "lucide-react";
import { fetchServerUptime } from "@/lib/actuator-api";
import type { ServerUptime } from "@/types/actuator";

const UPTIME_POLL_INTERVAL_MS = 30_000;

interface ServerUptimePanelProps {
    refreshSignal: number;
}

export function ServerUptimePanel({ refreshSignal }: ServerUptimePanelProps) {
    const [uptime, setUptime] = useState<ServerUptime | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadUptime = async () => {
        try {
            const data = await fetchServerUptime();
            setUptime(data);
            setErrorMessage(null);
        } catch (err: any) {
            const message = err?.response?.data?.message ?? err?.message ?? "Unable to fetch uptime metrics";
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUptime();
        intervalRef.current = setInterval(loadUptime, UPTIME_POLL_INTERVAL_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (refreshSignal > 0) loadUptime();
    }, [refreshSignal]);

    const formatStartTime = (ms: number) => {
        return new Date(ms).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'medium'
        });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                    <div className="rounded-md bg-blue-500/10 p-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Server Uptime</CardTitle>
                        <CardDescription className="text-xs">Refreshes every 30 seconds</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {isLoading && !uptime && (
                    <div className="space-y-3">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                )}

                {uptime && (
                    <>
                        <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-3">
                            <div className="rounded-full bg-blue-500/10 p-2 shrink-0">
                                <Timer className="h-4 w-4 text-blue-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Uptime</p>
                                <p className="truncate text-lg font-bold text-foreground">
                                    {uptime.uptimeFormatted}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-3">
                            <div className="rounded-full bg-indigo-500/10 p-2 shrink-0">
                                <Calendar className="h-4 w-4 text-indigo-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Started At</p>
                                <p className="truncate text-sm font-semibold text-foreground">
                                    {formatStartTime(uptime.startTimeMs)}
                                </p>
                            </div>
                        </div>
                    </>
                )}

                {errorMessage && (
                    <div className="text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20 mt-2">
                        {errorMessage}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
