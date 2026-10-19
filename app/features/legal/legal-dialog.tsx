"use client";

import { X } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  LEGAL_DOCUMENTS,
  type LegalDocumentKey,
} from "@/app/features/legal/legal-content";
import { LegalDocumentBody } from "@/app/features/legal/legal-document";

type LegalDialogProps = {
  open: boolean;
  documentKey: LegalDocumentKey;
  onOpenChange: (open: boolean) => void;
};

// Shows a legal document in place, so reading the Privacy Policy or Terms of
// Service never navigates the user away from the form they are filling in.
export default function LegalDialog({
  open,
  documentKey,
  onOpenChange,
}: LegalDialogProps) {
  const document = LEGAL_DOCUMENTS[documentKey];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] w-[min(94vw,46rem)] flex-col overflow-hidden p-0"
      >
        <div className="shrink-0 border-b border-line px-5 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <p className="flex items-center gap-3 font-mono text-[10px] tracking-[0.18em] text-ink-3 uppercase">
              <span className="shrink-0">{document.label}</span>
              <span aria-hidden="true" className="h-px w-10 bg-line" />
            </p>

            <DialogClose
              className={[
                "-mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-ink-2",
                "transition-colors duration-150 motion-reduce:transition-none",
                "hover:bg-surface-3 hover:text-foreground",
                "focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:outline-none",
              ].join(" ")}
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>

          <DialogTitle className="mt-3 font-serif text-[clamp(26px,3vw,32px)] leading-[1.08] tracking-[-0.01em] text-foreground">
            {document.title}
          </DialogTitle>
        </div>

        <DialogDescription className="sr-only">
          {document.intro}
        </DialogDescription>

        <div className="overflow-y-auto px-5 py-6 sm:px-7 sm:py-7">
          <LegalDocumentBody
            title={document.title}
            showTitle={false}
            lastUpdated={document.lastUpdated}
            intro={document.intro}
            sections={document.sections}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
