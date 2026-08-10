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
`${document.getElementById("tmar").innerText.replace(" %","")}\t` +
`${document.getElementById("im").innerText.replace(" %","")}\t` +
`${document.getElementById("vm").innerText.replace(" %","")}\t` +
`${document.getElementById("fc").innerText.replace(" %","")}\t` +
`${document.getElementById("ash").innerText.replace(" %","")}\t` +
`${document.getElementById("ts").innerText.replace(" %","")}\t` +
`${document.getElementById("cvdaf").innerText.replace(" kcal/kg","")}\t` +
`${document.getElementById("cvadb").innerText.replace(" kcal/kg","")}\t` +
`${document.getElementById("cvar").innerText.replace(" kcal/kg","")}\t` +
`${document.getElementById("hgi").innerText}`;

    navigator.clipboard.writeText(text);

    alert("Prediction copied to clipboard!");

});
