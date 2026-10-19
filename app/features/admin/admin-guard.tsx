"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Skeleton } from "@/app/components/ui/skeleton";
import { useCurrentUser } from "@/lib/use-current-user";

export function isAdminUser(roles?: string[] | null): boolean {
  return Boolean(roles?.some((role) => role.toLowerCase() === "admin"));
}

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser();
  const router = useRouter();
  const allowed = isAdminUser(user?.roles);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!allowed) {
      router.replace("/home");
    }
  }, [allowed, loading, router, user]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1160px] px-5 py-10 sm:px-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-3 h-4 w-72" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
