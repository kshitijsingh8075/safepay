import { Router, Request, Response } from 'express';
import { log } from '../vite';
import { analyzeQRText, extractUPIInfo } from '../services/direct-qr-scanner';

/**
 * Direct QR Analysis Router
 * Implements direct QR code analysis in TypeScript without relying on external services
 */
export function createDirectQRRouter() {
  const router = Router();

  // Health check endpoint
  router.get('/status', (req: Request, res: Response) => {
    res.json({
      status: 'operational',
      service: 'direct-qr-analysis',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Full analysis endpoint - analyzes QR text for risk factors
  router.post('/full-analysis', async (req: Request, res: Response) => {
    try {
      const { qr_text } = req.body;

      if (!qr_text) {
        return res.status(400).json({
          error: 'Missing required parameter: qr_text'
        });
      }

      // Perform direct analysis in TypeScript
      const analysisResult = analyzeQRText(qr_text);
      
      // Extract UPI info if applicable
      let upiInfo = null;
      if (qr_text.startsWith('upi://')) {
        upiInfo = extractUPIInfo(qr_text);
      }

      // Return combined result
      res.json({
        analysis: analysisResult,
        upi_info: upiInfo,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      log(`Error in direct QR analysis: ${error}`, 'error');
      res.status(500).json({
        error: 'Failed to analyze QR code',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Simple analysis endpoint - just basic checks
  router.post('/analyze', async (req: Request, res: Response) => {
    try {
      const { qr_text } = req.body;

      if (!qr_text) {
        return res.status(400).json({
          error: 'Missing required parameter: qr_text'
        });
      }

      // Perform direct analysis in TypeScript
      const analysisResult = analyzeQRText(qr_text);

      // Return just the analysis result
      res.json(analysisResult);
    } catch (error) {
      log(`Error in direct QR analysis: ${error}`, 'error');
      res.status(500).json({
        error: 'Failed to analyze QR code',
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

      // Extract UPI info
      const upiInfo = extractUPIInfo(qr_text);

      if (!upiInfo) {
        return res.status(400).json({
          error: 'Not a valid UPI QR code'
        });
      }

      // Return the UPI info
      res.json(upiInfo);
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