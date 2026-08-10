// ==========================================================
// Coal Quality Predictor
// ==========================================================

console.log("Coal Quality Predictor Loaded");

// ==========================================================
// Predict
// ==========================================================

document.getElementById("predictBtn").addEventListener("click", async function () {

    const button = this;

    button.disabled = true;
    button.innerHTML = "⏳ Predicting...";

    try {

        const payload = {

            seam: document.getElementById("seam").value,

            north: parseFloat(
                document.getElementById("north").value
            ),

            east: parseFloat(
                document.getElementById("east").value
            ),

            rl: parseFloat(
                document.getElementById("rl").value
            )

        };

        const response = await fetch("/predict", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(payload)

        });

        if (!response.ok) {

            const err = await response.json();
            throw new Error(err.error);

        }

        const result = await response.json();

        document.getElementById("tmar").innerHTML =
            result.TM_AR.toFixed(2) + " %";

        document.getElementById("im").innerHTML =
            result.IM.toFixed(2) + " %";

        document.getElementById("vm").innerHTML =
            result.VM.toFixed(2) + " %";

        document.getElementById("fc").innerHTML =
            result.FC.toFixed(2) + " %";

        document.getElementById("ash").innerHTML =
            result.ASH_ADB.toFixed(2) + " %";

        document.getElementById("ts").innerHTML =
            result.TS.toFixed(3) + " %";

        document.getElementById("cvadb").innerHTML =
            result.CV_ADB.toFixed(0) + " kcal/kg";

        document.getElementById("cvar").innerHTML =
            result.CV_AR.toFixed(0) + " kcal/kg";

        document.getElementById("cvdaf").innerHTML =
            result.CV_DAF.toFixed(0) + " kcal/kg";

        document.getElementById("hgi").innerHTML =
            result.HGI.toFixed(0);

    }

    catch (err) {

        alert("Prediction Failed\n\n" + err.message);

        console.error(err);

    }

    finally {

        button.disabled = false;
        button.innerHTML = "🔮 Predict";

    }

});


// ==========================================================
// Reset
// ==========================================================

document.getElementById("resetBtn").addEventListener("click", function () {

    const ids = [

        "tmar",
        "im",
        "vm",
        "fc",
        "ash",
        "ts",
        "cvadb",
        "cvar",
        "cvdaf",
        "hgi"

    ];

    ids.forEach(function (id) {

        document.getElementById(id).innerHTML = "-";

    });

});


// ==========================================================
// Copy To Clipboard
// ==========================================================

document.getElementById("copyButton").addEventListener("click", function () {

    const text =

        document.getElementById("tmar").innerText.replace(" %", "") + "\t" +
        document.getElementById("im").innerText.replace(" %", "") + "\t" +
        document.getElementById("vm").innerText.replace(" %", "") + "\t" +
        document.getElementById("fc").innerText.replace(" %", "") + "\t" +
        document.getElementById("ash").innerText.replace(" %", "") + "\t" +
        document.getElementById("ts").innerText.replace(" %", "") + "\t" +
        document.getElementById("cvdaf").innerText.replace(" kcal/kg", "") + "\t" +
        document.getElementById("cvadb").innerText.replace(" kcal/kg", "") + "\t" +
        document.getElementById("cvar").innerText.replace(" kcal/kg", "") + "\t" +
        document.getElementById("hgi").innerText;

    navigator.clipboard.writeText(text);

    alert("Prediction copied to clipboard.");

});