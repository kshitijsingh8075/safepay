import { URL } from 'url';
import { log } from '../vite';

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

// Suspicious keywords for different contexts
const SUSPICIOUS_UPI_KEYWORDS = [
  'verify', 'kyc', 'urgent', 'block', 'expire', 'alert', 'validate',
  'update', 'confirm', 'warning', 'security', 'attention', 'check',
  'activate', 'deactivate', 'mandatory', 'important'
];

const SUSPICIOUS_URL_KEYWORDS = [
  'login', 'signin', 'account', 'password', 'secure', 'banking', 'verify',
  'verification', 'authorize', 'authenticate', 'security', 'update',
  'confirm', 'wallet', 'payment', 'transaction', 'access'
];

const SUSPICIOUS_UPI_DOMAINS = [
  'verify', 'verification', 'alert', 'secure', 'update', 'block',
  'security', 'bank', 'activate', 'confirm', 'official', 'support',
  'refund', 'return', 'government', 'kyc', 'check'
];

const URL_SHORTENERS = [
  'bit.ly', 'goo.gl', 'tinyurl.com', 't.co', 'is.gd', 'cli.gs', 'ow.ly',
  'rebrand.ly', 'tiny.cc', 'cutt.ly', 'shorturl.at', 'buff.ly'
];

const SAFE_UPI_HANDLES = [
  'ybl', 'okaxis', 'okicici', 'paytm', 'apl', 'ibl', 'upi', 'kotak',
  'axisbank', 'sbi', 'hdfc', 'icici', 'jupiteraxis', 'fampay', 'yespay'
];

