#!/bin/bash
# ===========================================
# LRPP - Manual Deployment Script
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== LRPP Deployment Script ===${NC}"

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

if [ -d .git ]; then
    echo -e "${YELLOW}Pulling latest changes...${NC}"
    git pull origin main
else
    echo -e "${YELLOW}No git repo found, skipping pull (files synced by CI)...${NC}"
fi

echo -e "${YELLOW}Stopping existing containers...${NC}"
docker compose -f docker-compose.prod.yml down || true

echo -e "${YELLOW}Building containers...${NC}"
docker compose -f docker-compose.prod.yml build

echo -e "${YELLOW}Starting containers...${NC}"
docker compose -f docker-compose.prod.yml up -d

echo -e "${YELLOW}Cleaning up old images...${NC}"
docker image prune -f

echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Services status:"
docker compose -f docker-compose.prod.yml ps
echo ""
echo -e "${GREEN}Application available at:${NC}"
echo "  - Web: http://137.74.41.101"
echo "  - API: http://137.74.41.101:3001"
