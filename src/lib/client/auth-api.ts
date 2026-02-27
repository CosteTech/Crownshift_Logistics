"use client";

import { initializeFirebase } from "@/firebase";

type ApiResponsePayload<T> = {
  success?: boolean;
  data?: T;
  error?: string;
  id?: string;
};

export type ClientApiResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  id?: string;
};

function parseApiError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }
  return fallback;
}

async function getBearerToken() {
  const { auth } = initializeFirebase();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user.getIdToken();
}

export async function requestApiWithAuth<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<ClientApiResult<T>> {
  try {
    const token = await getBearerToken();
    const headers = new Headers(init.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    if (init.body && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const response = await fetch(path, {
      ...init,
      headers,
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as ApiResponsePayload<T> | null;
    if (!response.ok) {
      return {
        success: false,
        error: parseApiError(payload, `Request failed (${response.status})`),
      };
    }

    if (!payload || payload.success === false) {
      return {
        success: false,
        error: parseApiError(payload, "Request failed"),
      };
    }

    return {
      success: true,
      data: (payload.data as T) ?? (payload as unknown as T),
      id: typeof payload.id === "string" ? payload.id : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}
