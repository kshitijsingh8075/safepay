import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageAnalysisResult, analyzeMessageForScam } from '@/lib/scam-detection';

export default function MessageCheck() {
  const [, setLocation] = useLocation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [result, setResult] = useState<MessageAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const analyzeImage = () => {
    // In a real app, we would upload the image and get OCR results
    setIsAnalyzing(true);
    
    // Simulate API call for OCR and analysis
    setTimeout(() => {
      const extractedText = "Congratulations! You've won a free iPhone 14 Pro in our giveaway. Click the link to claim: bit.ly/claim-prize123 (Valid for 24hrs only)";
      
      // Analyze the extracted text for scam indicators
      const analysisResult = analyzeMessageForScam(extractedText);
      setResult(analysisResult);
      setIsAnalyzing(false);
    }, 2000);
  };

  const reportMessage = () => {
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
        <h1 className="text-xl font-bold">Message Check</h1>
        <div className="w-10"></div>
      </div>
      
      <p className="text-gray-500 text-center mb-6">
        Upload a screenshot of suspicious WhatsApp or SMS message
      </p>
      
      <div 
        onClick={triggerFileInput}
        className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center mb-8 cursor-pointer"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />
        
        {selectedImage ? (
          <div className="text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 text-primary mb-4 mx-auto"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="font-medium text-gray-800 mb-1">{selectedImage.name}</p>
            <p className="text-xs text-gray-500">Click to change image</p>
          </div>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 text-gray-500 mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
            <p className="text-gray-500 text-center mb-4">Tap to upload a screenshot</p>
            <p className="text-xs text-gray-500 text-center">We'll analyze the text for scam indicators</p>
          </>
        )}
      </div>
      
      {result && (
        <Card className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 mb-6">
          <h3 className="text-xl font-bold text-error mb-4 text-center">
            Scam Detected
          </h3>
          
          <div className="bg-[#F5F6FA] rounded-xl p-4 mb-4">
            <p className="text-sm mb-2 text-gray-500">Extracted Text:</p>
            <p className="text-sm">{result.extractedText}</p>
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
      
      <Button
        onClick={analyzeImage}
        disabled={!selectedImage || isAnalyzing}
        className="bg-primary text-white font-semibold py-4 px-6 rounded-xl shadow-md text-center"
      >
        {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
      </Button>
      
      {result && (
        <Button
          onClick={reportMessage}
          className="bg-primary text-white font-semibold py-4 px-6 rounded-xl shadow-md text-center mt-4"
        >
          Report This Message
        </Button>
      )}
    </div>
  );
}
