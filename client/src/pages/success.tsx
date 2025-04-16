import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Share2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function Success() {
  const [location, setLocation] = useLocation();
  const [transactionDetails, setTransactionDetails] = useState({
    amount: '850.00',
    to: 'City Supermarket',
    upiId: 'citysupermarket@upi',
    transactionId: `UPI${Date.now().toString().substring(5)}`,
    date: new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    app: 'UPI App'
  });

  // Extract transaction details from URL query parameters
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.split('?')[1]);
      
      // Get parameters from URL
      const amount = params.get('amount');
      const to = params.get('to');
      const upiId = params.get('upiId');
      const txnId = params.get('txnId');
      const app = params.get('app');
      
      // Update transaction details with URL params if available
      setTransactionDetails((current) => ({
        ...current,
        amount: amount || current.amount,
        to: to || current.to,
        upiId: upiId || current.upiId,
        transactionId: txnId || current.transactionId,
        app: app || current.app
      }));
      
      // Save transaction to history in local storage
      const currentDetails = transactionDetails;
      saveTransactionToHistory({
        amount: parseFloat(amount || currentDetails.amount),
        to: to || currentDetails.to,
        upiId: upiId || currentDetails.upiId,
        transactionId: txnId || currentDetails.transactionId,
        app: app || currentDetails.app,
        date: new Date()
      });
    } catch (error) {
      console.error('Error parsing transaction details:', error);
    }
  }, [location]);

  // Function to save transaction to history in local storage
  const saveTransactionToHistory = (transaction: any) => {
    try {
      // Get existing history from local storage
      const historyString = localStorage.getItem('transactionHistory');
      const history = historyString ? JSON.parse(historyString) : [];
      
      // Add new transaction to history
      const newTransaction = {
        id: transaction.transactionId,
        title: transaction.to,
        upiId: transaction.upiId,
        amount: -Math.abs(parseFloat(transaction.amount)), // Negative for payment
        timestamp: new Date().toISOString(), 
        status: 'Completed',
        type: 'debit',
        app: transaction.app
      };
      
      // Add to beginning of array
      history.unshift(newTransaction);
      
      // Limit history to 50 items
      const limitedHistory = history.slice(0, 50);
      
      // Save back to local storage
      localStorage.setItem('transactionHistory', JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Error saving transaction history:', error);
    }
  };

  // Function to share receipt
  const shareReceipt = () => {
    try {
      if (navigator.share) {
        navigator.share({
          title: 'Payment Receipt',
          text: `Payment of ₹${transactionDetails.amount} to ${transactionDetails.to} (${transactionDetails.upiId}) was successful. Transaction ID: ${transactionDetails.transactionId}`
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        alert('Share option is not supported on this browser.');
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 min-h-screen">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <Check className="w-12 h-12 text-green-600" strokeWidth={2} />
      </div>
      
      <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
      <p className="text-gray-500 mb-6">Your transaction has been completed</p>
      
      <Card className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 w-full mb-8">
        <div className="flex justify-between mb-3">
          <p className="text-gray-500">Amount</p>
          <p className="font-semibold">₹{transactionDetails.amount}</p>
        </div>
        <div className="flex justify-between mb-3">
          <p className="text-gray-500">To</p>
          <p className="font-semibold">{transactionDetails.to}</p>
        </div>
        <div className="flex justify-between mb-3">
          <p className="text-gray-500">UPI ID</p>
          <p className="font-semibold text-sm">{transactionDetails.upiId}</p>
        </div>
        <div className="flex justify-between mb-3">
          <p className="text-gray-500">Payment App</p>
          <p className="font-semibold">{transactionDetails.app}</p>
        </div>
        <div className="flex justify-between mb-3">
          <p className="text-gray-500">Transaction ID</p>
          <p className="font-semibold text-sm">{transactionDetails.transactionId}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-gray-500">Date & Time</p>
          <p className="font-semibold">{transactionDetails.date}</p>
        </div>
      </Card>
      
      <div className="flex gap-3 w-full mb-4">
        <Button
          onClick={shareReceipt}
          variant="outline"
          className="flex-1 font-semibold py-4 px-6 rounded-xl shadow-sm border border-gray-200"
        >
          <Share2 className="w-4 h-4 mr-2" /> Share
        </Button>
        <Button
          onClick={() => setLocation('/history')}
          variant="outline"
          className="flex-1 font-semibold py-4 px-6 rounded-xl shadow-sm border border-gray-200"
        >
          View History
        </Button>
      </div>
      
      <Button
        onClick={() => setLocation('/home')}
        className="bg-primary text-white font-semibold py-4 px-6 rounded-xl shadow-md w-full"
      >
        Done
      </Button>
    </div>
  );
}
