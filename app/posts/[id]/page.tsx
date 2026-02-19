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
import { Input } from "@/components/ui/input";
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
  Image as ImageIcon,
  Smile,
  X as XIcon,
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
  const [commentError, setCommentError] = useState("");
  const [commentDeleteError, setCommentDeleteError] = useState("");
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState("");
  const [gifs, setGifs] = useState<any[]>([]);
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);

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
    setCommentError("");

    if (!user) {
      setCommentError("Please sign in to comment");
      return;
    }

    if (!newComment.trim()) {
      setCommentError("Comment cannot be empty");
      return;
    }

    setIsSubmittingComment(true);
    try {
      const response = await api.comments.create({
        commentContent: newComment,
        postId: Number(id),
      });
      if (response.data) {
        setComments((prev) => [response.data!, ...prev]);
        setNewComment("");
        setCommentError("");
        toast.success("Comment added");
      }
    } catch (error: any) {
      console.log("Error adding comment:", error);
      const errorMessage =
        typeof error?.errorMessage === "string"
          ? error.errorMessage
          : error?.errorMessage && typeof error.errorMessage === "object"
            ? Object.values(error.errorMessage).join(". ")
            : "Failed to add comment";
      setCommentError(errorMessage || "Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setCommentDeleteError("");
    try {
      await api.comments.delete(commentId, Number(id));
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comment deleted");
    } catch (error: any) {
      console.log("Error deleting comment:", error);
      const errorMessage =
        typeof error?.errorMessage === "string"
          ? error.errorMessage
          : error?.errorMessage && typeof error.errorMessage === "object"
            ? Object.values(error.errorMessage).join(". ")
            : "Failed to delete comment";
      setCommentDeleteError(errorMessage || "Failed to delete comment");
    }
  };

  const searchGifs = async (query: string) => {
    setIsLoadingGifs(true);
    try {
      const apiKey = "GlVGYHkr3WSBnllca54iNt0yFbjz7L65"; // Public Giphy API key
      const endpoint = query
        ? `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=20`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=20`;
      const response = await fetch(endpoint);
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.log("Error fetching GIFs:", error);
      toast.error("Failed to load GIFs");
    } finally {
      setIsLoadingGifs(false);
    }
  };

  const handleGifSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchGifs(gifSearch);
  };

  const handleSelectGif = (gifUrl: string) => {
    setNewComment(gifUrl);
    setShowGifPicker(false);
    setGifSearch("");
    setGifs([]);
  };

  const isGifUrl = (text: string) => {
    return text.match(/^https?:\/\/.+\.(gif|giphy\.com)/i) || text.includes('media.giphy.com');
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
              <div className="relative">
                {!isGifUrl(newComment) && (
                  <Textarea
                    placeholder="Write a comment or add a GIF..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                )}
                {isGifUrl(newComment) && (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={newComment}
                      alt="Selected GIF"
                      className="max-h-[200px] rounded-lg border border-border"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 bg-background/80 hover:bg-background"
                      onClick={() => {
                        setNewComment("");
                        setCommentError("");
                      }}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              {commentError && (
                <div className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {commentError}
                </div>
              )}
              <div className="mt-3 flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    setShowGifPicker(!showGifPicker);
                    if (!showGifPicker && gifs.length === 0) {
                      searchGifs("");
                    }
                  }}
                >
                  <Smile className="h-4 w-4" />
                  GIF
                </Button>
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

              {/* GIF Picker */}
              {showGifPicker && (
                <div className="mt-4 rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Choose a GIF</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        setShowGifPicker(false);
                        setGifSearch("");
                      }}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mb-3">
                    <Input
                      type="text"
                      placeholder="Search GIFs..."
                      value={gifSearch}
                      onChange={(e) => setGifSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          searchGifs(gifSearch);
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {isLoadingGifs ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {gifs.map((gif) => (
                          <button
                            key={gif.id}
                            type="button"
                            onClick={() => handleSelectGif(gif.images.fixed_height.url)}
                            className="relative overflow-hidden rounded-lg border border-border hover:border-primary transition-colors"
                          >
                            <img
                              src={gif.images.fixed_height_small.url}
                              alt={gif.title}
                              className="w-full h-auto"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">Powered by GIPHY</p>
                </div>
              )}
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
            {commentDeleteError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {commentDeleteError}
              </div>
            )}
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
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete comment</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your comment.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteComment(comment.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                    <div className="mt-3">
                      {isGifUrl(comment.content) ? (
                        <img
                          src={comment.content}
                          alt="GIF"
                          className="max-h-[300px] rounded-lg border border-border"
                        />
                      ) : (
                        <p className="text-sm leading-relaxed text-foreground/80">
                          {comment.content}
                        </p>
                      )}
                    </div>
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
