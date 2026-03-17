"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "./ui/input";
import { useSession } from "next-auth/react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "./ui/input-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";

const formSchema = z.object({
  coverLetter: z
    .string()
    .min(20, "Cover letter must be at least 20 characters")
    .max(2000, "Cover letter too long"),
});

type FormValues = z.infer<typeof formSchema>;

type ApplyJobDialogProps = {
  jobId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

type ExistingApplication = {
  id: string;
  status: string;
  submittedAt: string;
  formData?: { coverLetter?: string };
};

function getStatusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getStatusClasses(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
    case "UNDER_REVIEW":
      return "border-yellow-300 bg-yellow-100 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-300";
    case "SHORTLISTED":
      return "border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300";
    case "INTERVIEWED":
      return "border-indigo-300 bg-indigo-100 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300";
    case "OFFERED":
      return "border-purple-300 bg-purple-100 text-purple-800 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300";
    case "HIRED":
      return "border-lime-300 bg-lime-100 text-lime-800 dark:border-lime-900 dark:bg-lime-950/40 dark:text-lime-300";
    case "REJECTED":
      return "border-red-300 bg-red-100 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
    case "WITHDRAWN":
      return "border-slate-300 bg-slate-200 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
    default:
      return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
  }
}

export default function ApplyJobDialog({
  jobId,
  open,
  onOpenChange,
}: ApplyJobDialogProps) {
  const session = useSession();
  const [loading, setLoading] = useState(true);
  const [existingApp, setExistingApp] = useState<ExistingApplication | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { coverLetter: "" },
  });

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setExistingApp(null);

    (async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}/apply`);

        if (!res.ok) {
          if (res.status === 401) {
            toast.error("Please sign in to apply for this job");
            return;
          }
          throw new Error(await res.text());
        }

        const json = await res.json();

        if (!cancelled && json.ok) {
          if (json.data?.applied && json.data?.application) {
            setExistingApp(json.data.application);
          } else {
            setExistingApp(null);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load application status");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, jobId]);

  async function onSubmit(values: FormValues) {
    try {
      setSubmitting(true);

      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.status === 401) {
        toast.error("Please sign in to apply for this job");
        return;
      }

      const text = await res.text();

      if (!res.ok) {
        toast.error("Failed to submit application", { description: text });
        return;
      }

      const json = JSON.parse(text);

      if (json.ok && json.data?.application) {
        toast.success("Application submitted successfully!");
        setExistingApp(json.data.application);
        form.reset();
      } else if (json.ok && json.data) {
        toast.success("Application submitted successfully!");
        setExistingApp(json.data);
        form.reset();
      } else {
        toast.error("Unexpected server response");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error", {
        description: "Please try again later",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const coverLetterValue = form.watch("coverLetter") || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Quick Application
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
            Submit your profile with a short cover letter.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : existingApp ? (
          <Card className="border-slate-200 shadow-none dark:border-slate-800 dark:bg-slate-950">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base text-slate-900 dark:text-slate-100">
                  Already Applied
                </CardTitle>
                <Badge
                  variant="outline"
                  className={`rounded-full px-3 py-1 text-xs ${getStatusClasses(existingApp.status)}`}
                >
                  {getStatusLabel(existingApp.status)}
                </Badge>
              </div>
              <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                Submitted on {new Date(existingApp.submittedAt).toLocaleString()}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Cover Letter
                </p>
                <ScrollArea className="h-40 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                  <p className="whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">
                    {existingApp.formData?.coverLetter || "No cover letter provided."}
                  </p>
                </ScrollArea>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm text-slate-700 dark:text-slate-300">
                  First Name
                </Label>
                <Input
                  type="text"
                  defaultValue={session.data?.user.firstname || ""}
                  disabled
                  className="bg-slate-50 dark:bg-slate-900/60"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-slate-700 dark:text-slate-300">
                  Last Name
                </Label>
                <Input
                  type="text"
                  defaultValue={session.data?.user.lastname || ""}
                  disabled
                  className="bg-slate-50 dark:bg-slate-900/60"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-slate-700 dark:text-slate-300">
                Email
              </Label>
              <Input
                type="email"
                defaultValue={session.data?.user.email || ""}
                disabled
                className="bg-slate-50 dark:bg-slate-900/60"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="coverLetter"
                className="text-sm text-slate-700 dark:text-slate-300"
              >
                Cover Letter
              </Label>

              <Controller
                name="coverLetter"
                control={form.control}
                render={({ field }) => (
                  <InputGroup>
                    <InputGroupTextarea
                      id="coverLetter"
                      placeholder="Write a short message about why you're a good fit..."
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      className="min-h-40 rounded-md border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                    <InputGroupAddon align="block-end">
                      <div className="flex w-full items-center justify-between border-t border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {coverLetterValue.length}/2000
                        </p>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="bg-lime-500 text-white hover:bg-lime-600"
                            disabled={submitting}
                          >
                            {submitting ? "Submitting..." : "Submit"}
                          </Button>
                        </div>
                      </div>
                    </InputGroupAddon>
                  </InputGroup>
                )}
              />

              {form.formState.errors.coverLetter && (
                <p className="text-xs text-red-500 dark:text-red-400">
                  {form.formState.errors.coverLetter.message}
                </p>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}