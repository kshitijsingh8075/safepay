import { apiRequest } from "./queryClient";

export interface QRScanResult {
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  reasons: string[];
  qr_type: string;
  latency_ms: number;
}

export interface UPIPaymentInfo {
  pa: string;         // Payment address (UPI ID)
  pn: string;         // Payee name
  am?: number;        // Amount
  tn?: string;        // Transaction note
  cu?: string;        // Currency
  valid: boolean;     // Is valid UPI format
}

/**
 * Analyze QR code using the optimized ML service
 * @param qrText Text from QR code
 * @returns Analysis result
 */
export async function analyzeQRWithOptimizedML(qrText: string): Promise<QRScanResult> {
  try {
    const response = await apiRequest('POST', '/api/optimized-qr/analyze', {
      qr_text: qrText
    });
    
    if (!response.ok) {
      throw new Error(`QR analysis error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Ensure we have a consistent format
    return {
      risk_score: result.risk_score || 0,
      risk_level: result.risk_level || 'Low',
      reasons: result.reasons || [],
      qr_type: result.qr_type || 'unknown',
      latency_ms: result.latency_ms || 0
    };
  } catch (error) {
    console.error('Error in optimized QR analysis:', error);
    
    // Return a fallback analysis result
    return {
      risk_score: 50,
      risk_level: 'Medium',
      reasons: ['Error analyzing QR code', 'Using fallback analysis'],
      qr_type: qrText.startsWith('upi://') ? 'upi' : 
               qrText.startsWith('http') ? 'url' : 'text',
      latency_ms: 0
    };
  }
}

/**
 * Extract UPI payment details from QR text
 */
export async function extractUPIDetails(qrText: string): Promise<UPIPaymentInfo | null> {
  if (!qrText.startsWith('upi://')) {
    return null;
  }
  
  try {
    // Try server-side extraction first
    try {
      const response = await apiRequest('POST', '/api/direct-qr/extract-upi', { 
        qr_text: qrText 
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result && result.pa) {
          return result;
        }
      }
    } catch (e) {
      console.warn('Server UPI extraction failed, falling back to client-side:', e);
    }
    
    // Client-side fallback
    const result: UPIPaymentInfo = {
      pa: '',
      pn: '',
      valid: false
    };
    
    // Extract parameters
    const paMatch = qrText.match(/pa=([^&]+)/);
    const pnMatch = qrText.match(/pn=([^&]+)/);
    const amMatch = qrText.match(/am=([^&]+)/);
    const tnMatch = qrText.match(/tn=([^&]+)/);
    const cuMatch = qrText.match(/cu=([^&]+)/);
    
    if (paMatch) {
      result.pa = decodeURIComponent(paMatch[1]);
    }
    
    if (pnMatch) {
      result.pn = decodeURIComponent(pnMatch[1]);
    }
    
    if (amMatch) {
      const amount = parseFloat(amMatch[1]);
      if (!isNaN(amount)) {
        result.am = amount;
      }
    }
    
    if (tnMatch) {
      result.tn = decodeURIComponent(tnMatch[1]);
    }
    
    if (cuMatch) {
      result.cu = decodeURIComponent(cuMatch[1]);
    }
    
    // Check if UPI ID is valid
    result.valid = !!result.pa && result.pa.includes('@');
    
    return result;
  } catch (error) {
    console.error('Error extracting UPI details:', error);
    return null;
  }
}