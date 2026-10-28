"use client";

import {
  Activity,
  Ban,
  Clock,
  Database,
  RefreshCw,
  Server,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Skeleton } from "@/app/components/ui/skeleton";
import UserAvatar from "@/app/components/user-avatar";
import {
  AdminPage,
  ErrorBanner,
  Panel,
  RoleBadge,
  StatCard,
  StatusPill,
  formatBytes,
  formatDate,
  formatDateTime,
  formatRelative,
  formatUptime,
  labelClass,
  tableClass,
  tableWrapClass,
  tdClass,
  thClass,
} from "@/app/features/admin/admin-ui";
import { fetchAdminDashboard, type AdminDashboard } from "@/lib/api/admin";
import { cn } from "@/lib/utils";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className={labelClass}>{label}</dt>
      <dd className="mt-0.5 truncate text-[12.5px] text-foreground" title={value}>
        {value}
      </dd>
    </div>
  );
}

function IntegrationRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3 text-[13px]">
      <span className="text-ink-2">{label}</span>
      <StatusPill ok={ok} label={ok ? "Configured" : "Missing"} />
    </li>
  );
}

export default function AdminDashboardView() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    try {
      const next = await fetchAdminDashboard();
      if (requestId !== requestRef.current) return;
      setData(next);
      setError(null);
    } catch (cause) {
      if (requestId !== requestRef.current) return;
      setError(cause instanceof Error ? cause.message : "Couldn't load the admin dashboard.");
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const initial = window.setTimeout(() => {
      if (!cancelled) void load();
    }, 0);
    // Admin metrics are not real-time: poll once a minute and skip ticks while
    // the tab is backgrounded so an idle admin tab does not burn invocations.
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [load]);

  if (loading && !data) {
    return (
      <AdminPage>
        <Skeleton className="h-9 w-52" />
        <Skeleton className="mt-3 h-4 w-72" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
        <Skeleton className="mt-6 h-72 w-full" />
      </AdminPage>
    );
  }

  if (!data) {
    return (
      <AdminPage>
        <ErrorBanner
          message={error ?? "Couldn't load the admin dashboard."}
          onDismiss={() => setError(null)}
        />
      </AdminPage>
    );
  }

  const { stats, server, recentUsers } = data;
  const healthy = server.status === "healthy" && server.databaseReachable;

  return (
    <AdminPage>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-[clamp(28px,4vw,40px)] leading-tight tracking-[-0.01em] text-foreground">
            Admin<span className="text-accent">.</span>
          </h1>
          <p className="mt-2 text-[13px] text-ink-2">
            Users, catalog and server health. Checked {formatDateTime(server.checkedAt)}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            void load();
          }}
          disabled={refreshing}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface-2 px-3 text-[12px] font-medium text-foreground transition-colors hover:bg-surface-3 disabled:opacity-50"
        >
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Users"
          value={stats.totalUsers.toLocaleString("en-US")}
          hint={`${stats.newUsersLast7Days.toLocaleString("en-US")} new in the last 7 days`}
          icon={<Users className="size-4" strokeWidth={1.75} />}
        />
        <StatCard
          label="Admins"
          value={stats.adminUsers.toLocaleString("en-US")}
          hint={`${stats.bannedUsers.toLocaleString("en-US")} banned`}
          icon={<Shield className="size-4" strokeWidth={1.75} />}
          tone={stats.bannedUsers > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Active sessions"
          value={stats.activeSessions.toLocaleString("en-US")}
          hint="Unrevoked refresh tokens"
          icon={<Clock className="size-4" strokeWidth={1.75} />}
        />
        <StatCard
          label="Library entries"
          value={stats.libraryEntries.toLocaleString("en-US")}
          hint={`${stats.reviews.toLocaleString("en-US")} reviews · ${stats.customLists.toLocaleString("en-US")} lists`}
          icon={<Activity className="size-4" strokeWidth={1.75} />}
        />
        <StatCard
          label="Catalog"
          value={stats.totalMedia.toLocaleString("en-US")}
          hint={`${stats.deletedMedia.toLocaleString("en-US")} soft-deleted`}
          icon={<Database className="size-4" strokeWidth={1.75} />}
        />
        <StatCard
          label="Activities"
          value={stats.userActivities.toLocaleString("en-US")}
          hint={`${stats.importJobs.toLocaleString("en-US")} import jobs`}
          icon={<Server className="size-4" strokeWidth={1.75} />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <Panel
          title="Server health"
          description="Process, deployment and database status reported by this API instance."
          action={<StatusPill ok={healthy} label={healthy ? "Healthy" : "Degraded"} />}
        >
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Fact label="Environment" value={server.environment} />
            <Fact label="Runtime" value={server.runtime} />
            <Fact label="Uptime" value={formatUptime(server.uptimeSeconds)} />
            <Fact label="Started" value={formatDateTime(server.startedAt)} />
            <Fact label="Working set" value={formatBytes(server.workingSetBytes)} />
            <Fact label="GC heap" value={formatBytes(server.gcHeapBytes)} />
            <Fact label="Threads" value={String(server.threadCount)} />
            <Fact label="Machine" value={server.machineName} />
            <Fact label="OS" value={server.osDescription ?? "—"} />
            <Fact label="Architecture" value={server.processArchitecture ?? "—"} />
            <Fact
              label="Database"
              value={
                server.databaseReachable
                  ? `${server.databaseName ?? "Postgres"} · ${server.databaseLatencyMs} ms`
                  : "Unreachable"
              }
            />
            <Fact label="Database size" value={formatBytes(server.databaseSizeBytes)} />
            <Fact
              label="Migrations"
              value={server.pendingMigrations > 0 ? `${server.pendingMigrations} pending` : "Up to date"}
            />
            <Fact label="Latest migration" value={server.latestMigration ?? "—"} />
          </dl>

          {server.render && (
            <div className="mt-4 border-t border-line pt-4">
              <p className={labelClass}>Render</p>
              <dl className="mt-2 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <Fact label="Service" value={server.render.serviceName ?? "—"} />
                <Fact label="Region" value={server.render.region ?? "—"} />
                <Fact label="Commit" value={server.render.commit ?? "—"} />
                <Fact label="Branch" value={server.render.branch ?? "—"} />
              </dl>
            </div>
          )}
        </Panel>

        <div className="grid content-start gap-4">
          <Panel
            title="Integrations"
            description="Configuration state only; secret values are never returned."
          >
            <ul className="space-y-2.5">
              <IntegrationRow label="TMDB" ok={server.integrations.tmdb} />
              <IntegrationRow label="IGDB" ok={server.integrations.igdb} />
              <IntegrationRow label="Brevo" ok={server.integrations.brevo} />
              <IntegrationRow label="AniList" ok={server.integrations.aniList} />
            </ul>
          </Panel>

          <Panel title="API">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Fact label="Version" value={server.version} />
              <Fact label="Processors" value={String(server.processorCount)} />
              <Fact label="Provider" value={server.databaseProvider ?? "—"} />
              <Fact label="Database" value={server.databaseName ?? "—"} />
            </dl>
          </Panel>
        </div>
      </div>

      <Panel
        className="mt-6"
        title="Recent users"
        description="The five newest accounts."
        action={
          <Link
            href="/admin/users"
            className="text-[12px] font-medium text-accent underline-offset-4 hover:underline"
          >
            View all
          </Link>
        }
      >
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>User</th>
                <th className={thClass}>Email</th>
                <th className={thClass}>Roles</th>
                <th className={thClass}>Joined</th>
                <th className={thClass}>Last active</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user) => (
                <tr key={user.id}>
                  <td className={tdClass}>
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        username={user.username}
                        avatarId={user.avatarId}
                        className="size-8 rounded-full bg-surface-3 text-[12px]"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{user.username}</p>
                        <p className="truncate font-mono text-[10px] text-ink-3">
                          {user.kueId ?? `#${user.id}`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className={tdClass}>
                    <span className="block max-w-[220px] truncate" title={user.email}>
                      {user.email}
                    </span>
                  </td>
                  <td className={tdClass}>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <RoleBadge key={role} role={role} />
                      ))}
                    </div>
                  </td>
                  <td className={tdClass}>{formatDate(user.createdAt)}</td>
                  <td className={tdClass}>{formatRelative(user.lastActivityAt)}</td>
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr>
                  <td className={cn(tdClass, "text-center text-ink-3")} colSpan={5}>
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-ink-3">
        <Ban className="size-3.5" strokeWidth={1.75} />
        Banning a user revokes their refresh tokens. An already-issued access token can remain valid
        for its remaining lifetime.
      </p>
    </AdminPage>
  );
}
