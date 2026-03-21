import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Github, Sparkles, X } from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

const PRACTICE_WELCOME_SEEN_KEY = "melodytype-practice-welcome-seen"

function hasSeenWelcomeBanner() {
  try {
    return localStorage.getItem(PRACTICE_WELCOME_SEEN_KEY) === "true"
  } catch {
    return false
  }
}

function markWelcomeBannerSeen() {
  try {
    localStorage.setItem(PRACTICE_WELCOME_SEEN_KEY, "true")
  } catch {
    // ignore storage failures
  }
}

export function PracticeWelcomeBanner() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(() => {
    const seen = hasSeenWelcomeBanner()
    if (!seen) {
      markWelcomeBannerSeen()
    }
    return !seen
  })

  const handleDismiss = () => {
    setVisible(false)
  }

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
          className="w-full overflow-hidden rounded-[28px] border border-border/60 bg-card/75 p-5 shadow-sm backdrop-blur-sm sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 gap-4">
              <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:flex">
                <Sparkles className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/75">
                  {t("practiceWelcome.eyebrow")}
                </p>
                <h1 className="mt-2 font-serif text-2xl tracking-tight text-foreground sm:text-3xl">
                  {t("practiceWelcome.title")}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {t("practiceWelcome.description")}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    t("practiceWelcome.highlights.adaptive"),
                    t("practiceWelcome.highlights.rhythm"),
                    t("practiceWelcome.highlights.privacy"),
                  ].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-medium text-foreground/85"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    render={
                      <Link to="/docs" className="gap-2" />
                    }
                    size="sm"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    {t("practiceWelcome.docsCta")}
                  </Button>
                  <Button
                    render={
                      <a
                        href="https://github.com/fl0w1nd/MelodyType"
                        target="_blank"
                        rel="noreferrer"
                        className="gap-2"
                      />
                    }
                    variant="outline"
                    size="sm"
                  >
                    <Github className="h-3.5 w-3.5" />
                    {t("practiceWelcome.githubCta")}
                  </Button>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDismiss}
              aria-label={t("practiceWelcome.dismiss")}
              className="shrink-0 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
