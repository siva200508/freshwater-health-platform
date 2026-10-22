/**
 * AquaSentinel - Freshwater Body Health Monitoring Platform
 * Core Frontend Application Logic
 * Supports: GIS Mapping (Leaflet), Chart.js Analytics, Crowdsourced Reporting,
 * Authentication, Multi-View Routing, Community Verification, and Admin Triage.
 */

// Application Global State
const STATE = {
  currentUser: null,
  token: localStorage.getItem('freshwater_token') || null,
  waterBodies: [],
  reports: [],
  analytics: null,
  map: null,
  mapMarkers: [],
  activeReport: null,
  charts: {
    pollution: null,
    severity: null
  },
  selectedFile: null
};

// ==========================================================================
// 1. INITIALIZATION & ROUTING
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🌊 AquaSentinel Client Engine Initializing...');
  
  // 1. Verify Authentication
  await checkAuthSession();

  // 2. Fetch Initial Datasets
  await Promise.all([
    fetchWaterBodies(),
    fetchReports(),
    fetchAnalytics()
  ]);

  // 3. Initialize Interactive Leaflet Map
  initLeafletMap();

  // 4. Render Initial Views
  renderLandingView();
  renderCommunityFeed();
  renderWaterBodiesDirectory();
  populateWaterBodyDropdowns();

  // 5. Check URL hash for direct view routing
  const hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById(hash)) {
    switchView(hash);
  } else {
    switchView('landing-view');
  }
});

// View Switcher (SPA navigation)
function switchView(viewId) {
  const sections = document.querySelectorAll('.view-section');
  sections.forEach(sec => sec.classList.remove('active'));

  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active');
    window.location.hash = viewId;
  }

  // Update Nav links
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    if (link.getAttribute('data-view') === viewId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Special triggers for specific views
  if (viewId === 'map-view' && STATE.map) {
    setTimeout(() => {
      STATE.map.invalidateSize();
      renderMapMarkers();
    }, 200);
  }

  if (viewId === 'admin-view') {
    if (!STATE.currentUser || STATE.currentUser.role !== 'admin') {
      showToast('Viewing Admin Portal in Demonstration Mode.', 'warning');
    }
    renderAdminPanel();
    initAnalyticsCharts();
  }

  if (viewId === 'profile-view') {
    renderUserProfile();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileNav() {
  const menu = document.querySelector('.nav-menu');
  if (menu) {
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
  }
}

// ==========================================================================
// 2. AUTHENTICATION & DEMO ROLES
// ==========================================================================

async function checkAuthSession() {
  if (!STATE.token) {
    updateAuthNavbar(null);
    return;
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${STATE.token}` }
    });
    const data = await res.json();
    if (data.success && data.user) {
      STATE.currentUser = data.user;
      updateAuthNavbar(data.user);
    } else {
      logout();
    }
  } catch (err) {
    console.warn('Session verification fallback:', err);
    updateAuthNavbar(null);
  }
}

function updateAuthNavbar(user) {
  const container = document.getElementById('auth-status-container');
  if (!container) return;

  if (user) {
    const isAdmin = user.role === 'admin';
    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.6rem;">
        <span class="badge-partner" style="cursor: pointer;" onclick="switchView('profile-view')">
          <i class="fa-solid fa-${isAdmin ? 'user-shield' : 'seedling'}"></i> ${user.fullName} (${isAdmin ? 'Admin' : 'Citizen'})
        </span>
        <button class="btn btn-outline btn-sm" onclick="logout()" title="Sign Out"><i class="fa-solid fa-right-from-bracket"></i></button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button class="btn btn-primary btn-sm" onclick="openAuthModal()"><i class="fa-solid fa-right-to-bracket"></i> Sign In / Demo</button>
    `;
  }
}

function openAuthModal() {
  openModal('auth-modal');
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const tabLogin = document.getElementById('tab-login');
  const tabReg = document.getElementById('tab-register');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    regForm.style.display = 'none';
    tabLogin.classList.add('active');
    tabReg.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    regForm.style.display = 'block';
    tabLogin.classList.remove('active');
    tabReg.classList.add('active');
  }
}

// 1-Click Demo Logins
async function demoLogin(role) {
  const email = role === 'admin' ? 'admin@freshwaterwatch.org' : 'priya@earthguard.org';
  const password = role === 'admin' ? 'AdminPassword123!' : 'CitizenPassword123!';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      STATE.token = data.token;
      STATE.currentUser = data.user;
      localStorage.setItem('freshwater_token', data.token);
      updateAuthNavbar(data.user);
      closeModal('auth-modal');
      showToast(`Welcome, ${data.user.fullName}! Logged in as ${data.user.role.toUpperCase()}.`, 'success');
      
      if (role === 'admin') {
        switchView('admin-view');
      } else {
        switchView('community-view');
      }
    } else {
      showToast(data.message || 'Demo login failed.', 'error');
    }
  } catch (err) {
    showToast('Login request error: ' + err.message, 'error');
  }
}

