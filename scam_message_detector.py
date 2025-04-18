#!/usr/bin/env python3
"""
UPI Scam Message Detector
------------------------
Analyzes messages and text fields from UPI transactions to detect potential scams
using NLP techniques and pattern matching.
"""

import re
import pandas as pd
import numpy as np
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
import joblib
import warnings
warnings.filterwarnings('ignore')

# File path for the dataset
DATA_FILE = 'attached_assets/anonymized_sample_fraud_txn.csv'
MODEL_FILE = 'scam_message_model.joblib'

class ScamMessageDetector:
    """Class for detecting scam messages in UPI transactions"""
    
    def __init__(self):
        """Initialize the scam message detector"""
        # Common scam keywords and patterns
        self.scam_keywords = [
            'urgent', 'emergency', 'kyc', 'account block', 'suspend', 'blocked',
            'verify', 'reward', 'prize', 'won', 'winner', 'lottery', 'claim',
            'payment failed', 'expired', 'link', 'click', 'update', 
            'immediate', 'action required', 'bank', 'credit', 'refund',
            'otp', 'password', 'pin', 'security', 'alert', 'attention',
            'compromised', 'unauthorized', 'suspicious', 'hack', 'activate',
            'deactivate', 'government', 'tax', 'income tax', 'it department',
            'official', 'helpline', 'customer care', 'support', 'offer',
            'discount', 'cashback', 'free', 'gift', 'limited time', 'hurry',
            'problem', 'issue', 'resolve', 'last chance', 'warning'
        ]
        
        # Regular expressions for common scam patterns
        self.scam_patterns = [
            r'(?i)urgent.*kyc',
            r'(?i)account.*block',
            r'(?i)suspend.*account',
            r'(?i)verify.*account',
            r'(?i)won.*prize|won.*reward|won.*lottery',
            r'(?i)click.*link',
            r'(?i)otp.*share',
            r'(?i)password.*update',
            r'(?i)bank.*alert',
            r'(?i)last.*chance',
            r'(?i)expires.*today',
            r'(?i)action.*required',
            r'(?i)call.*helpline',
            r'(?i)customer.*care',
            r'(?i)your.*payment.*failed'
        ]
        
        # Common phrases used in legitimate business messages for comparison
        self.legitimate_phrases = [
            'thank you for your payment',
            'transaction complete',
            'payment successful',
            'receipt for your purchase',
            'order confirmation',
            'delivery update',
            'subscription renewed',
            'your account statement',
            'digital receipt',
            'payment received'
        ]
        
        # NLP model for scam detection
        self.model = None
        
        # Load pre-trained model if available
        if os.path.exists(MODEL_FILE):
            self.model = joblib.load(MODEL_FILE)
            print(f"Loaded scam detection model from {MODEL_FILE}")
    
    def generate_synthetic_messages(self, num_samples=1000):
        """
        Generate synthetic dataset for training scam detection model
        because transaction descriptions might not be available in anonymized data.
        """
        # Synthetic scam messages
        scam_messages = []
        
        # Generate scam messages using keywords and patterns
        for _ in range(num_samples // 2):
            # Randomly choose 2-5 keywords
            keywords = np.random.choice(self.scam_keywords, size=np.random.randint(2, 6), replace=False)
            
            # Build a message
            message = ' '.join(keywords)
            
            # Add some filler words
            fillers = ['please', 'now', 'immediately', 'your', 'today', 'must', 'or', 'and', 'the', 'by']
            filler_words = np.random.choice(fillers, size=np.random.randint(2, 5), replace=True)
            
            words = message.split() + list(filler_words)
            np.random.shuffle(words)
            
            message = ' '.join(words)
            
            # Add a period at the end
            message = message.capitalize() + '.'
            scam_messages.append((message, 1))  # 1 for scam
        
        # Synthetic legitimate messages
        legit_messages = []
        
        # Generate legitimate messages
        for _ in range(num_samples // 2):
            # Start with a legitimate phrase
            base = np.random.choice(self.legitimate_phrases)
            
            # Add details
            details = ['Thank you', 'Order #12345', 'Invoice #AB123', 'for ₹500', 'at 2:30pm',
                      'from Amazon', 'to Flipkart', 'Your balance: ₹1000', 'Points earned: 50',
                      'Date: 15-Mar-2025']
            
            detail = np.random.choice(details, size=np.random.randint(1, 3), replace=False)
            
            message = base + '. ' + ' '.join(detail)
            legit_messages.append((message, 0))  # 0 for legitimate
        
        # Combine both types
        all_messages = scam_messages + legit_messages
        np.random.shuffle(all_messages)
        
        # Convert to DataFrame
        messages_df = pd.DataFrame(all_messages, columns=['message', 'is_scam'])
        
        return messages_df
    
    def train_model(self, messages_df=None):
        """Train a model to detect scam messages"""
        if messages_df is None:
            messages_df = self.generate_synthetic_messages()
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            messages_df['message'], 
            messages_df['is_scam'],
            test_size=0.2,
            random_state=42
        )
        
        # Create pipeline with TF-IDF and Naive Bayes
        self.model = Pipeline([
            ('tfidf', TfidfVectorizer(
                max_features=5000,
                ngram_range=(1, 3),
                stop_words='english'
            )),
            ('classifier', MultinomialNB())
        ])
        
        # Train the model
        self.model.fit(X_train, y_train)
        
        # Evaluate
        accuracy = self.model.score(X_test, y_test)
        print(f"Model accuracy: {accuracy:.4f}")
        
        # Save the model
        joblib.dump(self.model, MODEL_FILE)
        print(f"Model saved to {MODEL_FILE}")
        
        return accuracy
    
    def keyword_match_score(self, text):
        """Calculate a score based on keyword matching"""
        text = text.lower()
        
        # Count keyword matches
        keyword_matches = sum(1 for keyword in self.scam_keywords if keyword.lower() in text)
        
        # Count pattern matches
        pattern_matches = sum(1 for pattern in self.scam_patterns if re.search(pattern, text))
        
        # Calculate score (normalized to 0-1)
        total_score = (keyword_matches * 0.1) + (pattern_matches * 0.3)
        score = min(max(total_score, 0), 1)
        
        return score
    
    def extract_message_features(self, text):
        """Extract features from message text"""
        features = {}
        
        # Text length
        features['text_length'] = len(text)
        
        # Word count
        features['word_count'] = len(text.split())
        
        # Uppercase ratio
        if len(text) > 0:
            features['uppercase_ratio'] = sum(1 for c in text if c.isupper()) / len(text)
        else:
            features['uppercase_ratio'] = 0
        
        # Punctuation count
        features['exclamation_count'] = text.count('!')
        features['question_count'] = text.count('?')
        
        # Contains URL?
        features['has_url'] = 1 if re.search(r'https?://\S+|www\.\S+', text) else 0
        
        # Contains numbers?
        features['has_numbers'] = 1 if re.search(r'\d', text) else 0
        
        # Contains currency symbols?
        features['has_currency'] = 1 if re.search(r'₹|\$|€|£', text) else 0
        
        return features
    
    def analyze_message(self, text):
        """Analyze a message to detect potential scams"""
        if not text or len(text) < 3:
            return {
                'scam_probability': 0.1,  # Very short messages get a low baseline
                'is_scam': False,
                'risk_level': 'LOW',
                'warning_flags': [],
                'explanation': "Message too short for analysis."
            }
        
        # Keyword-based score
        keyword_score = self.keyword_match_score(text)
        
        # Pattern score
        matched_patterns = [pattern for pattern in self.scam_patterns if re.search(pattern, text)]
        
        # NLP model score
        model_score = 0.5  # Default if model not available
        if self.model:
            try:
                model_score = self.model.predict_proba([text])[0][1]
            except:
                pass  # Keep default if prediction fails
        
        # Combine scores (weighted average)
        combined_score = (keyword_score * 0.4) + (model_score * 0.6)
        
        # Determine if it's a scam
        is_scam = combined_score > 0.7
        
        # Set risk level
        if combined_score < 0.3:
            risk_level = 'LOW'
        elif combined_score < 0.7:
            risk_level = 'MEDIUM'
        else:
            risk_level = 'HIGH'
        
        # Prepare warning flags
        warning_flags = []
        
        for pattern in self.scam_patterns:
            match = re.search(pattern, text)
            if match:
                # Extract the matched text
                matched_text = match.group(0)
                warning_flags.append(f"Suspicious pattern: '{matched_text}'")
        
        # Additional checks
        if re.search(r'https?://\S+|www\.\S+', text):
            warning_flags.append("Contains URL (potential phishing)")
            
        if text.isupper() or (sum(1 for c in text if c.isupper()) / len(text) > 0.5):
            warning_flags.append("Excessive use of UPPERCASE (aggressive tone)")
            
        if text.count('!') > 2:
            warning_flags.append("Multiple exclamation marks (sense of urgency)")
        
        # Generate explanation
        if is_scam:
            explanation = "This message contains multiple patterns common in scam messages, including urgency language or requests for sensitive information."
        elif combined_score > 0.3:
            explanation = "This message has some characteristics of scam messages, but isn't a definite match. Exercise caution."
        else:
            explanation = "This message seems legitimate based on our analysis."
        
        return {
            'scam_probability': combined_score,
            'is_scam': is_scam,
            'risk_level': risk_level,
            'warning_flags': warning_flags,
            'explanation': explanation
        }

def main():
    """Main execution function"""
    import os
    print("=" * 60)
    print("UPI SCAM MESSAGE DETECTOR")
    print("=" * 60)
    
    detector = ScamMessageDetector()
    
    # Train the model if it doesn't exist
    if not os.path.exists(MODEL_FILE):
        print("Training scam detection model...")
        detector.train_model()
    
    # Test with sample messages
    sample_messages = [
        "Your KYC has expired. Update immediately to avoid account suspension. Click: bit.ly/update",
        "Congratulations! You have won a ₹10,000 prize in our UPI rewards program. Contact us immediately.",
        "URGENT: Your UPI account will be blocked in 2 hours. Call our customer care at 9876543210 to resolve.",
        "Your payment of ₹500 to Amazon was successful. Ref: TX123456. Balance: ₹1200.",
        "Thank you for using UPI. Your transaction ID is TXN123456. Date: 15-Mar-2025."
    ]
    
    print("\nAnalyzing sample messages:")
    for i, message in enumerate(sample_messages):
        print(f"\nMessage {i+1}: {message}")
        
        result = detector.analyze_message(message)
        
        print(f"Scam Probability: {result['scam_probability']:.2f}")
        print(f"Risk Level: {result['risk_level']}")
        
        if result['warning_flags']:
            print("Warning Flags:")
            for flag in result['warning_flags']:
                print(f"- {flag}")
        
        print(f"Analysis: {result['explanation']}")
    
    print("\nScam Message Detector Ready!")
    print("=" * 60)

if __name__ == "__main__":
    main()