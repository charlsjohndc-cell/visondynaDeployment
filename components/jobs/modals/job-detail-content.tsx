"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  CircleCheck,
  CircleX,
  CircleMinus,
  Archive,
  Ellipsis,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toTitleCase } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import exportToPdf from "@/lib/export-to-pdf";
import type { ApplicationStatus, JobStatus } from "@prisma/client";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import ApplicationDetailsDialog from "@/components/applications/modals/application-details-dialog";

type Application = {
  id: string;
  applicantId: string;
  name: string;
  email: string;
  formData: JSON;
  status: ApplicationStatus;
  submittedAt: string;
};

type JobDetails = {
  id: string;
  title: string;
  description: string;
  manpower: number;
  salary: number;
  company: string;
  location: string;
  status: JobStatus;
  createdAt: string;
  category: { id: string; name: string };
  skills: { id: string; name: string }[];
  applications: Application[];
};

type Props = {
  jobId: string;
  onClose: () => void;
  onUpdate: () => void;
  onDeleted?: (id: string) => void;
  onEdit?: (id: string) => void;
};

export default function JobDetailsDialogContent({
  jobId,
  onClose,
  onUpdate,
  onDeleted,
}: Props) {
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");
  const [status, setStatus] = useState<JobStatus>("OPEN");

  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);
  const [openApplicationDialog, setOpenApplicationDialog] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/jobs/${jobId}`, {
      headers: { "Content-Type": "application/json" },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        if (!cancelled) {
          setJob(json.data as JobDetails);
          setStatus(json.data.status);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const message =
            e instanceof Error ? e.message : "Failed to load job details";
          setError(message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  async function handleArchive() {
    if (!jobId) return;
    setArchiving(true);

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deletedAt: new Date().toISOString() }),
      });

      if (!res.ok) throw new Error(await res.text());

      toast.success("Job archived", {
        description: "The job has been moved to your archive.",
      });

      onDeleted?.(jobId);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to archive job";
      toast.error("Archive failed", { description: msg });
    } finally {
      setArchiving(false);
    }
  }

  async function handleUpdateStatus(update: JobStatus) {
    if (update === status) return;

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: update }),
      });

      if (!res.ok) throw new Error(await res.text());

      setStatus(update);
      onUpdate();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to update status";
      toast.error("Status update failed", { description: msg });
    }
  }

  function handleViewApplication(applicationId: string) {
    setSelectedApplicationId(applicationId);
    setOpenApplicationDialog(true);
  }

  const filteredApplicants = useMemo(() => {
    if (!job) return [];
    if (activeTab === "ALL") return job.applications;
    return job.applications.filter((a) => a.status === activeTab);
  }, [job, activeTab]);

  if (loading)
    return (
      <DialogContent className="grid h-[80vh] max-w-5xl grid-cols-2 gap-6">
        <VisuallyHidden.Root>
          <DialogTitle>Loading Job Details</DialogTitle>
          <DialogDescription>
            Job details are being fetched. Please wait.
          </DialogDescription>
        </VisuallyHidden.Root>

        <div className="space-y-4 p-6">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-1/4" />
        </div>

        <div className="space-y-2 p-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </DialogContent>
    );

  if (error)
    return (
      <DialogContent className="flex max-w-5xl flex-col items-center justify-center bg-gradient-to-t from-slate-100 to-white p-6 text-center dark:from-slate-950 dark:to-slate-900">
        <VisuallyHidden.Root>
          <DialogTitle>Error Loading Job</DialogTitle>
          <DialogDescription>
            Unable to fetch job details. Please try again.
          </DialogDescription>
        </VisuallyHidden.Root>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={onClose} className="mt-4">
          Close
        </Button>
      </DialogContent>
    );

  if (!job)
    return (
      <DialogContent className="flex max-w-5xl flex-col items-center justify-center bg-gradient-to-t from-slate-100 to-white p-6 text-center dark:from-slate-950 dark:to-slate-900">
        <VisuallyHidden.Root>
          <DialogTitle>No Job Found</DialogTitle>
          <DialogDescription>
            No job details are available to display.
          </DialogDescription>
        </VisuallyHidden.Root>
        <p className="text-sm text-muted-foreground">No job details found.</p>
        <Button onClick={onClose} className="mt-4">
          Close
        </Button>
      </DialogContent>
    );

  return (
    <>
      <DialogContent className="grid h-[80vh] max-w-5xl grid-cols-2 overflow-hidden bg-gradient-to-t from-slate-100 to-white p-0 dark:from-slate-950 dark:to-slate-900">
        <ScrollArea className="h-full min-h-0 p-6">
          <DialogHeader className="flex flex-row items-center justify-between gap-4">
            <DialogTitle className="flex-1 border-none p-0 text-xl font-semibold">
              {job.title}
            </DialogTitle>

            <Dialog>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Archive className="size-4" />
                </Button>
              </DialogTrigger>

              <DialogContent className="border bg-white shadow-2xl backdrop-blur-sm dark:bg-slate-950">
                <DialogHeader>
                  <div className="space-y-3 p-4">
                    <div className="inline-flex items-center gap-2">
                      <DialogTitle className="flex-1 border-none p-0 text-xl font-medium">
                        Move job to Archive?
                      </DialogTitle>
                    </div>

                    <DialogDescription className="w-full text-sm">
                      Archiving this job will remove it from active listings.
                      Applicants will no longer be able to view or apply to this
                      position. You can restore it anytime from the archive.
                    </DialogDescription>

                    {job.title && (
                      <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-900/70 dark:text-slate-300">
                        <p className="font-medium text-lime-500 dark:text-lime-400">
                          {job.title}
                        </p>
                        <p className="w-full text-slate-600">
                          This job will stay in your archive with all applications
                          preserved.
                        </p>
                      </div>
                    )}
                  </div>
                </DialogHeader>

                <DialogFooter className="mt-2 flex items-center justify-between gap-2 px-4 pb-4">
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>

                  <Button
                    variant="default"
                    className="bg-red-500 text-white hover:bg-red-400"
                    onClick={handleArchive}
                    disabled={archiving}
                  >
                    {archiving ? (
                      <>
                        <Spinner className="mr-2 size-4" />
                        <span>Archiving</span>
                      </>
                    ) : (
                      <>
                        <Archive className="mr-2 size-4" />
                        <span>Archive</span>
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </DialogHeader>

          <Separator className="my-3" />

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-xs font-medium uppercase text-foreground">
                  category
                </p>
                <p className="w-full text-sm text-muted-foreground">
                  {toTitleCase(job.category.name)}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium uppercase text-foreground">
                  location
                </p>
                <p className="w-full text-sm text-muted-foreground">
                  {toTitleCase(job.location)}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium uppercase text-foreground">
                  manpower
                </p>
                <p className="flex w-full items-center gap-1 text-sm text-muted-foreground">
                  <Users className="size-4" />
                  <span>{job.manpower}</span>
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium uppercase text-foreground">
                  status
                </p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-left">
                      <Badge
                        variant="outline"
                        className="inline-flex items-center gap-1"
                      >
                        {status === "OPEN" ? (
                          <CircleCheck className="size-4 fill-lime-500 stroke-white dark:stroke-slate-950" />
                        ) : status === "CLOSED" ? (
                          <CircleX className="size-4 fill-red-500 stroke-white dark:stroke-slate-950" />
                        ) : (
                          <CircleMinus className="size-4 fill-slate-500 stroke-white dark:stroke-slate-950" />
                        )}
                        {toTitleCase(status)}
                      </Badge>
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="start">
                    <DropdownMenuGroup className="space-y-1">
                      {["OPEN", "FILLED", "CLOSED"].map((stat, i) => (
                        <DropdownMenuItem
                          key={i}
                          className={`text-xs ${stat === status ? "bg-slate-200 dark:bg-slate-800" : ""}`}
                          onClick={() => handleUpdateStatus(stat as JobStatus)}
                        >
                          {toTitleCase(stat)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <Separator />

            <h3 className="text-sm font-medium text-foreground">
              Required Skills
            </h3>
            {job.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <Badge key={skill.id} variant="secondary">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            )}

            <Separator />

            <h3 className="text-sm font-medium text-foreground">Description</h3>
            <p className="w-full whitespace-pre-line break-words text-sm text-muted-foreground">
              {job.description}
            </p>
          </div>
        </ScrollArea>

        <ScrollArea className="h-full min-h-0 border-l border-accent bg-white p-6 dark:bg-slate-950">
          <h2 className="border-none text-lg">Applications</h2>

          <Tabs
            defaultValue="ALL"
            value={activeTab}
            onValueChange={setActiveTab}
            className="mt-3"
          >
            <TabsList className="w-full justify-start space-x-2 bg-slate-200 dark:bg-slate-900">
              {["ALL", "SUBMITTED", "HIRED", "REJECTED"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="w-full text-xs font-normal"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="pt-3">
              {filteredApplicants.length === 0 ? (
                <p className="w-full text-center text-sm text-muted-foreground">
                  No applicants at the moment.
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredApplicants.map((a) => (
                    <Card
                      key={a.id}
                      className="relative rounded-lg bg-white transition hover:border-primary/60 hover:shadow-md dark:bg-slate-900"
                    >
                      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {a.name?.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <CardTitle className="text-sm font-semibold leading-snug text-foreground">
                              {a.name}
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                              {a.email}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="flex items-center justify-between pt-0 text-xs" />

                      <CardFooter>
                        <div className="flex w-full items-center justify-between">
                          <Badge
                            variant={
                              a.status === "HIRED"
                                ? "default"
                                : a.status === "REJECTED"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide"
                          >
                            {toTitleCase(a.status)}
                          </Badge>

                          <span className="text-[11px] font-medium text-foreground">
                            {format(new Date(a.submittedAt), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </CardFooter>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="absolute right-4 top-2">
                            <Ellipsis className="size-4" />
                          </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent>
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              className="text-xs"
                              onClick={() => handleViewApplication(a.id)}
                            >
                              View
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-xs"
                              onClick={() => exportToPdf(a, job)}
                            >
                              <span>Export</span>
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>

      <Dialog
        open={openApplicationDialog}
        onOpenChange={(open) => {
          setOpenApplicationDialog(open);
          if (!open) setSelectedApplicationId(null);
        }}
      >
        {selectedApplicationId && (
          <ApplicationDetailsDialog
            applicationId={selectedApplicationId}
            onClose={() => {
              setSelectedApplicationId(null);
              setOpenApplicationDialog(false);
            }}
            onUpdated={onUpdate}
          />
        )}
      </Dialog>
    </>
  );
}