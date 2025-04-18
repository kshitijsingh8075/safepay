#!/usr/bin/env python3
"""
UPI Fraud Detection API Integration
----------------------------------
This script provides API endpoints to integrate the UPI fraud detection system
with the SafePay web application.
"""

import os
import sys
import json
from datetime import datetime
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException, Request, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import joblib
import uvicorn
import warnings
warnings.filterwarnings('ignore')

# Import the fraud detection modules
try:
    sys.path.append('.')
    from transaction_risk_scoring import TransactionRiskScorer
    from scam_message_detector import ScamMessageDetector
except ImportError as e:
    print(f"Error importing modules: {str(e)}")
    print("Make sure all required modules are available.")
    sys.exit(1)

# Create FastAPI app
app = FastAPI(
    title="UPI Fraud Detection API",
    description="API for UPI fraud detection and risk scoring",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the risk scorer and message detector
risk_scorer = TransactionRiskScorer()
message_detector = ScamMessageDetector()

# Define API models
class UPICheckRequest(BaseModel):
    """Request model for UPI checking"""
    upi_id: str = Field(..., description="UPI ID to check")
    amount: float = Field(None, description="Transaction amount")
    device_id: str = Field(None, description="Device ID of the payer")
    ip_address: str = Field(None, description="IP address of the payer")
    message: str = Field(None, description="Transaction message or description")

class MessageAnalysisRequest(BaseModel):
    """Request model for message analysis"""
    message: str = Field(..., description="Message to analyze for scams")

class TransactionRiskRequest(BaseModel):
    """Request model for transaction risk scoring"""
    amount: float = Field(..., description="Transaction amount")
    payer_vpa: str = Field(..., description="Payer's VPA (UPI ID)")
    beneficiary_vpa: str = Field(..., description="Beneficiary's VPA (UPI ID)")
    device_id: str = Field(None, description="Device ID of the payer")
    ip_address: str = Field(None, description="IP address of the payer")
    txn_timestamp: str = Field(None, description="Transaction timestamp (DD/MM/YYYY HH:MM)")
    trn_status: str = Field("COMPLETED", description="Transaction status")
    initiation_mode: str = Field("Default", description="Transaction initiation mode")
    transaction_type: str = Field("P2P", description="Transaction type")

# API routes
@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "UPI Fraud Detection API", "status": "operational"}

@app.post("/api/check-upi")
async def check_upi(request: UPICheckRequest):
    """
    Check a UPI ID for potential fraud risk
    """
    try:
        # Extract UPI components
        upi_parts = request.upi_id.split('@')
        if len(upi_parts) != 2:
            return {
                "status": "error",
                "message": "Invalid UPI ID format",
                "risk_score": 7.5,
                "risk_level": "HIGH"
            }
        
        upi_handle = upi_parts[0]
        upi_provider = upi_parts[1]
        
        # Create a transaction for risk scoring
        transaction = {
            'PAYER_VPA': '',  # Not available in this context
            'BENEFICIARY_VPA': request.upi_id,
            'AMOUNT': request.amount if request.amount else 100.0,  # Default amount
            'DEVICE_ID': request.device_id if request.device_id else None,
            'IP_ADDRESS': request.ip_address if request.ip_address else None,
            'TXN_TIMESTAMP': datetime.now()
        }
        
        # Get risk score
        risk_result = risk_scorer.calculate_risk_score(transaction)
        
        # Analyze message if provided
        message_result = None
        if request.message:
            message_result = message_detector.analyze_message(request.message)
        
        # Adjust risk score based on UPI pattern analysis
        # This is simplified - in a real implementation, you would have more advanced logic
        pattern_risk = 0.0
        
        # Check for suspicious patterns in UPI handle
        if len(upi_handle) < 4:
            pattern_risk += 2.0
        
        if upi_handle.isdigit():
            pattern_risk += 1.5
        
        # Check for suspicious patterns in UPI provider
        known_providers = ['okaxis', 'okicici', 'okhdfcbank', 'oksbi', 'ybl', 'axl', 'pytm', 'paytm', 'fbpay', 'gpay', 'ibl']
        if upi_provider.lower() not in known_providers:
            pattern_risk += 1.0
        
        # Adjust the final risk score
        final_risk_score = risk_result['risk_score'] + min(pattern_risk, 3.0)
        final_risk_score = min(final_risk_score, 10.0)  # Cap at 10
        
        # Determine risk level
        if final_risk_score < 3:
            risk_level = 'LOW'
        elif final_risk_score < 7:
            risk_level = 'MEDIUM'
        else:
            risk_level = 'HIGH'
        
        # Create response
        response = {
            "status": "success",
            "upi_id": request.upi_id,
            "risk_score": round(final_risk_score, 2),
            "risk_level": risk_level,
            "risk_components": risk_result['components'],
            "pattern_risk": pattern_risk
        }
        
        # Add message analysis if available
        if message_result:
            response["message_analysis"] = {
                "scam_probability": round(message_result['scam_probability'], 2),
                "risk_level": message_result['risk_level'],
                "warning_flags": message_result['warning_flags'],
                "explanation": message_result['explanation']
            }
        
        return response
    
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "risk_score": 5.0,  # Default medium risk on error
            "risk_level": "MEDIUM"
        }

