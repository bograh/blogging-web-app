"use client";

import React from "react"

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, X, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Post } from "@/types";

function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPost = async () => {
    try {
      const response = await api.posts.getById(Number(id));
      if (response.data) {
        setPost(response.data);
        setTitle(response.data.title);
        setExcerpt(response.data.excerpt || "");
        setContent(response.data.body);
        setTags(response.data.tags || []);
      }
    } catch (error) {
      console.log("Error loading post:", error);
      toast.error("Failed to load post");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in title and content");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.posts.update(Number(id), {
        title: title.trim(),
        excerpt: excerpt.trim() || undefined,
        body: content.trim(),
        tags,
      });
      if (response.data) {
        toast.success("Post updated successfully!");
        router.push(`/posts/${id}`);
      }
    } catch (error: unknown) {
      console.log("Error updating post:", error);
      const errorMessage =
        error &&
        typeof error === "object" &&
        "errorMessage" in error &&
        typeof error.errorMessage === "string"
          ? error.errorMessage
          : "Failed to update post";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isAuthLoading) {
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
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Post not found</h1>
          <p className="mt-2 text-muted-foreground">
            The post you are trying to edit does not exist.
          </p>
          <Link href="/posts">
            <Button className="mt-6">Back to Posts</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!user || user.id !== post.authorId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Access denied</h1>
          <p className="mt-2 text-muted-foreground">
            You don&apos;t have permission to edit this post.
          </p>
          <Link href={`/posts/${id}`}>
            <Button className="mt-6">View Post</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-12">
        <Link
          href={`/posts/${id}`}
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Post
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Edit Post</h1>
          <p className="mt-2 text-muted-foreground">
            Update your post content
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter a compelling title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg"
              required
            />
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt (optional)</Label>
            <Textarea
              id="excerpt"
              placeholder="A brief summary of your post..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="resize-none"
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              This will be shown in post previews
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {tag}</span>
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Write your post content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] resize-y"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link href={`/posts/${id}`}>
              <Button variant="ghost">Cancel</Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="min-w-32">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function EditPostPageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <AuthProvider>
      <EditPostPage params={params} />
    </AuthProvider>
  );
}
