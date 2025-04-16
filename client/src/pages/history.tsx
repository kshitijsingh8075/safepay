import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, ArrowLeft, ReceiptText } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Sample fallback transaction data (will only be used if localStorage is empty)
const sampleTransactionHistory = [
  {
    id: '1',
    title: 'City Supermarket',
    upiId: 'citysupermarket@upi',
    amount: -850,
    timestamp: new Date('2023-05-15T11:30:00').toISOString(),
    status: 'Completed',
    type: 'debit',
    app: 'UPI App'
  }
];

interface Transaction {
  id: string;
  title: string;
  upiId: string;
  amount: number;
  timestamp: string;
  status: string;
  type: 'credit' | 'debit';
  app?: string;
}

export default function History() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // Load transaction history from localStorage
  useEffect(() => {
    try {
      const historyString = localStorage.getItem('transactionHistory');
      if (historyString) {
        const parsedHistory = JSON.parse(historyString);
        // Ensure type is correct by explicitly mapping
        const typedTransactions = parsedHistory.map((tx: any) => ({
          ...tx,
          type: tx.type === 'credit' || tx.type === 'debit' ? tx.type : 'debit'
        })) as Transaction[];
        setTransactions(typedTransactions);
      } else {
        // If no history in localStorage, use sample data
        setTransactions(sampleTransactionHistory as Transaction[]);
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
      // Fallback to sample data on error
      setTransactions(sampleTransactionHistory);
    }
  }, []);

  // Filter transactions based on search query
  const filteredTransactions = transactions.filter(tx => 
    tx.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.upiId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.app?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleBackToList = () => {
    setSelectedTransaction(null);
  };

  // Transaction detail view
  if (selectedTransaction) {
    return (
      <div className="flex flex-col px-6 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBackToList}
            className="p-2 mr-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Transaction Details</h1>
        </div>
        
        <Card className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 w-full mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#F5F6FA] flex items-center justify-center">
              <ReceiptText className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          <div className="text-center mb-6">
            <p className={`text-2xl font-bold ${selectedTransaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {selectedTransaction.amount > 0 ? '+ ' : '- '}
              ₹{Math.abs(selectedTransaction.amount).toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {selectedTransaction.type === 'credit' ? 'Received from' : 'Paid to'} {selectedTransaction.title}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(selectedTransaction.timestamp).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </p>
          </div>
          
          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between py-2">
              <p className="text-gray-500">Status</p>
              <p className="font-medium text-green-600">{selectedTransaction.status}</p>
            </div>
            <div className="flex justify-between py-2">
              <p className="text-gray-500">Transaction ID</p>
              <p className="font-medium text-sm">{selectedTransaction.id}</p>
            </div>
            <div className="flex justify-between py-2">
              <p className="text-gray-500">UPI ID</p>
              <p className="font-medium text-sm">{selectedTransaction.upiId}</p>
            </div>
            {selectedTransaction.app && (
              <div className="flex justify-between py-2">
                <p className="text-gray-500">Payment App</p>
                <p className="font-medium">{selectedTransaction.app}</p>
              </div>
            )}
          </div>
        </Card>
        
        <Button
          variant="outline"
          className="w-full mb-4"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Transaction Receipt',
                text: `${selectedTransaction.type === 'credit' ? 'Received' : 'Paid'} ₹${Math.abs(selectedTransaction.amount).toFixed(2)} ${selectedTransaction.type === 'credit' ? 'from' : 'to'} ${selectedTransaction.title} (${selectedTransaction.upiId}). Transaction ID: ${selectedTransaction.id}`
              });
            } else {
              alert('Share functionality not supported on this browser');
            }
          }}
        >
          Share Receipt
        </Button>
        
        <Button
          variant="default"
          className="w-full bg-primary"
          onClick={() => setLocation('/home')}
        >
          Done
        </Button>
      </div>
    );
  }

  // Transaction list view
  return (
    <div className="flex flex-col px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Transaction History</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setLocation('/home')}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="bg-[#F5F6FA] rounded-xl px-4 py-3 flex items-center mb-6">
        <Search className="w-5 h-5 text-gray-500 mr-2" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent border-none focus:ring-0"
          placeholder="Search transactions"
        />
      </div>
      
      {filteredTransactions.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>No transactions found</p>
          {searchQuery && (
            <Button 
              variant="link" 
              onClick={() => setSearchQuery('')}
              className="mt-2"
            >
              Clear search
            </Button>
          )}
        </div>
      ) : (
        filteredTransactions.map(transaction => (
          <Card 
            key={transaction.id}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleTransactionClick(transaction)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full ${transaction.amount > 0 ? 'bg-green-50' : 'bg-[#F5F6FA]'} flex items-center justify-center mr-3`}>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={1.5} 
                    stroke="currentColor" 
                    className={`w-5 h-5 ${transaction.amount > 0 ? 'text-green-600' : 'text-primary'}`}
                  >
                    {transaction.type === 'credit' ? (
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" 
                      />
                    ) : (
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" 
                      />
                    )}
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium">{transaction.title}</h4>
                  <p className="text-xs text-gray-500">{transaction.upiId}</p>
                </div>
              </div>
              <p className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {transaction.amount > 0 ? '+ ' : '- '}₹{Math.abs(transaction.amount).toFixed(2)}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                {new Date(transaction.timestamp).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                transaction.status === 'Completed' ? 'text-green-600 bg-green-50' : 
                transaction.status === 'Failed' ? 'text-red-600 bg-red-50' :
                'text-amber-600 bg-amber-50'
              }`}>
                {transaction.status}
              </span>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
