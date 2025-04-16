import React from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  User,
  CreditCard,
  Settings,
  HelpCircle,
  Shield,
  Bell,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function Account() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get user ID (for demo purposes)
  const userId = 1;

  // Fetch user profile data
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error('Failed to load user profile');
      return res.json();
    },
  });

  // Menu items for the account section
  const menuItems = [
    {
      icon: <User className="w-5 h-5" />,
      title: 'My Profile',
      description: 'Manage your personal information',
      path: '/profile'
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      title: 'Payment Methods',
      description: 'Manage your UPI IDs, cards and bank accounts',
      path: '/payment-methods'
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: 'Settings',
      description: 'Adjust app preferences and security settings',
      path: '/settings'
    },
    {
      icon: <HelpCircle className="w-5 h-5" />,
      title: 'Help & Support',
      description: 'Get assistance and contact customer service',
      path: '/help-support'
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Security Center',
      description: 'Monitor and enhance account security',
      path: '/fraud-heatmap'
    },
    {
      icon: <Bell className="w-5 h-5" />,
      title: 'Scam Alerts',
      description: 'Stay updated on recent scam trends',
      path: '/scam-news'
    }
  ];

  // Handle logout
  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/logout');
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      setLocation('/');
    } catch (error) {
      toast({
        title: 'Logout failed',
        description: 'There was an error logging out.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>
      
      {/* User profile summary */}
      <Card className="p-4 mb-6 bg-primary/5 border-none">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-primary/25 flex items-center justify-center text-primary font-bold text-xl mr-4">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="font-bold text-lg">{user?.name || 'User'}</h2>
            <p className="text-sm text-gray-500">{user?.phoneNumber || '+91 9876543210'}</p>
          </div>
        </div>
      </Card>
      
      {/* Menu items */}
      <div className="space-y-3">
        {menuItems.map((item, index) => (
          <Card 
            key={index} 
            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => setLocation(item.path)}
          >
            <div className="flex items-center">
              <div className="bg-primary/10 p-2 rounded-full mr-4">
                {item.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Card>
        ))}
        
        {/* Logout option */}
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:text-destructive mt-6"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}