import { apiRequest } from "./queryClient";

export interface QRScanResult {
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  recommendation: 'Allow' | 'Verify' | 'Block';
}

/**
 * Extract UPI payment information from QR text
 * @param qrText QR code text
 * @returns Payment information
 */
export function extractUPIPaymentInfo(qrText: string): any {
  if (!qrText.startsWith('upi://')) {
    return null;
  }
  
  try {
    // Extract payment parameters from UPI URI
    const upiId = qrText.match(/pa=([^&]+)/);
    const name = qrText.match(/pn=([^&]+)/);
    const amount = qrText.match(/am=([^&]+)/);
    const note = qrText.match(/tn=([^&]+)/);
    const currency = qrText.match(/cu=([^&]+)/);
    
    // Validate that we extracted a UPI ID
    const valid = !!upiId && upiId[1].includes('@');
    
    if (!valid) {
      return null;
    }
    
    // Format the extracted information
    return {
      valid,
      upiId: upiId ? decodeURIComponent(upiId[1]) : '',
      name: name ? decodeURIComponent(name[1]) : '',
      amount: amount ? amount[1] : '',
      note: note ? decodeURIComponent(note[1]) : '',
      currency: currency ? currency[1] : 'INR'
    };
  } catch (error) {
    console.error('Error extracting UPI payment info:', error);
    return null;
  }
}

/**
 * Legacy ML analysis function - redirects to optimized scanner
 * Kept for backward compatibility
 */
export async function analyzeQRWithML(qrText: string): Promise<QRScanResult> {
  try {
    const response = await apiRequest('POST', '/api/optimized-qr/analyze', {
      qr_text: qrText
    });
    
    if (!response.ok) {
      throw new Error(`QR analysis error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return {
      risk_score: result.risk_score || 0,
      risk_level: mapRiskLevel(result.risk_score || 0),
      recommendation: mapRecommendation(result.risk_score || 0)
    };
  } catch (error) {
    console.error('Error analyzing QR code:', error);
    
    // Basic fallback analysis
    return performBasicAnalysis(qrText);
  }
}

/**
 * Basic QR analysis for when all services are unavailable
 */
function performBasicAnalysis(qrText: string): QRScanResult {
  let riskScore = 0;
  
  // Apply simple heuristic checks
  if (qrText.startsWith('upi://')) {
    // Check for suspicious UPI patterns
    const suspiciousTerms = ['verify', 'kyc', 'confirm', 'update', 'block'];
    for (const term of suspiciousTerms) {
      if (qrText.toLowerCase().includes(term)) {
        riskScore += 25;
        break;
      }
    }
  } else if (qrText.startsWith('http://') || qrText.startsWith('https://')) {
    // Non-secure HTTP
    if (qrText.startsWith('http://')) {
      riskScore += 20;
    }
    
    // Check for suspicious URL keywords
    const suspiciousTerms = ['login', 'signin', 'account', 'password', 'bank'];
    for (const term of suspiciousTerms) {
      if (qrText.toLowerCase().includes(term)) {
        riskScore += 20;
        break;
      }
    }
  }
  
  // Add base risk score
  riskScore = Math.max(10, Math.min(riskScore, 100));
  
  return {
    risk_score: riskScore,
    risk_level: mapRiskLevel(riskScore),
    recommendation: mapRecommendation(riskScore)
  };
}

/**
 * Map risk score to risk level
 */
function mapRiskLevel(score: number): 'Low' | 'Medium' | 'High' {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

/**
 * Map risk score to recommendation
 */
function mapRecommendation(score: number): 'Allow' | 'Verify' | 'Block' {
  if (score >= 70) return 'Block';
  if (score >= 40) return 'Verify';
  return 'Allow';
}