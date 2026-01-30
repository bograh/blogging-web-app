"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { Header } from "@/components/header";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { User, Calendar, FileText, MessageCircle, Loader2 } from "lucide-react";
import type { UserProfile, Post } from "@/types";

// Helper function to safely format dates
const formatDate = (dateString: string, formatStr: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Unknown date";
    }
    return format(date, formatStr);
  } catch (error) {
    return "Unknown date";
  }
};

function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadProfile = async () => {
    try {
      const response = await api.auth.getProfile(id);
      if (response.data) {
        setProfile(response.data);
        // Convert recentPosts from profile response to Post format
        if (response.data.recentPosts && response.data.recentPosts.length > 0) {
          const convertedPosts: Post[] = response.data.recentPosts.map((post) => ({
            id: post.id,
            title: post.title,
            body: post.body,
            excerpt: post.excerpt,
            authorId: post.authorId,
            authorName: post.author,
            tags: post.tags,
            createdAt: post.postedAt,
            lastUpdated: post.lastUpdated,
            commentsCount: post.totalComments,
          }));
          setPosts(convertedPosts);
        } else {
          // Fallback to separate API call if posts not in profile
          loadUserPosts();
        }
      }
    } catch (error) {
      console.log("Error loading profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserPosts = async () => {
    try {
      const response = await api.posts.getAll(0, 10, {
        author: id,
        sort: "createdAt",
        order: "DESC",
      });
      if (response.data) {
        setPosts(response.data.content);
      }
    } catch (error) {
      console.log("Error loading user posts:", error);
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">User not found</h1>
          <p className="mt-2 text-muted-foreground">
            The user you are looking for does not exist.
          </p>
          <Link href="/">
            <Button className="mt-6">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.userId;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-12">
        {/* Profile Header */}
        <div className="rounded-xl border border-border bg-card p-8">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            {/* Avatar */}
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-foreground">
                {profile.username}
              </h1>
              <p className="mt-1 text-muted-foreground">{profile.email}</p>

              {profile.bio && (
                <p className="mt-4 text-sm leading-relaxed text-foreground/80">
                  {profile.bio}
                </p>
              )}

              {/* Stats */}
              <div className="mt-6 flex flex-wrap justify-center gap-6 md:justify-start">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{profile.totalPosts} posts</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  <span>{profile.totalComments} comments</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {isOwnProfile && (
              <Link href="/posts/new">
                <Button>Write a Post</Button>
              </Link>
            )}
          </div>
        </div>

        {/* User Posts */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-foreground">
            {isOwnProfile ? "Your Recent Posts" : `Recent Posts by ${profile.username}`}
          </h2>

          {posts.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border py-12 text-center">
              <p className="text-muted-foreground">
                {isOwnProfile
                  ? "You haven't written any posts yet."
                  : "This user hasn't written any posts yet."}
              </p>
              {isOwnProfile && (
                <Link href="/posts/new">
                  <Button className="mt-4">Write Your First Post</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Comments */}
        {profile.recentComments && profile.recentComments.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-foreground">
              {isOwnProfile ? "Your Recent Comments" : `Recent Comments by ${profile.username}`}
            </h2>
            <div className="mt-6 space-y-4">
              {profile.recentComments.map((comment) => (
                <Link
                  key={comment.id}
                  href={`/posts/${comment.postId}`}
                  className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-card/80"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Commented on post #{comment.postId}</span>
                        <span className="text-muted-foreground/50">·</span>
                        <time>{formatDate(comment.createdAt, "MMM d, yyyy")}</time>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-foreground">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ProfilePageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <AuthProvider>
      <ProfilePage params={params} />
    </AuthProvider>
  );
}
