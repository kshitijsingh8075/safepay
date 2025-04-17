/**
 * ML-powered QR Code Scanner Integration
 * Integrates with the River ML-based real-time QR code analysis service
 */

import { apiRequest } from './queryClient';
import { RiskLevel, getRiskLevelFromPercentage } from './fraud-detection';

export interface QRScanFeatures {
  length: number;
  entropy: number;
  has_upi: number;
  num_params: number;
  suspicious_keywords: number;
  valid_upi_format?: number;
  pa_length?: number;
  has_valid_pa?: number;
  has_amount?: number;
}

export interface QRScanResult {
  risk_score: number;
  risk_level: RiskLevel;
  features: QRScanFeatures;
  recommendation: 'Block' | 'Verify' | 'Allow';
  latency_ms: number;
  cached?: boolean;
}

export interface QRScanBatchResult {
  results: QRScanResult[];
  batch_size: number;
  total_time_ms: number;
  average_time_ms: number;
}

/**
 * Analyzes a QR code using the ML service
 * @param qrText The text content from the QR code
 * @returns QR code risk analysis result
 */
export async function analyzeQRWithML(qrText: string): Promise<QRScanResult> {
  try {
    // First check if the internal ML service is available
    const mlServiceUrl = '/api/ml/qr-scan';
    
    try {
      const res = await apiRequest('POST', mlServiceUrl, { qr_text: qrText });
      if (!res.ok) throw new Error('ML service unavailable');
      
      const data = await res.json();
      return {
        ...data,
        risk_level: data.risk_level as RiskLevel || getRiskLevelFromPercentage(data.risk_score)
      };
    } catch (e) {
      console.log('Internal ML service unavailable, falling back to standard API');
      // Fall back to the standard UPI check if ML service is unavailable
      throw e;
    }
  } catch (error) {
    console.error('Error analyzing QR code with ML:', error);
    
    // Return a sensible default to prevent app crash
    return {
      risk_score: 50,
      risk_level: 'Medium',
      features: {
        length: qrText.length,
        entropy: 0,
        has_upi: qrText.includes('upi://') ? 1 : 0,
        num_params: (qrText.match(/&/g) || []).length,
        suspicious_keywords: 0
      },
      recommendation: 'Verify',
      latency_ms: 0,
      cached: false
    };
  }
}

/**
 * Sends feedback about a QR code scan to improve the ML model
 * @param qrText The text content from the QR code
 * @param isScam Whether the QR code was determined to be a scam
 * @returns Success status of the feedback submission
 */
export async function sendQRScanFeedback(qrText: string, isScam: boolean): Promise<boolean> {
  try {
    const res = await apiRequest('POST', '/api/ml/qr-scan/feedback', { 
      qr_text: qrText, 
      is_scam: isScam 
    });
    
    return res.ok;
  } catch (error) {
    console.error('Error sending QR scan feedback:', error);
    return false;
  }
}

/**
 * Batch analyze multiple QR codes using the ML service
 * @param qrTexts Array of QR code text contents
 * @returns Batch analysis results
 */
export async function batchAnalyzeQRWithML(qrTexts: string[]): Promise<QRScanBatchResult> {
  try {
    const res = await apiRequest('POST', '/api/ml/qr-scan/batch', { 
      requests: qrTexts.map(qr_text => ({ qr_text }))
    });
    
    if (!res.ok) throw new Error('ML batch service unavailable');
    
    return await res.json();
  } catch (error) {
    console.error('Error batch analyzing QR codes with ML:', error);
    
    // Return a sensible default to prevent app crash
    return {
      results: qrTexts.map(qrText => ({
        risk_score: 50,
        risk_level: 'Medium' as RiskLevel,
        features: {
          length: qrText.length,
          entropy: 0,
          has_upi: qrText.includes('upi://') ? 1 : 0,
          num_params: (qrText.match(/&/g) || []).length,
          suspicious_keywords: 0
        },
        recommendation: 'Verify' as 'Verify',
        latency_ms: 0,
        cached: false
      })),
      batch_size: qrTexts.length,
      total_time_ms: 0,
      average_time_ms: 0
    };
  }
}

/**
 * Extracts payment information from a UPI QR code
 * @param qrText The text content from the UPI QR code
 * @returns Extracted payment information or null if not a valid UPI QR
 */
export function extractUPIPaymentInfo(qrText: string): {
  upiId: string;
  name?: string;
  amount?: string;
  reference?: string;
  currency?: string;
  valid: boolean;
} | null {
  // Check if it's a UPI QR code
  if (!qrText.startsWith('upi://')) {
    return null;
  }

  try {
    // Parse the UPI URL
    const upiUrl = new URL(qrText);
    const params = new URLSearchParams(upiUrl.search);
    
    // Extract common UPI parameters
    const payeeAddress = params.get('pa'); // Payee address (UPI ID)
    const payeeName = params.get('pn');    // Payee name
    const amount = params.get('am');       // Amount
    const transactionRef = params.get('tr'); // Transaction reference
    const transactionNote = params.get('tn'); // Transaction note
    const currency = params.get('cu') || 'INR'; // Currency (default to INR)
    
    // Validate required parameters
    const valid = !!payeeAddress && payeeAddress.includes('@');
    
    return {
      upiId: payeeAddress || '',
      name: payeeName || undefined,
      amount: amount || undefined,
      reference: transactionRef || transactionNote || undefined,
      currency: currency,
      valid
    };
  } catch (error) {
    console.error('Error extracting UPI payment info:', error);
    return null;
  }
}