import React, { useState, useRef, useEffect } from 'react';
import { VoiceWave } from '@/components/ui/voice-wave';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mic, MicOff, AlertTriangle, ShieldCheck, Shield, AlarmClock, ArrowLeft } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { processVoiceCommand, VoiceCommandResult } from '@/lib/scam-detection';
import { Progress } from '@/components/ui/progress';

const VoiceCheck: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VoiceCommandResult | null>(null);
  
  // SpeechRecognition setup
  const recognition = useRef<any>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join(' ');
        setTranscript(transcript);
      };

      recognition.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        stopRecording();
      };

      recognition.current.onend = () => {
        if (isRecording) {
          recognition.current?.start();
        }
      };
    } else {
      console.error('Speech recognition not supported in this browser');
    }

    return () => {
      stopRecording();
    };
  }, []);

  const startRecording = () => {
    if (!recognition.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    setIsRecording(true);
    setTranscript('');
    setAnalysisResult(null);
    setRecordingTime(0);
    
    recognition.current.start();
    
    // Setup timer to track recording duration
    recordingTimer.current = setInterval(() => {
      setRecordingTime(time => time + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (isRecording) {
      recognition.current?.stop();
      setIsRecording(false);
      
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
    }
  };

  const analyzeVoice = async () => {
    if (!transcript.trim()) {
      alert('Please record a voice message first');
      return;
    }

    try {
      setIsProcessing(true);
      const result = await processVoiceCommand(transcript);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error analyzing voice:', error);
      alert('Failed to analyze voice input. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRiskLevel = (score?: number): 'low' | 'medium' | 'high' => {
    if (!score) return 'low';
    if (score < 0.3) return 'low';
    if (score < 0.7) return 'medium';
    return 'high';
  };

  const getRiskColor = (level: 'low' | 'medium' | 'high'): string => {
    switch (level) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskIcon = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return <ShieldCheck className="w-6 h-6 text-green-500" />;
      case 'medium': return <Shield className="w-6 h-6 text-yellow-500" />;
      case 'high': return <AlertTriangle className="w-6 h-6 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col p-4">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => window.history.back()}
          className="p-1 mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Voice Scam</h1>
          <h2 className="text-lg font-semibold">Detect</h2>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col items-center justify-center space-y-8">
        {/* Recording button */}
        <Button 
          className="w-full bg-indigo-500 hover:bg-indigo-600 py-6 rounded-xl"
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>
        
        {/* Press to record text */}
        <p className="text-sm text-gray-500">Press to record</p>
        
        {/* Microphone circle */}
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
          {isRecording ? 
            <MicOff className="w-8 h-8 text-gray-500" /> : 
            <Mic className="w-8 h-8 text-gray-500" />}
        </div>
        
        {/* Voice wave visualization */}
        <div className="w-full h-16 flex items-center justify-center">
          <svg width="240" height="64" viewBox="0 0 240 64" className="text-gray-800">
            <g>
              {/* Generate voice wave bars */}
              {Array.from({ length: 24 }).map((_, i) => {
                // Calculate varying heights for the bars
                const height = isRecording ? 
                  Math.max(5, Math.floor(Math.random() * 40 + 10)) : 
                  Math.max(5, Math.sin(i * 0.5) * 30 + 20);
                  
                return (
                  <rect 
                    key={i}
                    x={i * 10} 
                    y={32 - height / 2} 
                    width="2" 
                    height={height} 
                    fill="currentColor"
                  />
                );
              })}
            </g>
          </svg>
        </div>
        
        {/* Detection result */}
        <div className={`${analysisResult?.is_scam ? 'bg-red-50' : 'bg-blue-50'} w-60 py-4 rounded-xl text-center`}>
          <p className="text-sm text-gray-600 mb-1">Scam Detection Result</p>
          <p className="text-2xl font-bold text-gray-900">
            {analysisResult ? 
              (analysisResult.is_scam ? 'SCAM' : 'SAFE') : 
              'SAFE'
            }
          </p>
        </div>
      </div>
      
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white p-4 rounded-lg">
            <p className="text-center mb-2">Analyzing voice...</p>
            <Progress value={45} className="mb-2 w-40" />
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceCheck;