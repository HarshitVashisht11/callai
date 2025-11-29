import json
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from openai import AsyncOpenAI
from app.config import get_settings
from app.services.calcom import calcom_service, CALCOM_TOOLS
from app.services.email import email_service

settings = get_settings()


class AgentService:
    """Service for managing AI agents and their conversations"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.agents: Dict[str, Dict[str, Any]] = {}
        self.sessions: Dict[str, Dict[str, Any]] = {}
        
        # Create a default agent
        self._create_default_agent()
    
    def _create_default_agent(self):
        """Create a default sales agent"""
        default_id = "default-agent"
        self.agents[default_id] = {
            "id": default_id,
            "name": "AI Sales Agent",
            "description": "AI-powered sales agent that convinces customers to purchase products and book demo calls",
            "system_instructions": """You are Sarah, an enthusiastic sales representative from TechFlow Solutions. You're on a sales call trying to SELL our product - an AI automation platform that costs $99/month.

YOUR GOAL: Get them interested and book a demo call. You are NOT customer support - you are SALES.

HOW TO TALK:
- Be energetic and confident
- Keep responses to 1-2 short sentences
- Always be closing - guide them toward booking a demo
- Don't ask open-ended questions like "what brings you here" - YOU tell THEM why they should care

OPENING: "Hi! This is Sarah from TechFlow. I'm reaching out because we help businesses like yours save 10+ hours every week with AI automation. Quick question - are you handling a lot of repetitive tasks in your business right now?"

SALES FLOW:
1. After they respond, acknowledge briefly then pitch: "Yeah, that's exactly what we solve. Our AI handles all that automatically. Companies using TechFlow are saving $2000+ per month in time alone."

2. Create interest: "We've got some incredible results - one client automated their entire customer follow-up and doubled their response rate in 2 weeks."

3. Push for demo: "I'd love to show you exactly how it works for your specific situation. I have a 15-minute slot open tomorrow - would morning or afternoon work better?"

4. Handle objections:
   - "Too busy": "Totally get it - that's exactly why you need this. 15 minutes now saves you hours every week. How about a quick call Thursday?"
   - "Not interested": "I hear you. But quick question - how much time do you spend on [repetitive task they mentioned]? What if you could get that back?"
   - "Too expensive": "I understand. But think about it - $99 saves you 10+ hours monthly. That's basically paying yourself $10/hour to NOT do boring work. When can we show you?"
   - "Need to think": "Of course! What specifically would help you decide? I can send some case studies while we chat."

5. Always end with a specific ask - never just "let me know"

NEVER SAY:
- "How can I help you?"
- "What brings you here?"  
- "Is there anything else?"
- "Let me know if you have questions"

