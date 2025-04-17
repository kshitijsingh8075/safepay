/**
 * Risk Scoring Engine Service
 * 
 * This service provides transaction risk assessment capabilities using a
 * combination of machine learning techniques, pattern detection, and anomaly detection.
 * 
 * In a production system, this would connect to actual ML models and databases.
 * For this implementation, we simulate the ML functionality while still providing useful results.
 */

import { storage } from '../storage';
import { ScamType } from '@shared/schema';
import { analyzeTransactionContextWithAI } from './openai';

// Define risk score response interface
export interface RiskScoreResponse {
  risk_score: number; // 0-1 where higher is more risky
  risk_factors: RiskFactor[];
  recommendation: string;
  requires_verification: boolean;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  anomaly_score?: number;
  network_risk?: number;
  behavioral_risk?: number;
}

// Risk factor that contributed to the score
export interface RiskFactor {
  type: string;
  description: string;
  impact: number; // 0-1 impact on overall score
}

/**
 * Simulate Isolation Forest anomaly detection for transaction amounts
 * In a real implementation, this would use a trained model
 */
function detectAmountAnomaly(amount: number, userHistory: any[]): number {
  // If no history, consider a moderate anomaly
  if (!userHistory || userHistory.length === 0) return 0.5;
  
  // Calculate mean and standard deviation of historical amounts
  const amounts = userHistory.map(t => t.amount);
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const stdDev = Math.sqrt(
    amounts.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / amounts.length
  );
  
  // Calculate Z-score (how many standard deviations from mean)
  const zScore = stdDev > 0 ? Math.abs(amount - mean) / stdDev : 0;
  
  // Convert Z-score to anomaly score (0-1)
  // A Z-score > 3 is considered highly anomalous (3+ standard deviations from mean)
  return Math.min(zScore / 6, 1); // Normalize to 0-1 range
}

/**
 * Simulate network analysis to detect suspicious connections
 * In production, this would use Graph Neural Networks or similar techniques
 */
async function analyzeNetworkRisk(upiId: string): Promise<number> {
  try {
    // Get scam reports for this UPI ID
    const reports = await storage.getScamReportsByUpiId(upiId);
    
    // If multiple reports exist, this is a high-risk UPI ID
    if (reports.length >= 3) return 0.9;
    if (reports.length >= 1) return 0.7;
    
    // Check for suspicious UPI domain
    const upiParts = upiId.split('@');
    if (upiParts.length !== 2) return 0.5; // Invalid format, moderate risk
    
    const domain = upiParts[1].toLowerCase();
    const knownDomains = ['oksbi', 'ybl', 'paytm', 'upi', 'icici', 'axl', 'hdfc', 'kotak'];
    
    if (!knownDomains.includes(domain)) {
      if (domain.includes('bank') || domain.includes('pay') || domain.includes('upi')) {
        return 0.6; // Suspicious domain trying to look legitimate
      }
      return 0.4; // Unknown domain, slightly elevated risk
    }
    
    return 0.1; // Known legitimate domain
  } catch (error) {
    console.error('Error analyzing network risk:', error);
    return 0.5; // Moderate risk on error
  }
}

/**
 * Calculate temporal risk based on transaction patterns over time
 */
function calculateTemporalRisk(transactionTime: Date, userHistory: any[]): number {
  // If no history, consider moderate risk
  if (!userHistory || userHistory.length === 0) return 0.5;
  
  // Convert to hour of day (0-23)
  const hourOfDay = transactionTime.getHours();
  
  // Check if this hour is common for user transactions
  const hourCounts = Array(24).fill(0);
  for (const transaction of userHistory) {
    const txHour = new Date(transaction.timestamp).getHours();
    hourCounts[txHour]++;
  }
  
  // Normalize to get probability distribution
  const total = hourCounts.reduce((a, b) => a + b, 0);
  const hourProbabilities = hourCounts.map(c => c / total);
  
  // Unusual hour if probability is low
  const currentHourProb = hourProbabilities[hourOfDay];
  
  // Temporal risk is inverse of probability (lower probability = higher risk)
  const temporalRisk = 1 - Math.min(currentHourProb * 10, 1);
  
  return temporalRisk;
}

/**
 * Analyze transaction risk using a combination of techniques
 */
