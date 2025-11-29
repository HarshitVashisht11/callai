'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Mic, MicOff, RefreshCw, Phone, PhoneOff } from 'lucide-react';
import { useRealtime } from '@/hooks/use-realtime';
import { useAudioPlayer } from '@/hooks/use-audio-player';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface LiveTestPanelProps {
  agentId: string;
  agentName: string;
}

export function LiveTestPanel({ agentId, agentName }: LiveTestPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [assistantTranscript, setAssistantTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const assistantTranscriptRef = useRef('');

  const { playAudioDelta, stopPlayback } = useAudioPlayer();

  // Keep ref in sync with state
  useEffect(() => {
    assistantTranscriptRef.current = assistantTranscript;
  }, [assistantTranscript]);

  const handleAudioDelta = useCallback((delta: string) => {
    playAudioDelta(delta);
  }, [playAudioDelta]);

  const handleTranscript = useCallback((transcript: string, isFinal: boolean) => {
    if (isFinal) {
      setMessages(prev => [...prev, {
        role: 'user',
        content: transcript,
        timestamp: new Date(),
      }]);
      setCurrentTranscript('');
    } else {
      setCurrentTranscript(prev => prev + transcript);
    }
  }, []);

  const handleMessage = useCallback((message: { type: string; delta?: unknown }) => {
    if (message.type === 'response.audio_transcript.delta') {
      setAssistantTranscript(prev => prev + (message.delta as string));
    }
    if (message.type === 'response.audio_transcript.done') {
      // Use the ref to get the current value
      const currentAssistantTranscript = assistantTranscriptRef.current;
      if (currentAssistantTranscript) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: currentAssistantTranscript,
          timestamp: new Date(),
        }]);
      }
      setAssistantTranscript('');
    }
  }, []);

  const handleError = useCallback((error: string) => {
    if (error && error !== '{}') {
      console.error('Realtime error:', error);
    }
  }, []);

  const {
    isConnected,
    isListening,
    connect,
    disconnect,
    startListening,
    stopListening,
  } = useRealtime({
    agentId,
    onAudioDelta: handleAudioDelta,
    onTranscript: handleTranscript,
    onMessage: handleMessage,
    onError: handleError,
  });

  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setDuration(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isConnected]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentTranscript, assistantTranscript]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNewSession = () => {
    setMessages([]);
    setCurrentTranscript('');
    setAssistantTranscript('');
    stopPlayback();
    if (isConnected) {
      disconnect();
    }
  };

  const handleStartCall = async () => {
    if (!isConnected) {
      connect();
      setTimeout(() => {
        startListening();
      }, 1000);
    } else {
      startListening();
    }
  };

  const handleEndCall = () => {
    stopListening();
    stopPlayback();
    disconnect();
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex h-full flex-col border-l bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold">Live Test</h2>
          <p className="text-sm text-muted-foreground">{agentName}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNewSession}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          New Session
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-lg px-3 py-2',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {currentTranscript && (
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-lg bg-muted px-3 py-2">
                <p className="text-sm text-muted-foreground italic">{currentTranscript}...</p>
              </div>
            </div>
          )}
          
          {assistantTranscript && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg bg-muted px-3 py-2">
                <p className="text-sm">{assistantTranscript}</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Controls */}
      <div className="border-t p-4">
        {/* Status & Timer */}
        <div className="mb-4 flex items-center justify-center gap-4">
          <span className="text-2xl font-mono">{formatDuration(duration)}</span>
        </div>

        {/* Audio Visualization Placeholder */}
        {isListening && (
          <div className="mb-4 flex items-center justify-center gap-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-muted-foreground rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 24 + 8}px`,
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))}
          </div>
        )}

        {/* Status Text */}
        <p className="mb-4 text-center text-sm text-muted-foreground">
          {isListening ? 'Listening...' : isConnected ? 'Connected' : 'Ready to start'}
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-4">
          {!isConnected ? (
            <Button
              size="lg"
              onClick={handleStartCall}
              className="gap-2"
            >
              <Phone className="h-5 w-5" />
              Start Call
            </Button>
          ) : (
            <>
              <Button
                size="icon"
                variant={isListening ? 'default' : 'outline'}
                onClick={toggleMic}
                className="h-12 w-12 rounded-full"
              >
                {isListening ? (
                  <Mic className="h-5 w-5" />
                ) : (
                  <MicOff className="h-5 w-5" />
                )}
              </Button>
              
              <Button
                size="icon"
                variant="destructive"
                onClick={handleEndCall}
                className="h-12 w-12 rounded-full"
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
