#!/bin/sh
set -e

echo "[Keepr Backend] Waiting for database to be ready..."
npx prisma db push --skip-generate

echo "[Keepr Backend] Starting Keepr server..."
exec dumb-init node dist/server.js
