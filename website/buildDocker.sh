#!/usr/bin/env bash

echo "Building the Astro website"
sleep 1
pnpm run build

lastTag="1.0.0"

echo "Building the Docker image"
docker build -t "ghcr.io/julien040/alexandria-library:$lastTag" --platform linux/amd64 .
