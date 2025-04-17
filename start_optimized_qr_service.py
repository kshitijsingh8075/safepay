"""
Starter script for the Optimized QR ML Service.
Runs the FastAPI service on port 8000.
"""

import os
import subprocess
import sys

def main():
    print("Starting Optimized QR ML Service...")
    try:
        # Ensure dependencies are installed
        print("Checking dependencies...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements_qr.txt"])
        
        # Create cache directory if it doesn't exist
        if not os.path.exists('./cache'):
            os.makedirs('./cache')
            print("Created cache directory")
        
        # Start the FastAPI server
        print("Starting FastAPI server on port 8000...")
        subprocess.check_call([sys.executable, "optimized_qr_scanner.py"])
    except Exception as e:
        print(f"Error starting QR ML Service: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()