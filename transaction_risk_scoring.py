#!/usr/bin/env python3
"""
UPI Transaction Risk Scoring Engine
----------------------------------
This script implements a comprehensive transaction risk scoring engine
that assigns risk scores to UPI transactions based on multiple factors.
"""

import os
import numpy as np
import pandas as pd
from datetime import datetime
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

# File path for the dataset
DATA_FILE = 'attached_assets/anonymized_sample_fraud_txn.csv'
RF_MODEL_FILE = 'upi_fraud_model.joblib'
ISOLATION_MODEL_FILE = 'isolation_forest_model.joblib'

class TransactionRiskScorer:
    """Risk scoring engine for UPI transactions"""
    
    def __init__(self):
        """Initialize the risk scoring engine"""
        self.rf_model = None  # Random Forest model
        self.iso_model = None  # Isolation Forest model
        self.scaler = None
        self.device_risk_scores = {}
        self.ip_risk_scores = {}
        self.vpa_risk_scores = {}
        
        # Load pre-trained models if available
        if os.path.exists(RF_MODEL_FILE):
            self.rf_model = joblib.load(RF_MODEL_FILE)
            print(f"Loaded Random Forest model from {RF_MODEL_FILE}")
        
        if os.path.exists(ISOLATION_MODEL_FILE):
            self.iso_model = joblib.load(ISOLATION_MODEL_FILE)
            print(f"Loaded Isolation Forest model from {ISOLATION_MODEL_FILE}")
        else:
            # Train Isolation Forest model
            print("Training Isolation Forest model...")
            self._train_isolation_forest()
    
    def _load_data(self):
        """Load and process the UPI transaction data"""
        print("Loading UPI transaction data...")
        df = pd.read_csv(DATA_FILE)
        
        # Convert timestamp to datetime
        df['TXN_TIMESTAMP'] = pd.to_datetime(df['TXN_TIMESTAMP'], format='%d/%m/%Y %H:%M')
        
        # Feature engineering for risk scoring
        self._engineer_features(df)
        
        return df
    
    def _engineer_features(self, df):
        """Engineer features for the risk scoring model"""
        # Extract temporal features
        df['TXN_HOUR'] = df['TXN_TIMESTAMP'].dt.hour
        df['TXN_DAY'] = df['TXN_TIMESTAMP'].dt.day
        df['TXN_WEEKDAY'] = df['TXN_TIMESTAMP'].dt.dayofweek
        
        # High-risk hours (night time transactions)
        df['IS_NIGHT'] = ((df['TXN_HOUR'] >= 0) & (df['TXN_HOUR'] < 6)).astype(int)
        
        # Amount-based features
        df['AMOUNT_LOG'] = np.log1p(df['AMOUNT'])
        
        # Status-based features
        df['IS_COMPLETED'] = (df['TRN_STATUS'] == 'COMPLETED').astype(int)
        df['IS_FAILED'] = (df['TRN_STATUS'] == 'FAILED').astype(int)
        
        # Build device and IP risk scores
        self._build_entity_risk_scores(df)
        
        return df
    
    def _build_entity_risk_scores(self, df):
        """Build risk scores for devices, IPs, and VPAs"""
        # Device risk scores
        device_fraud = df.groupby('DEVICE_ID')['IS_FRAUD'].mean().reset_index()
        device_fraud.columns = ['DEVICE_ID', 'FRAUD_RATE']
        self.device_risk_scores = dict(zip(device_fraud['DEVICE_ID'], device_fraud['FRAUD_RATE']))
        
        # IP risk scores
        ip_fraud = df.groupby('IP_ADDRESS')['IS_FRAUD'].mean().reset_index()
        ip_fraud.columns = ['IP_ADDRESS', 'FRAUD_RATE']
        self.ip_risk_scores = dict(zip(ip_fraud['IP_ADDRESS'], ip_fraud['FRAUD_RATE']))
        
        # VPA risk scores
        vpa_fraud = df.groupby('PAYER_VPA')['IS_FRAUD'].mean().reset_index()
        vpa_fraud.columns = ['PAYER_VPA', 'FRAUD_RATE']
        self.vpa_risk_scores = dict(zip(vpa_fraud['PAYER_VPA'], vpa_fraud['FRAUD_RATE']))
    
    def _train_isolation_forest(self):
        """Train an Isolation Forest model for anomaly detection"""
        df = self._load_data()
        
        # Select numeric features
        numeric_features = ['AMOUNT', 'AMOUNT_LOG', 'TXN_HOUR', 'TXN_DAY', 
                           'TXN_WEEKDAY', 'IS_NIGHT', 'IS_COMPLETED', 'IS_FAILED']
        
        X = df[numeric_features]
        
        # Scale the features
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        # Train Isolation Forest
        self.iso_model = IsolationForest(
            n_estimators=100,
            max_samples='auto',
            contamination=0.1,  # Assuming 10% of transactions might be anomalies
            random_state=42
        ).fit(X_scaled)
        
        # Save the model
        joblib.dump(self.iso_model, ISOLATION_MODEL_FILE)
        print(f"Isolation Forest model saved to {ISOLATION_MODEL_FILE}")
    
    def get_time_risk(self, hour):
        """Calculate risk based on time of day"""
        # Higher risk for transactions during night hours
        if 0 <= hour < 6:  # Midnight to 6am
            return 0.8
        elif 22 <= hour < 24:  # 10pm to midnight
            return 0.6
        elif 6 <= hour < 8:  # 6am to 8am
            return 0.4
        else:
            return 0.2
    
    def get_amount_risk(self, amount):
        """Calculate risk based on transaction amount"""
        # Higher risk for very small or very large amounts
        if amount < 10:
            return 0.7  # Very small amounts often used for testing/fraud
        elif amount > 10000:
            return 0.6  # Very large amounts are higher risk
        elif amount > 5000:
            return 0.4
        else:
            return 0.2
    
    def get_device_risk(self, device_id):
        """Get risk score for a device"""
        return self.device_risk_scores.get(device_id, 0.3)  # Default risk of 0.3 for unknown devices
    
    def get_ip_risk(self, ip_address):
        """Get risk score for an IP address"""
        return self.ip_risk_scores.get(ip_address, 0.3)  # Default risk of 0.3 for unknown IPs
    
    def get_vpa_risk(self, vpa):
        """Get risk score for a VPA"""
        return self.vpa_risk_scores.get(vpa, 0.3)  # Default risk of 0.3 for unknown VPAs
    
    def calculate_risk_score(self, transaction):
        """Calculate risk score for a transaction"""
        # Extract features
        amount = transaction.get('AMOUNT', 0)
        hour = None
        if 'TXN_TIMESTAMP' in transaction:
            if isinstance(transaction['TXN_TIMESTAMP'], str):
                try:
                    timestamp = datetime.strptime(transaction['TXN_TIMESTAMP'], '%d/%m/%Y %H:%M')
                    hour = timestamp.hour
                except:
                    hour = datetime.now().hour
            else:
                hour = transaction['TXN_TIMESTAMP'].hour
        else:
            hour = datetime.now().hour
        
        device_id = transaction.get('DEVICE_ID', None)
        ip_address = transaction.get('IP_ADDRESS', None)
        payer_vpa = transaction.get('PAYER_VPA', None)
        status = transaction.get('TRN_STATUS', 'COMPLETED')
        
        # Calculate risk components
        time_risk = self.get_time_risk(hour)
        amount_risk = self.get_amount_risk(amount)
        device_risk = self.get_device_risk(device_id) if device_id else 0.3
        ip_risk = self.get_ip_risk(ip_address) if ip_address else 0.3
        vpa_risk = self.get_vpa_risk(payer_vpa) if payer_vpa else 0.3
        status_risk = 0.7 if status == 'FAILED' else 0.2
        
        # Use ML models for additional risk assessment
        ml_risk = 0.0
        anomaly_score = 0.0
        
        if self.rf_model:
            # Prepare data for the Random Forest model
            try:
                # This part would need to match the preprocessing from training
                ml_risk = self.rf_model.predict_proba([transaction])[0, 1]
            except:
                ml_risk = 0.3  # Default if prediction fails
        
        if self.iso_model and self.scaler:
            # Prepare data for the Isolation Forest model
            try:
                features = np.array([[
                    amount,
                    np.log1p(amount),
                    hour,
                    datetime.now().day,
                    datetime.now().weekday(),
                    1 if (0 <= hour < 6) else 0,
                    1 if status == 'COMPLETED' else 0,
                    1 if status == 'FAILED' else 0
                ]])
                
                features_scaled = self.scaler.transform(features)
                anomaly_score = -self.iso_model.score_samples(features_scaled)[0]
                # Normalize to 0-1 range (higher is more anomalous)
                anomaly_score = min(max(anomaly_score / 0.5, 0), 1)
            except:
                anomaly_score = 0.3  # Default if prediction fails
        
        # Combine all risk components
        # Weights can be adjusted based on importance
        combined_risk = (
            0.15 * time_risk +
            0.20 * amount_risk +
            0.15 * device_risk +
            0.10 * ip_risk +
            0.15 * vpa_risk +
            0.10 * status_risk +
            0.10 * ml_risk +
            0.05 * anomaly_score
        )
        
        # Scale to 0-10 range
        risk_score = combined_risk * 10
        
        # Determine risk level
        if risk_score < 3:
            risk_level = 'LOW'
        elif risk_score < 7:
            risk_level = 'MEDIUM'
        else:
            risk_level = 'HIGH'
        
        return {
            'risk_score': risk_score,
            'risk_level': risk_level,
            'components': {
                'time_risk': time_risk,
                'amount_risk': amount_risk,
                'device_risk': device_risk,
                'ip_risk': ip_risk,
                'vpa_risk': vpa_risk,
                'status_risk': status_risk,
                'ml_risk': ml_risk,
                'anomaly_score': anomaly_score
            }
        }

