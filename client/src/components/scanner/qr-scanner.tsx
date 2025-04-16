import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  className?: string;
}

export function QRScanner({ onScan, onClose, className }: QRScannerProps) {
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Setup camera when component mounts
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const setupCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Check if flash is available
          const tracks = stream.getVideoTracks();
          if (tracks.length > 0) {
            const capabilities = tracks[0].getCapabilities();
            setHasFlash('torch' in capabilities);
          }
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };
    
    setupCamera();
    
    // Clean up function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Toggle flashlight
  const toggleFlash = async () => {
    if (!videoRef.current || !hasFlash) return;
    
    const stream = videoRef.current.srcObject as MediaStream;
    const tracks = stream.getVideoTracks();
    
    if (tracks.length > 0) {
      const track = tracks[0];
      const newFlashState = !flashOn;
      
      try {
        // @ts-ignore - 'torch' is not in the TypeScript definitions but works in supported browsers
        await track.applyConstraints({
          advanced: [{ torch: newFlashState }]
        });
        
        setFlashOn(newFlashState);
      } catch (error) {
        console.error('Error toggling flash:', error);
      }
    }
  };
  
  // QR code detection function
  const detectQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // In a real app, we would use a QR code scanning library here
    // For example, using jsQR or a similar library to detect QR codes
    
    // For this demo, we'll simulate scanning with a timeout
    // Normally, this would be a continuous scanning process
    setTimeout(() => {
      // Simulate finding UPI ID in the QR code
      // In production, this would be extracted from the QR code
      const detectedUpiId = 'citysupermarket@upi';
      
      // Once detected, send to parent component
      onScan(detectedUpiId);
    }, 3000);
  };
  
  // Start QR detection when video plays
  const handleVideoPlay = () => {
    detectQRCode();
  };

  return (
    <div className={cn("relative flex flex-col h-screen bg-black", className)}>
      {/* Header */}
      <div className="w-full flex justify-between items-center p-6">
        <button 
          onClick={onClose}
          className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className="w-6 h-6 text-white"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
        <p className="text-white font-medium">Scan QR Code</p>
        <div className="w-10"></div>
      </div>
      
      {/* Video feed */}
      <div className="flex-1 flex items-center justify-center">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover"
          onPlay={handleVideoPlay}
        />
        
        {/* Scan overlay */}
        <div className="border-2 border-white rounded-3xl w-[250px] h-[250px] relative z-10">
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
      
      {/* Controls */}
      <div className="w-full p-6 flex justify-center">
        {hasFlash && (
          <button 
            onClick={toggleFlash}
            className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className="w-6 h-6 text-white"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" 
              />
            </svg>
          </button>
        )}
        
        <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className="w-6 h-6 text-black"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" 
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" 
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
