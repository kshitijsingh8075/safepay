import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search } from 'lucide-react';

// Sample transaction data
const transactionHistory = [
  {
    id: '1',
    title: 'City Supermarket',
    upiId: 'citysupermarket@upi',
    amount: -850,
    timestamp: new Date('2023-05-15T11:30:00'),
    status: 'Completed',
    type: 'debit'
  },
  {
    id: '2',
    title: 'Aman Sharma',
    upiId: 'amansharma@upi',
    amount: 1200,
    timestamp: new Date('2023-05-10T14:30:00'),
    status: 'Received',
    type: 'credit'
  },
  {
    id: '3',
    title: 'Metro Grocery',
    upiId: 'metrogrocery@upi',
    amount: -450,
    timestamp: new Date('2023-05-08T10:45:00'),
    status: 'Completed',
    type: 'debit'
  }
];

export default function History() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter transactions based on search query
  const filteredTransactions = transactionHistory.filter(tx => 
    tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.upiId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Transaction History</h1>
      
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
          No transactions found
        </div>
      ) : (
        filteredTransactions.map(transaction => (
          <Card 
            key={transaction.id}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-[#F5F6FA] flex items-center justify-center mr-3">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={1.5} 
                    stroke="currentColor" 
                    className="w-5 h-5 text-primary"
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
              <p className={`font-semibold ${transaction.amount > 0 ? 'text-success' : 'text-error'}`}>
                {transaction.amount > 0 ? '+ ' : '- '}{formatCurrency(Math.abs(transaction.amount))}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                {formatDate(transaction.timestamp)}
              </p>
              <span className="text-xs font-medium text-success bg-success-light px-2 py-1 rounded-full">
                {transaction.status}
              </span>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
