# CAMPUS — Complete College Student and Faculty Portal

> **“Your Campus. Your Voice. Your Change.”**

**CAMPUS** is an institutional college portal designed from the ground up for higher education academic institutions. Built using standard **HTML5, CSS3, vanilla JavaScript, Node.js, and Express.js**, it uses persistent **local JSON file storage** (no MongoDB, Mongoose, Firebase, or external databases).

---

## 🏛️ System Overview

The system strictly enforces two distinct roles:
1. **Student**: View personalized academic records, enrolled subjects, faculty directory, subject-wise attendance with shortage alerts, continuous assessment marks, lodge private subject-specific grievances, register for campus events, and track verified participations.
2. **Faculty**: Dedicated 7-card management portal to resolve assigned student complaints, enter and correct assessment marks with audit reasons, take direct roll call attendance with duplicate protection, view student directories, publish campus events and verify actual participant certificates, generate real-time computed class analytics, and broadcast targeted class announcements.

---

## 🌟 Key Features

- **Dual-Card Responsive Authentication**: Desktop side-by-side cards for Student and Faculty; neatly stacked on mobile.
- **Strict Role Separation & Security**:
  - Passwords hashed with `bcrypt` (salt rounds: 10).
  - HttpOnly JWT session tokens with server-side validation.
  - Rate limiting on authentication endpoints to prevent brute-force attacks.
  - Role-based route authorization protecting every API endpoint.
- **30 Engineering Branches & Dependent Sections**:
  - Full catalog of 30 engineering branches (CSE, CSE-AIML, ECE, EEE, Mech, Civil, Biotech, Robotics, etc.).
  - Dependent section logic (CSE configured with 10 sections; ECE and other branches with 5 sections).
- **Critical Subject-Specific Complaint Privacy**:
  - A complaint filed for a subject is automatically routed only to the instructor assigned to teach that subject for the student's specific class, branch, and section.
  - Other faculty cannot view or reply to unrelated complaints.
- **Direct Attendance Management**:
  - Directly take roll call attendance with "Select All Present" and date picker.
  - Duplicate session protection with audited correction workflow.
  - Configurable low-attendance warning threshold (< 75.0%).
- **Campus Events & Official Participation Tracking**:
  - Event registration is separate from verified participation.
  - Prominent **"0 Participations" / "No event participations recorded yet."** empty state for students without verified records.
  - Certificate issuance and status tracking.
- **Real-Time Computed Class Analytics**:
  - Dynamic SVG visualizations: Subject average marks, attendance trends, low attendance lists, complaint resolution donuts, and event engagement ratios.
- **Activity History & Audit Trails**:
  - Logs sensitive actions (marks corrections, attendance adjustments, complaint resolutions, participation updates) with actor ID, timestamp, prior value, new value, and reason in `data/activityLogs.json`.
- **Light & Dark Mode**:
  - Instant theme toggle persisted locally in `localStorage`.

---

## 📂 Project Structure

```text
college complaint f18/
├── data/                         # Local JSON file storage
│   ├── activityLogs.json         # Sensitive action audit trail
│   ├── announcements.json        # Targeted class bulletins
│   ├── attendance.json           # Daily session roll calls & records
│   ├── branches.json             # 30 Engineering branches & sections
│   ├── complaints.json           # Private academic complaints & reply threads
│   ├── events.json               # Campus events catalog
│   ├── faculty.json              # Faculty accounts & class assignments
│   ├── marks.json                # Continuous assessment & exam scores
│   ├── notifications.json        # User notification logs
│   ├── participations.json       # Event registrations & verified participation
│   ├── students.json             # Student accounts & profiles
│   └── subjects.json             # Curriculum subjects & assessment schemes
├── middleware/
│   └── auth.js                   # JWT auth, role authorization & rate limiter
├── public/                       # Static frontend assets
│   ├── assets/
│   │   ├── campus-bg.svg         # Architectural university vector background
│   │   └── logo.svg              # CAMPUS crest & shield vector logo
│   ├── css/
│   │   └── style.css             # Unified Navy/Teal design system & responsive CSS
│   ├── js/
│   │   ├── auth.js               # Login & student registration logic
│   │   ├── faculty.js            # Faculty 7-card dashboard controller
│   │   ├── student.js            # Student portal controller & SVG charts
│   │   ├── theme.js              # Light/Dark mode localStorage toggle
│   │   └── toast.js              # Lightweight toast notification system
│   ├── faculty.html              # Faculty portal dashboard
│   ├── index.html                # Landing page & dual-card login
│   └── student.html              # Student portal dashboard
├── routes/
│   ├── auth.routes.js            # Login, student registration & session check
│   ├── common.routes.js          # Branches & subjects metadata
│   ├── faculty.routes.js         # Marks, attendance, complaints, events, analytics
│   └── student.routes.js         # Overview, marks, attendance, complaints, events
├── test/
│   └── verify_campus.js          # Automated 24-workflow test suite
├── utils/
│   ├── activityLogger.js         # Audit log helper
│   ├── createFaculty.js          # Safe CLI faculty creation utility
│   ├── seed.js                   # Initial demo data populator
│   └── storage.js                # Atomic, thread-safe JSON file persistence
├── .gitignore                    # Git ignore file
├── package.json                  # Project dependencies & scripts
├── README.md                     # Documentation & setup instructions
└── server.js                     # Express server & API routes mount
```

