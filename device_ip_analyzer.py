#!/usr/bin/env python3
"""
UPI Device & IP Analyzer
-----------------------
This script analyzes device and IP patterns in UPI transactions
to identify suspicious behavior and potential fraud.
"""

import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
from collections import defaultdict
import warnings
warnings.filterwarnings('ignore')

# File path for the dataset
DATA_FILE = 'attached_assets/anonymized_sample_fraud_txn.csv'

class DeviceIPAnalyzer:
    """Analyzes device and IP patterns in UPI transactions"""
    
    def __init__(self):
        """Initialize the device and IP analyzer"""
        self.df = None
        self.device_profiles = {}
        self.ip_profiles = {}
    
    def load_data(self):
        """Load and process the UPI transaction data"""
        print("Loading UPI transaction data...")
        self.df = pd.read_csv(DATA_FILE)
        print(f"Loaded {len(self.df)} transactions")
        
        # Convert timestamp to datetime
        self.df['TXN_TIMESTAMP'] = pd.to_datetime(self.df['TXN_TIMESTAMP'], format='%d/%m/%Y %H:%M')
        
        return self.df
    
    def build_device_profiles(self):
        """Build risk profiles for devices"""
        print("Building device profiles...")
        
        devices = self.df['DEVICE_ID'].unique()
        print(f"Analyzing {len(devices)} unique devices")
        
        for device in devices:
            device_df = self.df[self.df['DEVICE_ID'] == device]
            
            # Calculate basic statistics
            transaction_count = len(device_df)
            unique_accounts = device_df['PAYER_ACCOUNT'].nunique()
            unique_ips = device_df['IP_ADDRESS'].nunique()
            fraud_count = device_df['IS_FRAUD'].sum()
            
            # Calculate fraud ratio
            fraud_ratio = fraud_count / transaction_count if transaction_count > 0 else 0
            
            # Calculate accounts per transaction ratio
            accounts_ratio = unique_accounts / transaction_count if transaction_count > 0 else 0
            
            # Calculate time-based patterns
            time_range = None
            if transaction_count > 1:
                time_range = (device_df['TXN_TIMESTAMP'].max() - device_df['TXN_TIMESTAMP'].min()).total_seconds() / 3600  # in hours
            
            # Calculate velocity (transactions per hour)
            velocity = transaction_count / time_range if time_range and time_range > 0 else 0
            
            # Calculate risk score
            risk_factors = []
            if fraud_ratio > 0:
                risk_factors.append(fraud_ratio * 5)  # Fraud history is a strong signal
            
            if unique_accounts > 2:
                risk_factors.append(min(unique_accounts / 3, 1.0))  # Multiple accounts is suspicious
            
            if unique_ips > 2:
                risk_factors.append(min(unique_ips / 3, 1.0))  # Multiple IPs is suspicious
            
            if velocity > 5:  # More than 5 transactions per hour
                risk_factors.append(min(velocity / 10, 1.0))
            
            # Calculate overall risk score (0-10)
            risk_score = sum(risk_factors) * 2 if risk_factors else 0
            risk_score = min(risk_score, 10)  # Cap at 10
            
            # Determine risk level
            if risk_score < 3:
                risk_level = 'LOW'
            elif risk_score < 7:
                risk_level = 'MEDIUM'
            else:
                risk_level = 'HIGH'
            
            # Store device profile
            self.device_profiles[device] = {
                'transaction_count': transaction_count,
                'unique_accounts': unique_accounts,
                'unique_ips': unique_ips,
                'fraud_count': fraud_count,
                'fraud_ratio': fraud_ratio,
                'accounts_ratio': accounts_ratio,
                'velocity': velocity,
                'risk_score': risk_score,
                'risk_level': risk_level
            }
        
        return self.device_profiles
    
    def build_ip_profiles(self):
        """Build risk profiles for IP addresses"""
        print("Building IP address profiles...")
        
        ips = self.df['IP_ADDRESS'].unique()
        print(f"Analyzing {len(ips)} unique IP addresses")
        
        for ip in ips:
            ip_df = self.df[self.df['IP_ADDRESS'] == ip]
            
            # Calculate basic statistics
            transaction_count = len(ip_df)
            unique_accounts = ip_df['PAYER_ACCOUNT'].nunique()
            unique_devices = ip_df['DEVICE_ID'].nunique()
            fraud_count = ip_df['IS_FRAUD'].sum()
            
            # Calculate fraud ratio
            fraud_ratio = fraud_count / transaction_count if transaction_count > 0 else 0
            
            # Calculate accounts per IP ratio
            accounts_ratio = unique_accounts / transaction_count if transaction_count > 0 else 0
            
            # Calculate risk score
            risk_factors = []
            if fraud_ratio > 0:
                risk_factors.append(fraud_ratio * 5)  # Fraud history is a strong signal
            
            if unique_accounts > 3:
                risk_factors.append(min(unique_accounts / 4, 1.0))  # Multiple accounts is suspicious
            
            if unique_devices > 3:
                risk_factors.append(min(unique_devices / 4, 1.0))  # Multiple devices is suspicious
            
            # Calculate overall risk score (0-10)
            risk_score = sum(risk_factors) * 2 if risk_factors else 0
            risk_score = min(risk_score, 10)  # Cap at 10
            
            # Determine risk level
            if risk_score < 3:
                risk_level = 'LOW'
            elif risk_score < 7:
                risk_level = 'MEDIUM'
            else:
                risk_level = 'HIGH'
            
            # Store IP profile
            self.ip_profiles[ip] = {
                'transaction_count': transaction_count,
                'unique_accounts': unique_accounts,
                'unique_devices': unique_devices,
                'fraud_count': fraud_count,
                'fraud_ratio': fraud_ratio,
                'accounts_ratio': accounts_ratio,
                'risk_score': risk_score,
                'risk_level': risk_level
            }
        
        return self.ip_profiles
    
    def detect_device_anomalies(self):
        """Detect anomalous device behaviors"""
        print("Detecting device anomalies...")
        
        device_anomalies = []
        
        for device, profile in self.device_profiles.items():
            anomaly_reasons = []
            
            # Check for multiple accounts
            if profile['unique_accounts'] > 2:
                anomaly_reasons.append(f"Device used by {profile['unique_accounts']} different accounts")
            
            # Check for multiple IPs
            if profile['unique_ips'] > 2:
                anomaly_reasons.append(f"Device connected from {profile['unique_ips']} different IP addresses")
            
            # Check for high fraud ratio
            if profile['fraud_ratio'] > 0.1:
                anomaly_reasons.append(f"High fraud ratio: {profile['fraud_ratio']:.2f}")
            
            # Check for high velocity
            if profile['velocity'] > 5:
                anomaly_reasons.append(f"High transaction velocity: {profile['velocity']:.2f} txns/hour")
            
            # If anomalies detected, add to list
            if anomaly_reasons and profile['risk_score'] > 3:
                device_df = self.df[self.df['DEVICE_ID'] == device]
                accounts = device_df['PAYER_ACCOUNT'].unique().tolist()
                if len(accounts) > 3:
                    accounts = accounts[:3] + ['...']
                
                device_anomalies.append({
                    'device_id': device,
                    'risk_score': profile['risk_score'],
                    'risk_level': profile['risk_level'],
                    'transaction_count': profile['transaction_count'],
                    'accounts': accounts,
                    'anomaly_reasons': anomaly_reasons,
                    'fraud_ratio': profile['fraud_ratio']
                })
        
        # Sort by risk score
        device_anomalies = sorted(device_anomalies, key=lambda x: x['risk_score'], reverse=True)
        
        print(f"Detected {len(device_anomalies)} device anomalies")
        
        return device_anomalies
    
    def detect_ip_anomalies(self):
        """Detect anomalous IP behaviors"""
        print("Detecting IP address anomalies...")
        
        ip_anomalies = []
        
        for ip, profile in self.ip_profiles.items():
            anomaly_reasons = []
            
            # Check for multiple accounts
            if profile['unique_accounts'] > 3:
                anomaly_reasons.append(f"IP used by {profile['unique_accounts']} different accounts")
            
            # Check for multiple devices
            if profile['unique_devices'] > 3:
                anomaly_reasons.append(f"IP used by {profile['unique_devices']} different devices")
            
            # Check for high fraud ratio
            if profile['fraud_ratio'] > 0.1:
                anomaly_reasons.append(f"High fraud ratio: {profile['fraud_ratio']:.2f}")
            
            # If anomalies detected, add to list
            if anomaly_reasons and profile['risk_score'] > 3:
                ip_df = self.df[self.df['IP_ADDRESS'] == ip]
                accounts = ip_df['PAYER_ACCOUNT'].unique().tolist()
                if len(accounts) > 3:
                    accounts = accounts[:3] + ['...']
                
                ip_anomalies.append({
                    'ip_address': ip,
                    'risk_score': profile['risk_score'],
                    'risk_level': profile['risk_level'],
                    'transaction_count': profile['transaction_count'],
                    'accounts': accounts,
                    'anomaly_reasons': anomaly_reasons,
                    'fraud_ratio': profile['fraud_ratio']
                })
        
        # Sort by risk score
        ip_anomalies = sorted(ip_anomalies, key=lambda x: x['risk_score'], reverse=True)
        
        print(f"Detected {len(ip_anomalies)} IP address anomalies")
        
        return ip_anomalies
    
    def detect_rapid_device_switching(self):
        """Detect rapid switching between devices for the same account"""
        print("Detecting rapid device switching...")
        
        device_switching = []
        
        for account in self.df['PAYER_ACCOUNT'].unique():
            account_df = self.df[self.df['PAYER_ACCOUNT'] == account].sort_values('TXN_TIMESTAMP')
            
            if len(account_df) < 2:
                continue
            
            devices = account_df['DEVICE_ID'].values
            timestamps = account_df['TXN_TIMESTAMP'].values
            
            for i in range(1, len(devices)):
                if devices[i] != devices[i-1]:
                    time_diff = (timestamps[i] - timestamps[i-1]).total_seconds() / 3600  # hours
                    
                    if time_diff < 24:  # Less than 24 hours
                        device_switching.append({
                            'account': account,
                            'timestamp': timestamps[i],
                            'previous_device': devices[i-1],
                            'new_device': devices[i],
                            'hours_since_last_txn': time_diff,
                            'is_fraud': account_df.iloc[i]['IS_FRAUD']
                        })
        
        print(f"Detected {len(device_switching)} instances of rapid device switching")
        
        return device_switching
    
    def generate_device_risk_report(self):
        """Generate a comprehensive device risk report"""
        print("Generating device risk report...")
        
        # Count devices by risk level
        risk_counts = {
            'LOW': 0,
            'MEDIUM': 0,
            'HIGH': 0
        }
        
        for profile in self.device_profiles.values():
            risk_counts[profile['risk_level']] += 1
        
        # Get high-risk devices
        high_risk_devices = {
            device: profile for device, profile in self.device_profiles.items()
            if profile['risk_level'] == 'HIGH'
        }
        
        # Sort by risk score
        high_risk_devices = dict(sorted(
            high_risk_devices.items(),
            key=lambda item: item[1]['risk_score'],
            reverse=True
        ))
        
        # Create risk score distribution plot
        risk_scores = [profile['risk_score'] for profile in self.device_profiles.values()]
        
        plt.figure(figsize=(10, 6))
        plt.hist(risk_scores, bins=20, color='skyblue', edgecolor='black')
        plt.title('Device Risk Score Distribution', fontsize=14)
        plt.xlabel('Risk Score (0-10)', fontsize=12)
        plt.ylabel('Number of Devices', fontsize=12)
        plt.grid(True, alpha=0.3)
        plt.savefig('device_risk_distribution.png')
        
        # Create report
        report = {
            'total_devices': len(self.device_profiles),
            'risk_level_counts': risk_counts,
            'high_risk_devices': high_risk_devices,
            'risk_distribution_plot': 'device_risk_distribution.png'
        }
        
        return report
    
    def generate_ip_risk_report(self):
        """Generate a comprehensive IP risk report"""
        print("Generating IP address risk report...")
        
        # Count IPs by risk level
        risk_counts = {
            'LOW': 0,
            'MEDIUM': 0,
            'HIGH': 0
        }
        
        for profile in self.ip_profiles.values():
            risk_counts[profile['risk_level']] += 1
        
        # Get high-risk IPs
        high_risk_ips = {
            ip: profile for ip, profile in self.ip_profiles.items()
            if profile['risk_level'] == 'HIGH'
        }
        
        # Sort by risk score
        high_risk_ips = dict(sorted(
            high_risk_ips.items(),
            key=lambda item: item[1]['risk_score'],
            reverse=True
        ))
        
        # Create risk score distribution plot
        risk_scores = [profile['risk_score'] for profile in self.ip_profiles.values()]
        
        plt.figure(figsize=(10, 6))
        plt.hist(risk_scores, bins=20, color='salmon', edgecolor='black')
        plt.title('IP Address Risk Score Distribution', fontsize=14)
        plt.xlabel('Risk Score (0-10)', fontsize=12)
        plt.ylabel('Number of IP Addresses', fontsize=12)
        plt.grid(True, alpha=0.3)
        plt.savefig('ip_risk_distribution.png')
        
        # Create report
        report = {
            'total_ips': len(self.ip_profiles),
            'risk_level_counts': risk_counts,
            'high_risk_ips': high_risk_ips,
            'risk_distribution_plot': 'ip_risk_distribution.png'
        }
        
        return report
    
    def analyze_login_patterns(self):
        """Analyze login patterns based on device and IP combinations"""
        print("Analyzing login patterns...")
        
        # Group by account and analyze patterns
        login_patterns = defaultdict(list)
        
        for account in self.df['PAYER_ACCOUNT'].unique():
            account_df = self.df[self.df['PAYER_ACCOUNT'] == account].sort_values('TXN_TIMESTAMP')
            
            # Get device-IP combinations
            for _, row in account_df.iterrows():
                login_patterns[account].append({
                    'timestamp': row['TXN_TIMESTAMP'],
                    'device_id': row['DEVICE_ID'],
                    'ip_address': row['IP_ADDRESS']
                })
        
        # Detect suspicious patterns
        suspicious_logins = []
        
        for account, logins in login_patterns.items():
            if len(logins) < 2:
                continue
            
            # Get unique device-IP pairs
            device_ip_pairs = set((login['device_id'], login['ip_address']) for login in logins)
            
            # If more than 3 unique combinations, flag as suspicious
            if len(device_ip_pairs) > 3:
                suspicious_logins.append({
                    'account': account,
                    'unique_combinations': len(device_ip_pairs),
                    'first_login': logins[0]['timestamp'],
                    'last_login': logins[-1]['timestamp'],
                    'combinations': list(device_ip_pairs)[:5]  # Show up to 5 combinations
                })
        
        print(f"Detected {len(suspicious_logins)} accounts with suspicious login patterns")
        
        return suspicious_logins

