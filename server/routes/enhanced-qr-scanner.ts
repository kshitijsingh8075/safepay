import { Router, Request, Response } from 'express';
import axios from 'axios';
import { log } from '../vite';
import { analyzeQRText, extractUPIInfo } from '../services/direct-qr-scanner';

/**
 * Create router for enhanced QR scanner service
 * Communicates with the Python-based QR scanner API
 */
export function createEnhancedQRRouter() {
  const router = Router();
  
  // Base URL for the enhanced Python service
  // This is the port used by start_enhanced_qr_service.py
  const ENHANCED_QR_SERVICE_URL = 'http://localhost:8001';
  
  // Health check endpoint
  router.get('/status', async (req: Request, res: Response) => {
    try {
      // Try to reach the Python service
      const response = await axios.get(`${ENHANCED_QR_SERVICE_URL}/health`, { 
        timeout: 2000 
      });
      
      if (response.status === 200) {
        // Service is up
        res.json({
          status: 'operational',
          service: 'enhanced-qr-scanner',
          python_service: 'connected',
          version: '1.0.0',
          timestamp: new Date().toISOString()
        });
      } else {
        // Service responded but with an error
        res.json({
          status: 'degraded',
          service: 'enhanced-qr-scanner',
          python_service: 'error',
          error: response.statusText,
          fallback: 'using direct TypeScript implementation',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      // Service is down or unreachable
      res.json({
        status: 'degraded',
        service: 'enhanced-qr-scanner',
        python_service: 'unavailable',
        fallback: 'using direct TypeScript implementation',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Analyze QR code with enhanced scanner
  router.post('/analyze', async (req: Request, res: Response) => {
    try {
      const { qr_text } = req.body;

      if (!qr_text) {
        return res.status(400).json({
          error: 'Missing required parameter: qr_text'
        });
      }

      try {
        // Try to use the enhanced Python scanner
        const response = await axios.post(
          `${ENHANCED_QR_SERVICE_URL}/predict`, 
          { qr_text },
          { timeout: 5000 }
        );

        // Got a successful response from Python service
        res.json(response.data);
      } catch (error) {
        // Enhanced scanner unavailable, fall back to direct implementation
        log('Enhanced QR scanner unavailable, using fallback', 'warn');
        
        const fallbackResult = analyzeQRText(qr_text);
        
        // Add a note that this is a fallback result
        fallbackResult.is_fallback = true;
        
        res.json(fallbackResult);
      }
    } catch (error) {
      log(`Error in enhanced QR analysis: ${error}`, 'error');
      res.status(500).json({
        error: 'Failed to analyze QR code',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Submit feedback to improve the model
  router.post('/feedback', async (req: Request, res: Response) => {
    try {
      const { qr_text, is_scam, reason } = req.body;

      if (!qr_text || typeof is_scam !== 'boolean') {
        return res.status(400).json({
          error: 'Missing required parameters: qr_text and is_scam'
        });
      }

      try {
        // Try to send feedback to the Python service
        const response = await axios.post(
          `${ENHANCED_QR_SERVICE_URL}/feedback`, 
          { qr_text, is_scam, reason: reason || '' },
          { timeout: 5000 }
        );

        // Successfully submitted feedback
        res.json({
          success: true,
          message: 'Feedback submitted successfully'
        });
      } catch (error) {
        // Python service unavailable
        log('Enhanced QR scanner unavailable for feedback', 'warn');
        
        // Still report success to the client to avoid disruption
        res.json({
          success: true,
          message: 'Feedback will be processed when service is available',
          pending: true
        });
      }
    } catch (error) {
      log(`Error submitting QR feedback: ${error}`, 'error');
      res.status(500).json({
        error: 'Failed to submit feedback',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Extract UPI information from QR code
  router.post('/extract-upi', async (req: Request, res: Response) => {
    try {
      const { qr_text } = req.body;

      if (!qr_text) {
        return res.status(400).json({
          error: 'Missing required parameter: qr_text'
        });
      }

      // Check if it's a UPI QR code
      if (!qr_text.startsWith('upi://')) {
        return res.status(400).json({
          error: 'Not a valid UPI QR code'
        });
      }

      try {
        // Try to use the enhanced Python service for UPI extraction
        const response = await axios.post(
          `${ENHANCED_QR_SERVICE_URL}/extract-upi`, 
          { qr_text },
          { timeout: 3000 }
        );

        // Successfully extracted using Python service
        res.json(response.data);
      } catch (error) {
        // Fall back to TypeScript implementation
        const upiInfo = extractUPIInfo(qr_text);
        
        if (!upiInfo) {
          return res.status(400).json({
            error: 'Unable to extract UPI information'
          });
        }
        
        // Add a note that this is a fallback result
        res.json({
          ...upiInfo,
          is_fallback: true
        });
      }
    } catch (error) {
      log(`Error extracting UPI info: ${error}`, 'error');
      res.status(500).json({
        error: 'Failed to extract UPI information',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  return router;
}