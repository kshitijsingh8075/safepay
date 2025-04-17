import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';

interface UpiPinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  upiApp?: string; // The selected UPI app name
}

export function UpiPinDialog({
  open,
  onOpenChange,
  onSuccess,
  upiApp = 'UPI'
}: UpiPinDialogProps) {
  const [upiPin, setUpiPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
  
  // Demo PIN for testing
  const DEMO_PIN = '979480';
  
  const handleVerifyPin = () => {
    if (upiPin.length !== 6) {
      toast({
        title: "Invalid PIN",
        description: "Please enter a 6-digit UPI PIN",
        variant: "destructive",
      });
      return;
    }
    
    setIsVerifying(true);
    
    // Simulate PIN verification
    setTimeout(() => {
      if (upiPin === DEMO_PIN) {
        toast({
          title: "Payment Successful",
          description: "Your transaction has been processed successfully",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Incorrect PIN",
          description: "The UPI PIN you entered is incorrect",
          variant: "destructive",
        });
      }
      setIsVerifying(false);
    }, 1500);
  };
  
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits and limit to 6 characters
    if (/^\d*$/.test(value) && value.length <= 6) {
      setUpiPin(value);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogTitle className="text-center">Enter UPI PIN</DialogTitle>
        <DialogDescription className="text-center">
          Please enter your 6-digit {upiApp} UPI PIN to authenticate this payment
        </DialogDescription>
        
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-full max-w-[200px]">
            <Input
              type="password"
              inputMode="numeric"
              value={upiPin}
              onChange={handlePinChange}
              className="text-center text-lg tracking-widest h-12"
              placeholder="******"
              autoFocus
            />
          </div>
          
          <p className="text-xs text-muted-foreground">
            Enter the 6-digit PIN (979480) linked to your UPI account
          </p>
        </div>
        
        <DialogFooter className="flex flex-col">
          <Button 
            onClick={handleVerifyPin} 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isVerifying || upiPin.length !== 6}
          >
            {isVerifying ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Pay Now'
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full mt-2"
            onClick={() => onOpenChange(false)}
            disabled={isVerifying}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}