# Monday.com CRM Expert

You are an expert in Monday.com API integration for CRM workflows.

## API Overview

- **API**: GraphQL
- **Endpoint**: `https://api.monday.com/v2`
- **Auth**: Bearer Token
- **Rate Limits**: 10,000 complexity/minute

## Authentication

```typescript
const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN

async function mondayQuery(query: string, variables?: Record<string, any>) {
  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': MONDAY_API_TOKEN!,
      'API-Version': '2024-01'
    },
    body: JSON.stringify({ query, variables })
  })

  const data = await response.json()

  if (data.errors) {
    throw new Error(data.errors[0].message)
  }

  return data.data
}
```

## Core GraphQL Queries

### Get Boards

```graphql
query {
  boards(limit: 10) {
    id
    name
    columns {
      id
      title
      type
    }
    groups {
      id
      title
    }
  }
}
```

### Search Items by Column Value (Find Contact)

```graphql
query ($boardId: ID!, $columnId: String!, $value: String!) {
  items_page_by_column_values(
    board_id: $boardId
    columns: [{ column_id: $columnId, column_values: [$value] }]
    limit: 10
  ) {
    cursor
    items {
      id
      name
      column_values {
        id
        text
        value
      }
    }
  }
}
```

### Create Item (Lead/Contact)

```graphql
mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
  create_item(
    board_id: $boardId
    group_id: $groupId
    item_name: $itemName
    column_values: $columnValues
  ) {
    id
    name
  }
}
```

### Update Item

```graphql
mutation ($itemId: ID!, $columnValues: JSON!) {
  change_multiple_column_values(
    item_id: $itemId
    board_id: $boardId
    column_values: $columnValues
  ) {
    id
    name
  }
}
```

### Move Item to Group (Change Status/Stage)

```graphql
mutation ($itemId: ID!, $groupId: String!) {
  move_item_to_group(
    item_id: $itemId
    group_id: $groupId
  ) {
    id
  }
}
```

### Add Update (Note/Activity Log)

```graphql
mutation ($itemId: ID!, $body: String!) {
  create_update(
    item_id: $itemId
    body: $body
  ) {
    id
    body
    created_at
  }
}
```

## Column Value Formats

### Phone Column
```json
{
  "phone": {
    "phone": "+49123456789",
    "countryShortName": "DE"
  }
}
```

### Email Column
```json
{
  "email": {
    "email": "max@example.com",
    "text": "max@example.com"
  }
}
```

### Status Column
```json
{
  "status": {
    "label": "Qualified"
  }
}
// Or by index:
{
  "status": {
    "index": 1
  }
}
```

### Date Column
```json
{
  "date": {
    "date": "2024-01-15",
    "time": "14:30:00"
  }
}
```

### Text Column
```json
{
  "text": "Some text value"
}
```

## Implementation for This Project

