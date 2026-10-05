#!/bin/bash
set -e

echo "=== Docker Container Monitoring Dashboard ==="

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed."
  echo "Install Docker first, then run this script again."
  exit 1
fi

echo "Docker:"
docker --version

echo
echo "Compose:"
docker compose version

echo
echo "Architecture:"
uname -m

echo
echo "Checking project..."
test -f docker-compose.yml

echo
echo "Building dashboard..."
docker compose up -d --build

echo
echo "Status:"
docker compose ps

IP=$(hostname -I 2>/dev/null | awk '{print $1}')

echo
echo "Dashboard:"
echo "http://${IP}:5000"

echo
echo "Logs:"
echo "docker compose logs -f"
