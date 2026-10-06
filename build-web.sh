#!/bin/sh
# Bouwt de web-app (PWA) in ./web-build. Netlify draait dit automatisch bij elke update.
set -e
rm -rf web-build
npx expo export --platform web --output-dir web-build
node scripts/pwa.mjs web-build
