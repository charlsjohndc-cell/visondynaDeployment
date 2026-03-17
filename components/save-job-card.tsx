"use client";

import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, MapPin, Banknote, Users, Tag, Send } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { toTitleCase } from "@/lib/utils";
import { JobStatus } from "@prisma/client";
import { useRouter } from "next/navigation";

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
  onRemove?: (jobId: string) => void; // callback for removing card
};

export default function SaveJobCard({ job, onRemove }: SaveJobCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(true); // saved initially
  const [loading, setLoading] = useState(false);

  const PREVIEW_LENGTH = 180;
  const isLong = job.description?.length > PREVIEW_LENGTH;
  const preview = job.description?.slice(0, PREVIEW_LENGTH);

  const handleToggleSave = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/jobs/save", {
        method: "POST",
        body: JSON.stringify({ jobId: job.id }),
      });

      const data = await res.json();

      setSaved(data.saved);

      if (!data.saved && onRemove) {
        onRemove(job.id); // remove from parent list
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-lime-500">{job.title}</CardTitle>
            <p className="text-sm text-slate-500">{job.company}</p>
            <p className="text-xs text-slate-400">{job.location}</p>
          </div>
          <Bookmark
            onClick={handleToggleSave}
            className={`cursor-pointer ${saved ? "text-lime-500" : "text-slate-400"} ${loading ? "opacity-50" : ""}`}
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
            <Tag /> {toTitleCase(job.category?.name || "")}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant={saved ? "secondary" : "ghost"}
          onClick={handleToggleSave}
          className="flex-1 flex items-center justify-center gap-2"
        >
          {saved ? "Saved" : "Save"}
        </Button>

        <Button
          variant="ghost"
          className="flex-1 flex items-center justify-center gap-2 text-slate-600"
          onClick={() => router.push(`/jobs/${job.id}`)}
        >
          <Send size={18} />
          Apply
        </Button>
      </CardFooter>
    </Card>
  );
}