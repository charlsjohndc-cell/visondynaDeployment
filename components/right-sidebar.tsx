"use client";

import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, MapPin, Banknote, Users, Tag, Send } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { toTitleCase } from "@/lib/utils";
import { JobStatus } from "@prisma/client";

type SaveJobCardProps = {
  job: {
    id: string;
    title: string;
    description: string;
    location: string;
    salary: number;
    manpower: number;
    company: string;
    status: JobStatus;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
    category: { name: string };
  };
};

export default function SaveJobCard({ job }: SaveJobCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(true);
  const [loadingSave, setLoadingSave] = useState(false);
  const [applying, setApplying] = useState(false);

  const PREVIEW_LENGTH = 180;
  const isLong = job.description.length > PREVIEW_LENGTH;
  const preview = job.description.slice(0, PREVIEW_LENGTH);

  // Toggle save/unsave
  const handleToggleSave = async () => {
    try {
      setLoadingSave(true);
      const res = await fetch("/api/jobs/save", {
        method: saved ? "DELETE" : "POST",
        body: JSON.stringify({ jobId: job.id }),
      });
      const data = await res.json();
      setSaved(data.saved);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSave(false);
    }
  };

  // Apply function like in Post.tsx
  const handleApply = async () => {
    try {
      setApplying(true);
      const res = await fetch(`/api/jobs/apply`, {
        method: "POST",
        body: JSON.stringify({ jobId: job.id }),
      });
      if (!res.ok) throw new Error("Failed to apply");
      alert("Application submitted!");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 dark:bg-slate-950">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-lime-500">{job.title}</CardTitle>
            <p className="text-sm text-slate-500">{job.company}</p>
            <p className="text-xs text-slate-400">{job.location}</p>
          </div>
          <Bookmark
            onClick={handleToggleSave}
            className={`cursor-pointer ${saved ? "text-lime-500" : "text-slate-400"}`}
          />
        </div>
      </CardHeader>

      <CardContent>
        <CardDescription className="text-sm text-muted-foreground break-words">
          {!expanded ? (
            <>
              {isLong ? (
                <>
                  {preview}...
                  <span
                    onClick={() => setExpanded(true)}
                    className="ml-1 cursor-pointer text-lime-500 hover:underline"
                  >
                    See more
                  </span>
                </>
              ) : (
                job.description
              )}
            </>
          ) : (
            <>
              {job.description}
              <span
                onClick={() => setExpanded(false)}
                className="ml-1 cursor-pointer text-lime-500 hover:underline"
              >
                See less
              </span>
            </>
          )}
        </CardDescription>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline">
            <Banknote /> ₱{job.salary.toLocaleString()}
          </Badge>
          <Badge variant="outline">
            <MapPin /> {job.location}
          </Badge>
          <Badge variant="outline">
            <Users /> {job.manpower} slots
          </Badge>
          <Badge variant="outline">
            <Tag /> {toTitleCase(job.category.name)}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="ghost"
          className="flex-1 flex items-center justify-center gap-2"
          onClick={handleToggleSave}
          disabled={loadingSave}
        >
          <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
          {saved ? "Saved" : "Save"}
        </Button>

        <Button
          variant="ghost"
          className="flex-1 flex items-center justify-center gap-2 text-slate-400 dark:hover:bg-slate-900"
          onClick={handleApply}
          disabled={applying || job.status !== "OPEN"}
        >
          <Send size={18} />
          {applying ? "Applying..." : job.status === "OPEN" ? "Apply" : "Closed"}
        </Button>
      </CardFooter>
    </Card>
  );
}