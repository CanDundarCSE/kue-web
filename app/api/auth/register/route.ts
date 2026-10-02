import { proxyAuthPost } from "@/lib/api/backend";

export async function POST(request: Request) {
  return proxyAuthPost(request, {
    path: "register",
    fields: ["username", "email", "password"],
    validationError: "Username, email and password are required.",
    unavailableError: "Cannot reach the Kue API. Please try again.",
  });
}
