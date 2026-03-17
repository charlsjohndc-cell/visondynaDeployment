// app/(app)/settings/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AccountForm from "@/components/settings/account-form";
import ProfileForm from "@/components/settings/profile-form";
import PasswordForm from "@/components/settings/password-form";
import {
  Settings as SettingsIcon,
  UserRound,
  BadgeCheck,
  ShieldCheck,
} from "lucide-react";

export default async function Settings() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstname: true,
      lastname: true,
      gender: true,
      birthDate: true,
      email: true,
    },
  });

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      profession: true,
      phone: true,
      profileSummary: true,
    },
  });

  const fullName = `${user?.firstname ?? ""} ${user?.lastname ?? ""}`.trim();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="relative overflow-hidden px-5 py-6 md:px-7 md:py-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(132,204,22,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.05),transparent_35%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(132,204,22,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.03),transparent_35%)]" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <SettingsIcon className="h-3.5 w-3.5 text-lime-600 dark:text-lime-400" />
                  Settings
                </div>

                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-3xl">
                    Manage your account
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 md:text-base">
                    Update your account details, profile information, and
                    password in one place.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[440px]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Name
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {fullName || "No name set"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Email
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {user?.email ?? "No email"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Profile
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {profile?.profession || "Not completed"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Left column */}
          <div className="space-y-6">
            <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="border-b border-slate-200 pb-5 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-slate-100 p-2.5 dark:bg-slate-800">
                    <UserRound className="h-5 w-5 text-lime-600 dark:text-lime-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-900 dark:text-white">
                      Account Information
                    </CardTitle>
                    <CardDescription className="mt-1 text-slate-500 dark:text-slate-400">
                      Update your personal details and account basics.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <AccountForm
                  initial={{
                    firstname: user!.firstname,
                    lastname: user!.lastname,
                    email: user!.email,
                    birthDateISO: user!.birthDate?.toISOString().slice(0, 10),
                    gender: user!.gender,
                  }}
                />
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="border-b border-slate-200 pb-5 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-slate-100 p-2.5 dark:bg-slate-800">
                    <BadgeCheck className="h-5 w-5 text-lime-600 dark:text-lime-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-900 dark:text-white">
                      Public Profile
                    </CardTitle>
                    <CardDescription className="mt-1 text-slate-500 dark:text-slate-400">
                      Manage the information that appears on your profile.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <ProfileForm
                  initial={{
                    profession: profile?.profession ?? "",
                    phone: profile?.phone ?? "",
                    profileSummary: profile?.profileSummary ?? "",
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="border-b border-slate-200 pb-5 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-slate-100 p-2.5 dark:bg-slate-800">
                    <ShieldCheck className="h-5 w-5 text-lime-600 dark:text-lime-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-900 dark:text-white">
                      Security
                    </CardTitle>
                    <CardDescription className="mt-1 text-slate-500 dark:text-slate-400">
                      Change your password and keep your account secure.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <PasswordForm />
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-slate-900 dark:text-white">
                  Tips
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">
                  Keep your account up to date.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Use a strong password
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Choose a password that is hard to guess and unique to this
                    account.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Complete your profile
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Adding your profession, phone, and summary makes your
                    account more complete.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Review your information regularly
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Make sure your email, personal details, and public profile
                    stay updated.
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
