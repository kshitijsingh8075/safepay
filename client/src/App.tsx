import React from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import OTP from "@/pages/otp";
import PIN from "@/pages/pin";
import PhoneLogin from "@/pages/phone-login";
import SetupSecurity from "@/pages/setup-security";
import Home from "@/pages/home";
import Scan from "@/pages/scan";
import Payment from "@/pages/payment";
import Success from "@/pages/success";
import UpiCheck from "@/pages/upi-check";
import ReportScam from "@/pages/report-scam";
import VoiceCheck from "@/pages/voice-check";
import MessageCheck from "@/pages/message-check";
import ChatSupport from "@/pages/chat-support";
import Account from "@/pages/account";
import Profile from "@/pages/profile";
import PaymentMethods from "@/pages/payment-methods";
import Settings from "@/pages/settings";
import HelpSupport from "@/pages/help-support";
import ScamNews from "@/pages/scam-news";
import LegalHelp from "@/pages/legal-help";
import FraudHeatmap from "@/pages/fraud-heatmap";
import FraudHeatmap2 from "@/pages/fraud-heatmap2";
import FraudHeatmapBasic from "@/pages/fraud-heatmap-basic";
import ConfirmTransaction from "@/pages/confirm-transaction";
import MainLayout from "@/layouts/main-layout";

// Import our simple home page
import SimpleHome from "@/pages/simple-home";

function Router() {
  return (
    <Switch>
      <Route path="/" component={SimpleHome} />
      <Route path="/phone-login" component={PhoneLogin} />
      <Route path="/login" component={Login} />
      <Route path="/otp" component={OTP} />
      <Route path="/pin" component={PIN} />
      <Route path="/setup-security" component={SetupSecurity} />
      <Route path="/home">
        {() => (
          <MainLayout>
            <Home />
          </MainLayout>
        )}
      </Route>
      <Route path="/scan" component={Scan} />
      <Route path="/confirm-transaction" component={ConfirmTransaction} />
      <Route path="/payment" component={Payment} />
      <Route path="/success" component={Success} />
      <Route path="/upi-check">
        {() => (
          <MainLayout>
            <UpiCheck />
          </MainLayout>
        )}
      </Route>
      <Route path="/report-scam">
        {() => (
          <MainLayout>
            <ReportScam />
          </MainLayout>
        )}
      </Route>
      <Route path="/voice-check">
        {() => (
          <MainLayout>
            <VoiceCheck />
          </MainLayout>
        )}
      </Route>
      <Route path="/message-check">
        {() => (
          <MainLayout>
            <MessageCheck />
          </MainLayout>
        )}
      </Route>
      <Route path="/history">
        {() => (
          <MainLayout>
            <ChatSupport />
          </MainLayout>
        )}
      </Route>
      <Route path="/chat-support" component={ChatSupport} />
      <Route path="/account">
        {() => (
          <MainLayout>
            <Account />
          </MainLayout>
        )}
      </Route>
      <Route path="/scam-news">
        {() => (
          <MainLayout>
            <ScamNews />
          </MainLayout>
        )}
      </Route>
      <Route path="/legal-help">
        {() => (
          <MainLayout>
            <LegalHelp />
          </MainLayout>
        )}
      </Route>
      <Route path="/fraud-heatmap">
        {() => (
          <MainLayout>
            <FraudHeatmap />
          </MainLayout>
        )}
      </Route>
      
      <Route path="/profile">
        {() => (
          <MainLayout>
            <Profile />
          </MainLayout>
        )}
      </Route>
      
      <Route path="/payment-methods">
        {() => (
          <MainLayout>
            <PaymentMethods />
          </MainLayout>
        )}
      </Route>
      
      <Route path="/settings">
        {() => (
          <MainLayout>
            <Settings />
          </MainLayout>
        )}
      </Route>
      
      <Route path="/help-support">
        {() => (
          <MainLayout>
            <HelpSupport />
          </MainLayout>
        )}
      </Route>
      
      <Route path="/fraud-heatmap-basic" component={FraudHeatmapBasic} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router />
      </ErrorBoundary>
      <Toaster />
    </QueryClientProvider>
  );
}

// Simple error boundary component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("React error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
          <p className="mb-4">An error occurred in the application.</p>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => window.location.href = '/'}
          >
            Go to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default App;
