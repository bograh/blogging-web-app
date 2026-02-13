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
import { Badge } from "@/components/ui/badge";
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
import type { Post, PaginatedResponse } from "@/types";

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<Post> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [deletePostId, setDeletePostId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    loadPosts();
  }, [currentPage]);

  const loadPosts = async (search?: string) => {
    try {
      setIsLoading(true);
      const response = await api.admin.getPosts(currentPage, pageSize, {
        sort: "lastUpdated",
        order: "DESC",
        search: search || searchQuery || undefined,
      });
      if (response.data) {
        setPosts(response.data.content);
        setPagination(response.data);
      }
    } catch (err: any) {
      console.error("Failed to load posts:", err);
      toast.error(err.errorMessage || "Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    loadPosts(searchQuery);
  };

  const handleDelete = async () => {
    if (!deletePostId) return;

    try {
      setIsDeleting(true);
      await api.admin.deletePost(deletePostId);
      toast.success("Post deleted successfully");
      loadPosts();
    } catch (err: any) {
      console.error("Failed to delete post:", err);
      toast.error(err.errorMessage || "Failed to delete post");
    } finally {
      setIsDeleting(false);
      setDeletePostId(null);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Posts</h1>
        <p className="text-muted-foreground">
          Manage all posts on the platform
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Posts Table */}
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Comments</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                </TableRow>
              ))
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No posts found
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => {
                const authorName = typeof post.author === 'object'
                  ? post.author?.username
                  : (post.authorName || post.author || 'Unknown');
                const tags = Array.isArray(post.tags)
                  ? post.tags.map(t => typeof t === 'string' ? t : t.name).slice(0, 3)
                  : [];

                return (
                  <TableRow key={post.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {post.id}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground line-clamp-1">
                        {post.title}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {authorName}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {post.commentsCount ?? post.totalComments ?? 0}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(post.lastUpdated || post.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-8 w-8"
                        >
                          <Link href={`/posts/${post.id}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeletePostId(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (pagination.totalPages ?? Math.ceil(pagination.totalElements / pageSize)) > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {posts.length} of {pagination.totalElements} posts
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
      <AlertDialog open={deletePostId !== null} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
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
