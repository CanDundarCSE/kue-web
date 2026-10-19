import type { Metadata } from "next";

import LegalDocument from "@/app/features/legal/legal-document";
import { COOKIE_POLICY } from "@/app/features/legal/legal-content";

export const metadata: Metadata = {
  title: "Cookie Policy — Kue",
  description:
    "The cookies and local storage Kue uses, why they are needed, and how to control them.",
};

export default function CookiePolicyPage() {
  return <LegalDocument {...COOKIE_POLICY} />;
}
