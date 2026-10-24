import { authFetch, readApiError } from "@/lib/api/client";

export type AddonCredentialStatus = {
  configured: boolean;
  createdAt?: string | null;
  lastUsedAt?: string | null;
};

export type AddonCredentialCreated = {
  token: string;
  manifestUrl: string;
  createdAt: string;
};

export async function getAddonCredential(): Promise<AddonCredentialStatus | null> {
  const response = await authFetch("/api/addon/credentials", { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json().catch(() => null)) as AddonCredentialStatus | null;
}

export async function createAddonCredential(): Promise<AddonCredentialCreated> {
  const response = await authFetch("/api/addon/credentials", {
    method: "POST",
    cache: "no-store",
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

export async function revokeAddonCredential(): Promise<void> {
  const response = await authFetch("/api/addon/credentials", {
    method: "DELETE",
    cache: "no-store",
  });

  // 404 means there was nothing active; treat it as success.
  if (!response.ok && response.status !== 404) {
    throw new Error(await readApiError(response, "Could not revoke the addon URL."));
  }
}
