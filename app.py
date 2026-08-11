from flask import Flask, request, jsonify, send_from_directory
import os
import pandas as pd

# ==========================================================
# SAME FUNCTION USED WHEN MODEL WAS TRAINED
# ==========================================================

def calculate_derived_quality(pred):

    pred = pred.copy()

    pred["VM"] = (
        100
        - pred["IM"]
        - pred["FC"]
        - pred["ASH_ADB"]
    )

    pred["CV_AR"] = (
        pred["CV_ADB"]
        * (100 - pred["TM_AR"])
        / (100 - pred["IM"])
    )

    pred["CV_DAF"] = (
        pred["CV_ADB"]
        * 100
        / (
            100
            - pred["ASH_ADB"]
            - pred["IM"]
        )
    )

    return pred

# ==========================================================
# IMPORT MODEL
# ==========================================================

import sys

# Model .pkl menyimpan referensi ke
# __main__.calculate_derived_quality.
# Saat dijalankan Gunicorn, app.py bukan __main__,
# sehingga kita expose fungsi tersebut ke __main__.

sys.modules["__main__"].calculate_derived_quality = calculate_derived_quality

from predictor import predict_quality, models



# ==========================================================
# MAKE FUNCTION AVAILABLE AS __main__
# ==========================================================

sys.modules["__main__"].calculate_derived_quality = calculate_derived_quality

# ==========================================================
# IMPORT MODEL
# ==========================================================

from predictor import predict_quality, models


# ==========================================================
# FLASK APP
# ==========================================================

app = Flask(
    __name__,
    static_folder=".",
    static_url_path=""
)


# ==========================================================
# HOME PAGE
# ==========================================================

@app.route("/")
def home():

    return send_from_directory(
        ".",
        "index.html"
    )


# ==========================================================
# GET SEAM LIST FROM MODEL
# ==========================================================

@app.route("/seams")
def get_seams():

    try:

        feature_names = (
            models["TM_AR"]
            .feature_names_in_
        )

        seam_list = []

        for feature in feature_names:

            if feature.startswith("Seam_"):

                seam = feature.replace(
                    "Seam_",
                    "",
                    1
                )

                seam_list.append(seam)

        return jsonify(
            sorted(seam_list)
        )

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ==========================================================
# PREDICT API
# ==========================================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        data = request.get_json()

        seam = data["seam"]

        north = float(
            data["north"]
        )

        east = float(
            data["east"]
        )

        rl = float(
            data["rl"]
        )

        result = predict_quality(

            seam=seam,
            north=north,
            east=east,
            rl=rl

        )

        return jsonify(result)

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ==========================================================
# RUN
# ==========================================================

if __name__ == "__main__":

    app.run(

        host="0.0.0.0",

        port=int(
            os.environ.get(
                "PORT",
                5000
            )
        ),

        debug=False

    )