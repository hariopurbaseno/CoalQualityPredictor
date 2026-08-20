// ==========================================================
// COAL QUALITY PREDICTOR
// ==========================================================

// ==========================================================
// LOAD SEAM LIST
// ==========================================================

window.addEventListener("DOMContentLoaded", function () {
    loadSeams();
});


async function loadSeams() {

    const seamSelect = document.getElementById("seam");

    try {

        const response = await fetch("/seams");

        if (!response.ok) {
            throw new Error("Failed to load seam list");
        }

        const seams = await response.json();

        seamSelect.innerHTML = "";

        seams.forEach(function (seam) {

            const option = document.createElement("option");

            option.value = seam;
            option.textContent = seam;

            seamSelect.appendChild(option);

        });

    } catch (error) {

        console.warn("Seam endpoint not available:", error);

        // --------------------------------------------------
        // Temporary fallback
        // --------------------------------------------------

        seamSelect.innerHTML = "";

        const fallbackSeams = [
            "T117",
            "T120",
            "T121"
        ];

        fallbackSeams.forEach(function (seam) {

            const option = document.createElement("option");

            option.value = seam;
            option.textContent = seam;

            seamSelect.appendChild(option);

        });

    }

}


// ==========================================================
// PREDICT QUALITY
// ==========================================================

async function predictQuality() {

    const button = document.getElementById("predictBtn");

    // ------------------------------------------------------
    // Get input values
    // ------------------------------------------------------

    const seam = document.getElementById("seam").value;
    const north = document.getElementById("north").value;
    const east = document.getElementById("east").value;
    const rl = document.getElementById("rl").value;

    // ------------------------------------------------------
    // Validation
    // ------------------------------------------------------

    if (!seam) {

        alert("Please select a Coal Seam.");

        return;

    }

    if (north === "" || east === "" || rl === "") {

        alert("Please complete all coordinate and elevation inputs.");

        return;

    }


    // ------------------------------------------------------
    // Loading state
    // ------------------------------------------------------

    button.disabled = true;
    button.innerHTML = "⏳ Predicting...";


    try {

        // --------------------------------------------------
        // Send request to Flask
        // --------------------------------------------------

        const response = await fetch("/predict", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                seam: seam,
                north: parseFloat(north),
                east: parseFloat(east),
                rl: parseFloat(rl)

            })

        });


        // --------------------------------------------------
        // Read response
        // --------------------------------------------------

        const data = await response.json();


        // --------------------------------------------------
        // Backend error
        // --------------------------------------------------

        if (!response.ok || data.error) {

            throw new Error(
                data.error || "Prediction failed."
            );

        }

        // ------------------------------------------------------
        // Update Reliability
        // ------------------------------------------------------

        document.getElementById("reliability-level").textContent =
            data.Reliability;

        document.getElementById("reliability-detail").textContent =
            data.Within_QC.toFixed(2) + "% Within ±75 kcal/kg";


        // -----------------------------
        // Model Confidence
        // -----------------------------

        const confidence = data.Confidence;

        const confidenceStars = {
            "High": "★★★★★",
            "Medium": "★★★★☆",
            "Low": "★★★☆☆",
            "Very Low": "★☆☆☆☆"
        };

        document.getElementById("confidence-stars").textContent =
            confidenceStars[confidence] || "☆☆☆☆☆";

        document.getElementById("confidence-level").textContent =
            confidence;

        // --------------------------------------------------
        // Update Prediction Detail
        // --------------------------------------------------

        document.getElementById("tmar").textContent =
            formatNumber(data.TM_AR, 2) + " %";

        document.getElementById("im").textContent =
            formatNumber(data.IM, 2) + " %";

        document.getElementById("vm").textContent =
            formatNumber(data.VM, 2) + " %";

        document.getElementById("fc").textContent =
            formatNumber(data.FC, 2) + " %";

        document.getElementById("ash").textContent =
            formatNumber(data.ASH_ADB, 2) + " %";

        document.getElementById("ts").textContent =
            formatNumber(data.TS, 3) + " %";

        document.getElementById("cvadb").textContent =
            formatNumber(data.CV_ADB, 0) + " kcal/kg";

        document.getElementById("cvar").textContent =
            formatNumber(data.CV_AR, 0) + " kcal/kg";

        document.getElementById("cvdaf").textContent =
            formatNumber(data.CV_DAF, 0) + " kcal/kg";

        document.getElementById("hgi").textContent =
            formatNumber(data.HGI, 0);


        // --------------------------------------------------
        // Update Summary Cards
        // --------------------------------------------------

        document.getElementById("summary-cvar").textContent =
            formatNumber(data.CV_AR, 0);

        document.getElementById("summary-hgi").textContent =
            formatNumber(data.HGI, 0);


        // --------------------------------------------------
        // Update status
        // --------------------------------------------------

        const status = document.querySelector(".status-ready");

        if (status) {

            status.textContent = "🟢 Prediction Completed";

        }


    } catch (error) {

        console.error("Prediction Error:", error);

        alert(
            "Prediction failed:\n\n" +
            error.message
        );

    } finally {

        // --------------------------------------------------
        // Restore button
        // --------------------------------------------------

        button.disabled = false;
        button.innerHTML = "⛏️ Predict";

    }

}


// ==========================================================
// NUMBER FORMATTER
// ==========================================================

function formatNumber(value, decimals) {

    if (value === null || value === undefined || isNaN(value)) {

        return "--";

    }

    return Number(value).toLocaleString(
        "en-US",
        {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }
    );

}


// ==========================================================
// RESET FORM
// ==========================================================

