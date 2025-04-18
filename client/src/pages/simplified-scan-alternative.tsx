import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { ArrowLeft, QrCode, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Payment app options
const paymentApps = [
  { id: 'gpay', name: 'Google Pay', color: 'bg-white', deepLink: 'gpay://' },
  { id: 'phonepe', name: 'PhonePe', color: 'bg-[#5f259f]', deepLink: 'phonepe://' },
  { id: 'paytm', name: 'Paytm', color: 'bg-[#00baf2]', deepLink: 'paytm://' },
];

export default function SimplifiedScanAlternative() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [paymentData, setPaymentData] = useState({
    upiId: '',
    name: 'Demo Merchant',
    amount: ''
  });
  const { toast } = useToast();
  
  const handleStartScanning = () => {
    setCameraActive(true);
    
    // Simulate successful scan after 2 seconds
    setTimeout(() => {
      setCameraActive(false);
      setPaymentData({
        upiId: 'demostore@okaxis',
        name: 'Demo Store',
        amount: ''
      });
      
      toast({
        title: "QR Scanned Successfully",
        description: `Payment to Demo Store (demostore@okaxis)`,
      });
      
      setShowPaymentConfirm(true);
    }, 2000);
  };
  
  const handleBack = () => {
    if (showPaymentConfirm) {
      setShowPaymentConfirm(false);
      setPaymentData({
        upiId: '',
        name: 'Demo Merchant',
        amount: ''
      });
    } else if (cameraActive) {
      setCameraActive(false);
    } else {
      setLocation('/home');
    }
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentData({
      ...paymentData,
      amount: e.target.value
    });
  };
  
  const handlePaymentApp = (appId: string) => {
    setIsLoading(true);
    
    // Find the selected payment app
    const app = paymentApps.find(a => a.id === appId);
    if (!app) return;
    
    // For demo, we'll show a toast and redirect to success
    toast({
      title: `Redirecting to ${app.name}`,
      description: `Opening ${app.name} for payment of ₹${paymentData.amount}`,
    });
    
    // Simulate app opening delay
    setTimeout(() => {
      // For demo, redirect to success page
      const successParams = new URLSearchParams();
      successParams.append('amount', paymentData.amount);
      successParams.append('app', appId);
      successParams.append('merchantName', paymentData.name);
      successParams.append('upiId', paymentData.upiId);
      
      setLocation(`/success?${successParams.toString()}`);
    }, 1500);
  };
  
  const handleProceed = () => {
    if (!paymentData.amount) {
      toast({
        title: "Amount Required",
        description: "Please enter payment amount",
        variant: "destructive"
      });
      return;
    }
    
    // Show payment app selection
    setShowPaymentConfirm(true);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white p-4 flex items-center border-b">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleBack}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">
          {showPaymentConfirm ? 'Payment Options' : cameraActive ? 'Scanning QR Code' : 'QR Payment'}
        </h1>
      </div>
      
      <div className="flex-1 p-4">
        <div className="max-w-md mx-auto">
          {!showPaymentConfirm && !cameraActive ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-center">UPI QR Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleStartScanning}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <QrCode className="h-5 w-5" />
                  <span>Scan QR Code</span>
                </Button>
                
                {paymentData.upiId && (
                  <div className="space-y-4 mt-6 border-t pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Merchant Name</label>
                      <Input value={paymentData.name} readOnly className="bg-gray-50" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">UPI ID</label>
                      <Input value={paymentData.upiId} readOnly className="bg-gray-50" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount (₹)</label>
                      <Input 
                        type="number"
                        placeholder="Enter amount"
                        value={paymentData.amount}
                        onChange={handleAmountChange}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleProceed}
                      className="w-full"
                      disabled={!paymentData.amount}
                    >
                      Proceed to Pay
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : cameraActive ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Scanning QR Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-square bg-black rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-white animate-pulse">Camera Loading...</div>
                  <div className="absolute inset-0 border-2 border-blue-500 border-opacity-50"></div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setCameraActive(false)}
                  className="w-full"
                >
                  Cancel Scan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Select Payment App</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-500">Merchant</span>
                    <span className="font-medium">{paymentData.name}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-500">UPI ID</span>
                    <span>{paymentData.upiId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Amount</span>
                    <span className="font-medium">₹{paymentData.amount}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {paymentApps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => handlePaymentApp(app.id)}
                      className="flex items-center w-full p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                      disabled={isLoading}
                    >
                      <div className={`w-10 h-10 ${app.color} rounded-full flex items-center justify-center mr-3 border`}>
                        <div className="text-center font-bold text-sm">{app.name.charAt(0)}</div>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{app.name}</div>
                      </div>
                      {isLoading && app.id === 'gpay' && (
                        <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="mt-4 text-center text-sm text-gray-500">
                  <p>You'll be redirected to complete the payment</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}