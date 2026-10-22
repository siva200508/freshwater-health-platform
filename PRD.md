# 🌊 Freshwater Body Health Monitoring Community Platform
## Product Requirements Document (PRD) & Technical Specification

**Version:** 1.0.0  
**Status:** Approved for Implementation  
**Organization:** Unified Mentor Collaborating Project  
**International Reference Alignment:** United Nations Environment Programme (UNEP SDG 6.3.2), World Wildlife Fund (WWF Freshwater Practice), Global Water Watch (GWW)  
**Author:** Bodicherla Venkata Sai Siva Kumar (B.Tech CSE)  
**Target Delivery:** Production Phase 1  

---

## 1. Executive Summary & Strategic Context

Freshwater bodies—including rivers, perennial lakes, wetlands, and community ponds—constitute less than **0.8% of Earth’s surface water**, yet they sustain over **50% of all freshwater fish species**, support global agriculture, and provide municipal drinking water for billions of people.

Despite their critical ecological and socioeconomic value, freshwater ecosystems face unprecedented degradation from:
- **Untreated Municipal Sewage**: Influx of raw domestic waste triggering pathogenic contamination and eutrophication.
- **Industrial Effluents**: Heavy metal deposition, synthetic dye release, and toxic chemical discharges.
- **Micro & Macro Plastic Dumping**: Severe blockages, aquatic ingestion, and persistent organic pollutant transport.
- **Agricultural Runoff & Siltation**: Excessive nitrate/phosphate fertilizer wash-off causing massive toxic cyanobacterial blooms and dissolved oxygen depletion.

Government and state pollution control boards (e.g., CPCB, State PCBs, EPA) face severe personnel shortages, monitoring budget constraints, and laboratory backlogs. Most water bodies are inspected only biannually or quarterly—meaning pollution incidents remain undetected until mass fish die-offs, toxic foaming, or drinking water poisoning occur.

The **Freshwater Body Health Monitoring Community Platform** bridges this systemic gap. By combining modern web GIS mapping, crowdsourced citizen science, verifiable multi-parameter environmental logging, and administrative triage workflows, it decentralizes environmental monitoring and accelerates early incident detection.

---

## 2. Problem Statement & Root Cause Analysis

### 2.1 The Core Problem
Community freshwater bodies suffer from chronic, unmonitored ecological degradation due to the absence of an accessible, centralized, and transparent public reporting mechanism.

### 2.2 Root Cause Analysis (Fishbone / 5 Whys Framework)

| Category | Root Cause Finding | Platform Counter-Measure |
| :--- | :--- | :--- |
| **Visibility & Detection** | Incidents in suburban/rural water bodies occur unseen by municipal inspectors. | Citizen crowdsourcing with GPS geolocation and instant camera evidence uploads. |
| **Data Fragmentation** | Water quality records are siloed across disconnected PDF bulletins, local news, or lost in bureau archives. | Centralized searchable database of water bodies with historical trend charts. |
| **Civic Friction** | Citizens face cumbersome bureaucratic hotlines with no ticket tracking or feedback. | Frictionless 60-second incident submission with live public verification status. |
| **Verification & Trust** | False alarms or unverified claims lead to administrative alert fatigue. | Peer community endorsement mechanism + Admin inspection validation pipeline. |
| **Geographic Clarity** | Text reports lack precise coordinate boundaries and hydrological basin context. | Leaflet OpenStreetMap interactive GIS visualization with color-coded severity pins. |

---

## 3. Product Goals & Key Performance Indicators (KPIs)

### 3.1 Primary & Secondary Objectives

- **Primary Objectives:**
  1. Provide a frictionless, mobile-responsive web platform for reporting water contamination.
  2. Implement an interactive GIS map displaying real-time water body health and pollution alerts.
  3. Establish a centralized registry of rivers, lakes, and ponds with historical baseline metrics.
  4. Facilitate civic engagement through community verification, comments, and action updates.
  5. Deliver an administrative triage portal for environmental NGOs and verification authorities.

- **Secondary Objectives:**
  1. Educate citizens on observable environmental parameters (turbidity, odor, algal blooms, dissolved oxygen).
  2. Gamify citizen science contributions through karma ratings and environmental stewardship badges.
  3. Provide standardized CSV/JSON data export for environmental researchers and regulatory agencies.

### 3.2 Target Key Performance Indicators (KPIs)

| Metric ID | KPI Metric Description | Target (Phase 1) | Measurement Method |
| :--- | :--- | :--- | :--- |
| **KPI-1** | Monitored Water Bodies Registered | $\ge 25$ water bodies | Database count with verified lat/long |
| **KPI-2** | Community Reports Filed | $\ge 150$ submissions | Active database records |
| **KPI-3** | Community Verification Rate | $\ge 40\%$ of reports | $\ge 3$ citizen endorsements per report |
| **KPI-4** | Admin Triage Latency | $< 48$ hours | Time from submission to Admin verification |
| **KPI-5** | Map Render & Query Speed | $< 1.2$ seconds | Lighthouse Web Vitals (FCP/LCP) |
| **KPI-6** | User Conversion Rate | $\ge 65\%$ | Visitors who explore map or file report |

