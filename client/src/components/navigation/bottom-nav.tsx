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
      "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex justify-between items-center z-50 max-w-screen",
      className
    )}>
      {navItems.map((item, index) => (
        <Link 
          key={index} 
          href={item.path}
          className={cn(
            "flex flex-col items-center px-2 py-2",
            item.active ? "text-blue-600" : "text-gray-500"
          )}
        >
          {item.primary ? (
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center -mt-5 shadow-lg">
              <item.icon className="w-5 h-5 text-white" />
            </div>
          ) : (
            <item.icon className="w-5 h-5" />
          )}
          <span className="text-[10px] mt-1">{item.name}</span>
        </Link>
      ))}
    </div>
  );
}
