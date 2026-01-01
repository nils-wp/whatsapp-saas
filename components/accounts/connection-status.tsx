'use client'

import { CheckCircle, XCircle, Clock, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'

type Status = 'connected' | 'disconnected' | 'qr_pending'

interface ConnectionStatusProps {
  status: Status
  showLabel?: boolean
  className?: string
}

const statusConfig = {
  connected: {
    icon: CheckCircle,
    label: 'Verbunden',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  disconnected: {
    icon: XCircle,
    label: 'Getrennt',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  qr_pending: {
    icon: Clock,
    label: 'Warte auf QR-Scan',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
}

export function ConnectionStatus({
  status,
  showLabel = true,
  className,
}: ConnectionStatusProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1',
        config.bgColor,
        className
      )}
    >
      <Icon className={cn('h-4 w-4', config.color)} />
      {showLabel && (
        <span className={cn('text-sm font-medium', config.color)}>
          {config.label}
        </span>
      )}
    </div>
  )
}

export function ConnectionStatusDot({ status }: { status: Status }) {
  const colors = {
    connected: 'bg-green-500',
    disconnected: 'bg-red-500',
    qr_pending: 'bg-yellow-500',
  }

  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        colors[status]
      )}
    />
  )
}
