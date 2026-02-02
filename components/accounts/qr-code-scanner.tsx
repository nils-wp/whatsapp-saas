'use client'

import { useEffect, useState, useRef } from 'react'
import { Loader2, RefreshCw, CheckCircle, XCircle, Smartphone } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

type ScanStatus = 'loading' | 'ready' | 'scanning' | 'connected' | 'error'

interface QRCodeScannerProps {
  instanceName: string
  onConnected?: () => void
}

export function QRCodeScanner({ instanceName, onConnected }: QRCodeScannerProps) {
  const [status, setStatus] = useState<ScanStatus>('loading')
  const [qrCode, setQRCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const hasShownQR = useRef(false) // Track if we've shown the QR code to the user
  const statusRef = useRef<ScanStatus>('loading') // Track current status for interval callback

  async function fetchQRCode() {
    setStatus('loading')
    statusRef.current = 'loading'
    setError(null)
    hasShownQR.current = false

    try {
      const response = await fetch('/api/evolution/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName }),
      })

      const data = await response.json()
      console.log('QR Response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch QR code')
      }

      if (data.qrCode) {
        setQRCode(data.qrCode)
        setStatus('ready')
        statusRef.current = 'ready'
        hasShownQR.current = true // Mark that we've shown the QR code
      } else if (data.connected) {
        setStatus('connected')
        statusRef.current = 'connected'
        setTimeout(() => onConnected?.(), 1500)
      } else {
        throw new Error('No QR code in response')
      }
    } catch (err) {
      console.error('QR Error:', err)
      setError(err instanceof Error ? err.message : 'Fehler beim Laden des QR-Codes')
      setStatus('error')
    }
  }

  useEffect(() => {
    fetchQRCode()

    // Poll for status updates
    const interval = setInterval(async () => {
      try {
        console.log('[QR Scanner] Checking status for:', instanceName)
        const response = await fetch(`/api/evolution/status?instanceName=${instanceName}`)
        const data = await response.json()
        console.log('[QR Scanner] Status response:', data)

        // Only switch to 'scanning' if:
        // 1. We've shown the QR code to the user (hasShownQR is true)
        // 2. The current UI status is 'ready' (QR is displayed)
        // 3. The Evolution status became 'connecting' (QR was scanned)
        // Don't switch if 'connecting' is the initial state before showing QR
        if (data.status === 'connecting' && hasShownQR.current && statusRef.current === 'ready') {
          console.log('[QR Scanner] QR code scanned, connecting...')
          setStatus('scanning')
          statusRef.current = 'scanning'
        }

        // Detect when fully connected
        if (data.status === 'connected') {
          console.log('[QR Scanner] Connected!')
          setStatus('connected')
          statusRef.current = 'connected'
          clearInterval(interval)
          // Show success state for 1.5 seconds before redirecting
          setTimeout(() => {
            onConnected?.()
          }, 1500)
        }
      } catch (err) {
        console.error('[QR Scanner] Error checking status:', err)
      }
    }, 1500) // Check every 1.5 seconds

    return () => clearInterval(interval)
  }, [instanceName])

  // Subscribe to realtime updates
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`account:${instanceName}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'whatsapp_accounts',
        filter: `instance_name=eq.${instanceName}`,
      }, (payload) => {
        if (payload.new.status === 'connected') {
          setStatus('connected')
          onConnected?.()
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [instanceName])

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>WhatsApp verbinden</CardTitle>
        <CardDescription>
          Scanne den QR-Code mit deinem WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        {status === 'loading' && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">QR-Code wird geladen...</p>
          </div>
        )}

        {status === 'ready' && qrCode && (
          <>
            <div className="bg-white p-4 rounded-lg">
              <img
                src={qrCode}
                alt="WhatsApp QR Code"
                className="w-64 h-64"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Öffne WhatsApp auf deinem Handy, gehe zu Einstellungen &gt;
              Verknüpfte Geräte und scanne diesen Code.
            </p>
            <Button variant="outline" onClick={fetchQRCode}>
              <RefreshCw className="mr-2 h-4 w-4" />
              QR-Code erneuern
            </Button>
          </>
        )}

        {status === 'scanning' && (
          <div className="flex flex-col items-center py-8">
            <div className="relative mb-4">
              <Smartphone className="h-16 w-16 text-primary" />
              <div className="absolute -top-1 -right-1">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </div>
            <p className="text-lg font-semibold">Verbindung wird hergestellt...</p>
            <p className="text-muted-foreground text-center">
              Bitte warte, während wir dein WhatsApp verbinden.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:0.2s]" />
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        {status === 'connected' && (
          <div className="flex flex-col items-center py-8">
            <div className="relative mb-4">
              <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
            </div>
            <p className="text-lg font-semibold text-green-500">Erfolgreich verbunden!</p>
            <p className="text-muted-foreground">
              Dein WhatsApp-Konto wurde verknüpft.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-8">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <p className="text-lg font-semibold text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchQRCode} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Erneut versuchen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
