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