---

## 🚀 Setup and Running Instructions

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended, tested on Node v24)
- **npm** (v9.0.0 or higher)
- A modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari)

### 2. Open the Project Folder
Open your terminal (PowerShell or Bash) and navigate to the project directory:
```bash
cd "c:\Users\mohan\OneDrive\Documents\Desktop\college complaint f18"
```

### 3. Install Dependencies
Install all required Node.js dependencies:
```bash
npm install
```
*(Dependencies installed: `express`, `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `express-rate-limit`)*

### 4. Initialize Local JSON Data
Seed demo accounts and university records:
```bash
npm run seed
```
*(Note: If data is missing or empty, the server also auto-seeds automatically upon startup!)*

### 5. Safe Faculty Account Creation
To prevent unauthorized public faculty registration, faculty accounts are created safely via the administrative server CLI:
```bash
# Syntax: node utils/createFaculty.js "<Name>" "<Email>" "<Password>" "[Department]" "[Designation]"
node utils/createFaculty.js "Dr. Ramesh Babu" "ramesh.babu@demo.campus.edu" "Faculty@123" "CSE" "Professor"
```

### 6. Start the Server
Run the production server:
```bash
npm start
```
Or run in development mode:
```bash
npm run dev
```

### 7. Open the Application
Open your web browser and navigate to:
```text
http://localhost:3000
```

---

## 🔑 Demo Login Credentials

For demonstration and evaluation, the following pre-configured demo accounts are provided:

### 🎓 Demo Student Accounts
| Student Name | Student ID | Email | Password | Academic Placement / Notes |
| :--- | :---: | :--- | :--- | :--- |
| **Mani** | `1001` | `mani@demo.campus.edu` | `Student@123` | CSE Year 3, Sem 5, Section 1 (Has verified participations) |
| **Geethika** | `1002` | `geethika@demo.campus.edu` | `Student@123` | CSE Year 3, Sem 5, Section 1 (100% Attendance) |
| **Abhi** | `1003` | `abhi@demo.campus.edu` | `Student@123` | **"0 Participations"** Demo & Low-Attendance Shortage (<75%) |
| **Harika** | `1004` | `harika@demo.campus.edu` | `Student@123` | CSE Year 3, Sem 5, Section 1 |
| **Pavan** | `1005` | `pavan@demo.campus.edu` | `Student@123` | CSE Year 3, Sem 5, Section 1 |
| **Keerthana**| `1008` | `keerthana@demo.campus.edu`| `Student@123`| ECE Year 3, Sem 5, Section 1 |

> *Note: You can log in using either the **Numeric Student ID** (e.g. `1001`) or the **College Email**.*

---

### 👨‍🏫 Demo Faculty Accounts
| Faculty Name | Faculty ID | Email | Password | Department & Assigned Responsibilities |
| :--- | :---: | :--- | :--- | :--- |
| **Prof. Rajesh Sharma** | `FAC-201` | `rajesh.sharma@demo.campus.edu` | `Faculty@123` | CSE — Class Teacher (CSE Sec 1) & Instructor for **Data Structures & Algorithms (CS301)** |
| **Prof. Anita Desai** | `FAC-202` | `anita.desai@demo.campus.edu` | `Faculty@123` | CSE — Instructor for **Database Management Systems (CS302)** & **Operating Systems (CS303)** |
| **Prof. Vikram Rao** | `FAC-203` | `vikram.rao@demo.campus.edu` | `Faculty@123` | ECE — Class Teacher (ECE Sec 1) & Instructor for **Digital Signal Processing (EC301)** |

---

## 🧪 Testing the Core Application Workflows

### Scenario 1: Student Signup & Dependent Sections
1. On `http://localhost:3000`, click **"Create student account"** on the Student card.
2. Select **"Computer Science and Engineering (CSE)"** from the 30 branches dropdown.
3. Observe that the Section dropdown automatically updates to show **Section 1 through Section 10**.
4. Select **"Civil Engineering"** or **"Robotics"** and observe the section dropdown changes to **Section 1 through Section 5**.
5. Complete registration and log in with your new numeric Student ID.

### Scenario 2: Subject-Specific Complaint Routing & Isolation
1. Log in as student **Mani (1001)** / `Student@123`.
2. Go to **"⚖️ Complaints"** &rarr; click **"+ Lodge New Complaint"**.
3. Select **"Data Structures & Algorithms (CS301)"** and submit a **"Marks issue"** query.
4. Log out and log in as **Prof. Anita Desai (`FAC-202`)**:
   - Check the complaints inbox: Mani's CS301 complaint **is NOT present** (she is unauthorized for CS301).
5. Log out and log in as **Prof. Rajesh Sharma (`FAC-201`)**:
   - The complaint **is present** in his inbox. Click **"Review & Reply"**, enter an explanation, change status to **Resolved**, and click Save.
6. Log back in as student **Mani (1001)**: view the resolved status and the instructor's reply thread.

### Scenario 3: Marks Entry, Correction, and Audit History
1. Log in as **Prof. Rajesh Sharma (`FAC-201`)**.
2. Click card **"2. Marks Management"**.
3. Select Class `CSE - Section 1` and Subject `Data Structures & Algorithms (CS301)`.
4. Click **"Load Roster"**.
5. Adjust a student's Internal or Assignment marks, enter a **Reason for Correction** (e.g. *"Re-evaluation Q4 rubric update"*), and click **"Save Assessment Marks"**.
6. Check `data/activityLogs.json` to verify the audit log capturing actor, old value, new value, timestamp, and reason.

### Scenario 4: Direct Roll Call Attendance & Low Attendance Warnings
1. Log in as **Prof. Rajesh Sharma (`FAC-201`)** &rarr; **"3. Attendance"**.
2. Select class, subject, and date &rarr; click **"Open Roll Call"**.
3. Use **"Select All Present"** or toggle individual student statuses.
4. Click **"Submit Attendance"**.
5. Log in as student **Abhi (1003)**:
   - Notice the prominent amber/red **Low Attendance Warning** banner explaining that his attendance (< 75%) is below institutional compliance.

### Scenario 5: Event Verification & "0 Participations" State
1. Log in as student **Abhi (1003)**:
   - Navigate to **"🏆 Events & Participation"**.
   - Notice the prominent requirement display:
     ```text
     0 Participations
     No event participations recorded yet.
     ```
2. Log in as student **Mani (1001)**:
   - Register for an eligible hackathon or workshop.
3. Log in as faculty coordinator **Prof. Rajesh Sharma (`FAC-201`)**:
   - Go to **"5. Events & Participation"** &rarr; click **"Manage Participants"**.
   - Filter by Branch: `CSE`, Section: `Section 1`.
   - Update Mani's participation to **"Participated"** and Certificate to **"Issued"**.
4. Log back in as **Mani (1001)**: his verified participation counter and certificate badge are updated immediately.

---

## 🛡️ Running the Automated Test Suite

An automated test suite (`test/verify_campus.js`) is included to verify all 24 required technical and architectural requirements:

```bash
npm test
```

### Verified Test Cases:
1. Student signup and login.
2. Faculty login and role separation.
3. Direct URL and API access restrictions (401/403).
4. Branch and dependent section selection (30 branches).
5. Correct subject and faculty assignment display.
6. Student marks visibility.
7. Faculty marks entry and correction with audit history.
8. Student marks complaint routing to correct assigned subject faculty.
9. Complaint privacy against unrelated faculty.
10. Complaint reply and status update.
11. Direct attendance entry and submission.
12. Student attendance percentage update.
13. Attendance correction and audit history.
14. Event creation and publication.
15. Student event registration.
16. Faculty participant list filtering by branch and section.
17. Participation status updates.
18. Automatic participation counts and the “0 Participations” empty state.
19. Class analytics based on saved records.
20. Announcement targeting and notifications.
21. Light/Dark Mode persistence.
22. Logout and protected-page access after logout.
23. JSON persistence after server restart.
24. Duplicate registration and duplicate attendance prevention.

---

## 🛠️ Common Errors & Troubleshooting

1. **Port 3000 already in use**:
   - If port 3000 is occupied by another application, start with a custom port:
     ```powershell
     $env:PORT=4000; node server.js
     ```
   - Then open `http://localhost:4000`.

2. **Accidentally cleared demo records**:
   - If you want to reset all sample data to the original clean state at any time, run:
     ```bash
     npm run seed
     ```

3. **Faculty cannot see a student's complaint**:
   - This is an intentional security design! Faculty can only see complaints filed for subjects and classes they are officially assigned to teach. Unassigned complaints are strictly hidden and return HTTP 403.

4. **Student sees "0 Participations"**:
   - Registering for an event does not count as participation until an authorized faculty member verifies attendance in the Event Coordinator hub.

---

## 📜 Technical Disclaimers

- All sample student and faculty names, numeric IDs, marks, and attendance sessions are **pure demo records** for demonstration and educational testing.
- No real university or individual records are claimed or fabricated.
- Password hashes use standard bcrypt. For production deployment in enterprise universities, bind cookies with `Secure: true` over TLS (HTTPS).

---
*Built with care for students and faculty. "Your Campus. Your Voice. Your Change."*
