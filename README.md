# ⚡ LOGIN 2K26 — 35th Edition National Cyber Symposium

![LOGIN 2K26 Group Photo](./client/public/Group_pic.webp)

> **Official Full-Stack Cyberpunk Web Application** for **LOGIN 2K26**, organized by the **Computer Applications Association (CAA)**, Department of Computer Applications, **PSG College of Technology**, Coimbatore.

---

## 🌟 Overview & Key Features

![LOGIN 2K26 Hero Banner](./client/public/final_hero_doom.webp)

LOGIN 2K26 is an ultra-modern, high-performance national-level cyber symposium platform built with state-of-the-art web technologies and styled with a sleek cyberpunk aesthetic.

### 🎯 Key Highlights

* 🕶️ **3D Interactive Drift Wall Gallery**: Lightweight WebP image tile streaming with built-in full-screen Lightbox view.
* 🛡️ **Role-Based Access Control (RBAC)**: Enforced authorization for `admin`, `coordinator`, `registration_desk`, and `participant`.
* 👥 **Squad Formation & Team Management**: Automated invitation, join requests, and strict scheduling collision detection.
* 💳 **Automated Financial Ledger & UTR Verification**: Instant UTR reference tracking, receipt handling, and bulk CSV payment reconciliation.
* ⚡ **Performance Optimized**: Sub-millisecond payload delivery with lazy loading, WebP images, and Vite-optimized bundles.

---

## 📸 Organizing Team & Delegates Showcase

![LOGIN 2K26 Organizing Team & Delegates](./client/public/coords_bold.webp)

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 + Vite + TypeScript + Tailwind CSS |
| **Icons & Micro-animations** | Lucide React + Framer Motion |
| **State Management** | Zustand (`authStore.ts`) |
| **Backend API** | Node.js + Express.js |
| **Database & ORM** | PostgreSQL + Sequelize ORM |
| **Authentication** | JWT (Cookie + Bearer) + Email OTP verification |
| **Email Service** | Nodemailer (SMTP with HTML brand templates) |

---

## 🚀 Setup & Local Development Guide

### Prerequisites
* **Node.js**: `v20.x` or higher
* **npm**: `v10.x` or higher
* **PostgreSQL** or **SQLite** database

### 1. Clone & Install Dependencies

```bash
# Install root, client, and server dependencies
npm install
cd client && npm install
cd ../server && npm install
```

### 2. Environment Configuration

Copy the sample environment file and configure database credentials:

```bash
cp .env.example .env
```

Set up key variables:
```env
PORT=5000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/login2026
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Initialize & Seed Database

```bash
node server/seed_events.js
```

### 4. Run Locally

```bash
# Terminal 1: Run Express API Server
cd server
npm run dev

# Terminal 2: Run Vite Client App
cd client
npm run dev
```

Visit the app at `http://localhost:5173`.

---

## 📑 Organizing Committee Operations Guide

| Action | Execution Procedure |
|---|---|
| **Add / Modify Event** | Navigate to `/dashboard/admin`, select **Events**, fill details (name, category, team size, venue, timing), and click Save. |
| **Verify Payment** | Go to `/dashboard/admin` → **Payments**, review UTR number, and click **APPROVE**. Generates `LGN26-XXXX` Student ID. |
| **Bulk CSV Payment Match** | Upload payment export CSV directly into the Payment Verification tab for automatic UTR matching and batch verification. |
| **Manage Users & Roles** | Go to `/dashboard/admin` → **Users**, update roles (`admin`, `coordinator`, `registration_desk`, `participant`). |
| **Broadcast Ticker Alerts** | Go to `/dashboard/admin` → **Announcements**, enter alert text, and broadcast across the site ticker instantly. |
| **Export Roster & Reports** | Download live CSV reports for Master Roster, Financial Ledger, Squad Formations, and Event Attendance. |

---

## 📜 License

Designed and developed by the **Computer Applications Association (CAA)**, Department of Computer Applications, PSG College of Technology.
All rights reserved © 2026.
