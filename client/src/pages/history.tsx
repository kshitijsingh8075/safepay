import React from 'react';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  History as HistoryIcon, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle, 
  CreditCard, 
  Clock,
  Calendar,
  DollarSign 
} from 'lucide-react';

// Sample transaction data
const transactions = [
  {
    id: 1,
    appName: 'PhonePe',
    amount: 150.0,
    status: 'Success',
    riskScore: 0.2,
    receiverUpi: 'merchant@ybl',
    timestamp: '2025-04-14 14:30:00',
    txnId: 'TX123456'
  },
  {
    id: 2,
    appName: 'GPay',
    amount: 2500.0,
    status: 'Success',
    riskScore: 0.1,
    receiverUpi: 'shop@okaxis',
    timestamp: '2025-04-13 09:15:00',
    txnId: 'TX987654'
  },
  {
    id: 3,
    appName: 'Paytm',
    amount: 750.0,
    status: 'Failed',
    riskScore: 0.7,
    receiverUpi: 'suspicious@okicici',
    timestamp: '2025-04-15 11:20:00',
    txnId: 'TX567891'
  },
  {
    id: 4,
    appName: 'PhonePe',
    amount: 1200.0,
    status: 'Success',
    riskScore: 0.3,
    receiverUpi: 'store@paytm',
    timestamp: '2025-04-11 16:45:00',
    txnId: 'TX135792'
  },
  {
    id: 5,
    appName: 'GPay',
    amount: 300.0,
    status: 'Pending',
    riskScore: 0.4,
    receiverUpi: 'friend@okaxis',
    timestamp: '2025-04-16 10:10:00',
    txnId: 'TX246813'
  }
];

export default function History() {
  // Calculate overall risk
  const avgRisk = transactions.reduce((sum, tx) => sum + tx.riskScore, 0) / transactions.length;
  const overallRisk = Math.round(avgRisk * 100);
  
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
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-xs font-bold text-purple-700">PP</span>
          </div>
        );
      case 'GPay':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xs font-bold text-blue-700">GP</span>
          </div>
        );
      case 'Paytm':
        return (
          <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
            <span className="text-xs font-bold text-cyan-700">PT</span>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
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
      
      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="high" className="text-red-500">High Risk</TabsTrigger>
          <TabsTrigger value="medium" className="text-amber-500">Medium</TabsTrigger>
          <TabsTrigger value="low" className="text-green-500">Low Risk</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <div className="space-y-4">
            {transactions.map((tx) => (
              <Card 
                key={tx.id}
                className={`overflow-hidden border-l-4 ${
                  tx.riskScore > 0.6 ? 'border-l-red-500' : 
                  tx.riskScore > 0.3 ? 'border-l-amber-500' : 'border-l-green-500'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      {getAppIcon(tx.appName)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium truncate">{tx.receiverUpi}</p>
                          <p className="text-sm text-gray-500">{tx.timestamp}</p>
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
                          <span className="mr-1">{tx.appName}</span>
                          <span className="text-gray-400">• {tx.txnId}</span>
                        </div>
                        
                        <div className={`flex items-center text-xs ${getRiskColor(tx.riskScore)}`}>
                          {getRiskIcon(tx.riskScore)}
                          <span className="ml-1">Risk: {Math.round(tx.riskScore * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="high" className="mt-0">
          <div className="space-y-4">
            {transactions.filter(tx => tx.riskScore > 0.6).map((tx) => (
              <Card 
                key={tx.id}
                className="overflow-hidden border-l-4 border-l-red-500"
              >
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      {getAppIcon(tx.appName)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium truncate">{tx.receiverUpi}</p>
                          <p className="text-sm text-gray-500">{tx.timestamp}</p>
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
                          <span className="mr-1">{tx.appName}</span>
                          <span className="text-gray-400">• {tx.txnId}</span>
                        </div>
                        
                        <div className="flex items-center text-xs text-red-500">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="ml-1">Risk: {Math.round(tx.riskScore * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="medium" className="mt-0">
          <div className="space-y-4">
            {transactions.filter(tx => tx.riskScore > 0.3 && tx.riskScore <= 0.6).map((tx) => (
              <Card 
                key={tx.id}
                className="overflow-hidden border-l-4 border-l-amber-500"
              >
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      {getAppIcon(tx.appName)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium truncate">{tx.receiverUpi}</p>
                          <p className="text-sm text-gray-500">{tx.timestamp}</p>
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
                          <span className="mr-1">{tx.appName}</span>
                          <span className="text-gray-400">• {tx.txnId}</span>
                        </div>
                        
                        <div className="flex items-center text-xs text-amber-500">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <span className="ml-1">Risk: {Math.round(tx.riskScore * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="low" className="mt-0">
          <div className="space-y-4">
            {transactions.filter(tx => tx.riskScore <= 0.3).map((tx) => (
              <Card 
                key={tx.id}
                className="overflow-hidden border-l-4 border-l-green-500"
              >
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      {getAppIcon(tx.appName)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium truncate">{tx.receiverUpi}</p>
                          <p className="text-sm text-gray-500">{tx.timestamp}</p>
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
                          <span className="mr-1">{tx.appName}</span>
                          <span className="text-gray-400">• {tx.txnId}</span>
                        </div>
                        
                        <div className="flex items-center text-xs text-green-500">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="ml-1">Risk: {Math.round(tx.riskScore * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-primary" />
            Transaction Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm">
                <CreditCard className="w-4 h-4 mr-2 text-gray-500" />
                <span>Total Transactions</span>
              </div>
              <span className="font-medium">{transactions.length}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span>This Month</span>
              </div>
              <span className="font-medium">{transactions.length}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-2 text-gray-500" />
                <span>Last Transaction</span>
              </div>
              <span className="font-medium text-sm">Today at 10:10 AM</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}