@app.post("/api/analyze-message")
async def analyze_message(request: MessageAnalysisRequest):
    """
    Analyze a message for potential scams
    """
    try:
        # Analyze the message
        result = message_detector.analyze_message(request.message)
        
        return {
            "status": "success",
            "message": request.message,
            "analysis": {
                "scam_probability": round(result['scam_probability'], 2),
                "is_scam": result['is_scam'],
                "risk_level": result['risk_level'],
                "warning_flags": result['warning_flags'],
                "explanation": result['explanation']
            }
        }
    
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.post("/api/score-transaction")
async def score_transaction(request: TransactionRiskRequest):
    """
    Score a transaction for fraud risk
    """
    try:
        # Create a transaction object for risk scoring
        transaction = {
            'PAYER_VPA': request.payer_vpa,
            'BENEFICIARY_VPA': request.beneficiary_vpa,
            'AMOUNT': request.amount,
            'DEVICE_ID': request.device_id,
            'IP_ADDRESS': request.ip_address,
            'TXN_TIMESTAMP': request.txn_timestamp if request.txn_timestamp else datetime.now().strftime("%d/%m/%Y %H:%M"),
            'TRN_STATUS': request.trn_status,
            'INITIATION_MODE': request.initiation_mode,
            'TRANSACTION_TYPE': request.transaction_type
        }
        
        # Get risk score
        risk_result = risk_scorer.calculate_risk_score(transaction)
        
        return {
            "status": "success",
            "transaction": {
                "payer_vpa": request.payer_vpa,
                "beneficiary_vpa": request.beneficiary_vpa,
                "amount": request.amount
            },
            "risk_score": round(risk_result['risk_score'], 2),
            "risk_level": risk_result['risk_level'],
            "risk_components": {
                key: round(value, 2) for key, value in risk_result['components'].items()
            }
        }
    
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.get("/api/health-check")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models": {
            "risk_scorer": "loaded" if risk_scorer else "not loaded",
            "message_detector": "loaded" if message_detector else "not loaded"
        }
    }

def main():
    """Run the API server"""
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print(f"Starting UPI Fraud Detection API on {host}:{port}")
    uvicorn.run(app, host=host, port=port)

def process_command_line():
    """Process command line arguments"""
    import argparse
    import json
    
    parser = argparse.ArgumentParser(description='UPI Fraud Detection API')
    parser.add_argument('--check-upi', help='Check UPI ID (input JSON file)')
    parser.add_argument('--analyze-message', help='Analyze message (input JSON file)')
    parser.add_argument('--score-transaction', help='Score transaction (input JSON file)')
    parser.add_argument('--health-check', action='store_true', help='Perform health check')
    
    args = parser.parse_args()
    
    # Process command line options
    if args.check_upi:
        try:
            with open(args.check_upi, 'r') as f:
                data = json.load(f)
            
            # Convert data to request model
            request = UPICheckRequest(**data)
            
            # Process the request
            result = asyncio.run(check_upi(request))
            
            # Print the result as JSON
            print(json.dumps(result))
            
        except Exception as e:
            print(json.dumps({
                "status": "error",
                "message": str(e)
            }))
    
    elif args.analyze_message:
        try:
            with open(args.analyze_message, 'r') as f:
                data = json.load(f)
            
            # Convert data to request model
            request = MessageAnalysisRequest(**data)
            
            # Process the request
            result = asyncio.run(analyze_message(request))
            
            # Print the result as JSON
            print(json.dumps(result))
            
        except Exception as e:
            print(json.dumps({
                "status": "error",
                "message": str(e)
            }))
    
    elif args.score_transaction:
        try:
            with open(args.score_transaction, 'r') as f:
                data = json.load(f)
            
            # Convert data to request model
            request = TransactionRiskRequest(**data)
            
            # Process the request
            result = asyncio.run(score_transaction(request))
            
            # Print the result as JSON
            print(json.dumps(result))
            
        except Exception as e:
            print(json.dumps({
                "status": "error",
                "message": str(e)
            }))
    
    elif args.health_check:
        try:
            # Perform health check
            result = asyncio.run(health_check())
            
            # Print the result as JSON
            print(json.dumps(result))
            
        except Exception as e:
            print(json.dumps({
                "status": "error",
                "message": str(e)
            }))
    
    else:
        # Run the API server
        main()

if __name__ == "__main__":
    import asyncio
    process_command_line()