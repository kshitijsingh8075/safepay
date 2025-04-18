import { Router, Request, Response } from 'express';
import { log } from '../vite';
import { analyzeQRText, extractUPIInfo, type QRAnalysisResult } from '../services/direct-qr-scanner';

/**
 * Register enhanced QR scan routes
 * This provides a proxy to the Python-based ML service
 * and falls back to direct TypeScript implementation
 */
export function registerEnhancedQRScanRoutes(app: any): void {
  log('Registering Enhanced QR Scan Routes...', 'routes');
  
  try {
    const router = Router();
    
    // Status endpoint
    router.get('/status', (req: Request, res: Response) => {
      res.json({
        status: 'operational',
        service: 'enhanced-qr-scanner',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    });
    
    // Analyze endpoint - Enhanced QR analysis with fallback
    router.post('/analyze', async (req: Request, res: Response) => {
      try {
        const { qr_text } = req.body;
        
        if (!qr_text) {
          return res.status(400).json({
            error: 'Missing required parameter: qr_text'
          });
        }
        
        // First try calling the Python service
        let result: QRAnalysisResult & { is_fallback?: boolean } = {
          risk_score: 0,
          risk_level: 'Low',
          reasons: [],
          qr_type: 'unknown',
          latency_ms: 0,
          is_fallback: true
        };
        
        // For now, use direct implementation (Python service will be integrated later)
        result = analyzeQRText(qr_text);
        
        // Add processing context
        result.is_fallback = true;
        
        res.json({
          risk_score: result.risk_score,
          risk_level: result.risk_level,
          recommendation: result.risk_level === 'High' ? 'Block' : 
                        result.risk_level === 'Medium' ? 'Verify' : 'Allow',
          reasons: result.reasons,
          latency_ms: result.latency_ms,
          qr_type: result.qr_type,
          is_fallback: result.is_fallback,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        log(`Error in enhanced QR analysis: ${error}`, 'error');
        res.status(500).json({
          error: 'Failed to analyze QR code',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });
    
    // UPI extraction endpoint
    router.post('/extract-upi', (req: Request, res: Response) => {
      try {
        const { qr_text } = req.body;
        
        if (!qr_text) {
          return res.status(400).json({
            error: 'Missing required parameter: qr_text'
          });
        }
        
        // Use direct implementation
        const result = extractUPIInfo(qr_text);
        
        res.json(result);
      } catch (error) {
        log(`Error in UPI extraction: ${error}`, 'error');
        res.status(500).json({
          error: 'Failed to extract UPI information',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });
    
    // Register direct QR routes separately
    registerDirectQRAnalysisRoutes(app);
    
    // Mount the router
    app.use('/api/enhanced-qr', router);
    
    log('✅ Enhanced QR scan routes registered successfully', 'qrscan');
  } catch (error) {
    log(`❌ Failed to register enhanced QR scan routes: ${error}`, 'qrscan');
  }
}

/**
 * Register direct QR analysis routes
 * This provides a basic, reliable TypeScript fallback
 */
function registerDirectQRAnalysisRoutes(app: any): void {
  try {
    const router = Router();
    
    // Status endpoint
    router.get('/status', (req: Request, res: Response) => {
      res.json({
        status: 'operational',
        service: 'direct-qr-analyzer',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    });
    
    // Full analysis endpoint - Combines QR analysis with UPI extraction
    router.post('/full-analysis', (req: Request, res: Response) => {
      try {
        const { qr_text } = req.body;
        
        if (!qr_text) {
          return res.status(400).json({
            error: 'Missing required parameter: qr_text'
          });
        }
        
        // Perform analysis
        const analysis = analyzeQRText(qr_text);
        
        // Extract UPI info if it's a UPI QR
        let upiInfo = null;
        if (qr_text.startsWith('upi://')) {
          upiInfo = extractUPIInfo(qr_text);
        }
        
        res.json({
          analysis,
          upi_info: upiInfo
        });
      } catch (error) {
        log(`Error in direct QR analysis: ${error}`, 'error');
        res.status(500).json({
          error: 'Failed to analyze QR code',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });
    
    // Extract UPI info endpoint
    router.post('/extract-upi', (req: Request, res: Response) => {
      try {
        const { qr_text } = req.body;
        
        if (!qr_text) {
          return res.status(400).json({
            error: 'Missing required parameter: qr_text'
          });
        }
        
        if (!qr_text.startsWith('upi://')) {
          return res.status(400).json({
            error: 'Not a UPI QR code'
          });
        }
        
        // Extract UPI info
        const upiInfo = extractUPIInfo(qr_text);
        
        res.json(upiInfo);
      } catch (error) {
        log(`Error in UPI extraction: ${error}`, 'error');
        res.status(500).json({
          error: 'Failed to extract UPI info',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });
    
    // Mount the router
    app.use('/api/direct-qr', router);
    
    log('✅ Direct QR analysis routes registered as fallback', 'qrscan');
  } catch (error) {
    log(`❌ Failed to register direct QR analysis routes: ${error}`, 'qrscan');
  }
}