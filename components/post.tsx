"use client";

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Send,
  Bookmark,
  Banknote,
  MapPin,
  Users,
  Tag,
  Clock3,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNowStrict } from "date-fns";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Badge } from "./ui/badge";
import { toTitleCase } from "@/lib/utils";
import type { JobStatus } from "@prisma/client";

type Post = {
  title: string;
  id: string;
  status: JobStatus;
  location: string;
  description: string;
  createdAt: Date;
  deletedAt?: Date | null;
  company: string;
  salary: number;
  manpower: number;
  categoryId: string;
  category: { name: string };
};

const PREVIEW_LENGTH = 220;

export default function Post({ post }: { post: Post }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const isLong = post.description.length > PREVIEW_LENGTH;
  const preview = post.description.slice(0, PREVIEW_LENGTH);

  useEffect(() => {
    async function checkSaved() {
      try {
        const res = await fetch(`/api/jobs/saved-status?jobId=${post.id}`);
        const data = await res.json();
        setSaved(Boolean(data.saved));
      } catch (err) {
        console.error(err);
      }
    }

    checkSaved();
  }, [post.id]);

  const handleToggleSave = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/jobs/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: post.id }),
      });

      const data = await res.json();

      if (typeof data.saved === "boolean") {
        setSaved(data.saved);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
      <CardHeader className="space-y-4 pb-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {post.title}
              </CardTitle>

              <CardDescription className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="size-4" />
                  {post.company}
                </span>
                <span className="hidden text-slate-300 dark:text-slate-700 sm:inline">
                  •
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-4" />
                  {formatDistanceToNowStrict(post.createdAt, {
                    addSuffix: true,
                  })}
                </span>
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 font-normal text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                <Banknote className="mr-1.5 size-4" />
                ₱ {post.salary.toLocaleString()}
              </Badge>

              <Badge
                variant="outline"
                className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 font-normal text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                <MapPin className="mr-1.5 size-4" />
                {post.location}
              </Badge>

              <Badge
                variant="outline"
                className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 font-normal text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                <Users className="mr-1.5 size-4" />
                {post.manpower} slots
              </Badge>

              <Badge
                variant="outline"
                className="rounded-full border-lime-200 bg-lime-50 px-3 py-1 font-normal text-lime-700 dark:border-lime-900/50 dark:bg-lime-950/30 dark:text-lime-300"
              >
                <Tag className="mr-1.5 size-4" />
                {toTitleCase(post.category.name)}
              </Badge>
            </div>
          </div>

          <div className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            {toTitleCase(post.status)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          {!expanded ? (
            <CardDescription className="leading-7 text-slate-600 dark:text-slate-300">
              {isLong ? (
                <>
                  {preview}
                  {"... "}
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="font-medium text-lime-600 hover:underline dark:text-lime-400"
                  >
                    See more
                  </button>
                </>
              ) : (
                post.description
              )}
            </CardDescription>
          ) : (
            <div className="space-y-2">
              <CardDescription className="whitespace-pre-line leading-7 text-slate-600 dark:text-slate-300">
                {post.description}
              </CardDescription>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="text-sm font-medium text-lime-600 hover:underline dark:text-lime-400"
              >
                See less
              </button>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Explore the job details or save it for later.
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            variant={saved ? "secondary" : "outline"}
            className="flex-1 gap-2 rounded-xl sm:flex-none"
            onClick={handleToggleSave}
            disabled={loading}
          >
            <Bookmark
              size={18}
              className={saved ? "fill-current" : ""}
            />
            <span>
              {loading ? "Saving..." : saved ? "Saved" : "Save"}
            </span>
          </Button>

          <Button
            className="flex-1 gap-2 rounded-xl bg-lime-500 text-white hover:bg-lime-600 sm:flex-none"
            onClick={() => router.push(`/jobs/${post.id}`)}
          >
            <Send size={18} />
            <span>Apply Now</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}