async function handleUserLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      STATE.token = data.token;
      STATE.currentUser = data.user;
      localStorage.setItem('freshwater_token', data.token);
      updateAuthNavbar(data.user);
      closeModal('auth-modal');
      showToast('Logged in successfully!', 'success');
      switchView('community-view');
    } else {
      showToast(data.message || 'Login failed.', 'error');
    }
  } catch (err) {
    showToast('Login error: ' + err.message, 'error');
  }
}

async function handleUserRegister(e) {
  e.preventDefault();
  const fullName = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const organization = document.getElementById('reg-org').value;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, organization, role: 'citizen' })
    });
    const data = await res.json();
    if (data.success) {
      STATE.token = data.token;
      STATE.currentUser = data.user;
      localStorage.setItem('freshwater_token', data.token);
      updateAuthNavbar(data.user);
      closeModal('auth-modal');
      showToast('Registration successful! Welcome to AquaSentinel.', 'success');
      switchView('community-view');
    } else {
      showToast(data.message || 'Registration failed.', 'error');
    }
  } catch (err) {
    showToast('Registration error: ' + err.message, 'error');
  }
}

function logout() {
  STATE.token = null;
  STATE.currentUser = null;
  localStorage.removeItem('freshwater_token');
  updateAuthNavbar(null);
  showToast('You have been logged out.', 'info');
  switchView('landing-view');
}

// ==========================================================================
// 3. DATA FETCHING SERVICES
// ==========================================================================

async function fetchWaterBodies() {
  try {
    const res = await fetch('/api/water-bodies');
    const data = await res.json();
    if (data.success) {
      STATE.waterBodies = data.data;
      const counter = document.getElementById('stat-waterbodies-count');
      if (counter) counter.innerText = STATE.waterBodies.length;
    }
  } catch (err) {
    console.error('Failed to load water bodies:', err);
  }
}

async function fetchReports() {
  try {
    const res = await fetch('/api/reports');
    const data = await res.json();
    if (data.success) {
      STATE.reports = data.data;
      const counter = document.getElementById('stat-reports-count');
      if (counter) counter.innerText = STATE.reports.length;
    }
  } catch (err) {
    console.error('Failed to load reports:', err);
  }
}

async function fetchAnalytics() {
  try {
    const res = await fetch('/api/analytics/summary');
    const data = await res.json();
    if (data.success) {
      STATE.analytics = data.data;
      const verifiedCounter = document.getElementById('stat-verified-count');
      if (verifiedCounter) verifiedCounter.innerText = data.data.verifiedIncidents;
      const citizensCounter = document.getElementById('stat-citizens-count');
      if (citizensCounter) citizensCounter.innerText = data.data.registeredCitizens + 42; // baseline community
    }
  } catch (err) {
    console.error('Failed to load analytics:', err);
  }
}

// ==========================================================================
// 4. INTERACTIVE GIS MAPPING (LEAFLET.JS)
// ==========================================================================

