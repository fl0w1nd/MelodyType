import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { MidiProvider } from "@/engine/midi/MidiContext"

const PracticePage = lazy(() => import("@/pages/PracticePage"))
const DashboardPage = lazy(() => import("@/pages/DashboardPage"))
const MidiPage = lazy(() => import("@/pages/MidiPage"))
const DocsPage = lazy(() => import("@/pages/DocsPage"))
const SettingsPage = lazy(() => import("@/pages/SettingsPage"))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <MidiProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<PracticePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/midi" element={<MidiPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </Suspense>
      </MidiProvider>
    </BrowserRouter>
  )
}
