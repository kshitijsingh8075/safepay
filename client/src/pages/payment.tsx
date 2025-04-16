import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Store, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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
  const { toast } = useToast();
  
  // Get UPI ID from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const urlUpiId = params.get('upiId');
    
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
  }, [location]);

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

  const handlePayment = () => {
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
      
      <Card className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 mb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-[#F5F6FA] rounded-full flex items-center justify-center mr-3">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{merchant}</h3>
            <p className="text-xs text-gray-500">{upiId}</p>
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
      
      <Button
        onClick={handlePayment}
        className="bg-primary text-white font-semibold py-4 px-6 rounded-xl shadow-md w-full"
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
  );
}
