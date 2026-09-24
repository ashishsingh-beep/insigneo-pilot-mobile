// ---------------------------------------------------------------------------
// Composer preferences that survive restarts: the chosen model and the
// web-search toggle. Stored in AsyncStorage — they are not secrets.
// ---------------------------------------------------------------------------

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const KEY = 'insigneo.settings';

type SettingsState = {
  selectedModel: string | null;
  enableWebSearch: boolean;
  load: () => Promise<void>;
  setSelectedModel: (id: string) => void;
  setEnableWebSearch: (on: boolean) => void;
  reset: () => Promise<void>;
};

function persist(state: Pick<SettingsState, 'selectedModel' | 'enableWebSearch'>) {
  AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  selectedModel: null,
  enableWebSearch: true, // same default as the web app

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        set({
          selectedModel: typeof saved.selectedModel === 'string' ? saved.selectedModel : null,
          enableWebSearch: saved.enableWebSearch !== false,
        });
      }
    } catch {
      // Unreadable settings fall back to defaults.
    }
  },

  setSelectedModel: (id) => {
    set({ selectedModel: id });
    persist({ selectedModel: id, enableWebSearch: get().enableWebSearch });
  },

  setEnableWebSearch: (on) => {
    set({ enableWebSearch: on });
    persist({ selectedModel: get().selectedModel, enableWebSearch: on });
  },

  // Called on logout so the next user starts from the defaults.
  reset: async () => {
    set({ selectedModel: null, enableWebSearch: true });
    await AsyncStorage.removeItem(KEY).catch(() => {});
  },
}));
