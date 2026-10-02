import { proxyAuthPost } from "@/lib/api/backend";

export async function POST(request: Request) {
  return proxyAuthPost(request, {
    path: "login",
    fields: ["email", "password"],
    validationError: "Email and password are required.",
    unavailableError: "Cannot reach the Kue API. Please try again.",
  });
}
