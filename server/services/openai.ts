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
                    Identify pressure tactics, threats, requests for personal information or money transfers.`
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
      recommendation: "Unable to analyze with AI, proceed with caution"
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