export async function analyzeTransactionRisk(
  transactionData: { 
    upiId: string;
    amount: number;
    userId?: number;
    note?: string;
    recipient?: string;
    timestamp?: Date;
    location?: { lat: number; lng: number };
    deviceInfo?: any;
  }
): Promise<RiskScoreResponse> {
  const {
    upiId,
    amount,
    userId,
    note = '',
    recipient = '',
    timestamp = new Date(),
    location,
    deviceInfo
  } = transactionData;
  
  // Initialize risk factors
  const riskFactors: RiskFactor[] = [];
  
  // 1. Check if UPI ID exists in risk database
  let upiRisk = 0;
  try {
    const upiRiskReport = await storage.getUpiRiskByUpiId(upiId);
    if (upiRiskReport) {
      upiRisk = upiRiskReport.riskScore;
      
      if (upiRisk > 0.4) {
        riskFactors.push({
          type: 'upi_reputation',
          description: 'This UPI ID has been reported as suspicious',
          impact: upiRisk * 0.5 // Weight reputation as 50% of its value
        });
      }
    }
  } catch (error) {
    console.error('Error checking UPI risk:', error);
  }
  
  // 2. Network analysis (simplified version of GNN)
  const networkRisk = await analyzeNetworkRisk(upiId);
  if (networkRisk > 0.3) {
    riskFactors.push({
      type: 'network_analysis',
      description: networkRisk > 0.7 
        ? 'This UPI ID is connected to known scam patterns'
        : 'This UPI ID shows some unusual network characteristics',
      impact: networkRisk * 0.6 // Weight network risk at 60% of its value
    });
  }
  
  // 3. Use AI to analyze transaction context if available
  let aiRisk = 0;
  try {
    if (note || recipient) {
      const aiAnalysis = await analyzeTransactionContextWithAI(
        note || recipient,
        amount,
        upiId
      );
      
      aiRisk = aiAnalysis.riskScore || 0;
      
      if (aiRisk > 0.4) {
        riskFactors.push({
          type: 'ai_analysis',
          description: aiAnalysis.explanation || 'AI detected suspicious patterns in transaction context',
          impact: aiRisk * 0.7 // Weight AI risk heavily as it's sophisticated
        });
      }
    }
  } catch (error) {
    console.error('Error in AI risk analysis:', error);
  }
  
  // 4. Get user transaction history if user ID is provided
  let userHistory: any[] = [];
  let anomalyScore = 0;
  let temporalRisk = 0.3; // Default moderate temporal risk
  
  if (userId) {
    try {
      userHistory = await storage.getTransactionsByUserId(userId);
      
      // 4a. Detect amount anomalies (Isolation Forest simulation)
      anomalyScore = detectAmountAnomaly(amount, userHistory);
      
      if (anomalyScore > 0.7) {
        riskFactors.push({
          type: 'amount_anomaly',
          description: 'This transaction amount is unusually high compared to your history',
          impact: anomalyScore * 0.8 // Weight anomalies heavily
        });
      } else if (anomalyScore > 0.4) {
        riskFactors.push({
          type: 'amount_anomaly',
          description: 'This transaction amount is somewhat higher than your typical transactions',
          impact: anomalyScore * 0.5
        });
      }
      
      // 4b. Temporal analysis
      temporalRisk = calculateTemporalRisk(timestamp, userHistory);
      
      if (temporalRisk > 0.7) {
        riskFactors.push({
          type: 'temporal_pattern',
          description: 'This transaction is occurring at an unusual time based on your history',
          impact: temporalRisk * 0.4 // Moderate weight for temporal factors
        });
      }
    } catch (error) {
      console.error('Error analyzing user history:', error);
    }
  }
  
  // 5. Amount-based risk (large amounts are inherently riskier)
  let amountRisk = 0;
  if (amount > 50000) {
    amountRisk = 0.7;
    riskFactors.push({
      type: 'high_amount',
      description: 'Large transaction amount increases risk',
      impact: 0.4
    });
  } else if (amount > 10000) {
    amountRisk = 0.4;
    riskFactors.push({
      type: 'medium_amount',
      description: 'Medium-high transaction amount',
      impact: 0.2
    });
  }
  
  // 6. Behavioral risk (would use device info in production)
  // For this demo, we'll simulate with random values weighted toward low risk
  const behavioralRisk = deviceInfo ? 0.3 : 0.2;
  
  // 7. Combine all risk factors using weighted average
  // Different factors have different weights based on reliability
  const weights = {
    upiRisk: 0.15,
    networkRisk: 0.2,
    aiRisk: 0.25,
    anomalyScore: 0.15,
    temporalRisk: 0.1,
    amountRisk: 0.1,
    behavioralRisk: 0.05
  };
  
  const totalRiskScore = (
    upiRisk * weights.upiRisk +
    networkRisk * weights.networkRisk +
    aiRisk * weights.aiRisk +
    anomalyScore * weights.anomalyScore +
    temporalRisk * weights.temporalRisk +
    amountRisk * weights.amountRisk +
    behavioralRisk * weights.behavioralRisk
  );
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (totalRiskScore > 0.8) riskLevel = 'critical';
  else if (totalRiskScore > 0.6) riskLevel = 'high';
  else if (totalRiskScore > 0.3) riskLevel = 'medium';
  
  // Generate recommendation based on risk level
  let recommendation = 'This transaction appears to be safe.';
  if (riskLevel === 'critical') {
    recommendation = 'WARNING: This transaction has multiple high-risk indicators. We strongly recommend cancelling.';
  } else if (riskLevel === 'high') {
    recommendation = 'This transaction shows significant risk factors. Consider verifying with the recipient before proceeding.';
  } else if (riskLevel === 'medium') {
    recommendation = 'Use caution with this transaction. Double-check the recipient details.';
  }
  
  return {
    risk_score: totalRiskScore,
    risk_factors: riskFactors,
    recommendation,
    requires_verification: totalRiskScore > 0.6,
    risk_level: riskLevel,
    anomaly_score: anomalyScore,
    network_risk: networkRisk,
    behavioral_risk: behavioralRisk
  };
}