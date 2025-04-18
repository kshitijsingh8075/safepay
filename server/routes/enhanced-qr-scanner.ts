import { Router } from 'express';
import { log } from '../vite';
import axios from 'axios';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Enhanced QR analysis router
 * Connects to the FastAPI enhanced QR scanner service
 */

// Configuration
const ENHANCED_QR_SERVICE_URL = 'http://localhost:8001';
const QR_SERVICE_READY_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 1000; // 1 second

// Service process reference
let qrServiceProcess: any = null;

// Check if the QR service can be reached
async function isQRServiceRunning(): Promise<boolean> {
  try {
    const response = await axios.get(`${ENHANCED_QR_SERVICE_URL}/`, { timeout: 1000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Start the QR service and wait until it's ready
async function startQRService(): Promise<boolean> {
  return new Promise((resolve) => {
    // Check if service is already running
    isQRServiceRunning().then((running) => {
      if (running) {
        log('Enhanced QR service is already running', 'qrscan');
        resolve(true);
        return;
      }
      
      log('Starting Enhanced QR service...', 'qrscan');
      
      // Find the Python executable
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
      
      // Check if the script exists
      const scriptPath = path.join(process.cwd(), 'start_enhanced_qr_service.py');
      if (!fs.existsSync(scriptPath)) {
        log(`QR service script not found at ${scriptPath}`, 'qrscan');
        resolve(false);
        return;
      }
      
      // Start the service
      try {
        qrServiceProcess = spawn(pythonCmd, [scriptPath], {
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: true,
        });
        
        // Log output
        qrServiceProcess.stdout.on('data', (data: Buffer) => {
          log(`QR service: ${data.toString().trim()}`, 'qrscan');
        });
        
        qrServiceProcess.stderr.on('data', (data: Buffer) => {
          log(`QR service error: ${data.toString().trim()}`, 'qrscan');
        });
        
        // Handle process exit
        qrServiceProcess.on('close', (code: number) => {
          log(`QR service exited with code ${code}`, 'qrscan');
          qrServiceProcess = null;
        });
        
        // Wait for service to be ready
        let attempts = 0;
        const startTime = Date.now();
        
        const checkInterval = setInterval(async () => {
          attempts++;
          const running = await isQRServiceRunning();
          
          if (running) {
            clearInterval(checkInterval);
            log('Enhanced QR service is ready', 'qrscan');
            resolve(true);
          } else if (Date.now() - startTime > QR_SERVICE_READY_TIMEOUT) {
            clearInterval(checkInterval);
            log('Timed out waiting for Enhanced QR service to start', 'qrscan');
            resolve(false);
          } else if (attempts % 5 === 0) {
            log(`Still waiting for Enhanced QR service (${attempts} attempts)...`, 'qrscan');
          }
        }, 1000);
      } catch (error) {
        log(`Error starting QR service: ${error}`, 'qrscan');
        resolve(false);
      }
    });
  });
}

// Create the router
export function createEnhancedQRRouter() {
  const router = Router();
  
  // Check if service is available and start it if needed
  router.use(async (req, res, next) => {
    const serviceRunning = await isQRServiceRunning();
    
    if (!serviceRunning) {
      const started = await startQRService();
      if (!started) {
        log('Failed to start Enhanced QR service, falling back', 'qrscan');
        return res.status(500).json({
          error: 'QR service unavailable',
          message: 'Enhanced QR scanning service could not be started. Using fallback method.',
          fallback: true
        });
      }
    }
    
    next();
  });
  
  // Proxy API requests to the Python service
  router.post('/predict', async (req, res) => {
    try {
      const { qr_text } = req.body;
      
      if (!qr_text) {
        return res.status(400).json({
          error: 'Missing QR text',
          message: 'Please provide qr_text in the request body'
        });
      }
      
      let retries = 0;
      let result = null;
      
      // Try with retries
      while (retries < MAX_RETRIES) {
        try {
          const response = await axios.post(`${ENHANCED_QR_SERVICE_URL}/predict`, {
            qr_text: qr_text
          }, { timeout: 5000 });
          
          result = response.data;
          break;
        } catch (error) {
          retries++;
          
          if (retries >= MAX_RETRIES) {
            throw error;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
        }
      }
      
      if (!result) {
        throw new Error('Failed to get prediction after retries');
      }
      
      log(`Enhanced QR analysis: ${qr_text} → ${result.risk_score}% (${result.risk_level})`, 'qrscan');
      return res.status(200).json(result);
    } catch (error) {
      log(`Error in Enhanced QR analysis: ${error}`, 'qrscan');
      return res.status(500).json({
        error: 'Analysis failed',
        message: 'Failed to analyze QR code',
        details: error.message
      });
    }
  });
  
  // Feedback endpoint
  router.post('/feedback', async (req, res) => {
    try {
      const { qr_text, is_scam, reason } = req.body;
      
      if (!qr_text) {
        return res.status(400).json({ error: 'Missing qr_text parameter' });
      }
      
      if (is_scam === undefined) {
        return res.status(400).json({ error: 'Missing is_scam parameter' });
      }
      
      const response = await axios.post(`${ENHANCED_QR_SERVICE_URL}/feedback`, {
        qr_text,
        is_scam,
        reason
      }, { timeout: 5000 });
      
      log(`Enhanced QR feedback: ${qr_text} → ${is_scam ? 'scam' : 'safe'}`, 'qrscan');
      return res.status(200).json(response.data);
    } catch (error) {
      log(`Error processing QR feedback: ${error}`, 'qrscan');
      return res.status(500).json({ error: 'Failed to process feedback' });
    }
  });
  
  // Batch prediction
  router.post('/batch-predict', async (req, res) => {
    try {
      const { qr_texts } = req.body;
      
      if (!qr_texts || !Array.isArray(qr_texts)) {
        return res.status(400).json({ error: 'Missing or invalid qr_texts parameter' });
      }
      
      const response = await axios.post(`${ENHANCED_QR_SERVICE_URL}/batch-predict`, {
        qr_texts
      }, { timeout: 10000 });
      
      log(`Enhanced QR batch analysis: ${qr_texts.length} codes processed`, 'qrscan');
      return res.status(200).json(response.data);
    } catch (error) {
      log(`Error in batch QR analysis: ${error}`, 'qrscan');
      return res.status(500).json({ error: 'Batch analysis failed' });
    }
  });
  
  // Image analysis
  router.post('/analyze-image', async (req, res) => {
    try {
      const { image_data } = req.body;
      
      if (!image_data) {
        return res.status(400).json({ error: 'Missing image_data parameter' });
      }
      
      // Extract base64 content if it's a data URL
      const base64Data = image_data.includes('base64,')
        ? image_data.split('base64,')[1]
        : image_data;
      
      const formData = new FormData();
      
      // Convert base64 to Blob
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      const blob = new Blob(byteArrays, { type: 'image/jpeg' });
      
      formData.append('file', blob, 'image.jpg');
      
      const response = await axios.post(`${ENHANCED_QR_SERVICE_URL}/analyze-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 10000
      });
      
      log(`Enhanced QR image analysis completed`, 'qrscan');
      return res.status(200).json(response.data);
    } catch (error) {
      log(`Error in QR image analysis: ${error}`, 'qrscan');
      return res.status(500).json({ error: 'Image analysis failed' });
    }
  });
  
  // Service health check
  router.get('/status', async (req, res) => {
    const running = await isQRServiceRunning();
    return res.status(200).json({
      status: running ? 'online' : 'offline',
      service: 'Enhanced QR Scanner'
    });
  });
  
  return router;
}