import type { Metadata } from "next";
import type { ReactNode } from "react";
import AppShell from "@/app/components/app-shell";

export const metadata: Metadata = {
  title: "Library — Kue",
  description: "Everything you're tracking across films, series, games, anime, and manga.",
};

export default function LibraryLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

