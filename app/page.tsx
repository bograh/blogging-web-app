"use client";

import React from "react"

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AuthProvider } from "@/contexts/auth-context";
import { Header } from "@/components/header";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, Loader2 } from "lucide-react";
import type { Post } from "@/types";

function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (search?: string) => {
    setIsLoading(true);
    try {
      const response = await api.posts.getAll(0, 6, {
        sort: "updatedAt",
        order: "DESC",
        search: search || undefined,
      });
      if (response.data) {
        setPosts(response.data.content);
      }
    } catch (error) {
      console.log("Error loading posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPosts(searchQuery);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-pretty text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                Stories & Insights for{" "}
                <span className="text-primary">Developers</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Discover tutorials, best practices, and technical deep-dives
                from developers building the future of the web.
              </p>

              {/* Search */}
              <form
                onSubmit={handleSearch}
                className="mx-auto mt-10 flex max-w-md gap-2"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 pl-10"
                  />
                </div>
                <Button type="submit" size="lg">
                  Search
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Featured Posts */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Latest Posts
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fresh content from our community
                </p>
              </div>
              <Link href="/posts">
                <Button variant="ghost" className="gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-20 text-center">
                <p className="text-muted-foreground">
                  No posts found. Be the first to write one!
                </p>
                <Link href="/posts/new" className="mt-4 inline-block">
                  <Button className="mt-4">Create Post</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <span className="text-xs font-bold text-primary-foreground">
                  DB
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                DevBlog - Developer Stories & Insights
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with Next.js and love
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <HomePage />
    </AuthProvider>
  );
}
