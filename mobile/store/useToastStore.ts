import { create } from 'zustand';

export type ToastType = 'error' | 'success' | 'info';

export type ToastItem = {
  id: string;
  title: string;
  message?: string;
  type?: ToastType;
  durationMs?: number;
};

type ToastState = {
  items: ToastItem[];
  show: (item: Omit<ToastItem, 'id'>) => void;
  remove: (id: string) => void;
};

const MAX_VISIBLE = 4;

function defaultDuration(type: ToastType | undefined) {
  switch (type) {
    case 'error':
      return 5200;
    case 'success':
      return 3200;
    case 'info':
    default:
      return 4000;
  }
}

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  show: (item) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const type = item.type ?? 'info';
    const durationMs = item.durationMs ?? defaultDuration(type);
    set((s) => ({
      items: [...s.items, { ...item, id, type, durationMs }].slice(-MAX_VISIBLE),
    }));
    setTimeout(() => {
      set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
    }, durationMs);
  },
  remove: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));
