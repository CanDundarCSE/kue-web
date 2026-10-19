import type { Metadata } from "next";

import LegalDocument from "@/app/features/legal/legal-document";
import { PRIVACY_POLICY } from "@/app/features/legal/legal-content";

export const metadata: Metadata = {
  title: "Privacy Policy — Kue",
  description:
    "How Kue collects, uses, stores and protects your personal data, and the rights you have over it.",
};

export default function PrivacyPolicyPage() {
  return <LegalDocument {...PRIVACY_POLICY} />;
}