export function analyzeQRText(qrText: string): QRAnalysisResult {
  const startTime = Date.now();
  
  // Initial result structure
  const result: QRAnalysisResult = {
    risk_score: 0,
    risk_level: 'Low',
    reasons: [],
    analysis: {
      heuristic_score: 0,
      pattern_score: 0,
      checks: {
        is_upi: false,
        is_url: false,
        is_suspicious_upi: false,
        is_suspicious_url: false,
        contains_suspicious_keywords: false
      }
    },
    qr_type: 'text',
    latency_ms: 0,
    is_fallback: true
  };
  
  // Basic classification
  if (qrText.startsWith('upi://')) {
    result.qr_type = 'upi';
    result.analysis.checks.is_upi = true;
    
    // Extract UPI ID (pa parameter)
    const paMatch = qrText.match(/pa=([^&]+)/);
    const pnMatch = qrText.match(/pn=([^&]+)/);
    const amMatch = qrText.match(/am=([^&]+)/);
    
    if (paMatch) {
      const upiId = decodeURIComponent(paMatch[1]);
      
      // Extract VPA parts (username@handle)
      if (upiId.includes('@')) {
        const [username, handle] = upiId.split('@');
        
        // Check for suspicious username patterns
        if (SUSPICIOUS_UPI_KEYWORDS.some(kw => username.toLowerCase().includes(kw))) {
          result.analysis.checks.is_suspicious_upi = true;
          result.reasons.push(`Suspicious UPI username: ${username}`);
          result.analysis.heuristic_score += 25;
        }
        
        // Check if handle is in the safe list
        if (!SAFE_UPI_HANDLES.some(h => handle.toLowerCase() === h.toLowerCase())) {
          result.analysis.heuristic_score += 10;
          result.reasons.push(`Unknown UPI handle: ${handle}`);
        }
        
        // Check for suspicious domains
        if (SUSPICIOUS_UPI_DOMAINS.some(d => handle.toLowerCase().includes(d))) {
          result.analysis.checks.is_suspicious_upi = true;
          result.reasons.push(`Suspicious UPI handle: ${handle}`);
          result.analysis.heuristic_score += 30;
        }
      }
    }
    
    // Check for missing elements
    if (!paMatch) {
      result.analysis.heuristic_score += 15;
      result.reasons.push("Missing UPI ID (pa parameter)");
    }
    
    if (!pnMatch) {
      result.analysis.heuristic_score += 10;
      result.reasons.push("Missing payee name (pn parameter)");
    }
    
    // Check for suspicious payee name
    if (pnMatch) {
      const payeeName = decodeURIComponent(pnMatch[1]);
      if (SUSPICIOUS_UPI_KEYWORDS.some(kw => payeeName.toLowerCase().includes(kw))) {
        result.analysis.checks.contains_suspicious_keywords = true;
        result.reasons.push(`Suspicious payee name: ${payeeName}`);
        result.analysis.heuristic_score += 20;
      }
    }
    
    // Check transaction note if present
    const tnMatch = qrText.match(/tn=([^&]+)/);
    if (tnMatch) {
      const transactionNote = decodeURIComponent(tnMatch[1]);
      if (SUSPICIOUS_UPI_KEYWORDS.some(kw => transactionNote.toLowerCase().includes(kw))) {
        result.analysis.checks.contains_suspicious_keywords = true;
        result.reasons.push(`Suspicious transaction note: ${transactionNote}`);
        result.analysis.heuristic_score += 25;
      }
    }
    
    // Check for amount patterns that might indicate scams
    if (amMatch) {
      const amount = parseFloat(amMatch[1]);
      if (amount === 1 || amount === 0 || amount === 0.01) {
        result.analysis.heuristic_score += 15;
        result.reasons.push(`Suspicious amount: ₹${amount} - often used in scams`);
      }
    }
    
    // Additional pattern matching for UPI QR
    result.analysis.pattern_score = patternAnalysisUPI(qrText);
    
  } else if (qrText.startsWith('http://') || qrText.startsWith('https://')) {
    // URL analysis
    result.qr_type = 'url';
    result.analysis.checks.is_url = true;
    
    try {
      const url = new URL(qrText);
      const domain = url.hostname;
      const path = url.pathname;
      
      // Check for IP address instead of domain
      if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
        result.analysis.checks.is_suspicious_url = true;
        result.reasons.push("IP address used instead of domain name");
        result.analysis.heuristic_score += 35;
      }
      
      // Check for shortened URLs
      if (URL_SHORTENERS.some(shortener => domain.includes(shortener))) {
        result.analysis.checks.is_suspicious_url = true;
        result.reasons.push(`URL shortener detected: ${domain}`);
        result.analysis.heuristic_score += 30;
      }
      
      // Check for HTTP instead of HTTPS
      if (qrText.startsWith('http://')) {
        result.analysis.heuristic_score += 20;
        result.reasons.push("Non-secure HTTP connection");
      }
      
      // Check for suspicious keywords in domain/path
      if (SUSPICIOUS_URL_KEYWORDS.some(kw => domain.toLowerCase().includes(kw) || path.toLowerCase().includes(kw))) {
        result.analysis.checks.contains_suspicious_keywords = true;
        result.reasons.push(`Suspicious keywords in URL`);
        result.analysis.heuristic_score += 25;
      }
      
      // Check domain characteristics
      const domainParts = domain.split('.');
      if (domainParts.length > 3) {
        result.analysis.heuristic_score += 15;
        result.reasons.push("Excessive subdomains");
      }
      
      // Additional pattern matching for URL QR
      result.analysis.pattern_score = patternAnalysisURL(qrText);
      
    } catch (error) {
      // Invalid URL format
      result.analysis.heuristic_score += 40;
      result.reasons.push("Invalid URL format");
    }
  } else {
    // Plain text analysis
    result.qr_type = 'text';
    
    // Check for suspicious patterns in plain text
    if (SUSPICIOUS_UPI_KEYWORDS.some(kw => qrText.toLowerCase().includes(kw))) {
      result.analysis.checks.contains_suspicious_keywords = true;
      result.reasons.push("Contains suspicious keywords");
      result.analysis.heuristic_score += 20;
    }
    
    // Simple pattern matching for text
    result.analysis.pattern_score = patternAnalysisText(qrText);
  }
  
  // Calculate final risk score
  const baseScore = Math.min(100, Math.max(0, 
    result.analysis.heuristic_score + result.analysis.pattern_score));
  
  result.risk_score = Math.round(baseScore);
  
  // Determine risk level
  if (result.risk_score >= 70) {
    result.risk_level = 'High';
  } else if (result.risk_score >= 30) {
    result.risk_level = 'Medium';
  } else {
    result.risk_level = 'Low';
  }
  
  // Measure processing time
  result.latency_ms = Date.now() - startTime;
  
  // Log the analysis
  log(`Direct QR analysis: ${qrText} → ${result.risk_score}% (${result.risk_level})`, 'qrscan');
  
  return result;
}

