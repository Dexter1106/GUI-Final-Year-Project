from datetime import datetime

def assemble_kidney_report(*, prediction_data, patient=None, features=None):

    report = {
        "generated_at": datetime.now().strftime("%d %B %Y, %H:%M"),
        "patient": patient,
        "prediction": prediction_data.get("prediction"),
        "confidence": prediction_data.get("confidence"),
        "probabilities": prediction_data.get("probabilities", {}),
        "features": features
    }

    if report["prediction"] == "CKD":
        report["clinical_note"] = "Chronic Kidney Disease detected. Immediate consultation recommended."
    else:
        report["clinical_note"] = "No significant kidney disease detected."

    return report