"use client";

import React from "react"

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AuthProvider } from "@/contexts/auth-context";
import { Header } from "@/components/header";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, X, ChevronDown } from "lucide-react";
import type { Post, Tag } from "@/types";

function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [sortBy, setSortBy] = useState<
    "createdAt" | "lastUpdated" | "updatedAt" | "title" | "id"
  >("updatedAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadPopularTags();
  }, []);

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, sortOrder, selectedTags]);

  const loadPopularTags = async () => {
    try {
      const response = await api.tags.getPopular();
      if (response.data && Array.isArray(response.data)) {
        setPopularTags(response.data);
      }
    } catch (error) {
      console.log("Error loading popular tags:", error);
    }
  };

  const loadPosts = async (search?: string) => {
    setIsLoading(true);
    try {
      const response = await api.posts.getAll(page, 12, {
        sort: sortBy,
        order: sortOrder,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        search: search || searchQuery || undefined,
      });
      if (response.data) {
        setPosts(response.data.content);
        // Calculate totalPages if not provided by API
        const calculatedTotalPages = response.data.totalPages ||
          Math.ceil(response.data.totalElements / response.data.size);
        setTotalPages(calculatedTotalPages);
        setHasMore(!response.data.last);
      }
    } catch (error) {
      console.log("Error loading posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadPosts(searchQuery);
  };

  const toggleTag = (tag: string) => {
    setPage(0);
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setSortBy("createdAt");
    setSortOrder("DESC");
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground">All Posts</h1>
          <p className="mt-2 text-muted-foreground">
            Browse all articles from our community
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-xl border border-border bg-card">
          {/* Header */}
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex w-full items-center justify-between p-6 text-left hover:bg-accent/10 rounded-t-xl transition-colors"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Filters</h2>
              {(selectedTags.length > 0 || searchQuery) && (
                <Badge variant="secondary" className="ml-2">
                  {selectedTags.length + (searchQuery ? 1 : 0)} active
                </Badge>
              )}
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform ${
                isFiltersOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Collapsible Content */}
          {isFiltersOpen && (
            <div className="border-t border-border p-6 pt-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
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

              {/* Tags */}
              <div className="mt-4">
                <p className="mb-2 text-sm text-muted-foreground">Popular tags:</p>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <Badge
                      key={tag.name}
                      variant={selectedTags.includes(tag.name) ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag.name)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  <Select
                    value={sortBy}
                    onValueChange={(v) =>
                      setSortBy(v as "createdAt" | "lastUpdated" | "title" | "id")
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Date Created</SelectItem>
                      <SelectItem value="lastUpdated">Last Updated</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Order:</span>
                  <Select
                    value={sortOrder}
                    onValueChange={(v) => setSortOrder(v as "ASC" | "DESC")}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortBy === "title" ? (
                        <>
                          <SelectItem value="ASC">A-Z</SelectItem>
                          <SelectItem value="DESC">Z-A</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="DESC">Newest</SelectItem>
                          <SelectItem value="ASC">Oldest</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {(selectedTags.length > 0 || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-1 text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Metrics Navigation Button */}
        <div className="mb-6 flex justify-end">
          <Button asChild variant="outline">
            <a href="/metrics">
              View Metrics
            </a>
          </Button>
        </div>

        {/* Posts Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-20 text-center">
            <p className="text-muted-foreground">
              No posts found matching your criteria.
            </p>
            <Button variant="ghost" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-10 flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                Showing page {page + 1} of {totalPages} ({posts.length} posts on this page)
              </p>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={page === 0}
                    onClick={() => setPage(0)}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i;
                      } else if (page < 3) {
                        pageNum = i;
                      } else if (page > totalPages - 4) {
                        pageNum = totalPages - 5 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className="min-w-[40px]"
                        >
                          {pageNum + 1}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    disabled={!hasMore}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!hasMore}
                    onClick={() => setPage(totalPages - 1)}
                  >
                    Last
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function PostsPageWrapper() {
  return (
    <AuthProvider>
      <PostsPage />
    </AuthProvider>
  );
}
