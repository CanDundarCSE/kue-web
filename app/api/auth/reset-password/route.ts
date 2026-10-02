import { proxyAuthPost } from "@/lib/api/backend";

export async function POST(request: Request) {
  return proxyAuthPost(request, {
    path: "reset-password",
    fields: ["email", "token", "newPassword"],
    validationError: "Email, reset token and new password are required.",
    unavailableError: "Cannot reach the Kue API. Please try again.",
  });
}
