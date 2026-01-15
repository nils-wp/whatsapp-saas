# Salesforce CRM Expert

You are an expert in Salesforce CRM API integration.

## API Overview

- **Base URL**: `https://[instance].salesforce.com`
- **Auth**: OAuth 2.0 (JWT Bearer or Web Server Flow)
- **API**: REST API v59.0+
- **Rate Limits**: Varies by edition (100k-1M+ calls/day)

## Authentication

### Connected App Setup
1. Setup → App Manager → New Connected App
2. Enable OAuth Settings
3. Select scopes: `api`, `refresh_token`, `offline_access`

### JWT Bearer Flow (Server-to-Server)
```typescript
import jwt from 'jsonwebtoken'

async function getSalesforceToken() {
  const privateKey = process.env.SALESFORCE_PRIVATE_KEY!
  const clientId = process.env.SALESFORCE_CLIENT_ID!
  const username = process.env.SALESFORCE_USERNAME!

  const token = jwt.sign({
    iss: clientId,
    sub: username,
    aud: 'https://login.salesforce.com',
    exp: Math.floor(Date.now() / 1000) + 300
  }, privateKey, { algorithm: 'RS256' })

  const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: token
    })
  })

  return response.json()
}
```

### OAuth 2.0 Web Server Flow (Multi-Tenant)
```typescript
// Authorization URL
const authUrl = `https://login.salesforce.com/services/oauth2/authorize?` +
  `response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`

// Token Exchange
async function exchangeCode(code: string) {
  const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.SALESFORCE_CLIENT_ID!,
      client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
      redirect_uri: process.env.SALESFORCE_REDIRECT_URI!
    })
  })
  return response.json()
}
```

## REST API Client

```typescript
interface SalesforceConfig {
  instanceUrl: string
  accessToken: string
}

async function salesforceRequest(
  config: SalesforceConfig,
  endpoint: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${config.instanceUrl}/services/data/v59.0${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error[0]?.message || 'Salesforce API error')
  }

  return response.json()
}
```

## Core Endpoints

### SOQL Query (Search)
```typescript
// Find Contact by Phone
GET /query?q=SELECT+Id,Name,Phone,Email+FROM+Contact+WHERE+Phone+LIKE+'%49123456789%'

// Find Lead
GET /query?q=SELECT+Id,Name,Phone,Status+FROM+Lead+WHERE+Phone='49123456789'
```

### Contacts
```typescript
// Create Contact
POST /sobjects/Contact
{
  "FirstName": "Max",
  "LastName": "Mustermann",
  "Phone": "+49123456789",
  "Email": "max@example.com",
  "AccountId": "001xxx"
}

// Update Contact
PATCH /sobjects/Contact/{id}
{
  "WhatsApp_Status__c": "Qualified",
  "Last_WhatsApp_Contact__c": "2024-01-15"
}

// Get Contact
GET /sobjects/Contact/{id}
```

### Leads
```typescript
// Create Lead
POST /sobjects/Lead
{
  "FirstName": "Max",
  "LastName": "Mustermann",
  "Company": "Unknown",
  "Phone": "+49123456789",
  "Status": "New",
  "LeadSource": "WhatsApp"
}

// Update Lead Status
PATCH /sobjects/Lead/{id}
{ "Status": "Qualified" }

// Convert Lead
POST /sobjects/Lead/{id}/convert
{
  "convertedStatus": "Qualified",
  "doNotCreateOpportunity": false
}
```

### Opportunities
```typescript
// Create Opportunity
POST /sobjects/Opportunity
{
  "Name": "WhatsApp Lead - Max Mustermann",
  "StageName": "Prospecting",
  "CloseDate": "2024-12-31",
  "Amount": 10000,
  "AccountId": "001xxx",
  "ContactId": "003xxx"
}

// Update Stage
PATCH /sobjects/Opportunity/{id}
{ "StageName": "Closed Won" }
```

### Tasks (Activity Log)
```typescript
// Create Task (Log WhatsApp Message)
POST /sobjects/Task
{
  "Subject": "WhatsApp: Eingehende Nachricht",
  "Description": "Kunde: Hallo, ich interessiere mich für...",
  "Status": "Completed",
  "Priority": "Normal",
  "WhoId": "003xxx",  // Contact or Lead ID
  "WhatId": "006xxx", // Opportunity ID (optional)
  "ActivityDate": "2024-01-15",
  "Type": "SMS"
}
```

## Implementation for This Project

```typescript
// lib/integrations/salesforce.ts

interface SalesforceConfig {
  instanceUrl: string
  accessToken: string
  refreshToken?: string
}

