import { apiRequest } from "./queryClient";
import { analyzeQRWithEnhancedScanner, EnhancedQRAnalysisResult } from "./enhanced-qr-service";
import { analyzeQRWithOptimizedML, UPIPaymentInfo, QRScanResult } from "./enhanced-optimized-qr-scanner";

/**
 * Unified QR scanner service
 * Provides a consistent interface for QR analysis with multiple fallback mechanisms
 */

export interface UnifiedQRAnalysisResult {
  // Basic analysis results
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  reasons: string[];
  
  // UPI payment details (if applicable)
  payment_info?: {
    upi_id?: string;
    payee_name?: string;
    amount?: number;
    reference?: string;
    is_valid: boolean;
  };
  
  // Additional metadata
  qr_type: 'upi' | 'url' | 'text' | 'unknown';
  service_used: 'enhanced' | 'optimized' | 'direct' | 'basic';
  processing_time_ms: number;
  timestamp: string;
}

/**
 * Best-effort QR code analysis with multiple fallback mechanisms
 * @param qrText Text content from the QR code
 * @returns Unified analysis result from the best available service 
 */
export async function analyzeQRCode(qrText: string): Promise<UnifiedQRAnalysisResult> {
  const startTime = Date.now();
  let result: UnifiedQRAnalysisResult = {
    risk_score: 0,
    risk_level: 'Low',
    reasons: [],
    qr_type: 'text',
    service_used: 'basic',
    processing_time_ms: 0,
    timestamp: new Date().toISOString()
  };
  
  try {
    // First, try the enhanced scanner (Python service)
    try {
      const enhancedResult = await analyzeQRWithEnhancedScanner(qrText);
      
      // If successful, map the result
      result = {
        risk_score: enhancedResult.risk_score,
        risk_level: enhancedResult.risk_level as 'Low' | 'Medium' | 'High',
        reasons: enhancedResult.reasons,
        qr_type: enhancedResult.qr_type as 'upi' | 'url' | 'text' | 'unknown',
        service_used: 'enhanced',
        processing_time_ms: enhancedResult.latency_ms,
        timestamp: new Date().toISOString()
      };
      
      // Try to extract payment info if it's a UPI QR
      if (qrText.startsWith('upi://')) {
        try {
          const upiInfo = await extractUPIInfo(qrText);
          if (upiInfo) {
            result.payment_info = {
              upi_id: upiInfo.pa,
              payee_name: upiInfo.pn,
              amount: upiInfo.am,
              reference: upiInfo.tn,
              is_valid: upiInfo.valid
            };
          }
        } catch (upiError) {
          console.error('Error extracting UPI info:', upiError);
        }
      }
      
      return result;
    } catch (enhancedError) {
      console.warn('Enhanced QR scanner error:', enhancedError);
      // Continue to fallback mechanisms
    }
    
    // Next, try the optimized ML scanner
    try {
      const optimizedResult = await analyzeQRWithOptimizedML(qrText);
      
      // Map the result
      result = {
        risk_score: optimizedResult.risk_score,
        risk_level: optimizedResult.risk_level as 'Low' | 'Medium' | 'High',
        reasons: optimizedResult.reasons || [],
        qr_type: optimizedResult.qr_type as 'upi' | 'url' | 'text' | 'unknown',
        service_used: 'optimized',
        processing_time_ms: optimizedResult.latency_ms || Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
      
      // If it's a UPI, get the payment info
      if (qrText.startsWith('upi://')) {
        const paymentInfo = await extractUPIDetails(qrText);
        if (paymentInfo) {
          result.payment_info = {
            upi_id: paymentInfo.pa,
            payee_name: paymentInfo.pn,
            amount: paymentInfo.am || undefined,
            reference: paymentInfo.tn,
            is_valid: true
          };
        }
      }
      
      return result;
    } catch (optimizedError) {
      console.warn('Optimized QR scanner error:', optimizedError);
      // Continue to next fallback
    }
    
    // Finally, try the direct TypeScript implementation
    try {
      const response = await apiRequest("POST", "/api/direct-qr/full-analysis", { qr_text: qrText });
      const directResult = await response.json();
      
      // Map the result
      result = {
        risk_score: directResult.analysis.risk_score,
        risk_level: directResult.analysis.risk_level as 'Low' | 'Medium' | 'High',
        reasons: directResult.analysis.reasons,
        qr_type: directResult.analysis.qr_type as 'upi' | 'url' | 'text' | 'unknown',
        service_used: 'direct',
        processing_time_ms: directResult.analysis.latency_ms,
        timestamp: new Date().toISOString()
      };
      
      // Include payment info if available
      if (directResult.upi_info) {
        result.payment_info = {
          upi_id: directResult.upi_info.pa,
          payee_name: directResult.upi_info.pn,
          amount: directResult.upi_info.am,
          reference: directResult.upi_info.tn,
          is_valid: directResult.upi_info.valid
        };
      }
      
      return result;
    } catch (directError) {
      console.error('Direct QR scanner error:', directError);
      // All fallbacks failed, use basic analysis
    }
  } catch (error) {
    console.error('All QR analysis methods failed:', error);
  }
  
  // Basic fallback if all methods fail
  const isUPI = qrText.startsWith('upi://');
  const isURL = qrText.startsWith('http://') || qrText.startsWith('https://');
  
  // Set QR type
  if (isUPI) {
    result.qr_type = 'upi';
    
    // Basic UPI extraction for payment info
    const paMatch = qrText.match(/pa=([^&]+)/);
    const pnMatch = qrText.match(/pn=([^&]+)/);
    const amMatch = qrText.match(/am=([^&]+)/);
    
    if (paMatch) {
      result.payment_info = {
        upi_id: decodeURIComponent(paMatch[1]),
        payee_name: pnMatch ? decodeURIComponent(pnMatch[1]) : undefined,
        amount: amMatch ? parseFloat(amMatch[1]) : undefined,
        is_valid: true
      };
    }
    
    // Basic UPI safety check - suspicious keywords
    const suspiciousTerms = ['verify', 'kyc', 'urgent', 'block', 'update'];
    const containsSuspicious = suspiciousTerms.some(term => 
      qrText.toLowerCase().includes(term)
    );
    
    if (containsSuspicious) {
      result.risk_score = 75;
      result.risk_level = 'High';
      result.reasons.push('Contains suspicious keywords in UPI payment');
    } else {
      result.risk_score = 25;
      result.risk_level = 'Low';
    }
  } else if (isURL) {
    result.qr_type = 'url';
    
    // Basic URL safety check
    const suspiciousURLTerms = ['login', 'signin', 'account', 'password', 'secure'];
    const containsSuspiciousURL = suspiciousURLTerms.some(term => 
      qrText.toLowerCase().includes(term)
    );
    
    if (containsSuspiciousURL) {
      result.risk_score = 70;
      result.risk_level = 'High';
      result.reasons.push('Contains suspicious keywords in URL');
    } else if (qrText.startsWith('http://')) {
      result.risk_score = 60;
      result.risk_level = 'Medium';
      result.reasons.push('Non-secure HTTP connection');
    } else {
      result.risk_score = 30;
      result.risk_level = 'Low';
    }
  } else {
    result.qr_type = 'text';
    result.risk_score = 20;
    result.risk_level = 'Low';
  }
  
  // Calculate processing time
  result.processing_time_ms = Date.now() - startTime;
  
  return result;
}

/**
 * Extract UPI payment information from a UPI QR code
 * @param qrText UPI QR code text
 * @returns UPI payment details
 */
export async function extractUPIInfo(qrText: string): Promise<any> {
  try {
    // Try enhanced scanner extraction first
    try {
      const response = await apiRequest('POST', '/api/direct-qr/extract-upi', { qr_text: qrText });
      const result = await response.json();
      
      if (result && !result.error) {
        return result;
      }
    } catch (error) {
      console.warn('Enhanced UPI extraction failed, falling back:', error);
    }
    
    // Fallback to basic extraction
    return extractUPIDetails(qrText);
  } catch (error) {
    console.error('UPI extraction error:', error);
    return null;
  }
}

/**
 * Basic function to extract UPI details from a UPI QR code
 * @param qrText UPI QR code text
 * @returns Extracted payment info
 */
export function extractUPIDetails(qrText: string): UPIPaymentInfo | null {
  if (!qrText.startsWith('upi://')) {
    return null;
  }
  
  try {
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
    
    if (paMatch) {
      result.pa = decodeURIComponent(paMatch[1]);
    }
    
    if (pnMatch) {
      result.pn = decodeURIComponent(pnMatch[1]);
    }
    
    if (amMatch) {
      result.am = parseFloat(amMatch[1]);
    }
    
    if (tnMatch) {
      result.tn = decodeURIComponent(tnMatch[1]);
    }
    
    // Check if UPI ID is valid
    result.valid = !!result.pa && result.pa.includes('@');
    
    return result;
  } catch (error) {
    console.error('Error in basic UPI extraction:', error);
    return null;
  }
}

/**
 * Generate a user-friendly explanation of the risk assessment
 * @param result QR analysis result
 * @returns Human-readable explanation of the risk
 */
export function getRiskExplanation(result: UnifiedQRAnalysisResult): string {
  if (result.risk_level === 'High') {
    return 'This QR code appears to be high-risk and potentially fraudulent. We recommend NOT proceeding with any payment or clicking any links.';
  } else if (result.risk_level === 'Medium') {
    return 'This QR code shows some suspicious patterns. Proceed with caution and double-check details before continuing.';
  } else {
    return 'This QR code appears to be low-risk, but always verify payment details before proceeding.';
  }
}

/**
 * Get color based on risk level
 * @param riskLevel Risk level from analysis
 * @returns Tailwind color class
 */
export function getRiskColor(riskLevel: 'Low' | 'Medium' | 'High'): string {
  switch (riskLevel) {
    case 'High':
      return 'text-red-600';
    case 'Medium':
      return 'text-amber-500';
    case 'Low':
      return 'text-green-600';
    default:
      return 'text-blue-600';
  }
}

/**
 * Get background color based on risk level
 * @param riskLevel Risk level from analysis
 * @returns Tailwind bg color class
 */
export function getRiskBgColor(riskLevel: 'Low' | 'Medium' | 'High'): string {
  switch (riskLevel) {
    case 'High':
      return 'bg-red-100';
    case 'Medium':
      return 'bg-amber-100';
    case 'Low':
      return 'bg-green-100';
    default:
      return 'bg-blue-100';
  }
}