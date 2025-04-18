import React from 'react';

const EmergencyHome = () => {
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      margin: '0 auto',
      maxWidth: '800px'
    }}>
      <h1 style={{
        color: '#5164BF',
        textAlign: 'center'
      }}>
        UPI Payment & Scam Detection
      </h1>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{textAlign: 'center'}}>Key Features</h2>
        <ul style={{listStyleType: 'none', padding: 0}}>
          <li style={{
            margin: '8px 0',
            padding: '10px',
            backgroundColor: '#f0f4ff',
            borderRadius: '4px'
          }}>✅ UPI Scam Detection</li>
          <li style={{
            margin: '8px 0',
            padding: '10px',
            backgroundColor: '#f0f4ff',
            borderRadius: '4px'
          }}>✅ QR Code Security Scanner</li>
          <li style={{
            margin: '8px 0',
            padding: '10px',
            backgroundColor: '#f0f4ff',
            borderRadius: '4px'
          }}>✅ Voice Analysis for Scam Calls</li>
          <li style={{
            margin: '8px 0',
            padding: '10px',
            backgroundColor: '#f0f4ff',
            borderRadius: '4px'
          }}>✅ WhatsApp & Message Security</li>
        </ul>
      </div>
      
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
        <button style={{
          backgroundColor: '#5164BF',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '15px',
          fontSize: '16px',
          cursor: 'pointer'
        }}>
          UPI Check
        </button>
        <button style={{
          backgroundColor: '#5164BF',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '15px',
          fontSize: '16px',
          cursor: 'pointer'
        }}>
          Scan QR
        </button>
        <button style={{
          backgroundColor: '#5164BF',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '15px',
          fontSize: '16px',
          cursor: 'pointer'
        }}>
          Voice Check
        </button>
        <button style={{
          backgroundColor: '#5164BF',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '15px',
          fontSize: '16px',
          cursor: 'pointer'
        }}>
          Message Check
        </button>
      </div>
    </div>
  );
};

export default EmergencyHome;