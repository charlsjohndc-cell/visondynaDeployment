"use client";

import JobCard from "@/components/job-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Job } from "@/lib/types";
import { toTitleCase } from "@/lib/utils";
import { Search, Filter, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Category = { id: string; name: string };

type JobWithSkills = Job & {
  skills: { skillTag: { id: string; name: string } }[];
};

type JobUI = Omit<JobWithSkills, "createdAt"> & { createdAt: Date };

type JobsResponse = {
  ok: true;
  data: JobWithSkills[];
  meta?: { nextCursor?: string | null; limit?: number };
};

type CategoriesResponse = { ok: true; data: Category[] };

const PAGE_SIZE = 10;

const toJob = (j: JobWithSkills): JobUI => ({
  ...j,
  createdAt: new Date(j.createdAt),
});

export default function JobsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(
    null,
  );

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [jobs, setJobs] = useState<JobUI[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cursorRef = useRef<string | null>(null);
  const hasNextRef = useRef(true);
  const fetchingRef = useRef(false);
  const loadingRef = useRef(false);
  const categoryRef = useRef<string | null>(null);
  const searchRef = useRef("");

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  useEffect(() => {
    hasNextRef.current = hasNext;
  }, [hasNext]);

  useEffect(() => {
    fetchingRef.current = isFetchingMore;
  }, [isFetchingMore]);

  useEffect(() => {
    loadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    categoryRef.current = selectedCategoryId;
  }, [selectedCategoryId]);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/categories", {
          headers: { Accept: "application/json" },
        });

        const json: CategoriesResponse = await res.json();
        if (!cancelled && json?.ok) {
          setCategories(json.data);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const fetchJobsPage = useCallback(async (opts?: { reset?: boolean }) => {
    const reset = opts?.reset === true;

    if (reset) {
      setIsLoading(true);
      loadingRef.current = true;
      setErrorMsg(null);
      setCursor(null);
      cursorRef.current = null;
      setHasNext(true);
      hasNextRef.current = true;
      setJobs([]);
    } else {
      if (loadingRef.current || fetchingRef.current || !hasNextRef.current) {
        return;
      }
      setIsFetchingMore(true);
      fetchingRef.current = true;
    }

    try {
      const url = new URL("/api/jobs", window.location.origin);
      url.searchParams.set("limit", String(PAGE_SIZE));

      const cat = categoryRef.current;
      const q = searchRef.current;
      const cur = reset ? null : cursorRef.current;

      if (cat) url.searchParams.set("categoryId", cat);
      if (q) url.searchParams.set("q", q);
      if (cur) url.searchParams.set("cursor", cur);

      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) throw new Error(`Failed to load jobs (${res.status})`);

      const json: JobsResponse = await res.json();
      const batch = json.data.map(toJob);
      const nextCursor = json.meta?.nextCursor ?? null;

      setJobs((prev) => (reset ? batch : [...prev, ...batch]));
      setCursor(nextCursor);
      cursorRef.current = nextCursor;

      const more = Boolean(nextCursor);
      setHasNext(more);
      hasNextRef.current = more;
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      if (reset) {
        setIsLoading(false);
        loadingRef.current = false;
      } else {
        setIsFetchingMore(false);
        fetchingRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    fetchJobsPage({ reset: true });
  }, [selectedCategoryId, search, fetchJobsPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          fetchJobsPage();
        }
      },
      { root: null, rootMargin: "600px 0px", threshold: 0 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchJobsPage]);

  function toggleCategory(id: string) {
    setPendingCategoryId((prev) => (prev === id ? null : id));
  }

  function applyFilter() {
    setSelectedCategoryId(pendingCategoryId ?? null);
  }

  function clearFilters() {
    setPendingCategoryId(null);
    setSelectedCategoryId(null);
    setSearchInput("");
    setSearch("");
  }

  const activeCategoryName =
    categories.find((c) => c.id === selectedCategoryId)?.name ?? null;

  const hasActiveFilters = Boolean(search || selectedCategoryId);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
      <Card className="top-4 h-fit w-full rounded-2xl border lg:sticky lg:w-[280px] dark:bg-slate-950">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Filter Jobs</CardTitle>
          </div>

          <InputGroup>
            <InputGroupInput
              placeholder="Search title, company, or location..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              disabled={isLoading}
            />
            <InputGroupAddon align="inline-start">
              <Search className="size-4" />
            </InputGroupAddon>
          </InputGroup>

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {search && <Badge variant="secondary">Search: {search}</Badge>}
              {activeCategoryName && (
                <Badge variant="secondary">
                  Category: {toTitleCase(activeCategoryName)}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <Separator />

        <CardContent className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Categories</CardTitle>
            {pendingCategoryId && (
              <button
                type="button"
                onClick={() => setPendingCategoryId(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear selection
              </button>
            )}
          </div>

          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No categories available.
              </p>
            ) : (
              categories.map((category) => {
                const checked = pendingCategoryId === category.id;

                return (
                  <label
                    key={category.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition hover:bg-muted/40"
                  >
                    <Checkbox
                      id={category.id}
                      checked={checked}
                      onCheckedChange={() => toggleCategory(category.id)}
                      className="dark:border-slate-700 dark:bg-slate-950/25"
                    />
                    <span className="text-sm font-normal">
                      {toTitleCase(category.name)}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1 dark:bg-slate-900 dark:hover:bg-slate-900/60"
            onClick={applyFilter}
          >
            Apply
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            <X className="size-4" />
          </Button>
        </CardFooter>
      </Card>

      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Available Jobs</h1>
            <p className="text-sm text-muted-foreground">
              Explore opportunities that match your interests.
            </p>
          </div>

          {!isLoading && !errorMsg && jobs.length > 0 && (
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
              {jobs.length} loaded
            </Badge>
          )}
        </div>

        {isLoading && jobs.length === 0 ? (
          <SkeletonList />
        ) : errorMsg ? (
          <ErrorBox
            message={errorMsg}
            onRetry={() => fetchJobsPage({ reset: true })}
          />
        ) : jobs.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {isFetchingMore && <LoadingMore />}

            {!hasNext && jobs.length > 0 && (
              <div className="py-4 text-center text-sm text-slate-500">
                You’re all caught up
              </div>
            )}
          </>
        )}

        <div ref={sentinelRef} className="h-px w-full" />
      </div>

      <Card className="top-4 hidden h-fit w-[260px] rounded-2xl border lg:sticky lg:block dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="text-base">Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Use search to find jobs by title, company, or location.</p>
          <p>Apply category filters to narrow down the feed faster.</p>
          <p>Open a job card to view details and submit your application.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="rounded-2xl border p-4 dark:bg-slate-950">
          <div className="space-y-3">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-20 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function LoadingMore() {
  return (
    <div className="py-4 text-center text-sm text-slate-400">Loading more…</div>
  );
}

function EmptyState() {
  return (
    <Card className="rounded-2xl border dark:bg-slate-950">
      <CardHeader>
        <CardTitle>No jobs found</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-400">
        Try changing your search or category filter.
      </CardContent>
    </Card>
  );
}

function ErrorBox({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card className="rounded-2xl border border-red-900 bg-red-950/40">
      <CardHeader>
        <CardTitle className="text-red-300">Couldn’t load jobs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-red-200/80">{message}</p>
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}
