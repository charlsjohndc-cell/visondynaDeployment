"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ServerError } from "@/lib/types";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Spinner } from "../ui/spinner";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2 } from "lucide-react";
import { Calendar } from "../ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import Password from "../password";
import { signIn } from "next-auth/react";

const formSchema = z
  .object({
    firstname: z.string().nonempty("Please enter your first name."),
    lastname: z.string().nonempty("Please enter your last name."),
    email: z.string().trim().email("Enter a valid email address."),
    birthDate: z.date(),
    gender: z.string().nonempty("Please select your gender."),
    role: z.literal("APPLICANT"),
    password: z
      .string()
      .nonempty("Create a password (8+ characters).")
      .min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().nonempty("Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      const today = new Date();
      const birthDate = new Date(data.birthDate);

      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();

      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age >= 18;
    },
    {
      message: "You must be at least 18 years old to sign up.",
      path: ["birthDate"],
    },
  );

export default function SignUpForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      birthDate: new Date(),
      gender: "",
      role: "APPLICANT",
      password: "",
      confirmPassword: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data }),
      });

      const response: ServerError = await res.json();

      if (!response.ok) {
        toast.error(response.error.message);
        setIsLoading(false);
        return;
      }

      toast.success("Sign up successful! Please verify your email.");
      setEmailSent(true);
      form.reset({
        firstname: "",
        lastname: "",
        email: "",
        birthDate: new Date(),
        gender: "",
        role: "APPLICANT",
        password: "",
        confirmPassword: "",
      });
    } catch {
      toast.error("Something went wrong. Please try again.");
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
          {/* Left Panel */}
          <div className="hidden flex-col justify-center border-r border-white/10 bg-gradient-to-br from-lime-500/15 via-emerald-500/10 to-transparent p-10 lg:flex xl:p-14">
            <div className="max-w-md">
              <p className="mb-4 inline-flex rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1 text-xs font-medium text-lime-300">
                Applicant Registration
              </p>

              <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Start Your Career With{" "}
                <span className="text-lime-400">Visondyna</span>
              </h1>

              <p className="mt-5 text-base leading-7 text-slate-300">
                Create your account to explore job opportunities, apply faster,
                and manage your career journey in one place.
              </p>

              <div className="mt-10 space-y-4">
                {[
                  "Create your applicant account in minutes",
                  "Apply to jobs and track your applications",
                  "Secure sign up with email verification",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-lime-400/15 p-1">
                      <CheckCircle2 className="h-4 w-4 text-lime-400" />
                    </div>
                    <p className="text-sm text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-full bg-slate-950/70 p-6 sm:p-8 md:p-10 xl:p-12">
            <div className="mx-auto w-full max-w-xl">
              <div className="mb-8 text-center lg:text-left">
                <h2 className="text-3xl font-bold text-white">Create Account</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Fill in your details to get started.
                </p>
              </div>

              {emailSent && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <p>
                    We&apos;ve sent a verification link to your email. Please
                    check your inbox and verify your account.
                  </p>
                </div>
              )}

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200">
                            First Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="John"
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
                      name="lastname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200">
                            Last Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Doe"
                              className="h-11 border-white/10 bg-slate-900/80 text-white placeholder:text-slate-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="johndoe@gmail.com"
                            className="h-11 border-white/10 bg-slate-900/80 text-white placeholder:text-slate-500"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-slate-500">
                          We’ll send a verification link to this address.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-slate-200">
                            Date of Birth
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={cn(
                                    "h-11 w-full justify-start border-white/10 bg-slate-900/80 pl-3 text-left font-normal text-white hover:bg-slate-900",
                                    !field.value && "text-slate-500",
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Select your birthdate</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto border-white/10 bg-slate-950 p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() ||
                                  date < new Date("1900-01-01")
                                }
                                captionLayout="dropdown"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200">
                            Gender
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 border-white/10 bg-slate-900/80 text-white">
                                <SelectValue placeholder="Choose your gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="border-white/10 bg-slate-950 text-white">
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">
                          Password
                        </FormLabel>
                        <FormControl>
                          <Password>
                            <Input
                              placeholder="Create a password"
                              className="h-11 border-none bg-transparent text-white placeholder:text-slate-500 focus-visible:ring-0"
                              {...field}
                            />
                          </Password>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">
                          Confirm Password
                        </FormLabel>
                        <FormControl>
                          <Password>
                            <Input
                              placeholder="Confirm your password"
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
                    type="submit"
                    className="h-11 w-full rounded-xl bg-lime-500 font-medium text-slate-950 hover:bg-lime-400"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Spinner />
                        Signing Up...
                      </span>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </Form>

              <div className="my-6 flex items-center">
                <div className="h-px flex-1 bg-white/10" />
                <span className="px-3 text-sm text-slate-500">Or continue with</span>
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
                  Sign up with Google
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
                  Sign up with Facebook
                </Button>
              </div>

              <p className="mt-8 text-center text-sm text-slate-400">
                Already have an account?{" "}
                <Link
                  href="/auth/signin"
                  className="font-medium text-lime-400 transition hover:text-lime-300 hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}