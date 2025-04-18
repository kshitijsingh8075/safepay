/**
 * Direct TypeScript implementation of QR code analysis
 * Used as a fallback when the Enhanced QR Scanner service is unavailable
 */

export interface QRAnalysisResult {
  risk_score: number;
  risk_level: string;
  reasons: string[];
  analysis: {
    heuristic_score: number;
    pattern_score: number;
    checks: {
      is_upi: boolean;
      is_url: boolean;
      is_suspicious_upi: boolean;
      is_suspicious_url: boolean;
      contains_suspicious_keywords: boolean;
    };
  };
  qr_type: 'upi' | 'url' | 'text';
  latency_ms: number;
  is_fallback: boolean;
}

export function analyzeQRText(qrText: string): QRAnalysisResult {
  const startTime = Date.now();
  
  // Determine QR type
  const isUPI = qrText.startsWith('upi://');
  const isURL = qrText.startsWith('http://') || qrText.startsWith('https://');
  
  // Initialize analysis object
  const result: QRAnalysisResult = {
    risk_score: 0,
    risk_level: 'Low',
    reasons: [],
    analysis: {
      heuristic_score: 0,
      pattern_score: 0,
      checks: {
        is_upi: isUPI,
        is_url: isURL,
        is_suspicious_upi: false,
        is_suspicious_url: false,
        contains_suspicious_keywords: false
      }
    },
    qr_type: isUPI ? 'upi' : (isURL ? 'url' : 'text'),
    latency_ms: 0,
    is_fallback: true
  };
  
  // Perform pattern analysis based on QR type
  if (isUPI) {
    result.analysis.pattern_score = patternAnalysisUPI(qrText);
    
    // Check for suspicious UPI patterns
    const suspiciousUPITerms = ['verify', 'kyc', 'confirm', 'validate', 'update', 'block', 'unblock'];
    result.analysis.checks.is_suspicious_upi = suspiciousUPITerms.some(term => 
      qrText.toLowerCase().includes(term)
    );
    
    if (result.analysis.checks.is_suspicious_upi) {
      result.reasons.push('Contains suspicious terms for UPI payment');
    }
    
    // Extract UPI details for further analysis
    const upiInfo = extractUPIInfo(qrText);
    if (!upiInfo || !upiInfo.valid) {
      result.analysis.pattern_score += 30;
      result.reasons.push('Invalid UPI format or missing required parameters');
    }
  } else if (isURL) {
    result.analysis.pattern_score = patternAnalysisURL(qrText);
    
    // Check for non-secure HTTP
    if (qrText.startsWith('http://')) {
      result.analysis.pattern_score += 20;
      result.reasons.push('Non-secure HTTP connection');
    }
    
    // Check for suspicious URL patterns
    const suspiciousURLTerms = ['login', 'signin', 'account', 'password', 'bank', 'secure', 'verify'];
    result.analysis.checks.is_suspicious_url = suspiciousURLTerms.some(term => 
      qrText.toLowerCase().includes(term)
    );
    
    if (result.analysis.checks.is_suspicious_url) {
      result.reasons.push('URL contains potentially sensitive terms');
    }
    
    // Check for URL shorteners
    if (qrText.includes('bit.ly') || qrText.includes('tinyurl') || qrText.includes('goo.gl')) {
      result.analysis.pattern_score += 25;
      result.reasons.push('Uses URL shortener which may mask actual destination');
    }
  } else {
    // Plain text QR code
    result.analysis.pattern_score = patternAnalysisText(qrText);
  }
  
  // Check for suspicious keywords that apply to any QR type
  const generalSuspiciousTerms = ['urgent', 'immediate', 'warning', 'alert', 'action required', 'suspended'];
  result.analysis.checks.contains_suspicious_keywords = generalSuspiciousTerms.some(term => 
    qrText.toLowerCase().includes(term)
  );
  
  if (result.analysis.checks.contains_suspicious_keywords) {
    result.reasons.push('Contains urgent or alarming language');
  }
  
  // Calculate final risk score
  result.analysis.heuristic_score = Math.min(100, Math.max(0, 
    result.analysis.pattern_score + 
    (result.analysis.checks.is_suspicious_upi ? 40 : 0) +
    (result.analysis.checks.is_suspicious_url ? 35 : 0) +
    (result.analysis.checks.contains_suspicious_keywords ? 30 : 0)
  ));
  
  // Assign overall risk score
  result.risk_score = result.analysis.heuristic_score;
  
  // Determine risk level
  if (result.risk_score >= 70) {
    result.risk_level = 'High';
  } else if (result.risk_score >= 40) {
    result.risk_level = 'Medium';
  } else {
    result.risk_level = 'Low';
  }
  
  // If no specific issues found but it's a URL, add baseline caution
  if (result.reasons.length === 0 && isURL) {
    result.reasons.push('No specific issues detected, but always verify URL destinations');
  }
  
  // If no reasons at all, add a default message
  if (result.reasons.length === 0) {
    if (isUPI) {
      result.reasons.push('No specific issues detected in UPI QR code');
    } else {
      result.reasons.push('No specific issues detected');
    }
  }
  
  // Calculate processing time
  result.latency_ms = Date.now() - startTime;
  
  return result;
}

