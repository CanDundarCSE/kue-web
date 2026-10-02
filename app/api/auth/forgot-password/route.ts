import { proxyAuthPost } from "@/lib/api/backend";

export async function POST(request: Request) {
  return proxyAuthPost(request, {
    path: "forgot-password",
    fields: ["email"],
    validationError: "Email is required.",
    unavailableError: "Cannot reach the Kue API. Please try again.",
  });
}