function initLeafletMap() {
  const mapElement = document.getElementById('leaflet-map');
  if (!mapElement) return;

  // Centered on India with broad view of monitored bodies
  STATE.map = L.map('leaflet-map').setView([20.5937, 78.9629], 5);

  // Dark / Sleek Map Tiles (OpenStreetMap CartoDB Dark Matter / Standard fallback)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors | AquaSentinel GIS Engine'
  }).addTo(STATE.map);

  // Click on map to report incident at exact coordinates!
  STATE.map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    document.getElementById('form-latitude').value = lat.toFixed(5);
    document.getElementById('form-longitude').value = lng.toFixed(5);
    document.getElementById('form-address').value = `Geo-Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    showToast(`Pinned coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}. Opening report form.`, 'info');
    switchView('report-view');
  });

  renderMapMarkers();
}

function renderMapMarkers() {
  if (!STATE.map) return;

  // Clear existing markers
  STATE.mapMarkers.forEach(m => STATE.map.removeLayer(m));
  STATE.mapMarkers = [];

  const filterType = document.getElementById('map-filter-type')?.value || 'All';
  const filterSeverity = document.getElementById('map-filter-severity')?.value || 'All';
  const search = document.getElementById('map-search')?.value.toLowerCase().trim() || '';

  // 1. Water Bodies Base Markers
  STATE.waterBodies.forEach(wb => {
    if (filterType !== 'All' && wb.type.toLowerCase() !== filterType.toLowerCase()) return;
    if (search && !wb.name.toLowerCase().includes(search) && !wb.city.toLowerCase().includes(search)) return;

    // Severity mapping color
    let pinColor = '#10b981'; // Good
    if (wb.healthStatus === 'Critical') pinColor = '#ef4444';
    else if (wb.healthStatus === 'Poor') pinColor = '#f97316';
    else if (wb.healthStatus === 'Moderate') pinColor = '#f59e0b';

    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          width: 34px; height: 34px; border-radius: 50%;
          background: ${pinColor}; border: 3px solid #0d1e30;
          box-shadow: 0 0 14px ${pinColor};
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 14px; cursor: pointer;
        ">
          <i class="fa-solid fa-water"></i>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const marker = L.marker([wb.coordinates.latitude, wb.coordinates.longitude], { icon: customIcon }).addTo(STATE.map);

    const popupHtml = `
      <div style="min-width: 220px; font-family: inherit;">
        <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.2rem; color: #38bdf8;">${wb.name}</h4>
        <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.5rem;"><i class="fa-solid fa-location-dot"></i> ${wb.city}, ${wb.state}</div>
        <div style="font-size: 0.78rem; margin-bottom: 0.5rem;">
          <div>Status: <strong style="color: ${pinColor};">${wb.healthStatus}</strong></div>
          <div>Baseline pH: <strong>${wb.baselineMetrics.ph}</strong> | DO: <strong>${wb.baselineMetrics.dissolvedOxygenMgL} mg/L</strong></div>
          <div>Active Incidents: <strong>${wb.totalReportsCount || 0}</strong></div>
        </div>
        <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="reportAtWaterBody('${wb.id}')">
          <i class="fa-solid fa-camera"></i> Report Incident Here
        </button>
      </div>
    `;

    marker.bindPopup(popupHtml);
    STATE.mapMarkers.push(marker);
  });

  // 2. Real-time Incident Report Markers
  STATE.reports.forEach(rep => {
    if (!rep.location || !rep.location.latitude) return;
    if (filterSeverity !== 'All' && rep.severity.toLowerCase() !== filterSeverity.toLowerCase()) return;

    let repColor = '#ef4444';
    if (rep.severity === 'High') repColor = '#f97316';
    else if (rep.severity === 'Moderate') repColor = '#f59e0b';
    else if (rep.severity === 'Low') repColor = '#10b981';

    const incidentIcon = L.divIcon({
      className: 'incident-map-pin',
      html: `
        <div style="
          width: 28px; height: 28px; border-radius: 6px;
          background: ${repColor}; border: 2px solid #fff;
          box-shadow: 0 0 10px ${repColor};
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 12px; cursor: pointer;
        ">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const marker = L.marker([rep.location.latitude, rep.location.longitude], { icon: incidentIcon }).addTo(STATE.map);

    const popupHtml = `
      <div style="min-width: 220px; font-family: inherit;">
        <span class="severity-tag ${rep.severity.toLowerCase()}" style="position: static; font-size: 0.7rem; padding: 2px 6px;">${rep.severity}</span>
        <h4 style="font-size: 0.95rem; font-weight: 700; margin: 0.3rem 0; color: #fff;">${rep.title}</h4>
        <div style="font-size: 0.78rem; color: #94a3b8; margin-bottom: 0.5rem;">${rep.waterBodyName}</div>
        <button class="btn btn-outline btn-sm" style="width: 100%;" onclick="openReportDetailModal('${rep.id}')">
          View Evidence & Discussion
        </button>
      </div>
    `;

    marker.bindPopup(popupHtml);
    STATE.mapMarkers.push(marker);
  });
}

function filterMapMarkers() {
  renderMapMarkers();
}

function locateUser() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        STATE.map.setView([latitude, longitude], 13);
        L.circleMarker([latitude, longitude], {
          radius: 8,
          fillColor: '#06b6d4',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        }).addTo(STATE.map).bindPopup('<strong>You are here</strong>').openPopup();
        showToast('Located your position on GIS map.', 'success');
      },
      (err) => {
        showToast('Geolocation permission denied or unavailable.', 'warning');
      }
    );
  } else {
    showToast('Geolocation is not supported by your browser.', 'error');
  }
}

function reportAtWaterBody(wbId) {
  const wb = STATE.waterBodies.find(w => w.id === wbId);
  if (wb) {
    const select = document.getElementById('form-waterbody');
    if (select) select.value = wb.id;
    document.getElementById('form-latitude').value = wb.coordinates.latitude;
    document.getElementById('form-longitude').value = wb.coordinates.longitude;
    document.getElementById('form-address').value = `${wb.name}, ${wb.city}`;
    switchView('report-view');
  }
}

// ==========================================================================
// 5. POLLUTION REPORT SUBMISSION ENGINE
// ==========================================================================

function populateWaterBodyDropdowns() {
  const selectReport = document.getElementById('form-waterbody');
  const selectFilter = document.getElementById('feed-filter-waterbody');

  if (selectReport) {
    selectReport.innerHTML = '<option value="">-- Select Water Body --</option>';
    STATE.waterBodies.forEach(wb => {
      const opt = document.createElement('option');
      opt.value = wb.id;
      opt.innerText = `${wb.name} (${wb.type} - ${wb.city})`;
      selectReport.appendChild(opt);
    });
  }

  if (selectFilter) {
    selectFilter.innerHTML = '<option value="All">All Water Bodies</option>';
    STATE.waterBodies.forEach(wb => {
      const opt = document.createElement('option');
      opt.value = wb.id;
      opt.innerText = wb.name;
      selectFilter.appendChild(opt);
    });
  }
}

