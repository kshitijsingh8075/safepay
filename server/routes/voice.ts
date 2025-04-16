import { Express, Request, Response } from 'express';
import { processVoiceCommand, analyzeCommandRisk, sanitizeVoiceCommand, createVoiceSession, getVoiceSession } from '../services/voice-processing';
import { generateSessionId } from '../utils';

/**
 * Register voice processing routes to the Express server
 * @param app Express application
 */
export function registerVoiceRoutes(app: Express) {
  // Process voice command API endpoint
  app.post('/api/process-voice', async (req: Request, res: Response) => {
    try {
      const { command, language = 'en-US', session = null } = req.body;
      
      if (!command || typeof command !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: 'Missing or invalid command'
        });
      }
      
      // Sanitize user input
      const sanitizedCommand = sanitizeVoiceCommand(command);
      
      // Check if session exists
      const sessionId = session ? session.toString() : generateSessionId();
      const existingSession = getVoiceSession(sessionId);
      
      // Process command
      const action = await processVoiceCommand(sanitizedCommand);
      
      // Analyze command for risk
      const riskAnalysis = await analyzeCommandRisk(sanitizedCommand);
      
      // Create session for this request
      createVoiceSession(sessionId, {
        timestamp: Date.now(),
        command: sanitizedCommand,
        action,
        risk: riskAnalysis
      });
      
      // Return results
      res.json({
        status: 'success',
        command: sanitizedCommand,
        action,
        risk_score: riskAnalysis.score,
        fraud_type: riskAnalysis.type,
        session_id: sessionId
      });
    } catch (error) {
      console.error('Voice processing error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to process voice command'
      });
    }
  });
}