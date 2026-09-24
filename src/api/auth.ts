// ---------------------------------------------------------------------------
// Auth endpoints (domains/auth/router.py) — ported from services/authService.js
// ---------------------------------------------------------------------------

import type { Session, User } from '../types/api';
import { apiFetch } from './http';
import { clearSession, getSession, saveSession } from './session';

function normalizeUser(u: any): User {
  return {
    id: u.id,
    name: u.name,
    firstName: u.first_name ?? null,
    email: u.email,
    role: u.role,
  };
}

// The app always stays signed in (like Claude's app), so remember is always
// true. The backend currently ignores the flag — refresh tokens last 30 days.
export async function login(email: string, password: string): Promise<Session> {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email: email.trim(), password, remember: true },
  });
  const session: Session = {
    token: data.token,
    refreshToken: data.refresh_token,
    user: normalizeUser(data.user),
  };
  await saveSession(session);
  return session;
}

export async function logout(): Promise<void> {
  try {
    // Send the refresh token so the server can revoke it.
    const refreshToken = getSession()?.refreshToken;
    await apiFetch('/auth/logout', {
      method: 'POST',
      body: refreshToken ? { refresh_token: refreshToken } : undefined,
    });
  } catch {
    // Even if the server call fails, clear the local session.
  }
  await clearSession();
}

// Current user from the server — refreshes name/role changed by an admin.
export async function getMe(): Promise<User> {
  const data = await apiFetch('/auth/me');
  return normalizeUser(data.user);
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await apiFetch('/auth/password', {
    method: 'PATCH',
    body: { current_password: currentPassword, new_password: newPassword },
  });
}

export async function forgotPassword(email: string) {
  await apiFetch('/auth/forgot-password', {
    method: 'POST',
    auth: false,
    body: { email: email.trim() },
  });
}

// `token` is the 6-character code from the reset email.
export async function resetPassword(token: string, newPassword: string) {
  await apiFetch('/auth/reset-password', {
    method: 'POST',
    auth: false,
    body: { token: token.trim(), new_password: newPassword },
  });
}
