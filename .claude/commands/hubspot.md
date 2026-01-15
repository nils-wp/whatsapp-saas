# HubSpot CRM Expert

You are an expert in HubSpot CRM API integration.

## API Overview

- **Base URL**: `https://api.hubapi.com`
- **Auth**: OAuth 2.0 or Private App Token
- **Rate Limits**: 100 requests/10 seconds (Private App)

## Authentication

### Private App Token (Simple)
```typescript
const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN

async function hubspotRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`https://api.hubapi.com${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  return response.json()
}
```

### OAuth 2.0 (Multi-Tenant)
```typescript
// Token refresh
async function refreshToken(refreshToken: string) {
  const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.HUBSPOT_CLIENT_ID!,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
      refresh_token: refreshToken
    })
  })
  return response.json()
}
```

## Core Endpoints

### Contacts

```typescript
// Search Contact by Phone
POST /crm/v3/objects/contacts/search
{
  "filterGroups": [{
    "filters": [{
      "propertyName": "phone",
      "operator": "CONTAINS_TOKEN",
      "value": "49123456789"
    }]
  }],
  "properties": ["firstname", "lastname", "email", "phone"]
}

// Get Contact by ID
GET /crm/v3/objects/contacts/{contactId}?properties=firstname,lastname,email,phone

// Create Contact
POST /crm/v3/objects/contacts
{
  "properties": {
    "firstname": "Max",
    "lastname": "Mustermann",
    "email": "max@example.com",
    "phone": "+49123456789"
  }
}

// Update Contact
PATCH /crm/v3/objects/contacts/{contactId}
{
  "properties": {
    "whatsapp_status": "qualified",
    "last_whatsapp_contact": "2024-01-15"
  }
}

// Delete Contact
DELETE /crm/v3/objects/contacts/{contactId}
```

### Deals

```typescript
// Search Deals
POST /crm/v3/objects/deals/search
{
  "filterGroups": [{
    "filters": [{
      "propertyName": "dealstage",
      "operator": "EQ",
      "value": "appointmentscheduled"
    }]
  }],
  "properties": ["dealname", "amount", "dealstage", "closedate"]
}

// Create Deal
POST /crm/v3/objects/deals
{
  "properties": {
    "dealname": "WhatsApp Lead - Max Mustermann",
    "amount": "10000",
    "dealstage": "qualifiedtobuy",
    "pipeline": "default",
    "closedate": "2024-12-31"
  }
}

// Associate Deal with Contact
PUT /crm/v3/objects/deals/{dealId}/associations/contacts/{contactId}/deal_to_contact
```

### Engagements (Activity Log)

```typescript
// Create Note
POST /crm/v3/objects/notes
{
  "properties": {
    "hs_timestamp": "1705312800000",
    "hs_note_body": "WhatsApp Conversation:\n\nKunde: Hallo...\nAgent: Guten Tag..."
  }
}

// Associate Note with Contact
PUT /crm/v3/objects/notes/{noteId}/associations/contacts/{contactId}/note_to_contact

// Create Task (Follow-up)
POST /crm/v3/objects/tasks
{
  "properties": {
    "hs_task_subject": "Follow-up WhatsApp Lead",
    "hs_task_body": "Kunde hat Interesse gezeigt, nachfassen",
    "hs_task_status": "NOT_STARTED",
    "hs_task_priority": "HIGH",
    "hs_timestamp": "1705312800000"
  }
}
```

### Timeline Events (Custom Activities)

```typescript
// Create Timeline Event (requires custom event type setup)
POST /crm/v3/timeline/events
{
  "eventTemplateId": "1234567",
  "objectId": "contact_id",
  "tokens": {
    "whatsappMessage": "Message content",
    "direction": "inbound"
  }
}
```

## Implementation for This Project

```typescript
// lib/integrations/hubspot.ts

interface HubSpotConfig {
  accessToken: string
  pipelineId?: string
  initialStageId?: string
}

// Find contact by phone
export async function findContactByPhone(config: HubSpotConfig, phone: string) {
  const normalizedPhone = phone.replace(/\D/g, '')

  const data = await hubspotRequest('/crm/v3/objects/contacts/search', config, {
    method: 'POST',
    body: JSON.stringify({
      filterGroups: [{
        filters: [{
          propertyName: 'phone',
          operator: 'CONTAINS_TOKEN',
          value: normalizedPhone
        }]
      }],
      properties: ['firstname', 'lastname', 'email', 'phone', 'whatsapp_status']
    })
  })

  return data.results?.[0] || null
}

