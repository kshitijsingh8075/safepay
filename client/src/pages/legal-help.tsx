import React, { useState, useRef, useEffect } from 'react';
import MainLayout from '@/layouts/main-layout';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  AlertCircle, 
  ArrowLeft, 
  Check, 
  Mic, 
  MicOff, 
  Send, 
  Calendar, 
  User, 
  Loader2,
  Mail,
  Phone,
  Home,
  Edit
} from 'lucide-react';

// Legal resources with exact URLs
const legalResources = [
  {
    id: 1,
    title: 'File a Cyber Crime Complaint',
    description: 'Report financial frauds and cyber crimes to the National Cyber Crime Reporting Portal',
    link: 'https://cybercrime.gov.in'
  },
  {
    id: 2,
    title: 'Contact RBI Ombudsman',
    description: 'Escalate payment related complaints through the RBI Complaint Management System',
    link: 'https://cms.rbi.org.in/rbi/vividflow/run/rbi?language=Auto'
  },
  {
    id: 3,
    title: 'NPCI Dispute Management System',
    description: 'Raise disputes for UPI transactions through NPCI\'s Dispute Management System',
    link: 'https://www.npci.org.in/what-we-do/upi/dispute-redressal-mechanism'
  }
];

// Sample legal FAQ
const legalFaqs = [
  {
    id: 1,
    question: 'What should I do immediately after being scammed?',
    answer: 'First, contact your bank to report the unauthorized transaction and request blocking further transactions. Then file a complaint with the National Cyber Crime Reporting Portal (cybercrime.gov.in) or call the cyber crime helpline 1930 to report the fraud.'
  },
  {
    id: 2,
    question: 'Is there a time limit to report UPI fraud?',
    answer: 'Yes, report the fraud to your bank immediately. As per RBI guidelines, your liability may increase if you delay reporting beyond 3 working days. File a police complaint within 24 hours for better chances of fund recovery.'
  },
  {
    id: 3,
    question: 'Can I get my money back after a UPI scam?',
    answer: 'Recovery depends on how quickly you report and if the funds are still in the fraudster\'s account. Contact your bank immediately and file a complaint with the cyber crime portal. Banks may be able to freeze the beneficiary account if reported in time.'
  },
  {
    id: 4,
    question: 'How do I protect myself from UPI scams?',
    answer: 'Never share your UPI PIN, OTP, or banking credentials. Verify the receiver\'s details before making payments. Don\'t scan QR codes from unknown sources. Don\'t accept collect requests from unknown users. Regularly check your transaction history.'
  }
];

