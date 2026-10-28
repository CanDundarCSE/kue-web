import { authFetch, readApiError } from "@/lib/api/client";

export type AddonCredential = {
  id: number;
  label: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

export type AddonCredentialList = {
  configured: boolean;
  credentials: AddonCredential[];
};

export type AddonCredentialCreated = {
  token: string;
  manifestUrl: string;
  id: number;
  label: string | null;
  createdAt: string;
};

export async function getAddonCredentials(): Promise<AddonCredentialList | null> {
  const response = await authFetch("/api/addon/credentials", { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json().catch(() => null)) as AddonCredentialList | null;
}

export async function createAddonCredential(label?: string): Promise<AddonCredentialCreated> {
  const response = await authFetch("/api/addon/credentials", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label: label ?? null }),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Could not create the addon URL."));
  }

  const data = (await response.json().catch(() => null)) as AddonCredentialCreated | null;
  if (!data?.manifestUrl) {
    throw new Error("The server returned an invalid addon URL.");
  }
  return data;
}

/**
 * Revokes a single device's URL when an id is given, otherwise every active
 * URL for the account.
 */
export async function revokeAddonCredential(id?: number): Promise<void> {
  const path = id === undefined ? "/api/addon/credentials" : `/api/addon/credentials/${id}`;
  const response = await authFetch(path, {
    method: "DELETE",
    cache: "no-store",
  });

  // 404 means there was nothing active; treat it as success.
  if (!response.ok && response.status !== 404) {
    throw new Error(await readApiError(response, "Could not revoke the addon URL."));
  }
}
