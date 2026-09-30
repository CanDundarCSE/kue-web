import MediaAvatarCard, { type MediaType } from "@/app/components/media-avatar-card";
import { COVERS, GENRE_PULL, SYNC_SOURCES, TIME_SPENT } from "@/app/features/landing/sample-data";

function DemoLabel({ children }: { children: string }) {
  return (
    <p className="mb-3 text-[9px] font-mono tracking-[0.16em] text-ink-3 uppercase">{children}</p>
  );
}

export function MiniListDemo() {
  const entries: { title: string; type: MediaType; image?: string; meta: string }[] = [
    {
      title: "Frieren",
      type: "anime",
      image: COVERS["Frieren: Beyond Journey's End"],
      meta: "Anime · 18/28 ep",
    },
    { title: "Elden Ring", type: "game", image: COVERS["Elden Ring"], meta: "Game · 84/150 h" },
    { title: "Parasite", type: "movie", image: COVERS.Parasite, meta: "Film · watched" },
  ];

  return (
    <div>
      <DemoLabel>One list, mixed formats</DemoLabel>
      {entries.map((entry) => (
        <div
          key={entry.title}
          className="flex items-center gap-3 border-t border-line py-2.5 text-[13px] first:border-t-0"
        >
          <MediaAvatarCard
            title={entry.title}
            type={entry.type}
            image={entry.image}
            size="sm"
          />
          <span className="min-w-0 flex-1 truncate font-semibold">{entry.title}</span>
          <span className="shrink-0 text-[9px] font-mono tracking-[0.08em] text-ink-3 uppercase">
            {entry.meta}
          </span>
        </div>
      ))}
    </div>
  );
}

export function FriendDemo() {
  const events = [
    {
      initials: "M",
      name: "Mia",
      copy: (
        <>
          has <em className="font-serif not-italic">Breaking Bad</em> completed · rated 9.6/10
        </>
      ),
    },
    {
      initials: "R",
      name: "Ren",
      copy: (
        <>
          is playing <em className="font-serif not-italic">Elden Ring</em> · 56% through
        </>
      ),
    },
    {
      initials: "A",
      name: "Aki",
      copy: (
        <>
          published the list <em className="font-serif not-italic">Cozy fantasy, ranked</em>
        </>
      ),
    },
  ];

  return (
    <div>
      <DemoLabel>A friend&apos;s shelf</DemoLabel>
      {events.map((event) => (
        <div
          key={event.name}
          className="flex items-start gap-2.5 border-t border-line py-2.5 text-[13px] text-ink-2 first:border-t-0"
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface-3 font-serif text-[12px] text-ink">
            {event.initials}
          </span>
          <span>
            <b className="font-semibold text-ink">{event.name}</b> {event.copy}
          </span>
        </div>
      ))}
    </div>
  );
}

export function HoursDemo() {
  return (
    <div>
      <DemoLabel>Time spent by medium</DemoLabel>
      {TIME_SPENT.map((entry) => (
        <div
          key={entry.label}
          className="grid grid-cols-[64px_1fr_52px] items-center gap-3 py-2"
        >
          <span className="text-[9px] font-mono tracking-[0.12em] text-ink-2 uppercase">
            {entry.label}
          </span>
          <span className="block h-0.5 min-w-0 overflow-hidden rounded-full bg-line">
            <span
              className="block h-full rounded-full bg-ink transition-[width] duration-500"
              style={{ width: `${entry.share}%` }}
            />
          </span>
          <span className="text-right font-mono text-[10px] text-ink-2">{entry.hours} h</span>
        </div>
      ))}
      <div className="mt-3 flex flex-wrap gap-2">
        {GENRE_PULL.map((genre) => (
          <span
            key={genre}
            className="rounded-full border border-line-2 px-2.5 py-1 text-[9px] font-mono tracking-[0.1em] text-ink-2 uppercase"
          >
            {genre}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SyncDemo() {
  return (
    <div>
      <DemoLabel>One search, three providers</DemoLabel>
      {SYNC_SOURCES.map((source) => (
        <div
          key={source.name}
          className="flex items-center gap-2.5 border-t border-line py-2.5 text-[13px] first:border-t-0"
        >
          <span aria-hidden="true" className="pulse-dot size-1.5 rounded-full bg-media-game" />
          <b className="text-[13.5px] font-semibold">{source.name}</b>
          <span className="text-[9px] font-mono tracking-[0.08em] text-ink-3 uppercase">
            {source.scope}
          </span>
          <span className="ml-auto font-mono text-[10px] text-ink-3">{source.count}</span>
        </div>
      ))}
    </div>
  );
}
