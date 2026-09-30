from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager
from config import Config
from models import db, User, Staff, EntryLog, Alert # Import models to register them
from routes.auth_routes import auth_bp
from routes.api_routes import api_bp
from routes.ai_routes import ai_bp 
from flask_socketio import join_room
from sqlalchemy import text

app = Flask(__name__)
app.config.from_object(Config)

# Configure Logging to File
import logging
logging.basicConfig(filename='backend_error.log', level=logging.DEBUG, 
                    format='%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]')

# Log every request
@app.before_request
def log_request_info():
    app.logger.info(f"Headers: {request.headers}")
    app.logger.info(f"Body: {request.get_data()}")

# Log exceptions
@app.errorhandler(Exception)
def handle_exception(e):
    app.logger.error(f"Unhandled Exception: {e}", exc_info=True)
    return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

# Initialize extensions
db.init_app(app)
CORS(app, resources={r"/*": {"origins": "*"}}) # Allow all origins for hackathon
socketio = SocketIO(app, cors_allowed_origins="*")
jwt = JWTManager(app)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(api_bp, url_prefix='/api')
app.register_blueprint(ai_bp, url_prefix='/ai')

@app.before_request
def log_request_info():
    print(f"Headers: {request.headers}", flush=True)
    print(f"Body: {request.get_data()}", flush=True)

@app.route('/')
def index():
    return jsonify({"message": "AI SecureHost Backend Running"}), 200

@socketio.on("join")
def handle_join(data):
    user_id = data.get("user_id")
    join_room(f"user_{user_id}")


# Create DB tables
with app.app_context():
    db.create_all()

    staff_columns = {
        row[1] for row in db.session.execute(text("PRAGMA table_info(staff)")).fetchall()
    }
    staff_column_defs = {
        "phone": "VARCHAR(30)",
        "employee_id": "VARCHAR(50)",
        "organization": "VARCHAR(100)",
        "access_zone": "VARCHAR(100)",
        "shift": "VARCHAR(50)",
        "notes": "VARCHAR(250)",
    }
    for column_name, column_type in staff_column_defs.items():
        if column_name not in staff_columns:
            db.session.execute(text(f"ALTER TABLE staff ADD COLUMN {column_name} {column_type}"))
    db.session.commit()

    default_users = [
        {
            "username": "admin",
            "email": "admin@securehost.com",
            "password": "admin123",
            "role": "admin",
            "full_name": "Chief Warden",
        },
        {
            "username": "guard",
            "email": "guard@securehost.com",
            "password": "guard123",
            "role": "guard",
            "full_name": "Main Gate Guard",
        },
        {
            "username": "student",
            "email": "student@securehost.com",
            "password": "student123",
            "role": "student",
            "full_name": "Demo Student",
            "student_id": "ST-DEMO-001",
            "floor": "Block A · Floor 2",
        },
    ]

    for user_data in default_users:
        if not User.query.filter_by(username=user_data["username"]).first():
            password = user_data.pop("password")
            demo_user = User(**user_data)
            demo_user.set_password(password)
            db.session.add(demo_user)

    db.session.commit()

if __name__ == '__main__':
    from socket_events import * # Register events
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
