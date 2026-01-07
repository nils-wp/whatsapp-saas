'use client'

import { useEffect, useState } from 'react'
import { Loader2, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
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

  async function fetchQRCode() {
    setStatus('loading')
    setError(null)

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
      } else if (data.connected) {
        setStatus('connected')
        onConnected?.()
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

    // Poll for status updates more frequently
    const interval = setInterval(async () => {
      try {
        console.log('[QR Scanner] Checking status for:', instanceName)
        const response = await fetch(`/api/evolution/status?instanceName=${instanceName}`)
        const data = await response.json()
        console.log('[QR Scanner] Status response:', data)

        if (data.status === 'connected') {
          console.log('[QR Scanner] Connected! Redirecting...')
          setStatus('connected')
          clearInterval(interval)
          // Small delay to show success state
          setTimeout(() => {
            onConnected?.()
          }, 1000)
        }
      } catch (err) {
        console.error('[QR Scanner] Error checking status:', err)
      }
    }, 2000) // Check every 2 seconds

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

        {status === 'connected' && (
          <div className="flex flex-col items-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <p className="text-lg font-semibold">Erfolgreich verbunden!</p>
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
