import type { Metadata } from "next";
import AuthPlaceholder from "@/app/features/landing/auth-placeholder";

export const metadata: Metadata = {
  title: "Create an account — Kue",
  description: "Create a free Kue account and start your index.",
};

export default function RegisterPage() {
  return <AuthPlaceholder mode="register" />;
}
