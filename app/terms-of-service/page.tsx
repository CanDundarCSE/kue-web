import type { Metadata } from "next";

import LegalDocument from "@/app/features/legal/legal-document";
import { TERMS_OF_SERVICE } from "@/app/features/legal/legal-content";

export const metadata: Metadata = {
  title: "Terms of Service — Kue",
  description:
    "The rules for using Kue: your account, acceptable use, content, and how you can close your account.",
};

export default function TermsOfServicePage() {
  return <LegalDocument {...TERMS_OF_SERVICE} />;
}
