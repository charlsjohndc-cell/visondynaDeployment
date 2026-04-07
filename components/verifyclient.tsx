"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Spinner } from "@/components/ui/spinner"; // Import spinner for loading state
import { Button } from "@/components/ui/button"; // To add a retry button
import { toast } from "sonner"; // Correctly using toast function from sonner library

export default function VerifyClient({ token }: { token: string }) {
  const [message, setMessage] = useState<string>("Verifying your email...");
  const [isLoading, setIsLoading] = useState<boolean>(true); // Add loading state
  const [isError, setIsError] = useState<boolean>(false); // Track if there is an error
  const router = useRouter();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          setMessage("Your email has been verified. Redirecting to sign-in...");
          setTimeout(() => {
            void (async () => {
              await signOut({ redirect: false });
              router.push("/auth/signin?verified=1");
            })();
          }, 2000); // Delay the redirection
        } else {
          setMessage(
            "Verification failed. The link may have expired or is invalid.",
          );
          setIsError(true);
          toast.error("Verification failed. Please try again."); // Display error toast
        }
      } catch (error) {
        setMessage("An error occurred. Please try again later.");
        setIsError(true);
        toast.error("An error occurred. Please try again later."); // Error toast for catch block
      } finally {
        setIsLoading(false); // Stop the loading spinner after fetching
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="relative flex h-screen items-center justify-center">
      <div className="text-center text-white">
        <h2 className="mb-4 text-2xl font-semibold">Email Verification</h2>
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <Spinner /> {/* Loading spinner */}
            <span>Verifying...</span>
          </div>
        ) : (
          <div>
            <p className="mb-4 w-full text-center text-lg">{message}</p>
            {isError && (
              <div className="space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => router.push("/auth/resend-verification")}
                >
                  Resend Verification Email
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/auth/signin")}
                >
                  Go to Sign In
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
