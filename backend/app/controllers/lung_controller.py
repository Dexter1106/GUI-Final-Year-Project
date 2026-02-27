####################################################################
#
# File Name :   lung_controller.py
# Description : Lung prediction API endpoints
# Author      : Pradhumnya Changdev Kalsait
# Date        : 17/01/26
#
####################################################################

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services.lung_stage1_service import predict_stage1
from app.services.lung_stage2_service import predict_stage2
from app.services.lung_pipeline_service import full_copd_pipeline

import json

# -------------------------------------------------
# Blueprint
lung_blueprint = Blueprint("lung", __name__)


"""
################################################################
# STAGE-1 ENDPOINT
################################################################
"""
@lung_blueprint.route("/stage1", methods=["POST"])
@jwt_required()
def stage1_predict():

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    breath_file = request.files["file"]

    try:
        result = predict_stage1(breath_file)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


"""
################################################################
# STAGE-2 ENDPOINT
################################################################
"""
@lung_blueprint.route("/stage2", methods=["POST"])
@jwt_required()
def stage2_predict():

    data = request.json

    if not data:
        return jsonify({"error": "No clinical data provided"}), 400

    try:
        result = predict_stage2(data)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


"""
################################################################
# FULL PIPELINE ENDPOINT (OPTIONAL)
################################################################
"""
@lung_blueprint.route("/predict", methods=["POST"])
@jwt_required()
def predict_full():

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    breath_file = request.files["file"]

    clinical_data = request.form.get("clinical_data")

    if clinical_data:
        clinical_data = json.loads(clinical_data)
    else:
        clinical_data = None

    try:
        result = full_copd_pipeline(breath_file, clinical_data)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500