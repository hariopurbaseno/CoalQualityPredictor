from unittest import result

import joblib
import pandas as pd
import numpy as np

# ==========================================================
# DERIVED QUALITY CALCULATION
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
# LOAD DEPLOYMENT BUNDLE
# ==========================================================

bundle = joblib.load(
    "coal_quality_predictor.pkl"
)

models = bundle["models"]

formula_engine = bundle["formula_engine"]

# ==========================================================
# LOAD MODEL RELIABILITY SUMMARY
# ==========================================================

reliability_data = pd.read_csv(
    "model_reliability.csv"
)

reliability_data = reliability_data.set_index(
    "Seam"
)



# ==========================================================
# CONFIDENCE & RELIABILITY
# ==========================================================

def get_model_reliability(seam):

    if seam not in reliability_data.index:
        return {
            "Confidence": "Very Low",
            "Reliability": "Very Low",
            "Sample_Count": 0,
            "Within_QC": 0.0
        }

    row = reliability_data.loc[seam]

    return {
        "Confidence": row["Confidence"],
        "Reliability": row["Reliability"],
        "Sample_Count": int(row["Samples"]),
        "Within_QC": float(row["Within_QC_%"])
    }


# ==========================================================
# PREDICTION FUNCTION
# ==========================================================

def predict_quality(
    seam,
    north,
    east,
    rl
):

    # ------------------------------------------------------
    # Build Feature Table
    # ------------------------------------------------------

    feature_names = (
        models["TM_AR"]
        .feature_names_in_
    )


    X = pd.DataFrame(
        0,
        index=[0],
        columns=feature_names
    )


    # ------------------------------------------------------
    # Numeric Features
    # ------------------------------------------------------

    X["North_Center"] = float(
        north
    )

    X["East_Center"] = float(
        east
    )

    X["Elevation (RL)"] = float(
        rl
    )


    # ------------------------------------------------------
    # One Hot Encoding Seam
    # ------------------------------------------------------

    seam_column = f"Seam_{seam}"


    if seam_column not in X.columns:

        raise ValueError(
            f"Unknown Seam : {seam}"
        )


    X[seam_column] = 1


    # ------------------------------------------------------
    # Predict Primary Targets
    # ------------------------------------------------------

    prediction = {}


    for target, model in models.items():

        prediction[target] = float(
            model.predict(X)[0]
        )


    prediction = pd.DataFrame(
        [prediction]
    )


    # ------------------------------------------------------
    # Calculate Derived Quality
    # ------------------------------------------------------

    prediction = formula_engine(
        prediction
    )


    # ------------------------------------------------------
    # Confidence & Reliability
    # ------------------------------------------------------

    model_reliability = get_model_reliability(
    seam
    )


    # ------------------------------------------------------
    # Round Result
    # ------------------------------------------------------

    prediction = prediction.round({

        "TM_AR": 2,

        "IM": 2,

        "VM": 2,

        "FC": 2,

        "ASH_ADB": 2,

        "TS": 3,

        "CV_ADB": 0,

        "CV_AR": 0,

        "CV_DAF": 0,

        "HGI": 0

    })


    # ------------------------------------------------------
    # Return Result
    # ------------------------------------------------------

    result = (
        prediction
        .iloc[0]
        .to_dict()
    )


    result["Confidence"] = model_reliability["Confidence"]
    result["Reliability"] = model_reliability["Reliability"]
    result["Sample_Count"] = model_reliability["Sample_Count"]
    result["Within_QC"] = model_reliability["Within_QC"]


    return result


# ==========================================================
# TEST
# ==========================================================

if __name__ == "__main__":

    result = predict_quality(

        seam="T117",

        north=20219.5,

        east=3903,

        rl=56

    )

    print(result)