import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  User,
  Settings,
  BriefcaseBusiness,
  Bookmark,
  TrendingUp,
} from "lucide-react";
import FeedList from "@/components/feed-list";
import { getRecommendedJobsPage } from "@/lib/job-recommendation";

const PAGE_SIZE = 10;

const fallbackAvatar =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

export default async function Feed() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  const currentUser = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstname: true,
          lastname: true,
          email: true,
          applicantInfo: {
            select: {
              imageUrl: true,
            },
          },
        },
      })
    : null;

  const applicationsCount = userId
    ? await prisma.application.count({
        where: { applicantId: userId },
      })
    : 0;

  const savedJobsCount = userId
    ? await prisma.savedJob.count({
        where: { userId },
      })
    : 0;

  const totalActivities = applicationsCount + savedJobsCount;

  const { jobs: first, nextCursor } = await getRecommendedJobsPage({
    userId,
    limit: PAGE_SIZE,
  });

  const trendingJobs = await prisma.job.findMany({
    where: {
      status: "OPEN",
      deletedAt: null,
    },
    take: 5,
    orderBy: [
      {
        applications: {
          _count: "desc",
        },
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      id: true,
      title: true,
      company: true,
    },
  });

 

  const displayName = currentUser
    ? `${currentUser.firstname} ${currentUser.lastname}`
    : session?.user?.name || "User";

  const avatarSrc = currentUser?.applicantInfo?.imageUrl || fallbackAvatar;

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6">
      {/* LEFT SIDEBAR */}
      <aside className="sticky top-6 hidden h-fit w-[280px] flex-shrink-0 space-y-6 lg:block">
        <Card className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="h-20 bg-gradient-to-r from-lime-500/90 to-emerald-500/90" />

          <CardHeader className="-mt-10 flex flex-col items-center text-center">
            <Avatar className="h-20 w-20 border-4 border-white shadow-sm dark:border-slate-950">
              <AvatarImage src={avatarSrc} />
              <AvatarFallback>{displayName.at(0)}</AvatarFallback>
            </Avatar>

            <div className="mt-2 space-y-1">
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {displayName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Welcome back
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Activity
              </p>

              <p className="mt-2 text-2xl font-bold text-lime-600 dark:text-lime-400">
                {totalActivities}
              </p>

              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Applications and saved jobs combined.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/applications"
                className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:border-lime-300 hover:bg-lime-50/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-lime-700 dark:hover:bg-slate-900"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-lime-100 p-2 dark:bg-lime-950/50">
                    <BriefcaseBusiness className="size-4 text-lime-700 dark:text-lime-300" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Applications
                    </p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {applicationsCount}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-medium text-lime-600 transition group-hover:translate-x-0.5 dark:text-lime-400">
                  View
                </span>
              </Link>

              <Link
                href="/saved-jobs"
                className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:border-lime-300 hover:bg-lime-50/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-lime-700 dark:hover:bg-slate-900"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-sky-100 p-2 dark:bg-sky-950/50">
                    <Bookmark className="size-4 text-sky-700 dark:text-sky-300" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Saved Jobs
                    </p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {savedJobsCount}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-medium text-lime-600 transition group-hover:translate-x-0.5 dark:text-lime-400">
                  View
                </span>
              </Link>
            </div>
          </CardContent>

          <CardFooter className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <Button
              variant="ghost"
              className="w-full justify-center text-xs"
              asChild
            >
              <Link href="/profile">
                <User size={14} />
                <span>Profile</span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-center text-xs"
              asChild
            >
              <Link href="/settings">
                <Settings size={14} />
                <span>Settings</span>
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </aside>

      {/* FEED */}
      <main className="min-w-0 flex-1">
        <FeedList initialItems={first} initialCursor={nextCursor} />
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className="sticky top-6 hidden h-fit w-[280px] flex-shrink-0 space-y-4 xl:block">
        <Card className="border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <div className="rounded-lg bg-lime-100 p-2 dark:bg-lime-950/50">
              <TrendingUp className="size-4 text-lime-700 dark:text-lime-300" />
            </div>

            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Trending Jobs
            </p>
          </CardHeader>

          <CardContent className="space-y-3">
            {trendingJobs.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No trending jobs yet.
              </p>
            ) : (
              trendingJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block rounded-xl border border-transparent p-3 transition hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-900"
                >
                  <p className="text-sm font-medium text-lime-600 dark:text-lime-400">
                    {job.title}
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {job.company}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        
      </aside>
    </div>
  );
}
