from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import uuid
from app.services.realtime import realtime_service

router = APIRouter(prefix="/realtime", tags=["realtime"])


@router.websocket("/ws/{agent_id}")
async def websocket_endpoint(websocket: WebSocket, agent_id: str):
    """WebSocket endpoint for realtime voice communication"""
    session_id = str(uuid.uuid4())
    
    await realtime_service.connect_client(websocket, session_id)
    
    try:
        # Send session info to client
        await websocket.send_json({
            "type": "session.info",
            "session_id": session_id,
            "agent_id": agent_id
        })
        
        # Handle the realtime session
        await realtime_service.handle_realtime_session(
            websocket, 
            session_id, 
            agent_id
        )
        
    except WebSocketDisconnect:
        realtime_service.disconnect_client(session_id)
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "error": str(e)
        })
        realtime_service.disconnect_client(session_id)
