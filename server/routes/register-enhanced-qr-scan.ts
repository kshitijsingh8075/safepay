import { Express } from "express";
import { log } from "../vite";
import { createEnhancedQRRouter } from "./enhanced-qr-scanner";

/**
 * Register the enhanced QR scanning routes
 * This will set up endpoints for the enhanced QR scanner
 */
export function registerEnhancedQRScanRoutes(app: Express): void {
  log('Registering Enhanced QR Scan Routes...', 'routes');
  
  try {
    // Create router for enhanced QR scanner
    const enhancedQRRouter = createEnhancedQRRouter();
    
    // Mount the router
    app.use('/api/enhanced-qr', enhancedQRRouter);
    
    log('✅ Enhanced QR scan routes registered successfully', 'qrscan');
  } catch (error) {
    log(`❌ Failed to register enhanced QR scan routes: ${error}`, 'qrscan');
  }
}