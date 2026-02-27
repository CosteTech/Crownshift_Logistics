import "server-only";

import { cookies, headers } from "next/headers";

type FetchJsonResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
};

function withLeadingSlash(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

export async function getInternalBaseUrl() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/+$/, "");
  }

  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

export async function apiFetchJson<T>(
  path: string,
  init: RequestInit = {}
): Promise<FetchJsonResult<T>> {
  const baseUrl = await getInternalBaseUrl();
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const headersInit = new Headers(init.headers || {});
  if (!headersInit.has("cookie") && cookieHeader) {
    headersInit.set("cookie", cookieHeader);
  }
  if (!headersInit.has("content-type") && init.body) {
    headersInit.set("content-type", "application/json");
  }

  const response = await fetch(`${baseUrl}${withLeadingSlash(path)}`, {
    ...init,
    headers: headersInit,
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as T | null;
  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

