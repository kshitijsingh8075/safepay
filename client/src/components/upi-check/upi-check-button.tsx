import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { apiRequest } from "@/lib/queryClient";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// Types for UPI check response
interface DomainAnalysis {
  domain: string;
  count: number;
}

interface UpiCheckResponse {
  upiId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  totalReports: number;
  activeCases: number;
  domainAnalysis: DomainAnalysis[];
  threatLevel: string;
  threatIndicators: string[];
  mostCommonScamType: string;
  recommendedActions: string[];
}

export default function UpiCheckButton() {
  const [upiId, setUpiId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<UpiCheckResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleUpiIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpiId(e.target.value);
  };

  const checkUpi = async () => {
    if (!upiId) {
      toast({
        title: "UPI ID Required",
        description: "Please enter a UPI ID to check",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/combined-check', { upiId });
      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
      } else {
        toast({
          title: "Check Failed",
          description: data.error || "Failed to analyze UPI ID",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('UPI check error:', error);
      toast({
        title: "Check Failed",
        description: "An error occurred while checking the UPI ID",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'bg-destructive text-destructive-foreground';
      case 'medium':
        return 'bg-amber-500 text-white';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 70) return 'bg-destructive';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const getRiskIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return <AlertTriangle className="h-6 w-6 text-destructive" />;
      case 'medium':
        return <AlertTriangle className="h-6 w-6 text-amber-500" />;
      case 'low':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      default:
        return <Shield className="h-6 w-6 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="w-full flex items-center gap-2 bg-primary text-white" 
          size="lg"
        >
          <Shield className="h-5 w-5" />
          UPI Scam Check
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Check UPI ID For Scams</DialogTitle>
          <DialogDescription>
            Enter a UPI ID to check its safety and fraud risk
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2">
          <Input
            placeholder="Enter UPI ID (e.g., name@upi)"
            value={upiId}
            onChange={handleUpiIdChange}
            className="flex-1"
          />
          <Button 
            onClick={checkUpi} 
            disabled={isLoading}
          >
            {isLoading ? "Checking..." : "Check"}
          </Button>
        </div>

        {results && (
          <div className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span>Risk Assessment</span>
                  <span 
                    className={`px-2 py-1 text-xs rounded-full ${getRiskColor(results.riskLevel)}`}
                  >
                    {results.riskLevel.toUpperCase()}
                  </span>
                </CardTitle>
                <CardDescription>
                  {results.upiId}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Risk Score</span>
                    <span className="font-medium">{results.riskScore}%</span>
                  </div>
                  <Progress 
                    value={results.riskScore} 
                    className={getProgressColor(results.riskScore)}
                  />
                  
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="bg-muted p-2 rounded text-center">
                      <div className="text-sm text-muted-foreground">Reports</div>
                      <div className="text-lg font-medium">{results.totalReports}</div>
                    </div>
                    <div className="bg-muted p-2 rounded text-center">
                      <div className="text-sm text-muted-foreground">Active Cases</div>
                      <div className="text-lg font-medium">{results.activeCases}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {results.recommendedActions.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recommended Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {results.recommendedActions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {results.domainAnalysis.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Domain Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.domainAnalysis.slice(0, 3).map((domain, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{domain.domain}</span>
                        <span className="font-medium">{domain.count} reports</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {results.mostCommonScamType && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Most Common Scam Type:</span> {results.mostCommonScamType}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}