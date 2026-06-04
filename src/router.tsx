import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './features/dashboard/Dashboard'
import { Curriculum } from './features/curriculum/Curriculum'
import { Flashcards } from './features/flashcards/Flashcards'
import { Quiz } from './features/quiz/Quiz'
import { Checklist } from './features/admin/Checklist'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cursus" element={<Curriculum />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/checklist" element={<Checklist />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
