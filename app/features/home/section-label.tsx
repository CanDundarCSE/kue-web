import { cn } from "@/lib/utils";

export default function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-[10px] font-mono tracking-[0.18em] text-ink-3 uppercase",
        className,
      )}
    >
      <span className="shrink-0">{children}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-line" />
    </p>
  );
}
