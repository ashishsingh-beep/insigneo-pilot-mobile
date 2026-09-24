// ---------------------------------------------------------------------------
// Session persistence — tokens + user live in the iOS Keychain / Android
// Keystore via react-native-keychain, never in AsyncStorage.
// ---------------------------------------------------------------------------
// Keychain reads are async, but every request needs the token synchronously
// to build its headers, so the session is loaded once at app start and kept
// in memory. Writes update memory first, then the keychain.
// ---------------------------------------------------------------------------

import * as Keychain from 'react-native-keychain';
import type { Session } from '../types/api';

const SERVICE = 'com.insigneo.ai.session';

let current: Session | null = null;

export async function loadSession(): Promise<Session | null> {
  try {
    const stored = await Keychain.getGenericPassword({ service: SERVICE });
    current = stored ? (JSON.parse(stored.password) as Session) : null;
  } catch {
    // A corrupt or unreadable entry is treated as signed out, not a crash.
    current = null;
  }
  return current;
}

export function getSession(): Session | null {
  return current;
}

export function getToken(): string | null {
  return current?.token ?? null;
}

export async function saveSession(session: Session): Promise<void> {
  current = session;
  await Keychain.setGenericPassword('session', JSON.stringify(session), {
    service: SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function clearSession(): Promise<void> {
  current = null;
  try {
    await Keychain.resetGenericPassword({ service: SERVICE });
  } catch {
    // Nothing stored — already cleared.
  }
}
