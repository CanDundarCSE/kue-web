"use client";

import { useState } from "react";
import Button from "@/app/components/button";

type FormState = {
  email: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const inputClasses = [
  "block w-full rounded-lg border border-line bg-background px-4 py-3",
  "text-sm text-foreground placeholder:text-ink-3",
  "transition-colors duration-150",
  "hover:border-line-2",
  "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent",
  "dark:border-line dark:bg-background/60 dark:hover:border-line-2",
].join(" ");

export default function ForgotPasswordForm() {
  const [form, setForm] = useState<FormState>({
    email: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as keyof FormState];
        return next;
      });
    }
  };

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = "Enter a valid email";
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Request failed");
      }

      setMessage({
        type: "success",
        text: "If an account exists, you'll receive a password reset link shortly.",
      });
      setForm({ email: "" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setMessage({ type: "error", text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="flex items-center gap-3 text-[9.5px] leading-none font-mono tracking-[0.18em] text-ink-3 uppercase">
          <span>Account &ndash; Reset Password</span>
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
        </p>
      </div>

      <div>
        <h1 className="font-serif text-[clamp(28px,3.5vw,40px)] leading-[1.1] tracking-[-0.01em]">
          Forgot your password?<span className="text-accent">.</span>
        </h1>
        <p className="mt-3 max-w-[42ch] text-[14px] leading-relaxed text-ink-2">
          Enter your email and we&apos;ll send you a link to set a new password.
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

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-[10px] font-mono tracking-[0.14em] text-ink-3 uppercase"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            className={inputClasses}
            placeholder="you@somewhere.com"
          />
          {errors.email && (
            <p className="mt-1 text-[12px] text-accent">{errors.email}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          disabled={isLoading}
          className="rounded-lg text-sm"
        >
          {isLoading ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <div className="text-center text-[13px] text-ink-2">
        Remember your password?{" "}
        <a
          href="/login"
          className="ml-0.5 text-accent font-medium underline decoration-line-2 underline-offset-4 hover:decoration-accent transition-colors"
        >
          Sign in
        </a>
      </div>
    </div>
  );
}