def main():
    """Main execution function"""
    print("=" * 60)
    print("UPI DEVICE & IP ANALYZER")
    print("=" * 60)
    
    analyzer = DeviceIPAnalyzer()
    
    # Load data
    analyzer.load_data()
    
    # Build device and IP profiles
    analyzer.build_device_profiles()
    analyzer.build_ip_profiles()
    
    # Detect device anomalies
    device_anomalies = analyzer.detect_device_anomalies()
    
    print("\nTop 5 Device Anomalies:")
    for i, anomaly in enumerate(device_anomalies[:5]):
        print(f"\nDevice {i+1}: {anomaly['device_id']}")
        print(f"Risk Score: {anomaly['risk_score']:.2f}/10 ({anomaly['risk_level']})")
        print(f"Transactions: {anomaly['transaction_count']}")
        print(f"Accounts: {', '.join(str(acc) for acc in anomaly['accounts'][:3])}")
        print(f"Fraud Ratio: {anomaly['fraud_ratio']:.2f}")
        print(f"Reasons: {'; '.join(anomaly['anomaly_reasons'])}")
    
    # Detect IP anomalies
    ip_anomalies = analyzer.detect_ip_anomalies()
    
    print("\nTop 5 IP Address Anomalies:")
    for i, anomaly in enumerate(ip_anomalies[:5]):
        print(f"\nIP {i+1}: {anomaly['ip_address']}")
        print(f"Risk Score: {anomaly['risk_score']:.2f}/10 ({anomaly['risk_level']})")
        print(f"Transactions: {anomaly['transaction_count']}")
        print(f"Accounts: {', '.join(str(acc) for acc in anomaly['accounts'][:3])}")
        print(f"Fraud Ratio: {anomaly['fraud_ratio']:.2f}")
        print(f"Reasons: {'; '.join(anomaly['anomaly_reasons'])}")
    
    # Detect rapid device switching
    device_switching = analyzer.detect_rapid_device_switching()
    
    print(f"\nRapid Device Switching:")
    print(f"Total incidents: {len(device_switching)}")
    fraud_switching = [s for s in device_switching if s['is_fraud'] == 1]
    print(f"Fraudulent incidents: {len(fraud_switching)}")
    if fraud_switching:
        fraud_ratio = len(fraud_switching) / len(device_switching)
        print(f"Fraud ratio in device switching: {fraud_ratio:.2f}")
    
    # Generate device risk report
    device_report = analyzer.generate_device_risk_report()
    
    print("\nDevice Risk Summary:")
    print(f"Total devices: {device_report['total_devices']}")
    print(f"Risk levels: Low: {device_report['risk_level_counts']['LOW']}, "
          f"Medium: {device_report['risk_level_counts']['MEDIUM']}, "
          f"High: {device_report['risk_level_counts']['HIGH']}")
    
    # Generate IP risk report
    ip_report = analyzer.generate_ip_risk_report()
    
    print("\nIP Address Risk Summary:")
    print(f"Total IP addresses: {ip_report['total_ips']}")
    print(f"Risk levels: Low: {ip_report['risk_level_counts']['LOW']}, "
          f"Medium: {ip_report['risk_level_counts']['MEDIUM']}, "
          f"High: {ip_report['risk_level_counts']['HIGH']}")
    
    # Analyze login patterns
    suspicious_logins = analyzer.analyze_login_patterns()
    
    print(f"\nSuspicious Login Patterns: {len(suspicious_logins)} accounts")
    if suspicious_logins:
        for i, login in enumerate(suspicious_logins[:3]):
            print(f"\nAccount {i+1}: {login['account'][:10]}...")
            print(f"Unique device-IP combinations: {login['unique_combinations']}")
            print(f"Period: {login['first_login']} to {login['last_login']}")
    
    print("\nDevice & IP Analysis Complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()