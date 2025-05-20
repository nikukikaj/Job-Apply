import { create } from 'zustand';

const useAuthStore = create((set) => ({
  role: null,
  setRole: (role) => set({ role }),
  clearRole: () => set({ role: null }),
}));

export default useAuthStore;

