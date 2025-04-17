import { Router, Request, Response } from 'express';
import { log } from '../vite';
import fetch from 'node-fetch';

// Create router
const router = Router();

// QR ML Service URL
const QR_ML_SERVICE_URL = 'http://localhost:8000';

/**
 * Proxies requests to the QR ML service
 * @param path - API path
 * @param req - Express request
 * @param res - Express response
 */
async function proxyToMLService(path: string, req: Request, res: Response) {
  try {
    // Forward the request to the ML service
    const mlResponse = await fetch(`${QR_ML_SERVICE_URL}${path}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!mlResponse.ok) {
      throw new Error(`ML service responded with status: ${mlResponse.status}`);
    }

    const data = await mlResponse.json();
    res.json(data);
  } catch (error) {
    log(`QR ML service error: ${error.message}`, 'qrscan');
    
    // For predict endpoint, we'll return fallback prediction
    if (path === '/predict') {
      // Simple fallback risk assessment based on string length and patterns
      const qrText = req.body.qr_text || '';
      let riskScore = 30; // Default medium risk
      
      if (qrText.includes('upi://')) {
        // Check for suspicious patterns in UPI QR codes
        const suspiciousKeywords = ['urgent', 'payment', 'verify', 'emergency'];
        
        suspiciousKeywords.forEach(keyword => {
          if (qrText.toLowerCase().includes(keyword)) {
            riskScore += 15;
          }
        });
        
        // Too many parameters is suspicious
        const params = qrText.split('?')[1]?.split('&') || [];
        if (params.length > 5) {
          riskScore += 10;
        }
      }
      
      res.json({
        risk_score: Math.min(riskScore, 100),
        latency_ms: 5,
        fallback: true,
      });
    } else {
      // For other endpoints, return an error
      res.status(503).json({
        error: 'QR ML service unavailable',
        message: 'The QR analysis service is currently unavailable.'
      });
    }
  }
}

// QR predict endpoint
router.post('/predict', async (req, res) => {
  await proxyToMLService('/predict', req, res);
});

// QR feedback endpoint
router.post('/feedback', async (req, res) => {
  await proxyToMLService('/feedback', req, res);
});

// Health check endpoint
router.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'optimized-qr-scan' });
});

export default router;