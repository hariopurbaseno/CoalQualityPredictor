// =========================================
// Dummy Prediction Demo
// =========================================

document.querySelector(".predict-btn").addEventListener("click", function () {

    this.innerHTML = "⏳ Predicting...";
    this.disabled = true;

    setTimeout(() => {

        document.getElementById("tmar").innerHTML = "29.35 %";
        document.getElementById("im").innerHTML = "24.71 %";
        document.getElementById("vm").innerHTML = "38.18 %";
        document.getElementById("fc").innerHTML = "31.12 %";
        document.getElementById("ash").innerHTML = "5.84 %";
        document.getElementById("ts").innerHTML = "0.12 %";
        document.getElementById("cvadb").innerHTML = "4638 kcal/kg";
        document.getElementById("cvar").innerHTML = "4787 kcal/kg";
        document.getElementById("cvdaf").innerHTML = "6874 kcal/kg";
        document.getElementById("hgi").innerHTML = "42";

        this.innerHTML = "🔮 Predict";
        this.disabled = false;

    }, 1500);

});


// =========================================
// Reset
// =========================================

document.querySelector(".reset-btn").addEventListener("click", function () {

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

    ids.forEach(id => {
        document.getElementById(id).innerHTML = "--";
    });

});


// =========================================
// Copy Result
// =========================================

document.getElementById("copyButton").addEventListener("click", function () {

    const text =
`TM_AR\t${document.getElementById("tmar").innerText}
IM\t${document.getElementById("im").innerText}
VM\t${document.getElementById("vm").innerText}
FC\t${document.getElementById("fc").innerText}
ASH_ADB\t${document.getElementById("ash").innerText}
TS\t${document.getElementById("ts").innerText}
CV_ADB\t${document.getElementById("cvadb").innerText}
CV_AR\t${document.getElementById("cvar").innerText}
CV_DAF\t${document.getElementById("cvdaf").innerText}
HGI\t${document.getElementById("hgi").innerText}`;

    navigator.clipboard.writeText(text);

    alert("Prediction copied to clipboard!");

});
