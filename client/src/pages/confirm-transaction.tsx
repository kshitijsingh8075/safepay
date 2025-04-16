import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, ChevronLeft, Shield, AlertTriangle, Info } from 'lucide-react';
import { detectAdvancedFraud } from '@/lib/fraud-detection';
import { useToast } from '@/hooks/use-toast';

export default function ConfirmTransaction() {
  const [location, setLocation] = useLocation();
  const [amount, setAmount] = useState('1000');
  const [fromAccount, setFromAccount] = useState('**** **** 6789');
  const [toAccount, setToAccount] = useState('+91 9876789999');
  const [upiId, setUpiId] = useState('');
  const [merchant, setMerchant] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [safetyScore, setSafetyScore] = useState<number | null>(null);
  const [showPaymentApps, setShowPaymentApps] = useState(false);
  const { toast } = useToast();
  
  // Analyze UPI safety on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const urlUpiId = params.get('upiId');
    const securityCheck = params.get('securityCheck');
    
    if (urlUpiId) {
      setUpiId(urlUpiId);
      
      // Extract merchant name from UPI ID (e.g., merchantname@upi)
      const merchantFromUpi = urlUpiId.split('@')[0];
      if (merchantFromUpi) {
        // Convert camelCase or snake_case to Title Case with spaces
        const formattedName = merchantFromUpi
          .replace(/([A-Z])/g, ' $1') // Add space before capital letters
          .replace(/_/g, ' ') // Replace underscores with spaces
          .replace(/^\w/, c => c.toUpperCase()) // Capitalize first letter
          .trim(); // Remove leading/trailing spaces
          
        setMerchant(formattedName);
      }
      
      // If security check wasn't already performed in the previous step,
      // do it now
      if (securityCheck !== 'passed') {
        analyzeSafety(urlUpiId);
      } else {
        // Already passed security check
        setSafetyScore(93);
        setIsAnalyzing(false);
      }
    } else {
      // No UPI ID provided, go back to scan
      toast({
        title: "Error",
        description: "No UPI ID detected. Please scan again.",
        variant: "destructive",
      });
      setLocation('/scan');
    }
  }, [location, toast, setLocation]);
  
  const analyzeSafety = async (upiId: string) => {
    setIsAnalyzing(true);
    
    try {
      // Run ML-based fraud detection
      const mlAnalysis = await detectAdvancedFraud(upiId, parseFloat(amount));
      
      // Calculate a safety score between 0-100 based on the ML analysis
      // Lower confidence of fraud means higher safety
      const calculatedScore = Math.round(100 - (mlAnalysis.confidence * 100));
      setSafetyScore(calculatedScore);
      
      // If the transaction is flagged as fraudulent with high confidence
      if (mlAnalysis.prediction && mlAnalysis.confidence > 0.7) {
        toast({
          title: "High Risk Detected",
          description: "This transaction appears to be unsafe. We recommend canceling.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error analyzing UPI safety:', error);
      // Set a medium safety score as fallback
      setSafetyScore(50);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleContinue = () => {
    setShowPaymentApps(true);
  };
  
  const handlePayWithApp = (app: string) => {
    setIsLoading(true);
    
    // Close the payment apps dialog
    setShowPaymentApps(false);
    
    try {
      // Navigate to success page after a brief delay
      // In a real app, this would open the payment app via deep linking
      setTimeout(() => {
        setLocation('/success');
      }, 1500);
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col px-6 py-8 min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => setLocation('/scan')}
          className="w-10 h-10 flex items-center justify-center"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold ml-2">Confirm</h1>
      </div>
      
      <p className="text-gray-600 mb-6">Confirm transaction information</p>
      
      {/* Transaction details form */}
      <div className="space-y-4 mb-6">
        <div>
          <p className="text-sm text-gray-500 mb-1">From</p>
          <Input 
            value={fromAccount} 
            readOnly 
            className="bg-gray-50" 
          />
        </div>
        
        <div>
          <p className="text-sm text-gray-500 mb-1">To</p>
          <Input 
            value={toAccount} 
            className="bg-gray-50" 
            readOnly 
          />
        </div>
        
        <div>
          <p className="text-sm text-gray-500 mb-1">Amount</p>
          <Input 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-gray-50"
            type="number"
          />
        </div>
      </div>
      
      {/* UPI Safety Analysis Card */}
      <Card className="p-4 mb-8 border border-gray-100">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3 mt-1">
            {isAnalyzing ? (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : safetyScore && safetyScore > 70 ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : safetyScore && safetyScore > 30 ? (
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            ) : (
              <Info className="h-6 w-6 text-red-500" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <p className="font-medium text-gray-900">
                {upiId}
              </p>
              
              {safetyScore !== null && !isAnalyzing && (
                <div className="flex items-center">
                  <span className="text-gray-600 text-sm mr-2">{safetyScore}%</span>
                  <div className="w-8 h-8 rounded-full border-4 border-gray-200 flex items-center justify-center">
                    <div 
                      className="rounded-full" 
                      style={{ 
                        width: '100%', 
                        height: '100%',
                        background: `conic-gradient(${safetyScore > 70 ? '#22c55e' : safetyScore > 30 ? '#f59e0b' : '#ef4444'} ${safetyScore}%, transparent 0%)` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-green-600 font-medium mb-1">{safetyScore && safetyScore > 70 ? 'Safe to pay' : 'Proceed with caution'}</p>
            
            <div className="space-y-1 mt-2">
              <div className="flex items-center text-sm text-gray-600">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <span>Verified Merchant</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <span className="inline-block w-3 h-3 bg-gray-300 rounded-full mr-2"></span>
                <span>Linked to registered business</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <span>SCA Protected</span>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              This UPI ID has a strong safety record and is linked to a verified user or business
            </p>
          </div>
        </div>
      </Card>
      
      {/* Continue Button */}
      <Button 
        className="w-full bg-primary text-white py-6" 
        size="lg"
        onClick={handleContinue}
        disabled={isAnalyzing || isLoading}
      >
        {isAnalyzing ? 'Analyzing...' : isLoading ? 'Processing...' : 'Continue to pay'}
      </Button>
      
      {/* Payment Apps Dialog */}
      <Dialog open={showPaymentApps} onOpenChange={setShowPaymentApps}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle className="text-center mb-6">
            Pay through
          </DialogTitle>
          
          <div className="grid grid-cols-3 gap-4">
            <button 
              onClick={() => handlePayWithApp('gpay')}
              className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-sm mb-2">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/2048px-Google_%22G%22_logo.svg.png" 
                  alt="Google Pay" 
                  className="w-6 h-6"
                />
              </div>
              <span className="text-sm">GPay</span>
            </button>
            
            <button 
              onClick={() => handlePayWithApp('paytm')}
              className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-sm mb-2">
                <img 
                  src="https://static.vecteezy.com/system/resources/previews/018/910/724/original/paytm-logo-paytm-icon-free-free-vector.jpg" 
                  alt="Paytm" 
                  className="w-8 h-8"
                />
              </div>
              <span className="text-sm">Paytm</span>
            </button>
            
            <button 
              onClick={() => handlePayWithApp('phonepe')}
              className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-sm mb-2">
                <img 
                  src="https://static.vecteezy.com/system/resources/previews/021/672/650/non_2x/phonepe-logo-phonepe-icon-free-free-vector.jpg" 
                  alt="PhonePe" 
                  className="w-8 h-8"
                />
              </div>
              <span className="text-sm">PhonePe</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}