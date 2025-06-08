#!/bin/bash

# Make sure we're in the obsidian-js directory
cd "$(dirname "$0")/.." || exit 1

echo "Cleaning up old files..."

# Files moved to demo
for file in src/app/page.tsx src/app/layout.tsx src/app/defaultText*.md src/app/pasteHandler-test.md; do
  if [ -f "$file" ]; then
    echo "Removing $file (moved to demo)"
    rm "$file"
  fi
done

# Old Next.js files
for file in next.config.mjs next.config.ts .next; do
  if [ -f "$file" ] || [ -d "$file" ]; then
    echo "Removing $file (no longer needed)"
    rm -rf "$file"
  fi
done

# Old configs no longer needed
for file in postcss.config.mjs tailwind.config.js; do
  if [ -f "$file" ]; then
    echo "Removing $file (moved to demo)"
    rm "$file"
  fi
done

# Remove nested obsidian-js directories
if [ -d "obsidian-js" ]; then
  echo "Removing nested obsidian-js directory"
  rm -rf "obsidian-js"
fi

if [ -d "notescapes-app" ]; then
  echo "Removing notescapes-app directory"
  rm -rf "notescapes-app"
fi

echo "Cleanup complete!" 