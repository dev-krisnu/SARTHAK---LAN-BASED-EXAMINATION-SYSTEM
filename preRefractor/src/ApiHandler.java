import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.stream.Collectors;

/**
 * ApiHandler – all REST endpoints for the LAN Exam System.
 *
 * Endpoints:
 *   POST /api/login           – authenticate user
 *   POST /api/signup          – register new student
 *   GET  /api/exams           – list active exams (student)
 *   GET  /api/questions?examId=X&limit=N  – N random questions for an exam
 *   POST /api/submit          – submit answers
 *   GET  /api/results?studentId=X – student results
 *   GET  /api/admin/exams     – all exams (admin)
 *   POST /api/admin/exams     – toggle active OR set questions_shown (admin)
 *   GET  /api/admin/users     – list all students (admin)
 */
public class ApiHandler {

    static class Login implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (!ex.getRequestMethod().equalsIgnoreCase("POST")) { sendError(ex, 405, "Method Not Allowed"); return; }
            setCorsHeaders(ex);
            try {
                String body     = readBody(ex);
                String username = extractJson(body, "username");
                String password = extractJson(body, "password");
                if (username == null || password == null) { sendError(ex, 400, "Missing username or password"); return; }

                Connection con = DBConnection.getConnection();
                if (con == null) { sendError(ex, 500, "Database connection failed"); return; }

                PreparedStatement ps = con.prepareStatement(
                    "SELECT id, full_name, role FROM users WHERE username = ? AND password = ?");
                ps.setString(1, username);
                ps.setString(2, password);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    int    userId = rs.getInt("id");
                    String role   = rs.getString("role");
                    String name   = rs.getString("full_name");
                    sendJson(ex, 200,
                        "{\"success\":true,\"role\":\"" + role + "\",\"userId\":" + userId +
                        ",\"fullName\":\"" + escJson(name) + "\",\"username\":\"" + escJson(username) + "\"}");
                } else {
                    sendJson(ex, 200, "{\"success\":false,\"message\":\"Invalid username or password\"}");
                }
                rs.close(); ps.close(); con.close();
            } catch (Exception e) {
                e.printStackTrace();
                sendError(ex, 500, "Server error: " + e.getMessage());
            }
        }
    }

    static class Signup implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            setCorsHeaders(ex);
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { ex.sendResponseHeaders(204, -1); return; }
            if (!ex.getRequestMethod().equalsIgnoreCase("POST")) { sendError(ex, 405, "Method Not Allowed"); return; }
            try {
                String body     = readBody(ex);
                String fullName = extractJson(body, "fullName");
                String username = extractJson(body, "username");
                String password = extractJson(body, "password");

                if (fullName == null || fullName.trim().isEmpty()) { sendJson(ex, 200, "{\"success\":false,\"message\":\"Full name is required\"}"); return; }
                if (username == null || username.trim().isEmpty()) { sendJson(ex, 200, "{\"success\":false,\"message\":\"Username is required\"}"); return; }
                if (password == null || password.length() < 5)    { sendJson(ex, 200, "{\"success\":false,\"message\":\"Password must be at least 5 characters\"}"); return; }

                Connection con = DBConnection.getConnection();
                if (con == null) { sendError(ex, 500, "Database connection failed"); return; }

                // Check if username already exists
                PreparedStatement chk = con.prepareStatement("SELECT id FROM users WHERE username = ?");
                chk.setString(1, username.trim());
                ResultSet chkRs = chk.executeQuery();
                if (chkRs.next()) {
                    chkRs.close(); chk.close(); con.close();
                    sendJson(ex, 200, "{\"success\":false,\"message\":\"Username already exists. Please choose another.\"}");
                    return;
                }
                chkRs.close(); chk.close();

                // Insert new student
                PreparedStatement ins = con.prepareStatement(
                    "INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, 'student')");
                ins.setString(1, username.trim());
                ins.setString(2, password);
                ins.setString(3, fullName.trim());
                ins.executeUpdate();
                ins.close(); con.close();

                sendJson(ex, 200, "{\"success\":true,\"message\":\"Account created successfully\"}");
            } catch (SQLIntegrityConstraintViolationException e) {
                sendJson(ex, 200, "{\"success\":false,\"message\":\"Username already exists.\"}");
            } catch (Exception e) {
                e.printStackTrace();
                sendError(ex, 500, "Server error: " + e.getMessage());
            }
        }
    }
  
    static class ExamList implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendError(ex, 405, "Method Not Allowed"); return; }
            setCorsHeaders(ex);
            try {
                Connection con = DBConnection.getConnection();
                if (con == null) { sendError(ex, 500, "DB error"); return; }

                PreparedStatement ps = con.prepareStatement(
                    "SELECT id, title, subject, duration_minutes, total_marks, questions_shown " +
                    "FROM exams WHERE is_active = 1 ORDER BY id DESC");
                ResultSet rs = ps.executeQuery();

                StringBuilder sb = new StringBuilder("[");
                boolean first = true;
                while (rs.next()) {
                    if (!first) sb.append(",");
                    first = false;
                    sb.append("{\"id\":").append(rs.getInt("id"))
                      .append(",\"title\":\"").append(escJson(rs.getString("title"))).append("\"")
                      .append(",\"subject\":\"").append(escJson(rs.getString("subject"))).append("\"")
                      .append(",\"durationMinutes\":").append(rs.getInt("duration_minutes"))
                      .append(",\"totalMarks\":").append(rs.getInt("total_marks"))
                      .append(",\"questionsShown\":").append(rs.getInt("questions_shown"))
                      .append("}");
                }
                sb.append("]");
                rs.close(); ps.close(); con.close();
                sendJson(ex, 200, sb.toString());
            } catch (Exception e) {
                e.printStackTrace();
                sendError(ex, 500, e.getMessage());
            }
        }
    }

  
    static class QuestionList implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendError(ex, 405, "Method Not Allowed"); return; }
            setCorsHeaders(ex);
            try {
                String query  = ex.getRequestURI().getQuery();
                String examId = getQueryParam(query, "examId");
                String limitP = getQueryParam(query, "limit");
                boolean admin = "true".equals(getQueryParam(query, "admin"));

                if (examId == null) { sendError(ex, 400, "examId required"); return; }

                int limit = 0;
                if (limitP != null) {
                    try { limit = Integer.parseInt(limitP); } catch (NumberFormatException ignored) {}
                }

                // If limit not passed from URL, read from DB (questions_shown column)
                if (limit <= 0 && !admin) {
                    Connection conTmp = DBConnection.getConnection();
                    if (conTmp != null) {
                        PreparedStatement psTmp = conTmp.prepareStatement(
                            "SELECT questions_shown FROM exams WHERE id = ?");
                        psTmp.setInt(1, Integer.parseInt(examId));
                        ResultSet rsTmp = psTmp.executeQuery();
                        if (rsTmp.next()) limit = rsTmp.getInt("questions_shown");
                        rsTmp.close(); psTmp.close(); conTmp.close();
                    }
                }

                Connection con = DBConnection.getConnection();
                if (con == null) { sendError(ex, 500, "DB error"); return; }

                // ORDER BY RAND() gives different order per student.
                // LIMIT N ensures only N questions come back.
                String sql = "SELECT id, question_text, option_a, option_b, option_c, option_d, marks"
                           + (admin ? ", correct_option" : "")
                           + " FROM questions WHERE exam_id = ? ORDER BY RAND()"
                           + (limit > 0 ? " LIMIT " + limit : "");

                PreparedStatement ps = con.prepareStatement(sql);
                ps.setInt(1, Integer.parseInt(examId));
                ResultSet rs = ps.executeQuery();

                StringBuilder sb = new StringBuilder("[");
                boolean first = true;
                while (rs.next()) {
                    if (!first) sb.append(",");
                    first = false;
                    sb.append("{\"id\":").append(rs.getInt("id"))
                      .append(",\"questionText\":\"").append(escJson(rs.getString("question_text"))).append("\"")
                      .append(",\"optionA\":\"").append(escJson(rs.getString("option_a"))).append("\"")
                      .append(",\"optionB\":\"").append(escJson(rs.getString("option_b"))).append("\"")
                      .append(",\"optionC\":\"").append(escJson(rs.getString("option_c"))).append("\"")
                      .append(",\"optionD\":\"").append(escJson(rs.getString("option_d"))).append("\"")
                      .append(",\"marks\":").append(rs.getInt("marks"));
                    if (admin) sb.append(",\"correctOption\":\"").append(rs.getString("correct_option")).append("\"");
                    sb.append("}");
                }
                sb.append("]");
                rs.close(); ps.close(); con.close();
                sendJson(ex, 200, sb.toString());
            } catch (Exception e) {
                e.printStackTrace();
                sendError(ex, 500, e.getMessage());
            }
        }
    }

  
    static class SubmitExam implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (!ex.getRequestMethod().equalsIgnoreCase("POST")) { sendError(ex, 405, "Method Not Allowed"); return; }
            setCorsHeaders(ex);
            try {
                String body       = readBody(ex);
                int studentId     = Integer.parseInt(extractJson(body, "studentId"));
                int examId        = Integer.parseInt(extractJson(body, "examId"));
                String answersRaw = extractJsonBlock(body, "answers");

                Connection con = DBConnection.getConnection();
                if (con == null) { sendError(ex, 500, "DB error"); return; }

                // Check already submitted
                PreparedStatement chk = con.prepareStatement(
                    "SELECT id FROM results WHERE student_id=? AND exam_id=?");
                chk.setInt(1, studentId); chk.setInt(2, examId);
                ResultSet chkRs = chk.executeQuery();
                if (chkRs.next()) {
                    chkRs.close(); chk.close(); con.close();
                    sendJson(ex, 200, "{\"success\":false,\"message\":\"Already submitted\"}");
                    return;
                }
                chkRs.close(); chk.close();

                PreparedStatement qa = con.prepareStatement(
                    "SELECT id, correct_option, marks FROM questions WHERE exam_id=?");
                qa.setInt(1, examId);
                ResultSet qrs = qa.executeQuery();

                int score = 0, totalMarks = 0;
                java.util.List<int[]> qData      = new java.util.ArrayList<>();
                java.util.List<Integer> qIds     = new java.util.ArrayList<>();

                while (qrs.next()) {
                    int qId    = qrs.getInt("id");
                    String cor = qrs.getString("correct_option");
                    int marks  = qrs.getInt("marks");

                    String chosen = getAnswerFromJson(answersRaw, String.valueOf(qId));
                    // Only count marks for questions this student received (i.e., they have an entry or skipped)
                    // We check if the student was even given this question by seeing if qId appears in answers keys
                    // Since student only submits qIds they were shown, we check chosen != null OR skipped (null = shown but unanswered)
                    // We include all answered questions in score, total marks = sum of received questions only
                    // To properly track received questions we rely on what they submitted.
                    // Simple and correct: only add to totalMarks if student had a chance to answer
                    // (i.e., their answer object contains this qId key — even if unanswered/null)
                    boolean studentGotThisQ = answersRaw.contains("\"" + qId + "\"");
                    if (!studentGotThisQ) continue; // skip questions not in their paper

                    totalMarks += marks;
                    int correct = (chosen != null && chosen.equalsIgnoreCase(cor)) ? 1 : 0;
                    if (correct == 1) score += marks;
                    qData.add(new int[]{qId, marks, correct});
                    qIds.add(qId);
                }
                qrs.close(); qa.close();

                // Fallback: if no answers at all (student submitted blank), compute totalMarks from all questions
                if (totalMarks == 0 && qData.isEmpty()) {
                    PreparedStatement cntPs = con.prepareStatement(
                        "SELECT SUM(marks) AS total FROM questions WHERE exam_id=?");
                    cntPs.setInt(1, examId);
                    ResultSet cntRs = cntPs.executeQuery();
                    if (cntRs.next()) totalMarks = cntRs.getInt("total");
                    cntRs.close(); cntPs.close();
                }

                // Insert result
                PreparedStatement ins = con.prepareStatement(
                    "INSERT INTO results (student_id, exam_id, score, total_marks) VALUES (?,?,?,?)",
                    Statement.RETURN_GENERATED_KEYS);
                ins.setInt(1, studentId); ins.setInt(2, examId);
                ins.setInt(3, score);     ins.setInt(4, totalMarks);
                ins.executeUpdate();
                ResultSet gk = ins.getGeneratedKeys();
                int resultId = gk.next() ? gk.getInt(1) : -1;
                gk.close(); ins.close();

                // Insert per-answer records (only for questions student received)
                if (resultId > 0 && !qData.isEmpty()) {
                    PreparedStatement ai = con.prepareStatement(
                        "INSERT INTO student_answers (result_id, question_id, chosen_option, is_correct) VALUES (?,?,?,?)");
                    for (int i = 0; i < qData.size(); i++) {
                        int qId = qData.get(i)[0];
                        int cor = qData.get(i)[2];
                        String ch = getAnswerFromJson(answersRaw, String.valueOf(qId));
                        ai.setInt(1, resultId);
                        ai.setInt(2, qId);
                        if (ch != null) ai.setString(3, ch); else ai.setNull(3, Types.CHAR);
                        ai.setInt(4, cor);
                        ai.addBatch();
                    }
                    ai.executeBatch();
                    ai.close();
                }
                con.close();

                int pct = totalMarks > 0 ? (score * 100 / totalMarks) : 0;
                sendJson(ex, 200,
                    "{\"success\":true,\"score\":" + score + ",\"totalMarks\":" + totalMarks +
                    ",\"percentage\":" + pct + "}");
            } catch (Exception e) {
                e.printStackTrace();
                sendError(ex, 500, e.getMessage());
            }
        }
    }

  
    static class Results implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendError(ex, 405, "Method Not Allowed"); return; }
            setCorsHeaders(ex);
            try {
                String query     = ex.getRequestURI().getQuery();
                String studentId = getQueryParam(query, "studentId");
                String examId    = getQueryParam(query, "examId");

                Connection con = DBConnection.getConnection();
                if (con == null) { sendError(ex, 500, "DB error"); return; }

                PreparedStatement ps;
                if (studentId != null) {
                    ps = con.prepareStatement(
                        "SELECT r.id, e.title, e.subject, r.score, r.total_marks, r.submitted_at " +
                        "FROM results r JOIN exams e ON r.exam_id=e.id " +
                        "WHERE r.student_id=? ORDER BY r.submitted_at DESC");
                    ps.setInt(1, Integer.parseInt(studentId));
                } else if (examId != null) {
                    ps = con.prepareStatement(
                        "SELECT r.id, u.full_name, u.username, r.score, r.total_marks, r.submitted_at " +
                        "FROM results r JOIN users u ON r.student_id=u.id " +
                        "WHERE r.exam_id=? ORDER BY r.score DESC");
                    ps.setInt(1, Integer.parseInt(examId));
                } else {
                    sendError(ex, 400, "studentId or examId required"); return;
                }

                ResultSet rs = ps.executeQuery();
                StringBuilder sb = new StringBuilder("[");
                boolean first = true;
                while (rs.next()) {
                    if (!first) sb.append(",");
                    first = false;
                    sb.append("{");
                    if (studentId != null) {
                        sb.append("\"examTitle\":\"").append(escJson(rs.getString("title"))).append("\"")
                          .append(",\"subject\":\"").append(escJson(rs.getString("subject"))).append("\"");
                    } else {
                        sb.append("\"studentName\":\"").append(escJson(rs.getString("full_name"))).append("\"")
                          .append(",\"username\":\"").append(escJson(rs.getString("username"))).append("\"");
                    }
                    int sc  = rs.getInt("score");
                    int tot = rs.getInt("total_marks");
                    int pct = tot > 0 ? sc * 100 / tot : 0;
                    sb.append(",\"score\":").append(sc)
                      .append(",\"totalMarks\":").append(tot)
                      .append(",\"percentage\":").append(pct)
                      .append(",\"submittedAt\":\"").append(rs.getString("submitted_at")).append("\"")
                      .append("}");
                }
                sb.append("]");
                rs.close(); ps.close(); con.close();
                sendJson(ex, 200, sb.toString());
            } catch (Exception e) {
                e.printStackTrace();
                sendError(ex, 500, e.getMessage());
            }
        }
    }

  
    static class AdminExams implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            setCorsHeaders(ex);
            if (ex.getRequestMethod().equalsIgnoreCase("OPTIONS")) { ex.sendResponseHeaders(204, -1); return; }

            if (ex.getRequestMethod().equalsIgnoreCase("GET")) {
                try {
                    Connection con = DBConnection.getConnection();
                    if (con == null) { sendError(ex, 500, "DB error"); return; }

                    PreparedStatement ps = con.prepareStatement(
                        "SELECT e.id, e.title, e.subject, e.duration_minutes, e.total_marks, e.is_active, e.questions_shown, " +
                        "(SELECT COUNT(*) FROM questions q WHERE q.exam_id=e.id) AS q_count " +
                        "FROM exams e ORDER BY e.id DESC");
                    ResultSet rs = ps.executeQuery();

                    StringBuilder sb = new StringBuilder("[");
                    boolean first = true;
                    while (rs.next()) {
                        if (!first) sb.append(",");
                        first = false;
                        sb.append("{\"id\":").append(rs.getInt("id"))
                          .append(",\"title\":\"").append(escJson(rs.getString("title"))).append("\"")
                          .append(",\"subject\":\"").append(escJson(rs.getString("subject"))).append("\"")
                          .append(",\"durationMinutes\":").append(rs.getInt("duration_minutes"))
                          .append(",\"totalMarks\":").append(rs.getInt("total_marks"))
                          .append(",\"isActive\":").append(rs.getInt("is_active"))
                          .append(",\"questionCount\":").append(rs.getInt("q_count"))
                          .append(",\"questionsShown\":").append(rs.getInt("questions_shown"))
                          .append("}");
                    }
                    sb.append("]");
                    rs.close(); ps.close(); con.close();
                    sendJson(ex, 200, sb.toString());
                } catch (Exception e) { e.printStackTrace(); sendError(ex, 500, e.getMessage()); }

            } else if (ex.getRequestMethod().equalsIgnoreCase("POST")) {
                try {
                    String body   = readBody(ex);
                    String action = extractJson(body, "action");
                    int examId    = Integer.parseInt(extractJson(body, "examId"));

                    Connection con = DBConnection.getConnection();
                    if (con == null) { sendError(ex, 500, "DB error"); return; }

                    if ("setQuestionsShown".equals(action)) {
                        int shown = Integer.parseInt(extractJson(body, "questionsShown"));
                        PreparedStatement ps = con.prepareStatement(
                            "UPDATE exams SET questions_shown=? WHERE id=?");
                        ps.setInt(1, shown); ps.setInt(2, examId);
                        ps.executeUpdate(); ps.close();
                    } else {
                        // Default / "toggleActive"
                        int active = Integer.parseInt(extractJson(body, "active"));
                        PreparedStatement ps = con.prepareStatement(
                            "UPDATE exams SET is_active=? WHERE id=?");
                        ps.setInt(1, active); ps.setInt(2, examId);
                        ps.executeUpdate(); ps.close();
                    }
                    con.close();
                    sendJson(ex, 200, "{\"success\":true}");
                } catch (Exception e) { e.printStackTrace(); sendError(ex, 500, e.getMessage()); }
            } else {
                sendError(ex, 405, "Method Not Allowed");
            }
        }
    }

  
    static class AdminUsers implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            if (!ex.getRequestMethod().equalsIgnoreCase("GET")) { sendError(ex, 405, "Method Not Allowed"); return; }
            setCorsHeaders(ex);
            try {
                Connection con = DBConnection.getConnection();
                if (con == null) { sendError(ex, 500, "DB error"); return; }
                PreparedStatement ps = con.prepareStatement(
                    "SELECT u.id, u.username, u.full_name, u.role, " +
                    "(SELECT COUNT(*) FROM results r WHERE r.student_id=u.id) AS exams_taken " +
                    "FROM users u ORDER BY u.role, u.full_name");
                ResultSet rs = ps.executeQuery();
                StringBuilder sb = new StringBuilder("[");
                boolean first = true;
                while (rs.next()) {
                    if (!first) sb.append(",");
                    first = false;
                    sb.append("{\"id\":").append(rs.getInt("id"))
                      .append(",\"username\":\"").append(escJson(rs.getString("username"))).append("\"")
                      .append(",\"fullName\":\"").append(escJson(rs.getString("full_name"))).append("\"")
                      .append(",\"role\":\"").append(rs.getString("role")).append("\"")
                      .append(",\"examsTaken\":").append(rs.getInt("exams_taken"))
                      .append("}");
                }
                sb.append("]");
                rs.close(); ps.close(); con.close();
                sendJson(ex, 200, sb.toString());
            } catch (Exception e) { e.printStackTrace(); sendError(ex, 500, e.getMessage()); }
        }
    }

  
    static void sendJson(HttpExchange ex, int code, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        ex.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        ex.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = ex.getResponseBody()) { os.write(bytes); }
    }

    static void sendError(HttpExchange ex, int code, String msg) throws IOException {
        sendJson(ex, code, "{\"success\":false,\"message\":\"" + escJson(msg) + "\"}");
    }

    static void setCorsHeaders(HttpExchange ex) {
        ex.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        ex.getResponseHeaders().set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        ex.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
    }

    static String readBody(HttpExchange ex) throws IOException {
        try (InputStream is = ex.getRequestBody();
             BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            return br.lines().collect(java.util.stream.Collectors.joining("\n"));
        }
    }

    static String extractJson(String json, String key) {
        String k = "\"" + key + "\"";
        int ki = json.indexOf(k);
        if (ki < 0) return null;
        int colon = json.indexOf(':', ki + k.length());
        if (colon < 0) return null;
        int vi = colon + 1;
        while (vi < json.length() && Character.isWhitespace(json.charAt(vi))) vi++;
        if (vi >= json.length()) return null;
        char first = json.charAt(vi);
        if (first == '"') {
            StringBuilder sb = new StringBuilder();
            for (int i = vi + 1; i < json.length(); i++) {
                char c = json.charAt(i);
                if (c == '\\' && i + 1 < json.length()) { sb.append(json.charAt(++i)); continue; }
                if (c == '"') break;
                sb.append(c);
            }
            return sb.toString();
        } else {
            int end = vi;
            while (end < json.length() && ",}] \n\r\t".indexOf(json.charAt(end)) < 0) end++;
            return json.substring(vi, end).trim();
        }
    }

    static String extractJsonBlock(String json, String key) {
        String k = "\"" + key + "\"";
        int ki = json.indexOf(k);
        if (ki < 0) return "{}";
        int colon = json.indexOf(':', ki + k.length());
        int brace = json.indexOf('{', colon);
        if (brace < 0) return "{}";
        int depth = 0, end = brace;
        for (; end < json.length(); end++) {
            if (json.charAt(end) == '{') depth++;
            else if (json.charAt(end) == '}') { depth--; if (depth == 0) break; }
        }
        return json.substring(brace, Math.min(end + 1, json.length()));
    }

    static String getAnswerFromJson(String answersJson, String qId) {
        return extractJson(answersJson, qId);
    }

    static String getQueryParam(String query, String key) {
        if (query == null) return null;
        for (String part : query.split("&")) {
            String[] kv = part.split("=", 2);
            if (kv.length == 2 && kv[0].equals(key)) return kv[1];
        }
        return null;
    }

    static String escJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t");
    }
}
