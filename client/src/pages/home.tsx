import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { Bell, ShieldAlert, Search, ArrowRight, MoonIcon, SunIcon } from 'lucide-react';
import { NotificationBar } from '@/components/ui/notification-bar';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';

export default function Home() {
  const [, setLocation] = useLocation();
  const [showNotification, setShowNotification] = useState(false);
  const [upiInput, setUpiInput] = useState('');
  const { toast } = useToast();
  const { isDark, setTheme } = useTheme();

  const handleAlertClick = () => {
    setShowNotification(true);
  };
  
  const handleUpiSearch = () => {
    if (!upiInput.trim()) {
      toast({
        title: "Empty Input",
        description: "Please enter a UPI ID to search",
        variant: "destructive",
      });
      return;
    }
    
    // If UPI format is valid (contains @), process it directly
    if (upiInput.includes('@')) {
      // Process the UPI ID - use the same route as scan.tsx
      const queryParams = new URLSearchParams();
      queryParams.append('upiId', upiInput);
      queryParams.append('fromSearch', 'true');
      
      setLocation(`/scan?${queryParams.toString()}`);
    } else {
      // Not in UPI format, add a default provider for demo
      const demoUpiId = upiInput + '@okaxis';
      toast({
        title: "Processing",
        description: `Using demo format: ${demoUpiId}`,
      });
      
      const queryParams = new URLSearchParams();
      queryParams.append('upiId', demoUpiId);
      queryParams.append('fromSearch', 'true');
      
      setLocation(`/scan?${queryParams.toString()}`);
    }
  };

  return (
    <div className="dark-bg-secondary h-screen overflow-hidden fixed inset-0 flex flex-col">
      {/* Top bar with search */}
      <div className="p-4 dark-bg-primary z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-100 dark:bg-gray-700 rounded-full px-3 py-1.5 flex items-center transition-colors duration-300">
            <Search className="w-4 h-4 dark-text-tertiary mr-2 flex-shrink-0" />
            <Input 
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-500 dark:placeholder:text-gray-400 text-sm w-full h-8 dark-text-primary"
              placeholder="Enter UPI ID to check..."
              value={upiInput}
              onChange={(e) => setUpiInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUpiSearch();
                }
              }}
            />
            {upiInput && (
              <Button 
                size="sm" 
                className="rounded-full h-7 w-7 p-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                onClick={handleUpiSearch}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
          <button 
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors duration-300"
          >
            {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
          </button>
        </div>
      </div>
      
      {/* Main content area - fixed height and scrollable if needed */}
      <div className="flex-1 overflow-y-auto pb-16">
        {/* Alert button */}
        <div className="px-4 py-6 flex justify-center">
          <Button 
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white transition-colors duration-300"
            onClick={handleAlertClick}
          >
            <ShieldAlert className="w-6 h-6" />
          </Button>
        </div>
        
        {/* Menu items - removed header as requested */}
        
        {/* Quick actions grid - made more compact */}
        <div className="px-4">
          {/* First row */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <button 
              onClick={() => setLocation('/scan')}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-1 transition-colors duration-300">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5 text-blue-500 dark:text-blue-400"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" 
                  />
                </svg>
              </div>
              <span className="text-[10px] text-center dark:text-gray-300">Scan and Pay</span>
            </button>
            
            <button 
              onClick={() => setLocation('/scam-news')}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-1 transition-colors duration-300 relative">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5 text-blue-500 dark:text-blue-400"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
                  />
                </svg>
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">
                  !
                </div>
              </div>
              <span className="text-[10px] text-center dark:text-gray-300">Scam News</span>
            </button>
            
            <button 
              onClick={() => setLocation('/report-scam')}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 dark-bg-tertiary rounded-lg flex items-center justify-center mb-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5 text-blue-500 dark:text-blue-400"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" 
                  />
                </svg>
              </div>
              <span className="text-[10px] text-center dark-text-secondary">Report Scams</span>
            </button>
            
            <button 
              onClick={() => setLocation('/history')}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 dark-bg-tertiary rounded-lg flex items-center justify-center mb-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5 text-blue-500 dark:text-blue-400"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              </div>
              <span className="text-[10px] text-center dark-text-secondary">History</span>
            </button>
          </div>
          
          {/* Second row */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <button 
              onClick={() => setLocation('/upi-check')}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 dark-bg-tertiary rounded-lg flex items-center justify-center mb-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5 text-blue-500 dark:text-blue-400"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              </div>
              <span className="text-[10px] text-center dark-text-secondary">UPI Check</span>
            </button>
            
            <button 
              onClick={() => setLocation('/voice-check')}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 dark-bg-tertiary rounded-lg flex items-center justify-center mb-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5 text-blue-500 dark:text-blue-400"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" 
                  />
                </svg>
              </div>
              <span className="text-[10px] text-center dark-text-secondary">Voice Scam</span>
            </button>
            
            <button 
              onClick={() => setLocation('/whatsapp-check')}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 dark-bg-tertiary rounded-lg flex items-center justify-center mb-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5 text-blue-500 dark:text-blue-400"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" 
                  />
                </svg>
              </div>
              <span className="text-[10px] text-center dark-text-secondary">WhatsApp Check</span>
            </button>
            
            <button 
              onClick={() => setLocation('/legal-help')}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 dark-bg-tertiary rounded-lg flex items-center justify-center mb-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5 text-blue-500 dark:text-blue-400"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" 
                  />
                </svg>
              </div>
              <span className="text-[10px] text-center dark-text-secondary">Legal Help</span>
            </button>
          </div>
          
          {/* Third row - Add Risk Score Demo and Fraud Map */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <button 
              onClick={() => setLocation('/risk-score-demo')}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 dark-bg-tertiary rounded-lg flex items-center justify-center mb-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5 text-blue-500 dark:text-blue-400"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" 
                  />
                </svg>
              </div>
              <span className="text-[10px] text-center dark-text-secondary">Risk Score Demo</span>
            </button>
            
            <button 
              onClick={() => setLocation('/fraud-map')}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 dark-bg-tertiary rounded-lg flex items-center justify-center mb-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5 text-blue-500 dark:text-blue-400"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" 
                  />
                </svg>
              </div>
              <span className="text-[10px] text-center dark-text-secondary">Fraud Map</span>
            </button>
            
            <button 
              onClick={() => setLocation('/security-settings')}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 dark-bg-tertiary rounded-lg flex items-center justify-center mb-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5 text-blue-500 dark:text-blue-400"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" 
                  />
                </svg>
              </div>
              <span className="text-[10px] text-center dark-text-secondary">SIM Swap & MFA</span>
            </button>
          </div>
        </div>
        
        {/* Space for bottom nav - removed Scan QR button */}
        <div className="h-16"></div>
      </div>
      
      {/* Red notification bar */}
      {showNotification && (
        <NotificationBar
          message="Warning! New UPI scam detected. Please stay vigilant for your safety."
          type="error"
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav className="absolute bottom-0 left-0 right-0" />
    </div>
  );
}
