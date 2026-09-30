import requests
import json

BASE_URL = "http://localhost:5000"

def test_register():
    print("Testing Registration...")
    payload = {
        "username": "testuser_v2",
        "email": "test_v2@example.com",
        "password": "password123",
        "role": "student",
        "full_name": "Test User",
        "student_id": "ST-123",
        "floor": "1"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 201:
            print("✅ Registration Successful")
        elif response.status_code == 400 and "already exists" in response.text:
             print("⚠️ User already exists (Expected if run multiple times)")
        else:
            print("❌ Registration Failed")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_register()
