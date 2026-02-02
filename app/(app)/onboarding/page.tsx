"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import SetupSkills from "@/components/profile/setup-skills";
import SetupExperience from "@/components/profile/setup-experience";
import SetupEducation from "@/components/profile/setup-education";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionProvider, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function OnBoardContent() {
  const router = useRouter();
  const { update } = useSession();
  const [api, setApi] = useState<CarouselApi>();
  const [, setCount] = useState(0);
  const [current, setCurrent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const progress = (current - 1) * 33.33;

  async function finish() {
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/profile/completed", { method: "POST" });

      if (!res.ok) {
        toast.error("Could not complete onboarding. Try again.");
        setIsSubmitting(false);
        return;
      }

      // Refresh session to update JWT token with profileCompleted: true
      try {
        await update();
      } catch (error) {
        // Retry once if session update fails
        await new Promise(resolve => setTimeout(resolve, 300));
        await update();
      }

      toast.success("Onboarding complete!", {
        description:
          "Your profile is now set up. You're all set to get started — welcome aboard! 🚀",
      });

      // Hard navigation to ensure fresh page load with updated session
      setTimeout(() => {
        window.location.href = "/feed";
      }, 500);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => setCurrent(api.selectedScrollSnap() + 1));
  }, [api]);

  return (
    <>
      <div className="flex h-full items-center">
        <Carousel
          opts={{ watchDrag: false, watchResize: true }}
          setApi={setApi}
          className="mx-auto w-4/12"
        >
          <Card>
            <CardHeader>
              <Progress value={progress} className="h-1" />
            </CardHeader>
            <CarouselContent>
              <CarouselItem className="flex flex-col">
                <CardContent className="flex h-full flex-col items-center justify-center space-y-2">
                  <Image
                    src="/character/setup-profile.svg"
                    alt="Pana setting up resume"
                    width={400}
                    height={400}
                  />
                  <CardTitle className="text-center text-2xl">
                    Welcome to <span className="text-lime-500">Visondyna</span>
                  </CardTitle>
                  <CardDescription className="w-4/6 text-center">
                    Let’s set up your profile so employers can evaluate you
                    quickly. This takes about 3–5 minutes.
                  </CardDescription>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button
                    type="button"
                    onClick={() => api?.scrollNext()}
                    disabled={!api?.canScrollNext()}
                    className="w-full"
                  >
                    Let&rsquo;s start
                  </Button>
                </CardFooter>
              </CarouselItem>
              <CarouselItem className="flex flex-col">
                {current === 2 && (
                  <CardContent className="flex-1">
                    <SetupSkills api={api} />
                  </CardContent>
                )}
              </CarouselItem>
              <CarouselItem className="flex flex-col">
                <CardContent className="flex-1">
                  <SetupEducation onDone={() => api?.scrollNext()} api={api} />
                </CardContent>
              </CarouselItem>
              <CarouselItem className="flex flex-col">
                <CardContent className="flex-1">
                  <SetupExperience />
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button 
                    className="w-full" 
                    onClick={finish}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Finishing..." : "Finish Onboarding"}
                  </Button>
                </CardFooter>
              </CarouselItem>
            </CarouselContent>
          </Card>
        </Carousel>
      </div>
``      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <p className="text-white">Completing your profile...</p>
          </div>
        </div>
      )}
    </>
  );
}

export default function OnBoard() {
  return (
    <SessionProvider>
      <OnBoardContent />
    </SessionProvider>
  );
}
