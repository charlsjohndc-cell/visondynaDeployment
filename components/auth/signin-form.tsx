"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { signIn, getSession, type SignInResponse } from "next-auth/react";
import { useState } from "react";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Spinner } from "../ui/spinner";
import Password from "../password";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().nonempty("Please enter your password."),
});

type FormSchema = z.infer<typeof formSchema>;

export default function SignInForm() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const callbackUrlParam = searchParams?.get("callbackUrl") ?? null;

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function getSessionWithRetry(attempts = 10, delayMs = 200) {
    for (let i = 0; i < attempts; i++) {
      const s = await getSession();
      if (s) return s;
      await new Promise((res) => setTimeout(res, delayMs));
    }
    return null;
  }

  async function onSubmit(data: FormSchema) {
    setIsLoading(true);

    try {
      const res = (await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })) as SignInResponse | undefined;

      if (!res || res.error) {
        toast.error(
          "We couldn’t sign you in. Double-check your email and password and try again.",
        );
        setIsLoading(false);
        return;
      }

      const session = await getSessionWithRetry(10, 200);

      const roleToDefault: Record<string, string> = {
        ADMIN: "/admin/dashboard",
        HR: "/hr/dashboard",
        APPLICANT: "/feed",
      };

      let destination = callbackUrlParam || "/";

      if (session?.user) {
        const role = String(session.user.role ?? "").toUpperCase();

        if (role === "ADMIN" || role === "HR") {
          destination = roleToDefault[role] ?? "/";
        } else {
          destination = callbackUrlParam || roleToDefault.APPLICANT;
        }
      } else {
        destination = res.url ?? callbackUrlParam ?? "/feed";
      }

      router.push(destination);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      console.error("signin error:", message);
      toast.error("Sign in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(132,204,22,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_30%)]" />
      <div className="absolute inset-0 bg-grid-white/[0.03] [mask-image:linear-gradient(to_bottom,white,transparent)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
          {/* Left panel */}
          <div className="hidden flex-col justify-center border-r border-white/10 bg-gradient-to-br from-lime-500/15 via-emerald-500/10 to-transparent p-10 lg:flex xl:p-14">
            <div className="max-w-md">
              <p className="mb-4 inline-flex rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1 text-xs font-medium text-lime-300">
                Secure Sign In
              </p>

              <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Welcome Back to{" "}
                <span className="text-lime-400">Visondyna</span>
              </h1>

              <p className="mt-5 text-base leading-7 text-slate-300">
                Sign in to continue exploring jobs, managing applications, and
                accessing your personalized dashboard.
              </p>

              <div className="mt-10 space-y-4">
                {[
                  "Access your saved jobs and applications",
                  "Continue where you left off",
                  "Secure login for applicants, HR, and admin",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-lime-400/15 p-1">
                      <CheckCircle2 className="h-4 w-4 text-lime-400" />
                    </div>
                    <p className="text-sm text-slate-300">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-emerald-400/10 p-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Protected access
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Your account is routed to the correct dashboard after
                      sign-in based on your role.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="w-full bg-slate-950/70 p-6 sm:p-8 md:p-10 xl:p-12">
            <div className="mx-auto w-full max-w-xl">
              <div className="mb-8 text-center lg:text-left">
                <h2 className="text-3xl font-bold text-white">Sign In</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Enter your credentials to access your account.
                </p>
              </div>

              <Form {...form}>
                <form
                  className="space-y-5"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="johndoe@gmail.com"
                            className="h-11 border-white/10 bg-slate-900/80 text-white placeholder:text-slate-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-slate-200">
                            Password
                          </FormLabel>
                          <Link
                            href="/auth/forgot-password"
                            className="text-xs text-lime-400 transition hover:text-lime-300 hover:underline"
                          >
                            Forgot password?
                          </Link>
                        </div>
                        <FormControl>
                          <Password>
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              className="h-11 border-none bg-transparent text-white placeholder:text-slate-500 focus-visible:ring-0"
                              {...field}
                            />
                          </Password>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    className="h-11 w-full rounded-xl bg-lime-500 font-medium text-slate-950 hover:bg-lime-400"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Spinner />
                        Signing In...
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </Form>

              <div className="my-6 flex items-center">
                <div className="h-px flex-1 bg-white/10" />
                <span className="px-3 text-sm text-slate-500">
                  Or continue with
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  variant="outline"
                  size="lg"
                  type="button"
                  className="h-11 border-white/10 bg-slate-900/70 text-white hover:bg-slate-900"
                  onClick={() => signIn("google", { callbackUrl: "/feed" })}
                >
                  <Image
                    src="/google-icon.svg"
                    alt="Google Logo"
                    width={18}
                    height={18}
                  />
                  Sign in with Google
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  type="button"
                  className="h-11 border-white/10 bg-slate-900/70 text-white hover:bg-slate-900"
                  onClick={() => signIn("facebook", { callbackUrl: "/feed" })}
                >
                  <Image
                    src="/fecebook.svg"
                    alt="Facebook Logo"
                    width={18}
                    height={18}
                  />
                  Sign in with Facebook
                </Button>
              </div>

              <p className="mt-8 text-center text-sm text-slate-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="font-medium text-lime-400 transition hover:text-lime-300 hover:underline"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}