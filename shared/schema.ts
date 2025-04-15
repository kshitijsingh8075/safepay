import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  phoneNumber: text("phone_number").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Transaction table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  upiId: text("upi_id").notNull(),
  amount: integer("amount").notNull(), // Stored in paise/cents
  type: text("type").notNull(), // 'credit' or 'debit'
  status: text("status").notNull(), // 'Completed', 'Pending', 'Failed', etc.
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// UPI Risk reports
export const upiRiskReports = pgTable("upi_risk_reports", {
  id: serial("id").primaryKey(),
  upiId: text("upi_id").notNull(),
  reportCount: integer("report_count").notNull().default(0),
  firstReportDate: timestamp("first_report_date").defaultNow().notNull(),
  riskScore: integer("risk_score").notNull().default(0), // 0-100
  statusVerified: boolean("status_verified").default(false),
});

// Scam reports
export const scamReports = pgTable("scam_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  upiId: text("upi_id").notNull(),
  scamType: text("scam_type").notNull(),
  amountLost: integer("amount_lost"), // Stored in paise/cents
  description: text("description"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  timestamp: true,
});

export const insertUpiRiskReportSchema = createInsertSchema(upiRiskReports).omit({
  id: true,
  firstReportDate: true,
});

export const insertScamReportSchema = createInsertSchema(scamReports).omit({
  id: true,
  timestamp: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertUpiRiskReport = z.infer<typeof insertUpiRiskReportSchema>;
export type UpiRiskReport = typeof upiRiskReports.$inferSelect;

export type InsertScamReport = z.infer<typeof insertScamReportSchema>;
export type ScamReport = typeof scamReports.$inferSelect;
