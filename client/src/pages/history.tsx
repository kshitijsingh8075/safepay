import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  History as HistoryIcon, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { useLocation } from 'wouter';

// Type for a single transaction
interface Transaction {
  id: number;
  amount: number;
  date: string;
  upiId: string;
  status: 'Success' | 'Failed' | 'Pending';
  riskScore: number;
  paymentApp: string;
}

// Sample transaction data
const transactions: Transaction[] = [
  {
    id: 1,
    amount: 500,
    date: '2025-04-15',
    upiId: 'merchant@ybl',
    status: 'Success',
    riskScore: 0.2,
    paymentApp: 'PhonePe'
  },
  {
    id: 2,
    amount: 1200,
    date: '2025-04-14',
    upiId: 'store@paytm',
    status: 'Success',
    riskScore: 0.3,
    paymentApp: 'GPay'
  },
  {
    id: 3,
    amount: 800,
    date: '2025-04-13',
    upiId: 'suspicious@okaxis',
    status: 'Failed',
    riskScore: 0.8,
    paymentApp: 'Paytm'
  },
  {
    id: 4,
    amount: 350,
    date: '2025-04-12',
    upiId: 'shop@okicici',
    status: 'Success',
    riskScore: 0.1,
    paymentApp: 'PhonePe'
  },
  {
    id: 5,
    amount: 1500,
    date: '2025-04-10',
    upiId: 'friend@okaxis',
    status: 'Success',
    riskScore: 0.4,
    paymentApp: 'GPay'
  }
];

export default function History() {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [, setLocation] = useLocation();

  // Filter transactions based on risk score
  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'high') return tx.riskScore > 0.6;
    if (filter === 'medium') return tx.riskScore > 0.3 && tx.riskScore <= 0.6;
    if (filter === 'low') return tx.riskScore <= 0.3;
    return true;
  });

  // Get appropriate color based on risk score
  const getRiskColor = (score: number) => {
    if (score > 0.6) return 'text-red-500';
    if (score > 0.3) return 'text-amber-500';
    return 'text-green-500';
  };

  // Get appropriate icon based on risk score
  const getRiskIcon = (score: number) => {
    if (score > 0.6) return <AlertCircle className="h-4 w-4" />;
    if (score > 0.3) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <div className="container p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/home')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <HistoryIcon className="h-5 w-5 text-primary mr-1" />
          <h1 className="text-xl font-semibold">Transaction History</h1>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500 flex items-center">
          <Clock className="h-4 w-4 mr-1" /> Last 30 days
        </div>
        <div className="flex space-x-1">
          <Button 
            size="sm" 
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className="text-xs px-2 h-7"
          >
            All
          </Button>
          <Button 
            size="sm" 
            variant={filter === 'high' ? 'default' : 'outline'}
            onClick={() => setFilter('high')}
            className="text-xs px-2 h-7 text-red-500"
          >
            High Risk
          </Button>
          <Button 
            size="sm" 
            variant={filter === 'medium' ? 'default' : 'outline'}
            onClick={() => setFilter('medium')}
            className="text-xs px-2 h-7 text-amber-500"
          >
            Medium
          </Button>
          <Button 
            size="sm" 
            variant={filter === 'low' ? 'default' : 'outline'}
            onClick={() => setFilter('low')}
            className="text-xs px-2 h-7 text-green-500"
          >
            Low Risk
          </Button>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <Card className="mb-4">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <HistoryIcon className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500">No transactions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map(tx => (
            <Card 
              key={tx.id} 
              className={`border-l-4 ${
                tx.riskScore > 0.6 ? 'border-l-red-500' : 
                tx.riskScore > 0.3 ? 'border-l-amber-500' : 
                'border-l-green-500'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{tx.upiId}</p>
                    <p className="text-sm text-gray-500">{tx.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{tx.amount}</p>
                    <p className={`text-xs ${
                      tx.status === 'Success' ? 'text-green-500' : 
                      tx.status === 'Failed' ? 'text-red-500' : 
                      'text-amber-500'
                    }`}>
                      {tx.status}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-gray-500 border-t pt-2">
                  <span>{tx.paymentApp}</span>
                  <div className={`flex items-center ${getRiskColor(tx.riskScore)}`}>
                    {getRiskIcon(tx.riskScore)}
                    <span className="ml-1">Risk: {Math.round(tx.riskScore * 100)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Transaction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Transactions</span>
              <span>{transactions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Amount</span>
              <span>₹{transactions.reduce((sum, tx) => sum + tx.amount, 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">High Risk Transactions</span>
              <span>{transactions.filter(tx => tx.riskScore > 0.6).length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}