#!/usr/bin/env python3
"""
UPI User Behavior Analyzer
-------------------------
This script analyzes user transaction history to establish normal patterns
and detect suspicious deviations in behavior that might indicate fraud.
"""

import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
import warnings
warnings.filterwarnings('ignore')

# File path for the dataset
DATA_FILE = 'attached_assets/anonymized_sample_fraud_txn.csv'

class UserBehaviorAnalyzer:
    """Analyzes user transaction behavior for fraud detection"""
    
    def __init__(self):
        """Initialize the user behavior analyzer"""
        self.df = None
        self.user_profiles = {}
    
    def load_data(self):
        """Load and process the UPI transaction data"""
        print("Loading UPI transaction data...")
        self.df = pd.read_csv(DATA_FILE)
        print(f"Loaded {len(self.df)} transactions")
        
        # Convert timestamp to datetime
        self.df['TXN_TIMESTAMP'] = pd.to_datetime(self.df['TXN_TIMESTAMP'], format='%d/%m/%Y %H:%M')
        
        # Extract temporal features
        self.df['TXN_HOUR'] = self.df['TXN_TIMESTAMP'].dt.hour
        self.df['TXN_DAY'] = self.df['TXN_TIMESTAMP'].dt.day
        self.df['TXN_WEEKDAY'] = self.df['TXN_TIMESTAMP'].dt.dayofweek
        
        return self.df
    
    def build_user_profiles(self):
        """Build profiles for each user based on their transaction history"""
        print("Building user transaction profiles...")
        
        user_accounts = self.df['PAYER_ACCOUNT'].unique()
        print(f"Analyzing {len(user_accounts)} user accounts")
        
        for account in user_accounts:
            user_df = self.df[self.df['PAYER_ACCOUNT'] == account]
            
            if len(user_df) < 2:
                continue  # Skip users with too few transactions
            
            # Calculate basic statistics
            amount_stats = {
                'mean': user_df['AMOUNT'].mean(),
                'median': user_df['AMOUNT'].median(),
                'min': user_df['AMOUNT'].min(),
                'max': user_df['AMOUNT'].max(),
                'std': user_df['AMOUNT'].std()
            }
            
            # Time patterns
            hour_counts = user_df['TXN_HOUR'].value_counts()
            common_hours = hour_counts.nlargest(3).index.tolist()
            
            weekday_counts = user_df['TXN_WEEKDAY'].value_counts()
            common_weekdays = weekday_counts.nlargest(3).index.tolist()
            
            # Transaction frequency
            date_range = (user_df['TXN_TIMESTAMP'].max() - user_df['TXN_TIMESTAMP'].min()).days
            if date_range < 1:
                date_range = 1  # Avoid division by zero
            
            frequency = len(user_df) / date_range  # transactions per day
            
            # Common recipients
            top_recipients = user_df['BENEFICIARY_ACCOUNT'].value_counts().nlargest(3).index.tolist()
            
            # Fraud history
            fraud_ratio = user_df['IS_FRAUD'].mean()
            
            # Store user profile
            self.user_profiles[account] = {
                'amount_stats': amount_stats,
                'common_hours': common_hours,
                'common_weekdays': common_weekdays,
                'transaction_frequency': frequency,
                'top_recipients': top_recipients,
                'fraud_ratio': fraud_ratio,
                'transaction_count': len(user_df)
            }
        
        return self.user_profiles
    
    def detect_anomalies(self):
        """Detect anomalous transactions based on user profiles"""
        print("Detecting transaction anomalies...")
        
        anomalies = []
        
        for account, profile in self.user_profiles.items():
            user_df = self.df[self.df['PAYER_ACCOUNT'] == account]
            
            for index, row in user_df.iterrows():
                anomaly_score = 0
                anomaly_reasons = []
                
                # Check amount anomaly (using Z-score)
                if profile['amount_stats']['std'] > 0:
                    z_score = (row['AMOUNT'] - profile['amount_stats']['mean']) / profile['amount_stats']['std']
                    if abs(z_score) > 2.5:
                        anomaly_score += abs(z_score) / 5  # Normalize
                        anomaly_reasons.append(f"Unusual amount (z-score: {z_score:.2f})")
                
                # Check time anomaly
                if row['TXN_HOUR'] not in profile['common_hours']:
                    anomaly_score += 0.5
                    anomaly_reasons.append(f"Unusual hour: {row['TXN_HOUR']}")
                
                if row['TXN_WEEKDAY'] not in profile['common_weekdays']:
                    anomaly_score += 0.3
                    anomaly_reasons.append(f"Unusual day of week: {row['TXN_WEEKDAY']}")
                
                # Check recipient anomaly
                if row['BENEFICIARY_ACCOUNT'] not in profile['top_recipients']:
                    anomaly_score += 0.4
                    anomaly_reasons.append("Unusual recipient")
                
                # If sufficiently anomalous, add to anomalies list
                if anomaly_score > 1.0:
                    anomalies.append({
                        'account': account,
                        'transaction_id': row['TRANSACTION_ID'],
                        'timestamp': row['TXN_TIMESTAMP'],
                        'amount': row['AMOUNT'],
                        'anomaly_score': anomaly_score,
                        'reasons': anomaly_reasons,
                        'is_fraud': row['IS_FRAUD']
                    })
        
        print(f"Detected {len(anomalies)} anomalous transactions")
        
        # Convert to DataFrame for easier analysis
        anomalies_df = pd.DataFrame(anomalies)
        
        return anomalies_df
    
    def segment_users(self, n_clusters=4):
        """Segment users based on their transaction behavior"""
        print(f"Segmenting users into {n_clusters} groups...")
        
        # Create feature vectors for each user
        feature_data = []
        accounts = []
        
        for account, profile in self.user_profiles.items():
            accounts.append(account)
            feature_data.append([
                profile['transaction_count'],
                profile['amount_stats']['mean'],
                profile['amount_stats']['std'],
                profile['transaction_frequency'],
                profile['fraud_ratio']
            ])
        
        # Convert to numpy array
        X = np.array(feature_data)
        
        # Standardize features
        from sklearn.preprocessing import StandardScaler
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Apply KMeans clustering
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        clusters = kmeans.fit_predict(X_scaled)
        
        # Create user segment DataFrame
        segments_df = pd.DataFrame({
            'account': accounts,
            'segment': clusters,
            'transaction_count': [self.user_profiles[acc]['transaction_count'] for acc in accounts],
            'avg_amount': [self.user_profiles[acc]['amount_stats']['mean'] for acc in accounts],
            'fraud_ratio': [self.user_profiles[acc]['fraud_ratio'] for acc in accounts]
        })
        
        print("User segmentation complete")
        
        return segments_df, kmeans, scaler
    
    def analyze_transaction_history(self, account_id):
        """Analyze the transaction history for a specific account"""
        if account_id not in self.user_profiles:
            print(f"Account {account_id} not found in profiles")
            return None
        
        print(f"Analyzing transaction history for account: {account_id}")
        
        user_df = self.df[self.df['PAYER_ACCOUNT'] == account_id].sort_values('TXN_TIMESTAMP')
        profile = self.user_profiles[account_id]
        
        # Transaction amounts over time
        plt.figure(figsize=(12, 8))
        
        # Plot 1: Transaction amounts
        plt.subplot(2, 2, 1)
        plt.plot(user_df['TXN_TIMESTAMP'], user_df['AMOUNT'], 'o-', markersize=6)
        plt.title(f'Transaction Amounts Over Time', fontsize=12)
        plt.ylabel('Amount (₹)', fontsize=10)
        plt.xticks(rotation=45, fontsize=8)
        plt.grid(True, alpha=0.3)
        
        # Plot 2: Hour distribution
        plt.subplot(2, 2, 2)
        hour_counts = user_df['TXN_HOUR'].value_counts().sort_index()
        plt.bar(hour_counts.index, hour_counts.values, color='skyblue')
        plt.title('Transactions by Hour of Day', fontsize=12)
        plt.xlabel('Hour', fontsize=10)
        plt.ylabel('Count', fontsize=10)
        plt.xticks(range(0, 24, 2), fontsize=8)
        plt.grid(True, alpha=0.3, axis='y')
        
        # Plot 3: Weekday distribution
        plt.subplot(2, 2, 3)
        weekday_counts = user_df['TXN_WEEKDAY'].value_counts().sort_index()
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        plt.bar(weekday_counts.index, weekday_counts.values, color='lightgreen')
        plt.title('Transactions by Day of Week', fontsize=12)
        plt.xlabel('Day', fontsize=10)
        plt.ylabel('Count', fontsize=10)
        plt.xticks(range(7), days, fontsize=8)
        plt.grid(True, alpha=0.3, axis='y')
        
        # Plot 4: Top recipients
        plt.subplot(2, 2, 4)
        recipient_counts = user_df['BENEFICIARY_ACCOUNT'].value_counts().nlargest(5)
        plt.barh(range(len(recipient_counts)), recipient_counts.values, color='salmon')
        plt.title('Top Recipients', fontsize=12)
        plt.xlabel('Number of Transactions', fontsize=10)
        plt.yticks(range(len(recipient_counts)), [acct[:8] + '...' for acct in recipient_counts.index], fontsize=8)
        plt.grid(True, alpha=0.3, axis='x')
        
        plt.tight_layout()
        plt.savefig(f'user_analysis_{account_id[:8]}.png')
        
        # Print summary statistics
        print("\nUser Profile Summary:")
        print(f"Transaction Count: {profile['transaction_count']}")
        print(f"Amount Statistics: Mean: ₹{profile['amount_stats']['mean']:.2f}, "
              f"Median: ₹{profile['amount_stats']['median']:.2f}, "
              f"Max: ₹{profile['amount_stats']['max']:.2f}")
        print(f"Transaction Frequency: {profile['transaction_frequency']:.2f} per day")
        print(f"Common Hours: {profile['common_hours']}")
        print(f"Common Weekdays: {[days[day] for day in profile['common_weekdays']]}")
        print(f"Fraud Ratio: {profile['fraud_ratio']:.4f}")
        
        return user_df, profile
    
    def detect_sudden_spikes(self, threshold_factor=2.0):
        """Detect users with sudden spikes in transaction amount or frequency"""
        print("Detecting sudden transaction spikes...")
        
        spikes = []
        
        for account, profile in self.user_profiles.items():
            if profile['transaction_count'] < 3:
                continue  # Skip users with too few transactions
            
            user_df = self.df[self.df['PAYER_ACCOUNT'] == account].sort_values('TXN_TIMESTAMP')
            
            # Check for amount spikes
            rolling_mean = user_df['AMOUNT'].rolling(window=3, min_periods=1).mean()
            for i in range(1, len(rolling_mean)):
                if (user_df['AMOUNT'].iloc[i] > rolling_mean.iloc[i-1] * threshold_factor and
                    user_df['AMOUNT'].iloc[i] > profile['amount_stats']['mean'] * threshold_factor):
                    spikes.append({
                        'account': account,
                        'transaction_id': user_df['TRANSACTION_ID'].iloc[i],
                        'timestamp': user_df['TXN_TIMESTAMP'].iloc[i],
                        'amount': user_df['AMOUNT'].iloc[i],
                        'normal_amount': rolling_mean.iloc[i-1],
                        'spike_type': 'amount',
                        'spike_factor': user_df['AMOUNT'].iloc[i] / rolling_mean.iloc[i-1],
                        'is_fraud': user_df['IS_FRAUD'].iloc[i]
                    })
            
            # Check for frequency spikes (multiple transactions in short time)
            if len(user_df) >= 3:
                for i in range(len(user_df) - 2):
                    time1 = user_df['TXN_TIMESTAMP'].iloc[i]
                    time3 = user_df['TXN_TIMESTAMP'].iloc[i+2]
                    
                    # If 3 transactions within 1 hour
                    if (time3 - time1) < pd.Timedelta(hours=1):
                        # Only add if not already added from consecutive triples
                        if i == 0 or (user_df['TXN_TIMESTAMP'].iloc[i-1] - time1) >= pd.Timedelta(hours=1):
                            spikes.append({
                                'account': account,
                                'transaction_id': user_df['TRANSACTION_ID'].iloc[i],
                                'timestamp': user_df['TXN_TIMESTAMP'].iloc[i],
                                'amount': user_df['AMOUNT'].iloc[i:i+3].sum(),
                                'normal_amount': profile['amount_stats']['mean'],
                                'spike_type': 'frequency',
                                'spike_factor': 3,  # 3 transactions in short time
                                'is_fraud': user_df['IS_FRAUD'].iloc[i:i+3].any()
                            })
        
        print(f"Detected {len(spikes)} transaction spikes")
        
        # Convert to DataFrame for easier analysis
        spikes_df = pd.DataFrame(spikes)
        
        return spikes_df

