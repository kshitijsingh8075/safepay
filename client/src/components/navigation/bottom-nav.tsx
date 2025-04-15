import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  Home, MapPin, AlertTriangle, FileText, User
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
      name: 'Heatmap', 
      path: '/heatmap', 
      icon: MapPin,
      active: location === '/heatmap'
    },
    {
      name: 'Report',
      path: '/report-scam',
      icon: AlertTriangle,
      primary: true,
      active: location === '/report-scam'
    },
    { 
      name: 'History', 
      path: '/history', 
      icon: FileText,
      active: location === '/history'
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
      "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-between items-center z-10",
      className
    )}>
      {navItems.map((item, index) => (
        <Link 
          key={index} 
          href={item.path}
          className={cn(
            "bottom-nav-button",
            item.active ? "text-primary" : "text-gray-500"
          )}
        >
          {item.primary ? (
            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center -mt-6 shadow-lg">
              <item.icon className="w-7 h-7 text-white" />
            </div>
          ) : (
            <item.icon />
          )}
          <span>{item.name}</span>
        </Link>
      ))}
    </div>
  );
}
