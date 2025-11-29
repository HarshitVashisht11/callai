'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Phone, PhoneOff, Loader2, AlertCircle } from 'lucide-react';
import { validateCallToken } from '@/lib/api';
import { useRealtime } from '@/hooks/use-realtime';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import { toast } from 'sonner';

interface CallInfo {
  valid: boolean;
  contact_name: string;
  contact_email: string;
  agent_id: string;
  campaign_name: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function PublicCallPage({ 
  params 
}: { 
  params: Promise<{ campaignId: string; token: string }> 
}) {
  const { campaignId, token } = use(params);
  const [callInfo, setCallInfo] = useState<CallInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [assistantTranscript, setAssistantTranscript] = useState('');

  const { playAudioDelta, stopPlayback } = useAudioPlayer();

  const handleAudioDelta = useCallback((delta: string) => {
    playAudioDelta(delta);
  }, [playAudioDelta]);

  const handleTranscript = useCallback((transcript: string, isFinal: boolean) => {
    if (isFinal) {
      setMessages(prev => [...prev, { role: 'user', content: transcript }]);
    }
  }, []);

  const handleMessage = useCallback((message: { type: string; delta?: unknown }) => {
    if (message.type === 'response.audio_transcript.delta') {
      setAssistantTranscript(prev => prev + (message.delta as string));
    }
    if (message.type === 'response.audio_transcript.done') {
      if (assistantTranscript) {
        setMessages(prev => [...prev, { role: 'assistant', content: assistantTranscript }]);
      }
      setAssistantTranscript('');
    }
  }, [assistantTranscript]);

  const handleError = useCallback((err: string) => {
    if (err && err !== '{}') {
      console.error('Call error:', err);
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
    agentId: callInfo?.agent_id || 'default-agent',
    onAudioDelta: handleAudioDelta,
    onTranscript: handleTranscript,
    onMessage: handleMessage,
    onError: handleError,
  });

  useEffect(() => {
    validateToken();
  }, [campaignId, token]);

  const validateToken = async () => {
    try {
      const info = await validateCallToken(campaignId, token);
      setCallInfo(info);
    } catch (err) {
      setError('This link is invalid or has expired. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const startCall = async () => {
    if (!callInfo) return;
    connect();
    // Start listening after connection is established
    setTimeout(() => {
      startListening();
    }, 1000);
    toast.success('Connected! The AI agent will speak to you shortly.');
  };

  const endCall = () => {
    stopListening();
    stopPlayback();
    disconnect();
    setMessages([]);
    setAssistantTranscript('');
  };

  const toggleMute = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !callInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Link</h2>
            <p className="text-muted-foreground">
              {error || 'This link is invalid or has expired.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary mx-auto mb-4">
            <Phone className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">AI Sales Call</CardTitle>
          <CardDescription>
            Hi {callInfo.contact_name}! Click below to start your personalized AI call.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Our AI sales representative is ready to tell you about our amazing product.
                The call typically takes 3-5 minutes.
              </p>
              <Button size="lg" className="w-full" onClick={startCall}>
                <Phone className="mr-2 h-5 w-5" />
                Start Call
              </Button>
              <p className="text-xs text-muted-foreground">
                By starting this call, you agree to allow microphone access.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center gap-4">
                <Button
                  variant={!isListening ? "destructive" : "outline"}
                  size="lg"
                  onClick={toggleMute}
                  className="rounded-full h-14 w-14"
                >
                  {!isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={endCall}
                  className="rounded-full h-14 w-14"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                  <span className="text-sm font-medium">
                    {isListening ? 'Call in progress - Listening...' : 'Call in progress - Muted'}
                  </span>
                </div>
              </div>

              {/* Live transcript */}
              {(messages.length > 0 || assistantTranscript) && (
                <Card className="mt-4">
                  <CardContent className="p-4 max-h-48 overflow-y-auto space-y-2">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`text-sm ${msg.role === 'assistant' ? '' : 'text-muted-foreground'}`}
                      >
                        <span className="font-medium">
                          {msg.role === 'assistant' ? 'Sarah: ' : 'You: '}
                        </span>
                        {msg.content}
                      </div>
                    ))}
                    {assistantTranscript && (
                      <div className="text-sm">
                        <span className="font-medium">Sarah: </span>
                        {assistantTranscript}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
