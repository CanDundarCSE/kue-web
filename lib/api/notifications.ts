import { authFetch, readApiError } from "@/lib/api/client";

export type NotificationDto = {
  id: number;
  userId: number;
  actorId: number;
  actorUsername: string;
  type: string;
  title: string;
  message: string;
  referenceId?: number | null;
  referenceType?: string | null;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
};

async function getJson<T>(path: string): Promise<T | null> {
  const response = await authFetch(path, { cache: "no-store" }).catch(() => null);
  if (!response || !response.ok) return null;
  return (await response.json().catch(() => null)) as T | null;
}

export function fetchNotifications(
  page = 1,
  pageSize = 20,
): Promise<{ items: NotificationDto[] } | null> {
  return getJson(`/api/notifications?page=${page}&pageSize=${pageSize}`);
}

export async function fetchUnreadCount(): Promise<number | null> {
  const data = await getJson<{ unreadCount: number }>("/api/notifications/unread-count");
  return typeof data?.unreadCount === "number" ? data.unreadCount : null;
}

export async function markNotificationRead(id: number): Promise<string | null> {
  const response = await authFetch(`/api/notifications/${id}/read`, {
    method: "PUT",
  }).catch(() => null);
  if (!response) return "Couldn't reach the server.";
  if (response.ok) return null;
  return readApiError(response, "Couldn't mark as read.");
}

export async function markAllNotificationsRead(): Promise<string | null> {
  const response = await authFetch("/api/notifications/read-all", {
    method: "PUT",
  }).catch(() => null);
  if (!response) return "Couldn't reach the server.";
  if (response.ok) return null;
  return readApiError(response, "Couldn't mark all as read.");
}

export async function deleteNotification(id: number): Promise<string | null> {
  const response = await authFetch(`/api/notifications/${id}`, {
    method: "DELETE",
  }).catch(() => null);
  if (!response) return "Couldn't reach the server.";
  if (response.ok) return null;
  return readApiError(response, "Couldn't delete the notification.");
}

export async function clearNotifications(): Promise<string | null> {
  const response = await authFetch("/api/notifications", {
    method: "DELETE",
  }).catch(() => null);
  if (!response) return "Couldn't reach the server.";
  if (response.ok) return null;
  return readApiError(response, "Couldn't clear notifications.");
}
