# CRM Integration Expert

You are an expert in CRM integrations for this WhatsApp SaaS platform.

## Supported CRMs

### Currently Implemented
- **Close.io** - Full integration (`lib/integrations/close.ts`)
- **ActiveCampaign** - Full integration (`lib/integrations/activecampaign.ts`)

### Planned Integrations
- Pipedrive
- Monday CRM
- HubSpot
- Salesforce

## Close.io API

### Authentication
```typescript
const headers = {
  'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
  'Content-Type': 'application/json'
}
```

### Key Endpoints

```bash
# Find Lead by Phone
GET /api/v1/lead/?query=phone:"49123456789"

# Create Lead
POST /api/v1/lead/
{
  "name": "Contact Name",
  "contacts": [{
    "name": "Contact Name",
    "phones": [{ "phone": "+49123456789", "type": "mobile" }]
  }]
}

# Update Lead
PUT /api/v1/lead/{lead_id}/
{ "custom.cf_status": "qualified" }

# Log SMS Activity
POST /api/v1/activity/sms/
{
  "lead_id": "lead_xxx",
  "direction": "incoming", // or "outgoing"
  "local_phone": "+49...",
  "remote_phone": "+49...",
  "text": "Message content",
  "status": "sent"
}

# Create Opportunity
POST /api/v1/opportunity/
{
  "lead_id": "lead_xxx",
  "status_id": "stat_xxx",
  "value": 10000,
  "value_period": "one_time"
}
```

### Project Implementation

Location: `lib/integrations/close.ts`

```typescript
// Available functions
findLeadByPhone(apiKey, phone)
findLeadByEmail(apiKey, email)
createLead(apiKey, data)
updateLead(apiKey, leadId, data)
logSmsActivity(apiKey, activity)
createOpportunity(apiKey, data)
addNote(apiKey, leadId, note)
addTag(apiKey, leadId, tag)
```

## ActiveCampaign API

### Authentication
```typescript
const headers = {
  'Api-Token': apiKey,
  'Content-Type': 'application/json'
}
// Base URL: https://{account}.api-us1.com/api/3/
```

### Key Endpoints

```bash
# Find Contact
GET /api/3/contacts?email=test@example.com
GET /api/3/contacts?phone=49123456789

# Create Contact
POST /api/3/contacts
{
  "contact": {
    "email": "test@example.com",
    "firstName": "Max",
    "phone": "+49123456789"
  }
}

# Update Contact
PUT /api/3/contacts/{id}

# Add Tag
POST /api/3/contactTags
{
  "contactTag": {
    "contact": "123",
    "tag": "456"
  }
}

# Create Deal
POST /api/3/deals
{
  "deal": {
    "contact": "123",
    "title": "Deal Title",
    "value": 10000,
    "pipeline": "1",
    "stage": "1"
  }
}

# Update Custom Field
PUT /api/3/fieldValues/{id}
POST /api/3/fieldValues
{
  "fieldValue": {
    "contact": "123",
    "field": "1",
    "value": "Custom Value"
  }
}
```

### Project Implementation

Location: `lib/integrations/activecampaign.ts`

```typescript
// Available functions
findContactByPhone(baseUrl, apiKey, phone)
findContactByEmail(baseUrl, apiKey, email)
createContact(baseUrl, apiKey, data)
updateContact(baseUrl, apiKey, contactId, data)
addTag(baseUrl, apiKey, contactId, tagId)
updateCustomField(baseUrl, apiKey, contactId, fieldId, value)
createDeal(baseUrl, apiKey, data)
updateDealStage(baseUrl, apiKey, dealId, stageId)
```

## CRM Sync Orchestration

Location: `lib/integrations/crm-sync.ts`

```typescript
// Main sync functions
async function logMessageToCRM(tenantId, message, conversation) {
  const config = await getTenantCRMConfig(tenantId)

  if (config.close?.enabled) {
    await closeIntegration.logSmsActivity(...)
  }
  if (config.activecampaign?.enabled) {
    // AC doesn't have SMS logging, update contact instead
  }
}

async function syncConversationToCRM(tenantId, conversation) {
  // Sync full conversation on completion/escalation
}

async function updateCRMStatus(tenantId, conversation, newStatus) {
  // Update lead/contact status in CRM
}
```

## Adding New CRM Integration

### Step-by-Step

1. **Create Client File**
   ```
   lib/integrations/[crm-name].ts
   ```

2. **Implement Core Functions**
   ```typescript
   export async function findContactByPhone(apiKey: string, phone: string) {}
   export async function createContact(apiKey: string, data: ContactData) {}
   export async function updateContact(apiKey: string, id: string, data: Partial<ContactData>) {}
   export async function logActivity(apiKey: string, activity: ActivityData) {}
   ```

3. **Update CRM Sync**
   ```typescript
   // In crm-sync.ts
   if (config.[newCrm]?.enabled) {
     await newCrmIntegration.logActivity(...)
   }
   ```

4. **Add Settings UI**
   - Create component in `components/integrations/[crm]-settings.tsx`
   - Add to integrations page

5. **Update Types**
   ```typescript
   // In types/index.ts
   interface TenantCRMConfig {
     close?: CloseConfig
     activecampaign?: ActiveCampaignConfig
     newCrm?: NewCrmConfig  // Add here
   }
   ```

## Pipedrive API (Reference)

```bash
# Base URL: https://api.pipedrive.com/v1

# Find Person
GET /persons/search?term=49123456789&api_token=xxx

# Create Person
POST /persons?api_token=xxx
{ "name": "Name", "phone": "+49...", "email": "..." }

# Create Deal
POST /deals?api_token=xxx
{ "title": "Deal", "person_id": 123, "value": 1000 }

# Add Note
POST /notes?api_token=xxx
{ "content": "Note text", "deal_id": 123 }
```

## Monday CRM API (Reference)

```graphql
# GraphQL API: https://api.monday.com/v2

# Find Item
query {
  items_page_by_column_values (
    board_id: 123,
    columns: [{column_id: "phone", column_values: ["49123456789"]}]
  ) {
    items { id name }
  }
}

# Create Item
mutation {
  create_item (
    board_id: 123,
    item_name: "Lead Name",
    column_values: "{\"phone\": \"+49...\"}"
  ) { id }
}
```
