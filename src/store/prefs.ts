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

export type TextSize = 'normal' | 'large' | 'xl'

interface TextSizePref {
  size: TextSize
  setSize: (size: TextSize) => void
}

/** Global UI text size (scales the rem-based layout). Persisted. */
export const useTextSize = create<TextSizePref>()(
  persist((set) => ({ size: 'normal', setSize: (size) => set({ size }) }), {
    name: 'text-size',
  }),
)
