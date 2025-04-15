import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScamReportSchema, insertUserSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post('/api/users/signup', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json({ message: 'User created successfully', userId: user.id });
    } catch (error) {
      res.status(400).json({ message: 'Invalid user data', error });
    }
  });

  app.post('/api/users/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      res.status(200).json({ message: 'Login successful', userId: user.id });
    } catch (error) {
      res.status(500).json({ message: 'Error logging in', error });
    }
  });

  // UPI risk check routes
  app.get('/api/upi/check/:upiId', async (req, res) => {
    try {
      const { upiId } = req.params;
      const riskReport = await storage.getUpiRiskByUpiId(upiId);
      
      if (!riskReport) {
        return res.status(200).json({ 
          upiId, 
          riskPercentage: 0,
          riskLevel: 'Low',
          reports: 0,
          age: 'Unknown',
          reportedFor: 'N/A'
        });
      }
      
      let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
      if (riskReport.riskScore >= 70) riskLevel = 'High';
      else if (riskReport.riskScore >= 30) riskLevel = 'Medium';
      
      res.status(200).json({
        upiId: riskReport.upiId,
        riskPercentage: riskReport.riskScore,
        riskLevel,
        reports: riskReport.reportCount,
        age: calculateUpiAge(riskReport.firstReportDate),
        reportedFor: await storage.getMostCommonScamType(upiId)
      });
    } catch (error) {
      res.status(500).json({ message: 'Error checking UPI risk', error });
    }
  });

  // Scam report routes
  app.post('/api/report/scam', async (req, res) => {
    try {
      const reportData = insertScamReportSchema.parse(req.body);
      await storage.createScamReport(reportData);
      
      // Update UPI risk score
      await storage.updateUpiRiskScore(reportData.upiId);
      
      res.status(201).json({ message: 'Scam report submitted successfully' });
    } catch (error) {
      res.status(400).json({ message: 'Invalid report data', error });
    }
  });

  // Transactions routes
  app.get('/api/transactions/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const transactions = await storage.getTransactionsByUserId(parseInt(userId));
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching transactions', error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to calculate UPI age
function calculateUpiAge(date: Date): string {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) return `${diffDays} days`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
  return `${Math.floor(diffDays / 365)} years`;
}
