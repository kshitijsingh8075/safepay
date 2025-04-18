import React from 'react';
import { Link } from 'wouter';

const HomeBasic = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-8">
          UPI Payment & Scam Detection
        </h1>
        
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-6">
            <div className="text-xl font-semibold text-center mb-4">Main Features</div>
            <ul className="space-y-2">
              <li className="p-2 bg-blue-50 rounded flex items-center">
                <span className="w-5 h-5 mr-2 rounded-full bg-blue-500 flex items-center justify-center text-white">✓</span>
                UPI Payment Verification
              </li>
              <li className="p-2 bg-blue-50 rounded flex items-center">
                <span className="w-5 h-5 mr-2 rounded-full bg-blue-500 flex items-center justify-center text-white">✓</span>
                QR Code Scan Security
              </li>
              <li className="p-2 bg-blue-50 rounded flex items-center">
                <span className="w-5 h-5 mr-2 rounded-full bg-blue-500 flex items-center justify-center text-white">✓</span>
                Voice Fraud Detection
              </li>
              <li className="p-2 bg-blue-50 rounded flex items-center">
                <span className="w-5 h-5 mr-2 rounded-full bg-blue-500 flex items-center justify-center text-white">✓</span>
                Message Analysis
              </li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <Link href="/upi-check">
            <a className="bg-blue-600 text-white p-4 rounded-xl text-center font-medium">
              UPI Check
            </a>
          </Link>
          <Link href="/scan">
            <a className="bg-blue-600 text-white p-4 rounded-xl text-center font-medium">
              Scan QR
            </a>
          </Link>
          <Link href="/voice-check">
            <a className="bg-blue-600 text-white p-4 rounded-xl text-center font-medium">
              Voice Check
            </a>
          </Link>
          <Link href="/message-check">
            <a className="bg-blue-600 text-white p-4 rounded-xl text-center font-medium">
              Message Check
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomeBasic;