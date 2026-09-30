import os
import cv2
import numpy as np
import base64
from deepface import DeepFace

MODEL_NAME = "Facenet512"
DETECTOR_BACKEND = "opencv"
DISTANCE_METRIC = "cosine"
MATCH_THRESHOLD = 0.32
REVIEW_THRESHOLD = 0.38
MIN_FACE_CONFIDENCE = 0.86
MIN_SHARPNESS = 5.0


class AIService:

    @staticmethod
    def register_face(image_path, staff_id):
        """
        Generates embedding for a staff member's face image.
        """
        try:
            embedding = DeepFace.represent(
                img_path=image_path,
                model_name="Facenet"
            )[0]["embedding"]
            return embedding
        except Exception as e:
            print(f"Error registering face: {e}")
            return None

    @staticmethod
    def recognize_face(image_data, db_path):
        """
        Recognizes a face from a base64 string or file path against the 'db_path' folder.
        """
        try:
            # If image_data is base64
            if image_data.startswith('data:image'):
                encoded_data = image_data.split(',')[1]
                nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            else:
                img = cv2.imread(image_data)

            if img is None:
                return {"match": False, "reason": "Image could not be read"}

            quality = AIService.assess_face_quality(img)
            if not quality["ok"]:
                return {
                    "match": False,
                    "reason": quality["reason"],
                    "quality": quality
                }

            dfs = DeepFace.find(
                img_path=img,
                db_path=db_path,
                model_name=MODEL_NAME,
                detector_backend=DETECTOR_BACKEND,
                distance_metric=DISTANCE_METRIC,
                enforce_detection=True,
                threshold=REVIEW_THRESHOLD,
                silent=True
            )

            if len(dfs) > 0 and len(dfs[0]) > 0:

                match = dfs[0].iloc[0]
                identity_path = match['identity']
                distance = match['distance']
                confidence = max(0, min(100, round((1 - (distance / REVIEW_THRESHOLD)) * 100, 2)))

                if distance <= MATCH_THRESHOLD:
                    filename = os.path.basename(identity_path)
                    return {
                        "match": True,
                        "identity": filename,
                        "confidence": confidence,
                        "distance": round(float(distance), 4),
                        "quality": quality
                    }
                else:
                    return {
                        "match": False,
                        "identity": os.path.basename(identity_path),
                        "confidence": confidence,
                        "distance": round(float(distance), 4),
                        "reason": "Closest face needs manual review",
                        "quality": quality
                    }

            return {"match": False, "reason": "No registered face matched", "quality": quality}

        except Exception as e:
            print(f"Error in recognition: {e}")
            return {"match": False, "error": str(e)}

    @staticmethod
    def assess_face_quality(img):
        """
        Rejects frames that are too blurry, missing a face, or contain multiple faces.
        Better input quality improves matching much more than lowering thresholds.
        """
        if isinstance(img, str):
            img = cv2.imread(img)

        if img is None:
            return {
                "ok": False,
                "reason": "Image could not be read",
                "sharpness": 0,
                "face_count": 0
            }

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        if sharpness < MIN_SHARPNESS:
            return {
                "ok": False,
                "reason": "Image is too blurry. Ask the person to face the camera and rescan.",
                "sharpness": round(sharpness, 2),
                "face_count": 0
            }

        try:
            faces = DeepFace.extract_faces(
                img_path=img,
                detector_backend=DETECTOR_BACKEND,
                enforce_detection=True,
                align=True
            )
        except Exception:
            return {
                "ok": False,
                "reason": "No clear face detected. Improve lighting and center the face.",
                "sharpness": round(sharpness, 2),
                "face_count": 0
            }

        if len(faces) > 1:
            return {
                "ok": True,
                "reason": "Multiple face-like regions detected. Use the centered face for the decision.",
                "sharpness": round(sharpness, 2),
                "face_count": len(faces)
            }

        face_confidence = float(faces[0].get("confidence", 1))
        if face_confidence < MIN_FACE_CONFIDENCE:
            return {
                "ok": False,
                "reason": "Face is not clear enough. Move closer and rescan.",
                "sharpness": round(sharpness, 2),
                "face_count": 1,
                "face_confidence": round(face_confidence, 3)
            }

        return {
            "ok": True,
            "reason": "Face quality accepted",
            "sharpness": round(sharpness, 2),
            "face_count": 1,
            "face_confidence": round(face_confidence, 3)
        }

    @staticmethod
    def detect_anomaly(entry_log, user_history):
        """
        Simple logic for anomaly detection.
        """

        risk_score = 0
        details = []

        hour = entry_log['timestamp'].hour
        if hour < 6 or hour > 22:
            risk_score += 2
            details.append("Suspicious time (Late Night/Early Morning)")

        today_entries = [
            log for log in user_history
            if log.timestamp.date() == entry_log['timestamp'].date()
        ]

        if len(today_entries) > 3:
            risk_score += 1
            details.append("High frequency validation")

        return risk_score, ", ".join(details)
