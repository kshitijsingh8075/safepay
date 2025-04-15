import React from 'react';
import { useLocation } from 'wouter';
import { QRScanner } from '@/components/scanner/qr-scanner';

export default function Scan() {
  const [, setLocation] = useLocation();

  const handleScan = (data: string) => {
    // In a real app, we would validate the scanned data
    // For now, just navigate to the payment screen
    setLocation('/payment');
  };

  const handleClose = () => {
    setLocation('/home');
  };

  return (
    <QRScanner 
      onScan={handleScan}
      onClose={handleClose}
    />
  );
}
