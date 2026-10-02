"use client";

import { useState } from "react";
import Button from "@/app/components/button";
import { readApiError } from "@/lib/api/client";

type FormState = {
  password: string;
  confirmPassword: string;
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

function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "Minimum 8 characters";
  if (!/[A-Z]/.test(password))
    return "Must include at least one uppercase letter";
  if (!/[^A-Za-z0-9]/.test(password))
    return "Must include at least one special character";
  return null;
}

export default function ResetPasswordForm({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const [form, setForm] = useState<FormState>({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isDone, setIsDone] = useState(false);

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
    const pwError = validatePassword(form.password);
    if (pwError) errs.password = pwError;
    if (!form.confirmPassword) {
      errs.confirmPassword = "Confirm your new password";
    } else if (form.confirmPassword !== form.password) {
      errs.confirmPassword = "Passwords do not match";
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
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          newPassword: form.password,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Password reset failed"));
      }

      setIsDone(true);
      setForm({ password: "", confirmPassword: "" });
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
          <span>Account &ndash; New Password</span>
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
        </p>
      </div>

      <div>
        <h1 className="font-serif text-[clamp(28px,3.5vw,40px)] leading-[1.1] tracking-[-0.01em]">
          Choose a new password<span className="text-accent">.</span>
        </h1>
        <p className="mt-3 max-w-[42ch] text-[14px] leading-relaxed text-ink-2">
          This link works once and expires after an hour. Any active sessions are
          signed out afterwards.
        </p>
      </div>

      {isDone ? (
        <>
          <div className="rounded-lg border border-accent-soft bg-accent-soft/30 px-4 py-3 text-[13px] text-accent">
            Password reset successfully. You can sign in with your new password.
          </div>
          <a
            href="/login"
            className="text-center text-[13px] text-ink-2"
          >
            Back to{" "}
            <span className="text-accent font-medium underline decoration-line-2 underline-offset-4 transition-colors hover:decoration-accent">
              sign in
            </span>
          </a>
        </>
      ) : (
        <>
          {message && (
            <div className="rounded-lg border border-line bg-surface-2 px-4 py-3 text-[13px] text-ink-2">
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
                value={email}
                readOnly
                autoComplete="email"
                className={inputClasses + " cursor-not-allowed opacity-60"}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-[10px] font-mono tracking-[0.14em] text-ink-3 uppercase"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className={inputClasses + " pr-16"}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-mono tracking-[0.12em] text-ink-3 uppercase transition-colors hover:text-ink-2"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[12px] text-accent">{errors.password}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-[10px] font-mono tracking-[0.14em] text-ink-3 uppercase"
              >
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                className={inputClasses}
                placeholder="Repeat your new password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-[12px] text-accent">
                  {errors.confirmPassword}
                </p>
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
              {isLoading ? "Resetting..." : "Reset password"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