---

## 4. User Personas & Empathy Mapping

### Persona 1: Priya Sharma — The Vigilant Citizen
- **Profile:** 24, Master's student in Environmental Studies, resident near Hussain Sagar Lake.
- **Pain Point:** Frequently spots toxic surface foam and dead fish during morning runs, but has no official channel where photos and GPS coordinates can be logged with public accountability.
- **Goal:** Quickly log a pollution incident from her smartphone, upload clear photos, flag foul odors, and see whether authorities investigate.

### Persona 2: Dr. Rajesh Rao — Environmental Authority Officer / Hydrologist
- **Profile:** 48, Scientific Officer at a State Pollution Control Board & NGO collaborator.
- **Pain Point:** Overwhelmed by vague phone complaints without photographic proof, GPS coordinates, or severity estimates.
- **Goal:** Access a centralized admin dashboard with filterable GIS pins, review high-resolution evidence, verify legitimate reports, and publish official status updates.

### Persona 3: David Miller — Community Activist & Lake Revitalization Lead
- **Profile:** 34, Coordinator for a grassroots river cleanup initiative.
- **Pain Point:** Lacks historical trend data to demonstrate chronic chemical dumping patterns to local government representatives.
- **Goal:** Track community incident logs over time, download historical pollution summaries, and rally volunteers around high-risk hotspots.

---

## 5. Scope of the Product

### 5.1 In-Scope (Phase 1 Delivery)
- **Authentication & Roles:** Secure JWT authentication, password hashing (`bcrypt`), role-based access control (Citizen Scientist vs Environmental Admin), demo 1-click login.
- **Water Body Registry:** Comprehensive directory of freshwater bodies (rivers, lakes, ponds, reservoirs) with coordinates, basin type, baseline water quality status, and historical logs.
- **Interactive GIS Map:** Leaflet OpenStreetMap implementation, color-coded severity markers, radius/type/severity filtering, coordinate picker, interactive modal popups.
- **Pollution Incident Submission:** Multi-parameter reporting interface (pollution category, severity rating 1–5, visual color, odor, turbidity, optional pH/DO metrics, photo upload with preview, GPS auto-detect).
- **Community Dashboard & Live Feed:** Real-time searchable feed of community submissions with filter tabs (All, Pending, Verified, Under Review, Resolved) and community endorsement ("Confirm Observation").
- **Incident Detail View:** Dedicated report modal/page featuring high-res evidence, mini-map, environmental scorecard, timeline of official responses, and community discussion thread.
- **Citizen Profile & Gamification:** Personal activity overview, submitted reports ledger, stewardship badges ("River Guardian", "First Responder"), impact karma points.
- **Admin Control Panel:** Moderation queue (Verify, Investigate, Resolve, Reject), water body CRUD management, visual analytics (pollution breakdown pie charts, incident trend line charts), CSV/JSON data export.

### 5.2 Out-of-Scope (Phase 1)
- Autonomous hardware IoT sensor telemetry (slated for Phase 2).
- Native iOS/Android compiled binary app (handled via responsive PWA design in Phase 1).
- Deep learning computer vision for automated foam/plastic detection.
- Legal regulatory subpoena automation.

---

## 6. Functional Requirements (Modules 1–5)

### Module 1: Citizen User & Authentication
- **FR-1.1**: User Registration with full name, valid email, and secure password ($\ge 6$ chars). Returns JWT token.
- **FR-1.2**: Secure Login & Demo Switcher: Authenticates credentials; provides instant 1-click demo logins for both Citizen and Admin roles.
- **FR-1.3**: User Profile Dashboard: Displays user profile info, total reports filed, endorsements received, and stewardship badges.
- **FR-1.4**: Session Management: Persists authenticated session in client `localStorage` with bearer token transmission and logout capability.

### Module 2: Water Body Monitoring & Baseline Registry
- **FR-2.1**: Water Body Registry: Lists monitored rivers, lakes, and ponds with coordinates, state, basin type, and ecological status.
- **FR-2.2**: Realistic Environmental Baselines: Pre-loaded with verified Indian and global water bodies (Yamuna, Hussain Sagar, Bellandur Lake, Powai Lake, Dal Lake, Ganga).
- **FR-2.3**: Water Quality Scorecard: Displays baseline pH (6.5–8.5 standard), Dissolved Oxygen ($> 4.0\text{ mg/L}$ healthy), and Turbidity.
- **FR-2.4**: Historical Incident Log: Links every water body to its full audit trail of past and ongoing pollution reports.

