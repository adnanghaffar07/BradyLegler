import { create } from 'zustand';

type SearchStore = {
  searchOpen: boolean;
  setSearchOpen: (searchOpen: boolean) => void;
};

// Shared so the desktop header, the mobile menu and the panel itself agree on one state.
export const useSearch = create<SearchStore>(set => ({
  searchOpen: false,
  setSearchOpen: searchOpen => set({ searchOpen })
}));
