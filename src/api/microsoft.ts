// ---------------------------------------------------------------------------
// Microsoft 365 connection (domains/integrations/microsoft) — ported from
// services/microsoftService.js.
// ---------------------------------------------------------------------------
// The connection is stored server-side per user, so one made on the web app
// shows up here too. The Microsoft tools themselves run on the server during
// chat; the app only starts the link flow, reads the status and disconnects.
// When the feature is off server-side the endpoints return 404, surfaced as
// { enabled: false } so the control is simply hidden.
// ---------------------------------------------------------------------------

import type { MicrosoftStatus } from '../types/api';
import { ApiError, apiFetch } from './http';

export async function getMicrosoftStatus(): Promise<MicrosoftStatus> {
  try {
    const data = await apiFetch('/microsoft/status');
    return {
      enabled: true,
      connected: data.connected,
      status: data.status,
      msUpn: data.ms_upn ?? null,
      connectedAt: data.connected_at ?? null,
      lastError: data.last_error ?? null,
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return { enabled: false };
    throw err;
  }
}

// Returns the Microsoft sign-in URL. The app opens it in the phone's browser;
// after sign-in the backend redirects to the web app, and the status is
// re-read when the user comes back to this app.
export async function startMicrosoftConnect(): Promise<string> {
  const data = await apiFetch('/microsoft/connect/start', { method: 'POST' });
  return data.auth_url;
}

// Removes the stored connection (the encrypted tokens are wiped server-side).
export async function disconnectMicrosoft(): Promise<void> {
  await apiFetch('/microsoft/connection', { method: 'DELETE' });
}