function resetForm() {

    document.getElementById("north").value = "";
    document.getElementById("east").value = "";
    document.getElementById("rl").value = "";


    // ------------------------------------------------------
    // Reset prediction results
    // ------------------------------------------------------

    document.getElementById("summary-cvar").textContent = "--";
    document.getElementById("summary-hgi").textContent = "--";


    document.getElementById("tmar").textContent = "--";
    document.getElementById("im").textContent = "--";
    document.getElementById("vm").textContent = "--";
    document.getElementById("fc").textContent = "--";
    document.getElementById("ash").textContent = "--";
    document.getElementById("ts").textContent = "--";
    document.getElementById("cvadb").textContent = "--";
    document.getElementById("cvar").textContent = "--";
    document.getElementById("cvdaf").textContent = "--";
    document.getElementById("hgi").textContent = "--";


    // ------------------------------------------------------
    // Reset status
    // ------------------------------------------------------

    const status = document.querySelector(".status-ready");

    if (status) {

        status.textContent = "🟢 Ready";

    }

}


// ==========================================================
// COPY RESULT
// ==========================================================

async function copyResult() {

    const cleanValue = (id) => {
        const text = document.getElementById(id).textContent.trim();

        if (!text || text === "--") {
            return "";
        }

        // Hapus satuan dan pemisah ribuan
        return text
            .replace(/kcal\/kg/g, "")
            .replace(/%/g, "")
            .replace(/,/g, "")
            .trim();
    };

    const values = [
        cleanValue("tmar"),
        cleanValue("im"),
        cleanValue("vm"),
        cleanValue("fc"),
        cleanValue("ash"),
        cleanValue("ts"),
        cleanValue("cvdaf"),
        cleanValue("cvadb"),
        cleanValue("cvar"),
        cleanValue("hgi")
    ];

    // TAB = otomatis menjadi kolom saat di-paste ke Excel
    const resultText = values.join("\t");

    try {

        await navigator.clipboard.writeText(resultText);

        alert("Prediction values copied.");

    } catch (error) {

        console.error("Copy failed:", error);

        alert("Unable to copy prediction values.");

    }
}// ==========================================================
// CONFIDENCE LEVEL
// ==========================================================

function getConfidenceLevel(confidence) {

    if (confidence >= 90) {
        return "Excellent";
    }

    if (confidence >= 80) {
        return "Very Good";
    }

    if (confidence >= 70) {
        return "Good";
    }

    if (confidence >= 60) {
        return "Moderate";
    }

    return "Low";
}


// ==========================================================
// CONFIDENCE STARS
// ==========================================================

function getConfidenceStars(confidence) {

    let stars = 0;

    if (confidence >= 90) {
        stars = 5;
    }
    else if (confidence >= 80) {
        stars = 4;
    }
    else if (confidence >= 70) {
        stars = 3;
    }
    else if (confidence >= 60) {
        stars = 2;
    }
    else {
        stars = 1;
    }

    return "★".repeat(stars) +
           "☆".repeat(5 - stars);
}

// ==========================================================
// NORTH TUTUPAN MAP — CLICK TO SELECT LOCATION
// ==========================================================

const tutupanMap = document.getElementById("tutupan-map");

if (tutupanMap) {

    tutupanMap.addEventListener("click", function (event) {

        const rect = tutupanMap.getBoundingClientRect();

        // Posisi klik relatif terhadap gambar yang tampil di browser
        const displayX = event.clientX - rect.left;
        const displayY = event.clientY - rect.top;

        // Skala dari ukuran display ke ukuran asli gambar
        const scaleX = tutupanMap.naturalWidth / rect.width;
        const scaleY = tutupanMap.naturalHeight / rect.height;

        const pixelX = displayX * scaleX;
        const pixelY = displayY * scaleY;

        // --------------------------------------------------
        // MAP CALIBRATION
        // Image size: 3364 × 2380
        // East  : 0 → 20000
        // North : 10000 → 20000
        // --------------------------------------------------

        const EAST_LEFT = 0;
        const EAST_RIGHT = 20000;

        const NORTH_BOTTOM = 10000;
        const NORTH_TOP = 20000;

        const IMAGE_WIDTH = 3364;
        const IMAGE_HEIGHT = 2380;

        const east =
            EAST_LEFT +
            (pixelX / IMAGE_WIDTH) *
            (EAST_RIGHT - EAST_LEFT);

        const north =
            NORTH_BOTTOM +
            (1 - pixelY / IMAGE_HEIGHT) *
            (NORTH_TOP - NORTH_BOTTOM);

        // --------------------------------------------------
        // Fill coordinate inputs
        // --------------------------------------------------

        document.getElementById("north").value =
            north.toFixed(3);

        document.getElementById("east").value =
            east.toFixed(3);

        // --------------------------------------------------
        // Visual marker
        // --------------------------------------------------

        let marker = document.getElementById("map-marker");

        if (!marker) {

            marker = document.createElement("div");

            marker.id = "map-marker";

            marker.style.position = "absolute";
            marker.style.width = "14px";
            marker.style.height = "14px";
            marker.style.background = "#e53935";
            marker.style.border = "3px solid white";
            marker.style.borderRadius = "50%";
            marker.style.boxShadow = "0 2px 6px rgba(0,0,0,0.35)";
            marker.style.transform = "translate(-50%, -50%)";
            marker.style.pointerEvents = "none";

            tutupanMap.parentElement.style.position = "relative";
            tutupanMap.parentElement.appendChild(marker);
        }

        marker.style.left = displayX + "px";
        marker.style.top = displayY + "px";

        console.log("Map selection:", {
            pixelX: pixelX,
            pixelY: pixelY,
            east: east,
            north: north
        });

    });

}