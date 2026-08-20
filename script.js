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
        // Focus map on predicted coordinate
        // --------------------------------------------------

        setMapLocation(
             parseFloat(north),
            parseFloat(east),
            true
        );


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
// NORTH TUTUPAN INTERACTIVE MAP
// ==========================================================

const tutupanMap = document.getElementById("tutupan-map");
const mapVectorsWrapper = document.getElementById("map-vectors-wrapper");
const mapContainer = document.querySelector(".map-container");
const mapStatus = document.getElementById("map-location-status");


// ----------------------------------------------------------
// MAP CALIBRATION
// ----------------------------------------------------------
//
// Image size:
// 3364 × 2380 px
//
// EAST:
// X = 965  → 0
// X = 1812 → 5000
// X = 2659 → 10000
//
// NORTH:
// Y = 2121 → 10000
// Y = 1273 → 15000
// Y = 425  → 20000
// ----------------------------------------------------------

const MAP_CALIBRATION = {

    eastPixelMin: 1005,
    eastPixelMax: 2770,
    eastMin: 0,
    eastMax: 10000,

    northPixelTop: 442,
    northPixelBottom: 2210,
    northMax: 20000,
    northMin: 10000

};


// ----------------------------------------------------------
// MAP STATE
// ----------------------------------------------------------

const mapState = {

    scale: 1,
    baseScale: 1,

    left: 0,
    top: 0,

    dragging: false,

    dragStartX: 0,
    dragStartY: 0,

    startLeft: 0,
    startTop: 0,

    selectedPixelX: null,
    selectedPixelY: null

};


// ----------------------------------------------------------
// INITIALIZE MAP
// ----------------------------------------------------------

function initializeTutupanMap() {

    if (!tutupanMap || !mapContainer) {
        return;
    }

    if (!tutupanMap.complete) {

        tutupanMap.addEventListener(
            "load",
            initializeTutupanMap,
            { once: true }
        );

        return;
    }

    calculateBaseMap();

}


// ----------------------------------------------------------
// CALCULATE BASE MAP
// ----------------------------------------------------------

function calculateBaseMap() {

    const containerWidth =
        mapContainer.clientWidth;

    const containerHeight =
        mapContainer.clientHeight;

    const imageWidth =
        tutupanMap.naturalWidth;

    const imageHeight =
        tutupanMap.naturalHeight;


    // Cover the available map area.
    mapState.baseScale = Math.max(
        containerWidth / imageWidth,
        containerHeight / imageHeight
    );

    mapState.scale =
        mapState.baseScale;


    const displayWidth =
        imageWidth * mapState.scale;

    const displayHeight =
        imageHeight * mapState.scale;


    mapState.left =
        (containerWidth - displayWidth) / 2;

    mapState.top =
        (containerHeight - displayHeight) / 2;


    renderMap();

}


// ----------------------------------------------------------
// RENDER MAP
// ----------------------------------------------------------

function renderMap() {

    if (!tutupanMap || !mapContainer) {
        return;
    }


    const width =
        tutupanMap.naturalWidth *
        mapState.scale;

    const height =
        tutupanMap.naturalHeight *
        mapState.scale;


    tutupanMap.style.width =
        width + "px";

    tutupanMap.style.height =
        height + "px";

    tutupanMap.style.left =
        mapState.left + "px";

    tutupanMap.style.top =
        mapState.top + "px";

    if (mapVectorsWrapper) {

    mapVectorsWrapper.style.left =
        mapState.left + "px";

    mapVectorsWrapper.style.top =
        mapState.top + "px";

    mapVectorsWrapper.style.transform =
        `scale(${mapState.scale})`;
    }

    updateMarker();

}


// ----------------------------------------------------------
// PIXEL → EAST
// ----------------------------------------------------------

function pixelToEast(pixelX) {

    const ratio =
        (pixelX - MAP_CALIBRATION.eastPixelMin) /
        (
            MAP_CALIBRATION.eastPixelMax -
            MAP_CALIBRATION.eastPixelMin
        );

    return (
        MAP_CALIBRATION.eastMin +
        ratio *
        (
            MAP_CALIBRATION.eastMax -
            MAP_CALIBRATION.eastMin
        )
    );

}


// ----------------------------------------------------------
// PIXEL → NORTH
// ----------------------------------------------------------

function pixelToNorth(pixelY) {

    const ratio =
        (pixelY - MAP_CALIBRATION.northPixelTop) /
        (
            MAP_CALIBRATION.northPixelBottom -
            MAP_CALIBRATION.northPixelTop
        );

    return (
        MAP_CALIBRATION.northMax -
        ratio *
        (
            MAP_CALIBRATION.northMax -
            MAP_CALIBRATION.northMin
        )
    );

}


// ----------------------------------------------------------
// EAST → PIXEL
// ----------------------------------------------------------

function eastToPixel(east) {

    return MAP_CALIBRATION.eastPixelMin +
        (
            (east - MAP_CALIBRATION.eastMin) /
            (
                MAP_CALIBRATION.eastMax -
                MAP_CALIBRATION.eastMin
            )
        ) *
        (
            MAP_CALIBRATION.eastPixelMax -
            MAP_CALIBRATION.eastPixelMin
        );

}


// ----------------------------------------------------------
// NORTH → PIXEL
// ----------------------------------------------------------

function northToPixel(north) {

    return MAP_CALIBRATION.northPixelTop +
        (
            (MAP_CALIBRATION.northMax - north) /
            (
                MAP_CALIBRATION.northMax -
                MAP_CALIBRATION.northMin
            )
        ) *
        (
            MAP_CALIBRATION.northPixelBottom -
            MAP_CALIBRATION.northPixelTop
        );

}


