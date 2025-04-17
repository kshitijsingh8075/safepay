/**
 * Optimized QR Scanner Client Service
 * Uses the backend FastAPI service for QR code analysis
 */

// QR Scan Service Host
// Local development points to the proxy created in server/routes.ts
const QR_SCAN_API_URL = '/api/optimized-qr';

// QR prediction response 
export interface QRPredictionResponse {
  risk_score: number;
  latency_ms: number;
  cached?: boolean;
}

// UPI payment information extracted from QR codes
export interface UPIPaymentInfo {
  pa?: string; // payee address (UPI ID)
  pn?: string; // payee name
  am?: string; // amount
  cu?: string; // currency
  tn?: string; // transaction note
  mc?: string; // merchant code
  mid?: string; // merchant ID
  tr?: string; // transaction reference
  url?: string; // dynamic URL
  mode?: string; // mode of payment
}

// Risk level derived from scores
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Extract UPI payment information from QR code text
 * @param qrText - The scanned QR code text
 * @returns UPI payment information object
 */
export function extractUPIPaymentInfo(qrText: string): UPIPaymentInfo | null {
  if (!qrText || !qrText.startsWith('upi://')) {
    return null;
  }

  try {
    // Extract the query parameters
    const paramsText = qrText.split('?')[1];
    if (!paramsText) return null;

    const paramsSegments = paramsText.split('&');
    const params: UPIPaymentInfo = {};

    paramsSegments.forEach(segment => {
      const [key, value] = segment.split('=');
      if (key && value) {
        params[key as keyof UPIPaymentInfo] = decodeURIComponent(value);
      }
    });

    return params;
  } catch (error) {
    console.error('Error parsing UPI QR code:', error);
    return null;
  }
}

/**
 * Classify the QR risk level based on the risk score
 * @param riskScore - The numerical risk score (0-100)
 * @returns Risk level category
 */
export function classifyRiskLevel(riskScore: number): RiskLevel {
  if (riskScore < 30) return 'low';
  if (riskScore < 70) return 'medium';
  return 'high';
}

/**
 * Calculate string entropy as a fallback risk assessment method
 * Used when ML service is unavailable
 * @param str - String to analyze
 * @returns Normalized entropy value (0-1)
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
 * Analyzes QR code text using the ML service
 * @param qrText - The scanned QR code text
 * @returns Promise with risk analysis
 */
export async function analyzeQRCode(qrText: string): Promise<QRPredictionResponse> {
  try {
    // Call the optimized QR scanning service
    const response = await fetch(`${QR_SCAN_API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ qr_text: qrText }),
    });

    if (!response.ok) {
      throw new Error('QR analysis service unavailable');
    }

    return await response.json();
  } catch (error) {
    // Fallback to basic risk assessment when service is down
    console.warn('QR analysis service error, using fallback:', error);
    const entropy = calculateStringEntropy(qrText);
    
    // Consider UPI-specific risk factors in fallback
    let baseRisk = entropy * 40; // Scale entropy to 0-40 range
    
    // Add risk for suspicious patterns
    if (qrText.includes('upi://')) {
      // Check for suspicious keywords
      const keywords = ['urgent', 'payment', 'verify', 'emergency', 'confirm', 'kyc'];
      keywords.forEach(keyword => {
        if (qrText.toLowerCase().includes(keyword)) {
          baseRisk += 10; // Increase risk for each suspicious keyword
        }
      });
      
      // Check for parametrized UPI
      const params = qrText.split('?')[1]?.split('&') || [];
      if (params.length > 5) {
        baseRisk += 15; // Too many parameters is suspicious
      }
    }
    
    return {
      risk_score: Math.min(Math.round(baseRisk), 100),
      latency_ms: 5, // Minimal latency for fallback calculation
    };
  }
}

/**
 * Sends feedback about a scanned QR code
 * @param qrText - The scanned QR code
 * @param isScam - Whether the QR was a scam
 * @returns Promise with feedback status
 */
export async function sendQRFeedback(qrText: string, isScam: boolean): Promise<{ status: string }> {
  try {
    const response = await fetch(`${QR_SCAN_API_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        qr_text: qrText, 
        is_scam: isScam 
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send QR feedback');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending QR feedback:', error);
    return { status: 'feedback_error' };
  }
}