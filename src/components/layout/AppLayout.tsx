import { NavLink, Outlet } from "react-router-dom"
import { Keyboard, BarChart3, Music, Settings } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { motion } from "framer-motion"

const navItems = [
  { to: "/", icon: Keyboard, label: "Practice" },
  { to: "/dashboard", icon: BarChart3, label: "Dashboard" },
  { to: "/midi", icon: Music, label: "MIDI" },
  { to: "/settings", icon: Settings, label: "Settings" },
]

export function AppLayout() {
  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                <Music className="h-4.5 w-4.5" />
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent border-2 border-background" />
              </div>
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
          <div className="mx-auto max-w-6xl px-6 py-8">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-border/40 py-4">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <p className="text-xs text-muted-foreground/60">
              MelodyType &middot; Where typing meets music
            </p>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  )
}
