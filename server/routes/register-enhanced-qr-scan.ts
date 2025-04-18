import { Express } from "express";
import { log } from "../vite";
import { createEnhancedQRRouter } from "./enhanced-qr-scanner";
import { createDirectQRRouter } from "./direct-qr-analysis";

/**
 * Register the enhanced QR scanning routes
 * This will set up endpoints for the enhanced QR scanner
 * and the direct TypeScript implementation as a fallback
 */
export function registerEnhancedQRScanRoutes(app: Express): void {
  log('Registering Enhanced QR Scan Routes...', 'routes');
  
  try {
    // Create router for enhanced QR scanner
    const enhancedQRRouter = createEnhancedQRRouter();
    
    // Create router for direct QR analysis (fallback)
    const directQRRouter = createDirectQRRouter();
    
    // Mount the routers
    app.use('/api/enhanced-qr', enhancedQRRouter);
    app.use('/api/direct-qr', directQRRouter);
    
    log('✅ Enhanced QR scan routes registered successfully', 'qrscan');
    log('✅ Direct QR analysis routes registered as fallback', 'qrscan');
  } catch (error) {
    log(`❌ Failed to register enhanced QR scan routes: ${error}`, 'qrscan');
  }
}