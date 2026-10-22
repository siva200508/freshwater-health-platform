# 🌊 AquaSentinel: Freshwater Body Health Monitoring Community Platform

> **A Community-Driven Citizen Science Platform for Freshwater Ecosystem Monitoring & Pollution Reporting**  
> Developed for **Unified Mentor** in strategic alignment with **United Nations Environment Programme (UNEP SDG 6.3.2)**, **World Wildlife Fund (WWF Freshwater Practice)**, and **Global Water Watch (GWW)**.  
> **Author:** Bodicherla Venkata Sai Siva Kumar (B.Tech CSE)

---

## 🌟 Executive Overview

Freshwater ecosystems—rivers, lakes, wetlands, and community ponds—constitute less than **0.8% of Earth's surface water**, yet support over 50% of freshwater fish species and provide municipal water for billions. 

Due to budget and personnel shortages in state pollution control boards, localized pollution incidents (industrial chemical discharges, illegal sewage bypasses, plastic dumping) go unnoticed until catastrophic ecological events occur.

**AquaSentinel** bridges this gap by enabling citizens to report, photograph, geo-tag, and track freshwater pollution incidents in real time. The platform features an interactive GIS map, community verification endorsement engine, environmental parameter analytics, and an administrative triage portal for environmental NGOs and government authorities.

---

## 🚀 Live Demonstration & 1-Click Evaluation Logins

The application includes built-in 1-click evaluation logins for instant review:

| Role | Name & Affiliation | Email | Password | Quick Switcher |
| :--- | :--- | :--- | :--- | :--- |
| **Citizen Scientist** | Priya Sharma (*Hyderabad Lake Protectors*) | `priya@earthguard.org` | `CitizenPassword123!` | 🧪 Click **"Demo Citizen (Priya)"** in Sign In Modal |
| **Environmental Admin** | Dr. Rajesh Rao (*State PCB & UNEP Officer*) | `admin@freshwaterwatch.org` | `AdminPassword123!` | 🛡️ Click **"Demo Admin (Dr. Rao)"** in Sign In Modal |
| **Platform Architect** | B.V.S. Siva Kumar (*Unified Mentor Fellow*) | `bodicherlavenkatasaisivakumar@gmail.com` | `CitizenPassword123!` | Custom account |

---

## 💻 Tech Stack & Architecture

- **Frontend:**
  - Modern HTML5, Responsive CSS3 (Glassmorphism & Oceanic Slate Theme)
  - Vanilla JavaScript ES6+ (No fragile compilation or heavy bundler dependencies)
  - **Leaflet.js** Interactive OpenStreetMap GIS Engine with custom color-coded pins
  - **Chart.js** for real-time pollution category breakdown and severity charts
  - FontAwesome 6 Icons & Plus Jakarta Sans Typography
- **Backend:**
  - **Node.js** & **Express.js** REST API Layer
  - **Multer** for evidence photo multipart uploads
  - **JWT (JSON Web Tokens)** for stateless role-based authentication
  - **Bcryptjs** for secure salted password hashing
  - Robust JSON-backed persistent data store (ready for MongoDB / PostgreSQL migration via Mongoose/Sequelize)
- **DevOps & Deployment:**
  - `render.yaml` for 1-click zero-config Render deployment
  - `Dockerfile` for containerized environments
  - `vercel.json` for serverless deployment

---

## 📑 8 Interconnected Platform Views

1. **Home / Landing View (`#landing-view`):**
   - High-impact environmental hero banner, mission statement, partner affiliation badges (UNEP, WWF, Global Water Watch, Unified Mentor).
   - Live KPI counter cards (Monitored Water Bodies, Reports Filed, Verified Incidents, Citizen Scientists).
   - Threat education grid & featured freshwater bodies preview.
2. **Interactive Water Body GIS Map (`#map-view`):**
   - Leaflet OpenStreetMap canvas rendering monitored rivers and lakes with color-coded severity markers:
     - 🔴 Critical Emergency (Severe foam, raw sewage, anoxia)
     - 🟠 High Hazard (Algal bloom, chemical runoff)
     - 🟡 Moderate Concern (Plastics, turbidity)
     - 🟢 Healthy / Low Concern
   - Dynamic filtering by water body type (River, Lake, Pond), severity level, and instant text search.
   - Click-to-report feature: Clicking anywhere on the map captures coordinates and transitions directly to the reporting form.
3. **Pollution Incident Reporting Page (`#report-view`):**
   - Comprehensive multi-parameter submission form:
     - Water body selector with auto-fill coordinates
     - Auto-detect GPS button
     - Pollution category (Industrial, Sewage, Plastic, Agricultural, Chemical, Siltation)
     - Severity rating (1 to 5)
     - Observable sensory indicators (Water color, Odor)
     - Scientific lab parameters (pH level, Dissolved Oxygen mg/L)
     - Evidence photo upload with instant thumbnail preview and link fallback
     - Citizen verification declaration
