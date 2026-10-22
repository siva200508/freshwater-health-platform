const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'freshwater_guard_jwt_secret_key_2026_unep_wwf';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Directories setup
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer Storage Configuration for Evidence Photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'evidence-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 } // 8MB limit
});

// Serve Static Frontend and Uploads
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

// Helper Functions for Data Persistence
const readData = (fileName) => {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error(`Error reading ${fileName}:`, err);
    return [];
  }
};

const writeData = (fileName, data) => {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${fileName}:`, err);
    return false;
  }
};

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No bearer token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Session token invalid or expired.' });
    }
    req.user = decodedUser;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Admin privileges required.' });
  }
  next();
};

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// Register New User
app.post('/api/auth/register', (req, res) => {
  try {
    const { fullName, email, password, organization, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const users = readData('users.json');
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser = {
      id: 'usr-' + Date.now(),
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role === 'admin' ? 'admin' : 'citizen',
      organization: organization || 'Independent Citizen Scientist',
      reputationKarma: 50,
      badges: ['Eco Novice'],
      submittedReportsCount: 0,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeData('users.json', users);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, fullName: newUser.fullName, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userSafe } = newUser;
    res.status(201).json({
      success: true,
      message: 'Citizen Scientist registration successful.',
      token,
      user: userSafe
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration server error: ' + err.message });
  }
});

// Login User
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const users = readData('users.json');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const valid = bcrypt.compareSync(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userSafe } = user;
    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: userSafe
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login server error: ' + err.message });
  }
});

// Current User Profile & Reports
app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const users = readData('users.json');
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const reports = readData('reports.json');
    const userReports = reports.filter(r => r.userId === user.id);

    const { passwordHash: _, ...userSafe } = user;
    res.json({
      success: true,
      user: {
        ...userSafe,
        submittedReportsCount: userReports.length,
        reports: userReports
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Profile fetch error: ' + err.message });
  }
});

// ==========================================
// 2. WATER BODY MONITORING ENDPOINTS
// ==========================================

// Get All Water Bodies
app.get('/api/water-bodies', (req, res) => {
  try {
    const { type, healthStatus, search } = req.query;
    let waterBodies = readData('water-bodies.json');
    const reports = readData('reports.json');

    // Attach real-time report stats to each water body
    waterBodies = waterBodies.map(wb => {
      const wbReports = reports.filter(r => r.waterBodyId === wb.id);
      return {
        ...wb,
        totalReportsCount: wbReports.length,
        criticalReportsCount: wbReports.filter(r => r.severity === 'Critical' || r.severity === 'High').length,
        latestReportDate: wbReports.length > 0 ? wbReports[wbReports.length - 1].createdAt : null
      };
    });

    if (type && type !== 'All') {
      waterBodies = waterBodies.filter(w => w.type.toLowerCase() === type.toLowerCase());
    }
    if (healthStatus && healthStatus !== 'All') {
      waterBodies = waterBodies.filter(w => w.healthStatus.toLowerCase() === healthStatus.toLowerCase());
    }
    if (search) {
      const s = search.toLowerCase();
      waterBodies = waterBodies.filter(w =>
        w.name.toLowerCase().includes(s) ||
        w.city.toLowerCase().includes(s) ||
        w.state.toLowerCase().includes(s)
      );
    }

    res.json({ success: true, count: waterBodies.length, data: waterBodies });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve water bodies: ' + err.message });
  }
});

// Get Single Water Body with Details & Reports
app.get('/api/water-bodies/:id', (req, res) => {
  try {
    const waterBodies = readData('water-bodies.json');
    const wb = waterBodies.find(w => w.id === req.params.id);
    if (!wb) {
      return res.status(404).json({ success: false, message: 'Water body not found.' });
    }

    const reports = readData('reports.json');
    const associatedReports = reports.filter(r => r.waterBodyId === wb.id);

    res.json({
      success: true,
      data: {
        ...wb,
        reports: associatedReports,
        stats: {
          totalReports: associatedReports.length,
          verifiedReports: associatedReports.filter(r => r.status === 'Verified').length,
          resolvedReports: associatedReports.filter(r => r.status === 'Resolved').length
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch water body: ' + err.message });
  }
});

// Admin: Add New Water Body
app.post('/api/water-bodies', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, type, city, state, country, latitude, longitude, basinAreaKm2, healthStatus, ph, dissolvedOxygenMgL, turbidityNtu, primaryThreats, description, imageUrl } = req.body;

    if (!name || !type || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Name, type, latitude, and longitude are required.' });
    }

    const waterBodies = readData('water-bodies.json');
    const newWb = {
      id: 'wb-' + String(waterBodies.length + 1).padStart(3, '0'),
      name: name.trim(),
      type: type || 'Lake',
      city: city || 'Unknown City',
      state: state || 'Unknown State',
      country: country || 'India',
      coordinates: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      basinAreaKm2: basinAreaKm2 ? parseFloat(basinAreaKm2) : 10.0,
      healthStatus: healthStatus || 'Moderate',
      baselineMetrics: {
        ph: ph ? parseFloat(ph) : 7.2,
        dissolvedOxygenMgL: dissolvedOxygenMgL ? parseFloat(dissolvedOxygenMgL) : 5.0,
        turbidityNtu: turbidityNtu ? parseFloat(turbidityNtu) : 25.0,
        bodMgL: 10.0,
        temperatureC: 25.0
      },
      primaryThreats: Array.isArray(primaryThreats) ? primaryThreats : (primaryThreats ? [primaryThreats] : ['Urban Runoff']),
      description: description || 'Monitored freshwater ecosystem.',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date().toISOString()
    };

    waterBodies.push(newWb);
    writeData('water-bodies.json', waterBodies);

    res.status(201).json({ success: true, message: 'New water body registered successfully.', data: newWb });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to register water body: ' + err.message });
  }
});

// ==========================================
// 3. COMMUNITY POLLUTION REPORTING ENDPOINTS
// ==========================================

// Get All Reports (with rich filtering & search)
app.get('/api/reports', (req, res) => {
  try {
    const { waterBodyId, status, severity, pollutionType, search, sort } = req.query;
    let reports = readData('reports.json');

    if (waterBodyId && waterBodyId !== 'All') {
      reports = reports.filter(r => r.waterBodyId === waterBodyId);
    }
    if (status && status !== 'All') {
      reports = reports.filter(r => r.status.toLowerCase() === status.toLowerCase());
    }
    if (severity && severity !== 'All') {
      reports = reports.filter(r => r.severity.toLowerCase() === severity.toLowerCase());
    }
    if (pollutionType && pollutionType !== 'All') {
      reports = reports.filter(r => r.pollutionType.toLowerCase() === pollutionType.toLowerCase());
    }
    if (search) {
      const s = search.toLowerCase();
      reports = reports.filter(r =>
        r.title.toLowerCase().includes(s) ||
        r.description.toLowerCase().includes(s) ||
        r.waterBodyName.toLowerCase().includes(s) ||
        (r.location && r.location.address && r.location.address.toLowerCase().includes(s))
      );
    }

    // Sort order (default: newest first)
    if (sort === 'severity') {
      reports.sort((a, b) => (b.severityScore || 0) - (a.severityScore || 0));
    } else if (sort === 'endorsements') {
      reports.sort((a, b) => (b.endorsements || 0) - (a.endorsements || 0));
    } else {
      reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ success: true, count: reports.length, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch reports: ' + err.message });
  }
});

// Get Single Report by ID
app.get('/api/reports/:id', (req, res) => {
  try {
    const reports = readData('reports.json');
    const report = reports.find(r => r.id === req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Pollution report not found.' });
    }

    const comments = readData('comments.json').filter(c => c.reportId === report.id);
    const waterBodies = readData('water-bodies.json');
    const waterBody = waterBodies.find(w => w.id === report.waterBodyId);

    res.json({
      success: true,
      data: {
        ...report,
        comments,
        waterBody: waterBody || null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch report details: ' + err.message });
  }
});

// Submit New Pollution Report
app.post('/api/reports', upload.single('evidenceImageFile'), (req, res) => {
  try {
    let authUser = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        authUser = jwt.verify(token, JWT_SECRET);
      } catch (e) {
        // Continue as anonymous/guest reporter if invalid token
      }
    }

    const {
      waterBodyId,
      title,
      pollutionType,
      severity,
      description,
      address,
      latitude,
      longitude,
      waterColor,
      odor,
      turbidity,
      ph,
      dissolvedOxygenMgL,
      imageUrlFallback
    } = req.body;

    if (!title || !description || !pollutionType) {
      return res.status(400).json({ success: false, message: 'Title, pollution type, and description are required.' });
    }

    const waterBodies = readData('water-bodies.json');
    let matchedWb = waterBodies.find(w => w.id === waterBodyId);
    let wbName = matchedWb ? matchedWb.name : 'Unregistered Water Body';

    // Map severity score
    const severityMap = { Low: 1, Moderate: 3, High: 4, Critical: 5 };
    const sevString = severity || 'Moderate';
    const severityScore = severityMap[sevString] || 3;

    // Handle evidence image (uploaded file or URL)
    let finalImageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
    if (req.file) {
      finalImageUrl = '/uploads/' + req.file.filename;
    } else if (imageUrlFallback && imageUrlFallback.trim()) {
      finalImageUrl = imageUrlFallback.trim();
    }

    const reports = readData('reports.json');
    const newReportId = 'rep-' + String(reports.length + 1).padStart(3, '0');

    const newReport = {
      id: newReportId,
      waterBodyId: matchedWb ? matchedWb.id : 'wb-custom',
      waterBodyName: wbName,
      userId: authUser ? authUser.id : 'usr-anonymous',
      reporterName: authUser ? authUser.fullName : (req.body.reporterName || 'Citizen Sentinel'),
      title: title.trim(),
      pollutionType: pollutionType,
      severity: sevString,
      severityScore,
      description: description.trim(),
      location: {
        address: address || (matchedWb ? `${matchedWb.name}, ${matchedWb.city}` : 'Geo-Tagged Location'),
        latitude: latitude ? parseFloat(latitude) : (matchedWb ? matchedWb.coordinates.latitude : 17.42),
        longitude: longitude ? parseFloat(longitude) : (matchedWb ? matchedWb.coordinates.longitude : 78.47)
      },
      observations: {
        waterColor: waterColor || 'Murky Brown',
        odor: odor || 'Noticeable Odor',
        turbidity: turbidity || 'Slightly Murky',
        ph: ph ? parseFloat(ph) : null,
        dissolvedOxygenMgL: dissolvedOxygenMgL ? parseFloat(dissolvedOxygenMgL) : null
      },
      evidenceImage: finalImageUrl,
      status: 'Pending',
      endorsements: 1,
      endorsedByUserIds: authUser ? [authUser.id] : [],
      authorityNotes: 'Queued for verification by Environmental Task Force.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    reports.unshift(newReport);
    writeData('reports.json', reports);

    // Update user stats & karma
    if (authUser) {
      const users = readData('users.json');
      const uIndex = users.findIndex(u => u.id === authUser.id);
      if (uIndex !== -1) {
        users[uIndex].submittedReportsCount = (users[uIndex].submittedReportsCount || 0) + 1;
        users[uIndex].reputationKarma = (users[uIndex].reputationKarma || 0) + 25;
        writeData('users.json', users);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Pollution incident report filed successfully and placed in community feed.',
      data: newReport
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Report submission failed: ' + err.message });
  }
});

// Community Endorsement (+1 Confirm Observation)
app.post('/api/reports/:id/endorse', authenticateToken, (req, res) => {
  try {
    const reports = readData('reports.json');
    const index = reports.findIndex(r => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const report = reports[index];
    report.endorsedByUserIds = report.endorsedByUserIds || [];

    if (report.endorsedByUserIds.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: 'You have already verified/endorsed this observation.' });
    }

    report.endorsedByUserIds.push(req.user.id);
    report.endorsements = (report.endorsements || 0) + 1;

    // Auto-promote to "Verified" if 3 or more endorsements
    if (report.endorsements >= 3 && report.status === 'Pending') {
      report.status = 'Verified';
      report.authorityNotes = 'Community-verified by multiple citizen observers.';
    }

    reports[index] = report;
    writeData('reports.json', reports);

    // Award karma to reporter
    const users = readData('users.json');
    const reporter = users.find(u => u.id === report.userId);
    if (reporter) {
      reporter.reputationKarma = (reporter.reputationKarma || 0) + 5;
      writeData('users.json', users);
    }

    res.json({
      success: true,
      message: 'Observation endorsed successfully!',
      endorsements: report.endorsements,
      status: report.status
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Endorsement error: ' + err.message });
  }
});

// Post Comment on Report
app.post('/api/reports/:id/comments', authenticateToken, (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty.' });
    }

    const reports = readData('reports.json');
    const reportExists = reports.some(r => r.id === req.params.id);
    if (!reportExists) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const comments = readData('comments.json');
    const newComment = {
      id: 'com-' + Date.now(),
      reportId: req.params.id,
      userId: req.user.id,
      userName: req.user.fullName + (req.user.role === 'admin' ? ' (Admin)' : ''),
      userRole: req.user.role,
      comment: comment.trim(),
      createdAt: new Date().toISOString()
    };

    comments.push(newComment);
    writeData('comments.json', comments);

    res.status(201).json({ success: true, message: 'Comment published.', data: newComment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to post comment: ' + err.message });
  }
});

// ==========================================
// 4. ADMIN TRIAGE & MANAGEMENT ENDPOINTS
// ==========================================

// Update Report Status & Authority Notes
app.patch('/api/reports/:id/status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { status, authorityNotes } = req.body;
    const validStatuses = ['Pending', 'Verified', 'Under Investigation', 'Resolved', 'Dismissed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
    }

    const reports = readData('reports.json');
    const index = reports.findIndex(r => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    reports[index].status = status;
    if (authorityNotes) {
      reports[index].authorityNotes = authorityNotes.trim();
    }
    reports[index].updatedAt = new Date().toISOString();

    writeData('reports.json', reports);

    res.json({
      success: true,
      message: `Report status updated to ${status}.`,
      data: reports[index]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Admin status update failed: ' + err.message });
  }
});

// Delete False or Spam Report
app.delete('/api/reports/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    let reports = readData('reports.json');
    const exists = reports.some(r => r.id === req.params.id);
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    reports = reports.filter(r => r.id !== req.params.id);
    writeData('reports.json', reports);

    res.json({ success: true, message: 'Report removed from database.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Report deletion failed: ' + err.message });
  }
});

// ==========================================
// 5. ANALYTICS & EXPORT ENDPOINTS
// ==========================================

// Analytics Summary
app.get('/api/analytics/summary', (req, res) => {
  try {
    const waterBodies = readData('water-bodies.json');
    const reports = readData('reports.json');
    const users = readData('users.json');

    // Breakdown by pollution type
    const byType = {};
    // Breakdown by severity
    const bySeverity = { Critical: 0, High: 0, Moderate: 0, Low: 0 };
    // Breakdown by status
    const byStatus = { Pending: 0, Verified: 0, 'Under Investigation': 0, Resolved: 0, Dismissed: 0 };

    reports.forEach(r => {
      byType[r.pollutionType] = (byType[r.pollutionType] || 0) + 1;
      if (bySeverity[r.severity] !== undefined) bySeverity[r.severity]++;
      if (byStatus[r.status] !== undefined) byStatus[r.status]++;
    });

    res.json({
      success: true,
      data: {
        totalWaterBodies: waterBodies.length,
        totalReports: reports.length,
        verifiedIncidents: (byStatus['Verified'] || 0) + (byStatus['Resolved'] || 0),
        resolvedIncidents: byStatus['Resolved'] || 0,
        registeredCitizens: users.length,
        breakdownByType: byType,
        breakdownBySeverity: bySeverity,
        breakdownByStatus: byStatus
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Analytics calculation error: ' + err.message });
  }
});

// CSV Export for Regulatory Compliance
app.get('/api/analytics/export', (req, res) => {
  try {
    const reports = readData('reports.json');
    const headers = ['Report ID', 'Water Body', 'Reporter', 'Pollution Type', 'Severity', 'Status', 'Endorsements', 'Date Reported', 'Coordinates', 'Description'];

    const rows = reports.map(r => [
      `"${r.id}"`,
      `"${r.waterBodyName.replace(/"/g, '""')}"`,
      `"${r.reporterName.replace(/"/g, '""')}"`,
      `"${r.pollutionType}"`,
      `"${r.severity}"`,
      `"${r.status}"`,
      r.endorsements || 0,
      `"${r.createdAt}"`,
      `"${r.location ? `${r.location.latitude},${r.location.longitude}` : ''}"`,
      `"${r.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="freshwater-pollution-reports.csv"');
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, message: 'CSV export error: ' + err.message });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Freshwater Body Health Monitoring Platform API',
    version: '1.0.0',
    collaborators: ['Unified Mentor', 'UNEP SDG 6.3.2', 'WWF Freshwater Practice', 'Global Water Watch']
  });
});

// Wildcard fallback for frontend routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`🌊 Freshwater Body Health Monitoring Platform Server Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🌍 Aligned with UNEP, WWF, Global Water Watch & Unified Mentor`);
  console.log(`================================================================`);
});
