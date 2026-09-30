from flask_socketio import emit
from app import socketio, db
from models import EntryLog, Staff, User
from datetime import datetime

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('scan_attempt')
def handle_scan(data):
    """
    Received from Guard Dashboard.
    Data: { 'image': base64, 'location': 'Main Gate' }
    """
    # In a real app, we would process the image here again or just forward the result
    # For this unified demo, we assume the Guard already verified it via API
    # and is just sending the log event for broadcasting.
    
    # If data contains verification result
    if 'status' in data:
        # Broadcast to Warden
        emit('admin_feed_update', data, broadcast=True)
        
        # Privacy-safe broadcast to Students (only if verified staff/visitor)
        if data.get('status') == 'verified' and data.get('type') in ['Staff', 'Visitor']:
            public_msg = {
                'message': f"{data.get('type')} entered {data.get('location', 'hostel')}",
                'timestamp': datetime.now().isoformat(),
                'type': 'entry'
            }
            emit('public_announcement', public_msg, broadcast=True)

@socketio.on('emergency_alert')
def handle_emergency(data):
    """
    Received from Student/Guard Panic Button.
    Data: { 'student_id': 1, 'location': 'Floor 2', 'type': 'panic' }
    """
    print(f"EMERGENCY: {data}")
    # Broadcast to Guard and Warden
    emit('alert', data, broadcast=True)
    
    # Notify other students of danger? (Optional, maybe just generic "Emergency in Block A")
    emit('public_announcement', {
        'message': f"EMERGENCY REPORTED: {data.get('location')}",
        'type': 'danger'
    }, broadcast=True)
