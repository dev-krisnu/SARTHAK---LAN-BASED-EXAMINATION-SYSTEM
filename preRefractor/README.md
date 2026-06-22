Sarthak - LAN Exam System — Complete Setup Guide

A fully working LAN-based examination system.
- **Backend:** Pure Java (built-in HttpServer, no Spring/Tomcat needed)
- **Database:** MySQL (`lan_exam`)
- **Frontend:** Single HTML file (HTML + CSS + JS, no npm/React)

---

## Folder Structure

```
LanExamSystem/
├── src/
│   ├── MainServer.java       ← Entry point, starts HTTP server on port 8080
│   ├── ApiHandler.java       ← All REST API endpoints
│   └── DBConnection.java     ← MySQL connection config
├── web/
│   └── index.html            ← Full frontend (login + student + admin)
    └── team.html     
├── database/
│   └── setup.sql             ← Run this in MySQL first!
├── run_server.bat           ← Build & run on Windows
└── README.md
```

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Java JDK | 8 or higher | https://adoptium.net |
| MySQL | 5.7+ or 8.x | https://dev.mysql.com/downloads/ |
| MySQL Connector/J JAR | 9.x | https://dev.mysql.com/downloads/connector/j/ |

---

## Setup Steps

### Step 1 — Set up the Database

1. Open **MySQL Workbench** or command line.
2. Run the contents of `database/setup.sql`.
3. This creates the `lan_exam` database with all tables and sample data.

```sql
source /path/to/LanExamSystem/database/setup.sql
-- or paste the file contents directly
```

### Step 2 — Configure Database Password

Open `src/DBConnection.java` and update line:
```java
private static final String DB_PASS = "**********";   // ← your MySQL root password
```
Change it to match your MySQL password.

### Step 3 — Download MySQL Connector JAR

1. Go to: https://dev.mysql.com/downloads/connector/j/
2. Select **Platform Independent**, download the ZIP.
3. Extract it and copy the `.jar` file (e.g. `mysql-connector-j-9.1.0.jar`) into the **root** `LanExamSystem/` folder.
4. If your JAR has a different version number, edit `run_server.bat` and change the `JAR=` line.

### Step 4 — Run the Server

```
Double-click run_server.bat
```


You should see:
```
[DB] Database connected successfully.
[SERVER] Running at  http://localhost:8080
[SERVER] Share with LAN clients at  http://<your-IP>:8080
```

### Step 5 — Open in Browser

- **Same machine:** http://localhost:8080
- **LAN students:** http://192.168.x.x:8080  *(use your actual IP)*

To find your IP:
- Windows: `ipconfig` → look for IPv4 Address
- Linux: `ifconfig` or `ip addr`

---

## Default Login Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
---

## Features

### Student
- View active exams with duration and marks
- Take timed exam with question navigation
- Auto-submit when timer expires
- See result with score, percentage, and grade immediately
- View history of past results

### Admin
- Dashboard with stats (total exams, active, students, submissions)
- Toggle exams on/off (students only see active ones)
- View all students and their activity
- View ranked results for any exam with grades

---

## Adding New Exams & Questions

Currently via SQL (easiest):

```sql
USE lan_exam;

-- Create exam
INSERT INTO exams (title, subject, duration_minutes, total_marks, is_active, created_by)
VALUES ('Math Test', 'Mathematics', 30, 10, 1, 1);

-- Get the new exam's ID (let's say it's 2)
-- Add questions
INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks)
VALUES
(2, 'What is 5 × 6?', '25', '30', '36', '42', 'B', 1),
(2, 'Square root of 144?', '10', '11', '12', '14', 'C', 1);
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/login | Login |
| GET | /api/exams | Active exams (student) |
| GET | /api/questions?examId=X | Questions for exam |
| POST | /api/submit | Submit answers |
| GET | /api/results?studentId=X | Student results |
| GET | /api/results?examId=X | All results for exam (admin) |
| GET | /api/admin/exams | All exams (admin) |
| POST | /api/admin/exams | Toggle exam active |
| GET | /api/admin/users | All users (admin) |

---

## Troubleshooting

**"Cannot connect to database"**
→ Check MySQL is running, password in DBConnection.java is correct, `lan_exam` database exists.

**"ClassNotFoundException: com.mysql.cj.jdbc.Driver"**
→ JAR file is missing or wrong version. Make sure the connector JAR is in the same folder as the .bat/.sh script.

**Login says "Invalid credentials"**
→ Make sure you ran setup.sql. Check username/password exactly (case-sensitive).

**Students can't connect**
→ Check your firewall allows port 8080. Share your LAN IP (192.168.x.x), not localhost.
