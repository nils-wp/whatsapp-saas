'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { QRCodeScanner } from './qr-code-scanner'
import type { Tables } from '@/types/database'

type WhatsAppAccount = Tables<'whatsapp_accounts'>

interface ReconnectDialogProps {
  account: WhatsAppAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnected?: () => void
}

export function ReconnectDialog({ account, open, onOpenChange, onConnected }: ReconnectDialogProps) {
  if (!account) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-[#2a2a2a]">
        <DialogHeader>
          <DialogTitle className="text-white text-center">
            {account.display_name || account.instance_name} neu verbinden
          </DialogTitle>
        </DialogHeader>
        <QRCodeScanner
          instanceName={account.instance_name}
          onConnected={() => {
            onConnected?.()
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
