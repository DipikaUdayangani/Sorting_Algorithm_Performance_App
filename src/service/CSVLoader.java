package service;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Handles CSV file uploading, column extraction, and numeric data extraction.
 */
public class CSVLoader {

    private List<String> headers;
    private List<CSVRecord> records;


    public void loadCSV(String filePath) throws IOException {
        try (Reader in = new FileReader(filePath);
             CSVParser parser = new CSVParser(in, CSVFormat.DEFAULT.withFirstRecordAsHeader())) {

            // 1. Get headers (available columns)
            Map<String, Integer> headerMap = parser.getHeaderMap();
            if (headerMap != null) {
                this.headers = new ArrayList<>(headerMap.keySet());
            } else {
                throw new IOException("CSV file must have a header row.");
            }

            // 2. Get records
            this.records = parser.getRecords();

        }
    }

    /**
     * @return The list of available column headers.
     */
    public List<String> getAvailableColumns() {
        return headers;
    }


    public Double[] extractNumericColumn(String columnName) {
        if (!headers.contains(columnName)) {
            throw new IllegalArgumentException("Column '" + columnName + "' not found.");
        }

        List<Double> dataList = new ArrayList<>();

        for (CSVRecord record : records) {
            try {
                // Get the string value, handle potential empty cells as 0.0 or skip them
                String value = record.get(columnName).trim();
                if (!value.isEmpty()) {
                    dataList.add(Double.parseDouble(value));
                }
            } catch (Exception e) {
                // Proper handling for edge cases (e.g., non-numeric data in a supposedly numeric column) [cite: 72]
                throw new NumberFormatException("Data in column '" + columnName + "' is not numeric at row " + (record.getRecordNumber() + 1));
            }
        }

        return dataList.toArray(new Double[0]);
    }
}