# Pipedrive CRM Expert

You are an expert in Pipedrive CRM API integration.

## API Overview

- **Base URL**: `https://api.pipedrive.com/v1`
- **Auth**: API Token (query param or OAuth 2.0)
- **Rate Limits**: 80 requests/2 seconds, 8000/hour

## Authentication

### API Token (Simple)
```typescript
const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN
const BASE_URL = 'https://api.pipedrive.com/v1'

async function pipedriveRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_token=${PIPEDRIVE_API_TOKEN}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  return response.json()
}
```

### OAuth 2.0 (For Multi-Tenant)
```typescript
// Token refresh
async function refreshToken(refreshToken: string) {
  const response = await fetch('https://oauth.pipedrive.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.PIPEDRIVE_CLIENT_ID!,
      client_secret: process.env.PIPEDRIVE_CLIENT_SECRET!
    })
  })
  return response.json()
}
```

## Core Endpoints

### Persons (Contacts)

```typescript
// Search Person by Phone
GET /persons/search?term=49123456789&fields=phone

// Get Person by ID
GET /persons/{id}

// Create Person
POST /persons
{
  "name": "Max Mustermann",
  "phone": [{ "value": "+49123456789", "primary": true, "label": "mobile" }],
  "email": [{ "value": "max@example.com", "primary": true, "label": "work" }],
  "org_id": 123,  // Optional: Link to organization
  "visible_to": 3  // 1=owner, 3=entire company
}

// Update Person
PUT /persons/{id}
{
  "name": "Updated Name",
  "phone": [{ "value": "+49987654321", "primary": true }]
}

// Delete Person
DELETE /persons/{id}
```

### Deals

```typescript
// List Deals
GET /deals?status=open&sort=update_time DESC

// Search Deals
GET /deals/search?term=keyword

// Create Deal
POST /deals
{
  "title": "WhatsApp Lead - Max Mustermann",
  "value": 10000,
  "currency": "EUR",
  "person_id": 123,
  "org_id": 456,
  "pipeline_id": 1,
  "stage_id": 1,
  "status": "open",  // open, won, lost, deleted
  "expected_close_date": "2024-12-31"
}

// Update Deal
PUT /deals/{id}
{
  "stage_id": 2,  // Move to next stage
  "value": 15000
}

// Update Deal Stage (shortcut)
PUT /deals/{id}
{ "stage_id": 3 }
```

### Activities (Log Messages)

```typescript
// Create Activity (Log WhatsApp Message)
POST /activities
{
  "type": "sms",  // Or custom "whatsapp" type
  "subject": "WhatsApp: Incoming message",
  "note": "Kunde: Hallo, ich interessiere mich für...",
  "deal_id": 123,
  "person_id": 456,
  "due_date": "2024-01-15",
  "due_time": "14:30",
  "done": 1  // 0=not done, 1=done
}

// List Activities
GET /activities?type=sms&done=0
```

### Notes

```typescript
// Add Note to Deal
POST /notes
{
  "content": "WhatsApp Conversation Summary:\n- Interested in product X\n- Follow up next week",
  "deal_id": 123,
  "person_id": 456,
  "pinned_to_deal_flag": 1
}
```

### Custom Fields

```typescript
// Get Person Fields (to find custom field keys)
GET /personFields

// Update Custom Field
PUT /persons/{id}
{
  "abc123_whatsapp_status": "qualified"  // Custom field key format
}
```

## Implementation for This Project

### Client File Structure

```typescript
// lib/integrations/pipedrive.ts

interface PipedriveConfig {
  apiToken: string
  // Or for OAuth:
  accessToken: string
  refreshToken: string
}

// Find contact by phone
export async function findPersonByPhone(config: PipedriveConfig, phone: string) {
  const normalizedPhone = phone.replace(/\D/g, '')
  const data = await pipedriveRequest(
    `/persons/search?term=${normalizedPhone}&fields=phone`,
    config
  )
  return data.data?.items?.[0]?.item || null
}

// Create person
export async function createPerson(config: PipedriveConfig, data: {
  name: string
  phone: string
  email?: string
}) {
  return pipedriveRequest('/persons', config, {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      phone: [{ value: data.phone, primary: true }],
      email: data.email ? [{ value: data.email, primary: true }] : undefined
    })
  })
}

// Create deal from conversation
export async function createDealFromConversation(
  config: PipedriveConfig,
  conversation: Conversation,
  personId: number
) {
  return pipedriveRequest('/deals', config, {
    method: 'POST',
    body: JSON.stringify({
      title: `WhatsApp Lead - ${conversation.contact_name || conversation.contact_phone}`,
      person_id: personId,
      pipeline_id: config.pipelineId || 1,
      stage_id: config.initialStageId || 1
    })
  })
}

// Log WhatsApp message as activity
export async function logWhatsAppMessage(
  config: PipedriveConfig,
  message: Message,
  personId: number,
  dealId?: number
) {
  return pipedriveRequest('/activities', config, {
    method: 'POST',
    body: JSON.stringify({
      type: 'sms',  // Or custom type
      subject: `WhatsApp: ${message.direction === 'inbound' ? 'Eingehend' : 'Ausgehend'}`,
      note: message.content,
      person_id: personId,
      deal_id: dealId,
      done: 1,
      due_date: new Date().toISOString().split('T')[0],
      due_time: new Date().toTimeString().slice(0, 5)
    })
  })
}

// Update deal stage based on conversation outcome
export async function updateDealStage(
  config: PipedriveConfig,
  dealId: number,
  outcome: ConversationOutcome
) {
  const stageMap: Record<string, number> = {
    'booked': config.bookedStageId || 3,
    'not_interested': config.lostStageId || 4,
    'no_response': config.coldStageId || 2
  }

  const stageId = stageMap[outcome]
  if (!stageId) return

  return pipedriveRequest(`/deals/${dealId}`, config, {
    method: 'PUT',
    body: JSON.stringify({ stage_id: stageId })
  })
}
```

## Integration with CRM Sync

```typescript
// lib/integrations/crm-sync.ts

import * as pipedrive from './pipedrive'

export async function logMessageToCRM(tenantId: string, message: Message, conversation: Conversation) {
  const config = await getTenantCRMConfig(tenantId)

  if (config.pipedrive?.enabled) {
    let person = await pipedrive.findPersonByPhone(config.pipedrive, conversation.contact_phone)

    if (!person) {
      const result = await pipedrive.createPerson(config.pipedrive, {
        name: conversation.contact_name || conversation.contact_phone,
        phone: conversation.contact_phone
      })
      person = result.data
    }

    await pipedrive.logWhatsAppMessage(config.pipedrive, message, person.id, conversation.external_deal_id)
  }

  // ... other CRMs
}
```

## Webhooks (Pipedrive → Your App)

```typescript
// Register webhook for deal updates
POST /webhooks
{
  "subscription_url": "https://your-app.com/api/webhook/pipedrive",
  "event_action": "updated",
  "event_object": "deal"
}

// Webhook handler
// app/api/webhook/pipedrive/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { meta, current, previous } = body

  // Verify webhook signature
  // Process deal update
  // Trigger outbound WhatsApp if configured

  return NextResponse.json({ success: true })
}
```

## Rate Limiting

```typescript
// Implement exponential backoff
async function pipedriveRequestWithRetry(endpoint: string, options: RequestInit, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(...)

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || Math.pow(2, i)
      await sleep(Number(retryAfter) * 1000)
      continue
    }

    return response.json()
  }
  throw new Error('Rate limit exceeded after retries')
}
```
