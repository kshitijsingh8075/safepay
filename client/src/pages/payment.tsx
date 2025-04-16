import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Store, AlertCircle, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { detectAdvancedFraud } from '@/lib/fraud-detection';
import { useToast } from '@/hooks/use-toast';

// For deep linking to payment apps
function openPaymentApp(app: string, upiId: string, amount: string, note: string) {
  const amountInRupees = parseFloat(amount);
  const amountInPaise = Math.round(amountInRupees * 100);
  
  let url = '';
  
  switch(app.toLowerCase()) {
    case 'gpay':
      url = `tez://upi/pay?pa=${upiId}&am=${amountInRupees}&pn=Payment&tn=${encodeURIComponent(note)}`;
      break;
    case 'phonepe':
      url = `phonepe://pay?pa=${upiId}&am=${amountInRupees}&pn=Payment&tn=${encodeURIComponent(note)}`;
      break;
    case 'paytm':
      url = `paytmmp://pay?pa=${upiId}&am=${amountInRupees}&pn=Payment&tn=${encodeURIComponent(note)}`;
      break;
    default:
      // Default UPI intent
      url = `upi://pay?pa=${upiId}&am=${amountInRupees}&pn=Payment&tn=${encodeURIComponent(note)}`;
  }
  
  // Open the URL
  window.open(url, '_blank');
  
  // Fallback if deep linking fails
  setTimeout(() => {
    // If we're still here, the app may not be installed or deep linking failed
    // We could show a fallback or open the web version
    console.log('Deep linking may have failed, providing fallback...');
  }, 1000);
}

