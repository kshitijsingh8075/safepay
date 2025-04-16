import React from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { 
  ArrowLeft, 
  Fingerprint, 
  Lock, 
  Bell,
  Moon,
  Languages,
  ShieldCheck,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

type SettingsSectionProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
};

// Component for a settings section
function SettingsSection({ title, description, icon, children }: SettingsSectionProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <div className="bg-primary/10 p-2 rounded-full mr-3">
            {icon}
          </div>
          <div>
            <CardTitle className="text-md">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get user ID from URL or localStorage (in a real app you'd get this from auth context)
  const userId = 1; // For demo purposes

  // Fetch user profile data
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error('Failed to load user profile');
      return res.json();
    },
  });

  // Enable/disable biometric authentication
  const biometricMutation = useMutation({
    mutationFn: async ({ userId, enable }: { userId: number; enable: boolean }) => {
      return apiRequest('POST', '/api/auth/biometric', { userId, enable });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
      toast({
        title: 'Settings updated',
        description: 'Your biometric settings have been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Generic settings update mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PATCH', `/api/users/${userId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
      toast({
        title: 'Settings updated',
        description: 'Your settings have been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle biometric authentication
  const toggleBiometric = (checked: boolean) => {
    biometricMutation.mutate({ userId, enable: checked });
  };

  // Simplified toggles for demo
  const toggleNotifications = () => {
    toast({
      title: 'Notifications',
      description: 'Notification settings updated.',
    });
  };

  const toggleDarkMode = () => {
    toast({
      title: 'Dark Mode',
      description: 'Display mode updated.',
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-6 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2" 
          onClick={() => setLocation('/account')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="space-y-6">
        <SettingsSection 
          title="Security" 
          description="Secure your account with additional verification methods"
          icon={<ShieldCheck className="h-5 w-5 text-primary" />}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Fingerprint className="h-4 w-4 text-gray-500" />
                <Label htmlFor="biometric">Biometric Authentication</Label>
              </div>
              <Switch 
                id="biometric" 
                checked={user?.useBiometric || false}
                onCheckedChange={toggleBiometric}
                disabled={biometricMutation.isPending}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-gray-500" />
                <Label htmlFor="pin">PIN Login</Label>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/pin')}
              >
                {user?.usePin ? 'Change PIN' : 'Set PIN'}
              </Button>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection 
          title="Notifications" 
          description="Configure which alerts and notifications you receive"
          icon={<Bell className="h-5 w-5 text-primary" />}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="payment-alerts">Payment Alerts</Label>
              <Switch 
                id="payment-alerts" 
                defaultChecked={true}
                onCheckedChange={toggleNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="security-alerts">Security Alerts</Label>
              <Switch 
                id="security-alerts" 
                defaultChecked={true}
                onCheckedChange={toggleNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="news-updates">Scam News & Updates</Label>
              <Switch 
                id="news-updates" 
                defaultChecked={true}
                onCheckedChange={toggleNotifications}
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection 
          title="Appearance" 
          description="Customize how the app looks and displays"
          icon={<Moon className="h-5 w-5 text-primary" />}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <Switch 
                id="dark-mode" 
                onCheckedChange={toggleDarkMode}
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection 
          title="Language" 
          description="Change your preferred language"
          icon={<Languages className="h-5 w-5 text-primary" />}
        >
          <div className="text-sm text-gray-500">
            <p>Currently set to: <span className="font-medium text-gray-900">English</span></p>
            <Button 
              variant="link" 
              className="p-0 h-auto mt-1"
              onClick={() => toast({
                title: 'Language settings',
                description: 'Language settings will be available in future updates.',
              })}
            >
              Change language
            </Button>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}