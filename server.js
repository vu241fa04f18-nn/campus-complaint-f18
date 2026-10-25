const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const { seed } = require('./utils/seed');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security headers (basic hardening without requiring extra deps)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data exists, otherwise auto-seed
const requiredFiles = ['students.json', 'faculty.json', 'branches.json', 'subjects.json'];
const dataDir = path.join(__dirname, 'data');
const isMissingData = !fs.existsSync(dataDir) || requiredFiles.some(f => !fs.existsSync(path.join(dataDir, f)));
if (isMissingData) {
  console.log('Initial setup detected: auto-seeding sample demo data...');
  seed();
}

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/common', require('./routes/common.routes'));
app.use('/api/student', require('./routes/student.routes'));
app.use('/api/faculty', require('./routes/faculty.routes'));

// Fallback HTML navigation routes
app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student.html'));
});

app.get('/faculty', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'faculty.html'));
});

// 404 handler for unknown API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found.' });
  }
  next();
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected error occurred on the server.'
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('====================================================');
    console.log(`  CAMPUS — College Student and Faculty Portal`);
    console.log(`  "Your Campus. Your Voice. Your Change."`);
    console.log('====================================================');
    console.log(`  Server running at: http://localhost:${PORT}`);
    console.log('');
    console.log('  Demo Student Accounts (Class: CSE Year 3, Sem 5, Section 1 - 40 Students):');
    console.log('    Mani     (ID: 1001) | Email: mani@demo.campus.edu     | Pass: Student@123 (Strong: 89.8%, 90% Att)');
    console.log('    Geethika (ID: 1002) | Email: geethika@demo.campus.edu | Pass: Student@123 (Top: 94.8%, 100% Att)');
    console.log('    Abhi     (ID: 1003) | Email: abhi@demo.campus.edu     | Pass: Student@123 (Improvement: 61.2%, 65% Att, 0 Part)');
    console.log('    Ananya   (ID: 1015) | Email: ananyarao@demo.campus.edu| Pass: Student@123 (Moderate: 75.0%, 85% Att)');
    console.log('    Sneha    (ID: 1035) | Email: snehabhatt@demo.campus.edu| Pass: Student@123 (50.2% Marks, 85% Att)');
    console.log('    [All IDs from 1001 to 1040 active with individual records! Password: Student@123]');
    console.log('');
    console.log('  Demo Faculty Accounts:');
    console.log('    Prof. Rajesh Sharma (ID: FAC-201) | Email: rajesh.sharma@demo.campus.edu | Pass: Faculty@123 (Class Teacher & CS301)');
    console.log('    Prof. Anita Desai   (ID: FAC-202) | Email: anita.desai@demo.campus.edu   | Pass: Faculty@123 (CS302 & CS303)');
    console.log('    Prof. Suresh Reddy  (ID: FAC-204) | Email: suresh.reddy@demo.campus.edu  | Pass: Faculty@123 (CS304)');
    console.log('    Prof. K. Meenakshi  (ID: FAC-205) | Email: k.meenakshi@demo.campus.edu   | Pass: Faculty@123 (CS305)');
    console.log('    Prof. Vikram Rao    (ID: FAC-203) | Email: vikram.rao@demo.campus.edu     | Pass: Faculty@123 (ECE)');
    console.log('====================================================');
  });
}

module.exports = app;
