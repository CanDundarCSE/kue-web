import { authFetch, readApiError } from "@/lib/api/client";

export type PagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  kueId: string | null;
  avatarId: string | null;
  bio: string | null;
  isPrivate: boolean;
  isBanned: boolean;
  banReason: string | null;
  bannedAt: string | null;
  roles: string[];
  createdAt: string;
  isTermsAccepted: boolean;
  termsAcceptedAt: string | null;
  termsVersion: string | null;
  gameBalance: number;
  gameTotalEarned: number;
  libraryCount: number;
  listsCount: number;
  reviewsCount: number;
  friendsCount: number;
  activitiesCount: number;
  notificationsCount: number;
  activeSessions: number;
  lastActivityAt: string | null;
};

export type AdminUserActivity = {
  id: number;
  activityType: string;
  action: string | null;
  detailText: string | null;
  formattedText: string | null;
  status: string | null;
  progress: number | null;
  rating: number | null;
  mediaId: number | null;
  mediaTitle: string | null;
  mediaType: string | null;
  createdAt: string;
};

export type AdminUserDetail = {
  user: AdminUser;
  recentActivity: AdminUserActivity[];
};

export type AdminMedia = {
  id: number;
  title: string;
  mediaType: string;
  externalSource: string;
  externalId: string;
  coverImage: string | null;
  year: number | null;
  score: number | null;
  totalUnits: number | null;
  unitName: string | null;
  runtimeMinutes: number | null;
  platforms: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string | null;
  trackedCount: number;
};

export type AdminStats = {
  totalUsers: number;
  bannedUsers: number;
  adminUsers: number;
  newUsersLast7Days: number;
  activeSessions: number;
  totalMedia: number;
  deletedMedia: number;
  libraryEntries: number;
  reviews: number;
  customLists: number;
  userActivities: number;
  importJobs: number;
};

export type IntegrationStatus = {
  tmdb: boolean;
  igdb: boolean;
  brevo: boolean;
  aniList: boolean;
};

export type RenderInfo = {
  serviceName: string | null;
  serviceId: string | null;
  instanceId: string | null;
  region: string | null;
  commit: string | null;
  branch: string | null;
  repo: string | null;
  externalHostname: string | null;
};

export type ServerHealth = {
  status: string;
  checkedAt: string;
  environment: string;
  runtime: string;
  version: string;
  machineName: string;
  processorCount: number;
  processArchitecture: string | null;
  osDescription: string | null;
  startedAt: string;
  uptimeSeconds: number;
  workingSetBytes: number;
  gcHeapBytes: number;
  threadCount: number;
  databaseReachable: boolean;
  databaseLatencyMs: number;
  databaseName: string | null;
  databaseProvider: string | null;
  databaseSizeBytes: number | null;
  pendingMigrations: number;
  latestMigration: string | null;
  render: RenderInfo | null;
  integrations: IntegrationStatus;
};

export type AdminDashboard = {
  stats: AdminStats;
  server: ServerHealth;
  recentUsers: AdminUser[];
};

export type AdminUserQuery = {
  search?: string;
  role?: string;
  isBanned?: boolean;
  page?: number;
  pageSize?: number;
};

export type AdminMediaQuery = {
  search?: string;
  mediaType?: string;
  externalSource?: string;
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
};

export type AdminMediaSync = {
  mediaType: string;
  externalSource: string;
  externalId: string;
};

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    throw new Error(await readApiError(response, fallback));
  }

  return (await response.json()) as T;
}

async function readMessage(response: Response, fallback: string): Promise<string> {
  if (!response.ok) {
    throw new Error(await readApiError(response, fallback));
  }

  const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
  return typeof body?.message === "string" && body.message.length > 0
    ? body.message
    : fallback;
}

function userQuery(params: AdminUserQuery): string {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.role) query.set("role", params.role);
  if (typeof params.isBanned === "boolean") {
    query.set("isBanned", String(params.isBanned));
  }
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  const value = query.toString();
  return value ? `?${value}` : "";
}

function mediaQuery(params: AdminMediaQuery): string {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.mediaType) query.set("mediaType", params.mediaType);
  if (params.externalSource) query.set("externalSource", params.externalSource);
  if (params.includeDeleted) query.set("includeDeleted", "true");
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  const value = query.toString();
  return value ? `?${value}` : "";
}

export async function fetchAdminDashboard(): Promise<AdminDashboard> {
  const response = await authFetch("/api/admin/dashboard", { cache: "no-store" });
  return readJson(response, "Couldn't load the admin dashboard.");
}

export async function fetchAdminUsers(params: AdminUserQuery): Promise<PagedResponse<AdminUser>> {
  const response = await authFetch(`/api/admin/users${userQuery(params)}`, {
    cache: "no-store",
  });
  return readJson(response, "Couldn't load users.");
}

export async function fetchAdminUser(id: number): Promise<AdminUserDetail> {
  const response = await authFetch(`/api/admin/users/${id}`, { cache: "no-store" });
  return readJson(response, "Couldn't load this user.");
}

export async function updateAdminUserRole(id: number, roles: string[]): Promise<AdminUser> {
  const response = await authFetch(`/api/admin/users/${id}/role`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roles }),
  });
  return readJson(response, "Couldn't update this user's roles.");
}

export async function banAdminUser(
  id: number,
  isBanned: boolean,
  reason: string | null,
): Promise<AdminUser> {
  const response = await authFetch(`/api/admin/users/${id}/ban`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isBanned, reason }),
  });
  return readJson(response, isBanned ? "Couldn't ban this user." : "Couldn't unban this user.");
}

export async function deleteAdminUser(id: number): Promise<string> {
  const response = await authFetch(`/api/admin/users/${id}`, { method: "DELETE" });
  return readMessage(response, "Couldn't delete this user.");
}

export async function fetchAdminMedia(params: AdminMediaQuery): Promise<PagedResponse<AdminMedia>> {
  const response = await authFetch(`/api/admin/media${mediaQuery(params)}`, {
    cache: "no-store",
  });
  return readJson(response, "Couldn't load the media catalog.");
}

export async function refreshAdminMedia(id: number): Promise<AdminMedia> {
  const response = await authFetch(`/api/admin/media/${id}/refresh`, { method: "POST" });
  return readJson(response, "Couldn't refresh this media record.");
}

export async function syncAdminMedia(payload: AdminMediaSync): Promise<AdminMedia> {
  const response = await authFetch("/api/admin/media/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readJson(response, "Couldn't sync this media record.");
}

export async function deleteAdminMedia(id: number, permanent: boolean): Promise<string> {
  const response = await authFetch(`/api/admin/media/${id}?permanent=${permanent}`, {
    method: "DELETE",
  });
  return readMessage(
    response,
    permanent ? "Couldn't permanently delete this media." : "Couldn't soft-delete this media.",
  );
}

export async function restoreAdminMedia(id: number): Promise<AdminMedia> {
  const response = await authFetch(`/api/admin/media/${id}/restore`, { method: "PUT" });
  return readJson(response, "Couldn't restore this media record.");
}
