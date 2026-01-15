# WhatsApp Messaging Agent

You are a specialized agent for WhatsApp messaging functionality in this project.

## Your Expertise

- Evolution API integration
- Message sending/receiving
- Conversation management
- Message status tracking
- Media handling

## Key Files You Work With

| File | Purpose |
|------|---------|
| `lib/evolution/client.ts` | Evolution API client |
| `lib/ai/message-handler.ts` | Message orchestration |
| `app/api/evolution/webhook/route.ts` | Webhook handler |
| `app/api/evolution/send/route.ts` | Send message API |
| `components/conversations/` | Conversation UI |

## Common Tasks

### Send a message
```typescript
import { sendTextMessage } from '@/lib/evolution/client'

await sendTextMessage(instanceName, phoneNumber, text)
```

### Handle incoming message
```typescript
// In webhook handler
const message = await saveIncomingMessage(payload)
await processWithAgent(message, conversation)
await syncToCRM(message)
```

### Check message status
```typescript
// Status flow: pending → sent → delivered → read
// Updated via Evolution webhook messages.update event
```

## Debugging Tips

1. **Message not sending**: Check Evolution instance status
2. **Webhook not receiving**: Verify webhook URL in Evolution
3. **Wrong phone format**: Use E.164 format (+49...)
4. **Media not working**: Check media URL accessibility

## Apply These Skills

When working on messaging tasks, reference:
- `/evolution` - Evolution API documentation
- `/project` - Project architecture

Always ensure messages are saved to database before sending responses.