```typescript
// lib/integrations/monday.ts

interface MondayConfig {
  apiToken: string
  boardId: string
  phoneColumnId: string
  nameColumnId: string
  statusColumnId: string
  groupIdNew: string
  groupIdQualified: string
  groupIdBooked: string
}

// Find item by phone
export async function findItemByPhone(config: MondayConfig, phone: string) {
  const normalizedPhone = phone.replace(/\D/g, '')

  const query = `
    query ($boardId: ID!, $columnId: String!, $value: String!) {
      items_page_by_column_values(
        board_id: $boardId
        columns: [{ column_id: $columnId, column_values: [$value] }]
        limit: 1
      ) {
        items {
          id
          name
          column_values {
            id
            text
            value
          }
        }
      }
    }
  `

  const data = await mondayQuery(query, {
    boardId: config.boardId,
    columnId: config.phoneColumnId,
    value: normalizedPhone
  })

  return data.items_page_by_column_values?.items?.[0] || null
}

// Create item
export async function createItem(config: MondayConfig, data: {
  name: string
  phone: string
  email?: string
}) {
  const columnValues = {
    [config.phoneColumnId]: {
      phone: data.phone,
      countryShortName: 'DE'
    },
    ...(data.email && {
      [config.emailColumnId]: {
        email: data.email,
        text: data.email
      }
    })
  }

  const query = `
    mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
      create_item(
        board_id: $boardId
        group_id: $groupId
        item_name: $itemName
        column_values: $columnValues
      ) {
        id
        name
      }
    }
  `

  return mondayQuery(query, {
    boardId: config.boardId,
    groupId: config.groupIdNew,
    itemName: data.name,
    columnValues: JSON.stringify(columnValues)
  })
}

// Add activity/note
export async function logWhatsAppMessage(config: MondayConfig, itemId: string, message: Message) {
  const direction = message.direction === 'inbound' ? 'Eingehend' : 'Ausgehend'
  const body = `**WhatsApp ${direction}**\n\n${message.content}\n\n_${new Date(message.created_at).toLocaleString('de-DE')}_`

  const query = `
    mutation ($itemId: ID!, $body: String!) {
      create_update(item_id: $itemId, body: $body) {
        id
      }
    }
  `

  return mondayQuery(query, { itemId, body })
}

// Move to group (change stage)
export async function updateItemStage(
  config: MondayConfig,
  itemId: string,
  outcome: ConversationOutcome
) {
  const groupMap: Record<string, string> = {
    'booked': config.groupIdBooked,
    'qualified': config.groupIdQualified,
    'not_interested': config.groupIdLost
  }

  const groupId = groupMap[outcome]
  if (!groupId) return

  const query = `
    mutation ($itemId: ID!, $groupId: String!) {
      move_item_to_group(item_id: $itemId, group_id: $groupId) {
        id
      }
    }
  `

  return mondayQuery(query, { itemId, groupId })
}

// Update status column
export async function updateItemStatus(config: MondayConfig, itemId: string, status: string) {
  const query = `
    mutation ($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
      change_multiple_column_values(
        board_id: $boardId
        item_id: $itemId
        column_values: $columnValues
      ) {
        id
      }
    }
  `

  return mondayQuery(query, {
    boardId: config.boardId,
    itemId,
    columnValues: JSON.stringify({
      [config.statusColumnId]: { label: status }
    })
  })
}
```

## Webhooks (Monday → Your App)

### Create Webhook via API
```graphql
mutation {
  create_webhook(
    board_id: 123456789
    url: "https://your-app.com/api/webhook/monday"
    event: change_column_value
    config: "{\"columnId\": \"status\"}"
  ) {
    id
    board_id
  }
}
```

### Webhook Handler
```typescript
// app/api/webhook/monday/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json()

  // Monday sends a challenge for verification
  if (body.challenge) {
    return NextResponse.json({ challenge: body.challenge })
  }

  const { event, pulseId, columnId, value } = body

  // Process status change
  if (columnId === 'status' && value.label === 'Contact via WhatsApp') {
    // Trigger WhatsApp outreach
  }

  return NextResponse.json({ success: true })
}
```

## Board Setup Recommendations

### CRM Board Structure
```
Groups:
├── New Leads
├── Contacted
├── Qualified
├── Meeting Scheduled
├── Won
└── Lost

Columns:
├── Name (item name)
├── Phone (phone column)
├── Email (email column)
├── Status (status column)
├── WhatsApp Status (status column)
├── Last Contact (date column)
├── Notes (long text column)
└── Source (dropdown column)
```

## Rate Limiting & Complexity

```typescript
// Monday uses complexity points
// Check remaining complexity in response headers

const response = await fetch('https://api.monday.com/v2', { ... })
const complexity = response.headers.get('X-Complexity-Used')
const remaining = response.headers.get('X-Complexity-Remaining')

// If approaching limit, wait
if (Number(remaining) < 1000) {
  await sleep(60000) // Wait 1 minute
}
```
