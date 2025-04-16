import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { QRScanner } from '@/components/scanner/qr-scanner';
import { 
  analyzeUpiRisk, 
  shouldBlockTransaction, 
  shouldShowWarning,
  detectAdvancedFraud,
  FraudDetectionResponse
} from '@/lib/fraud-detection';
import { AlertTriangle, AlertCircle, CheckCircle, Shield, AlertOctagon, Loader2, ChevronLeft, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export default function Scan() {
  const [, setLocation] = useLocation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);
  const [showMlAnalysis, setShowMlAnalysis] = useState(false);
  const [scannedUpiId, setScannedUpiId] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [riskDetails, setRiskDetails] = useState<{
    percentage: number;
    level: string;
    reports: number;
  } | null>(null);
  const [mlRiskDetails, setMlRiskDetails] = useState<FraudDetectionResponse | null>(null);
  const { toast } = useToast();

  const handleScan = async (upiId: string) => {
    setScannedUpiId(upiId);
    setIsAnalyzing(true);
    setAnalysisProgress(10);
    
    try {
      // Step 1: Initial UPI risk analysis
      setAnalysisProgress(30);
      const riskAnalysis = await analyzeUpiRisk(upiId);
      
      // Store risk details
      setRiskDetails({
        percentage: riskAnalysis.riskPercentage,
        level: riskAnalysis.riskLevel,
        reports: riskAnalysis.reports
      });
      
      // Step 2: Advanced ML-based fraud detection
      setAnalysisProgress(50);
      setShowMlAnalysis(true);
      
      // Use a default test amount for analysis (will be changed by user later)
      const testAmount = 500; 
      
      // Call our ML-powered fraud detection service
      const mlAnalysis = await detectAdvancedFraud(upiId, testAmount);
      setMlRiskDetails(mlAnalysis);
      setAnalysisProgress(100);
      
      // Determine what to do based on risk assessment
      // Priority to ML result if available, otherwise fall back to basic risk analysis
      if (mlAnalysis.prediction) {
        // ML model predicts this is likely fraud
        setShowBlocked(true);
      } else if (shouldBlockTransaction(riskAnalysis.riskPercentage)) {
        // High risk from basic analysis - show blocking screen
        setShowBlocked(true);
      } else if (shouldShowWarning(riskAnalysis.riskPercentage) || mlAnalysis.confidence > 0.3) {
        // Medium risk - show warning
        setShowWarning(true);
      } else {
        // Low risk - proceed to confirmation page
        toast({
          title: "Safe UPI ID",
          description: "Our AI has verified this appears to be a legitimate UPI ID.",
          variant: "default",
        });
        setTimeout(() => {
          setLocation(`/confirm-transaction?upiId=${encodeURIComponent(upiId)}&securityCheck=passed`);
        }, 1000);
      }
    } catch (error) {
      console.error('Error analyzing UPI:', error);
      toast({
        title: "Error",
        description: "Could not complete security analysis. Proceed with caution.",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation(`/confirm-transaction?upiId=${encodeURIComponent(upiId)}`);
      }, 1500);
    } finally {
      setIsAnalyzing(false);
      setShowMlAnalysis(false);
    }
  };

  const handleClose = () => {
    setLocation('/home');
  };

  const handleProceedAnyway = () => {
    // User chose to continue despite warning
    setShowWarning(false);
    
    // Add a risk flag to indicate the user ignored warnings
    setLocation(`/confirm-transaction?upiId=${encodeURIComponent(scannedUpiId)}&riskWarningShown=true`);
  };

  const handleReportScam = () => {
    // User chose to report the blocked UPI
    setShowBlocked(false);
    
    // Include ML risk confidence in the report if available
    const mlConfidence = mlRiskDetails ? `&mlConfidence=${mlRiskDetails.confidence}` : '';
    setLocation(`/report-scam?upiId=${encodeURIComponent(scannedUpiId)}${mlConfidence}`);
  };

  const handleCancel = () => {
    // User chose to cancel the transaction
    setShowWarning(false);
    setShowBlocked(false);
    setShowMlAnalysis(false);
    setLocation('/home');
  };

  const [manualUpiMode, setManualUpiMode] = useState(false);
  const [manualUpiInput, setManualUpiInput] = useState('');
  
  const handleManualUpiSubmit = () => {
    if (manualUpiInput && manualUpiInput.includes('@')) {
      handleScan(manualUpiInput);
    } else {
      toast({
        title: "Invalid UPI ID",
        description: "Please enter a valid UPI ID in the format username@provider",
        variant: "destructive",
      });
    }
  };
  
  // Toggle to manual UPI entry mode
  const toggleManualMode = () => {
    setManualUpiMode(!manualUpiMode);
  };
  
  return (
    <>
      {!manualUpiMode ? (
        <>
          <QRScanner 
            onScan={handleScan}
            onClose={handleClose}
          />
          
          {/* Floating button to switch to manual entry */}
          <button
            onClick={toggleManualMode}
            className="fixed bottom-28 right-6 bg-white text-primary font-medium px-4 py-2 rounded-lg shadow-lg z-50"
          >
            Manual Entry
          </button>
        </>
      ) : (
        <div className="relative flex flex-col h-screen bg-black p-6">
          <div className="w-full flex justify-between items-center mb-8">
            <button 
              onClick={() => setManualUpiMode(false)}
              className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
            <p className="text-white font-medium">Manual UPI Entry</p>
            <div className="w-10"></div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="font-bold text-lg mb-4">Enter UPI ID</h2>
              <Input
                value={manualUpiInput}
                onChange={(e) => setManualUpiInput(e.target.value)}
                placeholder="username@provider"
                className="mb-4"
              />
              <Button 
                onClick={handleManualUpiSubmit}
                className="w-full bg-primary"
              >
                Verify & Proceed
              </Button>
              
              <div className="mt-4 text-sm text-gray-500">
                <p>Examples:</p>
                <ul className="list-disc ml-5 mt-2">
                  <li>merchant@yesbank</li>
                  <li>myshop@okaxis</li>
                  <li>businessname@okicici</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Warning Dialog - Medium Risk */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle className="flex items-center text-amber-500">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Caution Required
          </DialogTitle>
          <DialogDescription>
            This UPI ID has been flagged with medium risk ({riskDetails?.percentage}%)
            {riskDetails && riskDetails.reports > 0 && ` and has ${riskDetails.reports} reports from other users`}.
            Proceed with caution.
          </DialogDescription>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="default" className="bg-amber-500 hover:bg-amber-600" onClick={handleProceedAnyway}>
              Proceed Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Block Dialog - High Risk */}
      <Dialog open={showBlocked} onOpenChange={setShowBlocked}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle className="flex items-center text-red-600">
            <AlertCircle className="mr-2 h-5 w-5" />
            Payment Blocked
          </DialogTitle>
          <DialogDescription>
            This UPI ID has a very high risk score ({riskDetails?.percentage}%)
            {riskDetails && riskDetails.reports > 0 && ` and has ${riskDetails.reports} reports from other users`}.
            We've blocked this transaction for your safety.
          </DialogDescription>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReportScam}>
              Report Scam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* ML Analysis Dialog */}
      <Dialog open={showMlAnalysis} onOpenChange={setShowMlAnalysis}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle className="flex items-center text-primary">
            <Shield className="mr-2 h-5 w-5" />
            Advanced Security Check
          </DialogTitle>
          <DialogDescription>
            <div className="flex flex-col space-y-4">
              <p>Our AI is analyzing this transaction for potential fraud...</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{analysisProgress}%</span>
                </div>
                <Progress value={analysisProgress} className="h-2" />
              </div>
              
              {mlRiskDetails && (
                <div className="mt-4 space-y-2 bg-gray-50 p-3 rounded-md">
                  <h4 className="font-medium">AI Analysis Results:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Transaction Frequency:</div>
                    <div className="font-medium">{mlRiskDetails.live_data.tx_frequency}/day</div>
                    
                    <div>Recent Reports:</div>
                    <div className="font-medium">{mlRiskDetails.live_data.recent_reports}</div>
                    
                    <div>Average Amount:</div>
                    <div className="font-medium">₹{mlRiskDetails.live_data.avg_amount.toFixed(2)}</div>
                    
                    <div>Confidence Score:</div>
                    <div className="font-medium">{(mlRiskDetails.confidence * 100).toFixed(1)}%</div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-center text-amber-500">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Please wait while we complete the security check...</span>
              </div>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}
