"use client";

import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchNotifications,
  fetchUnreadCount,
  clearNotifications,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationDto,
} from "@/lib/api/notifications";
import { useCurrentUser } from "@/lib/use-current-user";

function hubUrl(): string {
  const base = (process.env.NEXT_PUBLIC_KUE_API_URL ?? "http://localhost:5148").replace(/\/+$/, "");
  return `${base}/hubs/notifications`;
}

// One shared connection per session: the accessToken cookie is HttpOnly, so
// the browser sends it via withCredentials and JS never touches the token.
let connection: HubConnection | null = null;
let ownerId: number | null = null;
let startTask: Promise<HubConnection> | null = null;

const itemListeners = new Set<(item: NotificationDto) => void>();
const countListeners = new Set<(count: number) => void>();

function ensureConnection(userId: number): Promise<HubConnection> {
  if (connection && ownerId === userId && connection.state === "Connected") {
    return Promise.resolve(connection);
  }
  if (startTask && ownerId === userId) return startTask;

  startTask = (async () => {
    if (connection) {
      try {
        await connection.stop();
      } catch {
        // Previous connection already gone; rebuild below.
      }
      connection = null;
    }
    ownerId = userId;
    const next = new HubConnectionBuilder()
      .withUrl(hubUrl(), { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();
    next.on("ReceiveNotification", (item: NotificationDto) => {
      itemListeners.forEach((listener) => listener(item));
    });
    next.on("UpdateUnreadCount", (count: number) => {
      countListeners.forEach((listener) => listener(count));
    });
    next.onclose(() => {
      if (connection === next) {
        connection = null;
        startTask = null;
      }
    });
    connection = next;
    await next.start();
    return next;
  })();
  startTask.catch(() => {
    // Leave the failed connection for the next attempt to rebuild.
    startTask = null;
  });
  return startTask;
}

async function dropConnection(): Promise<void> {
  startTask = null;
  ownerId = null;
  if (connection) {
    const current = connection;
    connection = null;
    try {
      await current.stop();
    } catch {
      // Already closed.
    }
  }
}

export function useNotifications() {
  const { user, loading } = useCurrentUser();
  const [items, setItems] = useState<NotificationDto[] | null>(null);
  const [unread, setUnread] = useState(0);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (loading || !user) {
      // Deferred like other data effects in the codebase: setState must not
      // run synchronously in the effect body.
      const reset = setTimeout(() => {
        setItems(null);
        setUnread(0);
      }, 0);
      void dropConnection();
      return () => clearTimeout(reset);
    }

    let cancelled = false;
    let stopped = false;

    const handle = setTimeout(() => {
      void fetchNotifications(1, 20).then((data) => {
        if (!cancelled) setItems(Array.isArray(data?.items) ? data.items : []);
      });
      void fetchUnreadCount().then((count) => {
        if (!cancelled && count !== null) setUnread(count);
      });
    }, 0);

    const onItem = (item: NotificationDto) => {
      setItems((prev) => (prev ? [item, ...prev].slice(0, 50) : [item]));
    };
    const onCount = (count: number) => setUnread(count);
    itemListeners.add(onItem);
    countListeners.add(onCount);

    const connect = () => {
      void ensureConnection(user.id).catch(() => {
        // Auth cookie may be mid-refresh; retry while signed in.
        if (!stopped && !cancelled) {
          retryRef.current = setTimeout(connect, 15000);
        }
      });
    };
    const connectTimer = setTimeout(connect, 0);

    return () => {
      stopped = true;
      cancelled = true;
      clearTimeout(handle);
      clearTimeout(connectTimer);
      if (retryRef.current) clearTimeout(retryRef.current);
      itemListeners.delete(onItem);
      countListeners.delete(onCount);
    };
  }, [loading, user]);

  const markRead = useCallback(async (id: number) => {
    setItems((prev) => (prev ?? []).map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    const message = await markNotificationRead(id);
    if (message !== null) {
      const count = await fetchUnreadCount();
      if (count !== null) setUnread(count);
      return message;
    }
    setUnread((prev) => Math.max(0, prev - 1));
    return null;
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((prev) => (prev ?? []).map((item) => ({ ...item, isRead: true })));
    setUnread(0);
    const message = await markAllNotificationsRead();
    if (message !== null) {
      const count = await fetchUnreadCount();
      if (count !== null) setUnread(count);
    }
    return message;
  }, []);

  const remove = useCallback(async (id: number) => {
    let wasUnread = false;
    setItems((prev) => {
      wasUnread = (prev ?? []).some((item) => item.id === id && !item.isRead);
      return (prev ?? []).filter((item) => item.id !== id);
    });
    const message = await deleteNotification(id);
    if (message !== null) {
      const data = await fetchNotifications(1, 20);
      if (data && Array.isArray(data.items)) setItems(data.items);
      const count = await fetchUnreadCount();
      if (count !== null) setUnread(count);
      return message;
    }
    if (wasUnread) setUnread((prev) => Math.max(0, prev - 1));
    return null;
  }, []);

  const clearAll = useCallback(async () => {
    setItems([]);
    setUnread(0);
    const message = await clearNotifications();
    if (message !== null) {
      const data = await fetchNotifications(1, 20);
      if (data && Array.isArray(data.items)) setItems(data.items);
      const count = await fetchUnreadCount();
      if (count !== null) setUnread(count);
    }
    return message;
  }, []);

  return { items, unread, loading, markRead, markAllRead, remove, clearAll };
}
