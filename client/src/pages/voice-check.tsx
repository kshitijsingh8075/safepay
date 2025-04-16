import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VoiceWave } from '@/components/ui/voice-wave';
import { formatTime } from '@/lib/utils';
import { VoiceAnalysisResult, analyzeVoiceForScam } from '@/lib/scam-detection';

export default function VoiceCheck() {
  const [, setLocation] = useLocation();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [result, setResult] = useState<VoiceAnalysisResult | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    
    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    // Simulate recording for 5 seconds
    setTimeout(() => {
      stopRecording();
    }, 5000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Process the recording (in a real app, this would process actual audio)
    const transcript = "Hello, I'm calling from your bank. We've detected suspicious activity on your account. To secure your account, we need your UPI PIN immediately...";
    
    // Analyze the transcript for scam indicators
    const analysisResult = analyzeVoiceForScam(transcript);
    setResult(analysisResult);
  };

  const reportCall = () => {
    setLocation('/report-scam');
  };

  return (
    <div className="flex flex-col px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => setLocation('/home')}
          className="w-10 h-10 bg-[#F5F6FA] rounded-full flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Voice Scam Check</h1>
        <div className="w-10"></div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-gray-500 text-center mb-8">
          Record a call or conversation to check if it's a scam
        </p>
        
        <button
          onClick={toggleRecording}
          className={`w-20 h-20 ${isRecording ? 'bg-error' : 'bg-primary'} rounded-full flex items-center justify-center mb-8`}
        >
          {isRecording ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-10 h-10 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-10 h-10 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
              />
            </svg>
          )}
        </button>
        
        <VoiceWave isRecording={isRecording} />
        
        {isRecording && (
          <p className="text-primary font-medium mb-12">
            Recording... {formatTime(recordingTime)}
          </p>
        )}
        
        {result && (
          <Card className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 w-full mb-6">
            <h3 className="text-xl font-bold text-error mb-4 text-center">
              High Risk - Suspicious Call
            </h3>
            
            <div className="bg-[#F5F6FA] rounded-xl p-4 mb-4">
              <p className="text-sm mb-2 text-gray-500">Transcript:</p>
              <p className="text-sm">{result.transcript}</p>
            </div>
            
            <div className="border-t border-gray-100 pt-4">
              {result.scamIndicators.map((indicator, index) => (
                <div key={index} className="flex items-start mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-error mt-0.5 mr-2 flex-shrink-0"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                  <p className="text-sm">{indicator}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
        
        {result && (
          <Button
            onClick={reportCall}
            className="bg-primary text-white font-semibold py-4 px-6 rounded-xl shadow-md text-center w-full"
          >
            Report This Call
          </Button>
        )}
      </div>
    </div>
  );
}
