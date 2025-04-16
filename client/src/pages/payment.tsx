import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ChevronRight, IndianRupee } from 'lucide-react';

export default function Payment() {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const { toast } = useToast();
  
  // Extract UPI ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const upiId = urlParams.get('upiId') || '';
  const securityCheck = urlParams.get('securityCheck') === 'passed';
  
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  
  // Payment app options with icons
  const paymentApps = [
    { id: 'gpay', name: 'Google Pay', icon: '../../googlepay_icon.svg', color: 'bg-white' },
    { id: 'phonepe', name: 'PhonePe', icon: '../../phonepe_icon.svg', color: 'bg-[#5f259f]' },
    { id: 'paytm', name: 'Paytm', icon: '../../paytm_icon.svg', color: 'bg-[#00baf2]' },
  ];
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input
    const value = e.target.value.replace(/[^0-9]/g, '');
    setAmount(value);
  };
  
  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNote(e.target.value);
  };
  
  const selectPaymentApp = (appId: string) => {
    setSelectedApp(appId);
  };
  
  const handleProceed = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid payment amount',
        variant: 'destructive',
      });
      return;
    }
    
    if (!selectedApp) {
      toast({
        title: 'Select payment app',
        description: 'Please select a payment app to proceed',
        variant: 'destructive',
      });
      return;
    }
    
    // In a real app, we would prepare deep links for the selected payment app
    // For demo, we'll just navigate to the transaction success screen
    const paymentDetails = {
      upiId,
      amount,
      note,
      app: selectedApp,
      timestamp: new Date().toISOString(),
    };
    
    // Store payment details in session storage for the success screen
    sessionStorage.setItem('lastPayment', JSON.stringify(paymentDetails));
    
    // Navigate to success screen
    setLocation(`/payment-success?amount=${amount}&app=${selectedApp}`);
  };
  
  const handleBack = () => {
    setLocation(`/confirm-transaction?upiId=${encodeURIComponent(upiId)}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b p-4 flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleBack}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Complete Payment</h1>
      </div>
      
      <div className="flex-1 p-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* UPI ID Display */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Merchant UPI ID</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="font-medium">{upiId}</div>
                {securityCheck && (
                  <div className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full">
                    Verified
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Amount Entry */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Payment Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="flex-none w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  <IndianRupee className="h-5 w-5 text-gray-500" />
                </div>
                <Input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="Enter amount"
                  className="text-lg font-semibold"
                />
              </div>
              
              <div className="mt-4">
                <Input
                  type="text"
                  value={note}
                  onChange={handleNoteChange}
                  placeholder="Add a note (optional)"
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Payment App Selection */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Select Payment App</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {paymentApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => selectPaymentApp(app.id)}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                    ${selectedApp === app.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className={`w-10 h-10 ${app.color} rounded-full flex items-center justify-center mr-3`}>
                    {/* App icon would be displayed here in a real app */}
                    <div className="text-center font-bold text-sm">{app.name.charAt(0)}</div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{app.name}</div>
                  </div>
                  <ChevronRight className={`h-5 w-5 ${selectedApp === app.id ? 'text-primary' : 'text-gray-400'}`} />
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleProceed}
                disabled={!amount || !selectedApp}
              >
                Proceed to Pay ₹{amount || '0'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}