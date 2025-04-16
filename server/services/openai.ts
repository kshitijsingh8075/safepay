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
    
    return JSON.parse(response.choices[0].message.content);
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
    
    return response.choices[0].message.content;
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
    
    return JSON.parse(response.choices[0].message.content);
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
    
    return JSON.parse(response.choices[0].message.content);
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
    
    return response.choices[0].message.content;
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
    
    return JSON.parse(response.choices[0].message.content);
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
                    Identify pressure tactics, threats, requests for personal information or money transfers.`
        },
        {
          role: "user",
          content: `Analyze this call transcript for signs of a financial scam: "${transcript}"`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      is_scam: false,
      confidence: 0.5,
      scam_indicators: [],
      recommendation: "Unable to analyze with AI, proceed with caution"
    };
  }
}

/**
 * Transcribe audio to text using OpenAI Whisper
 */
export async function transcribeAudio(audioBuffer: Buffer) {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: new File([audioBuffer], "audio.mp3", { type: "audio/mp3" }),
      model: "whisper-1",
    });
    
    return transcription.text;
  } catch (error) {
    console.error("OpenAI API error:", error);
    return null;
  }
}

export default openai;