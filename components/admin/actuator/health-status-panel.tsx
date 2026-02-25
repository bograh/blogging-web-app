"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, Heart, XCircle } from "lucide-react";
import { fetchHealth } from "@/lib/actuator-api";
import type { ActuatorHealthResponse, ActuatorHealthStatus } from "@/types/actuator";

const HEALTH_POLL_INTERVAL_MS = 30_000;

interface HealthStatusPanelProps {
    refreshSignal: number;
}

function StatusBadge({ status }: { status: ActuatorHealthStatus }) {
    const variants: Record<ActuatorHealthStatus, { label: string; className: string; icon: React.ReactNode }> = {
        UP: {
            label: "UP",
            className: "bg-green-500/15 text-green-400 border-green-500/30",
            icon: <CheckCircle className="h-3 w-3" />,
        },
        DOWN: {
            label: "DOWN",
            className: "bg-red-500/15 text-red-400 border-red-500/30",
            icon: <XCircle className="h-3 w-3" />,
        },
        OUT_OF_SERVICE: {
            label: "OUT OF SERVICE",
            className: "bg-orange-500/15 text-orange-400 border-orange-500/30",
            icon: <AlertTriangle className="h-3 w-3" />,
        },
        UNKNOWN: {
            label: "UNKNOWN",
            className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
            icon: <AlertTriangle className="h-3 w-3" />,
        },
    };

    const config = variants[status] ?? variants.UNKNOWN;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.className}`}
        >
            {config.icon}
            {config.label}
        </span>
    );
}

function overallStatusColor(status: ActuatorHealthStatus): string {
    if (status === "UP") return "text-green-400";
    if (status === "DOWN") return "text-red-400";
    return "text-orange-400";
}

export function HealthStatusPanel({ refreshSignal }: HealthStatusPanelProps) {
    const [health, setHealth] = useState<ActuatorHealthResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadHealth = async () => {
        try {
            const data = await fetchHealth();
            setHealth(data);
            setErrorMessage(null);
        } catch (err: any) {
            const message = err?.response?.data?.message ?? err?.message ?? "Unable to reach /actuator/health";
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHealth();
        intervalRef.current = setInterval(loadHealth, HEALTH_POLL_INTERVAL_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (refreshSignal > 0) loadHealth();
    }, [refreshSignal]);

    const components = health?.components ? Object.entries(health.components) : [];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                    <div className="rounded-md bg-green-500/10 p-2">
                        <Heart className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Health Status</CardTitle>
                        <CardDescription className="text-xs">Refreshes every 30 seconds</CardDescription>
                    </div>
                </div>
                {health && !isLoading && (
                    <StatusBadge status={health.status} />
                )}
            </CardHeader>

            <CardContent className="space-y-3">
                {errorMessage && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {isLoading && !health && (
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-24" />
                        {[1, 2, 3].map((n) => (
                            <Skeleton key={n} className="h-10 w-full" />
                        ))}
                    </div>
                )}

                {health && (
                    <>
                        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Overall</span>
                                <span className={`text-lg font-bold ${overallStatusColor(health.status)}`}>
                                    {health.status}
                                </span>
                            </div>
                        </div>

                        {components.length > 0 && (
                            <div className="space-y-2">
                                {components.map(([name, component]) => (
                                    <div
                                        key={name}
                                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                                    >
                                        <span className="text-sm font-medium text-foreground uppercase">{name}</span>
                                        <StatusBadge status={component.status} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {components.length === 0 && (
                            <p className="text-center text-xs text-muted-foreground py-3">
                                No component details exposed (enable <code>management.endpoint.health.show-details</code>)
                            </p>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
