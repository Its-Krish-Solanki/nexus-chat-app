#!/bin/bash
set -e
echo ""
echo "  ◈  NEXUS CHAT — Starting backend..."
echo ""

# Export settings
export DJANGO_SETTINGS_MODULE=core.settings
export PYTHONPATH=/home/claude/chatapp

# Start Daphne (ASGI server for HTTP + WebSocket)
cd /home/claude/chatapp
daphne -b 0.0.0.0 -p 8000 core.asgi:application