### Module 3: Community Reporting Engine
- **FR-3.1**: Incident Report Submission: Form captures water body reference, pollution type (Industrial, Sewage, Plastic, Chemical, Agricultural, Siltation), severity (1–5), and narrative.
- **FR-3.2**: Photo Evidence Handling: Allows uploading image evidence with instant image preview, size validation ($< 5\text{MB}$), and fallback placeholder handling.
- **FR-3.3**: Physical & Chemical Indicators: Optional visual selectors: Water Color (Clear, Brown, Green/Algae, Milky, Foamy White), Odor (None, Septic, Chemical, Decaying), Turbidity level, pH, DO.
- **FR-3.4**: Community Endorsement: Any citizen can click "Confirm Observation" to upvote report validity; increments endorsement counter.
- **FR-3.5**: Incident Discussion: Citizens can leave public comments on any report to add updates (e.g., "Cleanup crew arrived").

### Module 4: GIS Mapping & Spatial Visualization
- **FR-4.1**: Interactive GIS Map: Interactive Leaflet OpenStreetMap canvas centered on active water bodies with smooth zooming and panning.
- **FR-4.2**: Severity Color Coding: Markers rendered in distinctive colors: Green (Low/Good), Yellow (Moderate), Orange (High), Red (Critical Hazard).
- **FR-4.3**: Spatial Filtering: Filter map pins by Water Body Type (All, River, Lake, Pond) and Severity Level (All, Low, Moderate, High, Critical).
- **FR-4.4**: Coordinate Tap-to-Report: Clicking on any map point extracts `latitude` and `longitude` and auto-populates the reporting form.
- **FR-4.5**: Map Information Popups: Clicking any marker opens an informative card with thumbnail, severity badge, water parameters, and direct link.

### Module 5: Environmental Administration & Triage Panel
- **FR-5.1**: Role-Gated Admin Portal: Accessible only to users with role `admin`; non-admins receive a 403 Forbidden message.
- **FR-5.2**: Moderation Queue: Admin can view all reports with action buttons: `Verify`, `Under Investigation`, `Resolve`, `Dismiss (False/Spam)`.
- **FR-5.3**: Water Body Management: Admin can register new water bodies with coordinates, type, and baseline water parameters.
- **FR-5.4**: Environmental Analytics: Interactive Chart.js charts rendering pollution distribution by type, severity distribution, and monthly reports.
- **FR-5.5**: CSV/JSON Data Export: Generates a 1-click downloadable CSV file containing all incident records for environmental agency compliance.

---

## 7. Scientific Reference for Environmental Parameters

| Parameter | Healthy Baseline | Warning Range | Critical Hazard Level | Ecological & Health Consequence |
| :--- | :--- | :--- | :--- | :--- |
| **pH Level** | $6.5 - 8.5$ | $6.0 - 6.5$ or $8.5 - 9.0$ | $< 5.5$ or $> 9.5$ | Acidic/alkaline shock destroys gill epithelium in aquatic organisms; releases heavy metals from sediment. |
| **Dissolved Oxygen (DO)** | $> 6.0\text{ mg/L}$ | $4.0 - 6.0\text{ mg/L}$ | $< 2.0\text{ mg/L}$ (Hypoxia) | Anoxic conditions cause catastrophic fish kills, suffocates benthic macroinvertebrates. |
| **Turbidity (NTU)** | $< 10\text{ NTU}$ | $10 - 50\text{ NTU}$ | $> 100\text{ NTU}$ | Blocks solar penetration, prevents submerged macrophyte photosynthesis, clogs fish gills. |
| **Biochemical Oxygen Demand (BOD)** | $< 3\text{ mg/L}$ | $3 - 8\text{ mg/L}$ | $> 15\text{ mg/L}$ | High organic load exhausts oxygen reserves as aerobic bacteria decompose raw sewage. |
| **Visual / Odor Matrix** | Clear / Inodorous | Murky / Earthy | Foamy White, Milky, Jet Black / Septic, Chemical | Directly indicates chemical surfactant dump, industrial dye, or raw municipal sewage bypass. |

---

## 8. Deployment Architecture & Operations Guide

### Recommended Deployment Options
1. **Platform-as-a-Service (PaaS) — Render / Railway (Recommended):**
   - Zero-config deployment via Git push.
   - Node.js runtime environment variables: `PORT=5000`, `JWT_SECRET=supersecretkey_freshwater_2026`, `NODE_ENV=production`.
   - Automatic SSL certificate provisioning (`https://...`).
2. **Serverless Static + Serverless Functions — Vercel:**
   - Public directory served as static frontend.
   - API endpoints deployed as serverless functions.
3. **Containerized Production — Docker:**
   - Included `Dockerfile` with multi-stage node alpine image.
