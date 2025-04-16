import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History as HistoryIcon, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

// Transaction interface based on the database schema
interface Transaction {
  id: number;
  transaction_id: string;
  app_name: 'PhonePe' | 'GPay' | 'Paytm' | 'Other';
  amount: number;
  timestamp: string;
  status: 'Success' | 'Failed' | 'Pending';
  risk_score: number;
  receiver_upi: string;
  metadata?: string;
  is_sample?: boolean;
}

export default function History() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallRisk, setOverallRisk] = useState(0);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch transaction history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        
        // For demo purposes using sample data
        // In production, this would be an API call to the backend
        setTimeout(() => {
          const sampleTransactions: Transaction[] = [
            {
              id: 1,
              transaction_id: 'TX123456789',
              app_name: 'PhonePe',
              amount: 150.0,
              status: 'Success',
              risk_score: 0.2,
              receiver_upi: 'merchant@ybl',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
              metadata: JSON.stringify({ type: 'mobile_recharge' })
            },
            {
              id: 2,
              transaction_id: 'TX987654321',
              app_name: 'GPay',
              amount: 2500.0,
              status: 'Success',
              risk_score: 0.1,
              receiver_upi: 'shop@okaxis',
              timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
              metadata: JSON.stringify({ type: 'merchant_payment' })
            },
            {
              id: 3,
              transaction_id: 'TX567891234',
              app_name: 'Paytm',
              amount: 750.0,
              status: 'Failed',
              risk_score: 0.7,
              receiver_upi: 'suspicious@okicici',
              timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
              metadata: JSON.stringify({ type: 'merchant_payment', error: 'suspicious_activity' })
            },
            {
              id: 4,
              transaction_id: 'TX135792468',
              app_name: 'PhonePe',
              amount: 1200.0,
              status: 'Success',
              risk_score: 0.3,
              receiver_upi: 'store@paytm',
              timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
              metadata: JSON.stringify({ type: 'bill_payment' })
            },
            {
              id: 5,
              transaction_id: 'TX246813579',
              app_name: 'GPay',
              amount: 300.0,
              status: 'Pending',
              risk_score: 0.4,
              receiver_upi: 'friend@okaxis',
              timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
              metadata: JSON.stringify({ type: 'p2p_transfer' })
            }
          ];
          
          setTransactions(sampleTransactions);
          
          // Calculate overall risk score
          const avgRisk = sampleTransactions.reduce((sum, tx) => sum + tx.risk_score, 0) / 
                         sampleTransactions.length;
          setOverallRisk(avgRisk * 100);
          
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching history:', error);
        toast({
          title: 'Error',
          description: 'Could not load transaction history',
          variant: 'destructive',
        });
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [toast]);
  
  // Filter transactions based on active tab
  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === 'all') return true;
    if (activeTab === 'high-risk') return tx.risk_score > 0.6;
    if (activeTab === 'medium-risk') return tx.risk_score > 0.3 && tx.risk_score <= 0.6;
    if (activeTab === 'low-risk') return tx.risk_score <= 0.3;
    return true;
  });
  
  // Format date for display
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Determine risk class for styling
  const getRiskClass = (score: number) => {
    if (score > 0.6) return 'high-risk';
    if (score > 0.3) return 'medium-risk';
    return 'low-risk';
  };
  
  // Get risk indicator color
  const getRiskColor = (score: number) => {
    if (score > 0.6) return 'text-red-500';
    if (score > 0.3) return 'text-amber-500';
    return 'text-green-500';
  };
  
  // Get risk indicator icon
  const getRiskIcon = (score: number) => {
    if (score > 0.6) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (score > 0.3) return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };
  
  // Get app logo/icon
  const getAppIcon = (appName: string) => {
    switch (appName) {
      case 'PhonePe':
        return (
          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-xs font-bold text-purple-700">PP</span>
          </div>
        );
      case 'GPay':
        return (
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xs font-bold text-blue-700">GP</span>
          </div>
        );
      case 'Paytm':
        return (
          <div className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center">
            <span className="text-xs font-bold text-cyan-700">PT</span>
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700">UPI</span>
          </div>
        );
    }
  };
  
  return (
    <div className="container px-4 py-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <HistoryIcon className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-xl font-semibold">Payment History</h1>
        </div>
        
        <div className="flex items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Risk Level</span>
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  overallRisk > 60 ? 'bg-red-500' : 
                  overallRisk > 30 ? 'bg-amber-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, overallRisk)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <Tabs 
        defaultValue="all" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="high-risk" className="text-red-500">High Risk</TabsTrigger>
          <TabsTrigger value="medium-risk" className="text-amber-500">Medium</TabsTrigger>
          <TabsTrigger value="low-risk" className="text-green-500">Low Risk</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          {renderTransactionList()}
        </TabsContent>
        <TabsContent value="high-risk" className="mt-0">
          {renderTransactionList()}
        </TabsContent>
        <TabsContent value="medium-risk" className="mt-0">
          {renderTransactionList()}
        </TabsContent>
        <TabsContent value="low-risk" className="mt-0">
          {renderTransactionList()}
        </TabsContent>
      </Tabs>
    </div>
  );
  
  function renderTransactionList() {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">Loading transaction history...</p>
        </div>
      );
    }
    
    if (filteredTransactions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <HistoryIcon className="h-12 w-12 text-gray-300 mb-2" />
          <p className="text-gray-500">No transactions found</p>
          <p className="text-sm text-gray-400 mt-1">Your transaction history will appear here</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {filteredTransactions.map((tx) => (
          <Card 
            key={tx.id}
            className={`overflow-hidden border-l-4 ${
              tx.risk_score > 0.6 ? 'border-l-red-500' : 
              tx.risk_score > 0.3 ? 'border-l-amber-500' : 'border-l-green-500'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  {getAppIcon(tx.app_name)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium truncate">{tx.receiver_upi}</p>
                      <p className="text-sm text-gray-500">{formatDate(tx.timestamp)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{tx.amount.toFixed(2)}</p>
                      <p className={`text-xs ${
                        tx.status === 'Success' ? 'text-green-500' : 
                        tx.status === 'Failed' ? 'text-red-500' : 'text-amber-500'
                      }`}>
                        {tx.status}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center text-xs">
                      <span className="mr-1">{tx.app_name}</span>
                      <span className="text-gray-400">• {tx.transaction_id.slice(-6)}</span>
                    </div>
                    
                    <div className={`flex items-center text-xs ${getRiskColor(tx.risk_score)}`}>
                      {getRiskIcon(tx.risk_score)}
                      <span className="ml-1">Risk: {Math.round(tx.risk_score * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
}