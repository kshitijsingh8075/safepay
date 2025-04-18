/**
 * Fraud Detection Routes
 * This file registers routes related to UPI fraud detection and transaction risk scoring
 */

import { Express } from 'express';
import { checkUpiRisk, analyzeMessage, scoreTransaction, runFraudAnalysis, fraudDetectionHealth } from '../services/fraud-detection';

export function registerFraudDetectionRoutes(app: Express): void {
  console.log('[routes] Registering Fraud Detection Routes...');

  // Health check endpoint
  app.get('/api/fraud-detection/health', fraudDetectionHealth);

  // UPI risk check endpoint
  app.post('/api/fraud-detection/check-upi', checkUpiRisk);

  // Message analysis endpoint
  app.post('/api/fraud-detection/analyze-message', analyzeMessage);

  // Transaction risk scoring endpoint
  app.post('/api/fraud-detection/score-transaction', scoreTransaction);

  // Run fraud analysis (admin only)
  app.post('/api/fraud-detection/run-analysis', runFraudAnalysis);

  console.log('[fraud-detection] ✅ Fraud detection routes registered');
}