import type { ReactNode } from "react";

export default function Slab({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={[
        "flex items-center gap-3 text-[9.5px] leading-none font-mono tracking-[0.18em] text-ink-3 uppercase",
        className ?? "",
      ].join(" ")}
    >
      <span>{children}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-line" />
    </p>
  );
}
