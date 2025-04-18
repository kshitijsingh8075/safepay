#!/usr/bin/env python3
"""
UPI Fraud Detection System
--------------------------
This script creates a robust fraud detection system using the anonymized UPI transaction data.
It implements:
1. Machine learning model for fraud detection
2. Transaction risk scoring engine
3. Feature engineering for improved detection
4. Model evaluation metrics
"""

import os
import numpy as np
import pandas as pd
from datetime import datetime
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.impute import SimpleImputer
import warnings
warnings.filterwarnings('ignore')

# File path for the dataset
DATA_FILE = 'attached_assets/anonymized_sample_fraud_txn.csv'
MODEL_FILE = 'upi_fraud_model.joblib'
SCALER_FILE = 'upi_scaler.joblib'

def load_data():
    """Load and process the UPI transaction data"""
    print("Loading UPI transaction data...")
    df = pd.read_csv(DATA_FILE)
    print(f"Loaded {len(df)} transactions with {df['IS_FRAUD'].sum()} fraudulent cases")
    return df

def preprocess_data(df):
    """Preprocess the data and engineer features"""
    print("Preprocessing and feature engineering...")
    
    # Convert timestamp to datetime
    df['TXN_TIMESTAMP'] = pd.to_datetime(df['TXN_TIMESTAMP'], format='%d/%m/%Y %H:%M')
    
    # Extract temporal features
    df['TXN_HOUR'] = df['TXN_TIMESTAMP'].dt.hour
    df['TXN_DAY'] = df['TXN_TIMESTAMP'].dt.day
    df['TXN_WEEKDAY'] = df['TXN_TIMESTAMP'].dt.dayofweek
    df['TXN_MONTH'] = df['TXN_TIMESTAMP'].dt.month
    
    # High-risk hours (night time transactions)
    df['IS_NIGHT'] = ((df['TXN_HOUR'] >= 0) & (df['TXN_HOUR'] < 6)).astype(int)
    
    # Amount-based features
    df['AMOUNT_LOG'] = np.log1p(df['AMOUNT'])
    
    # Status-based features
    df['IS_COMPLETED'] = (df['TRN_STATUS'] == 'COMPLETED').astype(int)
    df['IS_FAILED'] = (df['TRN_STATUS'] == 'FAILED').astype(int)
    
    # Check for same device multiple accounts
    device_counts = df.groupby('DEVICE_ID')['PAYER_ACCOUNT'].nunique().reset_index()
    device_counts.columns = ['DEVICE_ID', 'NUM_ACCOUNTS']
    df = df.merge(device_counts, on='DEVICE_ID', how='left')
    df['MULTIPLE_ACCOUNTS'] = (df['NUM_ACCOUNTS'] > 1).astype(int)
    
    # Transaction frequency by payer
    payer_counts = df.groupby('PAYER_ACCOUNT').size().reset_index()
    payer_counts.columns = ['PAYER_ACCOUNT', 'TXN_FREQUENCY']
    df = df.merge(payer_counts, on='PAYER_ACCOUNT', how='left')
    
    # Features for training the model
    features = ['AMOUNT', 'AMOUNT_LOG', 'TXN_HOUR', 'TXN_DAY', 'TXN_WEEKDAY',
                'IS_NIGHT', 'IS_COMPLETED', 'IS_FAILED', 'MULTIPLE_ACCOUNTS', 
                'TXN_FREQUENCY', 'TRN_STATUS', 'RESPONSE_CODE', 'PAYER_IFSC', 
                'BENEFICIARY_IFSC', 'INITIATION_MODE', 'TRANSACTION_TYPE', 
                'PAYMENT_INSTRUMENT']
    
    # Filter dataframe to only include needed columns
    df_filtered = df[features + ['IS_FRAUD']]
    
    # Handle missing values
    df_filtered = df_filtered.fillna({'MULTIPLE_ACCOUNTS': 0, 'TXN_FREQUENCY': 0})
    
    print("Preprocessing complete. Shape:", df_filtered.shape)
    return df_filtered, features

def build_pipeline(numeric_features, categorical_features):
    """Build a machine learning pipeline with preprocessors and a classifier"""
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])
    
    preprocessor = ColumnTransformer(transformers=[
        ('num', numeric_transformer, numeric_features),
        ('cat', categorical_transformer, categorical_features)
    ])
    
    # Use RandomForest for the initial model
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(
            n_estimators=100, 
            max_depth=10,
            min_samples_split=10,
            random_state=42,
            class_weight='balanced',
            n_jobs=-1))
    ])
    
    return pipeline

def train_model(df, features):
    """Train the fraud detection model"""
    print("Training fraud detection model...")
    
    # Split features into numeric and categorical
    numeric_features = [f for f in features if f not in 
                      ['TRN_STATUS', 'RESPONSE_CODE', 'PAYER_IFSC', 'BENEFICIARY_IFSC',
                       'INITIATION_MODE', 'TRANSACTION_TYPE', 'PAYMENT_INSTRUMENT']]
    
    categorical_features = [f for f in features if f not in numeric_features]
    
    # Split data into train and test sets
    X = df[features]
    y = df['IS_FRAUD']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
    
    # Build and train pipeline
    model_pipeline = build_pipeline(numeric_features, categorical_features)
    model_pipeline.fit(X_train, y_train)
    
    # Save pipeline for later use
    joblib.dump(model_pipeline, MODEL_FILE)
    print(f"Model saved to {MODEL_FILE}")
    
    # Evaluate the model
    y_pred = model_pipeline.predict(X_test)
    y_prob = model_pipeline.predict_proba(X_test)[:, 1]
    
    print("\nModel Evaluation:")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    auc = roc_auc_score(y_test, y_prob)
    print(f"\nROC AUC Score: {auc:.4f}")
    
    return model_pipeline, X_test, y_test

