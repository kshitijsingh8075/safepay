import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

/**
 * Voice Input System for UPI scam detection
 */
export function VoiceInput() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('Click to start recording');
  const [result, setResult] = useState<any>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Initialize speech recognition on component mount
  useEffect(() => {
    setupRecognition();
    return () => {
      // Cleanup on unmount
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Setup Web Speech API
  const setupRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onstart = () => {
        setIsRecording(true);
        setStatus('Listening...');
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setStatus(`Processing: "${transcript}"`);
        processVoiceCommand(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Voice error:', event.error);
        toast({
          title: 'Voice Recognition Error',
          description: `Error: ${event.error}`,
          variant: 'destructive',
        });
        resetUI();
      };

      recognitionRef.current.onend = () => {
        if (!isProcessing) {
          resetUI();
        }
      };
    } else {
      setStatus('Speech recognition not supported in this browser');
      toast({
        title: 'Browser Not Supported',
        description: 'Your browser does not support voice recognition',
        variant: 'destructive',
      });
    }
  };

  // Process voice command by sending to backend
  const processVoiceCommand = async (transcript: string) => {
    try {
      setIsProcessing(true);
      
      const response = await apiRequest('POST', '/api/process-voice', {
        command: transcript,
        language: navigator.language || 'en-US',
        session: Date.now()
      });
      
      const data = await response.json();
      setResult(data);
      
      // Show toast notification based on risk level
      if (data.risk_score > 0.7) {
        toast({
          title: 'High Risk Detected!',
          description: `This command may be related to ${data.fraud_type} fraud`,
          variant: 'destructive',
        });
      } else if (data.risk_score > 0.3) {
        toast({
          title: 'Medium Risk Detected',
          description: `Please verify this command carefully`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Command Processed',
          description: `Action: ${typeof data.action === 'string' ? data.action : JSON.stringify(data.action)}`,
        });
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      toast({
        title: 'Processing Error',
        description: 'Failed to process voice command',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      resetUI();
    }
  };

  // Reset UI state
  const resetUI = () => {
    setIsRecording(false);
    setIsProcessing(false);
    setStatus('Click to start recording');
  };

  // Toggle recording state
  const toggleRecording = async () => {
    if (!recognitionRef.current) {
      setupRecognition();
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (isRecording) {
        recognitionRef.current.stop();
      } else {
        // Start new recording session
        setResult(null);
        recognitionRef.current.start();
      }
    } catch (err) {
      toast({
        title: 'Microphone Access Required',
        description: 'Please allow microphone access for voice commands',
        variant: 'destructive',
      });
    }
  };

  // Format the action object or string for display
  const formatAction = (action: any) => {
    if (typeof action === 'string') {
      return action;
    } else if (typeof action === 'object') {
      return JSON.stringify(action, null, 2);
    }
    return 'Unknown action';
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Command Input
        </CardTitle>
        <CardDescription>
          Speak to perform UPI transactions or check for scams
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <Button
            onClick={toggleRecording}
            className={`rounded-full w-16 h-16 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-primary'}`}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
          <p className="text-sm font-medium">{status}</p>
        </div>

        {result && (
          <div className="border rounded-md p-4 bg-slate-50 dark:bg-slate-800">
            <h3 className="font-medium mb-2">Command: {result.command}</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Action:</span> {formatAction(result.action)}</p>
              {result.risk_score !== undefined && (
                <div>
                  <p className="font-medium">Risk Assessment:</p>
                  <div className="mt-1 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        result.risk_score > 0.7 ? 'bg-red-500' : 
                        result.risk_score > 0.3 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${result.risk_score * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span>Safe</span>
                    <span>Risky</span>
                  </div>
                  {result.fraud_type && (
                    <p className="mt-2"><span className="font-medium">Potential Issue:</span> {result.fraud_type}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <p>Try saying: "Check if xyz@ybl is safe" or "Send 500 to friend@okicici"</p>
      </CardFooter>
    </Card>
  );
}