import React from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { Bell } from 'lucide-react';

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-slate-50 h-screen overflow-hidden fixed inset-0 flex flex-col">
      {/* Top bar with search */}
      <div className="p-4 bg-white z-10">
        <div className="flex items-center bg-slate-100 rounded-full px-4 py-2">
          <div className="w-6 h-6 rounded-full bg-gray-300 mr-2"></div>
          <Input 
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-700 text-sm"
            placeholder="Search UPI ID or phone number"
          />
        </div>
      </div>
      
      {/* Main content area - fixed height and scrollable if needed */}
      <div className="flex-1 overflow-y-auto pb-16">
        {/* Bell button */}
        <div className="px-4 py-6 flex justify-center">
          <Button 
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white"
            onClick={() => {}}
          >
            <Bell className="w-6 h-6" />
          </Button>
        </div>
        
        {/* Menu header */}
        <div className="px-4 mb-2">
          <h2 className="text-lg font-medium">Menu</h2>
        </div>
        
        {/* Quick actions grid - made more compact */}
        <div className="px-4">
          {/* First row */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <button 
              onClick={() => setLocation('/scan')}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5 text-blue-500"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" 
                  />
                </svg>
              </div>
              <span className="text-[10px] text-center">Scan and Pay</span>
            </button>
            
            <button 
              onClick={() => setLocation('/upi-check')}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5 text-blue-500"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" 
                  />
                </svg>
              </div>
              <span className="text-[10px] text-center">UPI Scam Check</span>
            </button>
            
            <button 
              onClick={() => setLocation('/report-scam')}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5 text-blue-500"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" 
                  />
                </svg>
              </div>
              <span className="text-[10px] text-center">Report Scams</span>
            </button>
            
            <button 
              onClick={() => setLocation('/history')}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5 text-blue-500"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              </div>
              <span className="text-[10px] text-center">History</span>
            </button>
          </div>
          
          {/* Second row */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <button 
              onClick={() => setLocation('/scam-news')}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5 text-blue-500"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" 
                  />
                </svg>
              </div>
              <span className="text-[10px] text-center">Scam News</span>
            </button>
            
            <button 
              onClick={() => setLocation('/voice-check')}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5 text-blue-500"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" 
                  />
                </svg>
              </div>
              <span className="text-[10px] text-center">Voice Scam</span>
            </button>
            
            <button 
              onClick={() => setLocation('/message-check')}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5 text-blue-500"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" 
                  />
                </svg>
              </div>
              <span className="text-[10px] text-center">WhatsApp</span>
            </button>
            
            <button 
              onClick={() => setLocation('/legal-help')}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5 text-blue-500"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" 
                  />
                </svg>
              </div>
              <span className="text-[10px] text-center">Legal Help</span>
            </button>
          </div>
        </div>
        
        {/* Scan QR button */}
        <div className="flex justify-center mt-4">
          <Button 
            onClick={() => setLocation('/scan')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-full px-12 py-3"
          >
            Scan QR
          </Button>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNav className="absolute bottom-0 left-0 right-0" />
    </div>
  );
}
