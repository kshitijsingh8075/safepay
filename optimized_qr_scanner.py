# 🟢 REPLIT-FRIENDLY QR SCAN SYSTEM
# 🚀 Optimized for Replit's Memory/Dependency Limits

from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import numpy as np
import re
import time
import joblib
from sklearn.linear_model import SGDClassifier
from sklearn.feature_extraction import DictVectorizer
from sklearn.pipeline import make_pipeline
from diskcache import Cache
import json
import os

# 📦 Lightweight Model Setup
MODEL_FILE = "model.joblib"
DATA_FILE = "qr_data.json"

if os.path.exists(MODEL_FILE):
    model = joblib.load(MODEL_FILE)
else:
    model = make_pipeline(
        DictVectorizer(),
        SGDClassifier(loss='log_loss', warm_start=True)
    )

# 💾 Replit-Compatible Data Storage
def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return {'X': [], 'y': []}

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f)

# 🚄 Optimized Feature Extraction
def extract_features(qr_text: str) -> dict:
    return {
        'length': min(len(qr_text), 100),  # Limit computation
        'has_upi': int('upi://' in qr_text),
        'num_params': qr_text.count('&'),
        'urgent': int('urgent' in qr_text.lower()),
        'payment': int('payment' in qr_text.lower())
    }

app = FastAPI()
cache = Cache('./cache')

class QRRequest(BaseModel):
    qr_text: str

@app.post("/predict")
async def predict(request: QRRequest):
    start = time.time()
    
    # 🔍 Cache First
    if request.qr_text in cache:
        return {**cache[request.qr_text], "cached": True}
    
    # ⚡ Feature Extraction
    features = extract_features(request.qr_text)
    
    # 🧠 Prediction
    try:
        proba = model.predict_proba([features])[0][1]
    except:
        # Initial model fallback
        proba = 0.5
    
    risk_score = round(proba * 100, 2)
    
    # 🕵 Basic Security Rules
    if features['urgent'] and features['payment']:
        risk_score = min(risk_score + 20, 100)
    
    result = {
        "risk_score": risk_score,
        "latency_ms": round((time.time() - start) * 1000, 2)
    }
    
    cache.set(request.qr_text, result, expire=300)
    return result

@app.post("/feedback")
async def feedback(qr_text: str, is_scam: bool):
    # 🎓 Incremental Learning
    features = extract_features(qr_text)
    data = load_data()
    
    data['X'].append(features)
    data['y'].append(int(is_scam))
    
    # Retrain when we have 100 new samples
    if len(data['y']) % 100 == 0:
        model.fit(data['X'], data['y'])
        joblib.dump(model, MODEL_FILE)
        save_data(data)
    
    return {"status": "feedback_received"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)