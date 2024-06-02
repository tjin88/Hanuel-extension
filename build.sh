#!/bin/sh

if [ "$1" = "chrome" ] || [ "$1" = "edge" ]; then
  cp manifest.chrome.json manifest.json
elif [ "$1" = "firefox" ]; then
  cp manifest.firefox.json manifest.json
else
  echo "Unknown target: $1"
  exit 1
fi

echo "Manifest for $1 is ready."
