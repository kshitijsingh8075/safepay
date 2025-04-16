import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugNavigation() {
  return (
    <div className="container py-8 px-4 max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>UPI Scam Detection - Debug Navigation</CardTitle>
          <CardDescription>
            Use this page to navigate directly to any feature for testing
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button asChild className="h-24 flex flex-col" variant="outline">
              <Link href="/voice-check">
                <span className="text-lg">Voice Check</span>
                <span className="text-xs text-muted-foreground">Test voice fraud detection</span>
              </Link>
            </Button>
            
            <Button asChild className="h-24 flex flex-col" variant="outline">
              <Link href="/scan">
                <span className="text-lg">QR Scan</span>
                <span className="text-xs text-muted-foreground">Test QR code scanning</span>
              </Link>
            </Button>
            
            <Button asChild className="h-24 flex flex-col" variant="outline">
              <Link href="/upi-check">
                <span className="text-lg">UPI Check</span>
                <span className="text-xs text-muted-foreground">Test UPI risk analysis</span>
              </Link>
            </Button>
            
            <Button asChild className="h-24 flex flex-col" variant="outline">
              <Link href="/chat-support">
                <span className="text-lg">Chat Support</span>
                <span className="text-xs text-muted-foreground">Test AI chat assistant</span>
              </Link>
            </Button>
            
            <Button asChild className="h-24 flex flex-col" variant="outline">
              <Link href="/scam-news">
                <span className="text-lg">Scam News</span>
                <span className="text-xs text-muted-foreground">Test scam news alerts</span>
              </Link>
            </Button>
            
            <Button asChild className="h-24 flex flex-col" variant="outline">
              <Link href="/home">
                <span className="text-lg">Home</span>
                <span className="text-xs text-muted-foreground">Main dashboard</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}