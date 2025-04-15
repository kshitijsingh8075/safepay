// Types for scam detection
export type ScamType = 'Fake Products' | 'Phishing' | 'Impersonation' | 'Fraud' | 'Other';

export type VoiceAnalysisResult = {
  risk: 'SAFE' | 'SUSPICIOUS';
  transcript: string;
  scamIndicators: string[];
};

export type MessageAnalysisResult = {
  risk: 'SAFE' | 'SUSPICIOUS';
  extractedText: string;
  scamIndicators: string[];
};

export type ScamReport = {
  upiId: string;
  scamType: ScamType;
  amountLost: number;
  description: string;
  screenshots?: File[];
};

// Common scam indicators that can be useful for educational purposes
export const commonScamIndicators = {
  voice: [
    "Requests for PIN, OTP, or passwords over the phone",
    "Urgency tactics and threats to create panic",
    "Claims to be from a bank or government organization",
    "Offers that sound too good to be true",
    "Pressure to act immediately"
  ],
  message: [
    "Free prize offers or unexpected lottery wins",
    "Shortened URLs that hide the real destination",
    "Urgent requests for personal information",
    "Poor grammar or spelling mistakes",
    "Threatening or fear-based language"
  ]
};

// Function to analyze voice for scam indicators
export function analyzeVoiceForScam(transcript: string): VoiceAnalysisResult {
  // In a real app, this would connect to an AI service
  // For now, we're detecting some common phrases
  const lowerText = transcript.toLowerCase();
  
  const indicators: string[] = [];
  
  if (lowerText.includes("pin") || lowerText.includes("otp") || lowerText.includes("password")) {
    indicators.push("Banks will never ask for your UPI PIN, OTP or passwords over the phone.");
  }
  
  if (lowerText.includes("urgent") || lowerText.includes("immediately") || 
      lowerText.includes("suspicious activity")) {
    indicators.push("Detected urgency tactics and threats to create panic - a common scam technique.");
  }
  
  return {
    risk: indicators.length > 0 ? 'SUSPICIOUS' : 'SAFE',
    transcript,
    scamIndicators: indicators
  };
}

// Function to analyze text messages for scam indicators
export function analyzeMessageForScam(text: string): MessageAnalysisResult {
  const lowerText = text.toLowerCase();
  
  const indicators: string[] = [];
  
  if (lowerText.includes("congratulation") || lowerText.includes("won") || 
      lowerText.includes("prize") || lowerText.includes("free")) {
    indicators.push("Free prize offers are common phishing tactics to trick users into clicking malicious links.");
  }
  
  if (lowerText.includes("bit.ly") || lowerText.includes("tinyurl") || 
      lowerText.includes("click") || lowerText.includes("link")) {
    indicators.push("Shortened URLs hide the real destination and often lead to malware or phishing sites.");
  }
  
  return {
    risk: indicators.length > 0 ? 'SUSPICIOUS' : 'SAFE',
    extractedText: text,
    scamIndicators: indicators
  };
}
