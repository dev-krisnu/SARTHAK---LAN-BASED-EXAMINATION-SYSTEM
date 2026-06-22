import java.sql.Connection;
import java.sql.DriverManager;

public class DBConnection {

    private static final String DB_URL  = "jdbc:mysql://localhost:3306/lan_exam?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    private static final String DB_USER = "root";
    private static final String DB_PASS = "**************"; // change this to your mysql password

    public static Connection getConnection() {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            return DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
        } catch (Exception e) {
            System.err.println("[DBConnection] Failed: " + e.getMessage());
            return null;
        }
    }
}
