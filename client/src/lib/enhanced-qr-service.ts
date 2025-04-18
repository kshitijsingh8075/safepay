import { apiRequest } from "./queryClient";

export interface EnhancedQRAnalysisResult {
  risk_score: number;
  risk_level: string;
  reasons: string[];
  qr_type: 'upi' | 'url' | 'text' | 'unknown';
  latency_ms: number;
  timestamp: string;
}

/**
 * Analyze QR code using the enhanced Python ML scanner
 * @param qrText Text from QR code
 * @returns Analysis result with detailed risk assessment
 */
export async function analyzeQRWithEnhancedScanner(qrText: string): Promise<EnhancedQRAnalysisResult> {
  try {
    // Call the enhanced scanner API endpoint
    const response = await apiRequest('POST', '/api/enhanced-qr/analyze', {
      qr_text: qrText
    });
    
    if (!response.ok) {
      throw new Error(`Enhanced QR analysis error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Ensure we have a consistent format
    return {
      risk_score: result.risk_score || 0,
      risk_level: result.risk_level || 'Low',
      reasons: result.reasons || [],
      qr_type: result.qr_type || 'unknown',
      latency_ms: result.latency_ms || 0,
      timestamp: result.timestamp || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in enhanced QR analysis:', error);
    throw error; // Let the unified scanner handle fallback
  }
}

/**
 * Check if the enhanced QR scanner service is available
 * @returns True if the service is available, false otherwise
 */
export async function isEnhancedScannerAvailable(): Promise<boolean> {
  try {
    const response = await apiRequest('GET', '/api/enhanced-qr/status');
    
    if (response.ok) {
      const status = await response.json();
      return status.status === 'operational';
    }
    
    return false;
  } catch (error) {
    console.error('Enhanced scanner status check failed:', error);
    return false;
  }
}