import React from 'react';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { TopBar } from '@/components/navigation/top-bar';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  noBottomNav?: boolean;
  noTopBar?: boolean;
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  showNotification?: boolean;
  showProfile?: boolean;
  className?: string;
  onSearchSubmit?: (query: string) => void;
}

export default function MainLayout({ 
  children, 
  noBottomNav = false,
  noTopBar = false,
  title,
  showBack,
  showSearch,
  showNotification,
  showProfile,
  className,
  onSearchSubmit
}: MainLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-white", className)}>
      {!noTopBar && (
        <TopBar 
          title={title}
          showBack={showBack}
          showSearch={showSearch}
          showNotification={showNotification}
          showProfile={showProfile}
          onSearchSubmit={onSearchSubmit}
        />
      )}
      
      <main className={cn("pb-16", !noTopBar && "pt-2")}>
        {children}
      </main>
      
      {!noBottomNav && <BottomNav />}
    </div>
  );
}
