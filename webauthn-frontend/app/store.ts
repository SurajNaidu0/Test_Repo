// frontend/app/store.ts
import { create } from 'zustand';

interface AuthState {
    isLoggedIn: boolean;
    userId: string | null;
    setLoggedIn: (value: boolean, userId?: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    isLoggedIn: false,
    userId: null,
    setLoggedIn: (value, userId) => set({ isLoggedIn: value, userId }),
}));