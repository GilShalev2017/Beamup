import { create } from 'zustand';
import type { Item } from '@beamup/shared';

interface LiveEvent {
  id: string;
  type: 'created' | 'updated' | 'deleted' | 'alert';
  message: string;
  timestamp: string;
  item?: Item;
}

interface AppState {
  // Live events feed (from Socket.IO)
  liveEvents: LiveEvent[];
  addLiveEvent: (event: Omit<LiveEvent, 'id'>) => void;
  clearEvents: () => void;

  // UI state
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;

  // Connection status
  socketConnected: boolean;
  setSocketConnected: (connected: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  liveEvents: [],
  addLiveEvent: (event) =>
    set((state) => ({
      liveEvents: [
        { ...event, id: `${Date.now()}-${Math.random()}` },
        ...state.liveEvents.slice(0, 49), // keep last 50
      ],
    })),
  clearEvents: () => set({ liveEvents: [] }),

  selectedItemId: null,
  setSelectedItemId: (id) => set({ selectedItemId: id }),

  socketConnected: false,
  setSocketConnected: (connected) => set({ socketConnected: connected }),
}));