// Create contact
export async function createContact(config: HubSpotConfig, data: {
  name: string
  phone: string
  email?: string
}) {
  const [firstName, ...lastNameParts] = data.name.split(' ')
  const lastName = lastNameParts.join(' ') || ''

  return hubspotRequest('/crm/v3/objects/contacts', config, {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        firstname: firstName,
        lastname: lastName,
        phone: data.phone,
        email: data.email,
        whatsapp_status: 'new',
        hs_lead_status: 'NEW'
      }
    })
  })
}

// Create deal from conversation
export async function createDeal(config: HubSpotConfig, conversation: Conversation, contactId: string) {
  const deal = await hubspotRequest('/crm/v3/objects/deals', config, {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        dealname: `WhatsApp - ${conversation.contact_name || conversation.contact_phone}`,
        pipeline: config.pipelineId || 'default',
        dealstage: config.initialStageId || 'qualifiedtobuy'
      }
    })
  })

  // Associate with contact
  await hubspotRequest(
    `/crm/v3/objects/deals/${deal.id}/associations/contacts/${contactId}/deal_to_contact`,
    config,
    { method: 'PUT' }
  )

  return deal
}

// Log WhatsApp message as note
export async function logWhatsAppMessage(config: HubSpotConfig, message: Message, contactId: string) {
  const direction = message.direction === 'inbound' ? 'Eingehend' : 'Ausgehend'
  const timestamp = new Date(message.created_at).getTime()

  const note = await hubspotRequest('/crm/v3/objects/notes', config, {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        hs_timestamp: timestamp.toString(),
        hs_note_body: `**WhatsApp ${direction}**\n\n${message.content}`
      }
    })
  })

  // Associate with contact
  await hubspotRequest(
    `/crm/v3/objects/notes/${note.id}/associations/contacts/${contactId}/note_to_contact`,
    config,
    { method: 'PUT' }
  )

  return note
}

// Update deal stage
export async function updateDealStage(config: HubSpotConfig, dealId: string, outcome: ConversationOutcome) {
  const stageMap: Record<string, string> = {
    'booked': 'appointmentscheduled',
    'qualified': 'qualifiedtobuy',
    'not_interested': 'closedlost',
    'no_response': 'closedlost'
  }

  const stage = stageMap[outcome]
  if (!stage) return

  return hubspotRequest(`/crm/v3/objects/deals/${dealId}`, config, {
    method: 'PATCH',
    body: JSON.stringify({
      properties: { dealstage: stage }
    })
  })
}

// Update contact custom property
export async function updateContactProperty(
  config: HubSpotConfig,
  contactId: string,
  property: string,
  value: string
) {
  return hubspotRequest(`/crm/v3/objects/contacts/${contactId}`, config, {
    method: 'PATCH',
    body: JSON.stringify({
      properties: { [property]: value }
    })
  })
}
```

## Custom Properties Setup

### Create Custom Property (one-time setup)
```typescript
POST /crm/v3/properties/contacts
{
  "name": "whatsapp_status",
  "label": "WhatsApp Status",
  "type": "enumeration",
  "fieldType": "select",
  "groupName": "contactinformation",
  "options": [
    { "label": "New", "value": "new" },
    { "label": "Contacted", "value": "contacted" },
    { "label": "Qualified", "value": "qualified" },
    { "label": "Booked", "value": "booked" },
    { "label": "Not Interested", "value": "not_interested" }
  ]
}
```

## Webhooks (HubSpot → Your App)

### Webhook Subscription
```typescript
// Via HubSpot App Settings or API
POST /webhooks/v3/{appId}/subscriptions
{
  "eventType": "contact.propertyChange",
  "propertyName": "whatsapp_trigger",
  "active": true
}
```

### Webhook Handler
```typescript
// app/api/webhook/hubspot/route.ts
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  // Verify signature
  const signature = request.headers.get('X-HubSpot-Signature-v3')
  const body = await request.text()

  const hash = crypto
    .createHmac('sha256', process.env.HUBSPOT_CLIENT_SECRET!)
    .update(body)
    .digest('hex')

  if (signature !== hash) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const events = JSON.parse(body)

  for (const event of events) {
    if (event.propertyName === 'whatsapp_trigger' && event.propertyValue === 'true') {
      // Trigger WhatsApp outreach
      await triggerWhatsAppConversation(event.objectId)
    }
  }

  return NextResponse.json({ success: true })
}
```

## Rate Limiting

```typescript
// HubSpot returns rate limit info in headers
const response = await fetch(...)
const dailyRemaining = response.headers.get('X-HubSpot-RateLimit-Daily-Remaining')
const secondlyRemaining = response.headers.get('X-HubSpot-RateLimit-Secondly-Remaining')

// Implement backoff if needed
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After')
  await sleep(Number(retryAfter) * 1000)
}
```
