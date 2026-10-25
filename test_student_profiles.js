const http = require('http');
const app = require('../server');
const { readJSON } = require('../utils/storage');

async function verifyProfiles() {
  console.log('====================================================');
  console.log('  CAMPUS — Verifying Individual Student Profiles');
  console.log('====================================================\n');

  const students = readJSON('students.json', []);
  const marks = readJSON('marks.json', []);
  const attendance = readJSON('attendance.json', []);
  const complaints = readJSON('complaints.json', []);
  const participations = readJSON('participations.json', []);

  console.log(`Total students in database: ${students.length}`);
  console.log(`Total marks records: ${marks.length}`);
  console.log(`Total attendance sessions: ${attendance.length}`);
  console.log(`Total complaints: ${complaints.length}`);
  console.log(`Total event participations: ${participations.length}\n`);

  const testIds = ['1001', '1002', '1003', '1015', '1105'];
  testIds.forEach(id => {
    const st = students.find(s => s.id === id);
    const stMarks = marks.filter(m => m.studentId === id);
    const avg = stMarks.length > 0 
      ? (stMarks.reduce((acc, m) => acc + m.total, 0) / stMarks.length).toFixed(1)
      : '0.0';
    let attended = 0;
    attendance.forEach(sess => {
      const rec = (sess.records || []).find(r => r.studentId === id);
      if (rec && rec.status === 'Present') attended++;
    });
    const attPct = attendance.length > 0 
      ? ((attended / attendance.length) * 100).toFixed(1)
      : '0.0';
    const stComplaints = complaints.filter(c => c.studentId === id);
    const stPart = participations.filter(p => p.studentId === id && p.participationStatus === 'Participated');
    console.log(`Student ${id} (${st ? st.name : 'Unknown'}):`);
    console.log(`  - Marks: ${stMarks.length} subjects, Avg: ${avg}%`);
    console.log(`  - Attendance: ${attended}/${attendance.length} (${attPct}%)`);
    console.log(`  - Complaints: ${stComplaints.length}`);
    console.log(`  - Verified Participations: ${stPart.length}\n`);
  });

  // Now test live server HTTP endpoints for Student 1105, 1001, and 1003
  const PORT = 3897;
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(PORT, resolve));
  const baseUrl = `http://localhost:${PORT}`;

  try {
    console.log('Testing live HTTP dashboard API responses...\n');

    for (const testId of ['1105', '1001', '1003']) {
      console.log(`--- Testing Student ID: ${testId} ---`);
      // 1. Login
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'student', identifier: testId, password: 'Student@123' })
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok || !loginData.success) {
        throw new Error(`Login failed for student ${testId}: ${JSON.stringify(loginData)}`);
      }
      const cookie = loginRes.headers.get('set-cookie').split(';')[0];
      console.log(`  ✓ Login successful for ${loginData.user.name} (#${loginData.user.id})`);

      // 2. Fetch /api/student/overview
      const overviewRes = await fetch(`${baseUrl}/api/student/overview`, {
        headers: { Cookie: cookie }
      });
      const overviewData = await overviewRes.json();
      if (!overviewRes.ok || !overviewData.success) {
        throw new Error(`Overview fetch failed for ${testId}`);
      }
      const data = overviewData.data;

      console.log(`  ✓ Class Teacher: ${data.classTeacher ? data.classTeacher.name : 'NONE'}`);
      if (!data.classTeacher) {
        throw new Error(`Class Teacher is unassigned for student ${testId}!`);
      }

      console.log(`  ✓ Attendance: ${data.attendance.percentage}% (${data.attendance.classesAttended}/${data.attendance.totalClassesHeld} sessions, missed: ${data.attendance.classesMissed})`);
      if (data.attendance.totalClassesHeld === 0) {
        throw new Error(`Attendance sessions should not be 0 for student ${testId}`);
      }

      console.log(`  ✓ Performance Avg: ${data.performance.percentage}% across ${data.performance.subjectsGradedCount} subjects`);
      if (data.performance.subjectsGradedCount === 0 || data.performance.percentage === null) {
        throw new Error(`Marks should not be empty/null for student ${testId}`);
      }

      console.log(`  ✓ Complaints: ${data.complaints.total} (Pending: ${data.complaints.pending}, Resolved: ${data.complaints.resolved})`);
      console.log(`  ✓ Event Participations: ${data.events.participationCount}`);

      // 3. Fetch /api/student/marks
      const marksRes = await fetch(`${baseUrl}/api/student/marks`, {
        headers: { Cookie: cookie }
      });
      const marksData = await marksRes.json();
      if (!marksRes.ok || !marksData.success) {
        throw new Error(`Marks fetch failed for ${testId}`);
      }
      console.log(`  ✓ /api/student/marks returned ${marksData.marks.length} evaluated subjects:`);
      marksData.marks.forEach(m => {
        console.log(`      ${m.subjectCode} (${m.subjectName}): ${m.total}/${m.maxMarks} (${m.percentage}%) - Faculty: ${m.assignedFaculty}`);
      });

      // 4. Fetch /api/student/attendance
      const attRes = await fetch(`${baseUrl}/api/student/attendance`, {
        headers: { Cookie: cookie }
      });
      const attData = await attRes.json();
      if (!attRes.ok || !attData.success) {
        throw new Error(`Attendance fetch failed for ${testId}`);
      }
      console.log(`  ✓ /api/student/attendance overall: ${attData.overall.percentage}% (${attData.overall.totalAttended}/${attData.overall.totalHeld}), history entries: ${attData.history.length}`);

      // 5. Fetch /api/student/faculty
      const facRes = await fetch(`${baseUrl}/api/student/faculty`, {
        headers: { Cookie: cookie }
      });
      const facData = await facRes.json();
      if (!facRes.ok || !facData.success) {
        throw new Error(`Faculty directory fetch failed for ${testId}`);
      }
      console.log(`  ✓ /api/student/faculty returned ${facData.facultyDirectory.length} assigned subject faculty`);

      console.log('');
    }

    console.log('====================================================');
    console.log('  ALL STUDENT PROFILES VERIFIED SUCCESSFULLY!');
    console.log('====================================================');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

verifyProfiles().catch(err => {
  console.error('Error verifying profiles:', err);
  process.exit(1);
});
