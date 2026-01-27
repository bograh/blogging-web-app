"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Post } from "@/types";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  // Helper function to safely format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Recently";
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "Recently";
    }
  };

  // Handle different field names from different API endpoints
  const authorName = post.authorName || post.author || "Unknown";
  const createdAt = post.createdAt || post.postedAt || "";
  const commentsCount = post.commentsCount ?? post.totalComments ?? 0;

  return (
    <article className="group relative rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:bg-card/80">
      <Link href={`/posts/${post.id}`} className="absolute inset-0 z-10">
        <span className="sr-only">Read {post.title}</span>
      </Link>

      <div className="flex flex-col gap-4">
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs font-medium"
              >
                {tag}
              </Badge>
            ))}
            {post.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs font-medium">
                +{post.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Title */}
        <h2 className="text-xl font-semibold text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h2>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary">
              <User className="h-3 w-3" />
            </div>
            <span>{authorName}</span>
            <span className="text-muted-foreground/50">·</span>
            <time dateTime={createdAt}>
              {formatDate(createdAt)}
            </time>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>{commentsCount}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
