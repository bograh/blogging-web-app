"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileText,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import type { AdminUser, AdminUserSummary, PaginatedResponse } from "@/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<AdminUser> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    loadUsers();
  }, [currentPage]);

  const loadUsers = async (search?: string) => {
    try {
      setIsLoading(true);
      const response = await api.admin.getUsers(currentPage, pageSize, {
        sort: "createdAt",
        order: "DESC",
        search: search || searchQuery || undefined,
      });
      if (response.data) {
        setUsers(response.data.content);
        setPagination(response.data);
      }
    } catch (err: any) {
      console.error("Failed to load users:", err);
      toast.error(err.errorMessage || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    loadUsers(searchQuery);
  };

  const viewUserDetails = async (userId: string) => {
    try {
      setIsLoadingUser(true);
      const response = await api.admin.getUserSummary(userId);
      if (response.data) {
        setSelectedUser(response.data);
      }
    } catch (err: any) {
      console.error("Failed to load user details:", err);
      toast.error(err.errorMessage || "Failed to load user details");
    } finally {
      setIsLoadingUser(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" => {
    if (role === "ADMIN" || role === "ROLE_ADMIN") return "destructive";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground">
          Manage user accounts on the platform
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search users by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Users Table */}
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <span className="text-xs font-medium">
                          {user.username?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">
                        {user.username}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(user.roles || []).map((role) => (
                        <Badge
                          key={role}
                          variant={getRoleBadgeVariant(role)}
                          className="text-xs"
                        >
                          {role.replace("ROLE_", "")}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => viewUserDetails(user.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (pagination.totalPages ?? Math.ceil(pagination.totalElements / pageSize)) > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {users.length} of {pagination.totalElements} users
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {pagination.totalPages ?? Math.ceil(pagination.totalElements / pageSize)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={pagination.last}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* User Details Dialog */}
      <Dialog open={selectedUser !== null} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about this user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <span className="text-xl font-semibold">
                    {selectedUser.username?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {selectedUser.username}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(selectedUser.roles || []).map((role) => (
                  <Badge
                    key={role}
                    variant={getRoleBadgeVariant(role)}
                    className="gap-1"
                  >
                    <Shield className="h-3 w-3" />
                    {role.replace("ROLE_", "")}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-md border border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-blue-500/10 p-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-foreground">
                      {selectedUser.totalPosts ?? 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Posts</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-purple-500/10 p-2">
                    <MessageSquare className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-foreground">
                      {selectedUser.totalComments ?? 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Comments</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono text-foreground">{selectedUser.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="text-foreground">
                    {formatDate(selectedUser.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
