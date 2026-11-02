"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import Button from "@/app/components/button";
import { readApiError } from "@/lib/api/client";

const inputClasses = [
  "block w-full rounded-lg border border-line bg-background px-4 py-3",
  "text-sm text-foreground placeholder:text-ink-3",
  "transition-colors duration-150",
  "hover:border-line-2",
  "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent",
  "dark:border-line dark:bg-background/60 dark:hover:border-line-2",
].join(" ");

export default function VerifyEmailForm({
  email,
  onBack,
}: {
  email: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Verification failed"));
      }

      router.push("/home");
      router.refresh();
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resend = async () => {
    setIsResending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Could not resend the code"));
      }

      setMessage({
        type: "success",
        text: "A new code is on its way. Check your inbox.",
      });
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="flex items-center gap-3 text-[9.5px] leading-none font-mono tracking-[0.18em] text-ink-3 uppercase">
          <span>Account &ndash; Verify Email</span>
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
        </p>
      </div>

      <div>
        <h1 className="font-serif text-[clamp(28px,3.5vw,40px)] leading-[1.1] tracking-[-0.01em]">
          Check your email<span className="text-accent">.</span>
        </h1>
        <p className="mt-3 max-w-[42ch] text-[14px] leading-relaxed text-ink-2">
          We sent an 8-character code to{" "}
          <span className="font-medium text-foreground">{email}</span>. Enter it
          to finish creating your account.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-[13px] ${
            message.type === "success"
              ? "border border-accent-soft bg-accent-soft/30 text-accent"
              : "border border-line bg-surface-2 text-ink-2"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={verify} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="verification-code"
            className="mb-1.5 block text-[10px] font-mono tracking-[0.14em] text-ink-3 uppercase"
          >
            Verification code
          </label>
          <input
            type="text"
            id="verification-code"
            name="code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoComplete="one-time-code"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={9}
            className={inputClasses + " font-mono tracking-[0.18em] uppercase"}
            placeholder="XXXX-XXXX"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          disabled={isLoading || code.replace(/[^A-Za-z0-9]/g, "").length !== 8}
          className="rounded-lg text-sm"
        >
          {isLoading ? "Verifying..." : "Verify email"}
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-ink-2">
        <button
          type="button"
          onClick={resend}
          disabled={isResending}
          className="text-accent font-medium underline decoration-line-2 underline-offset-4 transition-colors hover:decoration-accent disabled:opacity-50"
        >
          {isResending ? "Sending..." : "Resend code"}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-ink-2 transition-colors hover:text-foreground"
        >
          Use a different email
        </button>
      </div>
    </div>
  );
}
