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

    const seam = document.getElementById("seam").value;
    const north = document.getElementById("north").value;
    const east = document.getElementById("east").value;
    const rl = document.getElementById("rl").value;


    const resultText =

`COAL QUALITY PREDICTION
================================

Input Parameters
----------------
Coal Seam       : ${seam}
North Coordinate: ${north}
East Coordinate : ${east}
Elevation (RL)  : ${rl}

Prediction Result
-----------------
TM_AR    : ${document.getElementById("tmar").innerText}
IM       : ${document.getElementById("im").innerText}
VM       : ${document.getElementById("vm").innerText}
FC       : ${document.getElementById("fc").innerText}
ASH_ADB  : ${document.getElementById("ash").innerText}
TS       : ${document.getElementById("ts").innerText}
CV_ADB   : ${document.getElementById("cvadb").innerText}
CV_AR    : ${document.getElementById("cvar").innerText}
CV_DAF   : ${document.getElementById("cvdaf").innerText}
HGI      : ${document.getElementById("hgi").innerText}

================================
Machine Learning Based Prediction`;


    try {

        await navigator.clipboard.writeText(resultText);

        alert("Prediction result copied.");

    } catch (error) {

        console.error("Copy failed:", error);

        alert("Unable to copy prediction result.");

    }

}