// ----------------------------------------------------------
// CREATE / UPDATE MARKER
// ----------------------------------------------------------

function updateMarker() {

    if (
        mapState.selectedPixelX === null ||
        mapState.selectedPixelY === null
    ) {
        return;
    }


    let marker =
        document.getElementById("map-marker");


    if (!marker) {

        marker =
            document.createElement("div");

        marker.id =
            "map-marker";

        mapContainer.appendChild(marker);

    }


    marker.style.left =
        (
            mapState.left +
            mapState.selectedPixelX *
            mapState.scale
        ) + "px";


    marker.style.top =
        (
            mapState.top +
            mapState.selectedPixelY *
            mapState.scale
        ) + "px";

}


// ----------------------------------------------------------
// SET MAP LOCATION
// ----------------------------------------------------------

function setMapLocation(
    north,
    east,
    zoomToLocation = false
) {

    if (!tutupanMap || !mapContainer) {
        return;
    }


    const pixelX =
        eastToPixel(east);

    const pixelY =
        northToPixel(north);


    mapState.selectedPixelX =
        pixelX;

    mapState.selectedPixelY =
        pixelY;


    if (zoomToLocation) {

        const targetZoom = 4.0;

        mapState.scale =
            mapState.baseScale *
            targetZoom;


        const containerWidth =
            mapContainer.clientWidth;

        const containerHeight =
            mapContainer.clientHeight;


        mapState.left =
            containerWidth / 2 -
            pixelX * mapState.scale;


        mapState.top =
            containerHeight / 2 -
            pixelY * mapState.scale;

    }


    renderMap();


    if (mapStatus) {

        mapStatus.textContent =
            "N " +
            Number(north).toFixed(3) +
            "  |  E " +
            Number(east).toFixed(3);

    }

}


// ----------------------------------------------------------
// CLICK MAP
// ----------------------------------------------------------

mapContainer?.addEventListener(
    "click",
    function (event) {

        // Ignore click after dragging
        if (mapState.dragging) {
            return;
        }


        const rect =
            mapContainer.getBoundingClientRect();


        const containerX =
            event.clientX -
            rect.left;

        const containerY =
            event.clientY -
            rect.top;


        const pixelX =
            (
                containerX -
                mapState.left
            ) /
            mapState.scale;


        const pixelY =
            (
                containerY -
                mapState.top
            ) /
            mapState.scale;


        // Ignore clicks outside image
        if (
            pixelX < 0 ||
            pixelX > tutupanMap.naturalWidth ||
            pixelY < 0 ||
            pixelY > tutupanMap.naturalHeight
        ) {
            return;
        }


        const east =
            pixelToEast(pixelX);

        const north =
            pixelToNorth(pixelY);


        // Update input fields
        document.getElementById("north").value =
            north.toFixed(3);

        document.getElementById("east").value =
            east.toFixed(3);


        setMapLocation(
            north,
            east,
            false
        );

    }
);


// ----------------------------------------------------------
// MOUSE WHEEL ZOOM
// ----------------------------------------------------------

mapContainer?.addEventListener(
    "wheel",
    function (event) {

        event.preventDefault();


        const rect =
            mapContainer.getBoundingClientRect();


        const mouseX =
            event.clientX -
            rect.left;

        const mouseY =
            event.clientY -
            rect.top;


        const oldScale =
            mapState.scale;


        const zoomFactor =
            event.deltaY < 0
                ? 1.15
                : 0.87;


        const minZoom =
            mapState.baseScale * 0.75;

        const maxZoom =
            mapState.baseScale * 6;


        const newScale =
            Math.min(
                maxZoom,
                Math.max(
                    minZoom,
                    oldScale * zoomFactor
                )
            );


        // Keep the point under the mouse fixed
        const imageX =
            (
                mouseX -
                mapState.left
            ) /
            oldScale;


        const imageY =
            (
                mouseY -
                mapState.top
            ) /
            oldScale;


        mapState.scale =
            newScale;


        mapState.left =
            mouseX -
            imageX *
            newScale;


        mapState.top =
            mouseY -
            imageY *
            newScale;


        renderMap();

    },
    { passive: false }
);


// ----------------------------------------------------------
// DRAG / PAN MAP
// ----------------------------------------------------------

mapContainer?.addEventListener(
    "mousedown",
    function (event) {

        mapState.dragging =
            false;

        mapState.dragStartX =
            event.clientX;

        mapState.dragStartY =
            event.clientY;

        mapState.startLeft =
            mapState.left;

        mapState.startTop =
            mapState.top;

    }
);


mapContainer?.addEventListener(
    "mousemove",
    function (event) {

        if (
            event.buttons !== 1
        ) {
            return;
        }


        const dx =
            event.clientX -
            mapState.dragStartX;

        const dy =
            event.clientY -
            mapState.dragStartY;


        if (
            Math.abs(dx) > 3 ||
            Math.abs(dy) > 3
        ) {
            mapState.dragging =
                true;
        }


        mapState.left =
            mapState.startLeft +
            dx;

        mapState.top =
            mapState.startTop +
            dy;


        renderMap();

    }
);


mapContainer?.addEventListener(
    "mouseup",
    function () {

        setTimeout(
            function () {
                mapState.dragging = false;
            },
            0
        );

    }
);


mapContainer?.addEventListener(
    "mouseleave",
    function () {

        if (
            mapState.dragging
        ) {
            mapState.dragging = false;
        }

    }
);


// ----------------------------------------------------------
// INITIALIZE
// ----------------------------------------------------------

initializeTutupanMap();


window.addEventListener(
    "resize",
    function () {

        calculateBaseMap();

    }
);