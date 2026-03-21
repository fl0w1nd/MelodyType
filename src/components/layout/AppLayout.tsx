import { NavLink, Outlet, useLocation } from "react-router-dom"
import { Keyboard, BarChart3, Music, Settings, BookOpen, Github, Globe } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import { BackgroundDecor } from "./BackgroundDecor"
import { MidiFloatingPlayer } from "@/components/MidiFloatingPlayer"
import { GuidedTour, TourReplayButton } from "@/components/GuidedTour"
import { RouteSeo } from "@/components/seo/RouteSeo"
import { useTranslation } from "react-i18next"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SUPPORTED_LANGUAGES } from "@/i18n"
import type { SupportedLanguage } from "@/i18n"

export function AppLayout() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const showFloatingPlayer = location.pathname !== "/midi"

  const handleLanguageChange = (lang: SupportedLanguage | "auto") => {
    if (lang === "auto") {
      localStorage.removeItem("melodytype-language")
      void i18n.changeLanguage(navigator.language)
    } else {
      void i18n.changeLanguage(lang)
    }
  }

  const currentLang = SUPPORTED_LANGUAGES.includes(i18n.language as SupportedLanguage)
    ? (i18n.language as SupportedLanguage)
    : "auto"

  const langOptions: Array<{ value: SupportedLanguage | "auto"; label: string; flag: string }> = [
    { value: "auto", label: "Auto", flag: "🌐" },
    { value: "en", label: "English", flag: "🇺🇸" },
    { value: "zh-Hans", label: "简体中文", flag: "🇨🇳" },
    { value: "zh-Hant", label: "繁體中文", flag: "🇨🇳" },
  ]

  const navItems = [
    { to: "/", icon: Keyboard, label: t("nav.practice") },
    { to: "/dashboard", icon: BarChart3, label: t("nav.dashboard") },
    { to: "/midi", icon: Music, label: t("nav.midi") },
    { to: "/docs", icon: BookOpen, label: t("nav.docs") },
    { to: "/settings", icon: Settings, label: t("nav.settings") },
  ]

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background relative">
        <RouteSeo />
        <BackgroundDecor />

        <header role="banner" className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <NavLink to="/" className="flex items-center gap-2.5 group" data-tour="logo">
              <img
                src="/favicon.png"
                alt="MelodyType"
                className="h-9 w-9 object-contain drop-shadow-[0_4px_12px_rgba(15,23,42,0.12)] transition-all duration-300 ease-out group-hover:scale-105 group-hover:drop-shadow-[0_6px_16px_rgba(15,23,42,0.2)]"
              />
              <span className="font-serif text-xl tracking-tight text-foreground">
                MelodyType
              </span>
            </NavLink>

            <nav aria-label="Main navigation" className="flex items-center gap-1" data-tour="nav-bar">
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
                          className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20 shadow-sm shadow-primary/5"
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

              <div className="w-px h-6 bg-border/40 mx-1" />

              <TourReplayButton />

              <Tooltip>
                <TooltipTrigger
                  render={
                    <a
                      href="https://github.com/fl0w1nd/MelodyType"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/60"
                    />
                  }
                >
                  <Github className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent side="bottom">{t("nav.githubRepository")}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <DropdownMenu>
                  <TooltipTrigger
                    render={
                      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    }
                  >
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">{langOptions.find((opt) => opt.value === currentLang)?.label}</span>
                  </TooltipTrigger>
                  <DropdownMenuContent align="end" className="min-w-32">
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border mb-1">
                      {t("settingsPage.language.title")}
                    </div>
                    {langOptions.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => handleLanguageChange(opt.value)}
                        className="gap-2 cursor-pointer"
                      >
                        <span>{opt.flag}</span>
                        <span>{opt.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <TooltipContent side="bottom">{t("settingsPage.language.title")}</TooltipContent>
              </Tooltip>
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
        <GuidedTour />

        <footer role="contentinfo" className="border-t border-border/40 py-4">
          <div className="mx-auto max-w-6xl px-6 flex items-center justify-center gap-2">
            <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-border/40" />
            <p className="text-xs text-muted-foreground/50 font-medium tracking-wider">
              {t("nav.footer")}
            </p>
            <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-border/40" />
          </div>
        </footer>
      </div>
    </TooltipProvider>
  )
}
