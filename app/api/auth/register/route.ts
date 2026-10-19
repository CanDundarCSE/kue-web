import { proxyAuthPost } from "@/lib/api/backend";
import { LEGAL_VERSION } from "@/app/features/legal/legal-content";

export async function POST(request: Request) {
  // The legal version is stamped server-side from the same constant the pages
  // render, so a stale cached form cannot record consent to an older document.
  return proxyAuthPost(request, {
    path: "register",
    fields: ["username", "email", "password"],
    booleanFields: ["isTermsAccepted"],
    stringFields: { termsVersion: LEGAL_VERSION },
    validationError: "Username, email and password are required.",
    unavailableError: "Cannot reach the Kue API. Please try again.",
  });
}
