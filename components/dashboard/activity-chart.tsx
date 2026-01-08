'use client'

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
    <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-gray-400" />
          Activity (Last 7 Days)
        </h3>
      </div>
      <div className="flex items-end justify-between gap-2 h-48">
        {data.map((day) => (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex gap-1 items-end h-36">
              <div
                className="flex-1 bg-emerald-500 rounded-t"
                style={{
                  height: `${(day.sent / maxValue) * 100}%`,
                  minHeight: day.sent > 0 ? '4px' : '0',
                }}
              />
              <div
                className="flex-1 bg-emerald-500/40 rounded-t"
                style={{
                  height: `${(day.received / maxValue) * 100}%`,
                  minHeight: day.received > 0 ? '4px' : '0',
                }}
              />
            </div>
            <span className="text-xs text-gray-500">
              {new Date(day.date).toLocaleDateString('en-US', {
                weekday: 'short',
              })}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded" />
          <span className="text-sm text-gray-400">Sent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500/40 rounded" />
          <span className="text-sm text-gray-400">Received</span>
        </div>
      </div>
    </div>
  )
}
