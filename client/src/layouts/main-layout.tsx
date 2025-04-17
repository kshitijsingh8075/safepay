import React from 'react';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  noBottomNav?: boolean;
  className?: string;
}

export default function MainLayout({ 
  children, 
  noBottomNav = false,
  className
}: MainLayoutProps) {
  return (
    <div className={cn(
      "min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300", 
      className
    )}>
      <main className="pb-16">
        {children}
      </main>
      
      {!noBottomNav && <BottomNav />}
    </div>
  );
}
