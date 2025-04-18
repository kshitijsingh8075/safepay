import { apiRequest } from "./queryClient";

/**
 * Enhanced Optimized QR Scanner Service
 * High-performance QR analysis with ML and rule-based checks
 */

export interface QRScanResult {
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  recommendation: 'Allow' | 'Verify' | 'Block';
  qr_type?: 'upi' | 'url' | 'text';
  latency_ms?: number;
  reasons?: string[];
}

export interface UPIPaymentInfo {
  pa: string;  // UPI ID (payee address)
  pn?: string; // Payee name
  am?: number; // Amount
  tn?: string; // Transaction note/reference
  cu?: string; // Currency
  valid: boolean;
}

/**
 * Analyze a QR code using the optimized ML service
 * @param qrText Text content of QR code
 * @returns Analysis result with risk assessment
 */
export async function analyzeQRWithOptimizedML(qrText: string): Promise<QRScanResult> {
  try {
    const startTime = Date.now();
    const response = await apiRequest('POST', '/api/optimized-qr/analyze', {
      qr_text: qrText
    });
    
    if (!response.ok) {
      throw new Error(`Optimized QR analysis error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    const endTime = Date.now();
    
    // Structure the result in expected format
    return {
      risk_score: result.risk_score || 0,
      risk_level: mapRiskLevel(result.risk_score || 0),
      recommendation: mapRecommendation(result.risk_score || 0),
      latency_ms: result.latency_ms || (endTime - startTime),
      qr_type: determineQRType(qrText),
      reasons: result.reasons || []
    };
  } catch (error) {
    console.error('Optimized QR analysis failed:', error);
    
    // Fallback to basic analysis
    return performBasicAnalysis(qrText);
  }
}

/**
 * Extract UPI payment information from QR text
 * @param qrText UPI QR code text
 * @returns Payment information or null
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
 * Basic function to analyze QR text when API is unavailable
 * @param qrText QR code text
 * @returns Simple risk assessment
 */
function performBasicAnalysis(qrText: string): QRScanResult {
  const startTime = Date.now();
  const qrType = determineQRType(qrText);
  let riskScore = 0;
  const reasons: string[] = [];
  
  // Apply some basic heuristic checks
  if (qrType === 'url') {
    // Check for HTTP (non-secure)
    if (qrText.startsWith('http://')) {
      riskScore += 30;
      reasons.push('Non-secure HTTP connection');
    }
    
    // Check for suspicious URL keywords
    const suspiciousTerms = ['login', 'signin', 'account', 'password', 'verify', 'bank', 'update'];
    for (const term of suspiciousTerms) {
      if (qrText.toLowerCase().includes(term)) {
        riskScore += 15;
        reasons.push(`Contains suspicious keyword: ${term}`);
        break;
      }
    }
    
    // Check for shortened URLs
    if (qrText.includes('bit.ly') || qrText.includes('goo.gl') || qrText.includes('tinyurl')) {
      riskScore += 25;
      reasons.push('Contains shortened URL (can mask destination)');
    }
  } else if (qrType === 'upi') {
    // Validate UPI format
    const upiInfo = extractUPIPaymentInfo(qrText);
    if (!upiInfo || !upiInfo.valid) {
      riskScore += 40;
      reasons.push('Invalid UPI format');
    }
    
    // Check for suspicious UPI ID patterns
    if (qrText.toLowerCase().includes('verify') || qrText.toLowerCase().includes('update')) {
      riskScore += 50;
      reasons.push('UPI ID contains suspicious keywords');
    }
  }
  
  // Cap risk score at 100
  riskScore = Math.min(100, riskScore);
  
  // If no specific issues found, add low baseline risk
  if (reasons.length === 0) {
    if (qrType === 'url') {
      reasons.push('No specific issues detected, but use caution with any URL');
      riskScore = Math.max(riskScore, 15);
    } else if (qrType === 'upi') {
      reasons.push('No specific issues detected in UPI QR');
      riskScore = Math.max(riskScore, 10);
    } else {
      reasons.push('Plain text QR code');
      riskScore = Math.max(riskScore, 5);
    }
  }
  
  return {
    risk_score: riskScore,
    risk_level: mapRiskLevel(riskScore),
    recommendation: mapRecommendation(riskScore),
    qr_type: qrType,
    latency_ms: Date.now() - startTime,
    reasons
  };
}

/**
 * Map numeric risk score to risk level
 * @param score Risk score (0-100)
 * @returns Risk level classification
 */
function mapRiskLevel(score: number): 'Low' | 'Medium' | 'High' {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

/**
 * Map risk score to action recommendation
 * @param score Risk score (0-100)
 * @returns Recommended action
 */
function mapRecommendation(score: number): 'Allow' | 'Verify' | 'Block' {
  if (score >= 70) return 'Block';
  if (score >= 40) return 'Verify';
  return 'Allow';
}

/**
 * Determine QR code type from content
 * @param qrText QR code text
 * @returns QR type classification
 */
function determineQRType(qrText: string): 'upi' | 'url' | 'text' {
  if (qrText.startsWith('upi://')) return 'upi';
  if (qrText.startsWith('http://') || qrText.startsWith('https://')) return 'url';
  return 'text';
}