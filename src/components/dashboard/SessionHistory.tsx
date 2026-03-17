import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, Gauge, Target, Clock } from "lucide-react"
import type { TypingSession } from "@/lib/db"

interface SessionHistoryProps {
  sessions: TypingSession[]
  title?: string
}

export function SessionHistory({ sessions, title = "Recent Sessions" }: SessionHistoryProps) {
  const recent = [...sessions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
      className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
            <History className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          Last <span className="font-mono font-semibold text-foreground">{recent.length}</span>
        </span>
      </div>

      <div className="px-4 pb-4">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <History className="h-8 w-8 mb-2 opacity-20" />
            <span className="text-sm">No sessions yet. Start practicing!</span>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-1.5 pr-2">
              {recent.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.15 + i * 0.03,
                    duration: 0.3,
                    ease: [0.25, 1, 0.5, 1],
                  }}
                  className="flex items-center gap-3 rounded-xl border border-border/30 bg-background/40 p-3 transition-all duration-200 hover:bg-secondary/30 hover:border-border/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="text-[9px] capitalize font-medium px-2 py-0.5 rounded-md"
                      >
                        {session.mode}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {formatTimeAgo(session.timestamp)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3.5 text-xs">
                    <div className="flex items-center gap-1">
                      <Gauge className="h-3 w-3 text-amber-500" />
                      <span className="font-mono font-semibold tabular-nums">
                        {Math.round(session.wpm)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-emerald-500" />
                      <span className="font-mono font-semibold tabular-nums">
                        {session.accuracy.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="font-mono tabular-nums">{session.duration}s</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </motion.div>
  )
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}
