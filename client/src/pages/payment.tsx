import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Store } from 'lucide-react';

export default function Payment() {
  const [, setLocation] = useLocation();
  const [amount, setAmount] = useState('850.00');
  const [note, setNote] = useState('');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and one decimal point
    const value = e.target.value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Ensure only 2 digits after decimal point
    if (parts[1]?.length > 2) {
      return;
    }
    
    setAmount(value);
  };

  const handlePayment = () => {
    // In a real app, we would process the payment
    setLocation('/success');
  };

  return (
    <div className="flex flex-col px-6 py-8 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => setLocation('/home')}
          className="w-10 h-10 bg-[#F5F6FA] rounded-full flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Payment</h1>
        <div className="w-10"></div>
      </div>
      
      <Card className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 mb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-[#F5F6FA] rounded-full flex items-center justify-center mr-3">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">City Supermarket</h3>
            <p className="text-xs text-gray-500">citysupermarket@upi</p>
          </div>
        </div>
        
        <div className="border-t border-b border-gray-100 py-4 my-4">
          <label className="block text-sm text-gray-500 mb-2">Enter Amount</label>
          <div className="flex items-center">
            <span className="text-2xl font-semibold mr-2">₹</span>
            <Input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              className="text-3xl font-bold flex-1 border-none focus:ring-0 p-0"
              placeholder="0"
            />
          </div>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Add a note (optional)</p>
          <Input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full py-2 border-none focus:ring-0 text-sm"
            placeholder="Groceries, essentials, etc."
          />
        </div>
      </Card>
      
      <Button
        onClick={handlePayment}
        className="bg-primary text-white font-semibold py-4 px-6 rounded-xl shadow-md w-full"
      >
        Pay Now
      </Button>
    </div>
  );
}
