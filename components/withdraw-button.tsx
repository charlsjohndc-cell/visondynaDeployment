"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function WithdrawButton({
  applicationId,
}: {
  applicationId: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleWithdraw() {
    const confirmed = window.confirm(
      "Are you sure you want to withdraw this application?"
    );

    if (!confirmed) return;

    try {
      setIsLoading(true);

      const res = await fetch(`/api/applications/${applicationId}/withdraw`, {
        method: "PATCH",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to withdraw application.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="destructive"
      onClick={handleWithdraw}
      disabled={isLoading}
    >
      {isLoading ? "Withdrawing..." : "Withdraw"}
    </Button>
  );
}