"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Loader2, Send } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Notification, NotificationStats, NotificationType } from "@/types";

const NOTIFICATION_TYPES: NotificationType[] = [
  'NEW_COMMENT',
  'POST_PUBLISHED',
  'MODERATION_ACTION',
  'WELCOME_EMAIL',
  'PASSWORD_RESET',
  'WEEKLY_DIGEST',
];

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  PROCESSING: "default",
  SENT: "outline",
  RETRYING: "default",
  FAILED: "destructive",
};

export default function NotificationsPage() {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [type, setType] = useState<NotificationType>('NEW_COMMENT');
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const statsRes = await api.notifications.getStats().catch(() => null);
      if (statsRes?.data) setStats(statsRes.data);
    } catch {
      toast.error("Failed to load notification stats");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail.trim() || !subject.trim() || !body.trim()) {
      toast.error("Recipient email, subject and body are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.notifications.create({
        recipientEmail: recipientEmail.trim(),
        recipientName: recipientName.trim(),
        type,
        subject: subject.trim(),
        body: body.trim(),
      });
      toast.success(`Notification queued (ID: ${res.data?.id ?? ""})`);
      if (res.data) setRecentNotifications((prev) => [res.data!, ...prev].slice(0, 20));
      setRecipientEmail("");
      setRecipientName("");
      setType('NEW_COMMENT');
      setSubject("");
      setBody("");
      loadData();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "errorMessage" in err
        ? String((err as { errorMessage: unknown }).errorMessage)
        : "Failed to send notification";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Bell className="h-6 w-6" /> Notifications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Queue notifications for async outbox processing and monitor delivery.
        </p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Pending", value: stats.totalPending },
            { label: "Processing", value: stats.totalProcessing },
            { label: "Sent", value: stats.totalSent },
            { label: "Retrying", value: stats.totalRetrying },
            { label: "Failed", value: stats.totalFailed },
            { label: "Last 24 h", value: stats.processedLast24Hours },
          ].map((item) => (
            <Card key={item.label}>
              <CardHeader className="pb-2">
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="text-3xl">{item.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : null}

      {/* Queue Form */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Notification</CardTitle>
          <CardDescription>Send a notification to the async outbox for processing.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="notif-email">Recipient Email</Label>
                <Input
                  id="notif-email"
                  type="email"
                  placeholder="user@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notif-name">Recipient Name</Label>
                <Input
                  id="notif-name"
                  placeholder="John Doe"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as NotificationType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notif-subject">Subject</Label>
                <Input
                  id="notif-subject"
                  placeholder="Email subject line"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notif-body">Body</Label>
              <Textarea
                id="notif-body"
                placeholder="Notification body content..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                  : <><Send className="mr-2 h-4 w-4" />Queue Notification</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Session log */}
      {recentNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Session Queue</CardTitle>
            <CardDescription>Notifications queued in this session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {recentNotifications.map((n) => (
                <div key={n.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{n.type}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.subject}</p>
                    {n.recipientEmail && (
                      <p className="mt-0.5 text-xs text-muted-foreground">To: {n.recipientEmail}</p>
                    )}
                  </div>
                  <Badge variant={STATUS_COLORS[n.status] ?? "secondary"}>{n.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