function handleWaterBodySelectionChange() {
  const select = document.getElementById('form-waterbody');
  const wb = STATE.waterBodies.find(w => w.id === select.value);
  if (wb) {
    document.getElementById('form-latitude').value = wb.coordinates.latitude;
    document.getElementById('form-longitude').value = wb.coordinates.longitude;
    document.getElementById('form-address').value = `${wb.name}, ${wb.city}`;
  }
}

function detectGPSLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        document.getElementById('form-latitude').value = pos.coords.latitude.toFixed(5);
        document.getElementById('form-longitude').value = pos.coords.longitude.toFixed(5);
        document.getElementById('form-address').value = `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        showToast('GPS coordinates acquired successfully!', 'success');
      },
      () => showToast('Could not retrieve GPS coordinates.', 'warning')
    );
  }
}

function updateSeverityBadge(sev) {
  // Radio updates reflected in UI
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    STATE.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = document.getElementById('image-preview-display');
      const prompt = document.getElementById('dropzone-prompt');
      img.src = evt.target.result;
      img.style.display = 'block';
      prompt.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }
}

function handleImageUrlInput(url) {
  if (url && url.startsWith('http')) {
    const img = document.getElementById('image-preview-display');
    const prompt = document.getElementById('dropzone-prompt');
    img.src = url;
    img.style.display = 'block';
    prompt.style.display = 'none';
  }
}

async function handleReportSubmission(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-report');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting Report...';

  try {
    const formData = new FormData();
    formData.append('waterBodyId', document.getElementById('form-waterbody').value);
    formData.append('pollutionType', document.getElementById('form-pollution-type').value);
    formData.append('title', document.getElementById('form-title').value);
    formData.append('address', document.getElementById('form-address').value);
    formData.append('latitude', document.getElementById('form-latitude').value);
    formData.append('longitude', document.getElementById('form-longitude').value);
    formData.append('severity', document.querySelector('input[name="severity-radio"]:checked')?.value || 'Moderate');
    formData.append('waterColor', document.getElementById('form-water-color').value);
    formData.append('odor', document.getElementById('form-odor').value);
    formData.append('ph', document.getElementById('form-ph').value);
    formData.append('dissolvedOxygenMgL', document.getElementById('form-do').value);
    formData.append('description', document.getElementById('form-description').value);

    if (STATE.selectedFile) {
      formData.append('evidenceImageFile', STATE.selectedFile);
    } else {
      formData.append('imageUrlFallback', document.getElementById('form-image-url').value);
    }

    const headers = {};
    if (STATE.token) {
      headers['Authorization'] = `Bearer ${STATE.token}`;
    }

    const res = await fetch('/api/reports', {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await res.json();
    if (data.success) {
      showToast('Pollution report submitted and broadcast to community!', 'success');
      document.getElementById('pollution-report-form').reset();
      STATE.selectedFile = null;
      document.getElementById('image-preview-display').style.display = 'none';
      document.getElementById('dropzone-prompt').style.display = 'block';
      
      // Refresh datasets
      await fetchReports();
      await fetchAnalytics();
      renderCommunityFeed();
      renderMapMarkers();
      switchView('community-view');
    } else {
      showToast(data.message || 'Report submission failed.', 'error');
    }
  } catch (err) {
    showToast('Submission error: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Publish Incident Report';
  }
}

// ==========================================================================
// 6. COMMUNITY FEED & REPORTS RENDERING
// ==========================================================================

function renderLandingView() {
  const container = document.getElementById('landing-waterbodies-grid');
  if (!container) return;

  container.innerHTML = STATE.waterBodies.slice(0, 3).map(wb => `
    <div class="report-card">
      <div class="report-image-wrap">
        <img src="${wb.imageUrl}" alt="${wb.name}" loading="lazy">
        <span class="severity-tag ${wb.healthStatus === 'Critical' ? 'critical' : wb.healthStatus === 'Poor' ? 'high' : 'moderate'}">
          ${wb.healthStatus}
        </span>
      </div>
      <div class="report-body">
        <div class="report-water-body"><i class="fa-solid fa-water"></i> ${wb.type} &bull; ${wb.city}</div>
        <h3 class="report-title">${wb.name}</h3>
        <p class="report-desc-preview">${wb.description}</p>
        <div class="report-meta-row">
          <span>DO: <strong>${wb.baselineMetrics.dissolvedOxygenMgL} mg/L</strong></span>
          <span>pH: <strong>${wb.baselineMetrics.ph}</strong></span>
          <span>Reports: <strong>${wb.totalReportsCount || 0}</strong></span>
        </div>
        <div class="report-card-actions">
          <button class="btn btn-outline btn-sm" style="flex: 1;" onclick="reportAtWaterBody('${wb.id}')">
            <i class="fa-solid fa-camera"></i> Report
          </button>
          <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="switchView('map-view')">
            <i class="fa-solid fa-map-location-dot"></i> View on Map
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderCommunityFeed() {
  const container = document.getElementById('community-reports-grid');
  if (!container) return;

  const statusFilter = document.getElementById('feed-filter-status')?.value || 'All';
  const severityFilter = document.getElementById('feed-filter-severity')?.value || 'All';
  const wbFilter = document.getElementById('feed-filter-waterbody')?.value || 'All';
  const search = document.getElementById('feed-search')?.value.toLowerCase().trim() || '';
  const sort = document.getElementById('feed-sort')?.value || 'newest';

  let filtered = [...STATE.reports];

  if (statusFilter !== 'All') {
    filtered = filtered.filter(r => r.status.toLowerCase() === statusFilter.toLowerCase());
  }
  if (severityFilter !== 'All') {
    filtered = filtered.filter(r => r.severity.toLowerCase() === severityFilter.toLowerCase());
  }
  if (wbFilter !== 'All') {
    filtered = filtered.filter(r => r.waterBodyId === wbFilter);
  }
  if (search) {
    filtered = filtered.filter(r =>
      r.title.toLowerCase().includes(search) ||
      r.description.toLowerCase().includes(search) ||
      r.waterBodyName.toLowerCase().includes(search) ||
      (r.location && r.location.address && r.location.address.toLowerCase().includes(search))
    );
  }

  // Sorting
  if (sort === 'severity') {
    filtered.sort((a, b) => (b.severityScore || 0) - (a.severityScore || 0));
  } else if (sort === 'endorsements') {
    filtered.sort((a, b) => (b.endorsements || 0) - (a.endorsements || 0));
  } else {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--card-bg); border-radius: var(--radius-md); border: 1px dashed var(--card-border);">
        <i class="fa-solid fa-water-ladder" style="font-size: 3rem; color: var(--text-dim); margin-bottom: 1rem;"></i>
        <h3>No Pollution Reports Match Your Filter</h3>
        <p style="color: var(--text-muted); margin-bottom: 1rem;">Try clearing your search terms or filter selection.</p>
        <button class="btn btn-outline btn-sm" onclick="clearFeedFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(r => {
    const sevClass = r.severity.toLowerCase();
    const statusClass = 'status-' + r.status.toLowerCase().replace(/\s+/g, '');
    const dateFormatted = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return `
      <div class="report-card">
        <div class="report-image-wrap">
          <img src="${r.evidenceImage}" alt="${r.title}" loading="lazy">
          <span class="severity-tag ${sevClass}">${r.severity}</span>
        </div>
        <div class="report-body">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <div class="report-water-body"><i class="fa-solid fa-water"></i> ${r.waterBodyName}</div>
            <span class="status-badge ${statusClass}">${r.status}</span>
          </div>
          <h3 class="report-title">${r.title}</h3>
          <p class="report-desc-preview">${r.description}</p>
          
          <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.85rem;">
            <span class="badge-partner" style="font-size: 0.72rem; padding: 2px 6px;"><i class="fa-solid fa-eye-dropper"></i> ${r.observations.waterColor}</span>
            <span class="badge-partner" style="font-size: 0.72rem; padding: 2px 6px;"><i class="fa-solid fa-wind"></i> ${r.observations.odor}</span>
          </div>

          <div class="report-meta-row">
            <span>By <strong>${r.reporterName}</strong></span>
            <span>${dateFormatted}</span>
          </div>

          <div class="report-card-actions">
            <button class="btn btn-outline btn-sm" style="flex: 1;" onclick="endorseReport('${r.id}')">
              <i class="fa-solid fa-thumbs-up"></i> Confirm (${r.endorsements || 0})
            </button>
            <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="openReportDetailModal('${r.id}')">
              <i class="fa-solid fa-circle-info"></i> Evidence
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function loadReports() {
  renderCommunityFeed();
}

let searchDebounceTimeout = null;
function debounceSearchReports() {
  clearTimeout(searchDebounceTimeout);
  searchDebounceTimeout = setTimeout(() => {
    renderCommunityFeed();
  }, 250);
}

function clearFeedFilters() {
  document.getElementById('feed-filter-status').value = 'All';
  document.getElementById('feed-filter-severity').value = 'All';
  document.getElementById('feed-filter-waterbody').value = 'All';
  document.getElementById('feed-search').value = '';
  renderCommunityFeed();
}

// ==========================================================================
// 7. REPORT DETAILS MODAL & VERIFICATION / COMMENTS
// ==========================================================================

async function openReportDetailModal(reportId) {
  try {
    const res = await fetch(`/api/reports/${reportId}`);
    const data = await res.json();
    if (!data.success) {
      showToast('Could not load report details.', 'error');
      return;
    }

    const r = data.data;
    STATE.activeReport = r;

    // Populate Modal Elements
    document.getElementById('modal-report-title').innerText = r.title;
    document.getElementById('modal-report-severity').className = `severity-tag ${r.severity.toLowerCase()}`;
    document.getElementById('modal-report-severity').innerText = r.severity;
    document.getElementById('modal-report-image').src = r.evidenceImage;
    document.getElementById('modal-report-waterbody').innerText = r.waterBodyName;
    document.getElementById('modal-report-location').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${r.location.address || 'Geo-Coordinates'}`;
    
    document.getElementById('modal-water-color').innerText = r.observations.waterColor || 'Not Specified';
    document.getElementById('modal-odor').innerText = r.observations.odor || 'None';
    document.getElementById('modal-ph').innerText = r.observations.ph ? `${r.observations.ph} (Lab Checked)` : 'Baseline 7.5';
    document.getElementById('modal-do').innerText = r.observations.dissolvedOxygenMgL ? `${r.observations.dissolvedOxygenMgL} mg/L` : 'Hypoxic Zone';

    document.getElementById('modal-status-badge').className = `status-badge status-${r.status.toLowerCase().replace(/\s+/g, '')}`;
    document.getElementById('modal-status-badge').innerText = r.status;
    document.getElementById('modal-endorse-count').innerText = r.endorsements || 0;

    document.getElementById('modal-report-desc').innerText = r.description;
    document.getElementById('modal-authority-notes').innerText = r.authorityNotes || 'No administrative action notes logged yet.';

    // Populate comments
    renderCommentsList(r.comments || []);

    openModal('report-detail-modal');
  } catch (err) {
    showToast('Failed to load report modal: ' + err.message, 'error');
  }
}