def main():
    """Main execution function"""
    print("=" * 60)
    print("UPI USER BEHAVIOR ANALYZER")
    print("=" * 60)
    
    analyzer = UserBehaviorAnalyzer()
    
    # Load data
    analyzer.load_data()
    
    # Build user profiles
    analyzer.build_user_profiles()
    
    # Detect anomalies
    anomalies = analyzer.detect_anomalies()
    
    if not anomalies.empty:
        print("\nTop 5 Anomalies:")
        top_anomalies = anomalies.sort_values('anomaly_score', ascending=False).head(5)
        
        for i, row in top_anomalies.iterrows():
            print(f"\nAccount: {row['account'][:8]}...")
            print(f"Transaction: {row['transaction_id']}")
            print(f"Timestamp: {row['timestamp']}")
            print(f"Amount: ₹{row['amount']}")
            print(f"Anomaly Score: {row['anomaly_score']:.2f}")
            print(f"Reasons: {', '.join(row['reasons'])}")
            print(f"Is Fraud: {row['is_fraud']}")
    
    # Segment users
    segments, _, _ = analyzer.segment_users()
    
    print("\nUser Segments Summary:")
    for segment in segments['segment'].unique():
        segment_df = segments[segments['segment'] == segment]
        print(f"\nSegment {segment}:")
        print(f"  Users: {len(segment_df)}")
        print(f"  Avg Transactions: {segment_df['transaction_count'].mean():.2f}")
        print(f"  Avg Amount: ₹{segment_df['avg_amount'].mean():.2f}")
        print(f"  Fraud Ratio: {segment_df['fraud_ratio'].mean():.4f}")
    
    # Detect sudden spikes
    spikes = analyzer.detect_sudden_spikes()
    
    if not spikes.empty:
        print("\nTransaction Spikes Summary:")
        print(f"Amount Spikes: {len(spikes[spikes['spike_type'] == 'amount'])}")
        print(f"Frequency Spikes: {len(spikes[spikes['spike_type'] == 'frequency'])}")
        
        amount_spike_fraud = spikes[(spikes['spike_type'] == 'amount') & (spikes['is_fraud'] == 1)]
        freq_spike_fraud = spikes[(spikes['spike_type'] == 'frequency') & (spikes['is_fraud'] == 1)]
        
        print(f"Amount Spikes Fraud Ratio: {len(amount_spike_fraud) / max(1, len(spikes[spikes['spike_type'] == 'amount'])):.4f}")
        print(f"Frequency Spikes Fraud Ratio: {len(freq_spike_fraud) / max(1, len(spikes[spikes['spike_type'] == 'frequency'])):.4f}")
    
    # Analyze a sample user
    sample_account = list(analyzer.user_profiles.keys())[0]
    analyzer.analyze_transaction_history(sample_account)
    
    print("\nUser Behavior Analysis Complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()