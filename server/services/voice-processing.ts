import OpenAI from 'openai';
import { sanitizeString } from '../utils';

if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY environment variable not set. Voice processing might not work correctly.');
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store active voice sessions for security
const voiceSessions: Map<string, { timestamp: number, data: any }> = new Map();

/**
 * Voice input sanitization to prevent injection attacks
 */
export function sanitizeVoiceCommand(text: string): string {
  // Remove any potential injection patterns
  const sanitized = sanitizeString(text);
  
  // Replace sensitive characters with placeholders
  return sanitized
    .replace(/\$/g, '[dollar]')
    .replace(/`/g, '[backtick]')
    .replace(/'/g, '[quote]')
    .replace(/"/g, '[dquote]');
}

/**
 * Process voice command to determine intent and action
 */
export async function processVoiceCommand(text: string): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `Convert voice commands to UPI actions:
          - "Send 500 to john@upi" → {"action": "payment", "amount": 500, "upi": "john@upi"}
          - "Check recent transactions" → {"action": "history"}
          - "Check if xyz@upi is safe" → {"action": "verify_upi", "upi": "xyz@upi"}
          Respond only with JSON`
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the response
    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : { action: "unknown" };
  } catch (error) {
    console.error('Error processing voice command:', error);
    return { action: "error", message: "Failed to process command" };
  }
}

/**
 * Analyze voice command for potential fraud indicators
 */
export async function analyzeCommandRisk(command: string): Promise<{ score: number, type: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `Analyze for UPI fraud indicators. Consider:
          - Urgency language ("urgent", "immediately")
          - Suspicious recipients (govt agencies requesting direct payment)
          - Unusual amounts
          - Requests to verify personal info
          
          Respond with:
          {"score": 0-1, "type": "phishing|fake_merchant|social_engineering|unusual_payment|unknown"}`
        },
        {
          role: "user",
          content: `Command: ${command}`
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the response
    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : { score: 0, type: "unknown" };
  } catch (error) {
    console.error('Error analyzing voice command risk:', error);
    return { score: 0.5, type: "unknown" };
  }
}

/**
 * Create session token for voice processing
 */
export function createVoiceSession(sessionId: string, data: any): void {
  // Set a new session with 15-minute expiry
  voiceSessions.set(sessionId, {
    timestamp: Date.now(),
    data
  });
  
  // Cleanup old sessions every 100 requests
  if (voiceSessions.size % 100 === 0) {
    cleanupExpiredSessions();
  }
}

/**
 * Get voice session data if valid
 */
export function getVoiceSession(sessionId: string): any | null {
  const session = voiceSessions.get(sessionId);
  
  if (!session) {
    return null;
  }
  
  // Check if session is expired (15 min)
  if (Date.now() - session.timestamp > 15 * 60 * 1000) {
    voiceSessions.delete(sessionId);
    return null;
  }
  
  return session.data;
}

/**
 * Cleanup expired voice sessions
 */
function cleanupExpiredSessions(): void {
  const now = Date.now();
  
  for (const [sessionId, session] of voiceSessions.entries()) {
    if (now - session.timestamp > 15 * 60 * 1000) {
      voiceSessions.delete(sessionId);
    }
  }
}