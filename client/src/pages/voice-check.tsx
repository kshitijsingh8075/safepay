import React, { useState, useRef, useEffect } from 'react';
import { VoiceWave } from '@/components/ui/voice-wave';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mic, MicOff, AlertTriangle, ShieldCheck, Shield, AlarmClock, ArrowLeft, Volume2, Ban, Info } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { processVoiceCommand, VoiceCommandResult, ScamType } from '@/lib/scam-detection';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

/**
 * Voice Scam Detection for UPI Transactions
 * Captures voice during UPI calls and provides real-time scam analysis
 */
const VoiceCheck: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VoiceCommandResult | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showDetectedKeywords, setShowDetectedKeywords] = useState(false);
  
  // Audio recording setup
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
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

  const startRecording = async () => {
    if (!recognition.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    // Reset states
    setIsRecording(true);
    setTranscript('');
    setAnalysisResult(null);
    setRecordingTime(0);
    setAudioBlob(null);
    audioChunksRef.current = [];
    
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup MediaRecorder for audio capture
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
      };
      
      // Start both MediaRecorder and SpeechRecognition
      mediaRecorderRef.current.start();
      recognition.current.start();
      
      // Setup timer to track recording duration
      recordingTimer.current = setInterval(() => {
        setRecordingTime(time => time + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Could not access the microphone. Please ensure you have granted permission.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (isRecording) {
      // Stop SpeechRecognition
      recognition.current?.stop();
      
      // Stop MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        
        // Stop all tracks in the stream
        mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      }
      
      setIsRecording(false);
      
      // Clear recording timer
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      
      // Automatically analyze voice after stopping if we have a transcript
      if (transcript.trim()) {
        analyzeVoice();
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
      
      // Two approaches:
      // 1. Process via server API (using OpenAI and complex analysis)
      // 2. Local processing as fallback
      
      let result;
      
      try {
        // Try advanced analysis first
        if (audioBlob) {
          // We have audio to analyze - will use audio and transcript
          // This would use APIs like analyzeTranscriptForScams in a real implementation
          const advancedAnalysis = await processVoiceCommand(transcript);
          result = advancedAnalysis;
        } else {
          // Just use text-based analysis
          result = await processVoiceCommand(transcript);
        }
      } catch (error) {
        console.error('Advanced voice analysis failed:', error);
        // Perform basic local analysis as fallback
        const basicResults = basicScamDetection(transcript);
        result = {
          command: transcript,
          action: 'analyze',
          risk_score: basicResults.score,
          fraud_type: basicResults.type,
          is_scam: basicResults.score > 0.5
        };
      }
      
      setAnalysisResult(result);
      
      // Auto-show the transcript and keywords if it's detected as a scam
      if (result.is_scam) {
        setShowTranscript(true);
        setShowDetectedKeywords(true);
      }
      
    } catch (error) {
      console.error('Error analyzing voice:', error);
      alert('Failed to analyze voice input. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Basic local analysis as fallback when server/AI analysis is unavailable
   */
  const basicScamDetection = (text: string) => {
    const scamKeywords = [
      'urgent', 'verify', 'OTP', 'password', 'locked', 'account suspended', 
      'immediately', 'click link', 'bank official', 'government', 'act now', 
      'limited time', 'pin', 'card details', 'suspicious activity'
    ];
    
    const lowerText = text.toLowerCase();
    let score = 0;
    const detectedKeywords: string[] = [];
    
    // Check for keywords
    scamKeywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += 0.1;
        detectedKeywords.push(keyword);
      }
    });
    
    // Determine scam type
    let type = 'Unknown';
    if (lowerText.includes('bank') || lowerText.includes('account')) {
      type = 'Banking Scam';
    } else if (lowerText.includes('kyc') || lowerText.includes('verify')) {
      type = 'KYC Verification Scam';
    } else if (lowerText.includes('refund') || lowerText.includes('cashback')) {
      type = 'Refund Scam';
    }
    
    return { 
      score: Math.min(score, 1), 
      type, 
      keywords: detectedKeywords
    };
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

  // Get visual keywords (common scam indicators) detected in the transcript
  const getDetectedKeywords = () => {
    const commonIndicators = [
      'suspicious activity', 'verify', 'otp', 'pin', 'account blocked', 
      'urgently', 'immediately', 'bank official', 'government', 'click link'
    ];
    
    const result: string[] = [];
    
    if (!transcript) return result;
    
    const lowerTranscript = transcript.toLowerCase();
    
    commonIndicators.forEach(indicator => {
      if (lowerTranscript.includes(indicator.toLowerCase())) {
        result.push(indicator);
      }
    });
    
    return result;
  };

  return (
    <div className="flex flex-col p-4 max-w-md mx-auto">
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
          <h1 className="text-xl font-bold">Voice Scam Detector</h1>
          <p className="text-sm text-muted-foreground">
            Analyze phone calls for UPI payment scams
          </p>
        </div>
      </div>
      
      {/* Main content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Real-time Voice Analysis
          </CardTitle>
          <CardDescription>
            Record the suspicious call to check for scam indicators
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          {/* Recording status */}
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isRecording && (
                <>
                  <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-medium">Recording...</span>
                </>
              )}
            </div>
            {recordingTime > 0 && (
              <div className="flex items-center gap-1">
                <AlarmClock className="w-4 h-4" />
                <span className="text-sm">{formatTime(recordingTime)}</span>
              </div>
            )}
          </div>
          
          {/* Voice wave visualization */}
          <div className="w-full flex justify-center p-4 bg-slate-50 rounded-lg">
            <VoiceWave isRecording={isRecording} />
          </div>
          
          {/* Record/Stop button */}
          <Button 
            variant={isRecording ? "destructive" : "default"}
            size="lg"
            className="w-full py-6 gap-2"
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? (
              <>
                <Ban className="w-5 h-5" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                Start Recording
              </>
            )}
          </Button>
          
          {/* Instructions */}
          <p className="text-sm text-center text-muted-foreground">
            {isRecording 
              ? "Recording voice in real-time. Press stop when finished."
              : "Press start when the caller begins speaking to detect scam patterns."}
          </p>
          
          {/* Analysis results */}
          {analysisResult && (
            <div className="w-full mt-6">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Analysis Results
              </h3>
              
              {/* Scam verdict */}
              <Alert 
                variant={analysisResult.is_scam ? "destructive" : "default"}
                className={analysisResult.is_scam ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}
              >
                <AlertTitle className="flex items-center gap-2">
                  {analysisResult.is_scam ? (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>Potential Scam Detected!</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>No Scam Detected</span>
                    </>
                  )}
                </AlertTitle>
                <AlertDescription>
                  {analysisResult.is_scam
                    ? "This conversation contains typical scam patterns. Do not share personal information or make payments."
                    : "No suspicious patterns were detected in this conversation."}
                </AlertDescription>
              </Alert>
              
              {/* Risk score */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Risk Level</span>
                  <span className="text-sm">
                    {Math.round((analysisResult.risk_score || 0) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getRiskColor(getRiskLevel(analysisResult.risk_score))}`}
                    style={{ width: `${Math.max(5, Math.round((analysisResult.risk_score || 0) * 100))}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Safe</span>
                  <span>Caution</span>
                  <span>Dangerous</span>
                </div>
              </div>
              
              {/* Fraud type if detected */}
              {analysisResult.fraud_type && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-1">Detected Scam Type:</p>
                  <Badge variant="outline" className="bg-amber-50">
                    {analysisResult.fraud_type}
                  </Badge>
                </div>
              )}
              
              {/* Show transcript toggle */}
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 w-full"
                onClick={() => setShowTranscript(!showTranscript)}
              >
                {showTranscript ? "Hide Transcript" : "Show Transcript"}
              </Button>
              
              {/* Transcript */}
              {showTranscript && transcript && (
                <div className="mt-2 p-3 bg-slate-50 rounded-md text-sm">
                  <p className="italic">"{transcript}"</p>
                </div>
              )}
              
              {/* Suspicious keywords */}
              {analysisResult.is_scam && (
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setShowDetectedKeywords(!showDetectedKeywords)}
                  >
                    {showDetectedKeywords ? "Hide Warning Signs" : "Show Warning Signs"}
                  </Button>
                  
                  {showDetectedKeywords && (
                    <div className="mt-2 space-y-2">
                      <p className="text-sm font-medium">Detected Warning Signs:</p>
                      <div className="flex flex-wrap gap-2">
                        {getDetectedKeywords().map((keyword, index) => (
                          <Badge key={index} variant="outline" className="bg-red-50">
                            {keyword}
                          </Badge>
                        ))}
                        {getDetectedKeywords().length === 0 && (
                          <p className="text-sm text-muted-foreground">No specific keywords detected.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Transaction action buttons */}
              {analysisResult.is_scam && (
                <div className="mt-6 space-y-2">
                  <Button variant="destructive" className="w-full">
                    Block Transaction & Report
                  </Button>
                  <Button variant="outline" className="w-full">
                    Continue with Caution
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Loading overlay */}
      {isProcessing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white p-6 rounded-lg">
            <p className="text-center mb-3 font-medium">Analyzing voice...</p>
            <Progress value={65} className="mb-4 w-56" />
            <p className="text-sm text-center text-muted-foreground">
              Checking for suspicious patterns and keywords
            </p>
          </div>
        </div>
      )}
      
      {/* Tips */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4" />
            Safety Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Banks never ask for OTP, UPI PIN or full card details over phone</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Urgent requests and pressure tactics are common in scam calls</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>If in doubt, hang up and call the official bank helpline directly</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceCheck;