####################################################################
#
# File Name :   kidney_controller.py
# Description : kidney prediction API endpoints
# Author      : Pradhumnya Changdev Kalsait
# Date        : 17/01/26
#
####################################################################

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.services.kidney_service import predict_kidney_disease
from app.services.kidney_report_assembler import assemble_kidney_report

from app.utils.jwt_utils import role_required
from app.utils.constants import UserRole

kidney_blueprint = Blueprint("kidney", __name__)

"""
################################################################
#
# Function Name : predict_kidney
# Description   : API endpoint for kidney disease prediction
# Author        : Pradhumnya Changdev Kalsait
# Date          : 17/01/26
# Prototype     : Response predict_kidney(void)
# Input Output  : (0 input, 1 output)
#
################################################################
"""
@kidney_blueprint.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Empty input payload"}), 400

        result = predict_kidney_disease(data)
        return jsonify(result), 200

    except Exception as e:
        print("Kidney prediction error:", e)
        return jsonify({"error": str(e)}), 500



"""
################################################################
#
# Function Name : predict_kidney_report
# Description   : API endpoint for kidney PDF report generation
# Author        : Ankita Pandit Sawant
# Date          : 30/03/26
# Prototype     : Response predict_kidney_report(void)
# Input Output  : (1 input, 1 output)
#
################################################################
"""
@kidney_blueprint.route("/predict-report", methods=["POST"])
def predict_kidney_report():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Empty input payload"}), 400

        # Extract patient & features
        patient = data.get("patient")
        features = data.get("features")

        if not features:
            return jsonify({"error": "Missing features data"}), 400

        # Step 1: Model Prediction
        prediction_result = predict_kidney_disease(features)

        # Step 2: Assemble Report
        report = assemble_kidney_report(
            prediction_result,
            patient=patient,
            features=features
        )

        # Step 3: Generate PDF
        pdf_buffer = generate_kidney_pdf(report)

        # Step 4: Return PDF
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name="kidney_report.pdf",
            mimetype="application/pdf"
        )

    except Exception as e:
        print("Kidney report error:", e)
        return jsonify({"error": str(e)}), 500