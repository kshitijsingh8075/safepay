import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Shield, ShieldAlert, ShieldCheck, Search, AlarmClock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface UpiAdvancedCheckProps {
  onCheckComplete?: (result: any) => void;
  initialUpiId?: string;
  className?: string;
}

export default function UpiAdvancedCheck({ onCheckComplete, initialUpiId = '', className = '' }: UpiAdvancedCheckProps) {
  const [upiId, setUpiId] = useState(initialUpiId);
  const [amount, setAmount] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!upiId.trim()) {
      setError('Please enter a UPI ID to check');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/fraud-detection/check-upi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          upi_id: upiId,
          amount: amount ? parseFloat(amount) : undefined,
          message: message || undefined,
          device_id: navigator.userAgent,
          ip_address: undefined, // Will be determined by the server
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to check UPI safety');
      }
      
      setResult(data);
      
      if (onCheckComplete) {
        onCheckComplete(data);
      }
    } catch (err: any) {
      console.error('Error checking UPI:', err);
      setError(err.message || 'An error occurred while checking UPI safety');
    } finally {
      setIsLoading(false);
    }
  };

  // Render risk indicator based on risk level
  const renderRiskIndicator = () => {
    if (!result) return null;
    
    const riskScore = result.risk_score || 0;
    const riskLevel = result.risk_level || 'MEDIUM';
    
    let color = '';
    let icon = null;
    
    switch (riskLevel) {
      case 'LOW':
        color = 'bg-green-500';
        icon = <ShieldCheck className="h-8 w-8 text-green-500" />;
        break;
      case 'MEDIUM':
        color = 'bg-yellow-500';
        icon = <Shield className="h-8 w-8 text-yellow-500" />;
        break;
      case 'HIGH':
        color = 'bg-red-500';
        icon = <ShieldAlert className="h-8 w-8 text-red-500" />;
        break;
      default:
        color = 'bg-gray-500';
        icon = <Shield className="h-8 w-8 text-gray-500" />;
    }
    
    return (
      <div className="flex flex-col items-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          {icon}
          <div className="text-2xl font-bold">
            {riskLevel === 'LOW' ? 'Safe' : riskLevel === 'MEDIUM' ? 'Caution' : 'High Risk'}
          </div>
        </div>
        
        <div className="w-full mt-2">
          <div className="flex justify-between mb-1 text-sm">
            <span>Risk Score</span>
            <span className="font-medium">{riskScore.toFixed(1)}/10</span>
          </div>
          <Progress value={(riskScore / 10) * 100} className={`h-2 ${color}`} />
        </div>
      </div>
    );
  };

  // Render risk components
  const renderRiskComponents = () => {
    if (!result || !result.risk_components) return null;
    
    const components = result.risk_components;
    
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Risk Factors</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(components).map(([key, value]: [string, any]) => (
            <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
              <span className="capitalize">{key.replace(/_/g, ' ')}</span>
              <Badge variant={value > 0.5 ? "destructive" : value > 0.3 ? "default" : "outline"}>
                {(value * 10).toFixed(1)}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render message analysis
  const renderMessageAnalysis = () => {
    if (!result || !result.message_analysis) return null;
    
    const analysis = result.message_analysis;
    
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Message Analysis</h3>
        <Alert variant={analysis.risk_level === 'HIGH' ? "destructive" : analysis.risk_level === 'MEDIUM' ? "default" : "outline"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            Scam Probability: {(analysis.scam_probability * 100).toFixed(0)}%
          </AlertTitle>
          <AlertDescription>
            {analysis.explanation}
          </AlertDescription>
        </Alert>
        
        {analysis.warning_flags && analysis.warning_flags.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium">Warning Signs:</p>
            <ul className="mt-1 text-xs list-disc list-inside">
              {analysis.warning_flags.map((flag: string, index: number) => (
                <li key={index}>{flag}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Advanced UPI Safety Check
        </CardTitle>
        <CardDescription>
          Use AI-powered fraud detection to assess the safety of a UPI ID before making a payment
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="upiId" className="block text-sm font-medium mb-1">UPI ID</label>
            <Input
              id="upiId"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="Enter UPI ID (e.g., username@bank)"
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium mb-1">Amount (Optional)</label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                type="number"
                min="1"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1">Message (Optional)</label>
              <Input
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Payment message"
                disabled={isLoading}
              />
            </div>
          </div>
          
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Check Safety
              </>
            )}
          </Button>
        </form>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {result && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Safety Report for {result.upi_id}</h3>
            
            {renderRiskIndicator()}
            
            <Separator className="my-4" />
            
            {renderRiskComponents()}
            
            {message && renderMessageAnalysis()}
            
            <div className="mt-4 text-sm">
              <p className="flex items-center">
                <AlarmClock className="h-4 w-4 mr-2" />
                Checked on: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between flex-wrap text-xs text-muted-foreground">
        <div>Powered by AI fraud detection</div>
        <div>Uses real-time transaction analysis</div>
      </CardFooter>
    </Card>
  );
}