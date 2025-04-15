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
      
      <div className="grid grid-cols-4 gap-4 mb-4">
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
              className="w-6 h-6 text-[#00D2FF]"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" 
              />
            </svg>
          </div>
          <span className="text-xs">Scan and Pay</span>
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
              className="w-6 h-6 text-[#00D2FF]"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" 
              />
            </svg>
          </div>
          <span className="text-xs">UPI Scam Check</span>
        </button>
        
        <button 
          onClick={() => setLocation('/report-scam')}
          className="flex flex-col items-center"
        >
          <div className="w-14 h-14 bg-[#F5F6FA] rounded-xl flex items-center justify-center mb-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className="w-6 h-6 text-[#00D2FF]"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" 
              />
            </svg>
          </div>
          <span className="text-xs">Report Scams</span>
        </button>
        
        <button 
          onClick={() => setLocation('/history')}
          className="flex flex-col items-center"
        >
          <div className="w-14 h-14 bg-[#F5F6FA] rounded-xl flex items-center justify-center mb-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className="w-6 h-6 text-[#00D2FF]"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" 
              />
            </svg>
          </div>
          <span className="text-xs">History</span>
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-4 mb-8">
        <button 
          onClick={() => setLocation('/scam-news')}
          className="flex flex-col items-center"
        >
          <div className="w-14 h-14 bg-[#F5F6FA] rounded-xl flex items-center justify-center mb-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className="w-6 h-6 text-[#00D2FF]"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" 
              />
            </svg>
          </div>
          <span className="text-xs">Scam News</span>
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
              className="w-6 h-6 text-[#00D2FF]"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" 
              />
            </svg>
          </div>
          <span className="text-xs">Voice Scam Detect</span>
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
              className="w-6 h-6 text-[#00D2FF]"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" 
              />
            </svg>
          </div>
          <span className="text-xs">Upload WhatsApp Scam</span>
        </button>
        
        <button 
          onClick={() => setLocation('/legal-help')}
          className="flex flex-col items-center"
        >
          <div className="w-14 h-14 bg-[#F5F6FA] rounded-xl flex items-center justify-center mb-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className="w-6 h-6 text-[#00D2FF]"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" 
              />
            </svg>
          </div>
          <span className="text-xs">Legal Help Screen</span>
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
