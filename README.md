# ✨ FitCity Frontend  
A fully typed, production‑ready Vite + React application powering both traveler discovery and admin operations.

## 📚 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Routing Overview](#routing-overview)
- [Key Modules & Data Flow](#key-modules--data-flow)
- [Deployment](#deployment)
- [Development Standards](#development-standards)
- [Troubleshooting & Tips](#troubleshooting--tips)

---

## 🌍 Overview
FitCity is a fully typed Vite + React SPA built with React 19, React Router 7, and TypeScript.  
It powers both:
- Traveler-facing search & discovery  
- Admin tools for destination management and review moderation  

The UI uses utility‑first styles and Lucide icons. All data flows through the FitCity REST API with built‑in session handling.

---

## ⭐ Features

### **Traveler Experience**
- Landing page with search/auth entry points  
- Login, sign up, forgot password, terms, Google One Tap  
- Search with filters & sorting  
- Destination detail with media, location, reviews  
- Favorite destinations with cross‑tab syncing  

### **Admin Experience**
- `/admin` workspace with persistent sidebar  
- Destination change review (approve/reject/edit/submit)  
- Filter + sort controls  
- Rich destination form with confirmation dialogs  

### **Platform**
- Centralized API client  
- Auto token injection  
- 401 auto-logout  
- Switchable favorites storage (local → API)  
- Production Dockerfile with Nginx reverse proxy  

---

## 🏗 Architecture & Tech Stack
- **Framework:** React 19, React Router 7, Vite 7  
- **Language:** TypeScript 5.8  
- **Styling:** Tailwind-style utilities, PostCSS  
- **Icons:** Lucide React  
- **State/Data:** Hooks + service layer  
- **Build/Deploy:** Docker (Node 22 builder + Nginx runtime)

---

## 🧰 Requirements
- Node.js **20+**  
- npm **10+**  
- FitCity API access  
- Google OAuth Client ID (optional)

---

## 🚀 Quick Start
```bash
npm install
```

Create `.env`:
```
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
```

Run dev server:
```bash
npm run dev
```

Open: http://localhost:5173

---

## 🔧 Environment Configuration
| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `VITE_API_URL` | REST API base URL | Yes | `http://localhost:8080` |
| `VITE_GOOGLE_CLIENT_ID` | Google sign‑in client ID | Optional | "" |
| `NGINX_PROXY_PASS` | API upstream for Docker Nginx | Optional | `http://127.0.0.1:8181` |

---

## 🛠 Available Scripts
| Script | Use |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto‑fix ESLint issues |

---

## 📂 Project Structure
```
src/
├─ App.tsx
├─ components/
├─ Admin_Pages/
│  ├─ Pages/
│  └─ Admin_Component/
├─ pages/
├─ services/
├─ types/
├─ utils/
└─ config.ts
```

---

## 🛣 Routing Overview
| Route | Description | Auth |
| --- | --- | --- |
| `/` | Landing | Public |
| `/login` etc. | Auth flows | Public |
| `/search` | Traveler search | Public |
| `/destination/:id` | Destination detail | Public + gated actions |
| `/profile`, `/favorite` | Personal utilities | Auth |
| `/admin` | Admin workspace | Auth |

---

## 🔄 Key Modules & Data Flow
- **config.ts** → Normalizes env vars  
- **api.ts** → Token injection, error handling  
- **auth services** → Session & Google loader  
- **favoritesService.ts** → Event‑driven favorites management  
- **admin components** → Menus, dialogs, mapping helpers  
- **RequireAuth.tsx** → Route guard  

---

## 📦 Deployment

### **Static Build**
```
npm run build
```
Serve `dist/` behind any reverse proxy that routes `/api/*` to the backend.

### **Docker**
```bash
docker build   --build-arg VITE_API_URL=https://api.example.com   --build-arg VITE_GOOGLE_CLIENT_ID=XXX   --build-arg NGINX_PROXY_PASS=http://api:8080   -t fit-city-web .

docker run -d -p 8080:80 fit-city-web
```

---

## 📏 Development Standards
- Full TypeScript coverage  
- Components consume service helpers (no raw fetch)  
- Lint before PR  
- Utility-first styling  
- Keep mock/adapters isolated  

---

## 🛠 Troubleshooting & Tips
- Wrong env vars → check console warnings  
- 401 → auto logout; verify CORS  
- Favorites fallback → localStorage  
- Search logs are verbose (for backend debugging)  
- Enable Google sign‑in → make sure authorized domains match  

---

_Always update this README when expanding routes, environment flags, or build paths._
