import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScamReportSchema, insertUserSchema } from "@shared/schema";
import { generateOtp, verifyOtp } from "./services/otp";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // OTP Authentication routes
  app.post('/api/auth/request-otp', async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required' });
      }
      
      // Generate OTP for the phone number
      const otp = generateOtp(phoneNumber);
      
      // In a production environment, you would send the OTP via SMS
      // For development, we'll return it in the response
      console.log(`Generated OTP for ${phoneNumber}: ${otp}`);
      
      // In development, always include the OTP in the response
      // In production, this would only log the OTP on the server
      if (process.env.NODE_ENV === 'development') {
        res.status(200).json({
          message: 'OTP sent successfully',
          otp: otp
        });
      } else {
        res.status(200).json({
          message: 'OTP sent successfully'
        });
      }
    } catch (error) {
      console.error('Error generating OTP:', error);
      res.status(500).json({ message: 'Failed to generate OTP' });
    }
  });
  
  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { phoneNumber, otp } = req.body;
      
      if (!phoneNumber || !otp) {
        return res.status(400).json({ message: 'Phone number and OTP are required' });
      }
      
      // Verify the OTP
      const isValid = verifyOtp(phoneNumber, otp);
      
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid or expired OTP' });
      }
      
      // Check if user exists with this phone number
      let user = await storage.getUserByPhoneNumber(phoneNumber);
      
      if (!user) {
        // Register new user with a random password (secure as it's hashed)
        const randomPassword = await hashPassword(randomBytes(16).toString('hex'));
        
        user = await storage.createUser({
          username: `user_${Date.now()}`, // Generate a unique username
          password: randomPassword,
          phoneNumber: phoneNumber,
          name: ''
        });
      }
      
      // Update last login timestamp
      // In a real app with proper database, you would update this in the DB
      
      res.status(200).json({
        message: 'Authentication successful',
        userId: user.id,
        isNewUser: !user.name // If name is empty, it's likely a new user that needs profile setup
      });
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({ message: 'Failed to verify OTP' });
    }
  });
  
  app.post('/api/auth/setup-pin', async (req, res) => {
    try {
      const { userId, pin } = req.body;
      
      if (!userId || !pin) {
        return res.status(400).json({ message: 'User ID and PIN are required' });
      }
      
      // Validate PIN format (should be numeric and 4-6 digits)
      if (!/^\d{4,6}$/.test(pin)) {
        return res.status(400).json({ message: 'PIN must be 4-6 digits' });
      }
      
      // Get the user
      const user = await storage.getUser(parseInt(userId));
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Hash the PIN for security
      const hashedPin = await hashPassword(pin);
      
      // Update user's PIN in a real app with proper database
      // For now, we'll just respond with success
      
      res.status(200).json({
        message: 'PIN setup successful'
      });
    } catch (error) {
      console.error('Error setting up PIN:', error);
      res.status(500).json({ message: 'Failed to set up PIN' });
    }
  });
  
  app.post('/api/auth/biometric', async (req, res) => {
    try {
      const { userId, enable, deviceId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      // Get the user
      const user = await storage.getUser(parseInt(userId));
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update biometric settings in a real app with proper database
      // For now, we'll just respond with success
      
      res.status(200).json({
        message: enable ? 'Biometric authentication enabled' : 'Biometric authentication disabled'
      });
    } catch (error) {
      console.error('Error updating biometric settings:', error);
      res.status(500).json({ message: 'Failed to update biometric settings' });
    }
  });

  // Existing User routes
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
