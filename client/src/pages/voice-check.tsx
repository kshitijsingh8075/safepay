import React from 'react';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { VoiceInput } from '@/components/voice/voice-input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function VoiceCheck() {
  return (
    <div className="container py-4 px-4 md:py-6 md:px-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center">
        <Link href="/home">
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>
        </Link>
      </div>
      
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Voice Fraud Detection</h1>
        <p className="text-muted-foreground">
          Speak your command to check for potential fraud or make secure UPI transactions
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <VoiceInput />
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voice Commands Guide</CardTitle>
              <CardDescription>Try these example commands</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-sm mb-1">UPI Verification</h3>
                <p className="text-sm rounded-md bg-slate-100 dark:bg-slate-800 p-2">
                  "Check if mobikwik@ybl is safe"
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm mb-1">Send Money</h3>
                <p className="text-sm rounded-md bg-slate-100 dark:bg-slate-800 p-2">
                  "Send 500 rupees to john@okicici"
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm mb-1">View History</h3>
                <p className="text-sm rounded-md bg-slate-100 dark:bg-slate-800 p-2">
                  "Show my recent transactions"
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm mb-1">Check Balance</h3>
                <p className="text-sm rounded-md bg-slate-100 dark:bg-slate-800 p-2">
                  "What's my current balance"
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                Our voice command system analyzes your requests using advanced AI to 
                detect patterns of fraud and protect your transactions.
              </p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Speak clearly into your device's microphone</li>
                <li>Our system analyzes your request for security risks</li>
                <li>View the fraud analysis results instantly</li>
                <li>Proceed with the transaction if it's safe</li>
              </ol>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Voice data is processed securely and not stored after analysis
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}