def main():
    """Main execution function"""
    print("=" * 60)
    print("UPI TRANSACTION RISK SCORING ENGINE")
    print("=" * 60)
    
    # Initialize the risk scorer
    risk_scorer = TransactionRiskScorer()
    
    # Sample transaction
    sample_transaction = {
        'AMOUNT': 5000.0,
        'TXN_TIMESTAMP': '06/03/2025 02:30',  # Late night transaction
        'TRN_STATUS': 'COMPLETED',
        'PAYER_VPA': 'e3b9072ba0be9291d0c4@axl',
        'DEVICE_ID': 'QYCDG0GPMDCY2NRXDMMLLOZC5YAC1EJSD2T',
        'IP_ADDRESS': 'e352aa97959bdae2f700'
    }
    
    # Calculate risk score
    risk_result = risk_scorer.calculate_risk_score(sample_transaction)
    
    print("\nSample Transaction Risk Analysis:")
    print(f"Transaction Amount: ₹{sample_transaction['AMOUNT']}")
    print(f"Transaction Time: {sample_transaction['TXN_TIMESTAMP']}")
    print(f"Risk Score: {risk_result['risk_score']:.2f}/10")
    print(f"Risk Level: {risk_result['risk_level']}")
    
    print("\nRisk Components:")
    for component, score in risk_result['components'].items():
        print(f"- {component}: {score:.2f}")
    
    print("\nRisk Scoring Engine Ready!")
    print("=" * 60)

if __name__ == "__main__":
    main()