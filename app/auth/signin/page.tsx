import { authOptions } from "@/lib/auth";
import SignInForm from "@/components/auth/signin-form";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visondyna / Sign In",
  description: "",
};
export default async function SignIn({
  searchParams,
}: {
  searchParams?: Promise<{ verified?: string }>;
}) {
  const resolvedSearchParams = searchParams
    ? await searchParams
    : undefined;
  const session = await getServerSession(authOptions);
  const hasVerifiedFlag = resolvedSearchParams?.verified === "1";

  if (session && !hasVerifiedFlag) {
    const role = session?.user.role;

    const url = {
      ADMIN: "/admin/dashboard",
      HR: "/hr/dashboard",
      APPLICANT: "/feed",
    };

    redirect(url[role] ?? "/feed");
  }

  return <SignInForm />;
}