4. **Community Reports Dashboard & Feed (`#community-view`):**
   - Searchable, filterable real-time grid of citizen observations.
   - Status filtering (Pending, Verified, Under Investigation, Resolved).
   - One-click **"+1 Confirm Observation"** community endorsement engine.
   - Direct link to full evidence lightbox.
5. **Incident Report Detail Lightbox (`#report-detail-modal`):**
   - High-resolution photographic evidence inspection.
   - Water quality scorecard (pH, DO, Turbidity, Odor, Color).
   - Official Authority Action Timeline & Notes (e.g. "Containment booms deployed", "Cleanup complete").
   - Community Discussion & Comments Thread with live citizen comment posting.
6. **Water Body Health Directory (`#directory-view`):**
   - Complete directory of monitored rivers and lakes (Hussain Sagar, Yamuna River, Bellandur Lake, Powai Lake, Ulsoor Lake, Ganga, Dal Lake, Durgam Cheruvu).
   - Baseline hydrological metrics, primary ecological threats, and direct reporting shortcut.
7. **Citizen Scientist Profile Dashboard (`#profile-view`):**
   - Personal reputation karma meter.
   - Earned citizen science badges (*River Guardian*, *First Responder*, *Water Inspector*).
   - Audit trail of submitted environmental reports with status tracker.
8. **Admin Environmental Control Panel (`#admin-view`):**
   - Gated role-based access for environmental officers.
   - Incident Moderation Queue: 1-click **Verify**, **Investigate**, **Mark Resolved**, or **Delete Spam**.
   - Interactive Chart.js analytics: Pollution Breakdown Doughnut Chart & Severity Distribution Bar Chart.
   - Add new water body form with coordinate registration.
   - **CSV Export**: 1-click download of all pollution records for regulatory compliance.

---

## 🏃 Quick Start: How to Run Locally

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **NPM** (v9.0.0 or higher)

### 2. Installation & Server Startup
```bash
# Navigate to platform directory
cd freshwater-monitoring-platform

# Install dependencies (already installed if in this repo)
npm install

# Start the application server
npm start
```

Open your browser and navigate to:  
👉 **`http://localhost:5000`**

### 3. Run Automated API Test Suite
```bash
npm test
```

---

## 🌐 How to Deploy Live (Final Evaluation Link)

### Option A: 1-Click Deploy to Render (Recommended)
1. Push this directory or repo to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "feat: complete freshwater monitoring platform"
   git branch -M main
   git remote add origin https://github.com/<your-username>/freshwater-monitoring-platform.git
   git push -u origin main
   ```
2. Go to [Render.com](https://render.com/) and click **"New +" -> "Web Service"**.
3. Connect your GitHub repository.
4. Set:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Render will automatically build and assign a free public HTTPS URL:  
   `https://freshwater-community-platform.onrender.com`

### Option B: Deploy to Railway
1. Go to [Railway.app](https://railway.app/).
2. Select **"Deploy from GitHub repo"**.
3. Railway detects the `server.js` and provides an instant live deployment link.

### Option C: Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in this folder and follow prompts (using the provided `vercel.json`).

---

## 🧪 Scientific Environmental Metrics Guide

| Parameter | Healthy Baseline | Warning Range | Critical Hazard | Ecological Significance |
| :--- | :--- | :--- | :--- | :--- |
| **pH Level** | $6.5 - 8.5$ | $6.0-6.5$ / $8.5-9.0$ | $< 5.5$ or $> 9.5$ | Extreme pH dissolves heavy metals and damages aquatic gill membranes. |
| **Dissolved Oxygen (DO)** | $> 6.0\text{ mg/L}$ | $4.0 - 6.0\text{ mg/L}$ | $< 2.0\text{ mg/L}$ (Hypoxia) | Anoxic water leads to asphyxiation of fish and aerobic organisms. |
| **Turbidity** | $< 10\text{ NTU}$ | $10 - 50\text{ NTU}$ | $> 100\text{ NTU}$ | Blocks sunlight, halting photosynthesis of benthic plants. |
| **Biochemical Oxygen Demand** | $< 3\text{ mg/L}$ | $3 - 8\text{ mg/L}$ | $> 15\text{ mg/L}$ | High organic load exhausts oxygen during bacterial decomposition. |

---

## 📄 License & Attribution

This project is released under the **MIT License**.  
Developed with pride by **Bodicherla Venkata Sai Siva Kumar** for the **Unified Mentor** project portfolio.
