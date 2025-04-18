import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Import Instascan when it's available in the window object
declare global {
  interface Window {
    Instascan: any;
  }
}

interface QRPaymentFlowProps {
  onProcessQR: (qrData: any) => void;
  onCancel: () => void;
}

export function QRPaymentFlow({ onProcessQR, onCancel }: QRPaymentFlowProps) {
  const [scannerActive, setScannerActive] = useState(false);
  const [scanner, setScanner] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  const initScanner = () => {
    setScannerActive(true);
    
    if (!window.Instascan) {
      toast({
        title: "Camera Error",
        description: "QR scanner library not loaded. Please try again.",
        variant: "destructive",
      });
      setScannerActive(false);
      return;
    }
    
    let newScanner = new window.Instascan.Scanner({ 
      video: document.getElementById('scanner'),
      mirror: false
    });

    setScanner(newScanner);

    window.Instascan.Camera.getCameras()
      .then((cameras: any[]) => {
        if (cameras.length > 0) {
          newScanner.start(cameras[0]);
        } else {
          toast({
            title: "Camera Error",
            description: "No cameras found on your device",
            variant: "destructive",
          });
          resetScanner();
        }
      })
      .catch((err: any) => {
        console.error('Camera error:', err);
        toast({
          title: "Camera Error",
          description: "Unable to access camera. Please check permissions.",
          variant: "destructive",
        });
        resetScanner();
      });

    newScanner.addListener('scan', (content: string) => {
      if (validateUPIQr(content)) {
        processValidQR(content);
        newScanner.stop();
      } else {
        toast({
          title: "Invalid QR Code",
          description: "Please scan a valid UPI payment QR code",
          variant: "destructive",
        });
      }
    });
  };

  const validateUPIQr = (content: string): boolean => {
    // Basic UPI QR validation
    return content.startsWith('upi://pay?') || 
           content.startsWith('https://upi://pay?');
  };

  const processValidQR = (content: string) => {
    const params = new URLSearchParams(content.split('?')[1]);
    
    // Store payment details
    const qrData = {
      upiId: params.get('pa'),
      name: params.get('pn') || 'Merchant',
      amount: params.get('am') || ''
    };
    
    setPaymentData(qrData);
    setScannerActive(false);
  };

  const resetScanner = () => {
    if (scanner) {
      scanner.stop();
    }
    setScannerActive(false);
    setPaymentData(null);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and a single decimal point
    const value = e.target.value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
      // Don't allow multiple decimal points
      return;
    }
    setAmount(value);
  };

  const handleProceed = () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    // Finalize the payment data with amount
    const finalData = {
      ...paymentData,
      amount: amount
    };
    
    // Send data to parent component
    onProcessQR(finalData);
  };

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.stop();
      }
    };
  }, [scanner]);

  return (
    <div className="qr-payment-flow">
      {!scannerActive && !paymentData && (
        <div className="text-center">
          <Button 
            onClick={initScanner} 
            className="w-full"
          >
            Scan QR Code
          </Button>
        </div>
      )}
      
      {scannerActive && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div id="scanner-container" className="relative">
              <video id="scanner" className="w-full h-auto rounded-md bg-black"></video>
              <Button 
                onClick={resetScanner}
                variant="outline" 
                className="mt-4 w-full"
              >
                Cancel Scan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {paymentData && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">Payment Details</h3>
                <p className="text-sm text-muted-foreground">Confirm payment information</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">To:</span>
                  <span className="font-medium">{paymentData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">UPI ID:</span>
                  <span>{paymentData.upiId}</span>
                </div>
                {paymentData.amount && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Suggested Amount:</span>
                    <span>₹{paymentData.amount}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Payment Amount
                </label>
                <div className="flex items-center">
                  <span className="mr-2">₹</span>
                  <Input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder={paymentData.amount || "Enter amount"}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleProceed}
                  className="flex-1"
                  disabled={!amount}
                >
                  Proceed
                </Button>
                <Button 
                  onClick={resetScanner}
                  variant="outline" 
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}