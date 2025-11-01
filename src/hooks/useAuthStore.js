import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  initAuth: () => {
    return onAuthStateChanged(auth, (user) => {
      set({ user, loading: false });
    });
  },
}));