import joblib
import pandas as pd
import numpy as np


# ==========================================================
# LOAD DEPLOYMENT BUNDLE
# ==========================================================

bundle = joblib.load(
    "coal_quality_predictor.pkl"
)

models = bundle["models"]

formula_engine = bundle["formula_engine"]


# ==========================================================
# MODEL CONFIDENCE
# ==========================================================

def calculate_model_confidence(models, X):

    uncertainties = []

    for target, model in models.items():

        # Random Forest
        if not hasattr(model, "estimators_"):
            continue

        tree_predictions = np.array([
            estimator.predict(X)[0]
            for estimator in model.estimators_
        ])

        mean_prediction = np.mean(
            tree_predictions
        )

        std_prediction = np.std(
            tree_predictions
        )

        # Relative disagreement between trees
        relative_uncertainty = (
            std_prediction
            / max(abs(mean_prediction), 1e-6)
        )

        uncertainties.append(
            relative_uncertainty
        )


    if not uncertainties:

        return 0.0


    average_uncertainty = np.mean(
        uncertainties
    )


    # Convert ensemble disagreement
    # into a 0-100 confidence score

    confidence = (
        100
        * np.exp(
            -5 * average_uncertainty
        )
    )


    confidence = np.clip(
        confidence,
        0,
        100
    )


    return round(
        float(confidence),
        1
    )


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
    # Calculate Model Confidence
    # ------------------------------------------------------

    confidence = calculate_model_confidence(
        models,
        X
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


    result["Confidence"] = confidence


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