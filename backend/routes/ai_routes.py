from flask import Blueprint, request, jsonify, current_app
from services.ai_service import AIService
from models import db, EntryLog, Staff, Alert
from datetime import datetime
import os

ai_bp = Blueprint('ai', __name__)

# Ensure we have a folder for known faces
KNOWN_FACES_DIR = os.path.join(os.getcwd(), 'static', 'known_faces')
if not os.path.exists(KNOWN_FACES_DIR):
    os.makedirs(KNOWN_FACES_DIR)


@ai_bp.route('/verify-face', methods=['POST'])
def verify_face():
    data = request.get_json()
    image_data = data.get('image')
    location = data.get('location') or "Main Gate"

    if not image_data:
        return jsonify({"msg": "No image data provided"}), 400

    result = AIService.recognize_face(image_data, KNOWN_FACES_DIR)

    status = "unknown"
    staff_id = None
    staff_name = None
    staff_role = None
    risk_score = 0
    details = ""

    # =========================
    # FACE MATCH CHECK
    # =========================
    if result.get("match"):

        # safer filename extraction
        filename = os.path.basename(result['identity'])

        staff = Staff.query.filter_by(image_path=filename).first()

        if staff and staff.is_active:
            status = "verified"
            staff_id = staff.id
            staff_name = staff.name
            staff_role = staff.role

            # 🔥 EMIT TO STUDENT DASHBOARD (VERIFIED)
            current_app.extensions["socketio"].emit(
                "worker_entry",
                {
                    "name": staff.name,
                    "role": staff.role,
                    "time": datetime.now().strftime("%I:%M %p")
                }
            )

            # 🔥 Anomaly Detection
            history = EntryLog.query.filter_by(staff_id=staff.id).all()
            risk_score, details = AIService.detect_anomaly(
                {'timestamp': datetime.now()},
                history
            )

            if risk_score >= 3:
                status = "suspicious"
        elif not staff:
            status = "verified"
            staff_name = os.path.splitext(filename)[0].replace("_", " ").title()
            staff_role = "Registered visitor"

    # =========================
    # SAVE ENTRY LOG
    # =========================
    new_log = EntryLog(
        staff_id=staff_id,
        status=status,
        risk_score=risk_score,
        details=details,
    )
    db.session.add(new_log)
    db.session.commit()

    # =========================
    # UNKNOWN ALERT TO ADMIN 🔔
    # =========================
    if status == "unknown":
        current_app.extensions["socketio"].emit(
                "unknown_alert",
                {
                    "message": f"Unknown person detected at {location}!",
                    "time": datetime.now().strftime("%I:%M %p")
                }
            )

    # =========================
    # SUSPICIOUS ALERT (DB)
    # =========================
    if status == 'suspicious':
        alert = Alert(
            type='anomaly',
            message=f"Suspicious entry detected: {details}",
            location=location
        )
        db.session.add(alert)
        db.session.commit()

    return jsonify({
        "status": status,
        "match": result.get("match"),
        "identity": result.get("identity"),
        "name": staff_name,
        "role": staff_role,
        "confidence": result.get("confidence"),
        "distance": result.get("distance"),
        "reason": result.get("reason"),
        "quality": result.get("quality"),
        "risk_score": risk_score,
        "details": details
    }), 200


@ai_bp.route('/upload-face', methods=['POST'])
def upload_face():
    if 'file' not in request.files:
        return jsonify({"msg": "No file part"}), 400

    file = request.files['file']
    name = request.form.get('name')
    role = request.form.get('role')
    phone = request.form.get('phone')
    employee_id = request.form.get('employee_id')
    organization = request.form.get('organization')
    access_zone = request.form.get('access_zone')
    shift = request.form.get('shift')
    notes = request.form.get('notes')

    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400

    if not name or not role:
        return jsonify({"msg": "Name and role are required"}), 400

    filename = f"{name.replace(' ', '_')}.jpg"
    path = os.path.join(KNOWN_FACES_DIR, filename)
    file.save(path)

    quality = AIService.assess_face_quality(path)
    if not quality["ok"]:
        os.remove(path)
        return jsonify({
            "msg": quality["reason"],
            "quality": quality
        }), 400

    new_staff = Staff(
        name=name,
        role=role,
        phone=phone,
        employee_id=employee_id,
        organization=organization,
        access_zone=access_zone,
        shift=shift,
        notes=notes,
        image_path=filename
    )
    db.session.add(new_staff)
    db.session.commit()

    return jsonify({
        "msg": f"Staff {name} registered successfully",
        "quality": quality
    }), 201
