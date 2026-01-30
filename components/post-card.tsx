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
  // Support nested author object from GraphQL
  const getAuthorName = () => {
    if (typeof post.author === 'object' && post.author?.username) {
      return post.author.username;
    }
    return post.authorName || (typeof post.author === 'string' ? post.author : '') || "Unknown";
  };

  const authorName = getAuthorName();
  const createdAt = post.createdAt || post.postedAt || post.updatedAt || "";
  const commentsCount = post.commentsCount ?? post.totalComments ?? 0;

  // Handle tags - support both string[] and {name: string}[]
  const getTags = (): string[] => {
    if (!post.tags) return [];
    if (Array.isArray(post.tags) && post.tags.length > 0) {
      if (typeof post.tags[0] === 'string') {
        return post.tags as string[];
      }
      if (typeof post.tags[0] === 'object' && 'name' in post.tags[0]) {
        return (post.tags as { name: string }[]).map(t => t.name);
      }
    }
    return [];
  };

  const tags = getTags();

  return (
    <article className="group relative rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:bg-card/80">
      <Link href={`/posts/${post.id}`} className="absolute inset-0 z-10">
        <span className="sr-only">Read {post.title}</span>
      </Link>

      <div className="flex flex-col gap-4">
        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs font-medium"
              >
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="secondary" className="text-xs font-medium">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Title */}
        <h2 className="text-xl font-semibold text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h2>

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
