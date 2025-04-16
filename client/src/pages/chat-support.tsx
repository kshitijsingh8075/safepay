import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  ArrowLeft, 
  AlertTriangle, 
  ThumbsUp, 
  ThumbsDown 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { queryClient, apiRequest } from '@/lib/queryClient';

// Types
interface ChatMessage {
  id: number;
  userId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata: string | null;
}

interface MessageFeedback {
  messageId: number;
  rating?: number;
  feedback?: string;
}

export default function ChatSupport() {
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState('');
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [activeFeedback, setActiveFeedback] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Mock user ID (in a real app, this would come from auth state)
  const userId = 1;

  // Fetch chat history
  const { 
    data: messages = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/chat', userId, 'history'],
    queryFn: async () => {
      const res = await fetch(`/api/chat/${userId}/history`);
      if (!res.ok) throw new Error('Failed to fetch chat history');
      return res.json();
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest('POST', `/api/chat/${userId}/message`, { content });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat', userId, 'history'] });
      setQuickReplies(data.quickReplies || []);
      setMessage('');
    },
    onError: (error) => {
      console.error('Error sending message:', error);
    },
  });

  // Send feedback mutation
  const sendFeedbackMutation = useMutation({
    mutationFn: async (feedback: MessageFeedback) => {
      const res = await apiRequest('POST', `/api/chat/${userId}/feedback`, feedback);
      return res.json();
    },
    onSuccess: () => {
      setActiveFeedback(null);
      setFeedbackText('');
    },
    onError: (error) => {
      console.error('Error sending feedback:', error);
    },
  });

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeFeedback]);

  // Handle message submission
  const handleSendMessage = (content = message) => {
    if (!content.trim()) return;
    sendMessageMutation.mutate(content);
  };

  // Handle feedback submission
  const handleSendFeedback = (messageId: number, rating: number) => {
    if (activeFeedback === messageId && !feedbackText) {
      // Just send the rating
      sendFeedbackMutation.mutate({ messageId, rating });
    } else if (activeFeedback === messageId) {
      // Send both rating and feedback text
      sendFeedbackMutation.mutate({ messageId, rating, feedback: feedbackText });
    } else {
      // Set active feedback mode
      setActiveFeedback(messageId);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/home')}
            className="mr-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">Chat Support</h1>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary">
          AI-Powered
        </Badge>
      </div>

      {/* Messages area */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {isLoading ? (
          // Loading skeletons
          <div className="space-y-4">
            <div className="flex justify-end">
              <Skeleton className="w-3/4 h-20 rounded-lg" />
            </div>
            <div className="flex justify-start">
              <Skeleton className="w-3/4 h-32 rounded-lg" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="w-3/4 h-16 rounded-lg" />
            </div>
          </div>
        ) : error ? (
          // Error state
          <Card className="p-4 bg-red-50 border-red-200 text-red-800 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            <p>Could not load chat history. Please try again.</p>
          </Card>
        ) : (
          // Message bubbles
          <div className="space-y-4">
            {messages.map((msg: ChatMessage) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : msg.role === 'system'
                        ? 'bg-gray-100 text-gray-800 rounded-tl-none'
                        : 'bg-[#F0F4FF] text-gray-800 rounded-tl-none border border-[#E2E8F0]'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <div className="flex justify-end items-center mt-1 text-xs text-gray-500">
                    <span className={msg.role === 'user' ? 'text-gray-300' : ''}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Feedback options (only for assistant messages) */}
                  {msg.role === 'assistant' && (
                    <div className="mt-2">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 px-2 text-gray-600"
                          onClick={() => handleSendFeedback(msg.id, 1)}
                        >
                          <ThumbsUp className={`w-4 h-4 ${activeFeedback === msg.id ? 'text-green-600' : ''}`} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 px-2 text-gray-600"
                          onClick={() => handleSendFeedback(msg.id, -1)}
                        >
                          <ThumbsDown className={`w-4 h-4 ${activeFeedback === msg.id && feedbackText ? 'text-red-600' : ''}`} />
                        </Button>
                      </div>
                      
                      {/* Feedback text area */}
                      {activeFeedback === msg.id && (
                        <div className="mt-2">
                          <Textarea
                            placeholder="Tell us why this response was not helpful..."
                            className="text-sm resize-none"
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                          />
                          <div className="flex justify-end mt-2">
                            <Button 
                              size="sm" 
                              variant="default" 
                              onClick={() => handleSendFeedback(msg.id, -1)}
                              className="h-7 text-xs"
                            >
                              Send Feedback
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator for sending message */}
            {sendMessageMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-[#F0F4FF] text-gray-800 rounded-2xl rounded-tl-none p-3 max-w-[80%]">
                  <div className="flex space-x-2 items-center">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Quick replies */}
      {quickReplies.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 overflow-x-auto whitespace-nowrap">
          <div className="flex space-x-2">
            {quickReplies.map((reply, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleSendMessage(reply)}
              >
                {reply}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            className="flex-1"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() || sendMessageMutation.isPending}
            onClick={() => handleSendMessage()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          UPI SafeGuard uses AI to provide fraud prevention assistance
        </p>
      </div>
    </div>
  );
}