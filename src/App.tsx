import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { MidiProvider } from "@/engine/midi/MidiContext"
import PracticePage from "@/pages/PracticePage"
import DashboardPage from "@/pages/DashboardPage"
import MidiPage from "@/pages/MidiPage"
import SettingsPage from "@/pages/SettingsPage"

export default function App() {
  return (
    <BrowserRouter>
      <MidiProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<PracticePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/midi" element={<MidiPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </MidiProvider>
    </BrowserRouter>
  )
}
