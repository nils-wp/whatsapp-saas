'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

interface ActivityData {
  date: string
  sent: number
  received: number
}

interface ActivityChartProps {
  data: ActivityData[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  const maxValue = Math.max(...data.flatMap((d) => [d.sent, d.received]), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Aktivität der letzten 7 Tage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2 h-48">
          {data.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex gap-1 items-end h-36">
                <div
                  className="flex-1 bg-primary rounded-t"
                  style={{
                    height: `${(day.sent / maxValue) * 100}%`,
                    minHeight: day.sent > 0 ? '4px' : '0',
                  }}
                />
                <div
                  className="flex-1 bg-primary/50 rounded-t"
                  style={{
                    height: `${(day.received / maxValue) * 100}%`,
                    minHeight: day.received > 0 ? '4px' : '0',
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(day.date).toLocaleDateString('de-DE', {
                  weekday: 'short',
                })}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded" />
            <span className="text-sm text-muted-foreground">Gesendet</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary/50 rounded" />
            <span className="text-sm text-muted-foreground">Empfangen</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
