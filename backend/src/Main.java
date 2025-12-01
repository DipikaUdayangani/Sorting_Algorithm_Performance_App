import java.io.*;
import java.net.*;
import java.util.*;
import java.nio.file.Files;

public class Main {

    public static void main(String[] args) throws Exception {
        try {
            ServerSocket server = new ServerSocket(8080);
            System.out.println("Server running on http://localhost:8080");
            System.out.println("✅ Ready to accept connections...");

            while (true) {
                Socket socket = server.accept();
                System.out.println("🔗 New client connected");
                new Thread(() -> handle(socket)).start();
            }
        } catch (IOException e) {
            System.err.println("❌ Server error: " + e.getMessage());
        }
    }

    private static void handle(Socket socket) {
        try {
            BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            OutputStream out = socket.getOutputStream();

            String requestLine = in.readLine();
            if (requestLine == null) {
                socket.close();
                return;
            }

            System.out.println("📨 Received: " + requestLine);

            // Read headers to get content length
            String line;
            int contentLength = 0;
            while ((line = in.readLine()) != null && !line.isEmpty()) {
                if (line.toLowerCase().startsWith("content-length:")) {
                    contentLength = Integer.parseInt(line.substring(15).trim());
                }
            }

            // Read request body
            StringBuilder bodyBuilder = new StringBuilder();
            if (contentLength > 0) {
                char[] bodyChars = new char[contentLength];
                in.read(bodyChars, 0, contentLength);
                bodyBuilder.append(bodyChars);
            }
        }
    }
}
    