export default function Payment() {
  const [location, setLocation] = useLocation();
  const [amount, setAmount] = useState('850.00');
  const [note, setNote] = useState('');
  const [upiId, setUpiId] = useState('citysupermarket@upi');
  const [merchant, setMerchant] = useState('City Supermarket');
  const [isLoading, setIsLoading] = useState(false);
  const [securityCheckPassed, setSecurityCheckPassed] = useState(false);
  const [warningShown, setWarningShown] = useState(false);
  const [showRecheckDialog, setShowRecheckDialog] = useState(false);
  const [recheckLoading, setRecheckLoading] = useState(false);
  const [recheckResult, setRecheckResult] = useState<{
    prediction: boolean;
    confidence: number;
  } | null>(null);
  const { toast } = useToast();
  
  // Get UPI ID and security info from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const urlUpiId = params.get('upiId');
    const securityCheck = params.get('securityCheck');
    const riskWarning = params.get('riskWarningShown');
    
    if (securityCheck === 'passed') {
      setSecurityCheckPassed(true);
    }
    
    if (riskWarning === 'true') {
      setWarningShown(true);
      
      toast({
        title: "Warning Acknowledged",
        description: "You're proceeding despite security warnings. Please be extra cautious.",
        variant: "destructive",
      });
    }
    
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
    }
  }, [location, toast]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and one decimal point
    const value = e.target.value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Ensure only 2 digits after decimal point
    if (parts[1]?.length > 2) {
      return;
    }
    
    setAmount(value);
  };

  // Function to handle advanced security recheck based on amount
  const handleSecurityRecheck = async () => {
    setRecheckLoading(true);
    setShowRecheckDialog(true);
    
    try {
      // Call ML fraud detection service with actual amount
      const mlAnalysis = await detectAdvancedFraud(upiId, parseFloat(amount));
      
      setRecheckResult({
        prediction: mlAnalysis.prediction,
        confidence: mlAnalysis.confidence
      });
      
      // If transaction is flagged as fraud by ML
      if (mlAnalysis.prediction) {
        toast({
          title: "High Fraud Risk Detected",
          description: `Our AI has flagged this transaction as suspicious with ${(mlAnalysis.confidence * 100).toFixed(0)}% confidence.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error during security recheck:', error);
      toast({
        title: "Security Check Failed",
        description: "We couldn't complete the advanced security check. Proceed with caution.",
        variant: "destructive",
      });
    } finally {
      setRecheckLoading(false);
    }
  };

  const handlePayment = async () => {
    setIsLoading(true);
    
    // Check if amount is valid
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    // If amount is large (>1000) and no security check or warning was shown,
    // suggest a security recheck for maximum protection
    if (parseFloat(amount) > 1000 && !securityCheckPassed && !warningShown && !recheckResult) {
      toast({
        title: "Large Transaction Detected",
        description: "For transactions over ₹1000, we recommend an additional security check.",
        variant: "default",
      });
      handleSecurityRecheck();
      setIsLoading(false);
      return;
    }
    
    // If a recheck was performed and it detected fraud, warn again
    if (recheckResult && recheckResult.prediction) {
      if (window.confirm("This transaction has been flagged as potentially fraudulent. Are you absolutely sure you want to proceed?")) {
        // Continue with payment despite warning
      } else {
        setIsLoading(false);
        return;
      }
    }
    
    try {
      // In a real app, we would process the payment through UPI deep linking
      // For demo purposes, we'll simulate success after a delay
      
      // Get user's preferred payment app (could be stored in settings)
      // Default to generic UPI intent which will let user choose
      const preferredApp = localStorage.getItem('preferredPaymentApp') || 'upi';
      
      // Try to open the payment app with deep linking
      openPaymentApp(preferredApp, upiId, amount, note || 'Payment');
      
      // Show success after a brief delay (simulate payment completion)
      setTimeout(() => {
        setLocation('/success');
        setIsLoading(false);
      }, 2000);
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
    <div className="flex flex-col px-6 py-8 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => setLocation('/home')}
          className="w-10 h-10 bg-[#F5F6FA] rounded-full flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Payment</h1>
        <div className="w-10"></div>
      </div>
      
      <Card className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 mb-4">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-[#F5F6FA] rounded-full flex items-center justify-center mr-3">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{merchant}</h3>
            <p className="text-xs text-gray-500">{upiId}</p>
          </div>
          <div className="ml-auto">
            {securityCheckPassed ? (
              <div className="flex items-center text-green-600 text-sm">
                <Shield className="h-4 w-4 mr-1" />
                <span>Verified</span>
              </div>
            ) : warningShown ? (
              <div className="flex items-center text-amber-500 text-sm">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span>Caution</span>
              </div>
            ) : (
              <button 
                onClick={handleSecurityRecheck}
                className="text-blue-600 text-sm flex items-center"
                disabled={recheckLoading}
              >
                {recheckLoading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-1" />
                )}
                <span>Check</span>
              </button>
            )}
          </div>
        </div>
        
        <div className="border-t border-b border-gray-100 py-4 my-4">
          <label className="block text-sm text-gray-500 mb-2">Enter Amount</label>
          <div className="flex items-center">
            <span className="text-2xl font-semibold mr-2">₹</span>
            <Input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              className="text-3xl font-bold flex-1 border-none focus:ring-0 p-0"
              placeholder="0"
            />
          </div>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Add a note (optional)</p>
          <Input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full py-2 border-none focus:ring-0 text-sm"
            placeholder="Groceries, essentials, etc."
          />
        </div>
      </Card>
      
      {/* Security Status Card */}
      {(recheckResult || securityCheckPassed || warningShown) && (
        <Card className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 mb-4">
          <div className="flex items-center">
            {recheckResult && recheckResult.prediction ? (
              <>
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <div>
                  <p className="font-medium text-red-600">High Risk Detected</p>
                  <p className="text-sm text-gray-600">Our AI detected potential fraud with {(recheckResult.confidence * 100).toFixed(0)}% confidence.</p>
                </div>
              </>
            ) : securityCheckPassed ? (
              <>
                <Shield className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="font-medium text-green-600">Secure Transaction</p>
                  <p className="text-sm text-gray-600">This transaction passed all security checks.</p>
                </div>
              </>
            ) : warningShown && (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                <div>
                  <p className="font-medium text-amber-500">Proceed with Caution</p>
                  <p className="text-sm text-gray-600">You're proceeding despite security warnings.</p>
                </div>
              </>
            )}
          </div>
        </Card>
      )}
      
      <div className="flex space-x-2 mb-4">
        {!securityCheckPassed && !warningShown && (
          <Button 
            onClick={handleSecurityRecheck} 
            variant="outline" 
            className="flex-1"
            disabled={recheckLoading}
          >
            {recheckLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            Security Check
          </Button>
        )}
        <Button
          onClick={handlePayment}
          className="bg-primary text-white font-semibold py-4 px-6 rounded-xl shadow-md flex-1"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Pay Now"
          )}
        </Button>
      </div>
      
      {/* Security Recheck Dialog */}
      <Dialog open={showRecheckDialog} onOpenChange={setShowRecheckDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle className="flex items-center text-primary">
            <Shield className="mr-2 h-5 w-5" />
            Advanced Security Check
          </DialogTitle>
          <DialogDescription>
            <div className="flex flex-col space-y-4">
              {recheckLoading ? (
                <>
                  <p>Analyzing this transaction for potential fraud...</p>
                  <div className="flex items-center justify-center text-amber-500 py-4">
                    <Loader2 className="h-8 w-8 animate-spin mr-2" />
                  </div>
                </>
              ) : recheckResult ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-md ${recheckResult.prediction ? 'bg-red-50' : 'bg-green-50'}`}>
                    <div className="flex items-center">
                      {recheckResult.prediction ? (
                        <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
                      ) : (
                        <Shield className="h-6 w-6 text-green-600 mr-2" />
                      )}
                      <div>
                        <p className={`font-medium ${recheckResult.prediction ? 'text-red-800' : 'text-green-800'}`}>
                          {recheckResult.prediction ? 'Potential Fraud Detected' : 'Transaction Appears Safe'}
                        </p>
                        <p className="text-sm">
                          {recheckResult.prediction 
                            ? `AI confidence: ${(recheckResult.confidence * 100).toFixed(0)}%` 
                            : `Security check passed with ${(100 - recheckResult.confidence * 100).toFixed(0)}% confidence`}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    {recheckResult.prediction 
                      ? 'We recommend canceling this transaction for your safety.' 
                      : 'You can proceed with this transaction with confidence.'}
                  </p>
                </div>
              ) : (
                <p>Starting security check...</p>
              )}
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
}
