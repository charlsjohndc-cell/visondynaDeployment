import ResendForm from "@/components/auth/resend-form";
import VerifyClient from "@/components/verifyclient";

function Banner({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-4 text-center text-slate-200">
      <h2 className="mb-1 text-lg font-semibold">{title}</h2>
      <p className="w-full text-sm text-slate-400">{message}</p>
    </div>
  );
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams?: Promise<{
    token?: string;
    checkInbox?: string;
    email?: string;
  }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const token = resolvedSearchParams?.token;

  // If a token is present: run verification flow (spinner/success/error inside)
  if (token) {
    return <VerifyClient token={token} />;
  }

  // Otherwise: show "check your inbox" + optional resend form
  const checkInbox = resolvedSearchParams?.checkInbox === "1";
  const presetEmail =
    typeof resolvedSearchParams?.email === "string"
      ? resolvedSearchParams.email
      : "";

  return (
    <div className="relative flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-lg text-white">
        <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h1 className="mb-2 text-center text-2xl font-semibold">
            Verify your email
          </h1>
          <p className="mb-6 w-full text-center text-sm text-slate-300">
            You need to verify your email before you can continue.
          </p>

          <ResendForm presetEmail={presetEmail} />
          <p className="mt-4 text-center text-xs text-slate-400">
            Didn’t get it? Try resending, or check your spam folder.
          </p>
        </div>

        {checkInbox ? (
          <Banner
            title="Verification link sent"
            message="We emailed you a verification link. Please check your inbox (and spam). Link expires in 30 minutes."
          />
        ) : null}
      </div>
    </div>
  );
}