// Find contact by phone
export async function findContactByPhone(config: SalesforceConfig, phone: string) {
  const normalizedPhone = phone.replace(/\D/g, '')
  const query = encodeURIComponent(
    `SELECT Id, Name, FirstName, LastName, Phone, Email, WhatsApp_Status__c
     FROM Contact
     WHERE Phone LIKE '%${normalizedPhone}%'
     LIMIT 1`
  )

  const data = await salesforceRequest(config, `/query?q=${query}`)
  return data.records?.[0] || null
}

// Find lead by phone
export async function findLeadByPhone(config: SalesforceConfig, phone: string) {
  const normalizedPhone = phone.replace(/\D/g, '')
  const query = encodeURIComponent(
    `SELECT Id, Name, Phone, Email, Status
     FROM Lead
     WHERE Phone LIKE '%${normalizedPhone}%'
     AND IsConverted = false
     LIMIT 1`
  )

  const data = await salesforceRequest(config, `/query?q=${query}`)
  return data.records?.[0] || null
}

// Create lead
export async function createLead(config: SalesforceConfig, data: {
  name: string
  phone: string
  email?: string
}) {
  const [firstName, ...lastNameParts] = data.name.split(' ')
  const lastName = lastNameParts.join(' ') || 'Unknown'

  return salesforceRequest(config, '/sobjects/Lead', {
    method: 'POST',
    body: JSON.stringify({
      FirstName: firstName,
      LastName: lastName,
      Phone: data.phone,
      Email: data.email,
      Company: 'WhatsApp Lead',
      LeadSource: 'WhatsApp',
      Status: 'New'
    })
  })
}

// Log WhatsApp message as Task
export async function logWhatsAppMessage(
  config: SalesforceConfig,
  message: Message,
  whoId: string,  // Contact or Lead ID
  whatId?: string // Opportunity ID
) {
  const direction = message.direction === 'inbound' ? 'Eingehend' : 'Ausgehend'

  return salesforceRequest(config, '/sobjects/Task', {
    method: 'POST',
    body: JSON.stringify({
      Subject: `WhatsApp: ${direction}`,
      Description: message.content,
      Status: 'Completed',
      Priority: 'Normal',
      Type: 'SMS',
      WhoId: whoId,
      WhatId: whatId,
      ActivityDate: new Date(message.created_at).toISOString().split('T')[0]
    })
  })
}

// Update lead/contact status
export async function updateRecordStatus(
  config: SalesforceConfig,
  objectType: 'Lead' | 'Contact',
  recordId: string,
  status: string,
  customFields?: Record<string, any>
) {
  const statusField = objectType === 'Lead' ? 'Status' : 'WhatsApp_Status__c'

  return salesforceRequest(config, `/sobjects/${objectType}/${recordId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      [statusField]: status,
      ...customFields
    })
  })
}

// Create opportunity from conversation
export async function createOpportunity(
  config: SalesforceConfig,
  conversation: Conversation,
  contactId: string,
  accountId?: string
) {
  return salesforceRequest(config, '/sobjects/Opportunity', {
    method: 'POST',
    body: JSON.stringify({
      Name: `WhatsApp Lead - ${conversation.contact_name || conversation.contact_phone}`,
      StageName: 'Prospecting',
      CloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ContactId: contactId,
      AccountId: accountId,
      LeadSource: 'WhatsApp'
    })
  })
}
```

## Custom Fields Setup

### Create Custom Field via Metadata API
```typescript
// Or manually in Salesforce Setup

// Contact Custom Fields
Contact.WhatsApp_Status__c (Picklist: New, Contacted, Qualified, Booked, Not Interested)
Contact.Last_WhatsApp_Contact__c (Date)
Contact.WhatsApp_Conversation_Id__c (Text)

// Lead Custom Fields
Lead.WhatsApp_Status__c (Picklist)
Lead.WhatsApp_Conversation_Id__c (Text)
```

## Platform Events (Real-time)

### Publish Event
```typescript
POST /sobjects/WhatsApp_Message__e
{
  "Phone__c": "+49123456789",
  "Message__c": "Trigger WhatsApp outreach",
  "Direction__c": "outbound"
}
```

### Subscribe via Streaming API
```typescript
// Use CometD/Bayeux protocol
// Subscribe to: /event/WhatsApp_Message__e
```

## Rate Limiting

```typescript
// Check limits
GET /limits

// Response includes:
{
  "DailyApiRequests": { "Max": 100000, "Remaining": 99500 },
  "DailyBulkApiRequests": { "Max": 10000, "Remaining": 9999 }
}

// Handle rate limits
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After')
  await sleep(Number(retryAfter) * 1000)
}
```

## Bulk Operations

```typescript
// Bulk API 2.0 for large data sets
POST /jobs/ingest
{
  "operation": "insert",
  "object": "Contact",
  "contentType": "CSV"
}

// Upload CSV data
PUT /jobs/ingest/{jobId}/batches
Content-Type: text/csv
FirstName,LastName,Phone
Max,Mustermann,+49123456789
```
