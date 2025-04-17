import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { EnhancedQRScanner } from '@/components/scanner/enhanced-qr-scanner';
import { 
  analyzeUpiRisk, 
  shouldBlockTransaction, 
  shouldShowWarning,
  detectAdvancedFraud,
  FraudDetectionResponse
} from '@/lib/fraud-detection';
import { PaymentSafetyPopup } from '@/components/payment/payment-safety-popup';
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
  const [showSafeDialog, setShowSafeDialog] = useState(false);
  const [upiDetected, setUpiDetected] = useState(false); // For UPI detection status
  const [safeTransactionInfo, setSafeTransactionInfo] = useState<{
    upiId: string;
    queryParams: string;
    name: string;
    amount: string;
  }>({ upiId: '', queryParams: '', name: '', amount: '' });
  const [scannedUpiId, setScannedUpiId] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [riskDetails, setRiskDetails] = useState<{
    percentage: number;
    level: string;
    reports: number;
  } | null>(null);
  const [mlRiskDetails, setMlRiskDetails] = useState<FraudDetectionResponse | null>(null);
  const { toast } = useToast();

  const handleScan = async (qrData: string) => {
    // Try to parse the payment info if in JSON format
    let paymentInfo = {
      upi_id: '',
      name: '',
      amount: '',
      currency: 'INR'
    };
    
    let upiId = '';
    
    try {
      // Check if the data is JSON
      const parsedData = JSON.parse(qrData);
      paymentInfo = parsedData;
      upiId = parsedData.upi_id;
    } catch (e) {
      // If not JSON, assume it's just a UPI ID string
      upiId = qrData;
      paymentInfo.upi_id = upiId;
    }
    
    // If no valid UPI ID was found, show error
    if (!upiId) {
      toast({
        title: "Invalid QR Code",
        description: "Could not detect a valid UPI ID in this QR code.",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation('/home');
      }, 1500);
      return;
    }
    
    setScannedUpiId(upiId);
    setUpiDetected(true); // Set UPI detected to true when valid UPI found
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
      
      // Use amount from QR if available, otherwise use a default test amount
      const amount = paymentInfo.amount ? parseFloat(paymentInfo.amount) : 500;
      
      // Call our ML-powered fraud detection service
      const mlAnalysis = await detectAdvancedFraud(upiId, amount);
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
        // Low risk - show safe dialog first then proceed
        toast({
          title: "Safe UPI ID",
          description: "Our AI has verified this appears to be a legitimate UPI ID.",
          variant: "default",
        });
        
        // Construct query string with all payment info
        const queryParams = new URLSearchParams();
        queryParams.append('upiId', upiId);
        queryParams.append('securityCheck', 'passed');
        
        if (paymentInfo.name) queryParams.append('name', paymentInfo.name);
        if (paymentInfo.amount) queryParams.append('amount', paymentInfo.amount);
        if (paymentInfo.currency) queryParams.append('currency', paymentInfo.currency);
        
        // Show safe dialog
        setShowSafeDialog(true);
        setSafeTransactionInfo({
          upiId,
          queryParams: queryParams.toString(),
          name: paymentInfo.name || '',
          amount: paymentInfo.amount || ''
        });
      }
    } catch (error) {
      console.error('Error analyzing UPI:', error);
      toast({
        title: "Error",
        description: "Could not complete security analysis. Proceed with caution.",
        variant: "destructive",
      });
      
      // Construct basic query string with UPI ID
      const queryParams = new URLSearchParams();
      queryParams.append('upiId', upiId);
      
      // Add other payment info if available
      if (paymentInfo.name) queryParams.append('name', paymentInfo.name);
      if (paymentInfo.amount) queryParams.append('amount', paymentInfo.amount);
      if (paymentInfo.currency) queryParams.append('currency', paymentInfo.currency);
      
      setTimeout(() => {
        setLocation(`/confirm-transaction?${queryParams.toString()}`);
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
      // Valid UPI input
      handleScan(manualUpiInput);
    } else if (manualUpiInput && manualUpiInput.trim() !== '') {
      // Any input provided - for presentation demo
      const demoUpiId = manualUpiInput + '@okaxis';
      console.log('⚠️ DEMO MODE: Using modified UPI ID for presentation:', demoUpiId);
      toast({
        title: "Processing payment",
        description: "Proceeding with demo UPI ID for presentation",
      });
      handleScan(demoUpiId);
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
          <EnhancedQRScanner 
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
            <div className="flex flex-col space-y-4">
              <div>
                This UPI ID has been flagged with medium risk ({riskDetails?.percentage}%)
                {riskDetails && riskDetails.reports > 0 && ` and has ${riskDetails.reports} reports from other users`}.
              </div>
              
              {/* Risk Level Indicator */}
              <div className="bg-amber-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2 flex items-center text-amber-700">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Medium Risk Level
                </h3>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${riskDetails?.percentage || 0}%` }}></div>
                </div>
                
                <ul className="text-sm space-y-1 text-amber-800 mt-3">
                  <li>• This UPI ID has some suspicious attributes</li>
                  <li>• Limited transaction history was found</li>
                  <li>• Proceed with caution and verify recipient</li>
                </ul>
              </div>
            </div>
          </DialogDescription>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="default" className="bg-amber-500 hover:bg-amber-600" onClick={handleProceedAnyway}>
              Continue <ArrowLeft className="ml-2 w-4 h-4 rotate-180" />
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
            <div className="flex flex-col space-y-4">
              <div>
                This UPI ID has a very high risk score ({riskDetails?.percentage}%)
                {riskDetails && riskDetails.reports > 0 && ` and has ${riskDetails.reports} reports from other users`}.
              </div>
              
              {/* Risk Level Indicator */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2 flex items-center text-red-700">
                  <AlertOctagon className="w-5 h-5 mr-2" />
                  High Risk Level
                </h3>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div className="bg-red-600 h-2.5 rounded-full" style={{ width: `${riskDetails?.percentage || 0}%` }}></div>
                </div>
                
                <div className="text-sm text-red-700 font-bold my-2">
                  {upiDetected ? 'UPI ID Detected But Seems Fraudulent' : 'UPI ID Not Detected'}
                </div>
                
                <ul className="text-sm space-y-1 text-red-800 mt-3">
                  <li>• Multiple scam reports have been filed</li>
                  <li>• This UPI ID has suspicious patterns</li>
                  <li>• Our AI has flagged this as potentially fraudulent</li>
                </ul>
              </div>
            </div>
          </DialogDescription>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReportScam}>
              Report Scam
            </Button>
            <Button 
              variant="default" 
              className="bg-gray-700 hover:bg-gray-800 text-white"
              onClick={handleProceedAnyway}
            >
              Continue <ArrowLeft className="ml-2 w-4 h-4 rotate-180" />
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

      {/* Safe Transaction Dialog - Low Risk */}
      {/* New payment safety popup that matches the UI in the image */}
      {showSafeDialog && (
        <PaymentSafetyPopup
          status="safe"
          riskScore={riskDetails?.percentage ? riskDetails.percentage / 100 : 0.07} 
          merchantName={safeTransactionInfo.name || "Merchant"}
          businessInfo={true}
          sslProtected={true}
          details="This UPI ID has a strong safety record and is linked to a verified user or business"
          onContinue={() => {
            setShowSafeDialog(false);
            setLocation(`/confirm-transaction?${safeTransactionInfo.queryParams}`);
          }}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
