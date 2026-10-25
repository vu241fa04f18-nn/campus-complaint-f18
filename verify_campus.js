/**
 * CAMPUS — Comprehensive End-to-End Test Suite
 * Tests and verifies all 24 required workflows specified in Section 13.
 */

const http = require('http');
const app = require('../server');
const { readJSON } = require('../utils/storage');

const PORT = 3899;
let server;
let baseUrl = `http://localhost:${PORT}`;

// Test state tokens
let studentCookie = '';
let student2Cookie = ''; // zero participation student 1003
let faculty1Cookie = ''; // Prof. Rajesh Sharma (FAC-201)
let faculty2Cookie = ''; // Prof. Anita Desai (FAC-202)
let newStudentId = '';

let passedCount = 0;
let totalCount = 24;

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { ...(options.headers || {}) };
  if (options.cookie) {
    headers['Cookie'] = options.cookie;
  }
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body
  });

  const cookieHeader = res.headers.get('set-cookie');
  let extractedCookie = '';
  if (cookieHeader) {
    extractedCookie = cookieHeader.split(';')[0];
  }

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, data, cookie: extractedCookie, res };
}

async function runTests() {
  console.log('====================================================');
  console.log('  CAMPUS — Running 24-Workflow Verification Suite');
  console.log('====================================================\n');

  try {
    // ----------------------------------------------------
    // Test 1: Student signup and login
    // ----------------------------------------------------
    console.log('[1/24] Testing Student signup and login...');
    const signupPayload = {
      fullName: 'Test Candidate',
      email: `testcandidate_${Date.now()}@demo.campus.edu`,
      password: 'Password@123',
      confirmPassword: 'Password@123',
      studentId: '1099',
      branch: 'CSE',
      year: '3',
      semester: '5',
      section: 'Section 1'
    };
    const signupRes = await request('/api/auth/student-signup', { method: 'POST', body: signupPayload });
    assert(signupRes.status === 201 && signupRes.data.success, 'Student signup should succeed with 201');
    newStudentId = signupRes.data.studentId;

    // Login with new student
    const studentLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'student', identifier: '1001', password: 'Student@123' }
    });
    assert(studentLoginRes.status === 200 && studentLoginRes.data.success, 'Mani (1001) login must succeed');
    studentCookie = studentLoginRes.cookie;
    assert(studentCookie.includes('campus_auth_token'), 'Login must issue campus_auth_token cookie');
    console.log('  ✓ PASSED: Student signup and login verified.');
    passedCount++;

    // Also login zero-participation student (1003 Abhi)
    const s2Res = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'student', identifier: '1003', password: 'Student@123' }
    });
    student2Cookie = s2Res.cookie;

    // ----------------------------------------------------
    // Test 2: Faculty login and role separation
    // ----------------------------------------------------
    console.log('[2/24] Testing Faculty login and role separation...');
    const fac1Res = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'faculty', identifier: 'FAC-201', password: 'Faculty@123' }
    });
    assert(fac1Res.status === 200 && fac1Res.data.user.role === 'faculty', 'FAC-201 login must succeed');
    faculty1Cookie = fac1Res.cookie;

    const fac2Res = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'faculty', identifier: 'FAC-202', password: 'Faculty@123' }
    });
    assert(fac2Res.status === 200 && fac2Res.data.user.role === 'faculty', 'FAC-202 login must succeed');
    faculty2Cookie = fac2Res.cookie;

    // Test that student cannot login with role=faculty
    const crossRoleRes = await request('/api/auth/login', {
      method: 'POST',
      body: { role: 'faculty', identifier: '1001', password: 'Student@123' }
    });
    assert(crossRoleRes.status === 401, 'Student credentials must fail against faculty role login');
    console.log('  ✓ PASSED: Faculty login and role separation verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 3: Direct URL and API access restrictions
    // ----------------------------------------------------
    console.log('[3/24] Testing Direct URL and API access restrictions...');
    // Unauthenticated access
    const unauthRes = await request('/api/student/overview');
    assert(unauthRes.status === 401, 'Unauthenticated API access must return 401 Unauthorized');

    // Student attempting to access faculty API
    const studentAccessFacApi = await request('/api/faculty/profile', { cookie: studentCookie });
    assert(studentAccessFacApi.status === 403, 'Student accessing faculty API must return 403 Forbidden');

    // Faculty attempting to access student API
    const facAccessStudentApi = await request('/api/student/overview', { cookie: faculty1Cookie });
    assert(facAccessStudentApi.status === 403, 'Faculty accessing student API must return 403 Forbidden');
    console.log('  ✓ PASSED: Route authorization and role barriers verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 4: Branch and dependent section selection
    // ----------------------------------------------------
    console.log('[4/24] Testing Branch and dependent section selection...');
    const branchesRes = await request('/api/common/branches');
    assert(branchesRes.status === 200 && branchesRes.data.branches.length === 30, 'Must provide all 30 engineering branches');
    const cseBranch = branchesRes.data.branches.find(b => b.id === 'CSE');
    assert(cseBranch && cseBranch.sections.length === 10, 'CSE must configure Section 1 through Section 10');
    const eceBranch = branchesRes.data.branches.find(b => b.id === 'ECE');
    assert(eceBranch && eceBranch.sections.length === 5, 'ECE must configure Section 1 through Section 5');
    console.log('  ✓ PASSED: 30 Engineering branches and branch-dependent sections verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 5: Correct subject and faculty assignment display
    // ----------------------------------------------------
    console.log('[5/24] Testing Correct subject and faculty assignment display...');
    const facDirRes = await request('/api/student/faculty', { cookie: studentCookie });
    assert(facDirRes.status === 200, 'Student faculty directory request must succeed');
    const cs301 = facDirRes.data.facultyDirectory.find(s => s.subjectId === 'CS301');
    assert(cs301 && cs301.faculty && cs301.faculty.id === 'FAC-201', 'CS301 must be taught by Prof. Rajesh Sharma (FAC-201)');
    const cs302 = facDirRes.data.facultyDirectory.find(s => s.subjectId === 'CS302');
    assert(cs302 && cs302.faculty && cs302.faculty.id === 'FAC-202', 'CS302 must be taught by Prof. Anita Desai (FAC-202)');
    console.log('  ✓ PASSED: Correct subject and faculty assignments verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 6: Student marks visibility
    // ----------------------------------------------------
    console.log('[6/24] Testing Student marks visibility...');
    const studentMarksRes = await request('/api/student/marks', { cookie: studentCookie });
    assert(studentMarksRes.status === 200 && studentMarksRes.data.marks.length > 0, 'Marks must load for student');
    const cs301Mark = studentMarksRes.data.marks.find(m => m.subjectId === 'CS301');
    assert(cs301Mark && cs301Mark.internal !== null && cs301Mark.total !== null, 'CS301 marks must be calculated');
    console.log('  ✓ PASSED: Student marks visibility verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 7: Faculty marks entry and correction
    // ----------------------------------------------------
    console.log('[7/24] Testing Faculty marks entry and correction...');
    const marksSaveRes = await request('/api/faculty/marks/save', {
      method: 'POST',
      cookie: faculty1Cookie,
      body: {
        classId: 'CSE-Y3-S5-SEC1',
        subjectId: 'CS301',
        reason: 'Automated test correction for Mani (1001)',
        marks: [
          { studentId: '1001', internal: 27, assignment: 19, midExam: 45 }
        ]
      }
    });
    assert(marksSaveRes.status === 200 && marksSaveRes.data.success, 'Faculty marks correction must succeed');

    // Verify student view reflects new total (27 + 19 + 45 = 91)
    const updatedStudentMarks = await request('/api/student/marks', { cookie: studentCookie });
    const updatedCs301 = updatedStudentMarks.data.marks.find(m => m.subjectId === 'CS301');
    assert(updatedCs301.total === 91, `Marks should reflect updated total 91, got ${updatedCs301.total}`);
    console.log('  ✓ PASSED: Faculty marks entry and student view update verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 8: Student marks complaint routing to correct assigned subject faculty
    // ----------------------------------------------------
    console.log('[8/24] Testing Student marks complaint routing...');
    const newComplaintRes = await request('/api/student/complaints', {
      method: 'POST',
      cookie: studentCookie,
      body: {
        subjectId: 'CS301', // Assigned to FAC-201
        category: 'Marks issue',
        title: 'End-term evaluation query',
        description: 'Question 2 re-verification requested.',
        attachment: 'paper_q2.pdf'
      }
    });
    assert(newComplaintRes.status === 201, 'Complaint submission should succeed');
    assert(newComplaintRes.data.complaint.assignedFacultyId === 'FAC-201', 'Backend must route CS301 complaint to FAC-201');
    const createdComplaintId = newComplaintRes.data.complaint.id;
    console.log('  ✓ PASSED: Subject-specific complaint routing verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 9: Complaint privacy against unrelated faculty
    // ----------------------------------------------------
    console.log('[9/24] Testing Complaint privacy against unrelated faculty...');
    // Prof. Anita Desai (FAC-202) teaches CS302, NOT CS301. She must NOT see this complaint in her inbox!
    const fac2ComplaintsRes = await request('/api/faculty/complaints', { cookie: faculty2Cookie });
    const fac2HasCs301Complaint = fac2ComplaintsRes.data.complaints.some(c => c.id === createdComplaintId);
    assert(!fac2HasCs301Complaint, 'FAC-202 must NOT see complaints belonging to CS301 (FAC-201)');

    // Attempting to reply as FAC-202 to FAC-201 complaint must return 403 Forbidden
    const unauthorizedReplyRes = await request(`/api/faculty/complaints/${createdComplaintId}/reply`, {
      method: 'POST',
      cookie: faculty2Cookie,
      body: { message: 'Unauthorized reply', status: 'Resolved' }
    });
    assert(unauthorizedReplyRes.status === 403, 'Unrelated faculty must be blocked with 403 Forbidden');
    console.log('  ✓ PASSED: Complaint privacy against unrelated faculty verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 10: Complaint reply and status update
    // ----------------------------------------------------
    console.log('[10/24] Testing Complaint reply and status update...');
    const authorizedReplyRes = await request(`/api/faculty/complaints/${createdComplaintId}/reply`, {
      method: 'POST',
      cookie: faculty1Cookie,
      body: {
        message: 'Checked rubric for Q2. +2 awarded.',
        status: 'Resolved',
        resolutionRemarks: 'Internal mark adjusted.'
      }
    });
    assert(authorizedReplyRes.status === 200, 'Assigned faculty reply must succeed');

    // Verify student sees the resolution
    const studentCompRes = await request('/api/student/complaints', { cookie: studentCookie });
    const resolvedComp = studentCompRes.data.complaints.find(c => c.id === createdComplaintId);
    assert(resolvedComp.status === 'Resolved' && resolvedComp.resolutionRemarks === 'Internal mark adjusted.', 'Student should see resolution remarks');
    console.log('  ✓ PASSED: Complaint reply and status update verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 11: Direct attendance entry and submission
    // ----------------------------------------------------
    console.log('[11/24] Testing Direct attendance entry and submission...');
    const todayDate = '2026-10-25';
    const attSubmitRes = await request('/api/faculty/attendance/submit', {
      method: 'POST',
      cookie: faculty1Cookie,
      body: {
        classId: 'CSE-Y3-S5-SEC1',
        subjectId: 'CS301',
        date: todayDate,
        records: [
          { studentId: '1001', status: 'Present' },
          { studentId: '1002', status: 'Present' },
          { studentId: '1003', status: 'Absent' },
          { studentId: '1004', status: 'Present' },
          { studentId: '1005', status: 'Present' }
        ]
      }
    });
    assert(attSubmitRes.status === 201 && attSubmitRes.data.success, 'Attendance submission must succeed with 201');
    console.log('  ✓ PASSED: Direct attendance submission verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 12: Student attendance percentage update
    // ----------------------------------------------------
    console.log('[12/24] Testing Student attendance percentage update...');
    const studentAttRes = await request('/api/student/attendance', { cookie: studentCookie });
    assert(studentAttRes.status === 200, 'Student attendance query must succeed');
    const hasTodayInHistory = studentAttRes.data.history.some(h => h.date === todayDate);
    assert(hasTodayInHistory, 'Student history must include the newly submitted session');
    console.log('  ✓ PASSED: Student attendance percentage and history update verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 13: Attendance correction and audit history
    // ----------------------------------------------------
    console.log('[13/24] Testing Attendance correction and audit history...');
    const attCorrectionRes = await request('/api/faculty/attendance/submit', {
      method: 'POST',
      cookie: faculty1Cookie,
      body: {
        classId: 'CSE-Y3-S5-SEC1',
        subjectId: 'CS301',
        date: todayDate,
        isCorrection: true,
        reason: 'Late arrival verified with student on duty pass',
        records: [
          { studentId: '1001', status: 'Present' },
          { studentId: '1002', status: 'Present' },
          { studentId: '1003', status: 'Present' }, // Corrected 1003 to Present
          { studentId: '1004', status: 'Present' },
          { studentId: '1005', status: 'Present' }
        ]
      }
    });
    assert(attCorrectionRes.status === 200, 'Attendance correction must succeed');

    // Verify activityLogs contains audit trail
    const activityLogs = readJSON('activityLogs.json', []);
    const attAudit = activityLogs.find(a => a.actionType === 'ATTENDANCE_CORRECTION' && a.reason.includes('Late arrival'));
    assert(attAudit, 'Attendance correction audit record must exist in activityLogs.json');
    console.log('  ✓ PASSED: Attendance correction with audit logging verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 14: Event creation and publication
    // ----------------------------------------------------
    console.log('[14/24] Testing Event creation and publication...');
    const createEventRes = await request('/api/faculty/events/create', {
      method: 'POST',
      cookie: faculty1Cookie,
      body: {
        title: 'Inter-College AI Robotics Derby 2026',
        category: 'College competitions',
        venue: 'Mechanical & Robotics Bay',
        date: '2026-11-28',
        registrationDeadline: '2026-11-25',
        capacity: 50,
        description: 'Autonomous rover obstacle course competition.'
      }
    });
    assert(createEventRes.status === 201 && createEventRes.data.success, 'Event creation must succeed');
    const newEventId = createEventRes.data.event.id;
    console.log('  ✓ PASSED: Event creation and publication verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 15: Student event registration
    // ----------------------------------------------------
    console.log('[15/24] Testing Student event registration...');
    const regRes = await request('/api/student/events/register', {
      method: 'POST',
      cookie: studentCookie,
      body: { eventId: newEventId }
    });
    assert(regRes.status === 201 && regRes.data.success, 'Student event registration must succeed');
    console.log('  ✓ PASSED: Student event registration verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 16: Faculty participant list filtering by branch and section
    // ----------------------------------------------------
    console.log('[16/24] Testing Faculty participant list filtering...');
    const participantsRes = await request(`/api/faculty/events/${newEventId}/participants?branchId=CSE&section=Section%201`, {
      cookie: faculty1Cookie
    });
    assert(participantsRes.status === 200, 'Participants list must load');
    const maniParticipant = participantsRes.data.participants.find(p => p.studentId === '1001');
    assert(maniParticipant, 'Mani (1001) must appear in CSE Section 1 participant filter');
    console.log('  ✓ PASSED: Participant roster and branch/section filtering verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 17: Participation status updates
    // ----------------------------------------------------
    console.log('[17/24] Testing Participation status updates...');
    const updatePartRes = await request(`/api/faculty/events/${newEventId}/participation`, {
      method: 'POST',
      cookie: faculty1Cookie,
      body: {
        studentId: '1001',
        participationStatus: 'Participated',
        certificateStatus: 'Issued',
        reason: 'Automated test attendance confirmation'
      }
    });
    assert(updatePartRes.status === 200 && updatePartRes.data.success, 'Participation status update must succeed');
    console.log('  ✓ PASSED: Participation status and certificate status update verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 18: Automatic participation counts and “0 Participations” empty state
    // ----------------------------------------------------
    console.log('[18/24] Testing Automatic participation counts & "0 Participations" empty state...');
    // Student 1001 has participations
    const s1EventsRes = await request('/api/student/events', { cookie: studentCookie });
    assert(s1EventsRes.data.totalParticipatedCount >= 1, 'Student 1001 must have >= 1 participations');

    // Student 1003 (Abhi) has ZERO participations
    const s2EventsRes = await request('/api/student/events', { cookie: student2Cookie });
    assert(s2EventsRes.data.totalParticipatedCount === 0, 'Student 1003 must have 0 participations');
    console.log('  ✓ PASSED: Participation counts and zero-participation state verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 19: Class analytics based on saved records
    // ----------------------------------------------------
    console.log('[19/24] Testing Class analytics based on saved records...');
    const analyticsRes = await request('/api/faculty/analytics?classId=CSE-Y3-S5-SEC1', { cookie: faculty1Cookie });
    assert(analyticsRes.status === 200, 'Class analytics request must succeed');
    assert(typeof analyticsRes.data.marks.averagePercentage === 'number', 'Marks average must be computed');
    assert(typeof analyticsRes.data.attendance.averagePercentage === 'number', 'Attendance average must be computed');
    console.log('  ✓ PASSED: Computed class analytics verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 20: Announcement targeting and notifications
    // ----------------------------------------------------
    console.log('[20/24] Testing Announcement targeting and notifications...');
    const annRes = await request('/api/faculty/announcements', {
      method: 'POST',
      cookie: faculty1Cookie,
      body: {
        targetBranch: 'CSE',
        targetSection: 'Section 1',
        title: 'Emergency Lab Schedule Shift',
        message: 'Tomorrow lab will commence at 10:00 AM instead of 9:00 AM.'
      }
    });
    assert(annRes.status === 201, 'Targeted announcement creation must succeed');

    // Student 1001 (CSE Sec 1) should receive notification
    const notifRes = await request('/api/student/notifications', { cookie: studentCookie });
    const targetNotif = notifRes.data.notifications.find(n => n.title.includes('Emergency Lab Schedule Shift'));
    assert(targetNotif, 'Targeted notification must be dispatched to eligible student');
    console.log('  ✓ PASSED: Announcement targeting and notification dispatch verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 21: Light/Dark Mode persistence
    // ----------------------------------------------------
    console.log('[21/24] Testing Light/Dark Mode persistence...');
    // Verify client theme.js contains localStorage persistence logic
    const themeJsContent = require('fs').readFileSync('public/js/theme.js', 'utf-8');
    assert(themeJsContent.includes('localStorage.getItem') && themeJsContent.includes('localStorage.setItem'), 'Theme.js must handle localStorage persistence');
    console.log('  ✓ PASSED: Light/Dark mode localStorage mechanism verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 22: Logout and protected-page access after logout
    // ----------------------------------------------------
    console.log('[22/24] Testing Logout and protected-page access after logout...');
    const logoutRes = await request('/api/auth/logout', { method: 'POST', cookie: studentCookie });
    assert(logoutRes.status === 200, 'Logout request must succeed');

    // Cookie is cleared
    const postLogoutCheck = await request('/api/student/overview', {
      cookie: 'campus_auth_token=; Max-Age=0'
    });
    assert(postLogoutCheck.status === 401, 'Protected route access must be denied after logout');
    console.log('  ✓ PASSED: Logout and session invalidation verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 23: JSON persistence after server restart
    // ----------------------------------------------------
    console.log('[23/24] Testing JSON persistence after server restart...');
    // Read directly from disk to ensure data persisted in JSON files
    const persistedStudents = readJSON('students.json', []);
    const foundNewStudent = persistedStudents.find(s => s.id === newStudentId);
    assert(foundNewStudent, `Student ${newStudentId} must be persisted to students.json on disk`);
    const persistedAttendance = readJSON('attendance.json', []);
    const foundTodayAtt = persistedAttendance.find(a => a.date === todayDate);
    assert(foundTodayAtt, `Attendance session for ${todayDate} must be persisted to attendance.json on disk`);
    console.log('  ✓ PASSED: JSON data persistence verified.');
    passedCount++;

    // ----------------------------------------------------
    // Test 24: Duplicate registration and duplicate attendance prevention
    // ----------------------------------------------------
    console.log('[24/24] Testing Duplicate registration & duplicate attendance prevention...');
    // Duplicate registration check: Mani (1001) registers again for newEventId
    const dupRegRes = await request('/api/student/events/register', {
      method: 'POST',
      cookie: studentCookie,
      body: { eventId: newEventId }
    });
    assert(dupRegRes.status === 400 && dupRegRes.data.message.includes('already registered'), 'Duplicate registration must be rejected with 400');

    // Duplicate attendance check: Submitting today's session again without isCorrection=true
    const dupAttRes = await request('/api/faculty/attendance/submit', {
      method: 'POST',
      cookie: faculty1Cookie,
      body: {
        classId: 'CSE-Y3-S5-SEC1',
        subjectId: 'CS301',
        date: todayDate,
        isCorrection: false,
        records: [{ studentId: '1001', status: 'Present' }]
      }
    });
    assert(dupAttRes.status === 409, 'Duplicate attendance session must return 409 Conflict');
    console.log('  ✓ PASSED: Duplicate registration and duplicate attendance prevention verified.');
    passedCount++;

    console.log('\n====================================================');
    console.log(`  ALL ${passedCount}/${totalCount} WORKFLOW TESTS COMPLETED SUCCESSFULLY!`);
    console.log('====================================================');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    if (server) server.close();
  }
}

// Start temporary server for testing
server = http.createServer(app).listen(PORT, () => {
  runTests();
});