def evaluate_feature_importance(model, features):
    """Evaluate and display feature importance"""
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
    else:
        importances = model.named_steps['classifier'].feature_importances_
    
    # Get feature names from the pipeline
    if hasattr(model, 'named_steps'):
        preprocessor = model.named_steps['preprocessor']
        feature_names = []
        
        # For numeric features
        if hasattr(preprocessor, 'transformers_'):
            for name, transformer, cols in preprocessor.transformers_:
                if name == 'num':
                    feature_names.extend(cols)
                elif name == 'cat':
                    # For categorical features, get the encoded feature names
                    encoder = transformer.named_steps['onehot']
                    encoded_names = []
                    for i, col in enumerate(cols):
                        categories = encoder.categories_[i]
                        encoded_names.extend([f"{col}_{cat}" for cat in categories])
                    feature_names.extend(encoded_names)
        
        feature_importance = pd.DataFrame({
            'Feature': feature_names[:len(importances)],
            'Importance': importances
        })
    else:
        feature_importance = pd.DataFrame({
            'Feature': features,
            'Importance': importances
        })
    
    feature_importance = feature_importance.sort_values('Importance', ascending=False)
    print("\nTop 15 Important Features:")
    print(feature_importance.head(15))
    
    return feature_importance

def create_risk_scoring_system(model, X_test, y_test):
    """Create a transaction risk scoring system"""
    print("\nDeveloping Transaction Risk Scoring Engine...")
    
    # Get probability predictions
    y_prob = model.predict_proba(X_test)[:, 1]
    
    # Create risk score (0-10 scale)
    risk_scores = y_prob * 10
    
    # Define risk categories
    risk_categories = pd.cut(
        risk_scores, 
        bins=[0, 3, 7, 10], 
        labels=['LOW', 'MEDIUM', 'HIGH']
    )
    
    # Create a dataframe with results
    risk_df = pd.DataFrame({
        'Actual': y_test.values,
        'Probability': y_prob,
        'Risk_Score': risk_scores,
        'Risk_Level': risk_categories
    })
    
    # Print risk score distribution
    print("\nRisk Score Distribution:")
    print(risk_df['Risk_Level'].value_counts())
    
    print("\nAverage Risk Score:")
    print(f"- Fraudulent Transactions: {risk_df[risk_df['Actual'] == 1]['Risk_Score'].mean():.2f}")
    print(f"- Legitimate Transactions: {risk_df[risk_df['Actual'] == 0]['Risk_Score'].mean():.2f}")
    
    return risk_df

def risk_score_transaction(transaction, model):
    """Score a single transaction for risk"""
    # Assume transaction is a properly formatted dictionary
    transaction_df = pd.DataFrame([transaction])
    
    # Preprocess as needed
    # (Add feature engineering similar to training process)
    
    # Predict risk
    risk_prob = model.predict_proba(transaction_df)[0, 1]
    risk_score = risk_prob * 10
    
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
        'risk_probability': risk_prob
    }

def print_fraud_patterns(df):
    """Identify and print common fraud patterns"""
    print("\nCommon Fraud Patterns:")
    
    fraud_df = df[df['IS_FRAUD'] == 1]
    non_fraud_df = df[df['IS_FRAUD'] == 0]
    
    # Time patterns
    fraud_hours = fraud_df['TXN_HOUR'].value_counts(normalize=True)
    normal_hours = non_fraud_df['TXN_HOUR'].value_counts(normalize=True)
    
    print("\nTop 5 Fraudulent Transaction Hours (% of fraud):")
    print(fraud_hours.sort_values(ascending=False).head(5))
    
    # Amount patterns
    print("\nAmount Statistics for Fraudulent vs Normal Transactions:")
    print(f"Fraud - Mean: {fraud_df['AMOUNT'].mean():.2f}, Median: {fraud_df['AMOUNT'].median():.2f}")
    print(f"Normal - Mean: {non_fraud_df['AMOUNT'].mean():.2f}, Median: {non_fraud_df['AMOUNT'].median():.2f}")
    
    # Status patterns
    fraud_status = fraud_df['TRN_STATUS'].value_counts(normalize=True)
    normal_status = non_fraud_df['TRN_STATUS'].value_counts(normalize=True)
    
    print("\nTransaction Status for Fraudulent Transactions:")
    print(fraud_status)
    
    # Device patterns
    fraud_devices = fraud_df['DEVICE_ID'].value_counts()
    multi_fraud_devices = fraud_devices[fraud_devices > 1]
    
    print(f"\nDevices with multiple fraud transactions: {len(multi_fraud_devices)}")
    if len(multi_fraud_devices) > 0:
        print("Top risky devices:")
        print(multi_fraud_devices.head())

def main():
    """Main execution function"""
    print("=" * 50)
    print("UPI FRAUD DETECTION SYSTEM")
    print("=" * 50)
    
    # Load and preprocess data
    df = load_data()
    df_processed, features = preprocess_data(df)
    
    # Train model
    model, X_test, y_test = train_model(df_processed, features)
    
    # Evaluate feature importance
    evaluate_feature_importance(model.named_steps['classifier'], features)
    
    # Create risk scoring system
    risk_df = create_risk_scoring_system(model, X_test, y_test)
    
    # Print fraud patterns
    print_fraud_patterns(df_processed)
    
    print("\nFraud Detection System Ready!")
    print("=" * 50)

if __name__ == "__main__":
    main()