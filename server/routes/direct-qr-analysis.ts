/**
 * Direct QR analysis handler for UPI QR codes
 * This is a native TypeScript implementation to handle QR analysis when the Python service is unavailable
 */

import { Router, Request, Response } from 'express';

/**
 * Analyze QR code from text
 * @param qrText QR code text
 * @returns Risk analysis with scores and features
 */
export function analyzeQRCode(qrText: string): {
  risk_score: number;
  latency_ms: number;
  features: any;
} {
  const startTime = Date.now();
  
  // Extract features from the text
  const features = {
    length: qrText.length,
    has_upi: qrText.toLowerCase().startsWith('upi://') ? 1 : 0,
    num_params: (qrText.match(/&/g) || []).length,
    urgent: /urgent|emergency|immediate|kyc|expired|blocked/i.test(qrText) ? 1 : 0,
    payment: /payment|pay|amount|money|transfer/i.test(qrText) ? 1 : 0,
    currency: /inr|rs|\₹|rupee/i.test(qrText) ? 1 : 0
  };
  
  // START Risk calculation with strong emphasis on UPI safety
  let score = 30; // Start with moderate risk
  
  // ** CRITICAL FIX: Give very significant safety boost to proper UPI IDs **
  if (features.has_upi === 1) {
    score -= 25; // Major reduction for legitimate UPI QR codes
    
    // Look for UPI ID pattern (pa=something@something)
    if (qrText.includes('pa=')) {
      const upiIdMatch = qrText.match(/pa=([^&]+)/);
      if (upiIdMatch && upiIdMatch[1].includes('@')) {
        score -= 10; // Even bigger reduction for valid UPI ID format
      }
    }
  }
  
  // Adjust for suspicious patterns
  if (features.urgent === 1) {
    score += 25; // Higher penalty for urgency indicators
  }
  
  // Adjust for payment related terms (slightly suspicious but normal in UPI context)
  if (features.payment === 1) {
    // Only increase score if not a UPI code
    if (features.has_upi === 0) {
      score += 15;
    }
  }
  
  // Adjust for excessive parameters (potential data theft)
  if (features.num_params > 5) {
    score += 10;
  } else if (features.num_params > 10) {
    score += 20;
  }
  
  // Ensure score stays in valid range
  const finalScore = Math.max(0, Math.min(100, score));
  
  return {
    risk_score: finalScore,
    latency_ms: Date.now() - startTime,
    features
  };
}

/**
 * Creates a router for direct QR analysis
 */
export function createDirectQRRouter(): Router {
  const router = Router();
  
  // QR predict endpoint
  router.post('/predict', (req: Request, res: Response) => {
    const { qr_text } = req.body;
    
    if (!qr_text) {
      return res.status(400).json({ error: 'Missing QR text' });
    }
    
    const result = analyzeQRCode(qr_text);
    res.json(result);
  });
  
  // Mock feedback endpoint - we won't use actual ML feedback
  router.post('/feedback', (req: Request, res: Response) => {
    res.json({ status: 'feedback_received' });
  });
  
  // Health check endpoint
  router.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'direct-qr-analysis' });
  });
  
  return router;
}

export default createDirectQRRouter;