// Global variables
let currentCSVData = null;
let currentHeaders = [];

// Load column names into dropdown when CSV is uploaded
document.getElementById("csvFile").addEventListener("change", function (e) {
    const file = e.target.files[0];
    const fileName = document.getElementById("fileName");
    const columnSection = document.getElementById("columnSection");
    const sortButton = document.getElementById("sortButton");

    if (file) {
        fileName.textContent = file.name;
        fileName.style.color = '#27ae60';
        fileName.innerHTML = `<i class="fas fa-check-circle"></i> ${file.name}`;

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            alert("Please select a CSV file!");
            resetForm();
            return;
        }
    } else {
        fileName.textContent = "No file chosen";
        fileName.style.color = '#6c757d';
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        const content = e.target.result;
        currentCSVData = content;
        processCSV(content);
    };

    reader.onerror = function() {
        alert("Error reading file. Please try again.");
        resetForm();
    };

    reader.readAsText(file);
});

function processCSV(csvContent) {
    console.log("Processing CSV file...");

    const lines = csvContent.split('\n').filter(l => l.trim() !== '');
    if (lines.length === 0) {
        alert("File is empty!");
        resetForm();
        return;
    }

    // Parse headers
    currentHeaders = parseCSVLine(lines[0]);
    console.log("Headers found:", currentHeaders);

    const dropdown = document.getElementById("columnDropdown");
    const columnSection = document.getElementById("columnSection");
    const dataPreview = document.getElementById("dataPreview");
    const sortButton = document.getElementById("sortButton");

    dropdown.innerHTML = '<option value="">-- Select a column --</option>';
    dataPreview.innerHTML = '';

    // Parse data rows
    const dataRows = [];
    for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length === currentHeaders.length && row.some(cell => cell.trim() !== '')) {
            dataRows.push(row);
        }
    }

    console.log(`Found ${dataRows.length} data rows`);

    let numericColumns = [];

    currentHeaders.forEach((header, colIndex) => {
        let isNumeric = true;
        let numericValues = [];
        let hasData = false;

        // Check first 10 rows to determine if column is numeric
        for (let i = 0; i < Math.min(dataRows.length, 10); i++) {
            const value = dataRows[i][colIndex];
            if (value && value.trim() !== '') {
                hasData = true;
                const numValue = parseFloat(value.trim());
                if (isNaN(numValue)) {
                    isNumeric = false;
                    break;
                } else {
                    numericValues.push(numValue);
                }
            }
        }

        if (isNumeric && hasData && numericValues.length > 0) {
            const option = document.createElement("option");
            option.value = header;
            option.textContent = header;
            dropdown.appendChild(option);
            numericColumns.push({
                name: header,
                sample: numericValues.slice(0, 5),
                count: dataRows.length
            });
            console.log(`Found numeric column: ${header}`);
        }
    });

    if (dropdown.children.length === 1) {
        alert("No numeric columns found in this CSV file!\n\nMake sure your CSV has:\n- A header row\n- Numeric data in at least one column\n- No empty rows\n- Proper comma separation");
        console.log("No numeric columns found. Headers:", currentHeaders);
        resetForm();
        return;
    }

    columnSection.style.display = 'block';
    sortButton.disabled = false;

    // Show data preview for first numeric column
    if (numericColumns.length > 0) {
        const preview = numericColumns[0];
        dataPreview.innerHTML = `
            <strong>Sample data from ${preview.name}:</strong> 
            [${preview.sample.join(', ')}...] 
            <br>
            <small>Total rows: ${preview.count}</small>
        `;
    }

    // Update preview when column selection changes
    dropdown.addEventListener('change', function() {
        const selectedColumn = numericColumns.find(col => col.name === this.value);
        if (selectedColumn) {
            dataPreview.innerHTML = `
                <strong>Sample data from ${selectedColumn.name}:</strong> 
                [${selectedColumn.sample.join(', ')}...] 
                <br>
                <small>Total rows: ${selectedColumn.count}</small>
            `;
        }
        sortButton.disabled = !this.value;
    });
}

// Helper function to parse CSV line (handles quotes and commas within fields)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

function resetForm() {
    document.getElementById("csvFile").value = '';
    document.getElementById("fileName").textContent = "No file chosen";
    document.getElementById("fileName").style.color = '#6c757d';
    document.getElementById("columnSection").style.display = 'none';
    document.getElementById("sortButton").disabled = true;
    currentCSVData = null;
    currentHeaders = [];
}

