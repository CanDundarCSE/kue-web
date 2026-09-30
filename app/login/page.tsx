import type { Metadata } from "next";
import AuthPlaceholder from "@/app/features/landing/auth-placeholder";

export const metadata: Metadata = {
  title: "Log in — Kue",
  description: "Log in to your Kue library.",
};

export default function LoginPage() {
  return <AuthPlaceholder mode="login" />;
}
