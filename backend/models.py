from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True, nullable=False)
    email = db.Column(db.String(120), index=True, unique=True, nullable=True)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.String(20), nullable=False) # 'admin', 'student', 'guard'
    full_name = db.Column(db.String(100))
    student_id = db.Column(db.String(20), unique=True, nullable=True) # For students
    floor = db.Column(db.String(10), nullable=True) # For students
    emergency_contacts = db.Column(db.Text)  

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'full_name': self.full_name,
            'floor': self.floor
        }

class Staff(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False) # 'cleaner', 'maintenance', 'delivery'
    phone = db.Column(db.String(30), nullable=True)
    employee_id = db.Column(db.String(50), nullable=True)
    organization = db.Column(db.String(100), nullable=True)
    access_zone = db.Column(db.String(100), nullable=True)
    shift = db.Column(db.String(50), nullable=True)
    notes = db.Column(db.String(250), nullable=True)
    image_path = db.Column(db.String(200), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Store embedding as a BLOB or JSON string if needed, 
    # but for simplicity we might re-compute or load from file for now.
    # In production, use pgvector or similar.
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'role': self.role,
            'phone': self.phone,
            'employee_id': self.employee_id,
            'organization': self.organization,
            'access_zone': self.access_zone,
            'shift': self.shift,
            'notes': self.notes,
            'image_path': self.image_path,
            'is_active': self.is_active
        }

class EntryLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('staff.id'), nullable=True) # Null if unknown
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), nullable=False) # 'verified', 'unknown', 'suspicious'
    risk_score = db.Column(db.Integer, default=0)
    details = db.Column(db.String(200)) # 'Frequency anomaly', 'Wrong time'
    image_snapshot = db.Column(db.String(200)) # Path to snapshot of entry
    
    staff = db.relationship('Staff', backref='entries')

    def to_dict(self):
        return {
            'id': self.id,
            'staff_name': self.staff.name if self.staff else 'Unknown',
            'timestamp': self.timestamp.isoformat(),
            'status': self.status,
            'risk_score': self.risk_score,
            'details': self.details
        }

class Alert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20), nullable=False) # 'panic', 'anomaly', 'unauthorized'
    message = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(50)) # 'Floor 2', 'Main Gate'
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_resolved = db.Column(db.Boolean, default=False)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

    student = db.relationship('User', backref='alerts')

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'message': self.message,
            'location': self.location,
            'timestamp': self.timestamp.isoformat(),
            'student_name': self.student.full_name if self.student else None,
            'is_resolved': self.is_resolved
        }
