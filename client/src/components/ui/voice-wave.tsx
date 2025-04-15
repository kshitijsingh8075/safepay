import React from 'react';
import { cn } from '@/lib/utils';

interface VoiceWaveProps {
  isRecording: boolean;
  className?: string;
}

export function VoiceWave({ isRecording, className }: VoiceWaveProps) {
  // Number of bars in the wave
  const bars = 9;
  
  // Heights for bars (from center outwards)
  const heights = [
    'h-4', 'h-8', 'h-16', 'h-24', 'h-32', 'h-24', 'h-16', 'h-8', 'h-4'
  ];

  return (
    <div className={cn("flex items-center justify-center gap-[3px] h-16", className, !isRecording && "hidden")}>
      {Array.from({ length: bars }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "voice-bar bg-primary rounded-sm",
            heights[index],
            isRecording && "animate-pulse"
          )}
          style={{ 
            width: '6px',
            animationDelay: `${index * 0.1}s`,
            animationDuration: `${0.8 + Math.random() * 0.5}s`
          }}
        ></div>
      ))}
    </div>
  );
}
