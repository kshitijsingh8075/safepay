import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';

export default function SimpleHome() {
  const [isApiWorking, setIsApiWorking] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check if API is working
    fetch('/api/test')
      .then(response => response.json())
      .then(data => {
        console.log('API response:', data);
        setIsApiWorking(true);
      })
      .catch(error => {
        console.error('API error:', error);
        setIsApiWorking(false);
      });
  }, []);
  
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-[#5164BF]">UPI Scam Check</h1>
      
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-2">API Status</h2>
        {isApiWorking === null ? (
          <p className="text-gray-600">Checking API status...</p>
        ) : isApiWorking ? (
          <p className="text-green-600">API is working correctly! 👍</p>
        ) : (
          <p className="text-red-600">API is not responding. Please check server logs.</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
        <Link href="/scan">
          <a className="p-4 bg-[#5164BF] text-white rounded-lg text-center hover:bg-[#415097] transition-colors">
            Scan QR
          </a>
        </Link>
        <Link href="/upi-check">
          <a className="p-4 bg-[#5164BF] text-white rounded-lg text-center hover:bg-[#415097] transition-colors">
            Check UPI ID
          </a>
        </Link>
        <Link href="/voice-check">
          <a className="p-4 bg-[#5164BF] text-white rounded-lg text-center hover:bg-[#415097] transition-colors">
            Voice Check
          </a>
        </Link>
        <Link href="/message-check">
          <a className="p-4 bg-[#5164BF] text-white rounded-lg text-center hover:bg-[#415097] transition-colors">
            Message Check
          </a>
        </Link>
      </div>
    </div>
  );
}