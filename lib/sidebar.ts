import { cookies } from "next/headers";

export const SIDEBAR_COOKIE_NAME = "kue_sidebar_collapsed";

export async function getSidebarCollapsed(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(SIDEBAR_COOKIE_NAME)?.value === "true";
  } catch {
    return false;
  }
}