function renderCommentsList(comments) {
  const container = document.getElementById('modal-comments-list');
  if (!container) return;

  if (comments.length === 0) {
    container.innerHTML = `<p style="font-size: 0.82rem; color: var(--text-dim); text-align: center; padding: 0.5rem;">No comments yet. Be the first citizen to confirm or add details.</p>`;
    return;
  }

  container.innerHTML = comments.map(c => `
    <div style="background: rgba(9, 23, 38, 0.6); border: 1px solid var(--card-border); border-radius: var(--radius-sm); padding: 0.65rem 0.85rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
        <span style="font-size: 0.82rem; font-weight: 700; color: ${c.userRole === 'admin' ? '#38bdf8' : '#34d399'};">
          ${c.userName}
        </span>
        <span style="font-size: 0.72rem; color: var(--text-dim);">
          ${new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <p style="font-size: 0.84rem; color: var(--text-main); margin: 0;">${c.comment}</p>
    </div>
  `).join('');
}

async function endorseReport(reportId) {
  if (!STATE.token) {
    showToast('Please sign in or select a demo role to endorse observations.', 'warning');
    openAuthModal();
    return;
  }

  try {
    const res = await fetch(`/api/reports/${reportId}/endorse`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STATE.token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Observation confirmed and endorsed!', 'success');
      await fetchReports();
      renderCommunityFeed();
    } else {
      showToast(data.message || 'Could not endorse.', 'warning');
    }
  } catch (err) {
    showToast('Endorsement error: ' + err.message, 'error');
  }
}

