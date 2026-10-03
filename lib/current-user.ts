export type CurrentUser = {
  id: number;
  username: string;
  email: string;
  bio: string | null;
  isPrivate: boolean;
  roles: string[];
  createdAt: string;
};

export function initialOf(username: string) {
  return username.trim().charAt(0).toUpperCase() || "?";
}
