####################################################################
#
# File Name :   kidney_report_assembler.py
# Description : Kidney Disease Report Builder (Single Stage)
# Author      : Ankita Pandit Sawant
# Date        : 30/03/26
#
####################################################################

from datetime import datetime


def assemble_kidney_report(prediction_data):

    report = {
        "generated_at": datetime.now().strftime("%d %B %Y, %H:%M"),
        "prediction": prediction_data["prediction"],
        "confidence": prediction_data["confidence"],
        "probabilities": prediction_data.get("probabilities", {})
    }

    # Clinical Interpretation
    if prediction_data["prediction"] == "CKD":
        report["clinical_note"] = (
            "Chronic Kidney Disease detected. Immediate medical consultation recommended."
        )
    else:
        report["clinical_note"] = (
            "No significant kidney disease detected. Maintain healthy lifestyle."
        )

    return report