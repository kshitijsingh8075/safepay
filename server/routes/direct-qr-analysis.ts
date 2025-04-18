import { Router } from 'express';
import { log } from '../vite';

/**
 * Direct QR analysis implementation in TypeScript
 * This serves as a fallback when the Python ML service is not available
 */

// Create a dedicated router for direct QR analysis
export function createDirectQRRouter() {
  const router = Router();

  // Analyze a QR code text
  router.post('/predict', (req, res) => {
    try {
      const { qr_text } = req.body;
      
      if (!qr_text) {
        return res.status(400).json({ 
          error: 'Missing QR text',
          message: 'Please provide qr_text in the request body' 
        });
      }
      
      const result = analyzeQRText(qr_text);
      log(`Direct QR analysis: ${qr_text} → ${result.risk_score}%`, 'qrscan');
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in direct QR analysis:', error);
      return res.status(500).json({ 
        error: 'Analysis failed',
        message: 'Failed to analyze QR code' 
      });
    }
  });

  // Process user feedback (for learning)
  router.post('/feedback', (req, res) => {
    try {
      const { qr_text, is_scam } = req.body;
      
      if (!qr_text) {
        return res.status(400).json({ error: 'Missing qr_text parameter' });
      }
      
      if (is_scam === undefined) {
        return res.status(400).json({ error: 'Missing is_scam parameter' });
      }
      
      // Store feedback for future model improvements
      // In a real system, this would update our model
      log(`Received direct QR feedback: ${qr_text} → ${is_scam ? 'scam' : 'safe'}`, 'qrscan');
      
      return res.status(200).json({ status: 'feedback_recorded' });
    } catch (error) {
      console.error('Error processing QR feedback:', error);
      return res.status(500).json({ error: 'Failed to process feedback' });
    }
  });

  return router;
}

/**
 * Calculate string entropy (information density)
 * Higher entropy often correlates with potentially suspicious content
 */
function calculateStringEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  
  // Calculate character frequency
  const charFreq: Record<string, number> = {};
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    charFreq[char] = (charFreq[char] || 0) + 1;
  }
  
  // Calculate entropy
  let entropy = 0;
  Object.values(charFreq).forEach(freq => {
    const p = freq / str.length;
    entropy -= p * Math.log2(p);
  });
  
  // Normalize to 0-1 range (typical English text has entropy around 4-5)
  return Math.min(entropy / 6, 1);
}

/**
 * Analyze QR code text for potential fraud/risk
 */
function analyzeQRText(qrText: string): { 
  risk_score: number; 
  latency_ms: number;
  features?: Record<string, number>;
} {
  const startTime = Date.now();
  
  // Basic risk features
  const isUpi = qrText.toLowerCase().startsWith('upi://');
  const hasUpi = qrText.includes('@');
  const entropy = calculateStringEntropy(qrText);
  const numParams = (qrText.match(/&/g) || []).length + (qrText.match(/\?/g) || []).length;
  const length = qrText.length;
  
  // Regular patterns (UPI format)
  const upiRegex = /upi:\/\/pay\?[a-zA-Z0-9=&@\.-]+/;
  const isValidUpiFormat = upiRegex.test(qrText);
  
  // Suspicious keywords
  const suspiciousKeywords = [
    'urgent', 'emergency', 'verify', 'kyc', 'confirm', 'block',
    'expired', 'limited', 'account', 'alert', 'immediate'
  ];
  
  const suspiciousCount = suspiciousKeywords.reduce((count, keyword) => {
    return count + (qrText.toLowerCase().includes(keyword) ? 1 : 0);
  }, 0);
  
  // Calculate base risk score
  let riskScore = 5; // Start with minimal risk
  
  // Legitimate UPI QR codes usually have low risk
  if (isUpi && isValidUpiFormat) {
    // Valid UPI format
    riskScore += 5;
  } else if (isUpi) {
    // Invalid UPI format but claims to be UPI
    riskScore += 40;
  }
  
  // Add risk based on suspicious patterns
  riskScore += suspiciousCount * 10; // Each suspicious keyword adds 10%
  riskScore += numParams > 5 ? 15 : 0; // Too many parameters is suspicious 
  riskScore += entropy * 10; // Higher entropy adds up to 10%
  
  // Very long QR codes might be suspicious
  if (length > 200) {
    riskScore += 15;
  }
  
  // Legitimate UPI ID reduces risk significantly
  if (hasUpi && isUpi) {
    riskScore -= 25; // Major reduction for proper UPI IDs
  }
  
  // Ensure risk score is within bounds
  riskScore = Math.max(0, Math.min(100, riskScore));
  
  // Features for debugging
  const features = {
    length,
    has_upi: hasUpi ? 1 : 0,
    is_upi: isUpi ? 1 : 0,
    num_params: numParams,
    entropy: Math.round(entropy * 100) / 100,
    suspicious_keywords: suspiciousCount,
    valid_upi_format: isValidUpiFormat ? 1 : 0
  };
  
  const latencyMs = Date.now() - startTime;
  
  return {
    risk_score: Math.round(riskScore),
    latency_ms: latencyMs,
    features
  };
}