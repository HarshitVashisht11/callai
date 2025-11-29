from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.agent import agent_service
from app.models import AgentCreate, AgentUpdate

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("/", response_model=List[Dict[str, Any]])
async def get_agents():
    """Get all agents"""
    return agent_service.get_all_agents()


@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    """Get a specific agent"""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.post("/")
async def create_agent(agent_data: AgentCreate):
    """Create a new agent"""
    agent = agent_service.create_agent(
        name=agent_data.name,
        description=agent_data.description or "",
        system_instructions=agent_data.system_instructions
    )
    return agent


@router.put("/{agent_id}")
async def update_agent(agent_id: str, updates: AgentUpdate):
    """Update an agent"""
    agent = agent_service.update_agent(agent_id, updates.model_dump(exclude_none=True))
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.delete("/{agent_id}")
async def delete_agent(agent_id: str):
    """Delete an agent"""
    success = agent_service.delete_agent(agent_id)
    if not success:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"message": "Agent deleted successfully"}


@router.post("/{agent_id}/sessions")
async def create_session(agent_id: str):
    """Create a new conversation session"""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    session = agent_service.create_session(agent_id)
    return session


@router.get("/{agent_id}/sessions/{session_id}")
async def get_session(agent_id: str, session_id: str):
    """Get a specific session"""
    session = agent_service.get_session(session_id)
    if not session or session["agent_id"] != agent_id:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/{agent_id}/sessions/{session_id}/chat")
async def chat(agent_id: str, session_id: str, message: Dict[str, str]):
    """Send a chat message"""
    user_message = message.get("message", "")
    if not user_message:
        raise HTTPException(status_code=400, detail="Message is required")
    
    response = await agent_service.chat(agent_id, session_id, user_message)
    return {"response": response}


@router.get("/{agent_id}/realtime-config")
async def get_realtime_config(agent_id: str):
    """Get realtime API configuration for an agent"""
    config = agent_service.get_realtime_config(agent_id)
    if not config:
        raise HTTPException(status_code=404, detail="Agent not found")
    return config
