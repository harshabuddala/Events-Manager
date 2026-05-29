#!/bin/bash

# restart-dev.sh — Clean restart for Next.js dev server
# Usage: ./restart-dev.sh

echo "🧹 Cleaning Next.js cache..."
rm -rf .next

echo "🛑 Killing any existing dev server on port 8472..."
lsof -ti:8472 | xargs kill 2>/dev/null
sleep 1

echo "🚀 Starting fresh Next.js dev server..."
npx next dev -p 8472
