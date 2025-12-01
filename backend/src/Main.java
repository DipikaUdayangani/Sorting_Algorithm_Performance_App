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
            String body = bodyBuilder.toString();
            System.out.println("📦 Body received: " + body.length() + " characters");

            if (requestLine.startsWith("POST /sort")) {
                handleSortRequest(body, out);
            } else if (requestLine.startsWith("GET /")) {
                // Serve the HTML page
                serveStaticFile(requestLine, out);
            } else {
                // Simple response for other requests
                String response = "HTTP/1.1 200 OK\r\n" +
                        "Content-Type: text/plain\r\n" +
                        "Access-Control-Allow-Origin: *\r\n\r\n" +
                        "SortServer is running!";
                out.write(response.getBytes());
            }

            out.close();
            in.close();
            socket.close();

        } catch (Exception e) {
            System.err.println("❌ Error handling request: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void serveStaticFile(String requestLine, OutputStream out) throws IOException {
        try {
            String requestedFile = requestLine.split(" ")[1];
            if (requestedFile.equals("/")) {
                requestedFile = "/index.html";
            }

            // Security: prevent directory traversal
            if (requestedFile.contains("..")) {
                send404(out);
                return;
            }

            String filename = "www" + requestedFile;
            File file = new File(filename);

            if (!file.exists() || file.isDirectory()) {
                send404(out);
                return;
            }

            String contentType = getContentType(filename);
            byte[] fileContent = Files.readAllBytes(file.toPath());

            String response = "HTTP/1.1 200 OK\r\n" +
                    "Content-Type: " + contentType + "\r\n" +
                    "Content-Length: " + fileContent.length + "\r\n" +
                    "Access-Control-Allow-Origin: *\r\n\r\n";

            out.write(response.getBytes());
            out.write(fileContent);
            System.out.println("✅ Served file: " + filename);

        } catch (Exception e) {
            send404(out);
        }
    }

    private static String getContentType(String filename) {
        if (filename.endsWith(".html")) return "text/html";
        if (filename.endsWith(".css")) return "text/css";
        if (filename.endsWith(".js")) return "application/javascript";
        return "text/plain";
    }

    private static void send404(OutputStream out) throws IOException {
        String response = "HTTP/1.1 404 Not Found\r\n" +
                "Content-Type: text/html\r\n\r\n" +
                "<h1>404 - File Not Found</h1>";
        out.write(response.getBytes());
    }
    //cvs file handling
    private static void handleSortRequest(String body, OutputStream out) throws Exception {
        try {
            // FORMAT: CSV_DATA ### COLUMN_NAME
            String[] parts = body.split("###");
            if (parts.length < 2) {
                throw new Exception("Invalid request format. Expected: CSV###COLUMN");
            }

            String csvData = parts[0].trim();
            String columnName = parts[1].trim();

            System.out.println("📊 Processing CSV data for column: " + columnName);
            System.out.println("CSV sample: " + csvData.substring(0, Math.min(100, csvData.length())));

            List<String[]> rows = new ArrayList<>();
            String[] lines = csvData.split("\r\n|\n");

            for (String line : lines) {
                if (!line.trim().isEmpty()) {
                    rows.add(line.split(","));
                }
            }

            if (rows.size() < 2) {
                throw new Exception("CSV must have header and at least one data row");
            }

            // Find column index
            String[] header = rows.get(0);
            int columnIndex = -1;
            for (int i = 0; i < header.length; i++) {
                if (header[i].trim().equalsIgnoreCase(columnName)) {
                    columnIndex = i;
                    break;
                }
            }

            if (columnIndex == -1) {
                throw new Exception("Column '" + columnName + "' not found. Available columns: " + Arrays.toString(header));
            }

            // Extract and validate numeric data
            List<Double> numericData = new ArrayList<>();
            for (int i = 1; i < rows.size(); i++) {
                if (columnIndex < rows.get(i).length) {
                    String value = rows.get(i)[columnIndex].trim();
                    try {
                        numericData.add(Double.parseDouble(value));
                    } catch (NumberFormatException e) {
                        throw new Exception("Non-numeric value found: '" + value + "' in column '" + columnName + "'");
                    }
                }
            }

            if (numericData.isEmpty()) {
                throw new Exception("No numeric data found in column: " + columnName);
            }

            // Convert to String array for sorting
            String[] originalCol = new String[numericData.size()];
            for (int i = 0; i < numericData.size(); i++) {
                originalCol[i] = String.valueOf(numericData.get(i));
            }

            System.out.println("🔢 Sorting " + originalCol.length + " numeric values");
        }
    }

}



    