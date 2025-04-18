/**
 * Enhanced QR Scanner Service Client
 * Connects to the improved QR scanner with advanced security features
 */

// API endpoint for enhanced QR scanner
const ENHANCED_QR_API_URL = '/api/enhanced-qr';

// QR code analysis result interface
export interface EnhancedQRAnalysisResult {
  risk_score: number;
  risk_level: string;
  reasons: string[];
  analysis: {
    ml_score: number;
    heuristic_flags: number;
    safe_browsing_check: boolean;
    safe_browsing_unsafe: boolean;
  };
  qr_type: 'upi' | 'url' | 'text';
  latency_ms: number;
  cached?: boolean;
}

// Feedback request interface
export interface QRFeedbackRequest {
  qr_text: string;
  is_scam: boolean;
  reason?: string;
}

/**
 * Analyze a QR code using the enhanced scanner
 * @param qrText Text content from the QR code
 * @returns Enhanced QR analysis result
 */
export async function analyzeQRWithEnhancedScanner(qrText: string): Promise<EnhancedQRAnalysisResult> {
  try {
    const response = await fetch(`${ENHANCED_QR_API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ qr_text: qrText }),
    });

    if (!response.ok) {
      throw new Error(`Enhanced QR scanner error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error using enhanced QR scanner:', error);
    throw error;
  }
}

/**
 * Send feedback about a QR code scan to improve the model
 * @param feedback Feedback data including QR text and whether it's a scam
 * @returns Feedback acknowledgment
 */
export async function sendQRFeedback(feedback: QRFeedbackRequest): Promise<{ status: string }> {
  try {
    const response = await fetch(`${ENHANCED_QR_API_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedback),
    });

    if (!response.ok) {
      throw new Error(`Failed to send QR feedback: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending QR feedback:', error);
    throw error;
  }
}

/**
 * Convert risk score to a user-friendly risk level
 * @param riskScore Numerical risk score (0-100)
 * @returns Risk level category
 */
export function getRiskLevel(riskScore: number): 'Low' | 'Medium' | 'High' {
  if (riskScore < 30) return 'Low';
  if (riskScore < 70) return 'Medium';
  return 'High';
}

/**
 * Get recommended action based on risk score
 * @param riskScore Numerical risk score (0-100)
 * @returns Recommended action
 */
export function getRecommendedAction(riskScore: number): 'Allow' | 'Verify' | 'Block' {
  if (riskScore < 30) return 'Allow';
  if (riskScore < 70) return 'Verify';
  return 'Block';
}

/**
 * Batch analyze multiple QR codes in one request
 * @param qrTexts Array of QR code texts to analyze
 * @returns Array of analysis results
 */
export async function batchAnalyzeQRCodes(qrTexts: string[]): Promise<EnhancedQRAnalysisResult[]> {
  try {
    const response = await fetch(`${ENHANCED_QR_API_URL}/batch-predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ qr_texts: qrTexts }),
    });

    if (!response.ok) {
      throw new Error(`Batch QR analysis error: ${response.status}`);
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error in batch QR analysis:', error);
    throw error;
  }
}

/**
 * Check if the enhanced QR scanner service is available
 * @returns Service status information
 */
export async function checkEnhancedQRServiceStatus(): Promise<{ status: 'online' | 'offline', service: string }> {
  try {
    const response = await fetch(`${ENHANCED_QR_API_URL}/status`);
    
    if (!response.ok) {
      return { status: 'offline', service: 'Enhanced QR Scanner' };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking enhanced QR service status:', error);
    return { status: 'offline', service: 'Enhanced QR Scanner' };
  }
}