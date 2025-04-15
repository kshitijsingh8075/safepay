import React from 'react';
import MainLayout from '@/layouts/main-layout';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { ScamType } from '@/lib/scam-detection';

// Sample scam news data
const scamNews = [
  {
    id: 1,
    title: 'New UPI QR Code Scam Alert',
    description: 'Scammers are creating fake QR codes that redirect payments to their accounts. Always verify the merchant name before scanning.',
    date: new Date('2023-05-10'),
    scamType: 'Phishing' as ScamType,
    readTime: '3 min read'
  },
  {
    id: 2,
    title: 'Voice Call Scams on the Rise',
    description: 'Fraudsters pretending to be bank officials are tricking users into sharing OTPs. Remember that legitimate banks never ask for OTPs over calls.',
    date: new Date('2023-05-05'),
    scamType: 'Impersonation' as ScamType,
    readTime: '4 min read'
  },
  {
    id: 3,
    title: 'WhatsApp Payment Fraud Increasing',
    description: 'Be cautious of WhatsApp messages asking for money transfers - verify the sender\'s identity through alternative means before sending payments.',
    date: new Date('2023-04-28'),
    scamType: 'Fraud' as ScamType,
    readTime: '2 min read'
  }
];

export default function ScamNews() {
  return (
    <MainLayout>
      <div className="px-6 py-6">
        <h1 className="text-2xl font-bold mb-6">Scam News & Alerts</h1>
        
        <div className="flex flex-col gap-4">
          {scamNews.map(news => (
            <Card key={news.id} className="p-4 rounded-xl">
              <div className="flex flex-col">
                <div className="flex justify-between mb-2">
                  <span className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full">
                    {news.scamType}
                  </span>
                  <span className="text-xs text-gray-500">{news.readTime}</span>
                </div>
                
                <h3 className="font-semibold text-lg mb-2">{news.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{news.description}</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{formatDate(news.date)}</span>
                  <button className="text-primary text-sm font-medium">Read More</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}