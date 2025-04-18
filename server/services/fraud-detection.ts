/**
 * UPI Fraud Detection Service
 * 
 * This service integrates with the Python-based fraud detection system
 * to provide transaction risk scoring and fraud analysis.
 */

import { spawn } from 'child_process';
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

// Path to the Python scripts
const PYTHON_SCRIPTS_DIR = path.join(process.cwd());

/**
 * Run a Python script and return the result
 */
async function runPythonScript(scriptPath: string, args: string[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    // Check if the script exists
    if (!fs.existsSync(scriptPath)) {
      return reject(new Error(`Python script not found: ${scriptPath}`));
    }

    // Use 'python3' command on Unix-like systems, 'python' on Windows
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    console.log(`Running Python script: ${pythonCommand} ${scriptPath} ${args.join(' ')}`);
    
    const pythonProcess = spawn(pythonCommand, [scriptPath, ...args]);
    
    let outputData = '';
    let errorData = '';
    
    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error(`Python Error: ${data.toString()}`);
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        console.error(`Error output: ${errorData}`);
        return reject(new Error(`Python script exited with code ${code}: ${errorData}`));
      }
      
      try {
        // Try to parse as JSON
        const jsonData = JSON.parse(outputData);
        resolve(jsonData);
      } catch (err) {
        // Return as plain text if not JSON
        resolve(outputData);
      }
    });
    
    pythonProcess.on('error', (err) => {
      console.error('Failed to start Python process', err);
      reject(err);
    });
  });
}

/**
 * Check a UPI ID for fraud risk
 */
export async function checkUpiRisk(req: Request, res: Response): Promise<void> {
  try {
    const { upi_id, amount, device_id, ip_address, message } = req.body;
    
    if (!upi_id) {
      res.status(400).json({ 
        status: 'error', 
        message: 'UPI ID is required',
        risk_score: 5.0,
        risk_level: 'MEDIUM'
      });
      return;
    }
    
    // Save input to a temporary JSON file
    const inputFile = path.join(PYTHON_SCRIPTS_DIR, 'upi_check_input.json');
    fs.writeFileSync(inputFile, JSON.stringify({
      upi_id,
      amount: amount || null,
      device_id: device_id || null,
      ip_address: ip_address || null,
      message: message || null
    }));
    
    // Define the script path
    const scriptPath = path.join(PYTHON_SCRIPTS_DIR, 'api_integration.py');
    
    // Call Python script with the input file
    const result = await runPythonScript(scriptPath, ['--check-upi', inputFile]);
    
    // Clean up temporary file
    fs.unlinkSync(inputFile);
    
    // Return the result
    res.json(result);
  } catch (error) {
    console.error('Error checking UPI risk:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Internal server error',
      risk_score: 5.0, // Default medium risk on error
      risk_level: 'MEDIUM'
    });
  }
}

/**
 * Analyze a message for scam indicators
 */
export async function analyzeMessage(req: Request, res: Response): Promise<void> {
  try {
    const { message } = req.body;
    
    if (!message) {
      res.status(400).json({ 
        status: 'error', 
        message: 'Message text is required' 
      });
      return;
    }
    
    // Save input to a temporary JSON file
    const inputFile = path.join(PYTHON_SCRIPTS_DIR, 'message_input.json');
    fs.writeFileSync(inputFile, JSON.stringify({ message }));
    
    // Define the script path
    const scriptPath = path.join(PYTHON_SCRIPTS_DIR, 'api_integration.py');
    
    // Call Python script with the input file
    const result = await runPythonScript(scriptPath, ['--analyze-message', inputFile]);
    
    // Clean up temporary file
    fs.unlinkSync(inputFile);
    
    // Return the result
    res.json(result);
  } catch (error) {
    console.error('Error analyzing message:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Internal server error' 
    });
  }
}

/**
 * Score a transaction for fraud risk
 */
export async function scoreTransaction(req: Request, res: Response): Promise<void> {
  try {
    const { 
      amount, payer_vpa, beneficiary_vpa, device_id, 
      ip_address, txn_timestamp, trn_status, 
      initiation_mode, transaction_type 
    } = req.body;
    
    if (!amount || !payer_vpa || !beneficiary_vpa) {
      res.status(400).json({ 
        status: 'error', 
        message: 'Amount, payer VPA, and beneficiary VPA are required' 
      });
      return;
    }
    
    // Save input to a temporary JSON file
    const inputFile = path.join(PYTHON_SCRIPTS_DIR, 'transaction_input.json');
    fs.writeFileSync(inputFile, JSON.stringify({
      amount,
      payer_vpa,
      beneficiary_vpa,
      device_id: device_id || null,
      ip_address: ip_address || null,
      txn_timestamp: txn_timestamp || null,
      trn_status: trn_status || 'COMPLETED',
      initiation_mode: initiation_mode || 'Default',
      transaction_type: transaction_type || 'P2P'
    }));
    
    // Define the script path
    const scriptPath = path.join(PYTHON_SCRIPTS_DIR, 'api_integration.py');
    
    // Call Python script with the input file
    const result = await runPythonScript(scriptPath, ['--score-transaction', inputFile]);
    
    // Clean up temporary file
    fs.unlinkSync(inputFile);
    
    // Return the result
    res.json(result);
  } catch (error) {
    console.error('Error scoring transaction:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Internal server error' 
    });
  }
}

/**
 * Run the fraud detection system analysis
 */
export async function runFraudAnalysis(req: Request, res: Response): Promise<void> {
  try {
    // Define the script path
    const scriptPath = path.join(PYTHON_SCRIPTS_DIR, 'run_all_analysis.py');
    
    // Call Python script
    const result = await runPythonScript(scriptPath);
    
    // Return the result
    res.json({
      status: 'success',
      message: 'Fraud analysis completed successfully',
      result
    });
  } catch (error) {
    console.error('Error running fraud analysis:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Internal server error' 
    });
  }
}

/**
 * Health check for the fraud detection system
 */
export async function fraudDetectionHealth(req: Request, res: Response): Promise<void> {
  try {
    // Check if all required Python scripts exist
    const requiredScripts = [
      'api_integration.py',
      'upi_fraud_detection.py',
      'fraud_heatmap_visualization.py',
      'transaction_risk_scoring.py',
      'scam_message_detector.py',
      'user_behavior_analyzer.py',
      'device_ip_analyzer.py',
      'run_all_analysis.py'
    ];
    
    const missingScripts = requiredScripts.filter(script => {
      return !fs.existsSync(path.join(PYTHON_SCRIPTS_DIR, script));
    });
    
    if (missingScripts.length > 0) {
      res.status(200).json({
        status: 'warning',
        message: 'Some fraud detection scripts are missing',
        missing_scripts: missingScripts
      });
      return;
    }
    
    // Define the script path for health check
    const scriptPath = path.join(PYTHON_SCRIPTS_DIR, 'api_integration.py');
    
    // Call Python script with health check flag
    const result = await runPythonScript(scriptPath, ['--health-check']);
    
    // Return the result
    res.json({
      status: 'success',
      message: 'Fraud detection system is healthy',
      details: result
    });
  } catch (error) {
    console.error('Error checking fraud detection health:', error);
    res.status(200).json({ 
      status: 'error', 
      message: 'Fraud detection system is not available',
      error: error.message || 'Unknown error'
    });
  }
}