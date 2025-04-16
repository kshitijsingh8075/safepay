import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { OtpInput } from "@/components/ui/otp-input";
import { useLocation } from "wouter";
import { Loader2, ArrowRight, Phone } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isValidPhoneNumber } from "@/lib/upi";
import { useToast } from "@/hooks/use-toast";

export default function PhoneLogin() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Request OTP mutation
  const requestOtpMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/request-otp", { phoneNumber });
      return await res.json();
    },
    onSuccess: (data) => {
      // In development, we show the OTP in a toast for ease of testing
      if (data.otp) {
        toast({
          title: "OTP Generated",
          description: `Your OTP is: ${data.otp}`,
        });
      }
      setStep("otp");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    },
  });

  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async (otp: string) => {
      const res = await apiRequest("POST", "/api/auth/verify-otp", { 
        phoneNumber, 
        otp 
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Login Successful",
        description: "You have successfully logged in.",
      });

      // Redirect to home page
      setTimeout(() => {
        setLocation("/home");
      }, 1000);
    },
    onError: (error: Error) => {
      toast({
        title: "Authentication Failed",
        description: error.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePhoneNumberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number
    if (!isValidPhoneNumber(phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }
    
    // Request OTP
    requestOtpMutation.mutate();
  };

  const handleOtpComplete = (otp: string) => {
    if (otp.length === 6) {
      verifyOtpMutation.mutate(otp);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {step === "phone" ? "Login with Phone" : "Verify OTP"}
          </CardTitle>
          <CardDescription className="text-center">
            {step === "phone" 
              ? "Enter your phone number to receive a one-time password" 
              : `We've sent a 6-digit code to ${phoneNumber}`
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === "phone" ? (
            <form onSubmit={handlePhoneNumberSubmit} className="space-y-4">
              <div className="flex rounded-md border border-input overflow-hidden">
                <div className="bg-muted px-3 py-2 flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2" />
                  +91
                </div>
                <Input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  maxLength={10}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={requestOtpMutation.isPending || phoneNumber.length !== 10}
              >
                {requestOtpMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Get OTP
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <OtpInput 
                length={6} 
                onComplete={handleOtpComplete}
                className="flex justify-center gap-2"
              />
              
              {verifyOtpMutation.isPending && (
                <div className="flex justify-center my-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
              
              <div className="text-center text-sm">
                <Button
                  variant="link"
                  className="p-0 text-muted-foreground"
                  onClick={() => {
                    setStep("phone");
                    requestOtpMutation.reset();
                  }}
                  disabled={requestOtpMutation.isPending || verifyOtpMutation.isPending}
                >
                  Change phone number
                </Button>
              </div>
              
              <div className="text-center text-sm">
                <Button
                  variant="link"
                  className="p-0"
                  onClick={() => {
                    requestOtpMutation.mutate();
                  }}
                  disabled={requestOtpMutation.isPending || verifyOtpMutation.isPending}
                >
                  Resend OTP
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <p className="text-xs text-muted-foreground text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}