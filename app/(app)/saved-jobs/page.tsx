import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import SavedJobsClient from "@/components/saved-job-client";

export default async function SavedJobsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <p className="mt-10 text-center">Please log in to see your saved jobs.</p>
    );
  }

  const savedJobsData = await prisma.savedJob.findMany({
    where: { userId: session.user.id },
    include: { job: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });

  const jobs = savedJobsData.map((s) => s.job);

  return <SavedJobsClient initialJobs={jobs} />;
}