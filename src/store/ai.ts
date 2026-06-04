import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AiState {
  geminiKey: string
  geminiModel: string
  setKey: (k: string) => void
  setModel: (m: string) => void
  clear: () => void
}

/** The user's own Google Gemini API key + chosen model, stored ONLY in this browser
 *  (localStorage). Never committed, never uploaded — used to call the AI directly. */
export const useAi = create<AiState>()(
  persist(
    (set) => ({
      geminiKey: '',
      geminiModel: '',
      setKey: (geminiKey) => set({ geminiKey }),
      setModel: (geminiModel) => set({ geminiModel }),
      clear: () => set({ geminiKey: '', geminiModel: '' }),
    }),
    { name: 'inburgering-ai' },
  ),
)
