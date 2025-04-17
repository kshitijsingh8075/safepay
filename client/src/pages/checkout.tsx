import { useEffect, useState, Suspense, lazy } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useAuthState } from '@/hooks/use-auth-state';

export default function Checkout() {
  const [searchParams] = useLocation();
  const params = new URLSearchParams(searchParams.split('?')[1] || '');
  
  const upiId = params.get('upiId') || '';
  const amount = parseFloat(params.get('amount') || '0');
  const description = params.get('description') || 'UPI Payment';
  
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Try to load Stripe and its React components
  useEffect(() => {
    async function loadStripeLibraries() {
      try {
        // This will be available for the StripeCheckout component when it's dynamically loaded
        // Add type declaration for global window object
        (window as any).STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
        setStripeLoaded(true);
      } catch (err) {
        console.error("Failed to load Stripe libraries:", err);
        setError("Failed to load payment processing libraries");
        setIsLoading(false);
      }
    }
    
    loadStripeLibraries();
  }, []);

  // Create a payment intent when the component mounts
  useEffect(() => {
    if (!upiId || !amount) {
      setError('Missing required payment information');
      setIsLoading(false);
      return;
    }

    async function createPaymentIntent() {
      try {
        const response = await apiRequest('POST', '/api/create-payment-intent', {
          amount,
          upiId,
          description,
        });

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        setIsLoading(false);
      } catch (err: any) {
        console.error("Payment intent creation error:", err);
        setError(err.message || 'Could not initialize payment');
        setIsLoading(false);
        toast({
          title: 'Payment Initialization Failed',
          description: err.message || 'Please try again later',
          variant: 'destructive',
        });
      }
    }

    if (stripeLoaded) {
      createPaymentIntent();
    }
  }, [upiId, amount, description, toast, stripeLoaded]);

  const handlePaymentSuccess = () => {
    setPaymentComplete(true);
    // Redirect to success page after a short delay
    setTimeout(() => {
      setLocation('/success');
    }, 2000);
  };
  
  // Load the Stripe checkout component only when clientSecret is available
  const StripeCheckout = clientSecret ? 
    lazy(() => import('../components/payments/stripe-checkout').then(module => ({
      default: module.default
    }))) : 
    null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Complete Your Payment</CardTitle>
          <CardDescription>
            {paymentComplete 
              ? 'Payment successfully processed!' 
              : `Pay ₹${amount.toFixed(2)} to ${upiId}`
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="bg-destructive/10 p-4 rounded-md text-center">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-destructive">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setLocation('/home')}
              >
                Return to Home
              </Button>
            </div>
          ) : paymentComplete ? (
            <div className="text-center py-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Payment Successful!</p>
              <p className="text-muted-foreground mt-1">
                Redirecting to confirmation page...
              </p>
            </div>
          ) : (clientSecret && StripeCheckout) ? (
            <Suspense fallback={<div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>}>
              <StripeCheckout 
                clientSecret={clientSecret}
                paymentIntentId={paymentIntentId}
                upiId={upiId}
                amount={amount}
                description={description}
                onSuccess={handlePaymentSuccess}
              />
            </Suspense>
          ) : null}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            Secure payment powered by Stripe. Your payment information is encrypted and secure.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}