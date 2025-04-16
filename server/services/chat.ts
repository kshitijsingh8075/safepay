import OpenAI from 'openai';

// Initialize the OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define chat message type
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Fraud prevention system prompt
const systemPrompt: ChatMessage = {
  role: 'system',
  content: `You are an AI assistant specializing in preventing and responding to financial fraud, 
  particularly UPI-based scams in India. Your purpose is to help users who may have been scammed 
  or who want to verify potential scams.

  Important guidelines:
  1. Be direct and clear with advice, prioritizing user safety.
  2. For urgent cases where money has been lost, immediately advise calling the national cyber helpline 1930 and contacting their bank.
  3. Provide step-by-step guidance for reporting scams or filing complaints.
  4. Explain safety measures to prevent future scams.
  5. Use simple language that's easy to understand.
  6. Be supportive but stay factual - don't make promises about recovering lost money.
  7. Support both English and Hindi languages.
  8. If the query is not related to fraud, scams, or financial security, politely steer the conversation back to these topics.

  Quick Reply Options to suggest when appropriate:
  - Report UPI Scam
  - How to call 1930
  - How to file an FIR
  - Verify if a link/message is safe
  - Common scam patterns`
};

/**
 * Process a user message and generate an assistant response using OpenAI
 * @param messages Previous chat history
 * @param userMessage New message from the user
 * @returns Assistant's response
 */
export async function getChatResponse(messages: ChatMessage[], userMessage: string): Promise<string> {
  try {
    // Add user message to conversation history
    const updatedMessages: ChatMessage[] = [
      systemPrompt,
      ...messages,
      { role: 'user', content: userMessage }
    ];

    // Generate a completion using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview', // Using GPT-4 Turbo for best performance
      messages: updatedMessages,
      temperature: 0.7,
      max_tokens: 800,
    });

    // Extract and return the assistant's response
    const responseContent = completion.choices[0].message.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
    return responseContent;
  } catch (error) {
    console.error('Error getting chat response:', error);
    return 'Sorry, I\'m having trouble connecting to my knowledge base. Please try again later or contact customer support for immediate assistance.';
  }
}

/**
 * Detect the emergency level of a user message
 * @param message User message
 * @returns Emergency level (high, medium, low)
 */
export async function detectEmergencyLevel(message: string): Promise<'high' | 'medium' | 'low'> {
  try {
    // Emergency keywords indicating money loss or urgent fraud
    const highEmergencyKeywords = [
      'money deducted', 'paise kat gaye', 'paise chale gaye', 'money gone',
      'fraud happened', 'scammed', 'lost money', 'account hacked', 'stolen',
      'unauthorized transaction', 'paisa nikal gaya', 'mere account se paise'
    ];

    // Medium emergency keywords indicating potential scam
    const mediumEmergencyKeywords = [
      'suspicious message', 'strange link', 'verify upi', 'unusual call',
      'asked for otp', 'asked for password', 'verify payment', 'refund message',
      'lottery', 'prize', 'investment scheme', 'doubling money'
    ];

    // Check for high emergency keywords
    for (const keyword of highEmergencyKeywords) {
      if (message.toLowerCase().includes(keyword.toLowerCase())) {
        return 'high';
      }
    }

    // Check for medium emergency keywords
    for (const keyword of mediumEmergencyKeywords) {
      if (message.toLowerCase().includes(keyword.toLowerCase())) {
        return 'medium';
      }
    }

    // Use AI to detect emergency level for more complex cases
    const emergencyDetectionPrompt = `
      You are an AI classifier that analyzes messages for signs of financial fraud emergencies.
      Categorize the following message as "high" (active fraud/money already lost), "medium" (suspicious activity/potential scam), 
      or "low" (general inquiry/no immediate threat).
      
      Message: "${message}"
      
      Reply with only: "high", "medium", or "low"
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Using a smaller model for classification
      messages: [{ role: 'user', content: emergencyDetectionPrompt }],
      temperature: 0.1,
      max_tokens: 10,
    });

    const response = completion.choices[0].message.content?.toLowerCase().trim() || 'low';
    
    if (response.includes('high')) return 'high';
    if (response.includes('medium')) return 'medium';
    return 'low';
  } catch (error) {
    console.error('Error detecting emergency level:', error);
    // Default to medium if there's an error, as a cautionary approach
    return 'medium';
  }
}

/**
 * Generate quick reply suggestions based on the conversation context
 * @param messages Chat history
 * @returns List of suggested quick replies
 */
export async function generateQuickReplies(messages: ChatMessage[]): Promise<string[]> {
  // Default quick replies
  const defaultReplies = [
    'How do I report a UPI scam?',
    'What is the 1930 helpline?',
    'How to recognize a scam message?',
    'What to do if I sent money to a scammer?',
    'How to verify if a link is safe?'
  ];

  // For emergency situations, offer specific quick replies
  const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
  const emergencyLevel = await detectEmergencyLevel(lastUserMessage);

  if (emergencyLevel === 'high') {
    return [
      'Steps to contact my bank immediately',
      'How to call 1930 cyber helpline',
      'How to file a police complaint',
      'How to freeze my account',
      'What details should I provide to authorities?'
    ];
  }

  if (emergencyLevel === 'medium') {
    return [
      'How to check if this is a scam?',
      'Should I respond to this message?',
      'How to verify this sender/website?',
      'What information should I never share?',
      'How to report suspicious activity?'
    ];
  }

  return defaultReplies;
}