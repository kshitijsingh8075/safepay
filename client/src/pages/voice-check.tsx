import React, { useState, useRef, useEffect } from 'react';
import { VoiceWave } from '@/components/ui/voice-wave';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mic, MicOff, AlertTriangle, ShieldCheck, Shield, AlarmClock } from 'lucide-react';
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
  const recognition = useRef<SpeechRecognition | null>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join(' ');
        setTranscript(transcript);
      };

      recognition.current.onerror = (event) => {
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
    <div className="container mx-auto py-6 max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Voice Fraud Detection</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Record Voice</CardTitle>
          <CardDescription>Speak clearly to analyze for potential scams</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <VoiceWave isRecording={isRecording} />
            
            <div className="text-center mb-4">
              {isRecording && (
                <div className="flex items-center justify-center mb-2">
                  <AlarmClock className="w-4 h-4 mr-2" />
                  <span>{formatTime(recordingTime)}</span>
                </div>
              )}
              
              <div className="flex space-x-4">
                {!isRecording ? (
                  <Button 
                    onClick={startRecording}
                    className="flex items-center"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button 
                    onClick={stopRecording}
                    variant="destructive"
                    className="flex items-center"
                  >
                    <MicOff className="w-4 h-4 mr-2" />
                    Stop Recording
                  </Button>
                )}
                
                <Button 
                  onClick={analyzeVoice}
                  disabled={!transcript.trim() || isRecording || isProcessing}
                >
                  Analyze Voice
                </Button>
              </div>
            </div>
            
            {transcript && (
              <div className="w-full mt-4">
                <h3 className="font-medium mb-2">Transcript:</h3>
                <div className="p-3 bg-muted rounded-md text-sm">{transcript}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {isProcessing && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-center mb-2">Analyzing voice...</p>
            <Progress value={45} className="mb-2" />
          </CardContent>
        </Card>
      )}
      
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Risk Score */}
              <div>
                <h3 className="font-medium mb-2">Risk Assessment</h3>
                <div className="flex items-center gap-2 mb-2">
                  {getRiskIcon(getRiskLevel(analysisResult.risk_score))}
                  <span className="font-semibold">
                    {getRiskLevel(analysisResult.risk_score) === 'low' ? 'Safe' : 
                     getRiskLevel(analysisResult.risk_score) === 'medium' ? 'Suspicious' : 'Likely Scam'}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div 
                    className={`h-2.5 rounded-full ${getRiskColor(getRiskLevel(analysisResult.risk_score))}`}
                    style={{ width: `${(analysisResult.risk_score || 0) * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span>Safe</span>
                  <span>Suspicious</span>
                  <span>Scam</span>
                </div>
              </div>
              
              <Separator />
              
              {/* Detected Intent */}
              <div>
                <h3 className="font-medium mb-2">Detected Intent</h3>
                <p className="capitalize">{analysisResult.action || 'Unknown'}</p>
              </div>
              
              {/* Scam Type if detected */}
              {analysisResult.is_scam && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2">Detected Scam Type</h3>
                    <p>{analysisResult.fraud_type || 'Unknown scam type'}</p>
                  </div>
                </>
              )}
              
              {/* Alert if it's a high risk */}
              {getRiskLevel(analysisResult.risk_score) === 'high' && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning: Potential Fraud Detected</AlertTitle>
                  <AlertDescription>
                    This message contains several indicators of a scam. Be extremely cautious and 
                    never share personal information or financial details.
                  </AlertDescription>
                </Alert>
              )}
              
              {getRiskLevel(analysisResult.risk_score) === 'medium' && (
                <Alert variant="default" className="mt-4 bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertTitle>Caution: Suspicious Content</AlertTitle>
                  <AlertDescription>
                    This message contains some suspicious elements. Proceed with caution and verify
                    before taking any action.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VoiceCheck;