// Run all sorting algorithms
async function runAllAlgorithms() {
    const fileInput = document.getElementById("csvFile");
    const columnSelect = document.getElementById("columnDropdown");
    const button = document.getElementById("sortButton");
    const resultsDiv = document.getElementById("results");

    if (!fileInput.files.length || !currentCSVData) {
        alert("Please select a CSV file first!");
        return;
    }

    const selectedColumn = columnSelect.value;
    if (!selectedColumn) {
        alert("Please select a numeric column to sort!");
        return;
    }

    // Show loading state
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sorting...';
    resultsDiv.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <h3>Sorting in Progress</h3>
            <p>Processing "${selectedColumn}" column...</p>
            <div class="progress-bar">
                <div class="progress"></div>
            </div>
        </div>
    `;

    try {
        console.log("Sending request for column:", selectedColumn);

        const response = await fetch("http://localhost:8080/sort", {
            method: "POST",
            headers: {
                "Content-Type": "text/plain"
            },
            body: currentCSVData + "###" + selectedColumn
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Server error (${response.status})`;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        console.log("Received data:", data);
        displayResults(data);

    } catch (error) {
        console.error("Error:", error);
        resultsDiv.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>${error.message}</p>
                <button onclick="retrySort()" class="btn-primary" style="margin-top: 15px;">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    } finally {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-play"></i> Run All Sorting Algorithms';
    }
}

function retrySort() {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = '';
    runAllAlgorithms();
}

function displayResults(data) {
    const resultsDiv = document.getElementById("results");
    const executionTimes = data.executionTimes;

    // Create performance chart
    const algorithms = Object.keys(executionTimes);
    const times = Object.values(executionTimes);
    const maxTime = Math.max(...times);

    let chartHTML = `
        <div class="performance-chart">
            <h3><i class="fas fa-chart-bar"></i> Performance Comparison</h3>
            <div class="chart-bars">
    `;

    algorithms.forEach((algorithm, index) => {
        const time = times[index];
        const percentage = Math.max((time / maxTime) * 80, 10); // Minimum 10% width
        const isBest = algorithm === data.bestAlgorithm;

        chartHTML += `
            <div class="chart-bar-container">
                <div class="chart-bar-label">${algorithm}</div>
                <div class="chart-bar ${isBest ? 'best' : ''}" style="width: ${percentage}%">
                    <span class="chart-bar-time">${time} ms</span>
                </div>
            </div>
        `;
    });

    chartHTML += `</div></div>`;

    let tableHTML = `
        <div class="card">
            <div class="card-header">
                <h2><i class="fas fa-table"></i> Sorting Results</h2>
            </div>
            <div class="card-body">
                ${chartHTML}
                <table>
                    <thead>
                        <tr>
                            <th>Algorithm</th>
                            <th>Execution Time (ms)</th>
                            <th>Performance</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    // Add rows for each algorithm
    Object.entries(executionTimes).forEach(([algorithm, time]) => {
        const isBest = algorithm === data.bestAlgorithm;
        const rowClass = isBest ? 'best-algorithm' : '';

        tableHTML += `
            <tr class="${rowClass}">
                <td><i class="fas fa-sort-amount-down"></i> ${algorithm}</td>
                <td><strong>${time} ms</strong></td>
                <td>${isBest ? '<span class="best-badge"><i class="fas fa-trophy"></i> FASTEST</span>' : ''}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
        <div class="success">
            <h3><i class="fas fa-trophy"></i> Best Performing Algorithm: ${data.bestAlgorithm}</h3>
            <p>Execution Time: ${data.bestTime} milliseconds</p>
            <small>Results may vary based on dataset size and system performance</small>
        </div>
    `;

    resultsDiv.innerHTML = tableHTML;
}

// Add demo CSV download functionality
function downloadSampleCSV() {
    const sampleCSV = `Name,Age,Salary,Score
John Doe,25,50000,85.5
Jane Smith,30,60000,92.3
Bob Johnson,35,55000,78.9
Alice Brown,28,52000,88.1
Charlie Wilson,40,70000,95.7`;

    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Add sample download link to help text
    const helpText = document.querySelector('.help-text');
    helpText.innerHTML += `<br><a href="javascript:void(0)" onclick="downloadSampleCSV()" class="kaggle-link">
        <i class="fas fa-download"></i> Download sample CSV file
    </a>`;
});
