# 🚀 Enhanced QR Code Scam Detection System
# Combines OpenCV, pyzbar, heuristics, and ML for high-accuracy detection

import cv2
from pyzbar.pyzbar import decode
import re
import time
import joblib
import os
import json
import numpy as np
import requests
from urllib.parse import urlparse
from fastapi import FastAPI, UploadFile, File, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
from diskcache import Cache
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
import pandas as pd
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("enhanced_qr")

# Initialize FastAPI app
app = FastAPI(title="Enhanced QR Scam Detection API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache setup
cache = Cache('./prediction_cache', size_limit=1e8)  # 100MB cache

# Initialize model variables
ml_model = None
text_model = None

# Model and data file paths
QR_MODEL_FILE = "enhanced_qr_model.joblib"
TEXT_MODEL_FILE = "qr_text_model.joblib"
SCAM_DATA_FILE = "enhanced_qr_data.json"
GOOGLE_SAFE_BROWSING_API_KEY = os.environ.get("GOOGLE_SAFE_BROWSING_API_KEY", None)

# Request models
class QRRequest(BaseModel):
    qr_text: str

class QRImageRequest(BaseModel):
    image_data: str  # Base64 encoded image

class QRFeedbackRequest(BaseModel):
    qr_text: str
    is_scam: bool
    reason: Optional[str] = None

class BatchQRRequest(BaseModel):
    qr_texts: List[str]

# Load initial dataset
def load_data() -> Dict[str, Any]:
    """Load training data from file or initialize with default examples"""
    if os.path.exists(SCAM_DATA_FILE):
        try:
            with open(SCAM_DATA_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading data file: {e}")
    
    # Default dataset with examples
    return {
        'data': [
            # Safe UPI examples
            {"text": "upi://pay?pa=7357802287@superyes&pn=Kshitij&am=100.00&cu=INR", "label": 0},
            {"text": "upi://pay?pa=kshitijmeena@okaxis&pn=Friend&am=50.00&cu=INR", "label": 0},
            {"text": "upi://pay?pa=9876543210@ybl&pn=Shop&am=549.00&cu=INR", "label": 0},
            
            # Scam examples
            {"text": "upi://pay?pa=urgent-verify@hack.in&pn=Account%20Verification&am=1.00", "label": 1},
            {"text": "upi://pay?pa=kyc@verification.co&pn=KYC%20Update&am=1.00&tn=Your%20account%20will%20be%20blocked", "label": 1},
            {"text": "http://fake-bank.phishing.com/login", "label": 1},
            {"text": "https://bit.ly/3xScam", "label": 1}
        ]
    }

# Save training data
def save_data(data: Dict[str, Any]) -> None:
    """Save training data to file"""
    try:
        with open(SCAM_DATA_FILE, 'w') as f:
            json.dump(data, f)
        logger.info(f"Data saved with {len(data['data'])} examples")
    except Exception as e:
        logger.error(f"Error saving data: {e}")

# Extract QR code content from image
def extract_qr_content(image_bytes) -> List[str]:
    """Extract text from QR codes in an image using pyzbar"""
    try:
        # Convert bytes to opencv image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Decode QR codes
        decoded_objects = decode(img)
        return [obj.data.decode('utf-8') for obj in decoded_objects]
    except Exception as e:
        logger.error(f"Error extracting QR content: {e}")
        return []

# Rule-based scam detection (heuristics)
def apply_heuristic_checks(url: str) -> Dict[str, Any]:
    """Apply rule-based checks on URL or QR content"""
    result = {"is_suspicious": False, "reasons": []}
    
    # UPI-specific checks
    if url.startswith("upi://"):
        # Check for suspicious keywords in UPI
        upi_suspicious_keywords = ["urgent", "verify", "kyc", "block", "expire", "update", "limited"]
        
        for keyword in upi_suspicious_keywords:
            if keyword in url.lower():
                result["is_suspicious"] = True
                result["reasons"].append(f"Suspicious keyword in UPI: '{keyword}'")
        
        # Check for suspicious UPI IDs
        if "@" in url:
            try:
                # Extract UPI ID from pa parameter
                match = re.search(r"pa=([^&]+)", url)
                if match:
                    upi_id = match.group(1)
                    if any(word in upi_id.lower() for word in ["verify", "kyc", "urgent", "alert"]):
                        result["is_suspicious"] = True
                        result["reasons"].append(f"Suspicious UPI ID: {upi_id}")
                    
                    # Check domain part of UPI ID
                    if "@" in upi_id:
                        domain = upi_id.split("@")[1]
                        suspicious_domains = ["verification", "alert", "secure", "update", "block"]
                        if any(susp in domain.lower() for susp in suspicious_domains):
                            result["is_suspicious"] = True
                            result["reasons"].append(f"Suspicious UPI domain: {domain}")
            except Exception as e:
                logger.warning(f"Error parsing UPI ID: {e}")
    
    # URL-specific checks
    elif url.startswith("http://") or url.startswith("https://"):
        # Check for shortened URLs
        domain = urlparse(url).netloc
        shortened_url_domains = ["bit.ly", "goo.gl", "tinyurl.com", "t.co", "is.gd", "cli.gs", "ow.ly"]
        
        if any(domain == shortened for shortened in shortened_url_domains):
            result["is_suspicious"] = True
            result["reasons"].append(f"Shortened URL detected: {domain}")
        
        # Check for HTTP instead of HTTPS
        if url.startswith("http://"):
            result["is_suspicious"] = True
            result["reasons"].append("Non-secure HTTP connection")
        
        # Check for suspicious keywords in domain/path
        url_suspicious_keywords = ["login", "verify", "account", "secure", "banking", "update", "password"]
        for keyword in url_suspicious_keywords:
            if keyword in url.lower():
                result["is_suspicious"] = True
                result["reasons"].append(f"Suspicious keyword in URL: '{keyword}'")
        
        # Check for IP addresses instead of domains
        if re.match(r"https?://\d+\.\d+\.\d+\.\d+", url):
            result["is_suspicious"] = True
            result["reasons"].append("IP address used instead of domain name")
    
    return result

# Check URL with Google Safe Browsing API (if key is available)
async def check_safe_browsing_api(url: str) -> Dict[str, Any]:
    """Check URL with Google Safe Browsing API"""
    if not GOOGLE_SAFE_BROWSING_API_KEY or not (url.startswith("http://") or url.startswith("https://")):
        return {"checked": False, "is_unsafe": False}
    
    try:
        api_url = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={GOOGLE_SAFE_BROWSING_API_KEY}"
        payload = {
            "client": {
                "clientId": "safe-pay",
                "clientVersion": "1.0.0"
            },
            "threatInfo": {
                "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                "platformTypes": ["ANY_PLATFORM"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [{"url": url}]
            }
        }
        
        response = requests.post(api_url, json=payload, timeout=2)
        result = response.json()
        
        return {
            "checked": True,
            "is_unsafe": "matches" in result and len(result["matches"]) > 0,
            "details": result.get("matches", [])
        }
    except Exception as e:
        logger.warning(f"Safe Browsing API error: {e}")
        return {"checked": False, "is_unsafe": False, "error": str(e)}

# Load or initialize ML models
def create_or_load_models():
    """Create or load ML models for QR analysis"""
    global ml_model, text_model
    
    # Load or create feature-based model
    if os.path.exists(QR_MODEL_FILE):
        try:
            ml_model = joblib.load(QR_MODEL_FILE)
            logger.info("Loaded existing QR feature model")
        except Exception as e:
            logger.error(f"Error loading model, creating new one: {e}")
            ml_model = None
    
    # Load or create text classification model
    if os.path.exists(TEXT_MODEL_FILE):
        try:
            text_model = joblib.load(TEXT_MODEL_FILE)
            logger.info("Loaded existing text classification model")
        except Exception as e:
            logger.error(f"Error loading text model, creating new one: {e}")
            text_model = None
    
    # If models don't exist, create and train them with initial data
    data = load_data()
    
    # Train text classification model if needed
    if text_model is None and data['data']:
        try:
            df = pd.DataFrame(data['data'])
            text_model = make_pipeline(
                TfidfVectorizer(ngram_range=(1, 3), max_features=1000),
                LogisticRegression(class_weight='balanced')
            )
            text_model.fit(df['text'], df['label'])
            joblib.dump(text_model, TEXT_MODEL_FILE)
            logger.info("Created and trained new text classification model")
        except Exception as e:
            logger.error(f"Error creating text model: {e}")
            text_model = None

# Extract features from QR text
def extract_features(qr_text: str) -> Dict[str, Any]:
    """Extract features from QR text for analysis"""
    features = {}
    
    # Basic features
    features['length'] = len(qr_text)
    features['is_url'] = int(qr_text.startswith('http://') or qr_text.startswith('https://'))
    features['is_upi'] = int(qr_text.startswith('upi://'))
    
    # UPI-specific features
    if features['is_upi']:
        features['has_pa'] = int('pa=' in qr_text)
        features['has_pn'] = int('pn=' in qr_text)
        features['has_amount'] = int('am=' in qr_text)
        features['param_count'] = qr_text.count('&') + 1
        
        # Check for suspicious keywords
        suspicious_keywords = ['verify', 'kyc', 'urgent', 'block', 'expire', 'alert', 'validate']
        features['suspicious_keywords'] = sum(1 for word in suspicious_keywords if word in qr_text.lower())
    
    # URL-specific features
    elif features['is_url']:
        # Parse the URL
        parsed_url = urlparse(qr_text)
        domain = parsed_url.netloc
        path = parsed_url.path
        
        features['domain_length'] = len(domain)
        features['path_length'] = len(path)
        features['is_https'] = int(qr_text.startswith('https://'))
        features['is_shortened'] = int(domain in ['bit.ly', 'goo.gl', 'tinyurl.com', 't.co'])
        features['subdomain_count'] = domain.count('.')
        features['is_ip_address'] = int(bool(re.match(r'\d+\.\d+\.\d+\.\d+', domain)))
        
        # Check suspicious keywords in URL
        url_suspicious_words = ['login', 'signin', 'account', 'password', 'secure', 'banking']
        features['url_suspicious_words'] = sum(1 for word in url_suspicious_words if word in qr_text.lower())
    
    # General features for all QR types
    features['digit_ratio'] = sum(c.isdigit() for c in qr_text) / max(len(qr_text), 1)
    features['special_char_ratio'] = sum(not c.isalnum() for c in qr_text) / max(len(qr_text), 1)
    
    return features

# ML-based prediction
def predict_with_ml(qr_text: str) -> float:
    """Predict risk score with ML model"""
    if text_model is None:
        logger.warning("Text model not available")
        return 0.5  # Default uncertainty
    
    try:
        # Get probability of being a scam (class 1)
        proba = text_model.predict_proba([qr_text])[0][1]
        return proba
    except Exception as e:
        logger.error(f"ML prediction error: {e}")
        return 0.5  # Default to uncertainty

# Main analysis function
async def analyze_qr(qr_text: str) -> Dict[str, Any]:
    """Analyze QR text with combined approach"""
    start_time = time.time()
    
    # Check cache first
    cache_key = f"qr:{qr_text}"
    cached_result = cache.get(cache_key)
    if cached_result:
        cached_result["cached"] = True
        return cached_result
    
    # Empty text check
    if not qr_text:
        return {
            "risk_score": 0,
            "risk_level": "unknown",
            "reasons": ["Empty QR content"],
            "latency_ms": 0
        }
    
    # 1. Apply heuristic checks
    heuristic_result = apply_heuristic_checks(qr_text)
    
    # 2. ML-based analysis
    ml_score = predict_with_ml(qr_text)
    
    # 3. Check with Safe Browsing API for URLs
    safe_browsing_result = {"checked": False, "is_unsafe": False}
    if qr_text.startswith("http://") or qr_text.startswith("https://"):
        safe_browsing_result = await check_safe_browsing_api(qr_text)
    
    # Calculate combined risk score
    base_risk = ml_score * 100  # Convert to 0-100 scale
    
    # Adjust based on heuristics
    if heuristic_result["is_suspicious"]:
        # Increase risk based on number of suspicious patterns
        heuristic_penalty = min(40, len(heuristic_result["reasons"]) * 10)
        base_risk = min(100, base_risk + heuristic_penalty)
    
    # Boost risk if detected by Safe Browsing API
    if safe_browsing_result.get("is_unsafe", False):
        base_risk = max(90, base_risk)  # At least 90% if flagged
    
    # UPI safety boost for legitimate UPI QRs
    if qr_text.startswith("upi://") and not heuristic_result["is_suspicious"]:
        base_risk = max(0, base_risk - 30)  # Reduce risk for legitimate UPI QRs
    
    # Determine risk level
    risk_level = "low"
    if base_risk >= 70:
        risk_level = "high"
    elif base_risk >= 30:
        risk_level = "medium"
    
    # Prepare result
    reasons = heuristic_result.get("reasons", [])
    if safe_browsing_result.get("is_unsafe", False):
        reasons.append("Flagged by Safe Browsing API")
    
    if not reasons and base_risk < 30:
        if qr_text.startswith("upi://"):
            reasons.append("Legitimate UPI payment QR")
        elif qr_text.startswith("https://"):
            reasons.append("No suspicious patterns detected")
    
    result = {
        "risk_score": round(base_risk, 1),
        "risk_level": risk_level,
        "reasons": reasons,
        "analysis": {
            "ml_score": round(ml_score, 3),
            "heuristic_flags": len(heuristic_result.get("reasons", [])),
            "safe_browsing_check": safe_browsing_result.get("checked", False),
            "safe_browsing_unsafe": safe_browsing_result.get("is_unsafe", False)
        },
        "qr_type": "upi" if qr_text.startswith("upi://") else "url" if qr_text.startswith("http") else "text",
        "latency_ms": round((time.time() - start_time) * 1000, 2)
    }
    
    # Cache the result (5 minutes)
    cache.set(cache_key, result, expire=300)
    
    return result

# FastAPI routes
@app.get("/")
async def root():
    """API health check endpoint"""
    return {"status": "online", "service": "Enhanced QR Scam Detection API"}

@app.post("/predict")
async def predict(request: QRRequest):
    """Predict risk for QR text"""
    try:
        result = await analyze_qr(request.qr_text)
        return result
    except Exception as e:
        logger.error(f"Error in predict: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/feedback")
async def feedback(request: QRFeedbackRequest):
    """Submit feedback to improve the model"""
    try:
        # Add to training data
        data = load_data()
        data["data"].append({
            "text": request.qr_text,
            "label": 1 if request.is_scam else 0,
            "reason": request.reason,
            "timestamp": time.time()
        })
        
        # Save updated data
        save_data(data)
        
        # Retrain model if enough new samples
        if len(data["data"]) % 10 == 0:
            df = pd.DataFrame(data["data"])
            
            if text_model is not None:
                try:
                    # Retrain text model
                    text_model.fit(df["text"], df["label"])
                    joblib.dump(text_model, TEXT_MODEL_FILE)
                    logger.info(f"Text model retrained with {len(df)} examples")
                except Exception as e:
                    logger.error(f"Error retraining text model: {e}")
        
        # Clear cache for this QR code
        cache_key = f"qr:{request.qr_text}"
        cache.delete(cache_key)
        
        return {"status": "feedback_recorded", "new_sample_count": len(data["data"])}
    except Exception as e:
        logger.error(f"Error processing feedback: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process feedback: {str(e)}")

@app.post("/batch-predict")
async def batch_predict(request: BatchQRRequest):
    """Process multiple QR codes in one request"""
    results = []
    for qr_text in request.qr_texts:
        try:
            result = await analyze_qr(qr_text)
            results.append({"qr_text": qr_text, **result})
        except Exception as e:
            results.append({
                "qr_text": qr_text,
                "error": str(e),
                "risk_score": 50,  # Default to medium risk on error
                "risk_level": "unknown"
            })
    return {"results": results}

@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    """Extract and analyze QR codes from an image"""
    try:
        # Read image content
        image_data = await file.read()
        
        # Extract QR content
        qr_contents = extract_qr_content(image_data)
        
        if not qr_contents:
            return {"status": "no_qr_detected", "message": "No QR codes detected in the image"}
        
        # Analyze each QR code
        results = []
        for qr_text in qr_contents:
            analysis = await analyze_qr(qr_text)
            results.append({"qr_text": qr_text, **analysis})
        
        return {"status": "success", "qr_count": len(results), "results": results}
    except Exception as e:
        logger.error(f"Error analyzing image: {e}")
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")

# Initialize models on startup
@app.on_event("startup")
async def startup_event():
    """Initialize models and data on startup"""
    logger.info("Starting Enhanced QR Scam Detection API")
    create_or_load_models()

# Main entry
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)