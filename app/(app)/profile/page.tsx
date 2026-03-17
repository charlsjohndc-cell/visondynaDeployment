// app/(app)/profile/page.tsx
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import {
  Mail,
  Phone,
  BriefcaseBusiness,
  Sparkles,
  ChartNoAxesColumn,
  GraduationCap,
  FolderKanban,
  UserRound,
  CircleCheckBig,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import EditProfileDialog from "@/components/profile/edit-profile-dialog";
import ManageSkills from "@/components/profile/manage-skills";
import ManageExperiences from "@/components/profile/manage-experiences";
import ManageEducations from "@/components/profile/manage-educations";
import { notFound, redirect } from "next/navigation";

export default async function ApplicantProfile() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id as string;

  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      education: {
        orderBy: { enrolledDate: "desc" },
      },
      experience: {
        orderBy: { startDate: "desc" },
      },
      skills: {
        include: {
          skill: {
            select: { id: true, name: true, categoryId: true },
          },
        },
      },
      user: {
        select: {
          firstname: true,
          lastname: true,
          email: true,
        },
      },
    },
  });

  if (!profile) notFound();

  const fullName = `${profile.user.firstname} ${profile.user.lastname}`;
  const initials = `${profile.user.firstname?.[0] ?? ""}${profile.user.lastname?.[0] ?? ""}`;

  const profileCompletion = [
    profile.profession,
    profile.phone,
    profile.profileSummary,
    profile.skills.length > 0,
    profile.education.length > 0,
    profile.experience.length > 0,
  ].filter(Boolean).length;

  const completionPercent = Math.round((profileCompletion / 6) * 100);

  const completionItems = [
    {
      label: "Profession",
      done: Boolean(profile.profession),
    },
    {
      label: "Phone number",
      done: Boolean(profile.phone),
    },
    {
      label: "Profile summary",
      done: Boolean(profile.profileSummary),
    },
    {
      label: "Skills",
      done: profile.skills.length > 0,
    },
    {
      label: "Education",
      done: profile.education.length > 0,
    },
    {
      label: "Experience",
      done: profile.experience.length > 0,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        {/* LEFT SIDEBAR */}
        <aside className="space-y-6">
          <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="h-24 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800" />

            <CardContent className="-mt-10 px-5 pb-5">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 border-4 border-white shadow-md dark:border-slate-900">
                  <AvatarImage
                    src={
                      profile.imageUrl ||
                      session.user.image ||
                      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                    }
                  />
                  <AvatarFallback className="bg-slate-100 text-2xl font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="mt-4 space-y-1">
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-white md:text-2xl">
                    {fullName}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {profile.profession || "Profession not added yet"}
                  </p>
                </div>

                <div className="mt-5 w-full space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{profile.user.email}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{profile.phone || "No phone number"}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <BriefcaseBusiness className="h-4 w-4 text-slate-400" />
                    <span>{profile.profession || "No profession yet"}</span>
                  </div>
                </div>

                <div className="mt-5 w-full">
                  <EditProfileDialog
                    initial={{
                      profession: profile.profession || "",
                      phone: profile.phone || "",
                      profileSummary: profile.profileSummary || "",
                      profileCompleted: Boolean(profile.profileCompleted),
                      image: profile.imageUrl || "",
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-slate-100 p-2 dark:bg-slate-800">
                  <ChartNoAxesColumn className="h-4 w-4 text-lime-600 dark:text-lime-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Profile Completion</CardTitle>
                  <CardDescription>
                    Track what still needs to be added.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Completed
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {completionPercent}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-lime-500 transition-all"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {completionItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2.5 dark:border-slate-800"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {item.label}
                    </span>
                    {item.done ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-lime-50 px-2 py-1 text-xs font-medium text-lime-700 dark:bg-lime-950/30 dark:text-lime-300">
                        <CircleCheckBig className="h-3.5 w-3.5" />
                        Done
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Missing
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Stats</CardTitle>
              <CardDescription>
                A snapshot of your profile content.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-950/40">
                <p className="text-xs text-slate-500 dark:text-slate-400">Skills</p>
                <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                  {profile.skills.length}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-950/40">
                <p className="text-xs text-slate-500 dark:text-slate-400">Exp</p>
                <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                  {profile.experience.length}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-950/40">
                <p className="text-xs text-slate-500 dark:text-slate-400">Edu</p>
                <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                  {profile.education.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* MAIN CONTENT */}
        <main className="space-y-6">
          <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-slate-100 p-2.5 dark:bg-slate-800">
                  <UserRound className="h-5 w-5 text-lime-600 dark:text-lime-400" />
                </div>
                <div>
                  <CardTitle className="text-xl text-slate-900 dark:text-white">
                    Professional Summary
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Introduce yourself in a way that helps employers understand
                    your background and goals.
                  </CardDescription>
                </div>
              </div>

              <EditProfileDialog
                initial={{
                  profession: profile.profession || "",
                  phone: profile.phone || "",
                  profileSummary: profile.profileSummary || "",
                  profileCompleted: Boolean(profile.profileCompleted),
                  image: profile.imageUrl || "",
                }}
              />
            </CardHeader>

            <CardContent className="pt-6">
              <div className="rounded-3xl bg-slate-50 p-6 dark:bg-slate-950/40">
                <p className="whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300 md:text-[15px]">
                  {profile.profileSummary ||
                    "You haven’t added a profile summary yet. Write a short introduction about your strengths, interests, background, and the type of work or opportunity you’re looking for."}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
            <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-100 p-2.5 dark:bg-slate-800">
                    <Sparkles className="h-4 w-4 text-lime-600 dark:text-lime-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Skills</CardTitle>
                    <CardDescription>
                      Skills displayed on your profile.
                    </CardDescription>
                  </div>
                </div>

                <ManageSkills />
              </CardHeader>

              <CardContent>
                {profile.skills.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950/40">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      No skills added yet
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Add your main strengths and technical abilities here.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((st) => (
                      <span
                        key={st.skillId}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {st.skill.name}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-100 p-2.5 dark:bg-slate-800">
                    <FolderKanban className="h-4 w-4 text-lime-600 dark:text-lime-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Profile Insights</CardTitle>
                    <CardDescription>
                      Recommendations to make your profile stronger.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {!profile.profileSummary && (
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      Add a summary
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      A short summary helps employers quickly understand your
                      profile.
                    </p>
                  </div>
                )}

                {profile.skills.length === 0 && (
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      Add relevant skills
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Employers often scan skills first when reviewing a profile.
                    </p>
                  </div>
                )}

                {profile.education.length === 0 && (
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      Add your education
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Show your academic background to complete your profile.
                    </p>
                  </div>
                )}

                {profile.experience.length === 0 && (
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      Add experience
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Even internships or school projects can help strengthen
                      your profile.
                    </p>
                  </div>
                )}

                {profile.profileSummary &&
                  profile.skills.length > 0 &&
                  profile.education.length > 0 &&
                  profile.experience.length > 0 && (
                    <div className="rounded-2xl border border-lime-200 bg-lime-50/60 p-4 dark:border-lime-900/40 dark:bg-lime-950/20">
                      <p className="text-sm font-medium text-lime-800 dark:text-lime-300">
                        Your profile is looking strong
                      </p>
                      <p className="mt-1 text-sm text-lime-700/90 dark:text-lime-400">
                        Keep it updated as you gain new skills, education, and
                        work experience.
                      </p>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-2.5 dark:bg-slate-800">
                  <BriefcaseBusiness className="h-4 w-4 text-lime-600 dark:text-lime-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">Experience</CardTitle>
                  <CardDescription>
                    Your work history, internships, and relevant activities.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ManageExperiences initial={profile.experience} />
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-2.5 dark:bg-slate-800">
                  <GraduationCap className="h-4 w-4 text-lime-600 dark:text-lime-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">Education</CardTitle>
                  <CardDescription>
                    Your academic background and qualifications.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ManageEducations initial={profile.education} />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
