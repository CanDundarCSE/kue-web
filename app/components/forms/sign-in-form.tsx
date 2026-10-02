"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/components/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import { readApiError } from "@/lib/api/client";

type FormState = {
  email: string;
  password: string;
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

export default function SignInForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
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
    if (!form.password) {
      errs.password = "Password is required";
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Sign in failed"));
      }

      setMessage({
        type: "success",
        text: "Signed in successfully. Redirecting...",
      });
      setForm({ email: "", password: "" });
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setMessage({ type: "error", text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        <div>
          <p className="flex items-center gap-3 text-[9.5px] leading-none font-mono tracking-[0.18em] text-ink-3 uppercase">
            <span>Account &ndash; Sign In</span>
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
          </p>
        </div>

        <div>
          <h1 className="font-serif text-[clamp(28px,3.5vw,40px)] leading-[1.1] tracking-[-0.01em]">
            Welcome back<span className="text-accent">.</span>
          </h1>
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

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[10px] font-mono tracking-[0.14em] text-ink-3 uppercase"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                className={inputClasses + " pr-16"}
                placeholder="Password"
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
            <div className="mt-2 text-right">
              <a
                href="/forgot-password"
                className="text-[12px] text-accent font-medium underline decoration-line-2 underline-offset-2 transition-colors hover:decoration-accent"
              >
                Forgot password?
              </a>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            disabled={isLoading}
            className="rounded-lg text-sm"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="text-center text-[13px] text-ink-2">
          Don&apos;t have an account?{" "}
          <a
            href="/register"
            className="ml-0.5 text-accent font-medium underline decoration-line-2 underline-offset-4 hover:decoration-accent transition-colors"
          >
            Create account
          </a>
        </div>
      </div>
    </TooltipProvider>
  );
}