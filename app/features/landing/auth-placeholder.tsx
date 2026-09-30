import Link from "next/link";
import { ButtonLink } from "@/app/components/button";
import Slab from "@/app/features/landing/slab";

export default function AuthPlaceholder({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";

  return (
    <main className="mx-auto flex min-h-full w-[min(600px,92vw)] flex-col justify-center py-24">
      <Slab>{isRegister ? "Create an account" : "Welcome back"}</Slab>

      <h1 className="mt-4 mb-4 font-serif text-[clamp(32px,4vw,46px)] leading-[1.1] tracking-[-0.01em]">
        {isRegister ? "Start your index" : "Log in to Kue"}
        <span className="text-accent">.</span>
      </h1>

      <p className="max-w-[46ch] text-[15px] text-ink-2">
        This page is not connected yet. Signing in lands with the first build of the app,
        and the form will post straight to the Kue API.
      </p>

      <div className="mt-9 flex flex-wrap items-center gap-4">
        <ButtonLink href={isRegister ? "/login" : "/register"} size="md">
          {isRegister ? "I already have an account" : "Create an account"}
        </ButtonLink>
        <Link href="/" className="text-[13.5px] text-ink-2 transition-colors hover:text-accent">
          Back to the home page
        </Link>
      </div>
    </main>
  );
}
