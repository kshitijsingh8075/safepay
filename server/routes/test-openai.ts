import { Express } from "express";
import { testOpenAI } from "../services/test-openai";

export function registerTestOpenAIRoute(app: Express) {
  app.post("/api/test-openai", async (req, res) => {
    try {
      const result = await testOpenAI();
      res.status(200).json({ result });
    } catch (error) {
      console.error("Error in test OpenAI route:", error);
      res.status(500).json({ 
        error: "Failed to test OpenAI", 
        message: (error as Error).message 
      });
    }
  });
}