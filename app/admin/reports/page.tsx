"use client";

import { useEffect, useState } from "react";
import { api, BASE_URL, tokenManager } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { ReportExport, ReportType } from "@/types";

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "outline",
  FAILED: "destructive",
};

const REPORT_TYPES = [
  { value: "POST_ANALYTICS", label: "Post Analytics" },
  { value: "USER_ACTIVITY", label: "User Activity" },
  { value: "COMMENT_SUMMARY", label: "Comment Summary" },
  { value: "MODERATION_LOG", label: "Moderation Log" },
  { value: "FULL_PLATFORM", label: "Full Platform" },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportExport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("POST_ANALYTICS");
  const [filterKey, setFilterKey] = useState("");
  const [filterValue, setFilterValue] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const res = await api.reports.list(20);
      if (res.data) setReports(res.data);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const filters: Record<string, string> = {};
      if (filterKey.trim() && filterValue.trim()) {
        filters[filterKey.trim()] = filterValue.trim();
      }
      const res = await api.reports.export({
        reportType: reportType,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      });
      toast.success(`Report job started (ID: ${res.data?.reportId ?? ""})`);
      if (res.data) setReports((prev) => [res.data!, ...prev]);
      setFilterKey("");
      setFilterValue("");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "errorMessage" in err
        ? String((err as { errorMessage: unknown }).errorMessage)
        : "Failed to start report export";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (report: ReportExport) => {
    if (!report.downloadUrl) return;
    const token = tokenManager.getToken();
    try {
      const res = await fetch(`${BASE_URL}${report.downloadUrl}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = res.headers.get('content-disposition');
      const filename = disposition?.match(/filename="?([^"]+)"?/)?.[1]
        ?? `report-${report.reportId}.csv`;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Download failed";
      toast.error(msg);
    }
  };

  const refreshReport = async (reportId: string) => {
    try {
      const res = await api.reports.getById(reportId);
      if (res.data) {
        setReports((prev) => prev.map((r) => (r.reportId === reportId ? res.data! : r)));
      }
    } catch {
      toast.error("Failed to refresh report status");
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Download className="h-6 w-6" /> Report Exports
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate async data export reports and download them when ready.
        </p>
      </div>

      {/* Export Form */}
      <Card>
        <CardHeader>
          <CardTitle>New Export</CardTitle>
          <CardDescription>Start an async report generation job.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleExport} className="space-y-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Filter (optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Key (e.g. author)"
                  value={filterKey}
                  onChange={(e) => setFilterKey(e.target.value)}
                />
                <Input
                  placeholder="Value"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Starting...</>
                  : <><Download className="mr-2 h-4 w-4" />Start Export</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Export History</CardTitle>
            <CardDescription>Your recent report exports</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadReports} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No exports yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {reports.map((report) => (
                <div key={report.reportId} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{report.reportType}</p>
                      <Badge variant={STATUS_COLORS[report.status] ?? "secondary"}>
                        {report.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {report.reportId} · {new Date(report.createdAt).toLocaleString()}
                      {report.completedAt && ` · Done at ${new Date(report.completedAt).toLocaleString()}`}
                    </p>
                    {report.error && (
                      <p className="mt-0.5 text-xs text-destructive">{report.error}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {report.downloadUrl && report.status === "COMPLETED" && (
                      <Button variant="outline" size="sm" onClick={() => handleDownload(report)}>
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Download
                      </Button>
                    )}
                    {(report.status === "PENDING" || report.status === "IN_PROGRESS") && (
                      <Button variant="ghost" size="icon" onClick={() => refreshReport(report.reportId)}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
