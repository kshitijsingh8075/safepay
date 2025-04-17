import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const GPT_MODEL = "gpt-4o";

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is not defined in environment variables");
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

/**
 * Safely parse JSON with fallback for null response
 */
function safeJsonParse(jsonString: string | null | undefined): any {
  if (!jsonString) return {};
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return {};
  }
}

/**
 * Enhanced fraud detection using OpenAI
 * Analyzes transaction context for potential fraud
 */
export async function analyzeTransactionContextWithAI(description: string, amount: number, recipient: string) {
  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a fraud detection expert analyzing UPI transactions in India. Identify potential fraudulent transactions based on transaction patterns, abnormal amounts, suspicious recipients, and unusual descriptions. Focus on common UPI scams in India."
        },
        {
          role: "user",
          content: `Analyze this payment: Amount: ₹${amount}, To: ${recipient}, Description: "${description}"`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    return safeJsonParse(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      risk_level: "medium",
      confidence: 0.5,
      suspicious_factors: ["Unable to analyze transaction with AI"],
      recommendation: "Proceed with standard security checks"
    };
  }
}

/**
 * Generate personalized security alerts for users
 */
export async function generateSecurityAlert(fraudType: string, riskLevel: number, transaction: any) {
  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        {
          role: "system",
          content: "Generate a helpful, clear security alert for a UPI payment app user. Be concise, informative, and non-alarming while conveying the necessary caution. Include what action the user should take."
        },
        {
          role: "user",
          content: `Create a security alert for a transaction with risk level ${riskLevel}/100. 
                   Fraud type: ${fraudType}. Amount: ₹${transaction.amount}. 
                   Recipient: ${transaction.recipient}.`
        }
      ]
    });
    
    return response.choices[0].message.content || "Security Alert: Please verify this transaction's details before proceeding.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return `Security Alert: This transaction to ${transaction.recipient} for ₹${transaction.amount} has unusual characteristics. Please verify before proceeding.`;
  }
}

/**
 * Advanced UPI ID validation to detect typosquatting and fake IDs
 */
export async function validateUpiIdSafety(upiId: string) {
  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an expert at detecting typosquatting and malicious UPI IDs. 
                    Common legitimate UPI handles include @okaxis (Axis Bank), @okicici (ICICI Bank), 
                    @oksbi (SBI), @yesbank, @ybl (PhonePe), @paytm, @fbl (FreeCharge).
                    Analyze for slight misspellings, suspicious handles, or other red flags.`
        },
        {
          role: "user",
          content: `Analyze this UPI ID for potential typosquatting or phishing: ${upiId}`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    return safeJsonParse(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      is_suspicious: false,
      confidence: 0.5,
      flags: [],
      recommendation: "Unable to analyze with AI, proceed with standard checks"
    };
  }
}

/**
 * Analyze chat message sentiment to detect urgency or distress
 */
export async function analyzeChatSentiment(message: string) {
  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        {
          role: "system",
          content: "Analyze the emotional state and urgency of this message. Detect if the user appears to be under stress, coercion, or showing signs they might be victim of a scam."
        },
        {
          role: "user",
          content: message
        }
      ],
      response_format: { type: "json_object" }
    });
    
    return safeJsonParse(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      sentiment: "neutral",
      urgency: "low",
      distress_indicators: [],
      confidence: 0.5
    };
  }
}

/**
 * Generate personalized security tips based on user behavior
 */
export async function generateSecurityTip(userActivity: any) {
  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        {
          role: "system",
          content: "Generate a helpful security tip for a UPI payment app user. Be concise, practical and actionable."
        },
        {
          role: "user",
          content: `The user has these recent activities: ${JSON.stringify(userActivity)}. 
                   Generate a relevant security tip based on their behavior.`
        }
      ]
    });
    
    return response.choices[0].message.content || "Security Tip: Always verify the recipient's UPI ID before confirming any transaction.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "Security Tip: Always verify the recipient's UPI ID before confirming any transaction. Never share your UPI PIN with anyone.";
  }
}

/**
 * Analyze QR code images for signs of tampering
 */
export async function analyzeQRCodeImage(base64Image: string) {
  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        {
          role: "system",
          content: "Analyze this QR code image for signs of tampering or manipulation. Look for overlaid codes, irregular patterns, or signs that the QR code has been modified or placed on top of another code."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Is this QR code legitimate or does it show signs of tampering?" },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Image}` }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });
    
    return safeJsonParse(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      is_tampered: false,
      confidence: 0.5,
      observations: ["Unable to analyze image with AI"],
      recommendation: "Proceed with standard security checks"
    };
  }
}

/**
 * Analyze voice transcripts for potential scam indicators
 */
