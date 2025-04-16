import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { QRScanner } from '@/components/scanner/qr-scanner';
import { analyzeUpiRisk, shouldBlockTransaction, shouldShowWarning } from '@/lib/fraud-detection';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function Scan() {
  const [, setLocation] = useLocation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);
  const [scannedUpiId, setScannedUpiId] = useState('');
  const [riskDetails, setRiskDetails] = useState<{
    percentage: number;
    level: string;
    reports: number;
  } | null>(null);
  const { toast } = useToast();

  const handleScan = async (upiId: string) => {
    setScannedUpiId(upiId);
    setIsAnalyzing(true);
    
    try {
      // Analyze the UPI ID for risk
      const riskAnalysis = await analyzeUpiRisk(upiId);
      
      // Store risk details
      setRiskDetails({
        percentage: riskAnalysis.riskPercentage,
        level: riskAnalysis.riskLevel,
        reports: riskAnalysis.reports
      });
      
      // Determine what to do based on risk level
      if (shouldBlockTransaction(riskAnalysis.riskPercentage)) {
        // High risk - show blocking screen
        setShowBlocked(true);
      } else if (shouldShowWarning(riskAnalysis.riskPercentage)) {
        // Medium risk - show warning
        setShowWarning(true);
      } else {
        // Low risk - proceed to payment
        toast({
          title: "Safe UPI ID",
          description: "This appears to be a legitimate UPI ID.",
          variant: "default",
        });
        setTimeout(() => {
          setLocation(`/payment?upiId=${encodeURIComponent(upiId)}`);
        }, 1000);
      }
    } catch (error) {
      console.error('Error analyzing UPI:', error);
      toast({
        title: "Error",
        description: "Could not analyze UPI safety. Proceed with caution.",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation(`/payment?upiId=${encodeURIComponent(upiId)}`);
      }, 1500);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClose = () => {
    setLocation('/home');
  };

  const handleProceedAnyway = () => {
    // User chose to continue despite warning
    setShowWarning(false);
    setLocation(`/payment?upiId=${encodeURIComponent(scannedUpiId)}`);
  };

  const handleReportScam = () => {
    // User chose to report the blocked UPI
    setShowBlocked(false);
    setLocation(`/report-scam?upiId=${encodeURIComponent(scannedUpiId)}`);
  };

  const handleCancel = () => {
    // User chose to cancel the transaction
    setShowWarning(false);
    setShowBlocked(false);
    setLocation('/home');
  };

  return (
    <>
      <QRScanner 
        onScan={handleScan}
        onClose={handleClose}
      />
      
      {/* Warning Dialog - Medium Risk */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle className="flex items-center text-amber-500">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Caution Required
          </DialogTitle>
          <DialogDescription>
            This UPI ID has been flagged with medium risk ({riskDetails?.percentage}%)
            {riskDetails?.reports > 0 && ` and has ${riskDetails.reports} reports from other users`}.
            Proceed with caution.
          </DialogDescription>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="default" className="bg-amber-500 hover:bg-amber-600" onClick={handleProceedAnyway}>
              Proceed Anyway
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
            This UPI ID has a very high risk score ({riskDetails?.percentage}%)
            {riskDetails?.reports > 0 && ` and has ${riskDetails.reports} reports from other users`}.
            We've blocked this transaction for your safety.
          </DialogDescription>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReportScam}>
              Report Scam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