// Pattern analysis for UPI QR codes
function patternAnalysisUPI(qrText: string): number {
  let score = 0;
  
  // Check if basic UPI parameters are present
  const hasPayee = qrText.includes('pa=');
  const hasPayeeName = qrText.includes('pn=');
  
  if (!hasPayee) {
    score += 40; // Critical parameter missing
  }
  
  if (!hasPayeeName) {
    score += 15; // Important but not critical
  }
  
  // Check for unusual parameters in UPI QR
  const unusualParams = ['url=', 'redirect=', 'method='];
  for (const param of unusualParams) {
    if (qrText.includes(param)) {
      score += 30;
      break;
    }
  }
  
  return score;
}

// Pattern analysis for URL QR codes
function patternAnalysisURL(qrText: string): number {
  let score = 0;
  
  // Check for IP addresses instead of domain names
  const ipAddressPattern = /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
  if (ipAddressPattern.test(qrText)) {
    score += 40;
  }
  
  // Check for excessive subdomains
  const parts = new URL(qrText).hostname.split('.');
  if (parts.length > 3) {
    score += 15;
  }
  
  // Check for suspicious TLDs
  const suspiciousTLDs = ['.tk', '.xyz', '.info', '.pw'];
  const tld = '.' + parts[parts.length - 1];
  if (suspiciousTLDs.includes(tld)) {
    score += 20;
  }
  
  // Look for data exfiltration via URL parameters
  if (qrText.includes('email=') || qrText.includes('phone=') || qrText.includes('id=')) {
    score += 25;
  }
  
  return score;
}

// Pattern analysis for plain text QR codes
function patternAnalysisText(qrText: string): number {
  let score = 0;
  
  // Check for sensitive patterns in plain text
  if (qrText.match(/\b\d{10,16}\b/)) {
    score += 40; // Possible card number or phone number
  }
  
  if (qrText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/)) {
    score += 20; // Contains email address
  }
  
  // Check for secret codes or OTPs
  if (qrText.match(/\bOTP\b|\bcode\b|\bpin\b|\bpassword\b|\bsecret\b/i)) {
    score += 30;
  }
  
  return score;
}

export function extractUPIInfo(qrText: string): any {
  if (!qrText.startsWith('upi://')) {
    return null;
  }
  
  try {
    // Parse UPI parameters
    const params = new URLSearchParams(qrText.substring(qrText.indexOf('?')));
    
    // Extract key parameters
    const pa = params.get('pa'); // Payee address (UPI ID)
    const pn = params.get('pn'); // Payee name
    const am = params.get('am'); // Amount
    const tn = params.get('tn'); // Transaction note
    const cu = params.get('cu'); // Currency
    
    // Check if UPI ID is valid
    const valid = !!pa && pa.includes('@');
    
    if (!valid) {
      return null;
    }
    
    const result = {
      pa,
      pn: pn || '',
      am: am ? parseFloat(am) : undefined,
      tn: tn || '',
      cu: cu || 'INR',
      valid
    };
    
    return result;
  } catch (error) {
    console.error('Error extracting UPI info:', error);
    return null;
  }
}