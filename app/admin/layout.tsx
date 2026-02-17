"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Users,
  MessageSquare,
  BarChart3,
  ArrowLeft,
  Shield,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Posts",
    href: "/admin/posts",
    icon: FileText,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Comments",
    href: "/admin/comments",
    icon: MessageSquare,
  },
  /*{
    title: "Metrics",
    href: "/admin/metrics",
    icon: BarChart3,
  },*/
];

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.push("/login");
    }
  }, [user, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Access Denied
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You need admin privileges to access this page.
          </p>
          <Button asChild className="mt-4">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">Admin Panel</span>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
          <Button asChild variant="outline" className="w-full gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Site
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  );
}
