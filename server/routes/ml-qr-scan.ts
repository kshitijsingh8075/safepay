/**
 * ML-powered QR Code Scanner Routes
 * Proxies requests to the Python ML service
 */

import { Express, Request, Response } from 'express';
import fetch from 'node-fetch';

// Define the ML service URL - this will be the FastAPI service
const ML_SERVICE_URL = 'http://localhost:8000'; // Update if needed

export function registerMLQRScanRoutes(app: Express): void {
  /**
   * Predict risk for a QR code
   * POST /api/ml/qr-scan
   */
  app.post('/api/ml/qr-scan', async (req: Request, res: Response) => {
    try {
      const { qr_text } = req.body;
      
      if (!qr_text) {
        return res.status(400).json({ error: 'QR text is required' });
      }
      
      // Forward the request to the ML service
      const mlResponse = await fetch(`${ML_SERVICE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qr_text }),
      });
      
      if (!mlResponse.ok) {
        throw new Error(`ML service responded with ${mlResponse.status}: ${mlResponse.statusText}`);
      }
      
      const data = await mlResponse.json();
      res.json(data);
    } catch (error) {
      console.error('Error in ML QR scan prediction:', error);
      res.status(500).json({ 
        error: 'Failed to analyze QR code with ML service',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  /**
   * Submit feedback about a QR code
   * POST /api/ml/qr-scan/feedback
   */
  app.post('/api/ml/qr-scan/feedback', async (req: Request, res: Response) => {
    try {
      const { qr_text, is_scam } = req.body;
      
      if (!qr_text || is_scam === undefined) {
        return res.status(400).json({ error: 'QR text and is_scam flag are required' });
      }
      
      // Forward the feedback to the ML service
      const mlResponse = await fetch(`${ML_SERVICE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qr_text, is_scam }),
      });
      
      if (!mlResponse.ok) {
        throw new Error(`ML service responded with ${mlResponse.status}: ${mlResponse.statusText}`);
      }
      
      const data = await mlResponse.json();
      res.json(data);
    } catch (error) {
      console.error('Error in ML QR scan feedback:', error);
      res.status(500).json({ 
        error: 'Failed to submit QR code feedback to ML service',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  /**
   * Batch analyze multiple QR codes
   * POST /api/ml/qr-scan/batch
   */
  app.post('/api/ml/qr-scan/batch', async (req: Request, res: Response) => {
    try {
      const { requests } = req.body;
      
      if (!requests || !Array.isArray(requests)) {
        return res.status(400).json({ error: 'Requests array is required' });
      }
      
      // Forward the batch request to the ML service
      const mlResponse = await fetch(`${ML_SERVICE_URL}/batch_predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });
      
      if (!mlResponse.ok) {
        throw new Error(`ML service responded with ${mlResponse.status}: ${mlResponse.statusText}`);
      }
      
      const data = await mlResponse.json();
      res.json(data);
    } catch (error) {
      console.error('Error in ML QR scan batch prediction:', error);
      res.status(500).json({ 
        error: 'Failed to batch analyze QR codes with ML service',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  /**
   * Health check for the ML service
   * GET /api/ml/qr-scan/health
   */
  app.get('/api/ml/qr-scan/health', async (req: Request, res: Response) => {
    try {
      // Check if the ML service is up and running
      const mlResponse = await fetch(`${ML_SERVICE_URL}/`);
      
      if (!mlResponse.ok) {
        throw new Error(`ML service responded with ${mlResponse.status}: ${mlResponse.statusText}`);
      }
      
      const data = await mlResponse.json();
      res.json({ status: 'ok', ml_service: data });
    } catch (error) {
      console.error('ML service health check failed:', error);
      res.status(503).json({ 
        status: 'unavailable',
        error: 'ML service is not available',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
}