#!/bin/bash

# Script to start all QR scanner services

echo "Starting Enhanced QR Scanner Service..."
python start_enhanced_qr_service.py &
ENHANCED_PID=$!

echo "Starting Optimized QR Scanner Service..."
python start_optimized_qr_service.py &
OPTIMIZED_PID=$!

# Trap to clean up processes when the script is terminated
trap "echo 'Stopping QR services...'; kill $ENHANCED_PID $OPTIMIZED_PID 2>/dev/null" EXIT INT TERM

# Keep the script running to maintain the services
echo "QR services started. Press Ctrl+C to stop."
wait