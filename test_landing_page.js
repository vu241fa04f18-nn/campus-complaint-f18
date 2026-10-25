const fs = require('fs');
const http = require('http');
const app = require('../server');

async function testLandingPage() {
  console.log('Testing CAMPUS Landing Page cleanup...');
  const html = fs.readFileSync('public/index.html', 'utf8');

  const forbidden = [
    'demo-credentials-banner',
    'demo-pill',
    'Strong Performer',
    'Moderate Performer',
    'Improvement / Low-Att',
    'Demo Faculty',
    'Student@123',
    'Faculty@123',
    'Mani',
    'Geethika',
    'Abhi',
    'Ananya',
    'Sneha',
    'Rajesh Sharma',
    'Anita Desai',
    '89.8%',
    '75.0%',
    '61.2%',
    '90% Att',
    'All 40 students'
  ];

  let errors = [];
  for (const word of forbidden) {
    if (html.includes(word)) {
      errors.push(`Found forbidden text in index.html: "${word}"`);
    }
  }

  const required = [
    'CAMPUS',
    'Your Campus. Your Voice. Your Change.',
    'Student Portal',
    'Faculty Portal',
    'student-login-form',
    'faculty-login-form',
    'student-identifier',
    'faculty-identifier',
    'student-password',
    'faculty-password',
    'data-fill-role="student"',
    'data-fill-role="faculty"'
  ];

  for (const req of required) {
    if (!html.includes(req)) {
      errors.push(`Missing required element in index.html: "${req}"`);
    }
  }

  if (errors.length > 0) {
    console.error('FAIL:\n' + errors.join('\n'));
    process.exit(1);
  }

  console.log('✓ index.html is clean: no marks, no attendance %, no student/faculty names, no sample credentials.');
  console.log('✓ Required brand logo, tagline, Student Portal card, and Faculty Portal card are present.');

  // Test live server login for both Student and Faculty
  const PORT = 3898;
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(PORT, resolve));
  const baseUrl = `http://localhost:${PORT}`;

  try {
    // 1. Student Login
    const studentRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'student', identifier: '1001', password: 'Student@123' })
    });
    const studentData = await studentRes.json();
    if (!studentRes.ok || !studentData.success) {
      throw new Error('Student login failed');
    }
    const studentCookie = studentRes.headers.get('set-cookie');
    if (!studentCookie || !studentCookie.includes('campus_auth_token')) {
      throw new Error('Student login did not return auth cookie');
    }
    console.log('✓ Student Login Card works correctly (HTTP 200, valid session).');

    // Verify student can access authorized student dashboard API
    const overviewRes = await fetch(`${baseUrl}/api/student/overview`, {
      headers: { Cookie: studentCookie.split(';')[0] }
    });
    const overviewData = await overviewRes.json();
    if (!overviewRes.ok || !overviewData.success) {
      throw new Error('Student overview fetch failed');
    }
    const studentProfile = overviewData.data.profile;
    console.log(`✓ Student Dashboard securely serves authenticated data for ${studentProfile.name} (ID: ${studentProfile.id}).`);

    // Verify student cannot access faculty API
    const studentAsFacRes = await fetch(`${baseUrl}/api/faculty/profile`, {
      headers: { Cookie: studentCookie.split(';')[0] }
    });
    if (studentAsFacRes.status !== 403) {
      throw new Error('Student was not blocked from faculty profile');
    }
    console.log('✓ Role boundary verified: Student cannot access Faculty dashboard/APIs (HTTP 403).');

    // 2. Faculty Login
    const facultyRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'faculty', identifier: 'FAC-201', password: 'Faculty@123' })
    });
    const facultyData = await facultyRes.json();
    if (!facultyRes.ok || !facultyData.success) {
      throw new Error('Faculty login failed');
    }
    const facultyCookie = facultyRes.headers.get('set-cookie');
    if (!facultyCookie || !facultyCookie.includes('campus_auth_token')) {
      throw new Error('Faculty login did not return auth cookie');
    }
    console.log('✓ Faculty Login Card works correctly (HTTP 200, valid session).');

    // Verify faculty can access faculty profile API
    const facProfileRes = await fetch(`${baseUrl}/api/faculty/profile`, {
      headers: { Cookie: facultyCookie.split(';')[0] }
    });
    const facProfileData = await facProfileRes.json();
    if (!facProfileRes.ok || !facProfileData.success) {
      throw new Error('Faculty profile fetch failed');
    }
    console.log(`✓ Faculty Dashboard securely serves authorized classes for ${facProfileData.faculty.name} (${facProfileData.faculty.id}).`);

    // Verify faculty cannot access student API
    const facAsStudentRes = await fetch(`${baseUrl}/api/student/overview`, {
      headers: { Cookie: facultyCookie.split(';')[0] }
    });
    if (facAsStudentRes.status !== 403) {
      throw new Error('Faculty was not blocked from student overview');
    }
    console.log('✓ Role boundary verified: Faculty cannot access Student dashboard/APIs (HTTP 403).');

    console.log('\nALL LANDING PAGE & LOGIN TESTS PASSED SUCCESSFULLY!');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

testLandingPage().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
