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
