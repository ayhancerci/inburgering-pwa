import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProfileStore {
  activeId: string
  setActive: (id: string) => void
}

/** Which learner (him/her) is currently using the app, persisted to localStorage. */
export const useActiveProfile = create<ProfileStore>()(
  persist(
    (set) => ({
      activeId: 'him',
      setActive: (id) => set({ activeId: id }),
    }),
    { name: 'active-profile' },
  ),
)
