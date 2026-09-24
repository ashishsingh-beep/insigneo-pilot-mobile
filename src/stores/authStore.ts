// ---------------------------------------------------------------------------
// Who is signed in — replaces the web app's AuthContext.
// ---------------------------------------------------------------------------

import { create } from 'zustand';
import * as authApi from '../api/auth';
import { clearFileCache } from '../api/files';
import { setBlockedHandler, setSessionExpiredHandler } from '../api/http';
import { queryClient } from '../api/queryClient';
import { clearSession, getSession, loadSession, saveSession } from '../api/session';
import type { User } from '../types/api';
import { useChatStore } from './chatStore';
import { useSettingsStore } from './settingsStore';

type AuthStatus = 'booting' | 'signedOut' | 'signedIn';

type AuthState = {
  status: AuthStatus;
  user: User | null;
  // The backend reported the account as deactivated.
  blocked: boolean;
  // Shown on the login screen after an unrecoverable session.
  sessionMessage: string | null;

  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  dismissBlocked: () => void;
};

// Everything that belongs to the previous user goes when they leave.
async function wipeUserData() {
  useChatStore.getState().reset();
  queryClient.clear();
  await Promise.all([useSettingsStore.getState().reset(), clearFileCache().catch(() => {})]);
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'booting',
  user: null,
  blocked: false,
  sessionMessage: null,

  bootstrap: async () => {
    setBlockedHandler(() => set({ blocked: true }));
    setSessionExpiredHandler(() => {
      clearSession();
      wipeUserData();
      set({
        status: 'signedOut',
        user: null,
        blocked: false,
        sessionMessage: 'Your session has expired — please sign in again.',
      });
    });

    const [session] = await Promise.all([loadSession(), useSettingsStore.getState().load()]);
    if (!session) {
      set({ status: 'signedOut' });
      return;
    }
    set({ status: 'signedIn', user: session.user });

    // Pick up profile changes made by an admin since the last launch. Auth
    // failures are handled by the http handlers above; anything else (offline)
    // keeps the stored profile.
    authApi
      .getMe()
      .then(async (user) => {
        const current = getSession();
        if (current) await saveSession({ ...current, user });
        set({ user });
      })
      .catch(() => {});
  },

  login: async (email, password) => {
    const session = await authApi.login(email, password);
    set({ status: 'signedIn', user: session.user, blocked: false, sessionMessage: null });
  },

  logout: async () => {
    await authApi.logout();
    await wipeUserData();
    set({ status: 'signedOut', user: null, blocked: false, sessionMessage: null });
  },

  dismissBlocked: () => set({ blocked: false }),
}));
