"use client";

import { Check, Copy, Loader2, QrCode, Search, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import SectionLabel from "@/app/features/home/section-label";
import UserAvatar from "@/app/components/user-avatar";
import {
  fetchFriendRequests,
  fetchFriends,
  lookupByKueId,
  profileHref,
  removeFriend,
  respondToRequest,
  sendFriendRequest,
  type FriendDto,
  type FriendRequestDto,
  type PublicProfileDto,
} from "@/lib/api/friends";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

const ghostButton =
  "inline-flex items-center gap-1.5 rounded-md border border-line-2/70 px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] text-ink-2 uppercase " +
  "transition-colors duration-150 motion-reduce:transition-none hover:bg-surface-3 hover:text-foreground " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 " +
  "disabled:pointer-events-none disabled:opacity-40";

function MyCodeCard({ kueId }: { kueId: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setOrigin(window.location.origin), 0);
    return () => clearTimeout(handle);
  }, []);

  const addLink = origin ? `${origin}/friends?add=${encodeURIComponent(kueId)}` : "";

  const copy = async (text: string) => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable: values stay visible for manual copying.
    }
  };

  return (
    <section
      aria-labelledby="friends-my-code"
      className="rounded-xl border border-line bg-surface-2/60 p-4 sm:p-5"
    >
      <h2 id="friends-my-code" className="font-mono text-[11px] tracking-[0.16em] text-ink-2 uppercase">
        My code
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
        Friends scan this with their camera to open your add page, or paste your Kue ID below.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-5">
        <div className="rounded-xl bg-white p-3 shadow-xs">
          {addLink ? (
            <QRCodeSVG value={addLink} size={148} marginSize={1} aria-label={`QR code for ${kueId}`} />
          ) : (
            <div aria-hidden="true" className="size-[148px] animate-pulse rounded bg-zinc-200" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.14em] text-ink-3 uppercase">Kue ID</p>
          <p className="mt-1 font-mono text-[18px] tracking-[0.08em] text-foreground">{kueId}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button type="button" onClick={() => void copy(kueId)} className={ghostButton}>
              {copied ? (
                <Check className="size-3 text-emerald-500" strokeWidth={2} aria-hidden="true" />
              ) : (
                <Copy className="size-3" strokeWidth={2} aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy ID"}
            </button>
            {addLink && (
              <button type="button" onClick={() => void copy(addLink)} className={ghostButton}>
                <QrCode className="size-3" strokeWidth={2} aria-hidden="true" />
                Copy link
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function AddFriendCard({
  initialKueId,
  currentUserId,
  incoming,
  onChanged,
}: {
  initialKueId: string;
  currentUserId: number;
  incoming: FriendRequestDto[];
  onChanged: () => void;
}) {
  const [input, setInput] = useState(initialKueId);
  const [looking, setLooking] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicProfileDto | null>(null);

  const search = useCallback(
    async (kueId: string) => {
      const trimmed = kueId.trim();
      if (!trimmed || looking) return;
      setLooking(true);
      setError(null);
      setNotice(null);
      setProfile(null);

      const found = await lookupByKueId(trimmed);
      setLooking(false);
      if (!found) {
        setError(`No account found for "${trimmed}". Check the Kue ID and try again.`);
        return;
      }
      setProfile(found);
    },
    [looking],
  );

  // Deep link from a scanned QR code (?add=KUE-XXXXXX).
  useEffect(() => {
    if (!initialKueId) return;
    const handle = setTimeout(() => {
      void search(initialKueId);
    }, 0);
    return () => clearTimeout(handle);
  }, [initialKueId, search]);

  const send = async () => {
    if (!profile || acting) return;
    setActing(true);
    setError(null);
    setNotice(null);

    const { ok, message } = await sendFriendRequest(profile.kueId ?? input);
    setActing(false);
    if (!ok) {
      setError(message);
      return;
    }
    setNotice(message);
    onChanged();
    // Refresh the shown status.
    const found = await lookupByKueId(profile.kueId ?? input);
    if (found) setProfile(found);
  };

  const acceptInline = async (requestId: number) => {
    if (acting) return;
    setActing(true);
    setError(null);
    const message = await respondToRequest(requestId, "accept");
    setActing(false);
    if (message !== null) {
      setError(message);
      return;
    }
    setNotice("You are now friends.");
    onChanged();
    const found = profile ? await lookupByKueId(profile.kueId ?? input) : null;
    if (found) setProfile(found);
  };

  const cancelOutgoing = async (username: string) => {
    if (acting) return;
    setActing(true);
    const message = await removeFriend(username);
    setActing(false);
    if (message !== null) {
      setError(message);
      return;
    }
    setNotice("Request cancelled.");
    onChanged();
    const found = profile ? await lookupByKueId(profile.kueId ?? input) : null;
    if (found) setProfile(found);
  };

  const isSelf = profile !== null && profile.id === currentUserId;
  const incomingRequest =
    profile !== null ? incoming.find((r) => r.requesterId === profile.id) : undefined;

  return (
    <section
      aria-labelledby="friends-add"
      className="rounded-xl border border-line bg-surface-2/60 p-4 sm:p-5"
    >
      <h2 id="friends-add" className="font-mono text-[11px] tracking-[0.16em] text-ink-2 uppercase">
        Add friend
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
        Paste a Kue ID or scan a friend&rsquo;s QR code.
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="KUE-XXXXXX"
          aria-label="Friend's Kue ID"
          autoComplete="off"
          spellCheck={false}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void search(input);
            }
          }}
          className={cn(
            "h-10 w-full rounded-lg border border-line-2/70 bg-background px-3",
            "font-mono text-[13px] tracking-[0.08em] text-foreground uppercase placeholder:text-ink-3 placeholder:normal-case placeholder:tracking-normal",
            "transition-colors duration-150 motion-reduce:transition-none",
            "hover:border-line-2",
            "focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none",
          )}
        />
        <button
          type="button"
          onClick={() => void search(input)}
          disabled={looking || !input.trim()}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-md bg-foreground px-3.5 py-2 font-mono text-[11px] tracking-[0.08em] text-background uppercase",
            "transition-opacity duration-150 motion-reduce:transition-none hover:opacity-90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          {looking ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} aria-hidden="true" />
          ) : (
            <Search className="size-3.5" strokeWidth={2} aria-hidden="true" />
          )}
          Search
        </button>
      </div>

      {error && <p className="mt-2.5 text-[12px] text-[#C4533C] dark:text-[#D9705A]">{error}</p>}
      {notice && (
        <p className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] text-emerald-600 dark:text-emerald-400">
          <Check className="size-3.5" strokeWidth={2} aria-hidden="true" />
          {notice}
        </p>
      )}

      {profile && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-line-2/70 bg-background px-3.5 py-3">
          <UserAvatar
            username={profile.username}
            avatarId={profile.avatarId}
            className="size-10 rounded-full bg-accent-soft text-[15px] font-semibold text-accent"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-foreground">{profile.username}</p>
            <p className="mt-0.5 truncate font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
              {profile.kueId ?? ""}
              {profile.bio ? ` · ${profile.bio}` : ""}
            </p>
          </div>
          {isSelf ? (
            <span className="font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
              That&rsquo;s you
            </span>
          ) : profile.friendshipStatus === "accepted" || profile.isFriend ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.1em] text-emerald-600 uppercase dark:text-emerald-400">
              <Check className="size-3.5" strokeWidth={2} aria-hidden="true" />
              Friends
            </span>
          ) : profile.friendshipStatus === "pending_received" && incomingRequest ? (
            <button type="button" onClick={() => void acceptInline(incomingRequest.id)} disabled={acting} className={ghostButton}>
              Accept request
            </button>
          ) : profile.friendshipStatus === "pending_received" ? (
            <span className="font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
              Wants to be friends — see requests below
            </span>
          ) : profile.friendshipStatus === "pending_sent" ? (
            <button type="button" onClick={() => void cancelOutgoing(profile.username)} disabled={acting} className={ghostButton}>
              <X className="size-3" strokeWidth={2} aria-hidden="true" />
              Cancel request
            </button>
          ) : (
            <button type="button" onClick={() => void send()} disabled={acting} className={ghostButton}>
              <UserPlus className="size-3.5" strokeWidth={2} aria-hidden="true" />
              {acting ? "Sending…" : "Send request"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function RequestRow({
  title,
  subtitle,
  kueId,
  busy,
  actions,
  username,
  avatarId,
}: {
  title: string;
  subtitle?: string | null;
  kueId?: string | null;
  busy: boolean;
  actions: React.ReactNode;
  username?: string;
  avatarId?: string | null;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
      <UserAvatar
        username={title}
        avatarId={avatarId}
        className="size-9 rounded-full bg-surface-3 text-[13px] font-semibold text-ink-2"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-foreground">
          {username ? (
            <Link href={profileHref({ username, kueId })} className="hover:underline">
              {title}
            </Link>
          ) : (
            title
          )}
        </p>
        <p className="mt-0.5 truncate font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
          {[kueId, subtitle].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{busy ? <Loader2 className="size-4 animate-spin text-ink-3" aria-hidden="true" /> : actions}</div>
    </li>
  );
}

export default function FriendsView({ initialKueId }: { initialKueId: string }) {
  const { user, loading } = useCurrentUser();

  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [incoming, setIncoming] = useState<FriendRequestDto[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequestDto[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [friendFilter, setFriendFilter] = useState("");
  const requestRef = useRef(0);

  const reload = useCallback(async () => {
    const requestId = ++requestRef.current;
    const [f, inc, out] = await Promise.all([
      fetchFriends(),
      fetchFriendRequests("incoming"),
      fetchFriendRequests("outgoing"),
    ]);
    if (requestId !== requestRef.current) return;
    if (f === null || inc === null || out === null) {
      setListError("Couldn't load friends.");
      return;
    }
    setListError(null);
    setFriends(f);
    setIncoming(inc);
    setOutgoing(out);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    const handle = setTimeout(() => {
      void reload();
    }, 0);
    return () => clearTimeout(handle);
  }, [loading, user, reload]);

  const act = async (key: string, run: () => Promise<string | null>) => {
    setBusyId(key);
    setListError(null);
    const message = await run();
    setBusyId(null);
    if (message !== null) {
      setListError(message);
      return;
    }
    await reload();
  };

  if (loading || user === null) {
    return (
      <div className="mx-auto w-full max-w-[720px] px-5 py-8 sm:px-8 sm:py-10">
        <SectionLabel>Friends</SectionLabel>
        <div className="mt-5 space-y-4" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-32 animate-pulse rounded-xl bg-surface-3" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-5 py-8 sm:px-8 sm:py-10">
      <section aria-labelledby="friends-heading">
        <SectionLabel>Friends</SectionLabel>
        <h1
          id="friends-heading"
          className="mt-5 font-serif text-[clamp(28px,4vw,40px)] leading-[1.08] tracking-[-0.01em] text-foreground"
        >
          Your circle<span className="text-accent">.</span>
        </h1>
        {loaded && (
          <p className="mt-3 text-[14px] text-ink-2">
            {friends.length} {friends.length === 1 ? "friend" : "friends"}
            {incoming.length > 0 ? ` · ${incoming.length} pending` : ""}.
          </p>
        )}
      </section>

      <div className="mt-6 space-y-4">
        {user.kueId && <MyCodeCard kueId={user.kueId} />}

        <AddFriendCard
          initialKueId={initialKueId}
          currentUserId={user.id}
          incoming={incoming}
          onChanged={() => void reload()}
        />

        {listError && (
          <p className="text-[12px] text-[#C4533C] dark:text-[#D9705A]">{listError}</p>
        )}

        {loaded && incoming.length > 0 && (
          <section aria-label="Incoming requests" className="overflow-hidden rounded-xl border border-line bg-surface-2/60">
            <p className="border-b border-line px-4 py-3 font-mono text-[10px] tracking-[0.16em] text-ink-3 uppercase sm:px-5">
              Requests for you · {incoming.length}
            </p>
            <ul className="max-h-[320px] divide-y divide-line overflow-y-auto">
              {incoming.map((request) => (
                <RequestRow
                  key={request.id}
                  title={request.requesterUsername}
                  username={request.requesterUsername}
                  kueId={request.requesterKueId}
                  avatarId={request.requesterAvatarId}
                  subtitle={request.requesterBio}
                  busy={busyId === `in-${request.id}`}
                  actions={
                    <>
                      <button
                        type="button"
                        onClick={() => void act(`in-${request.id}`, () => respondToRequest(request.id, "accept"))}
                        className={ghostButton}
                      >
                        <Check className="size-3" strokeWidth={2} aria-hidden="true" />
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => void act(`in-${request.id}`, () => respondToRequest(request.id, "decline"))}
                        className={ghostButton}
                      >
                        <X className="size-3" strokeWidth={2} aria-hidden="true" />
                        Decline
                      </button>
                    </>
                  }
                />
              ))}
            </ul>
          </section>
        )}

        {loaded && outgoing.length > 0 && (
          <section aria-label="Sent requests" className="overflow-hidden rounded-xl border border-line bg-surface-2/60">
            <p className="border-b border-line px-4 py-3 font-mono text-[10px] tracking-[0.16em] text-ink-3 uppercase sm:px-5">
              Sent · {outgoing.length}
            </p>
            <ul className="max-h-[320px] divide-y divide-line overflow-y-auto">
              {outgoing.map((request) => (
                <RequestRow
                  key={request.id}
                  title={request.addresseeUsername}
                  subtitle="Pending"
                  kueId={request.addresseeKueId}
                  avatarId={request.addresseeAvatarId}
                  busy={busyId === `out-${request.id}`}
                  actions={
                    <button
                      type="button"
                      onClick={() => void act(`out-${request.id}`, () => removeFriend(request.addresseeUsername))}
                      className={ghostButton}
                    >
                      <X className="size-3" strokeWidth={2} aria-hidden="true" />
                      Cancel
                    </button>
                  }
                />
              ))}
            </ul>
          </section>
        )}

        {loaded && (
          <section aria-label="Friends" className="overflow-hidden rounded-xl border border-line bg-surface-2/60">
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 sm:px-5">
              <p className="font-mono text-[10px] tracking-[0.16em] text-ink-3 uppercase">
                Friends · {friends.length}
              </p>
              {friends.length > 4 && (
                <input
                  value={friendFilter}
                  onChange={(event) => setFriendFilter(event.target.value)}
                  placeholder="Filter friends…"
                  aria-label="Filter friends"
                  className={cn(
                    "ml-auto h-7 w-full max-w-44 rounded-md border border-line-2/70 bg-background px-2.5 text-[12px] text-foreground placeholder:text-ink-3",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  )}
                />
              )}
            </div>
            {(() => {
              const query = friendFilter.trim().toLowerCase();
              const visible = query
                ? friends.filter((friend) => friend.username.toLowerCase().includes(query))
                : friends;
              if (friends.length === 0) {
                return (
                  <p className="px-5 py-8 text-center text-[13px] text-ink-2">
                    No friends yet — search a Kue ID above to add someone.
                  </p>
                );
              }
              if (visible.length === 0) {
                return (
                  <p className="px-5 py-8 text-center text-[13px] text-ink-2">
                    No friends match &ldquo;{friendFilter.trim()}&rdquo;.
                  </p>
                );
              }
              return (
                <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
                  {visible.map((friend) => (
                  <RequestRow
                    key={friend.friendshipId}
                    title={friend.username}
                    username={friend.username}
                    kueId={friend.kueId}
                    avatarId={friend.avatarId}
                    subtitle={friend.bio}
                    busy={busyId === `fr-${friend.friendshipId}`}
                    actions={
                      <button
                        type="button"
                        onClick={() => void act(`fr-${friend.friendshipId}`, () => removeFriend(friend.username))}
                        className={ghostButton}
                      >
                        Remove
                      </button>
                    }
                  />
                  ))}
                </ul>
              );
            })()}
          </section>
        )}
      </div>
    </div>
  );
}
