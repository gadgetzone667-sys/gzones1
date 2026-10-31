# GZones

A modern, responsive web application built with React, TypeScript, and Vite.

## 🚀 Features

- Responsive user interface
- React component-based architecture
- TypeScript support
- Tailwind CSS for styling
- PostCSS integration
- ESLint for code quality
- Node.js backend support
- Fast development with Vite

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS, PostCSS
- **Backend:** Node.js
- **Code Quality:** ESLint
- **Package Manager:** npm
- **Version Control:** Git and GitHub

## 📋 Prerequisites

Before running the project, make sure you have installed:

- [Node.js](https://nodejs.org/)
- npm (included with Node.js)
- [Git](https://git-scm.com/)

## 💻 Installation

### 1. Clone the repository

```bash
git clone https://github.com/gadgetzone667-sys/gzones1.git
```

### 2. Navigate to the project directory

```bash
cd gz​ones1
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

Open the local URL displayed in your terminal to view the application.

## 🐧 Linux / AlmaLinux Production Server Deployment

Automated shell scripts are provided for deploying and updating GadgetZone on **AlmaLinux 8/9**, Rocky Linux, RHEL, CentOS, Ubuntu, and Debian:

### 1. Initial Setup & Launch (`deploy.sh`)

Automatically verifies Docker, configures `.env`, opens required `firewalld` ports, builds production containers, starts the stack, and runs health checks:

```bash
chmod +x deploy.sh update.sh
./deploy.sh
```

### 2. Zero-Downtime Live Updates (`update.sh`)

Pulls recent Git changes, compiles the new frontend & backend images **while the current live containers are still running**, then performs an instant container swap with zero downtime:

```bash
./update.sh
```

---

## 🐳 Running with Docker & Docker Compose (Manual)

You can run the entire GadgetZone fullstack application (Frontend + Backend + MongoDB) using Docker and Docker Compose with a single command.

### 1. Production Mode (Recommended)

Builds the optimized production frontend with Nginx and starts the Express backend and MongoDB:

```bash
docker compose up --build
```

Access the app:
- **Frontend Storefront:** [http://localhost](http://localhost) or [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Database (MongoDB):** `localhost:27017`

To stop:
```bash
docker compose down
```

### 2. Development Mode (Live Hot-Reloading)

Mounts your local source code with live hot-reloading for rapid development:

```bash
docker compose -f docker-compose.dev.yml up --build
```

---

## 🏗️ Build for Production (Manual)

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## 🔍 Code Quality

Run ESLint to check for code quality issues:

```bash
npm run lint
```

## ⚙️ Environment Variables

If the project requires API keys or environment variables, configure them in a local `.env` file.

**Important:** Never commit passwords, API keys, access tokens, or other sensitive credentials to GitHub.

## 📁 Project Structure

```text
gzones1/
├── public/              # Static assets
├── server/              # Backend server files
├── src/                 # Frontend source code
├── .gitignore           # Files excluded from Git
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
├── package-lock.json    # Dependency lock file
├── tailwind.config.js   # Tailwind CSS configuration
├── vite.config.js       # Vite configuration
└── README.md            # Project documentation
```

## 🤝 Contributing

1. Fork the repository.
2. Create a new branch.
3. Make your changes.
4. Commit your changes.
5. Submit a pull request.

## 📄 License

No license has been specified yet. All rights are reserved by the copyright holder unless a license is added.

---

**Developed with ❤️ by GZones**
