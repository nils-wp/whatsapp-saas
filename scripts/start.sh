#!/bin/bash
# Start-Script: Next.js Server + Background Polling

echo "[Start] Launching Next.js and Poll Loop..."

# Starte Poll-Loop im Hintergrund
/app/scripts/poll-loop.sh &

# Starte Next.js (im Vordergrund)
exec node server.js
