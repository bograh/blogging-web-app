"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, MessageSquare } from "lucide-react";
import type { AdminStats } from "@/types";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const response = await api.admin.getStats();
      if (response.data) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error("Failed to load stats:", err);
      setError(err.errorMessage || "Failed to load statistics");
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers ?? 0,
      description: "Registered users",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Posts",
      value: stats?.totalPosts ?? 0,
      description: "Published posts",
      icon: FileText,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Total Comments",
      value: stats?.totalComments ?? 0,
      description: "User comments",
      icon: MessageSquare,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your platform statistics
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-md p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <a
              href="/admin/posts"
              className="flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted"
            >
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium text-foreground">Manage Posts</div>
                <div className="text-sm text-muted-foreground">
                  View, edit, or delete posts
                </div>
              </div>
            </a>
            <a
              href="/admin/users"
              className="flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted"
            >
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium text-foreground">Manage Users</div>
                <div className="text-sm text-muted-foreground">
                  View user accounts and activity
                </div>
              </div>
            </a>
            <a
              href="/admin/comments"
              className="flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted"
            >
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium text-foreground">
                  Manage Comments
                </div>
                <div className="text-sm text-muted-foreground">
                  Moderate user comments
                </div>
              </div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Info</CardTitle>
            <CardDescription>Platform information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Platform</span>
              <span className="font-medium text-foreground">DevBlog</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">API Version</span>
              <span className="font-medium text-foreground">v1.0</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Backend URL</span>
              <span className="font-medium text-foreground">localhost:8080</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="font-medium text-foreground">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
