import type { ReactNode } from "react";
import AppShell from "@/app/components/app-shell";

export default function MediaLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

