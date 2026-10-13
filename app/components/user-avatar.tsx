"use client";

import { useState } from "react";

import { initialOf } from "@/lib/current-user";
import { avatarSrc, isAvatarId } from "@/lib/avatars";
import { cn } from "@/lib/utils";

// Renders the user's chosen avatar (public/avatars/<id>.svg) or falls back to
// the first-letter avatar when none is picked — or when the image fails to
// load, so a missing file degrades to the old behavior instead of a broken img.
// The container classes come from the call site, matching each spot's existing
// initials styling (sizes, rounded shape, colors).
export default function UserAvatar({
  username,
  avatarId,
  className,
}: {
  username: string;
  avatarId?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (isAvatarId(avatarId) && !failed) {
    return (
      <span aria-hidden="true" className={cn("grid shrink-0 place-items-center overflow-hidden", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- local SVG avatar; next/image refuses SVGs without dangerouslyAllowSVG. */}
        <img
          src={avatarSrc(avatarId)}
          alt=""
          className="size-full object-cover"
          draggable={false}
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return (
    <span aria-hidden="true" className={cn("grid shrink-0 place-items-center", className)}>
      {initialOf(username)}
    </span>
  );
}
