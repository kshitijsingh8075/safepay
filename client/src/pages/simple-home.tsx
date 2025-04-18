import React from 'react';

const SimpleHome = () => {
  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif' 
    }}>
      <h1 style={{ 
        color: '#5164BF', 
        textAlign: 'center', 
        fontSize: '24px', 
        margin: '20px 0' 
      }}>
        UPI Payment & Scam Detection
      </h1>
      
      <div style={{ 
        background: 'white', 
        borderRadius: '10px', 
        padding: '20px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
        marginBottom: '20px' 
      }}>
        <h2 style={{ textAlign: 'center', fontSize: '18px', marginBottom: '15px' }}>
          Main Features
        </h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ 
            padding: '10px', 
            background: '#f0f4ff', 
            borderRadius: '5px', 
            marginBottom: '10px', 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <span style={{ 
              width: '20px', 
              height: '20px', 
              background: '#5164BF', 
              borderRadius: '50%', 
              color: 'white', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginRight: '10px',
              fontSize: '12px'
            }}>✓</span>
            UPI Payment Verification
          </li>
          <li style={{ 
            padding: '10px', 
            background: '#f0f4ff', 
            borderRadius: '5px', 
            marginBottom: '10px', 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <span style={{ 
              width: '20px', 
              height: '20px', 
              background: '#5164BF', 
              borderRadius: '50%', 
              color: 'white', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginRight: '10px',
              fontSize: '12px'
            }}>✓</span>
            QR Code Scan Security
          </li>
          <li style={{ 
            padding: '10px', 
            background: '#f0f4ff', 
            borderRadius: '5px', 
            marginBottom: '10px', 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <span style={{ 
              width: '20px', 
              height: '20px', 
              background: '#5164BF', 
              borderRadius: '50%', 
              color: 'white', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginRight: '10px',
              fontSize: '12px'
            }}>✓</span>
            Voice Fraud Detection
          </li>
          <li style={{ 
            padding: '10px', 
            background: '#f0f4ff', 
            borderRadius: '5px', 
            marginBottom: '10px', 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <span style={{ 
              width: '20px', 
              height: '20px', 
              background: '#5164BF', 
              borderRadius: '50%', 
              color: 'white', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginRight: '10px',
              fontSize: '12px'
            }}>✓</span>
            Message Analysis
          </li>
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <a href="/upi-check" style={{ 
          background: '#5164BF', 
          color: 'white', 
          padding: '15px', 
          borderRadius: '10px', 
          textAlign: 'center', 
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>
          UPI Check
        </a>
        <a href="/scan" style={{ 
          background: '#5164BF', 
          color: 'white', 
          padding: '15px', 
          borderRadius: '10px', 
          textAlign: 'center', 
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>
          Scan QR
        </a>
        <a href="/voice-check" style={{ 
          background: '#5164BF', 
          color: 'white', 
          padding: '15px', 
          borderRadius: '10px', 
          textAlign: 'center', 
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>
          Voice Check
        </a>
        <a href="/message-check" style={{ 
          background: '#5164BF', 
          color: 'white', 
          padding: '15px', 
          borderRadius: '10px', 
          textAlign: 'center', 
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>
          Message Check
        </a>
      </div>
    </div>
  );
};

export default SimpleHome;