import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TranslationPref {
  show: boolean
  toggle: () => void
}

/** Whether English helper text (intro, explanations, translations) is shown in lessons.
 *  Default false — it's a Dutch course, so Dutch leads and English is one tap away. */
export const useTranslationPref = create<TranslationPref>()(
  persist((set, get) => ({ show: false, toggle: () => set({ show: !get().show }) }), {
    name: 'show-translation',
  }),
)
