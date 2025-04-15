import { 
  User, InsertUser, 
  Transaction, InsertTransaction,
  UpiRiskReport, InsertUpiRiskReport,
  ScamReport, InsertScamReport
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Transaction methods
  getTransactionsByUserId(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // UPI Risk methods
  getUpiRiskByUpiId(upiId: string): Promise<UpiRiskReport | undefined>;
  updateUpiRiskScore(upiId: string): Promise<void>;
  
  // Scam Report methods
  getScamReportsByUpiId(upiId: string): Promise<ScamReport[]>;
  createScamReport(report: InsertScamReport): Promise<ScamReport>;
  getMostCommonScamType(upiId: string): Promise<string>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private upiRiskReports: Map<number, UpiRiskReport>;
  private scamReports: Map<number, ScamReport>;
  
  private userIdCounter: number;
  private transactionIdCounter: number;
  private upiRiskIdCounter: number;
  private scamReportIdCounter: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.upiRiskReports = new Map();
    this.scamReports = new Map();
    
    this.userIdCounter = 1;
    this.transactionIdCounter = 1;
    this.upiRiskIdCounter = 1;
    this.scamReportIdCounter = 1;
    
    // Add some initial data
    this.seedData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  // Transaction methods
  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (tx) => tx.userId === userId
    );
  }
  
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const timestamp = new Date();
    const transaction: Transaction = { ...insertTransaction, id, timestamp };
    this.transactions.set(id, transaction);
    return transaction;
  }
  
  // UPI Risk methods
  async getUpiRiskByUpiId(upiId: string): Promise<UpiRiskReport | undefined> {
    return Array.from(this.upiRiskReports.values()).find(
      (report) => report.upiId === upiId
    );
  }
  
  async updateUpiRiskScore(upiId: string): Promise<void> {
    let riskReport = await this.getUpiRiskByUpiId(upiId);
    
    if (!riskReport) {
      // Create new report if none exists
      riskReport = {
        id: this.upiRiskIdCounter++,
        upiId,
        reportCount: 1,
        firstReportDate: new Date(),
        riskScore: 30, // Initial medium-low risk score
        statusVerified: false
      };
      this.upiRiskReports.set(riskReport.id, riskReport);
    } else {
      // Update existing report
      riskReport.reportCount += 1;
      
      // Increase risk score as reports increase
      // Max score is 100
      riskReport.riskScore = Math.min(
        100,
        riskReport.riskScore + 10 + Math.floor(Math.random() * 10)
      );
      
      this.upiRiskReports.set(riskReport.id, riskReport);
    }
  }
  
  // Scam Report methods
  async getScamReportsByUpiId(upiId: string): Promise<ScamReport[]> {
    return Array.from(this.scamReports.values()).filter(
      (report) => report.upiId === upiId
    );
  }
  
  async createScamReport(insertReport: InsertScamReport): Promise<ScamReport> {
    const id = this.scamReportIdCounter++;
    const timestamp = new Date();
    const report: ScamReport = { ...insertReport, id, timestamp };
    this.scamReports.set(id, report);
    return report;
  }
  
  async getMostCommonScamType(upiId: string): Promise<string> {
    const reports = await this.getScamReportsByUpiId(upiId);
    
    if (reports.length === 0) return 'N/A';
    
    // Count scam types
    const typeCounts = new Map<string, number>();
    
    for (const report of reports) {
      const count = typeCounts.get(report.scamType) || 0;
      typeCounts.set(report.scamType, count + 1);
    }
    
    // Find most common
    let mostCommon = 'N/A';
    let maxCount = 0;
    
    typeCounts.forEach((count, type) => {
      if (count > maxCount) {
        mostCommon = type;
        maxCount = count;
      }
    });
    
    return mostCommon;
  }
  
  // Seed data for demo purposes
  private seedData() {
    // Add a user
    const demoUser: InsertUser = {
      username: 'rahul',
      password: 'password123',
      phoneNumber: '9876543210',
      name: 'Rahul Sharma'
    };
    this.createUser(demoUser);
    
    // Add some transactions
    const transactions: InsertTransaction[] = [
      {
        userId: 1,
        title: 'City Supermarket',
        upiId: 'citysupermarket@upi',
        amount: -85000, // In paise (850.00 INR)
        type: 'debit',
        status: 'Completed'
      },
      {
        userId: 1,
        title: 'Aman Sharma',
        upiId: 'amansharma@upi',
        amount: 120000, // In paise (1,200.00 INR)
        type: 'credit',
        status: 'Received'
      },
      {
        userId: 1,
        title: 'Metro Grocery',
        upiId: 'metrogrocery@upi',
        amount: -45000, // In paise (450.00 INR)
        type: 'debit',
        status: 'Completed'
      }
    ];
    
    transactions.forEach(tx => this.createTransaction(tx));
    
    // Add a high-risk UPI ID
    const riskReport: InsertUpiRiskReport = {
      upiId: 'onlineshopping123@upi',
      reportCount: 15,
      riskScore: 75,
      statusVerified: false
    };
    
    const riskId = this.upiRiskIdCounter++;
    const firstReportDate = new Date(Date.now() - 60 * 86400000); // 60 days ago
    this.upiRiskReports.set(riskId, {
      ...riskReport,
      id: riskId,
      firstReportDate
    });
    
    // Add some scam reports
    const scamReports: InsertScamReport[] = [
      {
        userId: 1,
        upiId: 'onlineshopping123@upi',
        scamType: 'Fake Products',
        amountLost: 250000, // 2,500.00 INR
        description: 'I ordered products online through this UPI ID but never received the items. The seller stopped responding after payment.'
      },
      {
        userId: 1,
        upiId: 'onlineshopping123@upi',
        scamType: 'Fake Products',
        amountLost: 350000, // 3,500.00 INR
        description: 'Ordered a smartphone but received a fake product.'
      },
      {
        userId: 1,
        upiId: 'onlineshopping123@upi',
        scamType: 'Fraud',
        amountLost: 450000, // 4,500.00 INR
        description: 'They took money and blocked my number.'
      }
    ];
    
    scamReports.forEach(report => {
      const id = this.scamReportIdCounter++;
      this.scamReports.set(id, {
        ...report,
        id,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000) // Random date in last 30 days
      });
    });
  }
}

export const storage = new MemStorage();
