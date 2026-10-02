"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { readApiError } from "@/lib/api/client";

type FormState = {
  username: string;
  email: string;
  password: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function getPasswordStrength(password: string): {
  score: number;
  label: string;
} {
  if (!password) return { score: 0, label: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["", "WEAK", "FAIR", "GOOD", "STRONG"];
  return { score, label: labels[score] };
}

function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "Minimum 8 characters";
  if (!/[A-Z]/.test(password))
    return "Must include at least one uppercase letter";
  if (!/[^A-Za-z0-9]/.test(password))
    return "Must include at least one special character";
  return null;
}

const inputClasses = [
  "block w-full rounded-lg border border-line bg-background px-4 py-3",
  "text-sm text-foreground placeholder:text-ink-3",
  "transition-colors duration-150",
  "hover:border-line-2",
  "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent",
  "dark:border-line dark:bg-background/60 dark:hover:border-line-2",
].join(" ");

const PASSWORD_REQUIREMENTS = [
  "At least 8 characters",
  "One uppercase letter (A-Z)",
  "One special character (!@#$%^&*)",
];

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    username: "",
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

  const strength = getPasswordStrength(form.password);

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
    const username = form.username.trim();
    if (!username) {
      errs.username = "Username is required";
    } else if (username.length < 3 || username.length > 50) {
      errs.username = "Username must be between 3 and 50 characters";
    }
    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = "Enter a valid email";
    }
    const pwError = validatePassword(form.password);
    if (pwError) errs.password = pwError;
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email,
          password: form.password,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Registration failed"));
      }

      setMessage({
        type: "success",
        text: "Account created. Redirecting...",
      });
      setForm({ username: "", email: "", password: "" });
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
            <span>Account &ndash; Register</span>
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
          </p>
        </div>

        <div>
          <h1 className="font-serif text-[clamp(28px,3.5vw,40px)] leading-[1.1] tracking-[-0.01em]">
            Start your index<span className="text-accent">.</span>
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
              htmlFor="username"
              className="mb-1.5 block text-[10px] font-mono tracking-[0.14em] text-ink-3 uppercase"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              maxLength={50}
              className={inputClasses}
              placeholder="Your username"
            />
            {errors.username && (
              <p className="mt-1 text-[12px] text-accent">
                {errors.username}
              </p>
            )}
          </div>

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
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="text-[10px] font-mono tracking-[0.14em] text-ink-3 uppercase"
              >
                Password
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-[10px] font-mono tracking-[0.12em] text-ink-3 uppercase transition-colors hover:text-accent flex items-center gap-1"
                  >
                    ?
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  align="start"
                  className="max-w-xs text-left"
                >
                  <ul className="space-y-1 text-[10px] font-sans tracking-normal">
                    {PASSWORD_REQUIREMENTS.map((req, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-accent shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </div>
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

{form.password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={`h-[3px] w-8 rounded-full transition-colors duration-300 ${
                        i <= strength.score ? "bg-accent" : "bg-line"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-mono tracking-[0.12em] text-ink-3 uppercase">
                  {strength.label}
                </span>
              </div>
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
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <div className="text-center text-[13px] text-ink-2">
          Already have an account?{" "}
          <a
            href="/login"
            className="ml-0.5 text-accent font-medium underline decoration-line-2 underline-offset-4 hover:decoration-accent transition-colors"
          >
            Sign in
          </a>
        </div>
      </div>
    </TooltipProvider>
  );
}
