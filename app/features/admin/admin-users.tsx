"use client";

import {
  Eye,
  Loader2,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Skeleton } from "@/app/components/ui/skeleton";
import UserAvatar from "@/app/components/user-avatar";
import {
  AdminPage,
  ErrorBanner,
  Pagination,
  Panel,
  RoleBadge,
  formatDate,
  formatDateTime,
  formatRelative,
  inputClass,
  labelClass,
  selectClass,
  tableClass,
  tableWrapClass,
  tdClass,
  thClass,
} from "@/app/features/admin/admin-ui";
import {
  banAdminUser,
  deleteAdminUser,
  fetchAdminUser,
  fetchAdminUsers,
  updateAdminUserRole,
  type AdminUser,
  type AdminUserDetail,
  type PagedResponse,
} from "@/lib/api/admin";
import { useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const KNOWN_ROLES = ["User", "Admin"];

function DetailFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className={labelClass}>{label}</dt>
      <dd className="mt-0.5 break-words text-[12.5px] text-foreground">{value}</dd>
    </div>
  );
}

function StatusBadge({ user }: { user: AdminUser }) {
  if (user.isBanned) {
    return (
      <span
        className="inline-flex rounded-md border border-red-500/30 bg-red-500/5 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-red-600 dark:text-red-400"
        title={user.banReason ?? "Banned"}
      >
        Banned
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-md border border-emerald-500/30 bg-emerald-500/5 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-emerald-600 dark:text-emerald-400">
      Active
    </span>
  );
}

function DialogError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-[12px] text-red-700 dark:text-red-300">
      {message}
    </p>
  );
}

