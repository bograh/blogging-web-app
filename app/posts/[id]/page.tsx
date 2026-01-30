"use client";

import React from "react"

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  MessageCircle,
  Edit,
  Trash2,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import type { Post, Comment } from "@/types";

// Helper function to safely format dates
const formatDate = (dateString: string, formatStr: string) => {
  try {
    if (!dateString) {
      return "Unknown date";
    }

    // Try parsing as-is first
    let date = new Date(dateString);

    // If invalid, try parsing custom format: "Tuesday, January 27, 2026 09:42:03"
    if (isNaN(date.getTime())) {
      // Remove day name and parse the rest
      const withoutDay = dateString.replace(/^\w+,\s*/, '');
      date = new Date(withoutDay);
    }

    if (isNaN(date.getTime())) {
      return "Unknown date";
    }
    return format(date, formatStr);
  } catch (error) {
    return "Unknown date";
  }
};

function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    loadPost();
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPost = async () => {
    try {
      const response = await api.posts.getById(Number(id));
      if (response.data) {
        setPost(response.data);
      }
    } catch (error) {
      console.log("Error loading post:", error);
      toast.error("Failed to load post");
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await api.comments.getByPostId(Number(id));
      if (response.data && Array.isArray(response.data)) {
        setComments(response.data);
      }
    } catch (error) {
      console.log("Error loading comments:", error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.posts.delete(Number(id));
      toast.success("Post deleted successfully");
      router.push("/posts");
    } catch (error) {
      console.log("Error deleting post:", error);
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSubmittingComment(true);
    try {
      const response = await api.comments.create({
        commentContent: newComment,
        postId: Number(id),
      });
      if (response.data) {
        setComments((prev) => [...prev, response.data!]);
        setNewComment("");
        toast.success("Comment added");
      }
    } catch (error) {
      console.log("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.comments.delete(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comment deleted");
    } catch (error) {
      console.log("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Post not found</h1>
          <p className="mt-2 text-muted-foreground">
            The post you are looking for does not exist.
          </p>
          <Link href="/posts">
            <Button className="mt-6">Back to Posts</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isAuthor = user?.id === post.authorId;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-12">
        {/* Back Button */}
        <Link
          href="/posts"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Posts
        </Link>

        {/* Post Header */}
        <article>
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => {
                const tagName = typeof tag === 'string' ? tag : tag.name;
                return (
                  <Badge key={tagName} variant="secondary">
                    {tagName}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Title */}
          <h1 className="text-pretty text-3xl font-bold text-foreground md:text-4xl">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="mt-6 flex flex-wrap items-center gap-4 border-b border-border pb-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                <User className="h-4 w-4" />
              </div>
              <span>{typeof post.author === 'string' ? post.author : post.authorName || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <time dateTime={post.postedAt || post.createdAt || post.updatedAt}>
                {formatDate(post.postedAt || post.createdAt || post.updatedAt || post.lastUpdated || "", "MMM d, yyyy")}
              </time>
            </div>
            {post.lastUpdated && post.lastUpdated !== (post.postedAt || post.createdAt) && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  Updated {formatDate(post.lastUpdated, "MMM d, yyyy")}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{comments.length} comments</span>
            </div>
          </div>

          {/* Author Actions */}
          {isAuthor && (
            <div className="mt-4 flex gap-2">
              <Link href={`/posts/${id}/edit`}>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive bg-transparent"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your post and all its comments.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* Content */}
          <div className="prose prose-invert mt-8 max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed text-foreground/90">
              {post.body}
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <section className="mt-16 border-t border-border pt-10">
          <h2 className="text-xl font-bold text-foreground">
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleSubmitComment} className="mt-6">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <div className="mt-3 flex justify-end">
                <Button
                  type="submit"
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="gap-2"
                >
                  {isSubmittingComment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Post Comment
                </Button>
              </div>
            </form>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-border p-6 text-center">
              <p className="text-muted-foreground">
                Please sign in to leave a comment.
              </p>
              <Link href="/login">
                <Button variant="outline" className="mt-3 bg-transparent">
                  Sign In
                </Button>
              </Link>
            </div>
          )}

          {/* Comments List */}
          <div className="mt-8 space-y-6">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => {
                // Check if current user is the author
                const commentAuthor = comment.author || comment.authorName || "";
                const currentUserName = user?.username || user?.name || "";
                const isAuthor = user && commentAuthor &&
                  commentAuthor.toLowerCase() === currentUserName.toLowerCase();

                return (
                  <div
                    key={comment.id}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary">
                          <User className="h-3 w-3" />
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {comment.author || comment.authorName || "Anonymous"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.createdAt, "MMM d, yyyy")}
                        </span>
                      </div>
                      {isAuthor && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete comment</span>
                        </Button>
                      )}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                      {comment.content}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function PostDetailPageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <AuthProvider>
      <PostDetailPage params={params} />
    </AuthProvider>
  );
}
