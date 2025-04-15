import React from 'react';
import MainLayout from '@/layouts/main-layout';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

// Sample legal resources
const legalResources = [
  {
    id: 1,
    title: 'File a Cyber Crime Complaint',
    description: 'Report financial frauds and cyber crimes to the National Cyber Crime Reporting Portal',
    link: 'https://cybercrime.gov.in/'
  },
  {
    id: 2,
    title: 'Contact RBI Ombudsman',
    description: 'Escalate payment related complaints through the RBI Ombudsman Scheme',
    link: 'https://cms.rbi.org.in/'
  },
  {
    id: 3,
    title: 'NPCI Dispute Management System',
    description: 'Raise disputes for UPI transactions through your bank or payment app',
    link: 'https://www.npci.org.in/'
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

  return (
    <MainLayout>
      <div className="px-6 py-6">
        <h1 className="text-2xl font-bold mb-6">Legal Help & Resources</h1>
        
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
              <Button variant="outline" className="w-full border-primary text-primary">
                Visit Website
              </Button>
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
        
        <Button 
          onClick={() => setLocation('/report-scam')}
          className="w-full bg-primary text-white"
        >
          Report a Scam
        </Button>
      </div>
    </MainLayout>
  );
}