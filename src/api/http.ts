// ---------------------------------------------------------------------------
// Thin fetch wrapper for talking to the backend — ported from the web app's
// services/http.js.
// ---------------------------------------------------------------------------
// Handles the base URL, JSON encoding, the Bearer header, and turning non-2xx
// responses into ApiErrors. An expired access token is renewed via
// /auth/refresh and the request retried once. The refresh is single-flight:
// the backend rotates refresh tokens and each one works only once, so two
// parallel refreshes would log the user out.
// ---------------------------------------------------------------------------

import { API_BASE_URL } from '../config';
import { getSession, getToken, saveSession } from './session';

export class ApiError extends Error {
  status: number;
  code: string | null;
  data: unknown;

  constructor(message: string, status: number, code: string | null, data: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

// Fired only when the backend says the account is deactivated
// (error === "account_inactive") — shows the blocked banner.
let blockedHandler: (() => void) | null = null;
export function setBlockedHandler(fn: (() => void) | null) {
  blockedHandler = fn;
}

// Fired when the session cannot be recovered (refresh token missing, expired
// or rejected) — the auth store signs the user out with a notice.
let sessionExpiredHandler: (() => void) | null = null;
export function setSessionExpiredHandler(fn: (() => void) | null) {
  sessionExpiredHandler = fn;
}

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function parseBody(text: string | null | undefined): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Machine-readable error code from a FastAPI error body:
// { "detail": { "error": "...", "message": "..." } }
function errorCode(data: any): string | null {
  const detail = data?.detail;
  return (typeof detail === 'object' && detail?.error) || data?.error || null;
}

export function errorFrom(status: number, data: any): ApiError {
  const detail = data?.detail;
  let message: string =
    (typeof detail === 'string' ? detail : detail?.message || detail?.error) ||
    data?.message ||
    data?.error ||
    (typeof data === 'string' && data) ||
    `Request failed (${status})`;
  // FastAPI validation errors arrive as a list of {msg, loc}.
  if (Array.isArray(detail) && detail[0]?.msg) message = String(detail[0].msg);
  return new ApiError(message, status, errorCode(data), data);
}

// --- access-token refresh (single-flight) ------------------------------------

let refreshPromise: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const session = getSession();
      if (!session?.refreshToken) return false;
      try {
        const res = await fetch(apiUrl('/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: session.refreshToken }),
        });
        const data: any = parseBody(await res.text());
        if (!res.ok) {
          if (errorCode(data) === 'account_inactive') blockedHandler?.();
          return false;
        }
        await saveSession({ ...session, token: data.token, refreshToken: data.refresh_token });
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export function shouldAttemptRefresh(status: number, data: unknown): boolean {
  return status === 401 && errorCode(data) !== 'account_inactive' && !!getToken();
}

// A response that stayed failed after any retry: a deactivated account shows
// the blocked banner; any other 401 means the session is beyond recovery.
export function handleAuthFailure(status: number, data: unknown) {
  if (!getToken()) return;
  if (errorCode(data) === 'account_inactive') {
    blockedHandler?.();
  } else if (status === 401) {
    sessionExpiredHandler?.();
  }
}

type ApiFetchOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
};

export async function apiFetch<T = any>(
  path: string,
  { method = 'GET', body, auth = true, headers = {} }: ApiFetchOptions = {},
): Promise<T> {
  const isFormData = body instanceof FormData;

  // Headers are rebuilt per attempt so a retry picks up the renewed token.
  const doRequest = async () => {
    const res = await fetch(apiUrl(path), {
      method,
      headers: {
        Accept: 'application/json',
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(auth ? authHeader() : {}),
        ...headers,
      },
      body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, ok: res.ok, data: parseBody(await res.text()) };
  };

  let res = await doRequest();

  if (!res.ok && auth && shouldAttemptRefresh(res.status, res.data)) {
    if (await refreshSession()) res = await doRequest();
  }

  if (!res.ok) {
    if (auth) handleAuthFailure(res.status, res.data);
    throw errorFrom(res.status, res.data);
  }

  return res.data as T;
}
