import { create } from 'zustand';

export const useLayoutStore = create((set) => ({
  isCollapsed: false, // Default state
  setIsCollapsed: (value) => set({ isCollapsed: value }),
  toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  
  // Mobile sidebar state
  sidebarOpen: false,
  setSidebarOpen: (value) => set({ sidebarOpen: value }),
}));