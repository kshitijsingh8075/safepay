#!/usr/bin/env python3
"""
UPI Fraud Analysis Master Script
-------------------------------
This script runs all the UPI fraud analysis modules in sequence 
and generates a comprehensive report.
"""

import os
import sys
import argparse
from datetime import datetime
import matplotlib.pyplot as plt
import pandas as pd
import warnings
warnings.filterwarnings('ignore')

def run_module(module_name, module_function):
    """Run a specific analysis module and capture the output"""
    print(f"\n{'=' * 80}")
    print(f"RUNNING {module_name.upper()}")
    print(f"{'=' * 80}")
    
    try:
        start_time = datetime.now()
        result = module_function()
        end_time = datetime.now()
        
        duration = (end_time - start_time).total_seconds()
        
        print(f"\n{module_name} completed successfully in {duration:.2f} seconds")
        return result
    except Exception as e:
        print(f"Error running {module_name}: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Main execution function"""
    parser = argparse.ArgumentParser(description='UPI Fraud Analysis System')
    parser.add_argument('--verbose', action='store_true', help='Enable verbose output')
    parser.add_argument('--modules', nargs='+', help='Specific modules to run')
    args = parser.parse_args()
    
    print("\n" + "=" * 60)
    print(" UPI FRAUD DETECTION AND ANALYSIS SYSTEM ")
    print("=" * 60)
    print(f"Starting analysis at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Import all modules
    try:
        from upi_fraud_detection import main as fraud_detection_main
        from fraud_heatmap_visualization import main as heatmap_main
        from transaction_risk_scoring import main as risk_scoring_main
        from scam_message_detector import main as scam_detector_main
        from user_behavior_analyzer import main as user_behavior_main
        from device_ip_analyzer import main as device_ip_main
    except ImportError as e:
        print(f"Error importing modules: {str(e)}")
        print("Make sure all required modules are available.")
        sys.exit(1)
    
    # Define available modules
    modules = {
        'fraud_detection': fraud_detection_main,
        'heatmap_visualization': heatmap_main,
        'risk_scoring': risk_scoring_main,
        'scam_message_detector': scam_detector_main,
        'user_behavior': user_behavior_main,
        'device_ip_analysis': device_ip_main
    }
    
    # Determine which modules to run
    modules_to_run = {}
    if args.modules:
        for module in args.modules:
            if module in modules:
                modules_to_run[module] = modules[module]
            else:
                print(f"Warning: Unknown module '{module}'")
    else:
        modules_to_run = modules
    
    # Run all selected modules
    results = {}
    for module_name, module_func in modules_to_run.items():
        results[module_name] = run_module(module_name, module_func)
    
    # Generate a summary report
    print("\n" + "=" * 60)
    print(" UPI FRAUD ANALYSIS SUMMARY ")
    print("=" * 60)
    
    print(f"\nAnalysis completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Modules executed: {len(results)}")
    
    success_count = sum(1 for result in results.values() if result is not None)
    print(f"Successful modules: {success_count}")
    
    if success_count < len(results):
        print(f"Failed modules: {len(results) - success_count}")
        for module_name, result in results.items():
            if result is None:
                print(f"  - {module_name}")
    
    print("\nGenerated output files:")
    output_files = []
    for filename in os.listdir('.'):
        if filename.endswith(('.png', '.html', '.csv', '.joblib')):
            output_files.append(filename)
            print(f"  - {filename}")
    
    print("\nAnalysis complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()