# GadgetZone - Enterprise Fullstack E-Commerce Platform

A production-grade, containerized e-commerce and hardware management system built with React, Vite, Node.js Express, and MongoDB.

---

## 🏗️ Architecture & Project Structure

The project features a clean, decoupled fullstack structure:

```text
GadgetZone/
├── frontend/             # React 18 + Vite + Tailwind CSS Client
│   ├── src/              # Storefront & Admin Portal UI components
│   ├── public/           # Static media assets & icons
│   ├── nginx.conf        # Production Nginx reverse-proxy configuration
│   ├── Dockerfile        # Multi-stage production container build
│   └── package.json      # Frontend dependencies & Vite scripts
│
├── server/               # Express + Mongoose Backend API
│   ├── src/
│   │   ├── config/       # Resilient MongoDB Atlas / Docker connection
│   │   ├── middleware/   # JWT authentication & Admin RBAC guards
│   │   ├── models/       # Product, Order, User, Review, Service schemas
│   │   ├── routes/       # REST API endpoints (/api/products, /api/auth, etc.)
│   │   └── utils/        # Interactive Admin CLI creation tool
│   ├── Dockerfile        # Production backend container build
│   └── package.json      # Express dependencies
│
├── docker-compose.yml    # Production container orchestration
├── docker-compose.dev.yml# Local development container orchestration
├── deploy.sh             # Linux (AlmaLinux / Ubuntu / RHEL) initial deployment
├── update.sh             # Zero-downtime rolling update script
├── package.json          # Root workspace orchestration scripts
└── vercel.json           # Cloud deployment configuration
```

---

## 🚀 Quick Start (Development)

### 1. Install Dependencies
```bash
# Install frontend
npm install --prefix frontend

# Install server
npm install --prefix server
```

### 2. Run Locally
```bash
# Start frontend (Vite on http://localhost:5173)
npm run dev:frontend

# Start server (Express on http://localhost:5000)
npm run dev:server
```

---

## 🐳 Production Deployment (AlmaLinux / Ubuntu / Debian)

### 1. Clone & Initial Setup
```bash
git clone https://github.com/gadgetzone667-sys/gzones1.git GadgetZone
cd GadgetZone
chmod +x deploy.sh update.sh
./deploy.sh
```

### 2. Create Administrator Account
Run directly in the server terminal (no plaintext passwords saved in `.env`):
```bash
docker compose exec -it backend node src/utils/createAdmin.js
```
Follow the interactive prompt to set your Admin credentials.

### 3. Apply Code Updates (Zero Downtime)
Whenever you push changes to GitHub:
```bash
./update.sh
```

---

## 🔒 Security Highlights

- **Bcrypt (12 Rounds):** Passwords hashed with salted 12-factor rounds.
- **Direct CLI Admin Creation:** Eliminates plaintext credentials in `.env` or code files.
- **50MB Photo Uploads:** High-capacity body parsers for high-resolution product photography.
- **100% Dynamic Catalog:** Single source of truth in MongoDB (no static fake data).
