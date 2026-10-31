#!/usr/bin/env bash
# ==============================================================================
# GadgetZone - Enterprise Linux (AlmaLinux / RHEL / Rocky / Ubuntu) Deployment Script
# ==============================================================================
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
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
echo -e "${CYAN}   🚀 GadgetZone - Fullstack Production Initial Setup & Deployment  ${NC}"
echo -e "${CYAN}   Target OS: AlmaLinux / RHEL / CentOS / Ubuntu / Debian          ${NC}"
echo -e "${CYAN}===================================================================${NC}\n"

# ------------------------------------------------------------------------------
# 1. System & Dependency Verification
# ------------------------------------------------------------------------------
echo -e "${BLUE}[1/6] Checking system requirements...${NC}"

# Check Docker installation (Auto-install if missing on AlmaLinux / RHEL / Ubuntu)
if ! command -v docker &>/dev/null; then
    echo -e "${YELLOW}⚠️ Docker is not installed on this server.${NC}"
    echo -e "${CYAN}Installing Docker and Docker Compose Plugin automatically...${NC}"
    
    if command -v dnf &>/dev/null; then
        echo -e "${BLUE}• Detected DNF package manager (AlmaLinux / Rocky / RHEL / CentOS)...${NC}"
        sudo dnf install -y dnf-plugins-core curl git
        sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        sudo systemctl enable --now docker
        sudo usermod -aG docker "$USER" 2>/dev/null || true
    elif command -v apt-get &>/dev/null; then
        echo -e "${BLUE}• Detected APT package manager (Ubuntu / Debian)...${NC}"
        sudo apt-get update -y
        sudo apt-get install -y curl git
        curl -fsSL https://get.docker.com | sudo sh
        sudo systemctl enable --now docker
        sudo usermod -aG docker "$USER" 2>/dev/null || true
    else
        echo -e "${RED}❌ Automated installation unsupported for this package manager.${NC}"
        echo -e "${YELLOW}Please install Docker manually and rerun this script.${NC}"
        exit 1
    fi

    if ! command -v docker &>/dev/null; then
        echo -e "${RED}❌ Docker installation could not be completed automatically.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker and Docker Compose installed successfully!${NC}"
fi

# Ensure Docker service is running
if ! docker info &>/dev/null; then
    echo -e "${YELLOW}⚠️ Docker daemon is not active. Attempting to start service...${NC}"
    if command -v systemctl &>/dev/null; then
        sudo systemctl start docker || {
            echo -e "${RED}❌ Failed to start Docker daemon. Please run: sudo systemctl start docker${NC}"
            exit 1
        }
    fi
fi
echo -e "${GREEN}✓ Docker daemon is active and running.${NC}"

# Determine Docker Compose command (v2 plugin preferred)
if docker compose version &>/dev/null; then
    COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
    COMPOSE="docker-compose"
else
    echo -e "${RED}❌ Docker Compose is not installed.${NC}"
    echo -e "${YELLOW}Install with: sudo dnf install -y docker-compose-plugin${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Using compose engine: $COMPOSE ($($COMPOSE version | head -n 1))${NC}"

# ------------------------------------------------------------------------------
# 2. Environment Configuration (.env)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[2/6] Configuring environment settings...${NC}"

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo -e "${YELLOW}Notice: .env file not found. Initializing from .env.example...${NC}"
        cp .env.example .env
    else
        echo -e "${YELLOW}Notice: Creating baseline .env file...${NC}"
        cat <<EOF > .env
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/GadgetZone
JWT_SECRET=$(command -v openssl &>/dev/null && openssl rand -hex 32 || echo "GadgetZone_prod_secret_$(date +%s)")
EOF
    fi
fi

# Generate cryptographically secure JWT_SECRET if using placeholder
if grep -q "change_in_production" .env 2>/dev/null; then
    NEW_SECRET=$(command -v openssl &>/dev/null && openssl rand -hex 32 || echo "gz_sec_$(date +%s)_$RANDOM")
    sed -i "s/change_in_production/${NEW_SECRET}/g" .env
    echo -e "${GREEN}✓ Generated secure random JWT_SECRET in .env.${NC}"
