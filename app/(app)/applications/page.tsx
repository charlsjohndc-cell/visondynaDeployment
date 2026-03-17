import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNowStrict, format } from "date-fns";
import { ApplicationStatus } from "@prisma/client";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronRight,
  MapPin,
} from "lucide-react";

import WithdrawButton from "@/components/withdraw-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getStatusClasses(status: ApplicationStatus) {
  switch (status) {
    case "SUBMITTED":
      return "border-slate-300 bg-slate-100 text-slate-700";
    case "UNDER_REVIEW":
      return "border-yellow-300 bg-yellow-100 text-yellow-800";
    case "SHORTLISTED":
      return "border-blue-300 bg-blue-100 text-blue-800";
    case "INTERVIEWED":
      return "border-indigo-300 bg-indigo-100 text-indigo-800";
    case "OFFERED":
      return "border-purple-300 bg-purple-100 text-purple-800";
    case "HIRED":
      return "border-lime-300 bg-lime-100 text-lime-800";
    case "REJECTED":
      return "border-red-300 bg-red-100 text-red-800";
    case "WITHDRAWN":
      return "border-slate-300 bg-slate-200 text-slate-700";
    default:
      return "border-slate-300 bg-slate-100 text-slate-700";
  }
}

function getStatusLabel(status: ApplicationStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function ApplicationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const applications = await prisma.application.findMany({
    where: {
      applicantId: session.user.id,
      deletedAt: null,
    },
    orderBy: {
      submittedAt: "desc",
    },
    select: {
      id: true,
      status: true,
      submittedAt: true,
      job: {
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
        },
      },
    },
  });

  const totalApplications = applications.length;
  const activeApplications = applications.filter(
    (application) =>
      application.status !== "WITHDRAWN" &&
      application.status !== "REJECTED" &&
      application.status !== "HIRED"
  ).length;

  return (
    <div className="mx-auto w-4/5 py-8">
      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              My Applications
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Track your submitted job applications and withdraw active ones if
              needed.
            </p>
          </div>

          <Link
            href="/jobs"
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Browse Jobs
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-slate-200 shadow-none dark:border-slate-800 dark:bg-slate-950">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-900">
                <BriefcaseBusiness className="size-5 text-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Total Applications
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {totalApplications}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none dark:border-slate-800 dark:bg-slate-950">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-lime-100 p-3 dark:bg-lime-950/40">
                <CalendarDays className="size-5 text-lime-700 dark:text-lime-300" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Active Applications
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {activeApplications}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {applications.length === 0 ? (
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-950">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-2xl bg-slate-100 p-4 dark:bg-slate-900">
              <BriefcaseBusiness className="size-8 text-slate-600 dark:text-slate-300" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              No applications yet
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              You have not applied to any jobs yet. Start exploring opportunities
              and your applications will appear here.
            </p>
            <Link
              href="/jobs"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-lime-500 px-4 text-sm font-medium text-white transition hover:bg-lime-600"
            >
              Find Jobs
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => {
            const canWithdraw =
              application.status !== "WITHDRAWN" &&
              application.status !== "HIRED" &&
              application.status !== "REJECTED";

            return (
              <Card
                key={application.id}
                className="rounded-2xl border-slate-200 transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
              >
                <CardHeader className="gap-4 pb-3">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div>
                        <CardTitle className="text-xl text-slate-900 dark:text-slate-100">
                          {application.job.title}
                        </CardTitle>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <Building2 className="size-4" />
                            {application.job.company}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="size-4" />
                            {application.job.location}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(application.status)}`}
                        >
                          {getStatusLabel(application.status)}
                        </Badge>

                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Applied{" "}
                          {formatDistanceToNowStrict(application.submittedAt, {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="text-left lg:text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Submitted Date
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                        {format(application.submittedAt, "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {application.status === "WITHDRAWN"
                      ? "You already withdrew this application."
                      : application.status === "HIRED"
                        ? "This application has already been marked as hired."
                        : application.status === "REJECTED"
                          ? "This application has already been rejected."
                          : "You can still withdraw this application."}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/jobs/${application.job.id}`}
                      className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                      View Job
                      <ChevronRight className="ml-1 size-4" />
                    </Link>

                    {canWithdraw && (
                      <WithdrawButton applicationId={application.id} />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}