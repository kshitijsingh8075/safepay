import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ArrowLeft, Camera, Check, Flashlight, X, ShieldAlert, ShieldCheck } from 'lucide-react';
import jsQR from 'jsqr';
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';
import { analyzeQRWithML, extractUPIPaymentInfo, QRScanResult } from '@/lib/ml-qr-scanner';
import { analyzeQRWithOptimizedML } from '@/lib/enhanced-optimized-qr-scanner';
import { analyzeQRCode, extractUPIInfo, UnifiedQRAnalysisResult } from '@/lib/unified-qr-scanner';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  className?: string;
}

export function EnhancedQRScanner({ onScan, onClose, className }: QRScannerProps) {
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualUpiId, setManualUpiId] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Track scan start time for fallback
  const scanStartTime = Date.now();

  // Initialize the ZXing code reader
  useEffect(() => {
    // Set up hints to focus on QR codes
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    
    // Create the reader instance
    const codeReader = new BrowserMultiFormatReader(hints);
    codeReaderRef.current = codeReader;

    return () => {
      // Clean up
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);
  
  // Setup camera when component mounts
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const setupCamera = async () => {
      try {
        if (!videoRef.current) return;

        const constraints = {
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        };

        // Release any existing stream
        if (videoRef.current.srcObject) {
          const oldStream = videoRef.current.srcObject as MediaStream;
          oldStream.getTracks().forEach(track => track.stop());
        }

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
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
        setScanError('Camera access error. Please check camera permissions.');
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
        await track.applyConstraints({
          // @ts-ignore - Suppressing typescript error for torch property
          advanced: [{ torch: newFlashState }]
        });
        
        setFlashOn(newFlashState);
      } catch (error) {
        console.error('Error toggling flash:', error);
      }
    }
  };
  
  // State for ML scan result
  const [mlScanResult, setMlScanResult] = useState<QRScanResult | null>(null);
  
  // Process detected QR code data with ML-powered analysis
  const processQrCode = async (qrData: string) => {
    console.log('QR code detected:', qrData);
    setScanProgress(70); // Update progress to show we're analyzing
    
    // Create initial payment info object
    let paymentInfo = {
      upi_id: '',
      name: '',
      amount: '',
      currency: 'INR',
      ml_risk_score: 0,
      ml_risk_level: 'Low' as 'Low' | 'Medium' | 'High',
      ml_recommendation: 'Allow' as 'Allow' | 'Verify' | 'Block',
      service_used: 'unified'
    };
    
    try {
      setScanProgress(85); // Update progress to show analysis
      console.log('Analyzing QR code with unified scanner service...');
      
      // Use unified QR analysis with fallback mechanisms
      const analysisResult = await analyzeQRCode(qrData);
      console.log('Unified QR analysis result:', analysisResult);
      
      // Update payment info based on analysis result
      paymentInfo.ml_risk_score = analysisResult.risk_score;
      paymentInfo.ml_risk_level = analysisResult.risk_level;
      paymentInfo.ml_recommendation = 
        analysisResult.risk_level === 'High' ? 'Block' : 
        analysisResult.risk_level === 'Medium' ? 'Verify' : 'Allow';
      paymentInfo.service_used = analysisResult.service_used;
      
      // Add UPI payment info if available
      if (analysisResult.payment_info && analysisResult.payment_info.is_valid) {
        paymentInfo.upi_id = analysisResult.payment_info.upi_id || '';
        paymentInfo.name = analysisResult.payment_info.payee_name || '';
        paymentInfo.amount = analysisResult.payment_info.amount?.toString() || '';
      } else if (qrData.includes('@')) {
        // Directly a UPI ID (like abc@bank)
        paymentInfo.upi_id = qrData;
        paymentInfo.name = 'Unknown Merchant';
      } else {
        // Last resort - try to extract UPI using regex
        const match = qrData.match(/([a-zA-Z0-9\.\_\-]+@[a-zA-Z0-9]+)/);
        if (match && match[1]) {
          paymentInfo.upi_id = match[1];
        } else {
          paymentInfo.upi_id = 'unknown'; // Use a placeholder so the app doesn't crash
          setScanError('Could not detect a valid UPI ID. Try manual entry.');
        }
      }
      
      // Always show success UI regardless of risk level
      setScanComplete(true);
      setScanProgress(100);
      
      // Return the detected payment info and analysis
      setTimeout(() => {
        // Play success sound
        const audio = new Audio('/sounds/qr-success.mp3');
        audio.play().catch(err => console.log('Audio play error', err));
        
        // Pass the complete payment info with analysis
        onScan(JSON.stringify(paymentInfo));
      }, 800); // Show success animation briefly
      
    } catch (error) {
      console.error('Error analyzing QR code:', error);
      
      // Fallback to basic detection if all analysis fails
      // Extract basic UPI ID if possible
      if (qrData.startsWith('upi://')) {
        const paMatch = qrData.match(/pa=([^&]+)/);
        const pnMatch = qrData.match(/pn=([^&]+)/);
        
        if (paMatch) {
          paymentInfo.upi_id = decodeURIComponent(paMatch[1]);
          if (pnMatch) {
            paymentInfo.name = decodeURIComponent(pnMatch[1]);
          }
        }
      }
      
      setScanComplete(true);
      setScanProgress(100);
      
      setTimeout(() => {
        const audio = new Audio('/sounds/qr-success.mp3');
        audio.play().catch(err => console.log('Audio play error', err));
        
        onScan(JSON.stringify(paymentInfo));
      }, 800);
    }
  };

  // Use ZXing for QR code detection
  const startZxingDetection = () => {
    if (!codeReaderRef.current || !videoRef.current || scanComplete) return;
    
    const videoElement = videoRef.current;
    
    try {
      setIsScanning(true);
      
      codeReaderRef.current.decodeFromVideoDevice(
        null, // Use default camera
        videoElement,
        (result, error) => {
          if (result) {
            // QR code detected!
            processQrCode(result.getText());
            
            // Stop continuous scanning once detected
            codeReaderRef.current?.reset();
          }
          
          if (error && !(error instanceof TypeError)) {
            // Only log actual errors, ignore TypeErrors which are normal when no QR code is present
            console.error('ZXing error:', error);
            
            // Do not use fallback timeout - require actual QR detection
            // Removed automatic fallback that was causing verification without scanning
          }

          // Update progress animation
          if (!scanComplete) {
            setScanProgress(prev => {
              // Make progress pulsate a bit to indicate active scanning
              const fluctuation = Math.sin(Date.now() / 300) * 5; // Oscillate between -5 and +5
              return Math.min(Math.max(50 + fluctuation, 40), 60); // Keep between 40-60%
            });
          }
        }
      );
    } catch (err) {
      console.error('Error starting ZXing detection:', err);
      
      // Fall back to jsQR detection
      startJsQrDetection();
    }
  };
  
  // Fallback to jsQR detection
  const startJsQrDetection = () => {
    if (scanComplete || !videoRef.current || !canvasRef.current) return;
    
    const detectQRCode = () => {
      if (scanComplete) {
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
        return;
      }
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas) return;
      
      // Set canvas dimensions to match video
      const width = video.videoWidth;
      const height = video.videoHeight;
      
      if (width === 0 || height === 0) {
        // Video dimensions not yet available, try again shortly
        animationFrameId.current = requestAnimationFrame(detectQRCode);
        return;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Could not get canvas context');
        return;
      }
      
      // Draw the current video frame to the canvas
      ctx.drawImage(video, 0, 0, width, height);
      
      try {
        // Get image data for QR code analysis
        const imageData = ctx.getImageData(0, 0, width, height);
        
        // Process with jsQR
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert", // QR codes in well-lit conditions are dark on light background
        });
        
        if (code) {
          processQrCode(code.data);
          return;
        }
        
        // No QR code found, update progress and continue scanning
        setScanProgress(prev => {
          // Make progress pulsate a bit to indicate active scanning
          const fluctuation = Math.sin(Date.now() / 300) * 5; // Oscillate between -5 and +5
          return Math.min(Math.max(50 + fluctuation, 40), 60); // Keep between 40-60%
        });
        
        // Do not use automatic fallback - require actual QR detection
        if (Date.now() - scanStartTime > 10000 && !scanComplete) {
          setScanError('QR code not detected. Please try again or use manual entry.');
          setIsScanning(false);
          return;
        }
        
        // Continue scanning
        animationFrameId.current = requestAnimationFrame(detectQRCode);
      } catch (err) {
        console.error('jsQR scanning error:', err);
        
        setScanError('Error analyzing camera feed');
        
        // Continue scanning despite error, with a slight delay to prevent CPU overload
        setTimeout(() => {
          animationFrameId.current = requestAnimationFrame(detectQRCode);
        }, 500);
      }
    };
    
    setIsScanning(true);
    detectQRCode();
  };
  
  // Start QR detection when video plays
  const handleVideoPlay = () => {
    if (!isScanning) {
      setIsScanning(true);
      
      // Try ZXing first, fallback to jsQR if needed
      startZxingDetection();
    }
  };
  
  // Handle manual UPI entry with enhanced analysis
  const handleManualEntry = async () => {
    // Simple UPI validation with more flexible pattern for presentations
    const upiPattern = /^[\w.-]+@[\w]+$/;
    
    if (!manualUpiId.trim()) {
      setScanError('Please enter a UPI ID');
      return;
    }
    
    // Add default domain if missing
    let processedUpiId = manualUpiId;
    if (!processedUpiId.includes('@')) {
      processedUpiId += '@okaxis'; // Add a default bank for presentation
    }
    
    setScanProgress(75);
    
    // Initial payment info object
    let paymentInfo = {
      upi_id: processedUpiId,
      name: 'Demo Merchant',
      amount: '100',
      currency: 'INR',
      ml_risk_score: 0,
      ml_risk_level: 'Low' as 'Low' | 'Medium' | 'High',
      ml_recommendation: 'Allow' as 'Allow' | 'Verify' | 'Block',
      service_used: 'unified'
    };
    
    console.log('Processing manual UPI entry:', processedUpiId);
    
    // Construct a UPI URL for analysis
    const upiUrl = `upi://pay?pa=${processedUpiId}&pn=Demo%20Merchant&am=100&cu=INR&tn=Payment`;
    
    try {
      // Analyze with unified service
      setScanProgress(85);
      console.log('Analyzing manual UPI entry with unified service...');
      
      // Use unified QR analysis with fallback mechanisms
      const analysisResult = await analyzeQRCode(upiUrl);
      console.log('Unified analysis result for manual entry:', analysisResult);
      
      // Update payment info based on analysis result
      paymentInfo.ml_risk_score = analysisResult.risk_score;
      paymentInfo.ml_risk_level = analysisResult.risk_level;
      paymentInfo.ml_recommendation = 
        analysisResult.risk_level === 'High' ? 'Block' : 
        analysisResult.risk_level === 'Medium' ? 'Verify' : 'Allow';
      paymentInfo.service_used = analysisResult.service_used;
      
      // Add payment details from analysis if available
      if (analysisResult.payment_info && analysisResult.payment_info.is_valid) {
        paymentInfo.name = analysisResult.payment_info.payee_name || 'Demo Merchant';
      }
      
    } catch (error) {
      console.error('Error analyzing manual UPI entry:', error);
      // Continue with basic entry if analysis fails
    }
    
    setScanComplete(true);
    setScanProgress(100);
    
    // Return the payment info as JSON
    setTimeout(() => {
      onScan(JSON.stringify(paymentInfo));
    }, 500);
  };
  
  // Cleanup animation frame or timer on unmount
  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        // Clean up either requestAnimationFrame or setTimeout
        cancelAnimationFrame(animationFrameId.current);
        clearTimeout(animationFrameId.current);
      }
      
      // Also clean up ZXing reader
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  return (
    <div className={cn("relative flex flex-col h-screen bg-black", className)}>
      {/* Header */}
      <div className="w-full flex justify-between items-center p-6">
        <button 
          onClick={onClose}
          className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <p className="text-white font-medium">
          {manualEntry ? 'Enter UPI ID' : 'Scan QR Code'}
        </p>
        <div className="w-10"></div>
      </div>
      
      {!manualEntry ? (
        <>
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
            <div className="border-2 border-white rounded-3xl w-[250px] h-[250px] relative z-10 overflow-hidden flex items-center justify-center">
              <canvas ref={canvasRef} className="hidden" />
              
              {isScanning && !scanComplete && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                  <div className="w-16 h-16 mb-4">
                    <svg className="w-full h-full animate-pulse" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 9V5.25C3 4.00736 4.00736 3 5.25 3H9M9 21H5.25C4.00736 21 3 19.9926 3 18.75V15M21 15V18.75C21 19.9926 19.9926 21 18.75 21H15M15 3H18.75C19.9926 3 21 4.00736 21 5.25V9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="w-3/4 bg-gray-700 rounded-full h-1.5 mb-2">
                    <div 
                      className="bg-white h-1.5 rounded-full transition-all duration-100 ease-in-out" 
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <p className="text-white text-sm">Scanning QR code...</p>
                </div>
              )}
              
              {scanComplete && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                  <div className="w-16 h-16 text-green-500 animate-pulse mb-2">
                    <Check className="w-full h-full" />
                  </div>
                  <p className="text-white font-medium text-center">QR Code Detected!</p>
                  <p className="text-white text-sm mt-1">Starting security verification...</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Controls */}
          <div className="w-full p-6 flex flex-col items-center">
            <div className="flex justify-center mb-4">
              {hasFlash && (
                <button 
                  onClick={toggleFlash}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mr-4",
                    flashOn ? "bg-yellow-500" : "bg-white/20"
                  )}
                >
                  <Flashlight className="w-6 h-6 text-white" />
                </button>
              )}
              
              <button 
                onClick={() => setManualEntry(true)}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center"
              >
                <Camera className="w-6 h-6 text-black" />
              </button>
            </div>
            
            {/* QR Code scanning and Manual Entry buttons */}
            <div className="flex flex-col gap-3 w-full">
              {!isScanning && !scanComplete && (
                <button
                  onClick={() => {
                    // Reset everything to initial state
                    setScanProgress(0);
                    setScanComplete(false);
                    setScanError(null);
                    
                    // Start scanning
                    setIsScanning(true);
                    
                    // Try ZXing first, fallback to jsQR if needed
                    startZxingDetection();
                  }}
                  className="mt-4 bg-primary text-white px-6 py-3 rounded-lg text-lg font-medium border-2 border-white shadow-lg animate-pulse"
                >
                  👉 Tap to Scan QR Code
                </button>
              )}
              
              {scanError && (
                <div className="bg-red-500/70 text-white px-4 py-2 rounded-lg text-center mt-2">
                  {scanError} 
                  <button 
                    className="underline ml-2"
                    onClick={() => {
                      setScanError(null);
                      setIsScanning(false);
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}
              
              {/* Manual UPI entry option */}
              <button
                onClick={() => setManualEntry(true)}
                className="text-white flex items-center justify-center gap-2 mt-2"
              >
                Enter UPI ID manually
              </button>
            </div>
          </div>
        </>
      ) : (
        // Manual UPI entry form
        <div className="flex-1 flex flex-col p-6">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-md">
              <div className="mb-6">
                <label className="block text-white text-sm font-medium mb-2">Enter UPI ID</label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualUpiId}
                    onChange={(e) => setManualUpiId(e.target.value)}
                    placeholder="username@bank"
                    className="bg-white/10 border border-white/40 text-white w-full p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {manualUpiId && (
                    <button
                      onClick={() => setManualUpiId('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <p className="text-white/60 text-xs mt-2">
                  Example: johndoe@okicici or 9876543210@paytm
                </p>
                
                {scanError && (
                  <div className="bg-red-500/70 text-white px-4 py-2 rounded-lg text-center mt-2">
                    {scanError}
                  </div>
                )}
              </div>
              
              <button
                onClick={handleManualEntry}
                className="w-full bg-primary text-white px-6 py-4 rounded-lg text-lg font-medium"
              >
                Verify UPI
              </button>
              
              <button
                onClick={() => {
                  setManualEntry(false);
                  setScanError(null);
                }}
                className="text-white flex items-center justify-center gap-2 mt-4"
              >
                <ArrowLeft size={16} />
                Back to QR Scanner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}