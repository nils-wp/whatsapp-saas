'use client'

import { Flame, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface WarmingProgressProps {
  currentDay: number
  currentLimit: number
  messagesSentToday: number
}

const warmingSchedule = [
  { day: 1, limit: 50, description: 'Start Phase' },
  { day: 7, limit: 100, description: 'Frühe Phase' },
  { day: 14, limit: 200, description: 'Aufbau Phase' },
  { day: 21, limit: 350, description: 'Fortgeschritten' },
  { day: 30, limit: 500, description: 'Voll einsatzbereit' },
]

export function WarmingProgress({
  currentDay,
  currentLimit,
  messagesSentToday,
}: WarmingProgressProps) {
  const progress = Math.min((currentDay / 30) * 100, 100)
  const currentPhase = warmingSchedule.find(
    (phase, index) => {
      const nextPhase = warmingSchedule[index + 1]
      return !nextPhase || currentDay < nextPhase.day
    }
  ) || warmingSchedule[warmingSchedule.length - 1]

  const nextPhase = warmingSchedule.find((phase) => phase.day > currentDay)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Warmup Status
        </CardTitle>
        <CardDescription>
          {currentPhase.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Tag {currentDay} von 30</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Aktuelles Limit</p>
            <p className="text-2xl font-bold">{currentLimit}</p>
            <p className="text-xs text-muted-foreground">Nachrichten/Tag</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Heute gesendet</p>
            <p className="text-2xl font-bold">{messagesSentToday}</p>
            <p className="text-xs text-muted-foreground">
              von {currentLimit} ({Math.round((messagesSentToday / currentLimit) * 100)}%)
            </p>
          </div>
        </div>

        {nextPhase && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <TrendingUp className="h-4 w-4" />
            <span>
              In {nextPhase.day - currentDay} Tagen: {nextPhase.limit} Nachrichten/Tag
            </span>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Warmup-Plan</p>
          <div className="flex gap-1">
            {warmingSchedule.map((phase, index) => (
              <div
                key={phase.day}
                className={`flex-1 h-2 rounded ${
                  currentDay >= phase.day ? 'bg-primary' : 'bg-muted'
                }`}
                title={`Tag ${phase.day}: ${phase.limit} Nachrichten`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Tag 1</span>
            <span>Tag 30</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