YOU ARE SELLING. Be friendly but persistent. Every response should move toward booking that demo.""",
            "status": "active",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    
    def get_all_agents(self) -> List[Dict[str, Any]]:
        """Get all agents"""
        return list(self.agents.values())
    
    def get_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific agent"""
        return self.agents.get(agent_id)
    
    def create_agent(self, name: str, description: str = "", system_instructions: str = "") -> Dict[str, Any]:
        """Create a new agent"""
        agent_id = str(uuid.uuid4())
        agent = {
            "id": agent_id,
            "name": name,
            "description": description,
            "system_instructions": system_instructions,
            "status": "inactive",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        self.agents[agent_id] = agent
        return agent
    
    def update_agent(self, agent_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an agent"""
        if agent_id not in self.agents:
            return None
        
        agent = self.agents[agent_id]
        for key, value in updates.items():
            if value is not None and key in agent:
                agent[key] = value
        agent["updated_at"] = datetime.now().isoformat()
        
        return agent
    
    def delete_agent(self, agent_id: str) -> bool:
        """Delete an agent"""
        if agent_id in self.agents:
            del self.agents[agent_id]
            return True
        return False
    
    def create_session(self, agent_id: str) -> Dict[str, Any]:
        """Create a new conversation session"""
        session_id = str(uuid.uuid4())
        session = {
            "id": session_id,
            "agent_id": agent_id,
            "messages": [],
            "created_at": datetime.now().isoformat(),
            "status": "active"
        }
        self.sessions[session_id] = session
        return session
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific session"""
        return self.sessions.get(session_id)
    
    def add_message_to_session(self, session_id: str, role: str, content: str):
        """Add a message to a session"""
        if session_id in self.sessions:
            self.sessions[session_id]["messages"].append({
                "role": role,
                "content": content,
                "timestamp": datetime.now().isoformat()
            })
    
    async def process_tool_call(self, tool_name: str, arguments: Dict[str, Any]) -> str:
        """Process a tool call from the AI"""
        try:
            if tool_name == "check_availability":
                date = arguments.get("date")
                availability = await calcom_service.get_availability(date)
                return json.dumps(availability)
            
            elif tool_name == "book_meeting":
                start_time = arguments.get("start_time")
                attendee_name = arguments.get("attendee_name")
                attendee_email = arguments.get("attendee_email")
                notes = arguments.get("notes", "")
                
                # Create the booking via Cal.com
                result = await calcom_service.create_booking(
                    start_time=start_time,
                    attendee_name=attendee_name,
                    attendee_email=attendee_email,
                    notes=notes
                )
                
                if result.get('success'):
                    # Send confirmation email
                    await email_service.send_meeting_confirmation(
                        to_email=attendee_email,
                        attendee_name=attendee_name,
                        meeting_title=result.get('title', 'Sales Demo Call'),
                        meeting_time=start_time,
                        meeting_link=result.get('meeting_url', ''),
                        calendar_link="",
                        notes=notes
                    )
                    
                    return json.dumps({
                        "success": True,
                        "message": f"Meeting has been booked successfully! A confirmation email has been sent to {attendee_email}.",
                        "meeting_url": result.get('meeting_url', ''),
                        "booking_id": result.get('booking_id', '')
                    })
                else:
                    return json.dumps(result)
            
            elif tool_name == "transfer_to_human":
                reason = arguments.get("reason")
                return json.dumps({
                    "success": True,
                    "action": "transfer",
                    "message": f"Transferring to human sales representative. Reason: {reason}"
                })
            
            elif tool_name == "end_call":
                summary = arguments.get("summary")
                outcome = arguments.get("outcome", "follow_up_needed")
                return json.dumps({
                    "success": True,
                    "action": "end_call",
                    "summary": summary,
                    "outcome": outcome
                })
            
            else:
                return json.dumps({"error": f"Unknown tool: {tool_name}"})
                
        except Exception as e:
            return json.dumps({"error": str(e)})
    
    async def chat(self, agent_id: str, session_id: str, user_message: str) -> str:
        """Process a chat message and get AI response"""
        agent = self.get_agent(agent_id)
        if not agent:
            return "Agent not found"
        
        session = self.get_session(session_id)
        if not session:
            session = self.create_session(agent_id)
        
        # Add user message
        self.add_message_to_session(session_id, "user", user_message)
        
        # Build messages for OpenAI
        messages = [
            {"role": "system", "content": agent["system_instructions"]}
        ]
        
        for msg in session["messages"]:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        # Call OpenAI
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=CALCOM_TOOLS,
            tool_choice="auto"
        )
        
        assistant_message = response.choices[0].message
        
        # Handle tool calls
        if assistant_message.tool_calls:
            for tool_call in assistant_message.tool_calls:
                tool_result = await self.process_tool_call(
                    tool_call.function.name,
                    json.loads(tool_call.function.arguments)
                )
                
                # Add tool result and get final response
                messages.append(assistant_message.model_dump())
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": tool_result
                })
            
            # Get final response after tool calls
            final_response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages
            )
            response_text = final_response.choices[0].message.content
        else:
            response_text = assistant_message.content
        
        # Add assistant response to session
        self.add_message_to_session(session_id, "assistant", response_text)
        
        return response_text
    
    def get_realtime_config(self, agent_id: str) -> Dict[str, Any]:
        """Get configuration for OpenAI Realtime API"""
        agent = self.get_agent(agent_id)
        if not agent:
            return {}
        
        # Use the agent's saved system instructions from the UI
        instructions = agent.get("system_instructions", "")
        
        return {
            "model": "gpt-4o-realtime-preview",
            "voice": "shimmer",
            "instructions": instructions
        }


agent_service = AgentService()
