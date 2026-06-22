import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.util.concurrent.Executors;

public class MainServer {

    static final int PORT = 8080;

    public static void main(String[] args) throws Exception {
        System.out.println("  LAN EXAM SYSTEM  |  Starting on port " + PORT);
        if (DBConnection.getConnection() == null) {
            System.err.println("[ERROR] Cannot connect to database. Check DBConnection.java and your MySQL settings.");
            System.exit(1);
        }
        System.out.println("[DB] Database connected successfully.");

        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        server.createContext("/", new StaticFileHandler());

        server.createContext("/api/login",       new ApiHandler.Login());
        server.createContext("/api/signup",       new ApiHandler.Signup());
        server.createContext("/api/exams",        new ApiHandler.ExamList());
        server.createContext("/api/questions",    new ApiHandler.QuestionList());
        server.createContext("/api/submit",       new ApiHandler.SubmitExam());
        server.createContext("/api/results",      new ApiHandler.Results());
        server.createContext("/api/admin/exams",  new ApiHandler.AdminExams());
        server.createContext("/api/admin/users",  new ApiHandler.AdminUsers());

        server.setExecutor(Executors.newFixedThreadPool(20));
        server.start();

        System.out.println("[SERVER] Running at  http://localhost:" + PORT);
        System.out.println("[SERVER] Share with LAN clients at  http://<your-IP>:" + PORT);
        System.out.println("         (find your IP with: ipconfig on Windows / ifconfig on Linux)");
        System.out.println("         Press Ctrl+C to stop.");
    }
    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange ex) throws IOException {
            String uri = ex.getRequestURI().getPath();
            if (uri.equals("/")) uri = "/index.html";

            File file = new File("web" + uri);
            if (!file.exists() || file.isDirectory()) {
                file = new File("web/index.html");
            }

            if (file.exists()) {
                byte[] bytes = Files.readAllBytes(file.toPath());
                String mime = getMimeType(uri);
                ex.getResponseHeaders().set("Content-Type", mime);
                ex.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = ex.getResponseBody()) { os.write(bytes); }
            } else {
                String msg = "404 Not Found";
                ex.sendResponseHeaders(404, msg.length());
                try (OutputStream os = ex.getResponseBody()) { os.write(msg.getBytes()); }
            }
        }

        private String getMimeType(String uri) {
            if (uri.endsWith(".html")) return "text/html; charset=UTF-8";
            if (uri.endsWith(".css"))  return "text/css";
            if (uri.endsWith(".js"))   return "application/javascript";
            if (uri.endsWith(".png"))  return "image/png";
            if (uri.endsWith(".ico"))  return "image/x-icon";
            return "text/plain";
        }
    }
}
