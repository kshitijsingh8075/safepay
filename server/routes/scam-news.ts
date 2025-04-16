import { Express } from "express";
import { getScamNews } from "../services/scam-news-fixed";

/**
 * Register scam news related routes to the Express server
 * @param app Express application
 */
export function registerScamNewsRoutes(app: Express) {
  // Get scam news data
  app.post("/api/scam-news", async (req, res) => {
    try {
      const { geo_location, upi_id, trigger_source } = req.body;
      
      // For logging and analysis
      console.log(`Scam news requested - trigger: ${trigger_source || 'unknown'}`);
      
      // Get scam news data with user's location (or default to India)
      const location = geo_location ? 
        (typeof geo_location === 'string' ? geo_location : 'India') : 
        'India';
      
      const scamNewsData = await getScamNews(location, upi_id);
      
      res.status(200).json(scamNewsData);
    } catch (error) {
      console.error("Error fetching scam news:", error);
      res.status(500).json({ 
        error: "Failed to fetch scam news data",
        message: (error as Error).message
      });
    }
  });
  
  // Enhanced UPI analysis endpoint
  app.post("/api/scam-news/analyze-upi", async (req, res) => {
    try {
      const { upi_id } = req.body;
      
      if (!upi_id) {
        return res.status(400).json({ error: "UPI ID is required" });
      }
      
      // Get scam news with detailed UPI analysis
      const scamNewsWithUpiAnalysis = await getScamNews('India', upi_id);
      
      res.status(200).json({
        upi_analysis: scamNewsWithUpiAnalysis.upi_analysis
      });
    } catch (error) {
      console.error("Error analyzing UPI:", error);
      res.status(500).json({ 
        error: "Failed to analyze UPI ID",
        message: (error as Error).message
      });
    }
  });
  
  // Get location-specific alerts
  app.get("/api/scam-news/alerts/:location?", async (req, res) => {
    try {
      const location = req.params.location || 'India';
      const scamNewsData = await getScamNews(location);
      
      res.status(200).json({
        alerts: scamNewsData.alerts,
        last_updated: scamNewsData.last_updated
      });
    } catch (error) {
      console.error("Error fetching scam alerts:", error);
      res.status(500).json({ 
        error: "Failed to fetch scam alerts",
        message: (error as Error).message
      });
    }
  });
}