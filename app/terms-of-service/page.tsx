import type { Metadata } from "next";

import LegalDocument, { type LegalSection } from "@/app/features/legal/legal-document";

export const metadata: Metadata = {
  title: "Terms of Service — Kue",
  description:
    "The rules for using Kue: your account, acceptable use, content, and how you can close your account.",
};

const SECTIONS: LegalSection[] = [
  {
    heading: "1. Acceptance of these terms",
    paragraphs: [
      "These Terms of Service (\u201cTerms\u201d) govern your access to and use of Kue. By creating an account or using the service, you confirm that you have read, understood and agree to be bound by these Terms and by our Privacy Policy. If you do not agree, you must not use Kue.",
    ],
  },
  {
    heading: "2. Your account",
    bullets: [
      "You must provide accurate registration information and keep your password confidential.",
      "You are responsible for all activity that happens under your account. Tell us promptly if you believe it has been compromised.",
      "You must be old enough to form a binding contract in your jurisdiction.",
      "You may not impersonate another person, or create an account to evade a suspension or ban.",
    ],
  },
  {
    heading: "3. Acceptable use",
    paragraphs: [
      "Kue is a place for tracking and talking about the things you watch, play and read. You agree not to:",
    ],
    bullets: [
      "break the law, or infringe anyone else\u2019s rights;",
      "harass, threaten, or abuse other users;",
      "attempt to access accounts or data that are not yours, or probe, scan or overload the service;",
      "scrape the service or its underlying catalogues at scale, or use automated means to abuse rate limits;",
      "upload malware or any content that is unlawful, hateful or sexually exploitative.",
    ],
  },
  {
    heading: "4. Your content",
    paragraphs: [
      "You keep ownership of the content you create \u2014 your library entries, lists, ratings, reviews and profile information. You grant Kue a limited licence to store, display and process that content solely to operate and provide the service. You are responsible for ensuring you have the right to post what you post.",
      "You control who can see your profile and library through your privacy settings. Content you mark as public may be visible to other users and to visitors.",
    ],
  },
  {
    heading: "5. Third-party services and metadata",
    paragraphs: [
      "Media metadata such as covers, titles and descriptions is provided by third parties including TMDB, AniList and IGDB. Kue is not affiliated with, endorsed by, or sponsored by these services. Their terms may also apply to your use of that metadata.",
    ],
  },
  {
    heading: "6. Deleting your account and termination",
    bullets: [
      "You can delete your account at any time from Settings \u2192 Delete my account. Your account and associated content are permanently removed from our active database; some information may remain temporarily in backups or security logs and will be deleted according to our retention schedules unless retention is required by law. Account deletion cannot be undone.",
      "We may suspend or terminate an account that violates these Terms or that we reasonably believe creates risk for other users or for the service.",
    ],
  },
  {
    heading: "7. Disclaimers",
    paragraphs: [
      "Kue is provided \u201cas is\u201d and \u201cas available\u201d, without warranties of any kind, whether express or implied, including fitness for a particular purpose. We do not warrant that the service will be uninterrupted, error-free, or that metadata will always be accurate or complete.",
    ],
  },
  {
    heading: "8. Limitation of liability",
    paragraphs: [
      "To the maximum extent permitted by law, Kue will not be liable for any indirect, incidental, special or consequential damages, or for any loss of data, arising out of or relating to your use of the service. Nothing in these Terms limits liability that cannot be limited by law.",
    ],
  },
  {
    heading: "9. Changes to these terms",
    paragraphs: [
      "We may update these Terms from time to time. When we do, we will update the \u201cLast updated\u201d date above. Your continued use of Kue after a change means you accept the updated Terms.",
    ],
  },
  {
    heading: "10. Contact",
    paragraphs: [
      "Questions about these Terms can be sent to candundarcse@gmail.com.",
    ],
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalDocument
      label="Legal \u2014 Terms"
      title="Terms of Service"
      lastUpdated="15 October 2026"
      intro="These Terms of Service set out the rules for using Kue. By creating an account you agree to them, so please read them carefully before you continue."
      sections={SECTIONS}
    />
  );
}
