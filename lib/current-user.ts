export type CurrentUser = {
  id: number;
  username: string;
  email: string;
  bio: string | null;
  roles: string[];
  // Present in the full /api/v1/me profile; omitted by the refresh payload,
  // which syncs the profile after a lazy rotation.
  isPrivate?: boolean;
  createdAt?: string;
};

export function isCurrentUser(value: unknown): value is CurrentUser {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as CurrentUser).username === "string"
  );
}

export function initialOf(username: string) {
  return username.trim().charAt(0).toUpperCase() || "?";
}