export default function AdminUsersView() {
  const { user: me } = useCurrentUser();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [banned, setBanned] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<PagedResponse<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const [detailTarget, setDetailTarget] = useState<AdminUser | null>(null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);

  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [roleDraft, setRoleDraft] = useState<string[]>([]);
  const [roleBusy, setRoleBusy] = useState(false);

  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banBusy, setBanBusy] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    try {
      const next = await fetchAdminUsers({
        search: search || undefined,
        role: role || undefined,
        isBanned: banned === "" ? undefined : banned === "true",
        page,
        pageSize: PAGE_SIZE,
      });
      if (requestId !== requestRef.current) return;
      setData(next);
      setError(null);
    } catch (cause) {
      if (requestId !== requestRef.current) return;
      setError(cause instanceof Error ? cause.message : "Couldn't load users.");
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [banned, page, role, search]);

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(() => {
      if (!cancelled) void load();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [load]);

  const resetFilters = () => {
    setLoading(true);
    setSearchInput("");
    setSearch("");
    setRole("");
    setBanned("");
    setPage(1);
  };

  const changePage = (next: number) => {
    setLoading(true);
    setPage(next);
  };

  const openDetail = async (user: AdminUser) => {
    setDetailTarget(user);
    setDetail(null);
    setDetailBusy(true);
    setActionError(null);

    try {
      setDetail(await fetchAdminUser(user.id));
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Couldn't load this user.");
    } finally {
      setDetailBusy(false);
    }
  };

  const openRoleDialog = (user: AdminUser) => {
    setRoleTarget(user);
    setRoleDraft(user.roles.length > 0 ? [...user.roles] : ["User"]);
    setActionError(null);
  };

  const toggleRole = (value: string) => {
    if (!roleTarget) return;
    if (roleTarget.id === me?.id && value === "Admin" && roleDraft.includes("Admin")) {
      return;
    }

    setRoleDraft((current) =>
      current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value],
    );
  };

  const saveRole = async () => {
    if (!roleTarget || roleDraft.length === 0) return;

    setRoleBusy(true);
    setActionError(null);
    try {
      await updateAdminUserRole(roleTarget.id, roleDraft);
      setRoleTarget(null);
      await load();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Couldn't update roles.");
    } finally {
      setRoleBusy(false);
    }
  };

  const openBanDialog = (user: AdminUser) => {
    setBanTarget(user);
    setBanReason(user.banReason ?? "");
    setActionError(null);
  };

  const saveBan = async () => {
    if (!banTarget) return;

    const nextBanned = !banTarget.isBanned;
    setBanBusy(true);
    setActionError(null);
    try {
      await banAdminUser(
        banTarget.id,
        nextBanned,
        nextBanned ? banReason.trim() || null : null,
      );
      setBanTarget(null);
      await load();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Couldn't update this user.");
    } finally {
      setBanBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleteBusy(true);
    setActionError(null);
    try {
      await deleteAdminUser(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Couldn't delete this user.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const extraRoles = roleTarget?.roles.filter((entry) => !KNOWN_ROLES.includes(entry)) ?? [];
  const isSelf = (user: AdminUser) => user.id === me?.id;

  return (
    <AdminPage>
      <div>
        <h1 className="font-serif text-[clamp(26px,3.4vw,36px)] leading-tight tracking-[-0.01em] text-foreground">
          Users<span className="text-accent">.</span>
        </h1>
        <p className="mt-2 text-[13px] text-ink-2">
          Search accounts, inspect activity, adjust roles, and moderate access.
        </p>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />
      <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />

      <Panel className="mt-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setLoading(true);
            setPage(1);
            setSearch(searchInput.trim());
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="min-w-[220px] flex-1">
            <span className={labelClass}>Search</span>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-3" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Username, email or Kue ID"
                className={cn(inputClass, "pl-8")}
              />
            </div>
          </label>

          <label>
            <span className={labelClass}>Role</span>
            <select
              value={role}
              onChange={(event) => {
                setLoading(true);
                setRole(event.target.value);
                setPage(1);
              }}
              className={cn(selectClass, "mt-1 block")}
            >
              <option value="">Any role</option>
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </label>

          <label>
            <span className={labelClass}>Status</span>
            <select
              value={banned}
              onChange={(event) => {
                setLoading(true);
                setBanned(event.target.value);
                setPage(1);
              }}
              className={cn(selectClass, "mt-1 block")}
            >
              <option value="">Any status</option>
              <option value="false">Active</option>
              <option value="true">Banned</option>
            </select>
          </label>

          <Button type="submit" variant="secondary" size="sm" className="h-9">
            <Search className="size-3.5" />
            Search
          </Button>

          {(search || role || banned) && (
            <Button type="button" variant="ghost" size="sm" className="h-9" onClick={resetFilters}>
              Reset
            </Button>
          )}
        </form>

        <div className="mt-4">
          {loading && !data ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className={tableWrapClass}>
                <table className={tableClass}>
                  <thead>
                    <tr>
                      <th className={thClass}>User</th>
                      <th className={thClass}>Email</th>
                      <th className={thClass}>Roles</th>
                      <th className={thClass}>Status</th>
                      <th className={thClass}>Content</th>
                      <th className={thClass}>Joined</th>
                      <th className={thClass}>Sessions</th>
                      <th className={cn(thClass, "text-right")}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.items ?? []).map((user) => {
                      const self = isSelf(user);
                      return (
                        <tr key={user.id} className="transition-colors hover:bg-surface-3/30">
                          <td className={tdClass}>
                            <div className="flex items-center gap-2.5">
                              <UserAvatar
                                username={user.username}
                                avatarId={user.avatarId}
                                className="size-8 rounded-full bg-surface-3 text-[12px]"
                              />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-foreground">
                                  {user.username}
                                </p>
                                <p className="truncate font-mono text-[10px] text-ink-3">
                                  {user.kueId ?? `#${user.id}`}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className={tdClass}>
                            <span className="block max-w-[210px] truncate" title={user.email}>
                              {user.email}
                            </span>
                          </td>
                          <td className={tdClass}>
                            <div className="flex flex-wrap gap-1">
                              {user.roles.map((entry) => (
                                <RoleBadge key={entry} role={entry} />
                              ))}
                            </div>
                          </td>
                          <td className={tdClass}>
                            <StatusBadge user={user} />
                          </td>
                          <td className={tdClass}>
                            <p className="whitespace-nowrap text-[11px] text-ink-3">
                              L {user.libraryCount} · R {user.reviewsCount} · F {user.friendsCount}
                            </p>
                            <p className="whitespace-nowrap text-[10px] text-ink-3">
                              Last active {formatRelative(user.lastActivityAt)}
                            </p>
                          </td>
                          <td className={tdClass}>{formatDate(user.createdAt)}</td>
                          <td className={tdClass}>{user.activeSessions}</td>
                          <td className={cn(tdClass, "text-right")}>
                            <div className="flex justify-end gap-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                title="View details"
                                aria-label={`View ${user.username}`}
                                onClick={() => void openDetail(user)}
                              >
                                <Eye className="size-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                title="Edit roles"
                                aria-label={`Edit roles for ${user.username}`}
                                onClick={() => openRoleDialog(user)}
                              >
                                <Shield className="size-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                disabled={self}
                                title={self ? "You can't ban yourself" : user.isBanned ? "Unban user" : "Ban user"}
                                aria-label={`${user.isBanned ? "Unban" : "Ban"} ${user.username}`}
                                onClick={() => openBanDialog(user)}
                              >
                                {user.isBanned ? (
                                  <UserCheck className="size-3.5" />
                                ) : (
                                  <UserX className="size-3.5" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                disabled={self}
                                title={self ? "You can't delete yourself" : "Delete user"}
                                aria-label={`Delete ${user.username}`}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                onClick={() => {
                                  setDeleteTarget(user);
                                  setActionError(null);
                                }}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!loading && (data?.items.length ?? 0) === 0 && (
                      <tr>
                        <td className={cn(tdClass, "text-center text-ink-3")} colSpan={8}>
                          No users match these filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {data && (
                <Pagination
                  page={data.page}
                  totalPages={data.totalPages}
                  totalItems={data.totalItems}
                  onPage={changePage}
                  busy={loading}
                />
              )}
            </>
          )}
        </div>
      </Panel>

      {/* Detail dialog */}
      <Dialog
        open={detailTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailTarget(null);
            setDetail(null);
          }
        }}
      >
        <DialogContent className="max-h-[86vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>User details</DialogTitle>
            <DialogDescription>
              Full account record and recent activity. Read-only.
            </DialogDescription>
          </DialogHeader>

          {detailBusy ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : !detail ? (
            <p className="text-[13px] text-ink-3">
              {actionError ?? "Couldn't load this user."}
            </p>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <UserAvatar
                  username={detail.user.username}
                  avatarId={detail.user.avatarId}
                  className="size-12 rounded-full bg-surface-3 text-[16px]"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold text-foreground">
                    {detail.user.username}
                  </p>
                  <p className="truncate text-[12px] text-ink-2">{detail.user.email}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-ink-3">
                    {detail.user.kueId ?? `#${detail.user.id}`}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {detail.user.roles.map((entry) => (
                      <RoleBadge key={entry} role={entry} />
                    ))}
                    <StatusBadge user={detail.user} />
                  </div>
                </div>
              </div>

              {detail.user.bio && (
                <div>
                  <p className={labelClass}>Bio</p>
                  <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2">
                    {detail.user.bio}
                  </p>
                </div>
              )}

              {detail.user.isBanned && (
                <div className="rounded-lg border border-red-500/25 bg-red-500/5 px-3 py-2.5 text-[12px] text-red-700 dark:text-red-300">
                  <p className="font-medium">
                    Banned {formatDateTime(detail.user.bannedAt)}
                  </p>
                  <p className="mt-0.5">{detail.user.banReason ?? "No reason recorded."}</p>
                </div>
              )}

              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <DetailFact label="User ID" value={`#${detail.user.id}`} />
                <DetailFact label="Joined" value={formatDateTime(detail.user.createdAt)} />
                <DetailFact label="Last active" value={formatRelative(detail.user.lastActivityAt)} />
                <DetailFact label="Privacy" value={detail.user.isPrivate ? "Private" : "Public"} />
                <DetailFact
                  label="Terms"
                  value={
                    detail.user.isTermsAccepted
                      ? `${detail.user.termsVersion ?? "accepted"} · ${formatDate(detail.user.termsAcceptedAt)}`
                      : "Not accepted"
                  }
                />
                <DetailFact label="Active sessions" value={String(detail.user.activeSessions)} />
                <DetailFact label="Library" value={String(detail.user.libraryCount)} />
                <DetailFact label="Custom lists" value={String(detail.user.listsCount)} />
                <DetailFact label="Reviews" value={String(detail.user.reviewsCount)} />
                <DetailFact label="Friends" value={String(detail.user.friendsCount)} />
                <DetailFact label="Activities" value={String(detail.user.activitiesCount)} />
                <DetailFact label="Notifications" value={String(detail.user.notificationsCount)} />
                <DetailFact
                  label="Game balance"
                  value={detail.user.gameBalance.toLocaleString("en-US")}
                />
                <DetailFact
                  label="Total earned"
                  value={detail.user.gameTotalEarned.toLocaleString("en-US")}
                />
              </dl>

              <div>
                <p className={labelClass}>Recent activity</p>
                {detail.recentActivity.length === 0 ? (
                  <p className="mt-2 text-[12px] text-ink-3">No activity recorded.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
                    {detail.recentActivity.map((activity) => (
                      <li key={activity.id} className="px-3 py-2.5">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <p className="text-[12.5px] font-medium text-foreground">
                            {activity.activityType}
                            {activity.action ? ` · ${activity.action}` : ""}
                          </p>
                          <p className="text-[10px] text-ink-3">
                            {formatDateTime(activity.createdAt)}
                          </p>
                        </div>
                        <p className="mt-0.5 text-[11.5px] text-ink-2">
                          {activity.mediaTitle ?? activity.formattedText ?? activity.detailText ?? "—"}
                          {activity.progress !== null ? ` · ${activity.progress}` : ""}
                          {activity.rating !== null ? ` · ${activity.rating}/10` : ""}
                          {activity.status ? ` · ${activity.status}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDetailTarget(null);
                setDetail(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role dialog */}
      <Dialog
        open={roleTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRoleTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit roles</DialogTitle>
            <DialogDescription>
              {roleTarget ? `Roles for @${roleTarget.username}.` : "Choose account roles."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {KNOWN_ROLES.map((entry) => {
              const checked = roleDraft.includes(entry);
              const locked = roleTarget?.id === me?.id && entry === "Admin" && checked;

              return (
                <label
                  key={entry}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border border-line px-3 py-2.5 transition-colors hover:bg-surface-3/40",
                    locked && "cursor-not-allowed opacity-70",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={locked}
                    onChange={() => toggleRole(entry)}
                    className="mt-0.5 size-4 accent-accent"
                  />
                  <span>
                    <span className="block text-[13px] font-medium text-foreground">{entry}</span>
                    <span className="block text-[11px] text-ink-3">
                      {entry === "Admin"
                        ? "Full access to this admin panel and every admin endpoint."
                        : "Regular access to the Kue app."}
                    </span>
                  </span>
                </label>
              );
            })}

            {extraRoles.length > 0 && (
              <p className="text-[11px] text-ink-3">
                Additional roles are preserved: {extraRoles.join(", ")}.
              </p>
            )}

            {roleDraft.length === 0 && (
              <p className="text-[12px] text-red-600 dark:text-red-400">
                Select at least one role.
              </p>
            )}

            {roleTarget?.id === me?.id && (
              <p className="text-[11px] text-ink-3">
                You can&apos;t remove your own Admin role.
              </p>
            )}
          </div>

          <DialogError message={actionError} />

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setRoleTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={roleBusy || roleDraft.length === 0}
              onClick={() => void saveRole()}
            >
              {roleBusy && <Loader2 className="size-3.5 animate-spin" />}
              Save roles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban dialog */}
      <Dialog
        open={banTarget !== null}
        onOpenChange={(open) => {
          if (!open) setBanTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{banTarget?.isBanned ? "Unban user" : "Ban user"}</DialogTitle>
            <DialogDescription>
              {banTarget
                ? banTarget.isBanned
                  ? `@${banTarget.username} will be able to sign in again.`
                  : `@${banTarget.username} will be signed out and blocked from signing in.`
                : "Update account access."}
            </DialogDescription>
          </DialogHeader>

          {banTarget && !banTarget.isBanned && (
            <label className="block">
              <span className={labelClass}>Reason (optional)</span>
              <textarea
                value={banReason}
                onChange={(event) => setBanReason(event.target.value.slice(0, 500))}
                rows={3}
                placeholder="Shown only to administrators."
                className={cn(inputClass, "mt-1 h-auto min-h-20 resize-y py-2")}
              />
            </label>
          )}

          {banTarget && !banTarget.isBanned && (
            <p className="text-[11px] text-ink-3">
              Banning revokes refresh tokens immediately. An already-issued access token can remain
              valid until it expires.
            </p>
          )}

          <DialogError message={actionError} />

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setBanTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={banTarget?.isBanned ? "default" : "destructive"}
              size="sm"
              disabled={banBusy}
              onClick={() => void saveBan()}
            >
              {banBusy && <Loader2 className="size-3.5 animate-spin" />}
              {banTarget?.isBanned ? "Unban" : "Ban user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user permanently?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `This removes @${deleteTarget.username} and their library, lists, reviews, activity and sessions. This cannot be undone.`
                : "This cannot be undone."}
            </DialogDescription>
          </DialogHeader>

          <DialogError message={actionError} />

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteBusy}
              onClick={() => void confirmDelete()}
            >
              {deleteBusy && <Loader2 className="size-3.5 animate-spin" />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
