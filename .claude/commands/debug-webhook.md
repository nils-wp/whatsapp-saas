# Debug Webhook Skill

Debugging von CRM Webhook Triggers.

## Test-Modus aktivieren

1. Trigger-ID aus URL oder Datenbank holen
2. Test-Modus Endpoint aufrufen:
```bash
# Test-Modus starten (30 Sekunden aktiv)
curl -X POST http://localhost:3000/api/triggers/<TRIGGER_ID>/test-mode

# Webhook senden (innerhalb 30s)
curl -X POST http://localhost:3000/api/webhook/<WEBHOOK_ID> \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: <SECRET>" \
  -d '{"phone": "49123456789", "name": "Test User"}'

# Events abrufen
curl http://localhost:3000/api/triggers/<TRIGGER_ID>/test-mode
```

## Payload-Struktur pro CRM

### Pipedrive
```json
{
  "current": {
    "id": 123,
    "name": "Max Mustermann",
    "first_name": "Max",
    "phone": [{"value": "49123456789"}]
  }
}
```

### HubSpot
```json
{
  "objectId": 123,
  "properties": {
    "firstname": "Max",
    "lastname": "Mustermann",
    "phone": "49123456789"
  }
}
```

### Monday.com
```json
{
  "event": {
    "pulseId": 123,
    "pulseName": "Max Mustermann",
    "columnId": "phone",
    "value": {"text": "49123456789"}
  }
}
```

## Logs prüfen
- Console: `Webhook filtered out:` bei Filter-Mismatch
- Console: `Extracted from <CRM> payload` für extrahierte Daten
- Datenbank: `message_queue` für Fehler