async function endorseActiveReport() {
  if (STATE.activeReport) {
    await endorseReport(STATE.activeReport.id);
    document.getElementById('modal-endorse-count').innerText = (STATE.activeReport.endorsements || 0) + 1;
  }
}

async function postComment() {
  const input = document.getElementById('modal-comment-input');
  const comment = input.value.trim();
  if (!comment) return;

  if (!STATE.token) {
    showToast('Please sign in to post comments.', 'warning');
    openAuthModal();
    return;
  }

  try {
    const res = await fetch(`/api/reports/${STATE.activeReport.id}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STATE.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comment })
    });
    const data = await res.json();
    if (data.success) {
      input.value = '';
      STATE.activeReport.comments = STATE.activeReport.comments || [];
      STATE.activeReport.comments.push(data.data);
      renderCommentsList(STATE.activeReport.comments);
      showToast('Comment published!', 'success');
    } else {
      showToast(data.message || 'Failed to post comment.', 'error');
    }
  } catch (err) {
    showToast('Comment error: ' + err.message, 'error');
  }
}

// ==========================================================================
// 8. WATER BODY DIRECTORY & USER PROFILE
// ==========================================================================

function renderWaterBodiesDirectory() {
  const container = document.getElementById('water-bodies-directory-grid');
  if (!container) return;

  const typeFilter = document.getElementById('directory-filter-type')?.value || 'All';
  const healthFilter = document.getElementById('directory-filter-health')?.value || 'All';
  const search = document.getElementById('directory-search')?.value.toLowerCase().trim() || '';

  let filtered = [...STATE.waterBodies];

  if (typeFilter !== 'All') {
    filtered = filtered.filter(w => w.type.toLowerCase() === typeFilter.toLowerCase());
  }
  if (healthFilter !== 'All') {
    filtered = filtered.filter(w => w.healthStatus.toLowerCase() === healthFilter.toLowerCase());
  }
  if (search) {
    filtered = filtered.filter(w =>
      w.name.toLowerCase().includes(search) ||
      w.city.toLowerCase().includes(search) ||
      w.state.toLowerCase().includes(search)
    );
  }

  container.innerHTML = filtered.map(wb => `
    <div class="report-card">
      <div class="report-image-wrap">
        <img src="${wb.imageUrl}" alt="${wb.name}" loading="lazy">
        <span class="severity-tag ${wb.healthStatus === 'Critical' ? 'critical' : wb.healthStatus === 'Poor' ? 'high' : 'moderate'}">
          ${wb.healthStatus}
        </span>
      </div>
      <div class="report-body">
        <div class="report-water-body"><i class="fa-solid fa-water"></i> ${wb.type} &bull; ${wb.city}, ${wb.state}</div>
        <h3 class="report-title">${wb.name}</h3>
        <p class="report-desc-preview">${wb.description}</p>
        
        <div style="background: rgba(9, 23, 38, 0.7); border: 1px solid var(--card-border); border-radius: var(--radius-sm); padding: 0.65rem; font-size: 0.8rem; margin-bottom: 0.85rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
            <span>Baseline pH:</span> <strong>${wb.baselineMetrics.ph}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
            <span>Dissolved Oxygen:</span> <strong>${wb.baselineMetrics.dissolvedOxygenMgL} mg/L</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Basin Surface:</span> <strong>${wb.basinAreaKm2} km²</strong>
          </div>
        </div>

        <div class="report-card-actions">
          <button class="btn btn-outline btn-sm" style="flex: 1;" onclick="reportAtWaterBody('${wb.id}')">
            <i class="fa-solid fa-camera"></i> Report Incident
          </button>
          <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="switchView('map-view')">
            <i class="fa-solid fa-map"></i> View Map
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function loadWaterBodiesDirectory() {
  renderWaterBodiesDirectory();
}

function renderUserProfile() {
  const user = STATE.currentUser || {
    fullName: 'Priya Sharma (Demo)',
    email: 'priya@earthguard.org',
    role: 'citizen',
    organization: 'Hyderabad Lake Protectors',
    reputationKarma: 340,
    badges: ['River Guardian', 'First Responder', 'Water Inspector']
  };

  document.getElementById('profile-name').innerText = user.fullName;
  document.getElementById('profile-email').innerText = user.email;
  document.getElementById('profile-org').innerText = user.organization || 'Independent Citizen Sentinel';
  document.getElementById('profile-karma').innerText = `${user.reputationKarma || 340} pts`;

  // Render User Reports
  const myReports = STATE.reports.filter(r => r.userId === user.id || r.reporterName === user.fullName);
  const container = document.getElementById('my-reports-list');
  
  if (myReports.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 2rem;">You haven't filed any reports yet. Spot a contaminated water body and submit an observation!</p>`;
    return;
  }

  container.innerHTML = myReports.map(r => `
    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(9, 23, 38, 0.7); border: 1px solid var(--card-border); padding: 0.85rem 1.25rem; border-radius: var(--radius-sm); margin-bottom: 0.75rem;">
      <div>
        <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">${r.title}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">${r.waterBodyName} &bull; ${new Date(r.createdAt).toLocaleDateString()}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span class="status-badge status-${r.status.toLowerCase().replace(/\s+/g, '')}">${r.status}</span>
        <button class="btn btn-outline btn-sm" onclick="openReportDetailModal('${r.id}')">View</button>
      </div>
    </div>
  `).join('');
}

// ==========================================================================
// 9. ADMIN TRIAGE & ANALYTICS CHARTS (CHART.JS)
// ==========================================================================

function renderAdminPanel() {
  const tbody = document.getElementById('admin-reports-table-body');
  if (!tbody) return;

  tbody.innerHTML = STATE.reports.map(r => `
    <tr>
      <td><code>${r.id}</code></td>
      <td><strong>${r.waterBodyName}</strong></td>
      <td><span class="badge-partner" style="font-size: 0.75rem;">${r.pollutionType}</span></td>
      <td><span class="severity-tag ${r.severity.toLowerCase()}" style="position: static; font-size: 0.72rem; padding: 2px 6px;">${r.severity}</span></td>
      <td>${r.reporterName}</td>
      <td style="font-size: 0.8rem; color: var(--text-muted);">${new Date(r.createdAt).toLocaleDateString()}</td>
      <td><span class="status-badge status-${r.status.toLowerCase().replace(/\s+/g, '')}">${r.status}</span></td>
      <td style="text-align: right;">
        <div style="display: inline-flex; gap: 0.35rem;">
          <button class="btn btn-outline btn-sm" onclick="adminUpdateStatus('${r.id}', 'Verified')" title="Verify"><i class="fa-solid fa-check"></i></button>
          <button class="btn btn-outline btn-sm" onclick="adminUpdateStatus('${r.id}', 'Under Investigation')" title="Investigate"><i class="fa-solid fa-magnifying-glass"></i></button>
          <button class="btn btn-primary btn-sm" onclick="adminUpdateStatus('${r.id}', 'Resolved')" title="Mark Resolved"><i class="fa-solid fa-circle-check"></i></button>
          <button class="btn btn-danger btn-sm" onclick="adminDeleteReport('${r.id}')" title="Delete Spam"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function adminUpdateStatus(reportId, newStatus) {
  if (!STATE.token) {
    showToast('Admin token required. Sign in as Admin.', 'warning');
    demoLogin('admin');
    return;
  }

  const authorityNotes = prompt(`Enter official authority action notes for ${newStatus}:`, `Inspection scheduled and remediation underway.`);
  if (authorityNotes === null) return;

  try {
    const res = await fetch(`/api/reports/${reportId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${STATE.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus, authorityNotes })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Report updated to "${newStatus}"!`, 'success');
      await fetchReports();
      renderAdminPanel();
      renderCommunityFeed();
    } else {
      showToast(data.message || 'Update failed.', 'error');
    }
  } catch (err) {
    showToast('Admin update error: ' + err.message, 'error');
  }
}

async function adminDeleteReport(reportId) {
  if (!confirm('Are you sure you want to delete this incident from the database?')) return;

  try {
    const res = await fetch(`/api/reports/${reportId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${STATE.token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Incident deleted.', 'success');
      await fetchReports();
      renderAdminPanel();
      renderCommunityFeed();
    } else {
      showToast(data.message || 'Deletion failed.', 'error');
    }
  } catch (err) {
    showToast('Deletion error: ' + err.message, 'error');
  }
}

function initAnalyticsCharts() {
  if (!STATE.analytics) return;

  const ctxPollution = document.getElementById('chart-pollution-types');
  const ctxSeverity = document.getElementById('chart-severity-levels');

  if (ctxPollution && typeof Chart !== 'undefined') {
    if (STATE.charts.pollution) STATE.charts.pollution.destroy();

    const typesData = STATE.analytics.breakdownByType || {};
    STATE.charts.pollution = new Chart(ctxPollution, {
      type: 'doughnut',
      data: {
        labels: Object.keys(typesData),
        datasets: [{
          data: Object.values(typesData),
          backgroundColor: ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'],
          borderColor: '#0c1c2e',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12 } }
        }
      }
    });
  }

  if (ctxSeverity && typeof Chart !== 'undefined') {
    if (STATE.charts.severity) STATE.charts.severity.destroy();

    const sevData = STATE.analytics.breakdownBySeverity || {};
    STATE.charts.severity = new Chart(ctxSeverity, {
      type: 'bar',
      data: {
        labels: ['Critical', 'High', 'Moderate', 'Low'],
        datasets: [{
          label: 'Incidents Count',
          data: [sevData.Critical || 0, sevData.High || 0, sevData.Moderate || 0, sevData.Low || 0],
          backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#10b981'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
        }
      }
    });
  }
}

function openAddWaterBodyModal() {
  openModal('add-waterbody-modal');
}

async function handleAddWaterBody(e) {
  e.preventDefault();
  if (!STATE.token) {
    showToast('Admin login required.', 'warning');
    demoLogin('admin');
    return;
  }

  const payload = {
    name: document.getElementById('wb-name').value,
    type: document.getElementById('wb-type').value,
    city: document.getElementById('wb-city').value,
    state: document.getElementById('wb-state').value,
    latitude: document.getElementById('wb-lat').value,
    longitude: document.getElementById('wb-lng').value,
    healthStatus: document.getElementById('wb-health').value,
    primaryThreats: [document.getElementById('wb-threats').value || 'Urban Runoff'],
    description: document.getElementById('wb-desc').value
  };

  try {
    const res = await fetch('/api/water-bodies', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STATE.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('New water body registered!', 'success');
      closeModal('add-waterbody-modal');
      await fetchWaterBodies();
      renderWaterBodiesDirectory();
      populateWaterBodyDropdowns();
      renderMapMarkers();
    } else {
      showToast(data.message || 'Failed to add water body.', 'error');
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

function exportDataCSV() {
  window.open('/api/analytics/export', '_blank');
  showToast('Downloading compliance CSV log...', 'info');
}

// ==========================================================================
// 10. MODAL & TOAST UTILITIES
// ==========================================================================

function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add('active');
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove('active');
}

window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'circle-info';
  if (type === 'success') icon = 'circle-check';
  else if (type === 'error') icon = 'triangle-exclamation';
  else if (type === 'warning') icon = 'bell';

  toast.innerHTML = `<i class="fa-solid fa-${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
