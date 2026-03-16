import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, Gauge, Target, Clock } from "lucide-react"
import type { TypingSession } from "@/lib/db"

interface SessionHistoryProps {
  sessions: TypingSession[]
  title?: string
}

export function SessionHistory({
  sessions,
  title = "Recent Sessions",
}: SessionHistoryProps) {
  const recent = [...sessions]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20)

  return (
    <Card>
      <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            No sessions yet. Start practicing!
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-2">
              {recent.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-secondary/20"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="text-[10px] capitalize"
                      >
                        {session.mode}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(session.timestamp)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <Gauge className="h-3 w-3 text-primary" />
                      <span className="font-mono font-medium">
                        {Math.round(session.wpm)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-emerald-600" />
                      <span className="font-mono font-medium">
                        {session.accuracy.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-muted-foreground">
                        {session.duration}s
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
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