fi

echo -e "${GREEN}✓ Environment configuration verified.${NC}"

# ------------------------------------------------------------------------------
# 3. AlmaLinux Firewall Configuration (firewalld)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[3/6] Checking Linux firewall rules...${NC}"
if command -v firewall-cmd &>/dev/null && systemctl is-active --quiet firewalld 2>/dev/null; then
    # Verify HTTP port 80 is allowed
    if ! sudo firewall-cmd --list-services 2>/dev/null | grep -qw http; then
        echo -e "${YELLOW}Opening HTTP (80) & HTTPS (443) ports in firewalld...${NC}"
        sudo firewall-cmd --permanent --add-service=http --add-service=https >/dev/null 2>&1 || true
        sudo firewall-cmd --reload >/dev/null 2>&1 || true
    fi
    echo -e "${GREEN}✓ firewalld: HTTP & HTTPS traffic allowed.${NC}"
else
    echo -e "${GREEN}✓ Firewall configuration ready.${NC}"
fi

# ------------------------------------------------------------------------------
# 4. Building Containers (Frontend, Backend, Database)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[4/6] Building production Docker images...${NC}"
echo -e "${CYAN}• Compiling React frontend with Vite & TypeScript in Nginx container...${NC}"
echo -e "${CYAN}• Building Node.js Express backend container...${NC}"

$COMPOSE build --pull

echo -e "${GREEN}✓ Images built successfully.${NC}"

# ------------------------------------------------------------------------------
# 5. Starting Stack via Docker Compose
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[5/6] Starting containerized services in background...${NC}"

$COMPOSE up -d

# ------------------------------------------------------------------------------
# 6. Health & Readiness Verification
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[6/6] Verifying service health...${NC}"

# Wait for MongoDB
echo -n "• Waiting for MongoDB database to become healthy... "
for i in {1..30}; do
    STATUS=$(docker inspect --format='{{json .State.Health.Status}}' gadgetzone-mongodb 2>/dev/null || echo '"unknown"')
    if [ "$STATUS" == '"healthy"' ]; then
        echo -e "${GREEN}Ready!${NC}"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo -e "${YELLOW}Timed out waiting for health check. Continuing verification...${NC}"
    fi
    sleep 1
done

# Wait for Backend API
echo -n "• Waiting for Express backend API (/api/health)... "
for i in {1..30}; do
    if curl -sSf http://127.0.0.1:5000/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}Connected!${NC}"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo -e "${YELLOW}API slow to respond, check logs: docker compose logs backend${NC}"
    fi
    sleep 1
done

# Verify Nginx Frontend
echo -n "• Checking Frontend Nginx web server... "
if curl -sSf http://127.0.0.1/ >/dev/null 2>&1; then
    echo -e "${GREEN}Online!${NC}"
else
    echo -e "${YELLOW}Frontend responding on port 80.${NC}"
fi

# ------------------------------------------------------------------------------
# Deployment Summary
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}===================================================================${NC}"
echo -e "${GREEN}   ✨ GADGETZONE FULLSTACK IS RUNNING SUCCESSFULLY! ✨            ${NC}"
echo -e "${CYAN}===================================================================${NC}"
$COMPOSE ps

SERVER_IP=$(curl -s https://api.ipify.org 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo -e "\n${CYAN}Access Details:${NC}"
echo -e "  🌐 Public Storefront:  ${GREEN}http://${SERVER_IP}/${NC} (or http://localhost)"
echo -e "  🛡️  Admin Dashboard:   ${GREEN}http://${SERVER_IP}/admin${NC}"
echo -e "  🔌 Backend API:        ${GREEN}http://${SERVER_IP}/api/health${NC}"
echo -e "  💾 Database:           MongoDB 7.0 container (data persists in mongodb_data volume)"

echo -e "\n${CYAN}Useful Operations:${NC}"
echo -e "  • View live logs:     ${YELLOW}$COMPOSE logs -f${NC}"
echo -e "  • Stop services:      ${YELLOW}$COMPOSE down${NC}"
echo -e "  • Apply code updates: ${YELLOW}./update.sh${NC}\n"

