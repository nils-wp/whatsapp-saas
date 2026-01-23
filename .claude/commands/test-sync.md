# Test Sync Skill

Testet die Evolution API Synchronisierung.

## Voraussetzungen
- WhatsApp Account muss verbunden sein
- Evolution API muss erreichbar sein

## Test-Workflow

1. Account-ID aus Datenbank holen:
```sql
SELECT id, instance_name FROM whatsapp_accounts WHERE status = 'connected' LIMIT 1;
```

2. Sync API aufrufen:
```bash
curl -X POST http://localhost:3000/api/evolution/sync \
  -H "Content-Type: application/json" \
  -d '{"accountId": "<ACCOUNT_ID>"}'
```

3. Response analysieren:
- `synced`: Anzahl synchronisierter Chats
- `skipped`: Übersprungene Chats (Gruppen, etc.)
- `skippedReasons`: Gründe für Skip

## Debugging

Bei Problemen prüfen:
1. Evolution API Logs
2. Console Output für `[Sync]` Meldungen
3. Datenbank: `conversations` und `messages` Tabellen

## Bekannte Formate
- `@s.whatsapp.net` - Standard WhatsApp
- `@c.us` - Legacy Format
- `@lid` - Linked Device ID (kein echter Phone)
- `@g.us` - Gruppen (werden übersprungen)
