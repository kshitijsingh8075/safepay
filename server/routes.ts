import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScamReportSchema, insertUserSchema, insertPaymentMethodSchema, insertChatMessageSchema, insertChatFeedbackSchema } from "@shared/schema";
import { generateOtp, verifyOtp } from "./services/otp";
import { getChatResponse, generateQuickReplies } from "./services/chat";
import { getScamNews } from "./services/scam-news-fixed";
import { registerScamNewsRoutes } from "./routes/scam-news";
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
      
      // Update user's PIN
      const updatedUser = await storage.updateUser(parseInt(userId), {
        pin: hashedPin,
        usePin: true
      });
      
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update user' });
      }
      
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
      
      // Update biometric settings
      const updatedUser = await storage.updateUser(parseInt(userId), {
        useBiometric: enable === true,
        deviceId: deviceId || user.deviceId
      });
      
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update user' });
      }
      
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
  
  // User profile routes
  app.get('/api/users/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(parseInt(userId));
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Exclude sensitive information
      const { password, pin, ...safeUser } = user;
      
      res.status(200).json(safeUser);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user data', error });
    }
  });
  
  app.patch('/api/users/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      // Never allow password updates through this endpoint for security
      if (updates.password) {
        delete updates.password;
      }
      
      const updatedUser = await storage.updateUser(parseInt(userId), updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Exclude sensitive information
      const { password, pin, ...safeUser } = updatedUser;
      
      res.status(200).json(safeUser);
    } catch (error) {
      res.status(500).json({ message: 'Error updating user data', error });
    }
  });
  
  // Payment method routes
  app.get('/api/payment-methods/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const methods = await storage.getPaymentMethodsByUserId(parseInt(userId));
      
      // Mask sensitive data for extra security
      const maskedMethods = methods.map(method => {
        // Only return last 4 digits for card numbers and account numbers
        return {
          ...method,
          cardNumber: method.cardNumber ? `xxxx-xxxx-xxxx-${method.cardNumber}` : null,
          accountNumber: method.accountNumber ? `xxxx-xxxx-${method.accountNumber}` : null
        };
      });
      
      res.status(200).json(maskedMethods);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching payment methods', error });
    }
  });
  
  app.post('/api/payment-methods', async (req, res) => {
    try {
      const methodData = insertPaymentMethodSchema.parse(req.body);
      const method = await storage.createPaymentMethod(methodData);
      
      // Mask sensitive data for response
      const { cardNumber, accountNumber, ...safeMethod } = method;
      const maskedMethod = {
        ...safeMethod,
        cardNumber: cardNumber ? `xxxx-xxxx-xxxx-${cardNumber}` : null,
        accountNumber: accountNumber ? `xxxx-xxxx-${accountNumber}` : null
      };
      
      res.status(201).json(maskedMethod);
    } catch (error) {
      res.status(400).json({ message: 'Invalid payment method data', error });
    }
  });
  
  app.patch('/api/payment-methods/:methodId', async (req, res) => {
    try {
      const { methodId } = req.params;
      const updates = req.body;
      
      const updatedMethod = await storage.updatePaymentMethod(parseInt(methodId), updates);
      
      if (!updatedMethod) {
        return res.status(404).json({ message: 'Payment method not found' });
      }
      
      // Mask sensitive data for response
      const { cardNumber, accountNumber, ...safeMethod } = updatedMethod;
      const maskedMethod = {
        ...safeMethod,
        cardNumber: cardNumber ? `xxxx-xxxx-xxxx-${cardNumber}` : null,
        accountNumber: accountNumber ? `xxxx-xxxx-${accountNumber}` : null
      };
      
      res.status(200).json(maskedMethod);
    } catch (error) {
      res.status(500).json({ message: 'Error updating payment method', error });
    }
  });
  
  app.delete('/api/payment-methods/:methodId', async (req, res) => {
    try {
      const { methodId } = req.params;
      const success = await storage.deletePaymentMethod(parseInt(methodId));
      
      if (!success) {
        return res.status(404).json({ message: 'Payment method not found' });
      }
      
      res.status(200).json({ message: 'Payment method deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting payment method', error });
    }
  });
  
  app.post('/api/payment-methods/:userId/set-default/:methodId', async (req, res) => {
    try {
      const { userId, methodId } = req.params;
      const success = await storage.setDefaultPaymentMethod(parseInt(userId), parseInt(methodId));
      
      if (!success) {
        return res.status(404).json({ message: 'User or payment method not found' });
      }
      
      res.status(200).json({ message: 'Default payment method updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error updating default payment method', error });
    }
  });

  // Chat routes
  app.get('/api/chat/:userId/history', async (req, res) => {
    try {
      const { userId } = req.params;
      const messages = await storage.getChatHistoryByUserId(parseInt(userId));
      res.status(200).json(messages);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      res.status(500).json({ message: 'Error fetching chat history', error });
    }
  });
  
  app.post('/api/chat/:userId/message', async (req, res) => {
    try {
      const { userId } = req.params;
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: 'Message content is required' });
      }
      
      // Save user message
      const userMessage = await storage.saveChatMessage(parseInt(userId), {
        role: 'user',
        content
      });
      
      // Get chat history for context
      const chatHistory = await storage.getChatHistoryByUserId(parseInt(userId));
      
      // Convert DB messages to service-compatible format
      const serviceMessages = chatHistory.slice(-10).map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }));
      
      // Process with AI service
      const assistantResponse = await getChatResponse(
        serviceMessages,
        content
      );
      
      // Save assistant response
      const assistantMessage = await storage.saveChatMessage(parseInt(userId), {
        role: 'assistant',
        content: assistantResponse
      });
      
      // Generate quick replies
      const updatedServiceMessages = [...serviceMessages, {
        role: 'assistant' as const,
        content: assistantResponse
      }, {
        role: 'user' as const,
        content
      }];
      
      const quickReplies = await generateQuickReplies(updatedServiceMessages);
      
      res.status(200).json({
        userMessage,
        assistantMessage,
        quickReplies
      });
    } catch (error) {
      console.error('Error processing chat message:', error);
      res.status(500).json({ 
        message: 'Error processing chat message', 
        error,
        fallbackResponse: "I apologize, but I'm having trouble connecting to my knowledge base. Please try again later."
      });
    }
  });
  
  app.post('/api/chat/:userId/feedback', async (req, res) => {
    try {
      const { userId } = req.params;
      const { messageId, rating, feedback } = req.body;
      
      if (!messageId) {
        return res.status(400).json({ message: 'Message ID is required' });
      }
      
      // At least one of rating or feedback should be provided
      if (rating === undefined && !feedback) {
        return res.status(400).json({ message: 'Rating or feedback is required' });
      }
      
      const savedFeedback = await storage.saveChatFeedback(parseInt(userId), parseInt(messageId), {
        rating: rating !== undefined ? parseInt(rating) : undefined,
        feedback
      });
      
      res.status(200).json({
        message: 'Feedback saved successfully',
        feedback: savedFeedback
      });
    } catch (error) {
      console.error('Error saving chat feedback:', error);
      res.status(500).json({ message: 'Error saving chat feedback', error });
    }
  });

  // Advanced Fraud Detection API (Mock Service)
  app.post('/api/fraud-check', (req, res) => {
    try {
      const { upiId, amount, deviceInfo } = req.body;
      
      if (!upiId) {
        return res.status(400).json({ message: 'UPI ID is required' });
      }
      
      // Simulate response from Python fraud detection service
      const mockResponse = {
        prediction: Math.random() > 0.8, // 20% chance of fraud detection
        confidence: parseFloat((Math.random() * 0.8 + 0.1).toFixed(2)), // Value between 0.1 and 0.9
        features: {
          hourly_reports: Math.floor(Math.random() * 5),
          tx_frequency: Math.floor(Math.random() * 50),
          amount_deviation: parseFloat((Math.random() * 2 - 1).toFixed(2)),
          device_risk: Math.floor(Math.random() * 3),
          platform_reports: Math.floor(Math.random() * 10)
        },
        live_data: {
          tx_frequency: Math.floor(Math.random() * 30),
          avg_amount: parseFloat((Math.random() * 5000 + 500).toFixed(2)),
          device_mismatches: Math.floor(Math.random() * 3),
          recent_reports: Math.floor(Math.random() * 5)
        },
        message: "Fraud risk assessment completed successfully",
        meta: { 
          service: "mock-ml-service",
          version: "1.0.0",
          latency_ms: Math.floor(Math.random() * 200 + 100)
        }
      };
      
      // Add a 500ms delay to simulate ML processing time
      setTimeout(() => {
        res.status(200).json(mockResponse);
      }, 500);
      
    } catch (error: any) {
      console.error('Fraud detection error:', error);
      res.status(500).json({ 
        message: 'Fraud detection service error', 
        error: error?.message || 'Unknown error'
      });
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
