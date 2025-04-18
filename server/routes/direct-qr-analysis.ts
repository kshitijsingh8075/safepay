import { Router } from 'express';
import { log } from '../vite';
import { analyzeQRText, extractUPIInfo } from '../services/direct-qr-scanner';

/**
 * Direct QR Analysis Router
 * Implements direct QR code analysis in TypeScript without relying on external services
 */

export function createDirectQRRouter() {
  const router = Router();
  
  // Analyze QR code text
  router.post('/analyze', (req, res) => {
    try {
      const { qr_text } = req.body;
      
      if (!qr_text) {
        return res.status(400).json({
          error: 'Missing QR text',
          message: 'Please provide qr_text in the request body'
        });
      }
      
      const result = analyzeQRText(qr_text);
      return res.status(200).json(result);
    } catch (error) {
      log(`Error in direct QR analysis: ${error}`, 'qrscan');
      return res.status(500).json({
        error: 'Analysis failed',
        message: 'Failed to analyze QR code'
      });
    }
  });
  
  // Extract UPI information
  router.post('/extract-upi', (req, res) => {
    try {
      const { qr_text } = req.body;
      
      if (!qr_text) {
        return res.status(400).json({
          error: 'Missing QR text',
          message: 'Please provide qr_text in the request body'
        });
      }
      
      const result = extractUPIInfo(qr_text);
      
      if (!result) {
        return res.status(400).json({
          error: 'Invalid UPI QR',
          message: 'The provided text is not a valid UPI QR code'
        });
      }
      
      return res.status(200).json(result);
    } catch (error) {
      log(`Error extracting UPI info: ${error}`, 'qrscan');
      return res.status(500).json({
        error: 'Extraction failed',
        message: 'Failed to extract UPI information'
      });
    }
  });
  
  // Combined analysis and extraction
  router.post('/full-analysis', (req, res) => {
    try {
      const { qr_text } = req.body;
      
      if (!qr_text) {
        return res.status(400).json({
          error: 'Missing QR text',
          message: 'Please provide qr_text in the request body'
        });
      }
      
      const analysis = analyzeQRText(qr_text);
      const upiInfo = qr_text.startsWith('upi://') ? extractUPIInfo(qr_text) : null;
      
      return res.status(200).json({
        analysis,
        upi_info: upiInfo,
        is_upi: qr_text.startsWith('upi://')
      });
    } catch (error) {
      log(`Error in full QR analysis: ${error}`, 'qrscan');
      return res.status(500).json({
        error: 'Analysis failed',
        message: 'Failed to perform full QR analysis'
      });
    }
  });
  
  return router;
}