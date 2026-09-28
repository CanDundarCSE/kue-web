export type MediaType = "movie" | "series" | "game" | "anime" | "manga";
export type MediaAvatarCardSize = "sm" | "md" | "fluid";

const MEDIA_ACCENT: Record<MediaType, string> = {
  movie: "border-l-[#C4533C] dark:border-l-[#D9705A]",
  series: "border-l-[#B98E2F] dark:border-l-[#CFA544]",
  game: "border-l-[#4E9066] dark:border-l-[#5FAE7C]",
  anime: "border-l-[#A85777] dark:border-l-[#C4708F]",
  manga: "border-l-[#47748F] dark:border-l-[#5E93B0]",
};

const CARD_SIZE: Record<MediaAvatarCardSize, string> = {
  sm: "h-11 w-[34px]",
  md: "h-[54px] w-[42px]",
  fluid: "aspect-[42/54] w-full",
};

function getInitials(title: string) {
  return title.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 2).toUpperCase() || "?";
}

export default function MediaAvatarCard({
  title,
  initials,
  year,
  type,
  size = "md",
  className,
}: {
  title: string;
  initials?: string;
  year?: number;
  type: MediaType;
  size?: MediaAvatarCardSize;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={year === undefined ? title : `${title} (${year})`}
      className={[
        "@container flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border",
        "border-l-[clamp(3px,7cqi,6px)]",
        "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900",
        MEDIA_ACCENT[type],
        CARD_SIZE[size],
        className ?? "",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "font-[family-name:var(--font-badge)] text-[clamp(11px,33.3cqi,28px)] leading-none font-semibold tracking-[0.02em]",
          "text-zinc-900 dark:text-zinc-100",
        ].join(" ")}
      >
        {initials ?? getInitials(title)}
      </span>

      {size !== "sm" && year !== undefined && (
        <span
          aria-hidden="true"
          className={[
            "font-[family-name:var(--font-badge)] text-[clamp(6px,16.7cqi,14px)] leading-none tracking-[0.08em]",
            "text-zinc-400 dark:text-zinc-500",
          ].join(" ")}
        >
          {year}
        </span>
      )}
    </div>
  );
}
