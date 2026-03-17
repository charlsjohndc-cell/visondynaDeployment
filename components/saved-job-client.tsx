"use client";

import { useState } from "react";
import SaveJobCard from "./save-job-card";

import type { JobStatus } from "@prisma/client";

type SavedJobsClientProps = {
  initialJobs: {
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
  }[];
};

export default function SavedJobsClient({ initialJobs }: SavedJobsClientProps) {
  const [savedJobs, setSavedJobs] = useState(initialJobs);

  const handleRemove = (jobId: string) => {
    setSavedJobs((prev) => prev.filter((job) => job.id !== jobId));
  };

  if (!savedJobs || savedJobs.length === 0) {
    return (
      <p className="mt-10 text-center text-slate-500">
        You haven’t saved any jobs yet.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-lime-500">Saved Jobs</h1>
      <div className="space-y-4">
        {savedJobs.map((job) => (
          <SaveJobCard key={job.id} job={job} onRemove={handleRemove} />
        ))}
      </div>
    </div>
  );
}
