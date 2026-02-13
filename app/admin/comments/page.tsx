"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { AdminComment, PaginatedResponse } from "@/types";

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<AdminComment> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    loadComments();
  }, [currentPage]);

  const loadComments = async (search?: string) => {
    try {
      setIsLoading(true);
      const response = await api.admin.getComments(currentPage, pageSize, {
        sort: "createdAt",
        order: "DESC",
        search: search || searchQuery || undefined,
      });
      if (response.data) {
        setComments(response.data.content);
        setPagination(response.data);
      }
    } catch (err: any) {
      console.error("Failed to load comments:", err);
      toast.error(err.errorMessage || "Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    loadComments(searchQuery);
  };

  const handleDelete = async () => {
    if (!deleteCommentId) return;

    try {
      setIsDeleting(true);
      await api.admin.deleteComment(deleteCommentId);
      toast.success("Comment deleted successfully");
      loadComments();
    } catch (err: any) {
      console.error("Failed to delete comment:", err);
      toast.error(err.errorMessage || "Failed to delete comment");
    } finally {
      setIsDeleting(false);
      setDeleteCommentId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + "...";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Comments</h1>
        <p className="text-muted-foreground">
          Moderate comments on the platform
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Comments Table */}
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead className="w-[300px]">Content</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Post</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                </TableRow>
              ))
            ) : comments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No comments found
                </TableCell>
              </TableRow>
            ) : (
              comments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {comment.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div className="text-foreground line-clamp-2 text-sm">
                      {truncateContent(comment.content)}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {comment.author || "Unknown"}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/posts/${comment.postId}`}
                      target="_blank"
                      className="text-primary hover:underline text-sm flex items-center gap-1"
                    >
                      Post #{comment.postId}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(comment.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-8 w-8"
                      >
                        <Link href={`/posts/${comment.postId}`} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteCommentId(comment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
            Showing {comments.length} of {pagination.totalElements} comments
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteCommentId !== null} onOpenChange={() => setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