export async function analyzeVoiceTranscript(transcript: string) {
  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an expert at detecting phone scams from transcripts, particularly those targeting Indian consumers.
                    Common scam patterns include impersonating bank officials, government agencies, or creating false urgency.
                    Identify pressure tactics, threats, requests for personal information or money transfers.
                    
                    Known scam types:
                    1. Banking Scam - Impersonating bank officials, claiming account issues
                    2. KYC Verification Scam - Claiming KYC needs updating with urgency
                    3. Refund Scam - Offering fake refunds to collect information
                    4. Government Impersonation - Pretending to be tax, legal, or police authorities
                    5. OTP Scam - Trying to get one-time passwords or verification codes
                    6. Remote Access Scam - Attempting to get remote control of devices
                    7. UPI PIN Scam - Specifically targeting UPI payment PINs
                    
                    Analyze for:
                    - Urgency/pressure tactics
                    - Threats (legal, financial, etc.)
                    - Impersonation of authority
                    - Requests for sensitive information (PINs, passwords, OTPs)
                    - Inconsistencies in story
                    - Emotional manipulation
                    - Reference to unexpected problems or rewards
                    
                    Return JSON with:
                    - is_scam: Boolean indicating if transcript shows scam patterns
                    - confidence: Number from 0.0-1.0 indicating confidence level
                    - scam_type: String indicating the type of scam detected
                    - scam_indicators: Array of specific red flags found
                    - emotions: Object with detected emotions (fear, urgency, etc.)
                    - caller_reputation: Estimation of caller trustworthiness
                    - caller_intent: Analysis of caller's likely intentions
                    - recommendation: String with recommended action
                    `
        },
        {
          role: "user",
          content: `Analyze this call transcript for signs of a financial scam: "${transcript}"`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    return safeJsonParse(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      is_scam: false,
      confidence: 0.5,
      scam_indicators: [],
      recommendation: "Unable to analyze with AI, proceed with caution",
      emotions: {
        urgency: 0,
        fear: 0,
        pressure: 0
      },
      caller_reputation: "unknown",
      caller_intent: "unknown"
    };
  }
}

/**
 * Advanced voice analysis with sentiment, language detection and noise assessment
 * @param transcript The transcript to analyze
 * @param detectedLanguage Optional detected language code
 * @param noiseLevel Optional noise level assessment (0-1)
 */
export async function analyzeVoiceAdvanced(transcript: string, detectedLanguage?: string, noiseLevel?: number) {
  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an advanced voice fraud detection system specializing in UPI payment scams in India.
                    Analyze the provided transcript and additional audio metadata for scam detection.
                    
                    Consider:
                    1. Linguistic patterns typical of Indian scammers (specific terminology, grammar patterns)
                    2. Emotional manipulation techniques (urgency, fear, authority)
                    3. Common UPI/banking scam scripts and deviations
                    4. Caller identity claims vs behavioral indicators
                    5. Cultural context of Indian financial systems
                    
                    Pay special attention to:
                    - UPI-specific terminology (PIN, VPA, handle, QR code)
                    - Bank impersonation patterns
                    - Government authority claims (RBI, tax departments)
                    - Attempts to create urgency or fear
                    - Requests for sensitive information
                    
                    Return detailed scam analysis in JSON format with probability scores.`
        },
        {
          role: "user",
          content: `Analyze this voice call for UPI scam detection:
                   Transcript: "${transcript}"
                   ${detectedLanguage ? `Detected language: ${detectedLanguage}` : ''}
                   ${noiseLevel !== undefined ? `Background noise level: ${noiseLevel}` : ''}
                   
                   Please provide comprehensive analysis of scam likelihood.`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    return safeJsonParse(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI API error during advanced voice analysis:", error);
    return {
      is_scam: false,
      confidence: 0.5,
      scam_indicators: [],
      recommendation: "Error in advanced voice analysis, please use caution"
    };
  }
}

/**
 * Transcribe audio to text using OpenAI Whisper
 */
export async function transcribeAudio(audioBuffer: Buffer) {
  try {
    // Create a temporary file path for the audio
    const tempFilePath = `/tmp/audio-${Date.now()}.mp3`;
    require('fs').writeFileSync(tempFilePath, audioBuffer);
    
    const transcription = await openai.audio.transcriptions.create({
      file: require('fs').createReadStream(tempFilePath),
      model: "whisper-1",
    });
    
    // Clean up the temporary file
    try {
      require('fs').unlinkSync(tempFilePath);
    } catch (cleanupError) {
      console.error('Error cleaning up temp file:', cleanupError);
    }
    
    return transcription.text || "";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "";
  }
}

/**
 * Analyze WhatsApp messages for potential scam indicators
 * @param imageBase64 Base64 encoded image of WhatsApp screenshot (optional)
 * @param description Text description of message content (optional)
 * @returns Analysis results with scam detection
 */
export async function analyzeWhatsAppMessage(imageBase64: string | null, description: string) {
  try {
    // Prepare messages array
    const messages: any[] = [
      {
        role: "system",
        content: "You are an expert in detecting fraudulent messages, scams, and phishing attempts in WhatsApp messages. Analyze the provided content and identify if it's likely to be a scam. Consider common patterns like urgency, threats, suspicious links, requests for money or personal information, grammatical errors, impersonation, and unusual offers. Return your analysis as structured JSON with fields: is_scam (boolean), confidence (number between 0-1), scam_type (string, if is_scam is true), and scam_indicators (array of strings describing the warning signs, if is_scam is true). Return json format output."
      }
    ];

    // Build the prompt based on available inputs
    let userContent = "Please analyze this WhatsApp message for potential scams or fraud. Return the results in JSON format.\n\n";
    
    if (description) {
      userContent += `Message content: "${description}"\n\n`;
    }
    
    // If image is provided, add it as content
    if (imageBase64) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: userContent + "I've also included a screenshot of the WhatsApp message."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      });
    } else {
      // Text-only analysis
      messages.push({
        role: "user",
        content: userContent
      });
    }
    
    const response = await openai.chat.completions.create({
      model: GPT_MODEL, // Using the global model constant
      messages: messages,
      response_format: { type: "json_object" },
    });

    const result = safeJsonParse(response.choices[0].message.content);
    
    return result || {
      is_scam: false,
      confidence: 0.5,
      scam_type: null,
      scam_indicators: []
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Return a default response in case of error
    return {
      is_scam: false,
      confidence: 0.5,
      scam_type: "Unknown",
      scam_indicators: ["Analysis failed due to technical error"]
    };
  }
}

export default openai;