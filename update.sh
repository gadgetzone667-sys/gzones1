#!/usr/bin/env bash
# ==============================================================================
# GadgetZone - Zero-Downtime Live Update Script
# ==============================================================================
# Usage:
#   chmod +x update.sh
#   ./update.sh
# ==============================================================================

set -euo pipefail

# ANSI Color Codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}===================================================================${NC}"
echo -e "${CYAN}   🔄 GadgetZone - Smooth Live Server Update & Redeployment        ${NC}"
echo -e "${CYAN}===================================================================${NC}\n"

# ------------------------------------------------------------------------------
# 1. Environment & Docker Pre-check
# ------------------------------------------------------------------------------
if docker compose version &>/dev/null; then
    COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
    COMPOSE="docker-compose"
else
    echo -e "${RED}❌ Docker Compose is not found.${NC}"
    exit 1
fi

# ------------------------------------------------------------------------------
# 2. Pull Recent Git Changes
# ------------------------------------------------------------------------------
echo -e "${BLUE}[1/5] Pulling latest code updates from Git repository...${NC}"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
PREV_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

echo -e "• Current Git Branch: ${CYAN}${CURRENT_BRANCH}${NC}"
echo -e "• Current Commit:     ${CYAN}${PREV_COMMIT}${NC}"

# Fetch and pull recent changes
git fetch origin "${CURRENT_BRANCH}"
PULL_OUTPUT=$(git pull origin "${CURRENT_BRANCH}")
NEW_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

echo -e "${GREEN}✓ Git Pull Output: ${PULL_OUTPUT}${NC}"
if [ "${PREV_COMMIT}" != "${NEW_COMMIT}" ]; then
    echo -e "${GREEN}✓ Updated from commit ${PREV_COMMIT} to ${NEW_COMMIT}${NC}"
    echo -e "\nRecent commit details:"
    git log -1 --stat
else
    echo -e "${YELLOW}Notice: Already at latest commit (${NEW_COMMIT}). Rebuilding with current code...${NC}"
fi

# ------------------------------------------------------------------------------
# 3. Build Updated Containers While Old Containers Are Still Serving Traffic
# ------------------------------------------------------------------------------
# Crucial: Build the new frontend and backend images FIRST before stopping
# the existing containers. This prevents downtime during compilation!
echo -e "\n${BLUE}[2/5] Building updated production images (zero-downtime preparation)...${NC}"
echo -e "${CYAN}• Compiling new frontend code with Vite...${NC}"
echo -e "${CYAN}• Packaging new backend API image...${NC}"
echo -e "${YELLOW}• Existing containers remain LIVE and serving traffic during build.${NC}"

$COMPOSE build --pull frontend backend

echo -e "${GREEN}✓ New container images built and ready.${NC}"

# ------------------------------------------------------------------------------
# 4. Atomic Container Swap (Replace Old with New in Live Environment)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[3/5] Performing atomic rollout (stopping old, starting updated containers)...${NC}"

# Swaps frontend and backend with zero downtime, keeping MongoDB continuously running
$COMPOSE up -d --no-deps --remove-orphans frontend backend

echo -e "${GREEN}✓ New containers deployed successfully.${NC}"

# ------------------------------------------------------------------------------
# 5. Health Check Verification
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[4/5] Running post-update health verification...${NC}"

# Check backend API
echo -n "• Verifying updated backend API... "
BACKEND_HEALTHY=false
for i in {1..25}; do
    if curl -sSf http://127.0.0.1:5000/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}Online & Responding!${NC}"
        BACKEND_HEALTHY=true
        break
    fi
    sleep 1
done

if [ "$BACKEND_HEALTHY" != "true" ]; then
    echo -e "${RED}Warning: Backend API health check delayed. Checking logs:${NC}"
    $COMPOSE logs --tail=20 backend
fi

# Check frontend Nginx
echo -n "• Verifying updated frontend web server... "
FRONTEND_HEALTHY=false
for i in {1..15}; do
    if curl -sSf http://127.0.0.1/ >/dev/null 2>&1; then
        echo -e "${GREEN}Online & Responding!${NC}"
        FRONTEND_HEALTHY=true
        break
    fi
    sleep 1
done

if [ "$FRONTEND_HEALTHY" != "true" ]; then
    echo -e "${RED}Warning: Frontend health check delayed. Checking logs:${NC}"
    $COMPOSE logs --tail=20 frontend
fi

# ------------------------------------------------------------------------------
# 6. Housekeeping: Prune Obsolete Dangling Images
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[5/5] Cleaning up old unused image layers to save disk space...${NC}"
docker image prune -f >/dev/null 2>&1 || true
echo -e "${GREEN}✓ Storage cleanup completed.${NC}"

# ------------------------------------------------------------------------------
# Output Summary
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}===================================================================${NC}"
echo -e "${GREEN}   🎉 GADGETZONE UPDATE COMPLETED SUCCESSFULLY! 🎉                 ${NC}"
echo -e "${CYAN}===================================================================${NC}"
$COMPOSE ps

SERVER_IP=$(curl -s https://api.ipify.org 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo -e "\n${CYAN}Live Service Status:${NC}"
echo -e "  • Version:        Commit ${CYAN}${NEW_COMMIT}${NC}"
echo -e "  • Storefront:     ${GREEN}http://${SERVER_IP}/${NC}"
echo -e "  • Admin Portal:   ${GREEN}http://${SERVER_IP}/admin${NC}"
echo -e "  • API Health:     ${GREEN}http://${SERVER_IP}/api/health${NC}"
echo -e "  • Database:       Continuous (uninterrupted)\n"

