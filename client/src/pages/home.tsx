import React from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Bell } from 'lucide-react';

// Sample transaction data
const recentTransactions = [
  {
    id: '1',
    title: 'Metro Grocery',
    upiId: 'metrogrocery@upi',
    amount: -450,
    timestamp: new Date('2023-05-12T10:45:00'),
    type: 'debit'
  },
  {
    id: '2',
    title: 'Received from Aman',
    upiId: 'aman@upi',
    amount: 1200,
    timestamp: new Date('2023-05-10T14:30:00'),
    type: 'credit'
  }
];

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Hello, Rahul</h1>
          <p className="text-gray-500">Welcome back</p>
        </div>
        <div className="w-10 h-10 bg-[#F5F6FA] rounded-full flex items-center justify-center">
          <Bell className="w-6 h-6 text-primary" />
        </div>
      </div>
      
      {/* Balance card */}
      <div className="bg-primary rounded-2xl px-5 py-6 mb-6 text-white">
        <p className="text-white/80 mb-1">Available Balance</p>
        <h2 className="text-3xl font-bold mb-4">{formatCurrency(24550.75)}</h2>
        <div className="flex gap-3">
          <button className="bg-white/20 rounded-xl py-2 px-4 text-sm font-medium flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className="w-5 h-5 mr-2"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" 
              />
            </svg>
            Add Money
          </button>
          <button className="bg-white/20 rounded-xl py-2 px-4 text-sm font-medium flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className="w-5 h-5 mr-2"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" 
              />
            </svg>
            Transfer
          </button>
        </div>
      </div>
      
      {/* Quick actions */}
      <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-4 gap-4 mb-8">
        <button 
          onClick={() => setLocation('/scan')}
          className="flex flex-col items-center"
        >
          <div className="w-14 h-14 bg-[#F5F6FA] rounded-xl flex items-center justify-center mb-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className="w-6 h-6 text-primary"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" 
              />
            </svg>
          </div>
          <span className="text-xs">Scan & Pay</span>
        </button>
        
        <button 
          onClick={() => setLocation('/upi-check')}
          className="flex flex-col items-center"
        >
          <div className="w-14 h-14 bg-[#F5F6FA] rounded-xl flex items-center justify-center mb-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className="w-6 h-6 text-primary"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" 
              />
            </svg>
          </div>
          <span className="text-xs">UPI Check</span>
        </button>
        
        <button 
          onClick={() => setLocation('/voice-check')}
          className="flex flex-col items-center"
        >
          <div className="w-14 h-14 bg-[#F5F6FA] rounded-xl flex items-center justify-center mb-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className="w-6 h-6 text-primary"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" 
              />
            </svg>
          </div>
          <span className="text-xs">Voice Check</span>
        </button>
        
        <button 
          onClick={() => setLocation('/message-check')}
          className="flex flex-col items-center"
        >
          <div className="w-14 h-14 bg-[#F5F6FA] rounded-xl flex items-center justify-center mb-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className="w-6 h-6 text-primary"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" 
              />
            </svg>
          </div>
          <span className="text-xs">Msg Check</span>
        </button>
      </div>
      
      {/* Recent transactions */}
      <h3 className="text-lg font-bold mb-4">Recent Transactions</h3>
      
      {recentTransactions.map(transaction => (
        <Card 
          key={transaction.id}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3 flex items-center justify-between"
        >
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
              <p className="text-xs text-gray-500">{formatDate(transaction.timestamp)}</p>
            </div>
          </div>
          <p className={`font-semibold ${transaction.amount > 0 ? 'text-success' : 'text-error'}`}>
            {transaction.amount > 0 ? '+ ' : '- '}{formatCurrency(Math.abs(transaction.amount))}
          </p>
        </Card>
      ))}
    </div>
  );
}
