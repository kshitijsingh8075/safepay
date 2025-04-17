/**
 * ML-powered QR Code Scanner Routes
 * Proxies requests to the Python ML service
 */

import { Express, Request, Response } from 'express';

// ML service URL
const ML_SERVICE_URL = 'http://localhost:8000';

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
      const response = await fetch(`${ML_SERVICE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qr_text }),
      });
      
      if (!response.ok) {
        console.error(`ML service error: ${response.status} ${response.statusText}`);
        return res.status(response.status).json({ 
          error: 'ML service error',
          status: response.status,
          message: response.statusText
        });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error proxying ML QR scan request:', error);
      res.status(500).json({ error: 'Internal server error processing QR code' });
    }
  });

  /**
   * Submit feedback about a QR code
   * POST /api/ml/qr-scan/feedback
   */
  app.post('/api/ml/qr-scan/feedback', async (req: Request, res: Response) => {
    try {
      const { qr_text, is_scam } = req.body;
      
      if (!qr_text || typeof is_scam !== 'boolean') {
        return res.status(400).json({ error: 'QR text and is_scam boolean are required' });
      }
      
      // Forward the feedback to the ML service
      const response = await fetch(`${ML_SERVICE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qr_text, is_scam }),
      });
      
      if (!response.ok) {
        console.error(`ML service feedback error: ${response.status} ${response.statusText}`);
        return res.status(response.status).json({ 
          error: 'ML service error',
          message: response.statusText
        });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error submitting QR scan feedback:', error);
      res.status(500).json({ error: 'Internal server error processing feedback' });
    }
  });

  /**
   * Batch analyze multiple QR codes
   * POST /api/ml/qr-scan/batch
   */
  app.post('/api/ml/qr-scan/batch', async (req: Request, res: Response) => {
    try {
      const { qr_texts } = req.body;
      
      if (!Array.isArray(qr_texts) || qr_texts.length === 0) {
        return res.status(400).json({ error: 'Array of QR texts is required' });
      }
      
      // Forward the batch request to the ML service
      const response = await fetch(`${ML_SERVICE_URL}/batch-predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qr_texts }),
      });
      
      if (!response.ok) {
        console.error(`ML service batch error: ${response.status} ${response.statusText}`);
        return res.status(response.status).json({ 
          error: 'ML service error',
          message: response.statusText
        });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error processing batch QR scan:', error);
      res.status(500).json({ error: 'Internal server error processing batch' });
    }
  });

  /**
   * Health check for the ML service
   * GET /api/ml/qr-scan/health
   */
  app.get('/api/ml/qr-scan/health', async (req: Request, res: Response) => {
    try {
      // Check if the ML service is running
      const response = await fetch(`${ML_SERVICE_URL}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error(`ML service health check failed: ${response.status} ${response.statusText}`);
        return res.status(503).json({ 
          status: 'unavailable',
          message: 'ML service is not responding'
        });
      }
      
      const data = await response.json();
      res.json({
        status: 'healthy',
        ml_service: data
      });
    } catch (error) {
      console.error('Error checking ML service health:', error);
      res.status(503).json({ 
        status: 'unavailable',
        message: 'ML service is not responding'
      });
    }
  });
}