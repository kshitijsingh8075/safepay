# UPI Secure - AI-Powered Payment Security App

A cutting-edge mobile-first React application revolutionizing UPI payment security through intelligent fraud prevention and user-centric design.

![UPI Secure Screenshot](attached_assets/image_1744853525614.png)

## 🚀 Features

- **Advanced QR Code Scanner**: Scan and verify UPI payment QR codes with real-time security analysis
- **AI-Powered Fraud Detection**: Integrate with OpenAI to intelligently detect and prevent potential scams
- **Real-time Risk Assessment**: Color-coded security indicators (green, yellow, red) with detailed risk scores
- **Comprehensive Transaction Flow**: Step-by-step verification with UPI PIN authentication
- **Multi-App Payment Support**: Choose between popular UPI apps (GPay, PhonePe, Paytm)
- **Voice & Message Analysis**: Detect scams in voice commands and message screenshots
- **Scam Reporting System**: Report and track fraudulent UPI IDs
- **Geospatial Fraud Mapping**: Visualize fraud hotspots with heatmap overlays

## 🛠️ Technology Stack

### Frontend
- React.js with TypeScript
- Tailwind CSS + Shadcn UI Components
- Wouter for routing
- React Hook Form with Zod validation
- TanStack Query for data fetching

### Backend
- Node.js & Express
- PostgreSQL database with Drizzle ORM
- OpenAI API integration
- Session-based authentication

### Tools & Libraries
- QR code scanning (jsqr)
- Voice recognition and analysis
- Image processing for screenshot analysis

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key

## 🔧 Installation & Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/upi-secure.git
   cd upi-secure
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/upi_secure
   OPENAI_API_KEY=your_openai_api_key
   SESSION_SECRET=your_session_secret
   ```

4. Initialize the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## 🔒 Security Features

- **UPI ID Analysis**: Pattern-based detection of suspicious UPI IDs
- **Transaction Verification**: Multi-factor verification including merchant validation
- **Risk Scoring**: AI-powered risk assessment with confidence scores
- **User Activity Monitoring**: Detection of unusual transaction patterns
- **Scam Report Aggregation**: Community-driven fraud reporting system

## 📱 Usage

1. **Scan QR Code**: Use the scanner to capture UPI payment QR codes
2. **Review Security Check**: View the safety assessment and risk score
3. **Proceed to Payment**: Enter amount and select payment app
4. **Enter UPI PIN**: Authenticate with your 6-digit UPI PIN (default: 979480)
5. **Complete Transaction**: Confirm payment and receive confirmation

## 🧪 Testing

Run tests with:
```bash
npm test
```

## 📈 Future Enhancements

- WhatsApp integration for direct scanning
- Social sharing of scam alerts
- Machine learning model for offline detection
- Multi-language support
- Enhanced biometric authentication

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- Your Name (@yourusername)

## 🙏 Acknowledgements

- OpenAI for API support
- Replit for development environment
- Community contributors and testers