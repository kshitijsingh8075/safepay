/**
 * Integration between Enhanced QR Scanner UI and Optimized QR Scanner Service
 * Combines the UI capabilities with the high-performance backend
 */

import { QRScanResult, UPIPaymentInfo, extractUPIPaymentInfo } from './ml-qr-scanner';
import { analyzeQRCode, classifyRiskLevel } from './optimized-qr-scanner';
import { analyzeQRWithEnhancedScanner, getRiskLevel, getRecommendedAction } from './enhanced-qr-service';

/**
 * Analyze a QR code with the optimized ML service
 * @param qrText The raw text from the QR code scan
 * @returns Promise with QR scan risk analysis results (compatible with existing UI)
 */
export async function analyzeQRWithOptimizedML(qrText: string): Promise<QRScanResult> {
  try {
    // First try the enhanced scanner with advanced security features
    try {
      console.log('Attempting to use enhanced QR scanner...');
      const enhancedResult = await analyzeQRWithEnhancedScanner(qrText);
      console.log('Enhanced QR scanner result:', enhancedResult);
      
      // Get normalized risk score (0-100)
      const riskScore = enhancedResult.risk_score;
      
      // Convert to 0-1 scale for internal functions
      const normalizedScore = riskScore / 100;
      
      // Get risk level and recommendation
      const riskLevel = getRiskLevel(riskScore);
      const recommendation = getRecommendedAction(riskScore);
      
      // Generate features based on enhanced result
      const features = {
        pattern_match: enhancedResult.analysis.heuristic_flags > 0 ? 0.9 : 0.3,
        domain_check: enhancedResult.qr_type === 'upi' ? 0.2 : 0.8,
        syntax_validation: 1 - (normalizedScore * 0.3),
        entropy: normalizedScore * 0.8,
        length_score: Math.min(enhancedResult.latency_ms / 100, 0.9) 
      };
      
      // Create detected patterns based on reasons
      const detectedPatterns = enhancedResult.reasons.slice(0, 3);
      
      // Return formatted result compatible with existing UI
      return {
        risk_score: riskScore,
        risk_level: riskLevel,
        recommendation: recommendation,
        confidence: enhancedResult.cached ? 0.98 : 0.95, // Higher confidence with enhanced scanner
        features: features,
        scan_time_ms: enhancedResult.latency_ms,
        detected_patterns: detectedPatterns
      };
    } catch (enhancedError) {
      console.warn('Enhanced QR scanner error, falling back to optimized scanner:', enhancedError);
      // Fall back to optimized scanner if enhanced scanner fails
    }
    
    // Fallback to optimized service for analysis
    const optimizedResult = await analyzeQRCode(qrText);
    
    // Get normalized risk score (0-100)
    const riskScore = optimizedResult.risk_score;
    
    // Convert to 0-1 scale for internal functions
    const normalizedScore = riskScore / 100;
    
    // Determine risk level based on classification
    const riskLevel = classifyRiskLevel(riskScore);
    
    // Use existing functions to determine recommendation based on risk level
    let recommendation: 'Allow' | 'Verify' | 'Block';
    if (riskLevel === 'low') {
      recommendation = 'Allow';
    } else if (riskLevel === 'medium') {
      recommendation = 'Verify';
    } else {
      recommendation = 'Block';
    }
    
    // Generate features based on optimized result
    // Use the features from the optimized service if available
    const features = optimizedResult.features 
      ? {
          pattern_match: optimizedResult.features.urgent ? 0.8 : 0.3,
          domain_check: optimizedResult.features.has_upi ? 0.2 : 0.9,
          syntax_validation: 1 - (normalizedScore * 0.3),
          entropy: (optimizedResult.features.length / 100) * 0.9,
          length_score: Math.min(optimizedResult.features.length / 80, 1) // Normalize length
        }
      : {
          // Fallback when features are not available
          pattern_match: normalizedScore * 0.8,
          domain_check: normalizedScore * 0.9,
          syntax_validation: 1 - (normalizedScore * 0.3),
          entropy: normalizedScore * 0.7,
          length_score: 0.7
        };
    
    // Convert risk level to match expected format
    const formattedRiskLevel = riskLevel === 'low' ? 'Low' : 
                              (riskLevel === 'medium' ? 'Medium' : 'High');
    
    // Return formatted result compatible with existing UI
    return {
      risk_score: riskScore,
      risk_level: formattedRiskLevel,
      recommendation: recommendation,
      confidence: optimizedResult.cached ? 0.95 : 0.9, // Higher confidence for cached results
      features: features,
      scan_time_ms: optimizedResult.latency_ms,
      detected_patterns: []
    };
  } catch (error) {
    console.error('Error analyzing QR code with optimized ML:', error);
    
    // Fallback to a moderate risk result
    return {
      risk_score: 35,
      risk_level: 'Medium',
      recommendation: 'Verify',
      confidence: 0.5,
      features: {
        pattern_match: 0.3,
        domain_check: 0.4,
        syntax_validation: 0.6,
        entropy: 0.5,
        length_score: 0.7
      },
      scan_time_ms: 0,
      detected_patterns: ['OPTIMIZED_API_ERROR']
    };
  }
}

/**
 * Extract UPI payment information from QR code text
 * This is a wrapper to maintain compatibility with the existing function
 * @param qrText Raw text from QR code scan
 * @returns UPI payment info object with parsed information
 */
export { extractUPIPaymentInfo };

/**
 * Full QR analysis including UPI extraction and optimized ML risk analysis
 * @param qrText Raw text from the QR code
 * @returns Complete analysis with UPI details and risk assessment
 */
export async function analyzeFullQRData(qrText: string): Promise<{
  paymentInfo: UPIPaymentInfo;
  riskAnalysis: QRScanResult;
}> {
  // Extract UPI information
  const paymentInfo = extractUPIPaymentInfo(qrText);
  
  // Get risk analysis from optimized service
  const riskAnalysis = await analyzeQRWithOptimizedML(qrText);
  
  return {
    paymentInfo,
    riskAnalysis
  };
}