import React from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { 
  CreditCard, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  Settings,
  IdCard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Account() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const handleLogout = () => {
    // In a real app, we would clear auth state
    toast({
      title: "Logging out",
      description: "You have been successfully logged out",
    });
    
    setTimeout(() => {
      setLocation('/');
    }, 1000);
  };

  return (
    <div className="flex flex-col px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">My Account</h1>
      
      <div className="flex items-center mb-8">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mr-4">
          <span className="text-2xl font-bold text-white">RS</span>
        </div>
        <div>
          <h2 className="text-xl font-bold">Rahul Sharma</h2>
          <p className="text-gray-500">+91 9876543210</p>
        </div>
      </div>
      
      <Card className="bg-white rounded-2xl p-2 shadow-md border border-gray-100 mb-6">
        <button className="w-full flex items-center justify-between p-4">
          <div className="flex items-center">
            <IdCard className="w-6 h-6 text-primary mr-3" />
            <span className="font-medium">My Profile</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
        
        <div className="border-t border-gray-100"></div>
        
        <button className="w-full flex items-center justify-between p-4">
          <div className="flex items-center">
            <CreditCard className="w-6 h-6 text-primary mr-3" />
            <span className="font-medium">Payment Methods</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
        
        <div className="border-t border-gray-100"></div>
        
        <button className="w-full flex items-center justify-between p-4">
          <div className="flex items-center">
            <HelpCircle className="w-6 h-6 text-primary mr-3" />
            <span className="font-medium">Help & Support</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
        
        <div className="border-t border-gray-100"></div>
        
        <button className="w-full flex items-center justify-between p-4">
          <div className="flex items-center">
            <Settings className="w-6 h-6 text-primary mr-3" />
            <span className="font-medium">Settings</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      </Card>
      
      <button 
        onClick={handleLogout}
        className="flex items-center justify-center py-4 px-6 rounded-xl border border-gray-200 text-error font-medium"
      >
        <LogOut className="w-5 h-5 mr-2" />
        Log Out
      </button>
    </div>
  );
}
