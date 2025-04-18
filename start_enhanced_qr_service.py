"""
Starter script for the Enhanced QR Scanner Service.
Runs the FastAPI service on port 8001.
"""

import os
import sys
import time
import subprocess
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("qr_launcher")

def main():
    # Set environment variables
    os.environ["PYTHONUNBUFFERED"] = "1"
    
    logger.info("Starting Enhanced QR Scanner Service")
    
    # Start the FastAPI service
    cmd = [sys.executable, "enhanced_qr_scanner.py"]
    
    try:
        # Run the QR service
        logger.info(f"Executing: {' '.join(cmd)}")
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        # Stream the output
        logger.info("QR service starting...")
        for line in process.stdout:
            print(line, end='')
        
        # If process exits, report it
        return_code = process.wait()
        if return_code != 0:
            logger.error(f"QR service exited with code {return_code}")
        else:
            logger.info("QR service exited successfully")
        
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt, shutting down")
        process.terminate()
        try:
            process.wait(timeout=5)
            logger.info("QR service terminated gracefully")
        except subprocess.TimeoutExpired:
            logger.error("QR service did not terminate in time, killing it")
            process.kill()
    except Exception as e:
        logger.error(f"Error starting QR service: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())