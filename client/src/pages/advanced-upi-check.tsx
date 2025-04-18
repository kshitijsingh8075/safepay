import React from 'react';
import { useLocation } from 'wouter';
import MainLayout from '@/layouts/main-layout';
import UpiAdvancedCheck from '@/components/fraud-detection/UpiAdvancedCheck';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdvancedUpiCheckPage() {
  const [, setLocation] = useLocation();
  
  const handleCheckComplete = (result: any) => {
    console.log('UPI check completed:', result);
    // You can handle the result here if needed
  };
  
  return (
    <MainLayout className="container max-w-4xl py-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={() => setLocation('/home')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </div>
      
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Advanced UPI Fraud Detection</h1>
          <p className="text-muted-foreground mt-2">
            Check any UPI ID for potential fraud using our ML-powered analysis system
          </p>
        </div>
        
        <UpiAdvancedCheck onCheckComplete={handleCheckComplete} />
      
        <div className="mt-8 text-sm bg-muted p-4 rounded-lg">
          <h3 className="font-medium mb-2">How the Advanced Detection Works</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <span className="font-medium">Transaction Analytics:</span> Our system analyzes millions of legitimate and fraudulent transactions
            </li>
            <li>
              <span className="font-medium">Pattern Recognition:</span> ML algorithms detect suspicious patterns in UPI IDs
            </li>
            <li>
              <span className="font-medium">Message Analysis:</span> Natural language processing identifies scam language in transaction descriptions
            </li>
            <li>
              <span className="font-medium">Comprehensive Risk Score:</span> Multiple risk factors are combined into a single safety assessment
            </li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}