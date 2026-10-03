import SectionLabel from "@/app/features/home/section-label";

type FriendActivity = {
  id: string;
  name: string;
  before: string;
  title: string;
  after: string;
  time: string;
};

const ACTIVITIES: FriendActivity[] = [
  {
    id: "mia",
    name: "Mia",
    before: "completed",
    title: "Breaking Bad",
    after: "· rated 5/5",
    time: "2h",
  },
  {
    id: "ren",
    name: "Ren",
    before: "is playing",
    title: "Elden Ring",
    after: "· 84 of 150 h",
    time: "5h",
  },
  {
    id: "aki",
    name: "Aki",
    before: "added 12 titles to",
    title: "Cozy fantasy",
    after: ", ranked",
    time: "1d",
  },
  {
    id: "june",
    name: "June",
    before: "started",
    title: "Vagabond",
    after: "· ch. 1 of 327",
    time: "2d",
  },
  {
    id: "noor",
    name: "Noor",
    before: "finished",
    title: "Parasite",
    after: "· rated 5/5",
    time: "3d",
  },
];

export default function FriendsCard() {
  return (
    <article className="flex flex-col rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
      <SectionLabel>Friends</SectionLabel>

      <ul className="mt-4 flex flex-1 flex-col">
        {ACTIVITIES.map((activity) => (
          <li
            key={activity.id}
            className="flex items-center gap-3 border-b border-line/60 py-3 last:border-b-0"
          >
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-3 text-[11px] font-semibold text-ink-2"
            >
              {activity.name.charAt(0)}
            </span>

            <p className="min-w-0 flex-1 truncate text-[13px] leading-tight text-ink-2">
              <span className="font-semibold text-foreground">{activity.name}</span>{" "}
              {activity.before}{" "}
              <em className="font-serif text-[13.5px] italic">{activity.title}</em>
              <span className="text-ink-3">{activity.after}</span>
            </p>

            <span className="shrink-0 text-[10px] leading-none font-mono tracking-[0.08em] text-ink-3">
              {activity.time}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
