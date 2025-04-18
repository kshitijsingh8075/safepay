"""
Test script for the Enhanced QR Scanner service
Run this to test if the enhanced QR scanner is working correctly
"""

import requests
import json
import time
import sys

ENHANCED_QR_URL = "http://localhost:8001"
TEST_UPI = "upi://pay?pa=7357802287@superyes&pn=Kshitij&am=100.00&cu=INR"
TEST_SCAM_UPI = "upi://pay?pa=urgent-verify@hacker.in&pn=Account%20Verification&am=1.00&tn=Your%20account%20will%20expire"
TEST_URL = "https://www.google.com"
TEST_SCAM_URL = "http://phishing.tinyurl.com/login"

def test_service_availability():
    """Check if the service is available"""
    try:
        response = requests.get(f"{ENHANCED_QR_URL}/", timeout=5)
        if response.status_code == 200:
            print("✅ Enhanced QR service is available")
            return True
        else:
            print(f"❌ Service returned status code: {response.status_code}")
            return False
    except requests.RequestException as e:
        print(f"❌ Service not available: {e}")
        return False

def test_qr_prediction(qr_text, expected_type=None):
    """Test QR prediction endpoint"""
    print(f"\nTesting QR text: {qr_text}")
    
    try:
        start_time = time.time()
        response = requests.post(
            f"{ENHANCED_QR_URL}/predict",
            json={"qr_text": qr_text},
            timeout=10
        )
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Analysis completed in {elapsed:.3f}s (service reported {result['latency_ms']}ms)")
            print(f"   Risk Score: {result['risk_score']}% ({result['risk_level']} risk)")
            
            if 'reasons' in result and result['reasons']:
                print(f"   Reasons ({len(result['reasons'])}):")
                for reason in result['reasons']:
                    print(f"   - {reason}")
            
            if expected_type and 'qr_type' in result:
                if result['qr_type'] == expected_type:
                    print(f"✅ Correctly identified as {expected_type}")
                else:
                    print(f"❌ Expected {expected_type}, got {result['qr_type']}")
            
            return result
        else:
            print(f"❌ Prediction failed: {response.status_code}")
            return None
    except requests.RequestException as e:
        print(f"❌ Request error: {e}")
        return None

def test_feedback():
    """Test the feedback endpoint"""
    print("\nTesting feedback endpoint...")
    
    try:
        response = requests.post(
            f"{ENHANCED_QR_URL}/feedback",
            json={
                "qr_text": TEST_SCAM_UPI,
                "is_scam": True,
                "reason": "Test feedback - this is a scam"
            },
            timeout=5
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Feedback submitted: {result}")
            return True
        else:
            print(f"❌ Feedback failed: {response.status_code}")
            return False
    except requests.RequestException as e:
        print(f"❌ Feedback request error: {e}")
        return False

def main():
    """Run all tests"""
    print("=== Enhanced QR Scanner Test ===")
    
    # Check if service is running
    if not test_service_availability():
        print("\n❌ Enhanced QR service is not available. Please start it using:")
        print("   python start_enhanced_qr_service.py")
        return 1
    
    # Test different QR code types
    test_qr_prediction(TEST_UPI, "upi")
    test_qr_prediction(TEST_SCAM_UPI, "upi")
    test_qr_prediction(TEST_URL, "url")
    test_qr_prediction(TEST_SCAM_URL, "url")
    
    # Test feedback endpoint
    test_feedback()
    
    print("\n=== Test complete ===")
    return 0

if __name__ == "__main__":
    sys.exit(main())