// Pattern analysis functions for different QR types
function patternAnalysisUPI(qrText: string): number {
  let score = 0;
  
  // Check for unusual parameter combinations
  const hasPA = qrText.includes('pa=');
  const hasPN = qrText.includes('pn=');
  const hasAM = qrText.includes('am=');
  const hasTN = qrText.includes('tn=');
  const hasMC = qrText.includes('mc=');
  
  // Legitimate UPIs usually have pa, pn and am
  if (!hasPA || !hasPN) {
    score += 15;
  }
  
  // Check for unusual parameter count
  const paramCount = (qrText.match(/&/g) || []).length + 1;
  if (paramCount > 7) {
    score += 10; // Unusual number of parameters
  }
  
  // Check for unusual UPI structure
  if (qrText.includes('verify') || qrText.includes('confirm')) {
    score += 20;
  }
  
  // Urgent/time-sensitive language is a red flag
  if (qrText.toLowerCase().includes('urgent') || 
      qrText.toLowerCase().includes('immediate') ||
      qrText.toLowerCase().includes('expir')) {
    score += 25;
  }
  
  return score;
}

function patternAnalysisURL(qrText: string): number {
  let score = 0;
  
  // Check URL length (very long URLs can be suspicious)
  if (qrText.length > 100) {
    score += 10;
  }
  
  // Check for excessive query parameters
  const queryParamCount = (qrText.match(/[?&][^=&?]+=/g) || []).length;
  if (queryParamCount > 5) {
    score += 15; // Lots of query params can indicate tracking or phishing
  }
  
  // Check for unusual characters in domain
  try {
    const url = new URL(qrText);
    const domain = url.hostname;
    
    if (/[^a-zA-Z0-9.-]/.test(domain)) {
      score += 20; // Non-standard characters in domain
    }
    
    // Domain length (very long domains can be suspicious)
    if (domain.length > 30) {
      score += 15;
    }
    
    // Check for domains that try to look like others
    if (domain.includes('paypa1') || domain.includes('g00gle') || 
        domain.includes('amaz0n') || domain.includes('faceb00k')) {
      score += 40;
    }
  } catch (error) {
    // Invalid URL will already be caught in main analysis
  }
  
  return score;
}

function patternAnalysisText(qrText: string): number {
  let score = 0;
  
  // Check for patterns that might indicate scams in plain text
  if (qrText.toLowerCase().includes('account') && qrText.toLowerCase().includes('verify')) {
    score += 25;
  }
  
  if (qrText.toLowerCase().includes('password') || qrText.toLowerCase().includes('pin')) {
    score += 30;
  }
  
  if (qrText.toLowerCase().includes('bank') && qrText.toLowerCase().includes('urgent')) {
    score += 35;
  }
  
  // Check for excessive use of capital letters (shouting)
  const capitalRatio = (qrText.match(/[A-Z]/g) || []).length / qrText.length;
  if (capitalRatio > 0.7 && qrText.length > 10) {
    score += 20;
  }
  
  return score;
}

// Function to extract UPI information from a UPI QR code
export function extractUPIInfo(qrText: string): any {
  if (!qrText.startsWith('upi://')) {
    return null;
  }
  
  try {
    const result: any = {
      pa: null,
      pn: null,
      am: null,
      tn: null,
      valid: false
    };
    
    // Extract parameters
    const paMatch = qrText.match(/pa=([^&]+)/);
    const pnMatch = qrText.match(/pn=([^&]+)/);
    const amMatch = qrText.match(/am=([^&]+)/);
    const tnMatch = qrText.match(/tn=([^&]+)/);
    
    if (paMatch) {
      result.pa = decodeURIComponent(paMatch[1]);
      
      // Extract VPA parts (username@handle)
      if (result.pa.includes('@')) {
        const [username, handle] = result.pa.split('@');
        result.username = username;
        result.handle = handle;
      }
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
    
    // Check if it's valid
    result.valid = !!result.pa;
    
    return result;
  } catch (error) {
    log(`Error extracting UPI info: ${error}`, 'qrscan');
    return null;
  }
}