export default function LegalHelp() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("resources");
  
  // Police complaint form state - User info
  const [userFullName, setUserFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userAddress, setUserAddress] = useState('');
  
  // Police complaint form state - Scammer info
  const [scammerUpiId, setScammerUpiId] = useState('');
  const [scammerName, setScammerName] = useState('');
  const [amount, setAmount] = useState('');
  const [dateOfScam, setDateOfScam] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  
  // Form navigation and UI state
  const [formStep, setFormStep] = useState(1); // 1: User Info, 2: Scammer Info, 3: Description, 4: Preview Email
  const [showComplaintPreview, setShowComplaintPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  
  // Voice input state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  
  // Handle voice recording for description
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Create form data to send to server
        const formData = new FormData();
        formData.append('audio', audioBlob);
        
        try {
          // Use browser's built-in speech recognition if available
          if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-IN';
            
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            recognition.onresult = (event) => {
              const transcript = event.results[0][0].transcript;
              setDescription(prev => prev + ' ' + transcript);
            };
            
            recognition.onerror = (event) => {
              console.error('Speech recognition error', event.error);
              toast({
                title: "Speech recognition failed",
                description: "Please try again or type your description manually",
                variant: "destructive",
              });
            };
            
            audio.onended = () => {
              recognition.stop();
            };
            
            recognition.start();
            audio.play();
          } else {
            // Fall back to server-side speech-to-text using OpenAI
            toast({
              title: "Processing voice input",
              description: "Converting your voice to text...",
            });
            
            const response = await fetch('/api/voice-to-text', {
              method: 'POST',
              body: formData
            });
            
            if (!response.ok) {
              throw new Error('Failed to convert speech to text');
            }
            
            const data = await response.json();
            if (data.text) {
              setDescription(prev => prev + ' ' + data.text);
            }
          }
        } catch (error) {
          console.error('Error processing voice input:', error);
          toast({
            title: "Voice processing failed",
            description: "Please try again or type your description manually",
            variant: "destructive",
          });
        }
        
        // Clean up the media stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Set up a timer to track recording duration
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone access denied",
        description: "Please enable microphone access to use voice input",
        variant: "destructive",
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setRecordingDuration(0);
    }
  };
  
  // Clean up function for voice recording
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);
  
  // Format recording duration as mm:ss
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Generate email using OpenAI
  const generateComplaintEmail = async () => {
    // Validate required fields
    const requiredFields = [
      { field: userFullName, name: 'Full Name' },
      { field: userEmail, name: 'Email' },
      { field: userPhone, name: 'Phone Number' },
      { field: userAddress, name: 'Address' },
      { field: scammerUpiId, name: 'Scammer UPI ID' },
      { field: amount, name: 'Fraud Amount' },
      { field: description, name: 'Description' }
    ];
    
    const missingFields = requiredFields.filter(({field}) => !field.trim());
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing information",
        description: `Please provide: ${missingFields.map(f => f.name).join(', ')}`,
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingEmail(true);
    
    try {
      const response = await fetch('/api/generate-complaint-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userFullName,
          userEmail,
          userPhone,
          userAddress,
          scammerUpiId,
          scammerName,
          amount,
          dateOfScam,
          description
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate complaint email');
      }
      
      const data = await response.json();
      
      if (data.success && data.emailContent) {
        setGeneratedEmail(data.emailContent);
        setShowComplaintPreview(true);
      } else {
        throw new Error('Failed to generate email content');
      }
    } catch (error) {
      console.error('Error generating email:', error);
      toast({
        title: "Email Generation Failed",
        description: "There was an error generating your complaint email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingEmail(false);
    }
  };
  
  // Handle form submission (sending email)
  const handleSubmitComplaint = async () => {
    setIsSubmitting(true);
    
    try {
      const complaintData = {
        userFullName,
        userEmail,
        userPhone,
        userAddress,
        scammerUpiId,
        scammerName,
        amount,
        dateOfScam,
        description
      };
      
      const response = await fetch('/api/send-complaint-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          complaintData,
          emailContent: generatedEmail
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send complaint email');
      }
      
      const data = await response.json();
      
      setSubmissionSuccess(true);
      toast({
        title: "Complaint Submitted",
        description: "Your complaint has been emailed to the Delhi Police. A copy has also been sent to your email address.",
      });
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error sending your complaint. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset form fields
  const resetForm = () => {
    // User info
    setUserFullName('');
    setUserEmail('');
    setUserPhone('');
    setUserAddress('');
    
    // Scammer info
    setScammerUpiId('');
    setScammerName('');
    setAmount('');
    setDateOfScam(new Date().toISOString().split('T')[0]);
    setDescription('');
    
    // UI state
    setFormStep(1);
    setShowComplaintPreview(false);
    setSubmissionSuccess(false);
    setGeneratedEmail('');
    setIsEditingEmail(false);
  };
  
  const renderResourcesTab = () => (
    <>
      <h2 className="text-lg font-semibold mb-4">Need Immediate Help?</h2>
      <Card className="p-4 rounded-xl mb-6 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium mb-1">Report to Cyber Crime Helpline</h3>
            <p className="text-sm text-gray-600 mb-2">For immediate assistance with financial fraud</p>
          </div>
          <a href="tel:1930" className="px-4 py-2 bg-primary text-white rounded-lg font-medium text-sm">
            Call 1930
          </a>
        </div>
      </Card>
      
      <h2 className="text-lg font-semibold mb-4">Legal Resources</h2>
      <div className="flex flex-col gap-4 mb-6">
        {legalResources.map(resource => (
          <Card key={resource.id} className="p-4 rounded-xl">
            <h3 className="font-medium mb-1">{resource.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
            <a href={resource.link} target="_blank" rel="noopener noreferrer" className="w-full">
              <Button variant="outline" className="w-full border-primary text-primary">
                Visit Website
              </Button>
            </a>
          </Card>
        ))}
      </div>
      
      <h2 className="text-lg font-semibold mb-4">Legal FAQs</h2>
      <Accordion type="single" collapsible className="mb-6">
        {legalFaqs.map(faq => (
          <AccordionItem key={faq.id} value={`item-${faq.id}`}>
            <AccordionTrigger className="text-left font-medium">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-gray-600">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      <div className="flex flex-col gap-3">
        <Button 
          onClick={() => setActiveTab("file-complaint")}
          className="w-full bg-primary text-white"
        >
          File Police Complaint
        </Button>
        
        <Button 
          onClick={() => setLocation('/report-scam')}
          variant="outline"
          className="w-full border-primary text-primary"
        >
          Report a Scam
        </Button>
      </div>
    </>
  );
  
  const renderComplaintForm = () => {
    if (submissionSuccess) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <Check className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Complaint Submitted!</h2>
          <p className="text-center text-gray-600 mb-6">
            Your complaint has been successfully submitted to the police. 
            They will contact you if they need more information.
          </p>
          <Button onClick={resetForm} className="w-full bg-primary text-white mb-3">
            File Another Complaint
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              resetForm();
              setActiveTab("resources");
            }}
            className="w-full"
          >
            Back to Resources
          </Button>
        </div>
      );
    }
    
    return showComplaintPreview ? (
      <div>
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 mr-2" 
            onClick={() => setShowComplaintPreview(false)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">Complaint Preview</h2>
        </div>
        
        <Card className="mb-6">
          <pre className="whitespace-pre-wrap text-sm p-4 bg-gray-50 rounded-lg">
            {complaintLetter}
          </pre>
        </Card>
        
        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleSubmitComplaint}
            disabled={isSubmitting}
            className="w-full bg-primary text-white"
          >
            {isSubmitting ? "Submitting..." : "Submit Complaint"}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setShowComplaintPreview(false)}
            className="w-full"
          >
            Edit Details
          </Button>
        </div>
      </div>
    ) : (
      <div>
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 mr-2" 
            onClick={() => setActiveTab("resources")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">File Police Complaint</h2>
        </div>
        
        <Card className="p-5 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700">
              This will generate an official complaint to be sent directly to the cyber crime police department.
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="upi-id" className="text-sm text-gray-500">UPI ID</Label>
              <Input
                id="upi-id"
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="Enter scammer's UPI ID"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="name" className="text-sm text-gray-500">NAME</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter recipient's name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="amount" className="text-sm text-gray-500">AMOUNT</Label>
              <div className="flex items-center mt-1">
                <span className="text-gray-900 mr-2 ml-3">₹</span>
                <Input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9,.]/g, ''))}
                  placeholder="Enter amount lost"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-5 mb-6">
          <h3 className="font-medium mb-3">Complaint Letter</h3>
          <p className="text-sm text-gray-600 mb-2">
            A complaint letter will be generated with the details you provided.
            You'll be able to review it before submission.
          </p>
        </Card>
        
        <Button 
          onClick={() => setShowComplaintPreview(true)}
          disabled={!upiId || !name}
          className="w-full bg-primary text-white"
        >
          Preview Complaint
        </Button>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Legal Help & Resources</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="resources" className="flex-1">Resources</TabsTrigger>
            <TabsTrigger value="file-complaint" className="flex-1">File Complaint</TabsTrigger>
          </TabsList>
          
          <TabsContent value="resources">
            {renderResourcesTab()}
          </TabsContent>
          
          <TabsContent value="file-complaint">
            {renderComplaintForm()}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}