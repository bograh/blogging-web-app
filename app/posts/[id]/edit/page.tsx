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
import { ArrowLeft, Loader2, X, Plus, ImageIcon, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { Post, ImageUpload } from "@/types";

function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [existingImages, setExistingImages] = useState<ImageUpload[]>([]);

  useEffect(() => {
    loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPost = async () => {
    try {
      const [postRes, imagesRes] = await Promise.allSettled([
        api.posts.getById(Number(id)),
        api.images.getCompletedByPost(Number(id)),
      ]);
      if (postRes.status === "fulfilled" && postRes.value.data) {
        const data = postRes.value.data;
        setPost(data);
        setTitle(data.title);
        setContent(data.body || "");
        const tagNames = data.tags ?? [];
        setTags(tagNames);
      }
      if (imagesRes.status === "fulfilled" && imagesRes.value.data) {
        setExistingImages(imagesRes.value.data);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleUploadImage = async () => {
    if (!imageFile) return;
    setIsUploadingImage(true);
    try {
      await api.images.upload(Number(id), imageFile);
      toast.success("Image upload started. It will appear once processed.");
      setImageFile(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      const res = await api.images.getCompletedByPost(Number(id)).catch(() => null);
      if (res?.data) setExistingImages(res.data);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "errorMessage" in err
        ? String((err as { errorMessage: unknown }).errorMessage)
        : "Image upload failed";
      toast.error(msg);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await api.images.delete(imageId);
      setExistingImages((prev) => prev.filter((img) => img.imageId !== imageId));
      toast.success("Image deleted");
    } catch {
      toast.error("Failed to delete image");
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
    setFormError("");

    if (!title.trim() || !content.trim()) {
      setFormError("Please fill in title and content");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.posts.update(Number(id), {
        title: title.trim(),
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
        (typeof error.errorMessage === "string" || typeof error.errorMessage === "object")
          ? typeof error.errorMessage === "string"
            ? error.errorMessage
            : Object.values(error.errorMessage as Record<string, string>).join(". ")
          : "Failed to update post";
      setFormError(errorMessage || "Failed to update post");
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

          {/* Image Management */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Images</label>

            {existingImages.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {existingImages.map((img) => (
                  <div key={img.imageId} className="group relative overflow-hidden rounded-lg border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {img.url && <img src={img.url} alt="Post image" className="h-40 w-full object-cover" />}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.imageId)}
                      className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-destructive opacity-0 shadow transition group-hover:opacity-100 hover:bg-background"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {imagePreview ? (
                <div className="relative flex-1 overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="New upload preview" className="h-32 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); if (imagePreview) URL.revokeObjectURL(imagePreview); setImagePreview(null); }}
                    className="absolute right-2 top-2 rounded-full bg-background/80 p-1 shadow hover:bg-background"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 transition hover:bg-muted/50">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Add image (JPEG, PNG, GIF, WebP)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="sr-only"
                    onChange={handleImageChange}
                  />
                </label>
              )}

              {imageFile && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleUploadImage}
                  disabled={isUploadingImage}
                  className="shrink-0"
                >
                  {isUploadingImage ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>
                  ) : (
                    <><Upload className="mr-2 h-4 w-4" />Upload Image</>
                  )}
                </Button>
              )}
            </div>
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

          {formError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

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
