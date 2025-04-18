import React, { useState, useEffect } from "react";
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
import { useAuthState } from "@/hooks/use-auth-state";

export default function PhoneLogin() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [displayOtp, setDisplayOtp] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { skipLogin, login } = useAuthState();
  
  // Check for return URL in query parameters
  const [location] = useLocation();
  const returnUrl = new URLSearchParams(location.split('?')[1] || '').get('returnUrl') || '/home';
  
  // Handle Skip Login
  const handleSkipLogin = () => {
    try {
      console.log('Skipping login and navigating to', returnUrl);
      skipLogin();
      // Removed toast notification as requested
      setTimeout(() => {
        setLocation('/home');
      }, 500);
    } catch (error) {
      console.error('Error skipping login:', error);
      // Fallback navigation if there's an error
      setLocation('/home');
    }
  };

  // Request OTP mutation
  const requestOtpMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiRequest("POST", "/api/auth/request-otp", { phoneNumber });
        const data = await res.json();
        return data;
      } catch (error) {
        console.error("Error requesting OTP:", error);
        throw new Error("Failed to send OTP. Please try again.");
      }
    },
    onSuccess: (data) => {
      // In development, we show the OTP in a toast for ease of testing
      console.log("OTP response:", data);
      if (data?.otp) {
        // Store OTP to display on screen for hackathon demo
        setDisplayOtp(data.otp);
        toast({
          title: "OTP Generated",
          description: `Your OTP is: ${data.otp}`,
        });
      } else {
        toast({
          title: "OTP Sent",
          description: "An OTP has been sent to your phone number",
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
      try {
        const res = await apiRequest("POST", "/api/auth/verify-otp", { 
          phoneNumber, 
          otp 
        });
        const data = await res.json();
        return data;
      } catch (error) {
        console.error("Error verifying OTP:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("OTP verification response:", data);
      
      // Use our new auth context to handle login
      if (data.userId) {
        skipLogin(); // Clear any previous skipped state
        login(data.userId.toString(), phoneNumber);
        
        // Removed toast notification as requested

        // Check if it's a new user who needs to set up security
        if (data.isNewUser) {
          // Redirect to security setup
          setTimeout(() => {
            setLocation(`/setup-security?userId=${data.userId}`);
          }, 1000);
        } else {
          // Redirect to home page for existing users or the return URL
          setTimeout(() => {
            setLocation(returnUrl);
          }, 1000);
        }
      }
    },
    onError: (error: Error) => {
      console.error("OTP verification error:", error);
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
                  placeholder="10 digit mobile number"
                  value={phoneNumber}
                  onChange={(e) => {
                    // Only allow numbers
                    const value = e.target.value.replace(/\D/g, '');
                    setPhoneNumber(value);
                  }}
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
              
              <div className="relative mt-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted-foreground/20" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">
                    or
                  </span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full mt-2"
                onClick={handleSkipLogin}
              >
                Skip for now
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {displayOtp && (
                <div className="bg-blue-50 p-3 rounded-md mb-3 text-center">
                  <p className="text-sm text-muted-foreground mb-1">For Demo Purpose Only</p>
                  <p className="text-xl font-bold text-primary">{displayOtp}</p>
                </div>
              )}
              
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
              
              {/* Removed the "Change phone number" button to prevent going back */}
              
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