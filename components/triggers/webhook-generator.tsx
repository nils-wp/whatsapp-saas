'use client'

import { useState } from 'react'
import { Copy, Check, Code2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface WebhookGeneratorProps {
  webhookId: string
  webhookSecret: string
}

export function WebhookGenerator({ webhookId, webhookSecret }: WebhookGeneratorProps) {
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/webhook/${webhookId}`

  async function copyUrl() {
    await navigator.clipboard.writeText(webhookUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  async function copySecret() {
    await navigator.clipboard.writeText(webhookSecret)
    setCopiedSecret(true)
    setTimeout(() => setCopiedSecret(false), 2000)
  }

  const curlExample = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Secret: ${webhookSecret}" \\
  -d '{
    "phone": "+49123456789",
    "name": "Max Mustermann",
    "email": "max@example.com"
  }'`

  const jsExample = `const response = await fetch("${webhookUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Webhook-Secret": "${webhookSecret}"
  },
  body: JSON.stringify({
    phone: "+49123456789",
    name: "Max Mustermann",
    email: "max@example.com"
  })
});

const data = await response.json();
console.log(data);`

  const pythonExample = `import requests

response = requests.post(
    "${webhookUrl}",
    headers={
        "Content-Type": "application/json",
        "X-Webhook-Secret": "${webhookSecret}"
    },
    json={
        "phone": "+49123456789",
        "name": "Max Mustermann",
        "email": "max@example.com"
    }
)

print(response.json())`

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Webhook URL</CardTitle>
          <CardDescription>
            Verwende diese URL, um den Trigger auszulösen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <code className="flex-1 bg-muted p-3 rounded-lg text-sm break-all">
              {webhookUrl}
            </code>
            <Button variant="outline" size="icon" onClick={copyUrl}>
              {copiedUrl ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Secret Key</p>
              <code className="block bg-muted p-3 rounded-lg text-sm font-mono">
                {webhookSecret.slice(0, 20)}...
              </code>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={copySecret}
              className="self-end"
            >
              {copiedSecret ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Code-Beispiele
          </CardTitle>
          <CardDescription>
            So rufst du den Webhook aus verschiedenen Sprachen auf
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="curl">
            <TabsList>
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
            </TabsList>

            <TabsContent value="curl">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                {curlExample}
              </pre>
            </TabsContent>

            <TabsContent value="javascript">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                {jsExample}
              </pre>
            </TabsContent>

            <TabsContent value="python">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                {pythonExample}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request-Format</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium">Erforderliche Felder:</p>
              <ul className="list-disc list-inside text-muted-foreground mt-1">
                <li><code>phone</code> - Telefonnummer mit Ländervorwahl</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Optionale Felder:</p>
              <ul className="list-disc list-inside text-muted-foreground mt-1">
                <li><code>name</code> - Name des Kontakts</li>
                <li><code>email</code> - E-Mail-Adresse</li>
                <li><code>lead_id</code> - Externe Lead-ID</li>
                <li><code>custom</code> - Zusätzliche Daten (Objekt)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
