import { proxyAuthPost } from "@/lib/api/backend";

export async function POST(request: Request) {
  return proxyAuthPost(request, {
    path: "verify-email",
    fields: ["email", "code"],
    validationError: "Email and verification code are required.",
    unavailableError: "Cannot reach the Kue API. Please try again.",
  });
}
