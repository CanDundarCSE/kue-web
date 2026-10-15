import type { Metadata } from "next";

import LegalDocument, { type LegalSection } from "@/app/features/legal/legal-document";

export const metadata: Metadata = {
  title: "Privacy Policy — Kue",
  description:
    "How Kue collects, uses, stores and protects your personal data, and the rights you have over it.",
};

const SECTIONS: LegalSection[] = [
  {
    heading: "1. Who we are",
    paragraphs: [
      "Kue is an entertainment tracking platform that lets you keep films, series, games, anime and manga in a single index. Kue is responsible for the personal data described in this policy.",
      "This policy explains what we collect, why we collect it, how we keep it safe, and the choices and rights available to you. It applies to the Kue web application and to the accounts you create on it.",
    ],
  },
  {
    heading: "2. Data we collect",
    paragraphs: ["We keep data collection to the minimum needed to run the service. This includes:"],
    bullets: [
      "Account data you provide: a username, an email address and a password. Your password is never stored in plain text \u2014 see the security section below.",
      "Profile data you choose to add: a display bio, an avatar selection, and profile privacy settings.",
      "Content you create: library entries, statuses, progress, ratings, custom lists, reviews and mini-game results.",
      "Technical data: session tokens that keep you signed in, and the IP address used to issue and protect those sessions.",
      "Consent records: the fact that you accepted this Privacy Policy and the Terms of Service, and the date and time (UTC) you accepted them.",
    ],
  },
  {
    heading: "3. How we use your data",
    paragraphs: [
      "We use your personal data only to run the service you signed up for, and we do not sell it or use it for advertising.",
    ],
    bullets: [
      "Authentication and account security: to create your account, sign you in, rotate sessions, and detect abuse such as credential-stuffing or refresh-token replay.",
      "Providing your profile and library: to show you your own data and, subject to your privacy settings, to show it to friends or to the public.",
      "Communications you request: to send transactional emails such as password-reset links.",
    ],
  },
  {
    heading: "4. Cookies and sessions",
    paragraphs: [
      "Kue uses strictly necessary cookies to keep you signed in. A short-lived access token and a longer-lived refresh token are stored in HttpOnly cookies, which means they cannot be read by client-side scripts. We do not use advertising or third-party tracking cookies.",
      "You can clear these cookies at any time through your browser settings; doing so signs you out.",
    ],
  },
  {
    heading: "5. Sharing and third parties",
    paragraphs: [
      "We do not sell your personal data. We share limited data with service providers who process it on our behalf, and with external catalogues only to the extent needed to display media metadata:",
    ],
    bullets: [
      "Email delivery: a transactional email provider receives your email address and the content of the message so that password-reset emails can be sent.",
      "Hosting and database: our application and database providers store your account and content data to operate the service.",
      "Media catalogues: TMDB, AniList and IGDB provide movie, anime and game metadata. These requests are for catalogue data and are not used to build advertising profiles of you.",
    ],
  },
  {
    heading: "6. Data security",
    paragraphs: [
      "We take the security of your data seriously:",
    ],
    bullets: [
      "Passwords are securely hashed using a salted, industry-standard password-hashing algorithm (PBKDF2 with HMAC-SHA512 via ASP.NET Core Identity). Your plain-text password is never stored, logged or recoverable.",
      "All traffic between your browser and Kue is encrypted in transit over SSL/TLS (HTTPS).",
      "Access tokens are short-lived and refresh tokens are rotated, stored only as hashes, and revoked automatically if a reused (replayed) token is detected.",
      "Administrative access is restricted and audited.",
    ],
  },
  {
    heading: "7. Data retention and deletion",
    paragraphs: [
      "We keep your personal data for as long as your account exists. When you delete your account, your account and associated content are permanently removed from our active database. Some information may remain temporarily in backups or security logs and will be deleted according to our retention schedules, unless retention is required by law. Account deletion cannot be undone.",
    ],
  },
  {
    heading: "8. Your rights",
    paragraphs: [
      "You are always in control of your account. The fastest way to manage your personal data is directly in the product:",
    ],
    bullets: [
      "Access and correction: update your username, email, bio, avatar and privacy settings at any time from your account settings.",
      "Deletion (right to be forgotten): delete your account at any time from Settings \u2192 Delete my account. Your account and associated content are permanently removed from our active database, and account deletion cannot be undone.",
      "Questions: contact us using the details below and we will help with any other request about your data.",
    ],
  },
  {
    heading: "9. Children",
    paragraphs: [
      "Kue is not directed to children, and we do not knowingly collect their personal data. If you believe a child has created an account, contact us and we will remove it.",
    ],
  },
  {
    heading: "10. Changes to this policy",
    paragraphs: [
      "We may update this policy to reflect changes to the service or the law. When we make a material change we will update the \u201cLast updated\u201d date above and, where appropriate, ask you to review it again. Continued use of Kue after a change means you accept the updated policy.",
    ],
  },
  {
    heading: "11. Contact",
    paragraphs: [
      "Questions about this policy or a request about your data can be sent to candundarcse@gmail.com.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      label="Legal \u2014 Privacy"
      title="Privacy Policy"
      lastUpdated="15 October 2026"
      intro="This Privacy Policy describes how Kue collects, uses, stores and protects your personal data when you create an account and use the service. Please read it together with our Terms of Service."
      sections={SECTIONS}
    />
  );
}
