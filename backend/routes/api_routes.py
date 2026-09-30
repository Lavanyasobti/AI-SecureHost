from flask import Blueprint, request, jsonify, current_app
from models import db, Staff, EntryLog, Alert, User
from flask_jwt_extended import jwt_required
from datetime import datetime
from zoneinfo import ZoneInfo


api_bp = Blueprint('api', __name__)

# --- Staff ---
@api_bp.route('/staff', methods=['GET'])
@jwt_required()
def get_staff():
    staff = Staff.query.all()
    return jsonify([s.to_dict() for s in staff]), 200


# --- Entry Logs ---
@api_bp.route('/logs', methods=['GET'])
@jwt_required()
def get_logs():
    logs = EntryLog.query.order_by(EntryLog.timestamp.desc()).limit(50).all()
    return jsonify([log.to_dict() for log in logs]), 200


# --- Alerts ---
@api_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_alerts():
    alerts = Alert.query.order_by(Alert.timestamp.desc()).limit(20).all()
    return jsonify([a.to_dict() for a in alerts]), 200

@api_bp.route("/sos", methods=["POST"])
@jwt_required()
def trigger_sos():
    data = request.get_json()

    student_id = data.get("student_id")
    location = data.get("location")

    student = User.query.get(student_id)

    if not student:
        return jsonify({"error": "Student not found"}), 404

    message = f"🚨 SOS ALERT from {student.full_name} at {location}"

    # 🔴 Emit to admin
    current_app.extensions["socketio"].emit(
        "sos_admin",
        {
            "name": student.full_name,
            "location": location,
            "message": message
        }
    )

    # 🔵 Emit to emergency contacts
    if student.emergency_contacts:
        contact_ids = student.emergency_contacts.split(",")

        for cid in contact_ids:
            current_app.extensions["socketio"].emit(
                "sos_contact",
                {
                    "name": student.full_name,
                    "location": location,
                    "message": message
                },
                room=f"user_{cid}"
            )

    return jsonify({"msg": "SOS Sent"}), 200

# --- Public Entry Logs (IST FIXED) ---
@api_bp.route("/entry-logs", methods=["GET"])
def get_entry_logs():
    logs = EntryLog.query.order_by(EntryLog.id.desc()).all()

    ist = ZoneInfo("Asia/Kolkata")

    result = []

    for log in logs:
        staff = Staff.query.get(log.staff_id) if log.staff_id else None

        if log.timestamp:
            # assume stored as UTC
            utc_time = log.timestamp.replace(tzinfo=ZoneInfo("UTC"))
            ist_time = utc_time.astimezone(ist)
            formatted_time = ist_time.strftime("%I:%M %p")
        else:
            formatted_time = "N/A"

        result.append({
            "time": formatted_time,
            "name": staff.name if staff else "Unknown",
            "role": staff.role if staff else "-",
            "status": log.status,
            "risk_score": log.risk_score
        })

    return jsonify(result), 200
