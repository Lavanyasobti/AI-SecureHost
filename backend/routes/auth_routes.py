from flask import Blueprint, request, jsonify
from models import db, User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"msg": "Missing username or password"}), 400
        
    user = User.query.filter_by(username=data['username']).first()
    
    if user and user.check_password(data['password']):
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={'role': user.role, 'username': user.username}
        )
        return jsonify(
            access_token=access_token, 
            role=user.role,
            user=user.to_dict()
        ), 200
        
    return jsonify({"msg": "Bad username or password"}), 401

@auth_bp.route('/register', methods=['POST'])
def register():
    # Only for hackathon setup/admin use. 
    # In production, this would be protected.
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password') or not data.get('role'):
        return jsonify({"msg": "Username, password, and role are required"}), 400

    if User.query.filter_by(username=data.get('username')).first():
        return jsonify({"msg": "Username already exists"}), 400

    email = data.get('email')
    if email and User.query.filter_by(email=email).first():
        return jsonify({"msg": "Email already exists"}), 400
        
    # Handle nullable fields explicitly
    s_id = data.get('student_id')
    if not s_id or isinstance(s_id, str) and not s_id.strip():
        s_id = None
        
    floor = data.get('floor')
    if not floor or isinstance(floor, str) and not floor.strip():
        floor = None

    new_user = User(
        username=data.get('username'),
        email=data.get('email'),
        role=data.get('role', 'student'),
        full_name=data.get('full_name'),
        student_id=s_id,
        floor=floor
    )
    new_user.set_password(data.get('password'))
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"msg": "User created successfully"}), 201

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current_user_identity = get_jwt_identity()
    user = User.query.get(int(current_user_identity))

    if not user:
        return jsonify({"msg": "User not found"}), 404

    return jsonify(user.to_dict()), 200
