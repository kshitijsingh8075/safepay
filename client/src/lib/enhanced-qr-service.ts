import { apiRequest } from "./queryClient";

/**
 * Enhanced QR Scanner Service
 * Provides interaction with the Python-based enhanced QR scanner service
 */

export interface EnhancedQRAnalysisResult {
  risk_score: number;
  risk_level: string;
  reasons: string[];
  qr_type: 'upi' | 'url' | 'text';
  latency_ms: number;
  heuristic_score?: number;
  ml_score?: number;
  recommendations?: string[];
  confidence?: number;
}

/**
 * Analyze a QR code using the enhanced Python scanner service
 * @param qrText Text content of QR code
 * @returns Analysis result with risk assessment
 */
export async function analyzeQRWithEnhancedScanner(qrText: string): Promise<EnhancedQRAnalysisResult> {
  try {
    const startTime = Date.now();
    const response = await apiRequest('POST', '/api/enhanced-qr/analyze', {
      qr_text: qrText
    });
    
    if (!response.ok) {
      throw new Error(`Enhanced QR scanner error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    const endTime = Date.now();
    
    // Add processing time if not included in response
    if (!result.latency_ms) {
      result.latency_ms = endTime - startTime;
    }
    
    return {
      risk_score: result.risk_score || 0,
      risk_level: mapRiskLevel(result.risk_score || 0),
      reasons: result.reasons || [],
      qr_type: determineQRType(qrText),
      latency_ms: result.latency_ms,
      heuristic_score: result.heuristic_score,
      ml_score: result.ml_score,
      recommendations: result.recommendations,
      confidence: result.confidence
    };
  } catch (error) {
    console.error('Enhanced QR scanner analysis failed:', error);
    throw error;
  }
}

/**
 * Extract payment information from a UPI QR code
 * @param qrText UPI QR code text
 * @returns Payment information or null if not a valid UPI QR
 */
export async function extractUPIPaymentInfoEnhanced(qrText: string): Promise<any> {
  if (!qrText.startsWith('upi://')) {
    return null;
  }
  
  try {
    const response = await apiRequest('POST', '/api/enhanced-qr/extract-upi', {
      qr_text: qrText
    });
    
    if (!response.ok) {
      throw new Error(`UPI extraction error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Enhanced UPI payment info extraction failed:', error);
    return null;
  }
}

/**
 * Submit feedback about a QR scan to improve the model
 * @param qrText QR code text
 * @param isScam Whether the QR was determined to be a scam
 * @param reason Optional reason for the classification
 * @returns Success status
 */
export async function submitQRFeedback(
  qrText: string, 
  isScam: boolean,
  reason?: string
): Promise<boolean> {
  try {
    const response = await apiRequest('POST', '/api/enhanced-qr/feedback', {
      qr_text: qrText,
      is_scam: isScam,
      reason: reason || ''
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to submit QR feedback:', error);
    return false;
  }
}

/**
 * Map a numeric risk score to a risk level string
 * @param score Risk score (0-100)
 * @returns Risk level classification
 */
function mapRiskLevel(score: number): string {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

/**
 * Determine the type of QR code from its content
 * @param qrText QR code text
 * @returns Classification of QR type
 */
function determineQRType(qrText: string): 'upi' | 'url' | 'text' {
  if (qrText.startsWith('upi://')) return 'upi';
  if (qrText.startsWith('http://') || qrText.startsWith('https://')) return 'url';
  return 'text';
}