import { Express, Request } from 'express';
import { storage } from '../storage';
import { analyzeVoiceTranscript } from '../services/openai';
import { ScamType } from '../../shared/schema';

/**
 * Helper function to map a string scam type to the ScamType enum
 * @param scamTypeStr The string representation of scam type
 * @returns The corresponding ScamType enum value
 */
function mapToScamType(scamTypeStr?: string): ScamType {
  if (!scamTypeStr) return ScamType.Unknown;
  
  const lowerType = scamTypeStr.toLowerCase();

  if (lowerType.includes('bank')) return ScamType.Banking;
  if (lowerType.includes('lottery')) return ScamType.Lottery;
  if (lowerType.includes('kyc') || lowerType.includes('verification')) return ScamType.KYC;
  if (lowerType.includes('refund')) return ScamType.Refund;
  if (lowerType.includes('phish')) return ScamType.Phishing;
  if (lowerType.includes('reward') || lowerType.includes('prize')) return ScamType.Reward;
  
  return ScamType.Unknown;
}

// Define the type for analyzeVoiceTranscript response
interface VoiceAnalysisResult {
  is_scam: boolean;
  confidence: number;
  scam_type?: string;
  scam_indicators?: string[];
}

// Define the type for our analysis object
interface ScamAnalysis {
  is_scam: boolean;
  confidence: number;
  scam_type: ScamType;
  indicators: string[]; // Using string[] for indicators
}

/**
 * Register voice check related routes
 * @param app Express application
 */
export function registerVoiceCheckRoutes(app: Express): void {
  /**
   * Process voice command for fraud detection
   */
  app.post('/api/process-voice', async (req: Request, res) => {
    try {
      const { command, language = 'en-US', session } = req.body;
      
      if (!command) {
        return res.status(400).json({
          status: 'error',
          message: 'Voice command is required'
        });
      }

      // Basic action detection
      const action = determineAction(command);
      
      // Try to use OpenAI for enhanced analysis if available
      let analysis: ScamAnalysis = { 
        is_scam: false, 
        confidence: 0.5, 
        scam_type: ScamType.Unknown,
        indicators: []
      };
      
      try {
        const aiAnalysis = await analyzeVoiceTranscript(command);
        if (aiAnalysis) {
          analysis = {
            is_scam: aiAnalysis.is_scam,
            confidence: aiAnalysis.confidence,
            scam_type: mapToScamType(aiAnalysis.scam_type),
            indicators: aiAnalysis.scam_indicators || []
          };
        }
      } catch (error) {
        console.error('Error with AI voice analysis:', error);
        // Fall back to basic detection if AI fails
        analysis = performBasicScamDetection(command) as ScamAnalysis;
      }
      
      // We'll save the voice check if we have a userId in the request body
      if (req.body.userId) {
        try {
          await storage.saveChatMessage(parseInt(req.body.userId), {
            role: 'user',
            content: `Voice check: "${command}"`
          });
          
          await storage.saveChatMessage(parseInt(req.body.userId), {
            role: 'assistant',
            content: `Analysis: ${analysis.is_scam ? 'Potential scam detected' : 'No scam detected'} 
                      (Confidence: ${Math.round(analysis.confidence * 100)}%)
                      ${analysis.indicators.length > 0 ? 'Indicators: ' + analysis.indicators.join(', ') : ''}`
          });
        } catch (err) {
          console.error('Error saving voice check to chat:', err);
        }
      }
      
      res.json({
        status: 'success',
        command,
        action,
        risk_score: analysis.confidence,
        is_scam: analysis.is_scam,
        scam_type: analysis.scam_type,
        indicators: analysis.indicators
      });
    } catch (error) {
      console.error('Error in process-voice:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  });
}

/**
 * Determine action from voice command
 * @param command Voice command text
 * @returns Inferred action
 */
function determineAction(command: string): string {
  const lowerCommand = command.toLowerCase();
  
  if (lowerCommand.includes('send') || lowerCommand.includes('pay') || lowerCommand.includes('transfer')) {
    return 'payment';
  }
  
  if (lowerCommand.includes('check') || lowerCommand.includes('verify')) {
    return 'verification';
  }
  
  if (lowerCommand.includes('history') || lowerCommand.includes('transactions')) {
    return 'history';
  }
  
  if (lowerCommand.includes('help') || lowerCommand.includes('support')) {
    return 'help';
  }
  
  return 'unknown';
}

/**
 * Perform basic scam detection on a voice command
 * @param command Voice command text
 * @returns Basic analysis result
 */
function performBasicScamDetection(command: string): { 
  is_scam: boolean; 
  confidence: number; 
  scam_type: ScamType;
  indicators: string[];
} {
  const lowerCommand = command.toLowerCase();
  const indicators: string[] = [];
  
  // Common scam phrases
  const scamPhrases = [
    { phrase: 'verify your account', indicator: 'Account verification request' },
    { phrase: 'suspicious activity', indicator: 'Mentioning suspicious activity' },
    { phrase: 'password', indicator: 'Password request' },
    { phrase: 'pin', indicator: 'PIN request' },
    { phrase: 'otp', indicator: 'OTP request' },
    { phrase: 'urgent', indicator: 'Creating urgency' },
    { phrase: 'immediately', indicator: 'Creating urgency' },
    { phrase: 'your account will be', indicator: 'Account threat' },
    { phrase: 'bank', indicator: 'Bank reference' },
    { phrase: 'offer', indicator: 'Promotion or offer' },
    { phrase: 'prize', indicator: 'Prize mention' }
  ];
  
  // Check for scam indicators
  scamPhrases.forEach(item => {
    if (lowerCommand.includes(item.phrase)) {
      indicators.push(item.indicator);
    }
  });
  
  // Determine scam type and confidence
  let scamType = ScamType.Unknown;
  
  if (indicators.length >= 3) {
    if (lowerCommand.includes('bank') || lowerCommand.includes('account')) {
      scamType = ScamType.Banking;
    } else if (lowerCommand.includes('offer') || lowerCommand.includes('prize')) {
      scamType = ScamType.Reward;
    } else {
      scamType = ScamType.Phishing;
    }
  }
  
  return {
    is_scam: indicators.length >= 3,
    confidence: Math.min(0.4 + (indicators.length * 0.1), 0.95),
    scam_type: scamType,
    indicators
  };
}