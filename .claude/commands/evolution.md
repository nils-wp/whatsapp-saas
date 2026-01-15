# Evolution API Expert

You are an expert in Evolution API v2 for WhatsApp integration.

## Evolution API Documentation

Base URL: `EVOLUTION_API_URL` environment variable
Auth: `apikey` header with `EVOLUTION_API_KEY`

### Core Endpoints

#### Instance Management
```bash
# Create instance
POST /instance/create
{
  "instanceName": "string",
  "integration": "WHATSAPP-BAILEYS",
  "qrcode": true,
  "webhook": {
    "url": "https://your-app.com/api/evolution/webhook",
    "events": ["messages.upsert", "connection.update", "qrcode.updated"]
  }
}

# Get QR Code
GET /instance/qrcode/{instanceName}

# Get Connection Status
GET /instance/connectionState/{instanceName}

# Delete Instance
DELETE /instance/delete/{instanceName}
```

#### Messaging
```bash
# Send Text Message
POST /message/sendText/{instanceName}
{
  "number": "49123456789",
  "text": "Hello!"
}

# Send Media
POST /message/sendMedia/{instanceName}
{
  "number": "49123456789",
  "mediatype": "image",
  "media": "https://url.com/image.jpg",
  "caption": "Image caption"
}

# Check WhatsApp Numbers
POST /chat/whatsappNumbers/{instanceName}
{
  "numbers": ["49123456789", "49987654321"]
}
```

#### Webhook Events
- `messages.upsert` - New incoming message
- `connection.update` - Connection state changed (open, close, connecting)
- `qrcode.updated` - QR code regenerated
- `messages.update` - Message status (sent, delivered, read)

### This Project's Client

Location: `lib/evolution/client.ts`

```typescript
// Available functions
createInstance(name, webhookUrl)
deleteInstance(instanceId)
getQRCode(instanceName)
getInstanceStatus(instanceName)
sendTextMessage(instanceName, number, text)
checkWhatsAppNumbers(instanceName, numbers)
```

### Webhook Handler

Location: `app/api/evolution/webhook/route.ts`

Handles:
- Message receiving and saving
- Connection status updates
- QR code refreshes
- Message status updates (delivered/read)

## Common Tasks

### Add new message type support
1. Update `sendMessage` in `lib/evolution/client.ts`
2. Add media handling in webhook handler
3. Update `messages` table if needed

### Debug connection issues
1. Check `getInstanceStatus()` response
2. Verify webhook URL is accessible
3. Check Evolution API logs
4. Ensure instance exists with correct name

### Handle message statuses
- pending → sent → delivered → read
- Update via webhook `messages.update` event
