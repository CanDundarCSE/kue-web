import { proxyAuthPost } from "@/lib/api/backend";

export async function POST(request: Request) {
  return proxyAuthPost(request, {
    path: "resend-verification",
    fields: ["email"],
    validationError: "Email is required.",
    unavailableError: "Cannot reach the Kue API. Please try again.",
  });
}
