"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
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
import { ShieldAlert, Loader2, RefreshCw, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ModerationTask, ModerationAction } from "@/types";

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "outline",
  FAILED: "destructive",
};

export default function ModerationPage() {
  const [tasks, setTasks] = useState<ModerationTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [commentIds, setCommentIds] = useState("");
  const [action, setAction] = useState<ModerationAction>("APPROVE");
  const [reason, setReason] = useState("");

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const res = await api.moderation.listTasks(20);
      if (res.data) setTasks(res.data);
    } catch {
      toast.error("Failed to load moderation tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ids = commentIds.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) {
      toast.error("Enter at least one comment ID");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.moderation.bulk({ commentIds: ids, action, reason: reason || undefined });
      toast.success(`Bulk moderation task queued (task ${res.data?.taskId ?? ""})`);
      setCommentIds("");
      setReason("");
      await loadTasks();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "errorMessage" in err
        ? String((err as { errorMessage: unknown }).errorMessage)
        : "Failed to queue moderation task";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshTask = async (taskId: string) => {
    try {
      const res = await api.moderation.getTask(taskId);
      if (res.data) {
        setTasks((prev) => prev.map((t) => (t.taskId === taskId ? res.data! : t)));
      }
    } catch {
      toast.error("Failed to refresh task");
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ShieldAlert className="h-6 w-6" /> Moderation
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Queue bulk comment moderation tasks and track their progress.
        </p>
      </div>

      {/* Bulk Moderation Form */}
      <Card>
        <CardHeader>
          <CardTitle>New Bulk Task</CardTitle>
          <CardDescription>Moderate multiple comments in a single async job.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comment-ids">Comment IDs (comma-separated)</Label>
              <Input
                id="comment-ids"
                placeholder="abc123, def456, ..."
                value={commentIds}
                onChange={(e) => setCommentIds(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Action</Label>
                <Select value={action} onValueChange={(v) => setAction(v as ModerationAction)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPROVE">
                      <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Approve</span>
                    </SelectItem>
                    <SelectItem value="REJECT">
                      <span className="flex items-center gap-2"><XCircle className="h-4 w-4 text-yellow-500" />Reject</span>
                    </SelectItem>
                    <SelectItem value="DELETE">
                      <span className="flex items-center gap-2"><Trash2 className="h-4 w-4 text-destructive" />Delete</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Input
                  id="reason"
                  placeholder="e.g. Spam, Harassment"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Queuing...</> : "Queue Task"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Task History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Task History</CardTitle>
            <CardDescription>Recent moderation jobs</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadTasks} disabled={isLoading}>
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
          ) : tasks.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No moderation tasks yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {tasks.map((task) => (
                <div key={task.taskId} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{task.taskId}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {task.completed}/{task.total} completed · {task.failed} failed ·{" "}
                      {new Date(task.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_COLORS[task.status] ?? "secondary"}>{task.status}</Badge>
                    {(task.status === "PENDING" || task.status === "IN_PROGRESS") && (
                      <Button variant="ghost" size="icon" onClick={() => refreshTask(task.taskId)}>
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
