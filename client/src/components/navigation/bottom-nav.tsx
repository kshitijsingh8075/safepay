import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  Home, Map, QrCode, MessageCircle, User, Clock
} from 'lucide-react';

interface BottomNavProps {
  className?: string;
}

export function BottomNav({ className }: BottomNavProps) {
  const [location] = useLocation();
  
  const navItems = [
    { 
      name: 'Home', 
      path: '/home', 
      icon: Home,
      active: location === '/home'
    },
    { 
      name: 'Fraud Map', 
      path: '/fraud-map', 
      icon: Map,
      active: location === '/fraud-map' || location === '/fraud-heatmap'
    },
    {
      name: 'Scan QR',
      path: '/scan',
      icon: QrCode,
      primary: true,
      active: location === '/scan'
    },
    { 
      name: 'Chat Support', 
      path: '/chat-support', 
      icon: MessageCircle,
      active: location === '/chat-support'
    },
    { 
      name: 'Account', 
      path: '/account', 
      icon: User,
      active: location === '/account'
    }
  ];

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-2 flex justify-center items-center z-50 max-w-screen transition-colors duration-300",
      className
    )}>
      <div className="w-full max-w-md flex items-center justify-between px-4">
        {navItems.map((item, index) => {
          // Special case for the middle item (Scan QR)
          if (item.primary) {
            return (
              <div key={index} className="relative flex flex-col items-center" style={{ width: '20%' }}>
                <Link 
                  href={item.path}
                  className={cn(
                    "absolute flex flex-col items-center -top-7",
                    item.active 
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  <div className="w-14 h-14 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] mt-1 font-medium">{item.name}</span>
                </Link>
              </div>
            );
          }
          
          // Regular nav items
          return (
            <Link 
              key={index} 
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center",
                "w-1/5 text-center",
                item.active 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
