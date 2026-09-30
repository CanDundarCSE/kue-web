export default function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={[
        "size-2.5 shrink-0 bg-accent [clip-path:polygon(0_0,100%_0,50%_100%)]",
        className ?? "",
      ].join(" ")}
    />
  );
}
