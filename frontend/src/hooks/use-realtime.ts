'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { WS_URL } from '@/lib/api';

interface RealtimeMessage {
  type: string;
  [key: string]: unknown;
}

interface UseRealtimeOptions {
  agentId: string;
  onMessage?: (message: RealtimeMessage) => void;
  onAudioDelta?: (delta: string) => void;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export function useRealtime({
  agentId,
  onMessage,
  onAudioDelta,
  onTranscript,
  onError,
}: UseRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_URL}/api/realtime/ws/${agentId}`);
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data: RealtimeMessage = JSON.parse(event.data);
      
      if (data.type === 'session.info') {
        setSessionId(data.session_id as string);
      }
      
      if (data.type === 'response.audio.delta' && onAudioDelta) {
        onAudioDelta(data.delta as string);
      }
      
      if (data.type === 'response.audio_transcript.delta' && onTranscript) {
        onTranscript(data.delta as string, false);
      }
      
      if (data.type === 'conversation.item.input_audio_transcription.completed' && onTranscript) {
        onTranscript(data.transcript as string, true);
      }
      
      if (data.type === 'error' && onError) {
        const errorMsg = typeof data.error === 'object' 
          ? JSON.stringify(data.error) 
          : (data.error as string) || 'Unknown error';
        onError(errorMsg);
      }
      
      onMessage?.(data);
    };

    ws.onerror = () => {
      onError?.('WebSocket error');
    };

    ws.onclose = () => {
      setIsConnected(false);
      setSessionId(null);
      console.log('WebSocket disconnected');
    };

    wsRef.current = ws;
  }, [agentId, onMessage, onAudioDelta, onTranscript, onError]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopListening();
  }, []);

  const sendAudio = useCallback((audioData: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'audio',
        audio: audioData,
      }));
    }
  }, []);

  const sendText = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'text',
        text,
      }));
    }
  }, []);

  const commitAudio = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'audio_commit',
      }));
    }
  }, []);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        const base64 = btoa(
          String.fromCharCode(...new Uint8Array(pcm16.buffer))
        );
        sendAudio(base64);
      };

      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
      
      setIsListening(true);
    } catch (err) {
      console.error('Error starting audio:', err);
      onError?.('Failed to access microphone');
    }
  }, [sendAudio, onError]);

  const stopListening = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsListening(false);
    // Don't commit empty audio buffer - server VAD handles turn detection
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isListening,
    sessionId,
    connect,
    disconnect,
    sendText,
    sendAudio,
    startListening,
    stopListening,
  };
}
