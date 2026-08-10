from flask import Flask, request, jsonify, send_from_directory
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
from predictor import predict_quality

app = Flask(__name__, static_folder=".", static_url_path="")


# ==========================================================
# HOME PAGE
# ==========================================================

@app.route("/")
def home():
    return send_from_directory(".", "index.html")


# ==========================================================
# PREDICT API
# ==========================================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        data = request.get_json()

        seam = data["seam"]
        north = float(data["north"])
        east = float(data["east"])
        rl = float(data["rl"])

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

import os

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )