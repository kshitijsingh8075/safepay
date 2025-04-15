import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/circular-progress';
import { UpiRisk, getRiskLevel, getRiskColor, isValidUpiId } from '@/lib/upi';

export default function UpiCheck() {
  const [, setLocation] = useLocation();
  const [upiId, setUpiId] = useState('onlineshopping123@upi');
  const [isChecking, setIsChecking] = useState(false);
  const [upiRisk, setUpiRisk] = useState<UpiRisk | null>(null);

  const handleCheck = () => {
    if (!isValidUpiId(upiId)) {
      alert('Please enter a valid UPI ID');
      return;
    }
    
    setIsChecking(true);
    
    // Simulate API call to check risk
    setTimeout(() => {
      // For demo, return a fixed risk assessment
      setUpiRisk({
        riskPercentage: 75,
        riskLevel: 'Medium',
        reports: 15,
        age: '2 months',
        reportedFor: 'Fake Products'
      });
      setIsChecking(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col px-6 py-8">
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
        <h1 className="text-xl font-bold">UPI Risk Check</h1>
        <div className="w-10"></div>
      </div>
      
      <Card className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 mb-6">
        <label className="block text-sm text-gray-500 mb-2">Enter UPI ID to Check</label>
        <div className="flex items-center bg-[#F5F6FA] rounded-xl px-4 py-3 shadow-sm">
          <Input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0"
            placeholder="example@upi"
          />
          <Button
            onClick={handleCheck}
            disabled={isChecking || !upiId}
            className="bg-primary text-white font-medium py-2 px-4 rounded-lg text-sm ml-2"
          >
            {isChecking ? 'Checking...' : 'Check'}
          </Button>
        </div>
      </Card>
      
      {upiRisk && (
        <Card className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 flex flex-col items-center">
          <CircularProgress
            value={upiRisk.riskPercentage}
            color={getRiskColor(upiRisk.riskLevel)}
            className="mb-4"
          />
          
          <h3 
            className="text-xl font-bold mb-1"
            style={{ color: getRiskColor(upiRisk.riskLevel) }}
          >
            {upiRisk.riskLevel} Risk
          </h3>
          <p className="text-gray-500 text-center mb-6">
            This UPI ID has some risk factors
          </p>
          
          <div className="w-full border-t border-gray-100 pt-4">
            <div className="flex justify-between mb-2">
              <p className="text-gray-500">Reports</p>
              <p className="font-semibold">{upiRisk.reports} reports</p>
            </div>
            <div className="flex justify-between mb-2">
              <p className="text-gray-500">UPI Age</p>
              <p className="font-semibold">{upiRisk.age}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-gray-500">Reported For</p>
              <p 
                className="font-semibold"
                style={{ color: getRiskColor(upiRisk.riskLevel) }}
              >
                {upiRisk.reportedFor}
              </p>
            </div>
          </div>
        </Card>
      )}
      
      {upiRisk && (
        <Button
          onClick={() => setLocation('/report-scam')}
          className="bg-primary text-white font-semibold py-4 px-6 rounded-xl shadow-md text-center mt-6"
        >
          Report This UPI
        </Button>
      )}
    </div>
  );
}
