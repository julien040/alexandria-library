#!/usr/bin/env bash

# Exit on error
set -e

# Build the website
echo "Building the Astro website"
sleep 1
doppler run -- pnpm run build

# Get the last tag from the git repository
lastTag=$(git describe --tags --abbrev=0)

# Build the Docker image
echo "Building the Docker image"
docker build -t "ghcr.io/julien040/alexandria-library:$lastTag" --platform linux/amd64 .

# Push the image to the GitHub Container Registry
echo "Pushing the Docker image to the GitHub Container Registry"
docker push "ghcr.io/julien040/alexandria-library:$lastTag"

# Tag the image as latest
echo "Tagging the Docker image as latest"
docker tag "ghcr.io/julien040/alexandria-library:$lastTag" "ghcr.io/julien040/alexandria-library:latest"
docker push "ghcr.io/julien040/alexandria-library:latest"
