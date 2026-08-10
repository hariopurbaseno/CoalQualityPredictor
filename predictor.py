import joblib
import pandas as pd


# ==========================================================
# LOAD DEPLOYMENT BUNDLE
# ==========================================================
import joblib
import pandas as pd


# ==========================================================
# SAME FUNCTION AS TRAINING NOTEBOOK
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
import __main__

# Daftarkan fungsi ke modul __main__
__main__.calculate_derived_quality = calculate_derived_quality
bundle = joblib.load("coal_quality_predictor.pkl")

models = bundle["models"]
formula_engine = bundle["formula_engine"]


# ==========================================================
# PREDICTION FUNCTION
# ==========================================================

def predict_quality(seam, north, east, rl):

    # ------------------------------------------
    # Build Feature Table
    # ------------------------------------------

    feature_names = models["TM_AR"].feature_names_in_

    X = pd.DataFrame(
        0,
        index=[0],
        columns=feature_names
    )

    # ------------------------------------------
    # Numeric Features
    # ------------------------------------------

    X["North_Center"] = float(north)
    X["East_Center"] = float(east)
    X["Elevation (RL)"] = float(rl)

    # ------------------------------------------
    # One Hot Encoding Seam
    # ------------------------------------------

    seam_column = f"Seam_{seam}"

    if seam_column not in X.columns:
        raise ValueError(f"Unknown Seam : {seam}")

    X[seam_column] = 1

    # ------------------------------------------
    # Predict Primary Targets
    # ------------------------------------------

    prediction = {}

    for target, model in models.items():

        prediction[target] = float(
            model.predict(X)[0]
        )

    prediction = pd.DataFrame([prediction])

    # ------------------------------------------
    # Calculate Derived Quality
    # ------------------------------------------

    prediction = formula_engine(prediction)

    # ------------------------------------------
    # Round Result
    # ------------------------------------------

    prediction = prediction.round({

        "TM_AR":2,
        "IM":2,
        "VM":2,
        "FC":2,
        "ASH_ADB":2,
        "TS":3,
        "CV_ADB":0,
        "CV_AR":0,
        "CV_DAF":0,
        "HGI":0

    })

    # ------------------------------------------
    # Return Dictionary
    # ------------------------------------------

    return prediction.iloc[0].to_dict()


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