import { Express, Request, Response } from 'express';
import openai from '../services/openai';
import nodemailer from 'nodemailer';

interface PoliceComplaintData {
  userFullName: string;
  userEmail: string;
  userPhone: string;
  userAddress: string;
  scammerUpiId: string;
  scammerName?: string;
  amount: string;
  dateOfScam: string;
  description: string;
}

/**
 * Generate a police complaint email using OpenAI's API
 */
async function generateComplaintEmail(data: PoliceComplaintData): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using the newest OpenAI model
      messages: [
        {
          role: "system",
          content: "You are a professional legal assistant who drafts formal police complaints for victims of UPI scams. Generate a formal complaint letter addressed to the Delhi Police. Be detailed, precise, and formal in your language. Include all relevant details about the fraud, but do not invent facts not provided in the input."
        },
        {
          role: "user",
          content: `Write a formal police complaint email about a UPI scam with the following details:
          
          Victim's Name: ${data.userFullName}
          Victim's Email: ${data.userEmail}
          Victim's Phone: ${data.userPhone}
          Victim's Address: ${data.userAddress}
          Scammer's UPI ID: ${data.scammerUpiId}
          Scammer's Name (if known): ${data.scammerName || "Unknown"}
          Amount Defrauded: ₹${data.amount}
          Date of Scam: ${data.dateOfScam}
          Description: ${data.description}
          
          Format it as a formal email addressed to the Delhi Police Cyber Cell.
          Start with the sender's (victim's) details at the top, followed by the date, subject line, and then the body of the complaint.
          The email should be comprehensive, detailing the fraud incident, requesting investigation, and seeking appropriate action against the fraudster.
          Be very precise and formal in the language.`
        }
      ]
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error generating complaint email:", error);
    return `Subject: Complaint Regarding UPI Fraud

From:
${data.userFullName}
${data.userEmail}
${data.userPhone}
${data.userAddress}

To:
The Special Commissioner of Police
I.F.S.O. Special Cell
Delhi Police Headquarters

Date: ${new Date().toDateString()}

Subject: Complaint Regarding UPI Fraud

Respected Sir/Madam,

I am writing to report a fraudulent transaction that I fell victim to recently. Below are the details of the incident:

1. Date of Incident: ${data.dateOfScam}
2. Fraudster's UPI ID: ${data.scammerUpiId}
3. Fraudster's Name (if known): ${data.scammerName || "Unknown"}
4. Amount Defrauded: ₹${data.amount}
5. Description of the incident: ${data.description}

I request you to kindly investigate this matter and help me recover my lost amount. I am ready to provide any additional information required for the investigation.

Thank you for your attention to this matter.

Sincerely,
${data.userFullName}
${data.userPhone}
${data.userEmail}`;
  }
}

async function sendComplaintEmail(recipientEmail: string, subject: string, content: string, senderDetails: PoliceComplaintData): Promise<boolean> {
  try {
    // This is a demo transporter since we don't have real SMTP credentials
    // In production, you would use real SMTP credentials
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'noreply.safepay@gmail.com', // This is a placeholder
        pass: 'app_password', // This is a placeholder
      }
    });

    const mailOptions = {
      from: `"${senderDetails.userFullName}" <${senderDetails.userEmail}>`,
      to: recipientEmail,
      cc: senderDetails.userEmail, // Also send a copy to the user
      subject,
      text: content,
      replyTo: senderDetails.userEmail
    };

    // In demo mode, we'll just log the email content instead of sending it
    console.log("Email would be sent with the following content:");
    console.log("From:", mailOptions.from);
    console.log("To:", mailOptions.to);
    console.log("CC:", mailOptions.cc);
    console.log("Subject:", mailOptions.subject);
    console.log("Content:", mailOptions.text);

    // Uncomment this to actually send the email when SMTP is configured
    // await transporter.sendMail(mailOptions);
    
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

export function registerPoliceComplaintRoutes(app: Express): void {
  // Generate a complaint email content
  app.post('/api/generate-complaint-email', async (req: Request, res: Response) => {
    try {
      const complaintData = req.body as PoliceComplaintData;
      
      // Validate required fields
      const requiredFields = ['userFullName', 'userEmail', 'userPhone', 'userAddress', 'scammerUpiId', 'amount', 'dateOfScam', 'description'];
      const missingFields = requiredFields.filter(field => !complaintData[field as keyof PoliceComplaintData]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }
      
      const emailContent = await generateComplaintEmail(complaintData);
      
      res.status(200).json({
        success: true,
        emailContent
      });
    } catch (error) {
      console.error("Error generating complaint:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate complaint email"
      });
    }
  });
  
  // Send the complaint email
  app.post('/api/send-complaint-email', async (req: Request, res: Response) => {
    try {
      const { complaintData, emailContent } = req.body;
      
      // Validate required fields
      if (!complaintData || !emailContent) {
        return res.status(400).json({
          success: false,
          message: "Missing required data"
        });
      }
      
      // Send email to Delhi Police
      const subject = `Complaint Regarding UPI Fraud - ${complaintData.userFullName}`;
      const sent = await sendComplaintEmail(
        "jointcp.ifsosplcell@delhipolice.gov.in", 
        subject,
        emailContent,
        complaintData
      );
      
      if (sent) {
        res.status(200).json({
          success: true,
          message: "Complaint email sent successfully"
        });
      } else {
        throw new Error("Failed to send email");
      }
    } catch (error) {
      console.error("Error sending complaint email:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send complaint email"
      });
    }
  });
}