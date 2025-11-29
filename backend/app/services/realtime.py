import json
import asyncio
import base64
from typing import Dict, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect
import httpx
from app.config import get_settings
from app.services.agent import agent_service
from app.services.calcom import CALCOM_TOOLS

settings = get_settings()


class RealtimeService:
    """Service for handling OpenAI Realtime API WebSocket connections"""
    
    OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime"
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.openai_connections: Dict[str, Any] = {}
    
    async def connect_client(self, websocket: WebSocket, session_id: str):
        """Accept a new WebSocket connection from client"""
        await websocket.accept()
        self.active_connections[session_id] = websocket
    
    def disconnect_client(self, session_id: str):
        """Remove a client connection"""
        if session_id in self.active_connections:
            del self.active_connections[session_id]
        if session_id in self.openai_connections:
            del self.openai_connections[session_id]
    
    async def handle_realtime_session(
        self, 
        websocket: WebSocket, 
        session_id: str,
        agent_id: str
    ):
        """Handle a realtime voice session"""
        import websockets
        
        # Get agent configuration
        config = agent_service.get_realtime_config(agent_id)
        
        # Connect to OpenAI Realtime API
        headers = {
            "Authorization": f"Bearer {settings.openai_api_key}",
            "OpenAI-Beta": "realtime=v1"
        }
        
        model = config.get("model", "gpt-4o-realtime-preview")
        openai_url = f"{self.OPENAI_REALTIME_URL}?model={model}"
        
        try:
            async with websockets.connect(openai_url, extra_headers=headers) as openai_ws:
                self.openai_connections[session_id] = openai_ws
                
                # Prepend language instruction to ensure English responses
                instructions = config.get("instructions", "")
                instructions = f"IMPORTANT: Always respond in English only.\n\n{instructions}"
                
                # Send session configuration using agent's system instructions
                session_config = {
                    "type": "session.update",
                    "session": {
                        "modalities": ["text", "audio"],
                        "instructions": instructions,
                        "voice": "shimmer",
                        "input_audio_format": "pcm16",
                        "output_audio_format": "pcm16",
                        "input_audio_transcription": {
                            "model": "whisper-1"
                        },
                        "turn_detection": {
                            "type": "server_vad",
                            "threshold": 0.5,
                            "prefix_padding_ms": 300,
                            "silence_duration_ms": 500
                        },
                        "tools": CALCOM_TOOLS,
                        "tool_choice": "auto"
                    }
                }
                await openai_ws.send(json.dumps(session_config))
                
                # Wait for session to be configured
                await asyncio.sleep(0.3)
                
                # Trigger initial sales pitch
                await openai_ws.send(json.dumps({
                    "type": "response.create",
                    "response": {
                        "modalities": ["text", "audio"],
                        "instructions": "Start the call with your sales pitch. Say: Hi! This is Sarah from TechFlow. I'm reaching out because we help businesses save 10+ hours every week with AI automation. Quick question - are you handling a lot of repetitive tasks in your work right now?"
                    }
                }))
                
                # Handle bidirectional communication
                await asyncio.gather(
                    self._forward_to_openai(websocket, openai_ws, session_id),
                    self._forward_to_client(websocket, openai_ws, session_id)
                )
                
        except Exception as e:
            await websocket.send_json({
                "type": "error",
                "error": str(e)
            })
    
    async def _forward_to_openai(
        self, 
        client_ws: WebSocket, 
        openai_ws: Any,
        session_id: str
    ):
        """Forward messages from client to OpenAI"""
        try:
            while True:
                data = await client_ws.receive_text()
                message = json.loads(data)
                
                # Handle different message types from client
                if message.get("type") == "audio":
                    # Forward audio data
                    openai_message = {
                        "type": "input_audio_buffer.append",
                        "audio": message.get("audio")
                    }
                    await openai_ws.send(json.dumps(openai_message))
                    
                elif message.get("type") == "audio_commit":
                    # Commit audio buffer
                    await openai_ws.send(json.dumps({
                        "type": "input_audio_buffer.commit"
                    }))
                    
                elif message.get("type") == "text":
                    # Send text message
                    openai_message = {
                        "type": "conversation.item.create",
                        "item": {
                            "type": "message",
                            "role": "user",
                            "content": [{
                                "type": "input_text",
                                "text": message.get("text")
                            }]
                        }
                    }
                    await openai_ws.send(json.dumps(openai_message))
                    await openai_ws.send(json.dumps({"type": "response.create"}))
                    
                elif message.get("type") == "cancel":
                    await openai_ws.send(json.dumps({"type": "response.cancel"}))
                    
                else:
                    # Forward other messages as-is
                    await openai_ws.send(data)
                    
        except WebSocketDisconnect:
            pass
        except Exception as e:
            print(f"Error forwarding to OpenAI: {e}")
    
    async def _forward_to_client(
        self, 
        client_ws: WebSocket, 
        openai_ws: Any,
        session_id: str
    ):
        """Forward messages from OpenAI to client"""
        try:
            async for message in openai_ws:
                data = json.loads(message)
                event_type = data.get("type", "")
                
                # Handle tool calls
                if event_type == "response.function_call_arguments.done":
                    tool_name = data.get("name")
                    arguments = json.loads(data.get("arguments", "{}"))
                    call_id = data.get("call_id")
                    
                    print(f"Tool call received: {tool_name} with args: {arguments}")
                    
                    # Process tool call
                    result = await agent_service.process_tool_call(tool_name, arguments)
                    print(f"Tool result: {result}")
                    
                    # Send tool result back to OpenAI
                    tool_response = {
                        "type": "conversation.item.create",
                        "item": {
                            "type": "function_call_output",
                            "call_id": call_id,
                            "output": result
                        }
                    }
                    await openai_ws.send(json.dumps(tool_response))
                    await openai_ws.send(json.dumps({"type": "response.create"}))
                
                # Forward relevant events to client
                forward_events = [
                    "session.created",
                    "session.updated",
                    "response.audio.delta",
                    "response.audio.done",
                    "response.audio_transcript.delta",
                    "response.audio_transcript.done",
                    "response.text.delta",
                    "response.text.done",
                    "input_audio_buffer.speech_started",
                    "input_audio_buffer.speech_stopped",
                    "conversation.item.input_audio_transcription.completed",
                    "response.done",
                    "error"
                ]
                
                if event_type in forward_events:
                    await client_ws.send_json(data)
                    
        except WebSocketDisconnect:
            pass
        except Exception as e:
            print(f"Error forwarding to client: {e}")


realtime_service = RealtimeService()
