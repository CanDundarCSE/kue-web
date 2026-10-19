"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/app/components/ui/dialog";
import LegalDialog from "@/app/features/legal/legal-dialog";
import {
  LEGAL_VERSION,
  type LegalDocumentKey,
} from "@/app/features/legal/legal-content";
import { authFetch, readApiError } from "@/lib/api/client";
import { emitSessionSync } from "@/lib/session-sync";
import { useCurrentUser } from "@/lib/use-current-user";

const linkClasses = [
  "inline rounded-sm font-medium text-accent underline decoration-line-2 underline-offset-4",
  "transition-colors hover:decoration-accent",
  "focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:outline-none",
  "cursor-pointer",
].join(" ");

/**
 * Blocks the app when the signed-in user accepted an older version of the legal
 * documents (or predates version tracking entirely). Accepting records the
 * current LEGAL_VERSION via POST /api/v1/me/terms.
 */
export default function LegalReacceptDialog() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [acceptedVersion, setAcceptedVersion] = useState<string | null>(null);
  const [legalDocument, setLegalDocument] =
    useState<LegalDocumentKey>("privacy");
  const [legalOpen, setLegalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const version = acceptedVersion ?? user.termsVersion;
  const needsReaccept = version !== LEGAL_VERSION;

  if (!needsReaccept) return null;

  const accept = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await authFetch("/api/v1/me/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isTermsAccepted: true,
          termsVersion: LEGAL_VERSION,
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Couldn't record your acceptance."));
      }

      const updated = await response.json().catch(() => null);
      setAcceptedVersion(LEGAL_VERSION);
      if (updated) {
        emitSessionSync({ ...user, ...updated });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const signOut = async () => {
    await authFetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/login");
    router.refresh();
  };

  return (
    <>
      <Dialog open>
        <DialogContent
          showCloseButton={false}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          className="w-[min(92vw,28rem)] p-6"
        >
          <p className="flex items-center gap-3 font-mono text-[10px] tracking-[0.18em] text-ink-3 uppercase">
            <span className="shrink-0">Legal &mdash; Updated</span>
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
          </p>

          <DialogTitle className="mt-4 font-serif text-[clamp(24px,3vw,30px)] leading-[1.1] text-foreground">
            We updated our terms<span className="text-accent">.</span>
          </DialogTitle>

          <DialogDescription className="mt-3 text-[13px] leading-relaxed text-ink-2">
            Before you keep using Kue, please review and accept the current{" "}
            <a
              href="/privacy-policy"
              onClick={(event) => {
                event.preventDefault();
                setLegalDocument("privacy");
                setLegalOpen(true);
              }}
              aria-haspopup="dialog"
              className={linkClasses}
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              href="/terms-of-service"
              onClick={(event) => {
                event.preventDefault();
                setLegalDocument("terms");
                setLegalOpen(true);
              }}
              aria-haspopup="dialog"
              className={linkClasses}
            >
              Terms of Service
            </a>
            .
          </DialogDescription>

          {error && <p className="mt-3 text-[12px] text-accent">{error}</p>}

          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => void accept()}
              disabled={isSubmitting}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "I accept"}
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="w-full rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-3 hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <LegalDialog
        open={legalOpen}
        documentKey={legalDocument}
        onOpenChange={setLegalOpen}
      />
    </>
  );
}
