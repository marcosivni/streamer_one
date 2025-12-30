# 🚀 StreamerData One: Intelligence Platform

Welcome to **StreamerData One**, a high-performance analytical system designed for the streamer and digital content ecosystem. This platform provides real-time insights into revenue, audience engagement, and creator performance using a modern tech stack and advanced PostgreSQL processing.

---

## 🛠️ Quick Start: Easy Deployment

The system is fully containerized for a "zero-config" experience. Follow these steps based on your Operating System:

### 🐳 Prerequisites
- **Docker & Docker Compose** must be installed on your machine.
- Ensure your local port **5174** (Frontend), **8001** (Backend), and **5433** (Database) are not occupied.

### ⚙️ Step 1: Environment Setup
Before running the deployment scripts, you **must** set up your environment variables:
1. Navigate to the `deployment` folder:
   ```bash
   cd system_antig/deployment
   ```
2. Rename `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. (Optional) Adjust the passwords inside `.env` if needed.

### 🐧 Linux & 🍎 macOS
1. Open your terminal and navigate to the deployment folder:
   ```bash
   cd system_antig/deployment
   ```
2. Run the deployment script:
   ```bash
   ./deploy.sh
   ```
3. Wait for the green "System is fully deployed" message. Open [http://localhost:5174](http://localhost:5174).

### 🪟 Windows
1. Open **PowerShell** or **Git Bash** as Administrator.
2. Navigate to the deployment folder:
   ```powershell
   cd system_antig/deployment
   ```
3. Run using Docker Compose directly (if scripts are restricted):
   ```powershell
   docker-compose -p streamerdata up -d --build
   ```
4. Access the dashboard at [http://localhost:5174](http://localhost:5174).

---

## 📊 Data Model & Analytics

### 🧠 The Intelligence Core
The system relies on a complex relational schema optimized for analytical queries (OLAP). Key features include:
- **Materialized Views**: Used for heavy performance aggregations (e.g., `mv_performance_streamers`) to ensure the dashboard remains lightning-fast.
- **SQL Functions & Procedures**: Custom logic like `f_ranking_faturamento_total` calculates rankings dynamically based on filtered subsets.
- **Schema**: All objects are organized within the `system_antig` schema.

### 💾 Database Dump
The file `data_model/streamers_dump.sql` contains:
- **Sanitized Definitions**: All local role/ownership references have been removed for universal compatibility.
- **Pre-populated Data**: Thousands of records for users, channels, videos, donations, and comments.
- **Post-Load Triggers**: Automatic refreshing of analytical views after data ingestion.

---

## 🎭 Data Fakers & Population

We use an advanced mock data generator located in `server/populate_data.py`. This script uses the **Faker** library to create a realistic digital economy:
- **Realistic Users**: Randomly generated personas with unique nicknames, emails, and postal addresses.
- **Financial Flow**: Simulated donations with status tracking (`lido`, `recebido`, `recusado`) and varied payment methods.
- **Engagement Cycles**: Videos are generated with random distribution of views, categories (themes), and cascading comments.
- **Relationships**: Complex foreign key mapping to ensure data integrity during drill-downs (Channel -> Video -> Donation).

---

## 💻 Tech Stack & Codebase

### 📡 Backend (FastAPI + Python)
- Located in `/server`.
- **`main.py`**: The heart of the API. It features multi-dimensional filtering, dynamic SQL generation, and parameterized drill-downs.
- **Features**: Real-time aggregation for date ranges, skipping materialized views when precision is required for short time windows.

### 🎨 Frontend (React + Vite)
- Located in `/client`.
- **Aesthetic**: Premium Dark Mode with Glassmorphism and vibrant gradients.
- **Visuals**: Powered by `react-chartjs-2` and `lucide-react`. 
- **Interactive UI**:
    - **`Dashboard.jsx`**: Real-time ranking tables and operational KPIs.
    - **`Analytics.jsx`**: Deep-drill charts (Revenue Trends, Theme Pies, Platform Bar charts).
    - **`FilterBar.jsx`**: Synchronized global filters that slice data across all pages.

### 🔍 Monitoring
To inspect the system while running:
1. Navigate to `deployment/`.
2. Run `./logs.sh` (Linux/Mac) or `docker-compose -p streamerdata logs -f`.

---

**Developed with ❤️ by Antigravity for StreamerData One.**
