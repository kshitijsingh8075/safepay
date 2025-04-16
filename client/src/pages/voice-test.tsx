import React, { useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Mic, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function VoiceTest() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  let mediaRecorder: MediaRecorder | null = null;
  let recordedChunks: Blob[] = [];
  let timerInterval: NodeJS.Timeout | null = null;
  
  const startRecording = async () => {
    try {
      recordedChunks = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };
      
      mediaRecorder.onstart = () => {
        setStatus('recording');
        setIsRecording(true);
        setRecordingTime(0);
        
        // Start timer
        timerInterval = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      };
      
      mediaRecorder.onstop = async () => {
        if (timerInterval) clearInterval(timerInterval);
        setStatus('processing');
        
        try {
          const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', audioBlob);
          
          console.log('Sending audio data to server...');
          const response = await fetch('/api/process-voice', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
          }
          
          const result = await response.json();
          setTranscript(result.transcript || 'No transcript available');
          setAnalysis(result.analysis);
          setStatus('success');
          console.log('Processing complete:', result);
        } catch (error) {
          console.error('Error processing audio:', error);
          setStatus('error');
          setErrorMessage(error instanceof Error ? error.message : 'Unknown error processing audio');
        }
        
        setIsRecording(false);
        
        // Stop all tracks in the stream to release the microphone
        if (mediaRecorder && mediaRecorder.stream) {
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Could not access microphone');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div className="container py-4 px-4 md:py-6 md:px-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" className="flex items-center gap-1 text-sm">
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Button>
        </Link>
        <div>
          <Badge variant="outline" className="font-normal">
            Voice Testing Tool
          </Badge>
        </div>
      </div>
      
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Voice Fraud Detection Test</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          This is a test page to verify voice input and fraud detection. Speak clearly and mention UPI IDs or transactions.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Voice Recording</CardTitle>
            <CardDescription>
              Tap to record your voice (max 30 seconds)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center my-8">
              <Button 
                className={`rounded-full w-20 h-20 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-primary'}`}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={status === 'processing'}
              >
                <Mic size={30} />
              </Button>
            </div>
            
            {status === 'recording' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Recording...</span>
                  <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
                </div>
                <Progress value={Math.min((recordingTime / 30) * 100, 100)} className="h-2" />
              </div>
            )}
            
            {status === 'processing' && (
              <div className="text-center py-4">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Processing audio...</p>
              </div>
            )}
            
            {status === 'error' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {errorMessage || 'There was an error processing your voice input.'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          {transcript && (
            <Card>
              <CardHeader>
                <CardTitle>Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm rounded-md bg-slate-100 dark:bg-slate-800 p-3">
                  {transcript}
                </p>
              </CardContent>
            </Card>
          )}
          
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle>Fraud Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Risk Level:</span>
                  <Badge className={getRiskColor(analysis.riskLevel)}>
                    {analysis.riskLevel || 'Unknown'}
                  </Badge>
                </div>
                
                {analysis.upiId && (
                  <div>
                    <span className="font-medium">UPI ID:</span>
                    <p className="mt-1 text-sm">{analysis.upiId}</p>
                  </div>
                )}
                
                {analysis.amount !== undefined && (
                  <div>
                    <span className="font-medium">Transaction Amount:</span>
                    <p className="mt-1 text-sm">₹{analysis.amount}</p>
                  </div>
                )}
                
                {analysis.recommendations && (
                  <div>
                    <span className="font-medium">Recommendations:</span>
                    <p className="mt-1 text-sm">{analysis.recommendations}</p>
                  </div>
                )}
                
                {analysis.scamIndicators && (
                  <div>
                    <span className="font-medium">Scam Indicators:</span>
                    <ul className="mt-1 text-sm list-disc pl-5 space-y-1">
                      {analysis.scamIndicators.map((indicator: string, i: number) => (
                        <li key={i}>{indicator}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Analysis powered by OpenAI
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}