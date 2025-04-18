import { Router, Request, Response } from 'express';
import { log } from '../vite';
import { analyzeQRText, extractUPIInfo } from '../services/direct-qr-scanner';

/**
 * Register optimized QR scan routes
 * This is a simplified version that uses the direct TypeScript implementation
 */
export function registerOptimizedQRScanRoutes(app: any): void {
  log('Registering Optimized QR Scan Routes...', 'routes');
  
  try {
    const router = Router();
    
    // Status endpoint
    router.get('/status', (req: Request, res: Response) => {
      res.json({
        status: 'operational',
        service: 'optimized-qr-scanner',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    });
    
    // Analyze endpoint - Quick QR analysis
    router.post('/analyze', (req: Request, res: Response) => {
      try {
        const { qr_text } = req.body;
        
        if (!qr_text) {
          return res.status(400).json({
            error: 'Missing required parameter: qr_text'
          });
        }
        
        // Use direct implementation
        const result = analyzeQRText(qr_text);
        
        res.json({
          risk_score: result.risk_score,
          risk_level: result.risk_level,
          recommendation: result.risk_level === 'High' ? 'Block' : 
                          result.risk_level === 'Medium' ? 'Verify' : 'Allow',
          reasons: result.reasons,
          latency_ms: result.latency_ms,
          qr_type: result.qr_type
        });
      } catch (error) {
        log(`Error in optimized QR analysis: ${error}`, 'error');
        res.status(500).json({
          error: 'Failed to analyze QR code',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });
    
    // Mount the router
    app.use('/api/optimized-qr', router);
    
    log('✅ QR routes registered - using direct TypeScript implementation', 'qrscan');
  } catch (error) {
    log(`❌ Failed to register optimized QR routes: ${error}`, 'qrscan');
  }
}