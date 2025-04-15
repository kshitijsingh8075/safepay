import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';

export default function Success() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 min-h-screen">
      <div className="w-24 h-24 bg-primary-light rounded-full flex items-center justify-center mb-6">
        <Check className="w-12 h-12 text-primary" strokeWidth={2} />
      </div>
      
      <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
      <p className="text-gray-500 mb-6">Your transaction has been completed</p>
      
      <Card className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 w-full mb-8">
        <div className="flex justify-between mb-3">
          <p className="text-gray-500">Amount</p>
          <p className="font-semibold">₹850.00</p>
        </div>
        <div className="flex justify-between mb-3">
          <p className="text-gray-500">To</p>
          <p className="font-semibold">City Supermarket</p>
        </div>
        <div className="flex justify-between mb-3">
          <p className="text-gray-500">Transaction ID</p>
          <p className="font-semibold">UPI123456789</p>
        </div>
        <div className="flex justify-between">
          <p className="text-gray-500">Date & Time</p>
          <p className="font-semibold">May 15, 11:30 AM</p>
        </div>
      </Card>
      
      <Button
        onClick={() => setLocation('/home')}
        className="bg-primary text-white font-semibold py-4 px-6 rounded-xl shadow-md w-full"
      >
        Done
      </Button>
    </div>
  );
}
