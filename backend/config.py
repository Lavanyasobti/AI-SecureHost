import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-prod'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///secure_host.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-prod'
    # Upload folder for staff images
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'static', 'uploads')
    # Allowed extensions
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
