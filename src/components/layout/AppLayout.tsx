import { NavLink, Outlet, useLocation } from "react-router-dom"
import { Keyboard, BarChart3, Music, Settings } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import { BackgroundDecor } from "./BackgroundDecor"
import { MidiFloatingPlayer } from "@/components/MidiFloatingPlayer"

const navItems = [
  { to: "/", icon: Keyboard, label: "Practice" },
  { to: "/dashboard", icon: BarChart3, label: "Dashboard" },
  { to: "/midi", icon: Music, label: "MIDI" },
  { to: "/settings", icon: Settings, label: "Settings" },
]

export function AppLayout() {
  const location = useLocation()
  const showFloatingPlayer = location.pathname !== "/midi"

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background relative">
        <BackgroundDecor />

        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <img
                src="/favicon.png"
                alt="MelodyType"
                className="h-9 w-9 object-contain drop-shadow-[0_6px_14px_rgba(15,23,42,0.18)] transition-transform duration-200 group-hover:scale-105"
              />
              <span className="font-serif text-xl tracking-tight text-foreground">
                MelodyType
              </span>
            </NavLink>

            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute inset-0 rounded-lg bg-primary/8 border border-primary/15"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              className="mx-auto max-w-6xl px-6 py-8"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {showFloatingPlayer && <MidiFloatingPlayer />}

        <footer className="border-t border-border/40 py-4">
          <div className="mx-auto max-w-6xl px-6 flex items-center justify-center gap-2">
            <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-border/40" />
            <p className="text-xs text-muted-foreground/60 font-medium tracking-wide">
              MelodyType &middot; Where typing meets music
            </p>
            <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-border/40" />
          </div>
        </footer>
      </div>
    </TooltipProvider>
  )
}
