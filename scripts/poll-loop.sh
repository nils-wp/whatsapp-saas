#!/bin/bash
# Background Polling Loop - ruft /api/cron/poll-triggers alle 10 Sekunden auf

POLL_INTERVAL=${POLL_INTERVAL:-10}
APP_URL=${APP_URL:-"http://localhost:3000"}
CRON_SECRET=${CRON_SECRET:-""}

echo "[Poll Loop] Starting with interval ${POLL_INTERVAL}s"
echo "[Poll Loop] Target: ${APP_URL}/api/cron/poll-triggers"

# Warte bis die App bereit ist
sleep 10

while true; do
  if [ -n "$CRON_SECRET" ]; then
    curl -s -H "Authorization: Bearer ${CRON_SECRET}" "${APP_URL}/api/cron/poll-triggers" > /dev/null 2>&1
  else
    curl -s "${APP_URL}/api/cron/poll-triggers" > /dev/null 2>&1
  fi

  sleep $POLL_INTERVAL
done
