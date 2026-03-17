"use client";

import { useEffect, useState } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toTitleCase } from "@/lib/utils";

type Props = {
  applicationId: string;
  onClose: () => void;
  onUpdated: () => void;
};

type ApplicationDetail = {
  id: string;
  status:
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "SHORTLISTED"
    | "INTERVIEWED"
    | "OFFERED"
    | "HIRED"
    | "REJECTED"
    | "WITHDRAWN";
  submittedAt: string;
  formData: {
    coverLetter?: string;
  } | null;
  applicant: { id: string; name: string; email: string };
  job: { id: string; title: string; company: string; location: string } | null;
};

const ENDPOINT = (id: string) => `/api/applications/${id}`;

const STATUS_COLORS: Record<ApplicationDetail["status"], string> = {
  SUBMITTED:
    "border-gray-200 bg-gray-100 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
  UNDER_REVIEW:
    "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-300",
  SHORTLISTED:
    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
  INTERVIEWED:
    "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300",
  OFFERED:
    "border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300",
  HIRED:
    "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300",
  REJECTED:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
  WITHDRAWN:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const HR_ALLOWED_STATUSES: Exclude<ApplicationDetail["status"], "WITHDRAWN">[] =
  [
    "SUBMITTED",
    "UNDER_REVIEW",
    "SHORTLISTED",
    "INTERVIEWED",
    "OFFERED",
    "HIRED",
    "REJECTED",
  ];

export default function ApplicationDetailsDialog({
  applicationId,
  onClose,
  onUpdated,
}: Props) {
  const [data, setData] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] =
    useState<ApplicationDetail["status"]>("SUBMITTED");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(ENDPOINT(applicationId));
        if (!res.ok) throw new Error(await res.text());

        const json = (await res.json()) as { data: ApplicationDetail };
        if (cancelled) return;

        setData(json.data);
        setStatus(json.data.status);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to load application.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  const isWithdrawn = data?.status === "WITHDRAWN";
  const coverLetter =
    data?.formData?.coverLetter?.trim() || "No cover letter provided.";

  async function saveStatus() {
    if (!data || isWithdrawn) return;

    try {
      setSaving(true);
      setError(null);

      const res = await fetch(ENDPOINT(applicationId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error(await res.text());

      onUpdated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-hidden rounded-2xl border bg-background p-0 shadow-2xl">
      <DialogHeader className="border-b px-5 py-4 sm:px-6">
        <DialogTitle className="text-lg font-semibold tracking-tight">
          Application Details
        </DialogTitle>
      </DialogHeader>

      <div className="max-h-[calc(90vh-73px)] overflow-y-auto px-5 py-4 sm:px-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="h-20 w-full animate-pulse rounded-xl bg-muted" />
            <div className="h-20 w-full animate-pulse rounded-xl bg-muted" />
            <div className="h-40 w-full animate-pulse rounded-xl bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p className="font-medium text-destructive">
              Failed to load application
            </p>
            <p className="mt-1 text-muted-foreground">{error}</p>
          </div>
        ) : !data ? (
          <div className="text-sm text-muted-foreground">No data.</div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Applicant
                </div>
                <div className="break-words text-sm font-semibold">
                  {data.applicant.name}
                </div>
                <div className="mt-1 break-all text-sm text-muted-foreground">
                  {data.applicant.email}
                </div>
              </div>

              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Job
                </div>
                <div className="break-words text-sm font-semibold">
                  {data.job?.title ?? "N/A"}
                </div>
                <div className="mt-1 break-words text-sm text-muted-foreground">
                  {data.job?.company ?? "N/A"}
                </div>
                <div className="mt-1 break-words text-sm text-muted-foreground">
                  {data.job?.location ?? "N/A"}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[status]}`}
                >
                  {toTitleCase(status)}
                </Badge>
              </div>

              <div className="text-xs text-muted-foreground">
                Submitted {new Date(data.submittedAt).toLocaleString()}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Cover Letter
              </label>
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground">
                  {coverLetter}
                </p>
              </div>
            </div>

            {isWithdrawn && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                This applicant has withdrawn the application. HR status updates
                are disabled for this record.
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Update Status
              </label>
              <select
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as ApplicationDetail["status"])
                }
                disabled={isWithdrawn || saving}
              >
                {HR_ALLOWED_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {toTitleCase(s)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={saveStatus}
                disabled={saving || isWithdrawn}
                className="w-full sm:w-auto"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  );
}