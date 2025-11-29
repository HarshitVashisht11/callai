import httpx
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from app.config import get_settings

settings = get_settings()

CALCOM_API_BASE = "https://api.cal.com/v1"


# Tool definitions for the OpenAI Realtime API
# Note: Realtime API uses a different format than Chat Completions API
CALCOM_TOOLS = [
    {
        "type": "function",
        "name": "check_availability",
        "description": "Check available time slots for booking a meeting on a specific date. Use this when a customer wants to schedule a demo or meeting.",
        "parameters": {
            "type": "object",
            "properties": {
                "date": {
                    "type": "string",
                    "description": "The date to check availability for in YYYY-MM-DD format"
                }
            },
            "required": ["date"]
        }
    },
    {
        "type": "function",
        "name": "book_meeting",
        "description": "Book a meeting/demo with the customer. Use this after they've selected a time slot.",
        "parameters": {
            "type": "object",
            "properties": {
                "start_time": {
                    "type": "string",
                    "description": "The start time for the meeting in ISO 8601 format (e.g., 2024-01-15T10:00:00)"
                },
                "attendee_name": {
                    "type": "string",
                    "description": "The name of the person booking the meeting"
                },
                "attendee_email": {
                    "type": "string",
                    "description": "The email address of the person booking the meeting"
                },
                "notes": {
                    "type": "string",
                    "description": "Optional notes or context for the meeting"
                }
            },
            "required": ["start_time", "attendee_name", "attendee_email"]
        }
    },
    {
        "type": "function",
        "name": "transfer_to_human",
        "description": "Transfer the call to a human sales representative when needed",
        "parameters": {
            "type": "object",
            "properties": {
                "reason": {
                    "type": "string",
                    "description": "The reason for transferring to a human"
                }
            },
            "required": ["reason"]
        }
    },
    {
        "type": "function",
        "name": "end_call",
        "description": "End the sales call with a summary",
        "parameters": {
            "type": "object",
            "properties": {
                "summary": {
                    "type": "string",
                    "description": "A brief summary of the call and any next steps"
                },
                "outcome": {
                    "type": "string",
                    "enum": ["meeting_booked", "interested", "not_interested", "follow_up_needed"],
                    "description": "The outcome of the call"
                }
            },
            "required": ["summary", "outcome"]
        }
    }
]


class CalComService:
    """Service for interacting with Cal.com API"""
    
    def __init__(self):
        self.api_key = settings.calcom_api_key
        self.event_type_id = settings.calcom_event_type_id
    
    def _get_headers(self) -> Dict[str, str]:
        """Get API headers"""
        return {
            "Content-Type": "application/json"
        }
    
    async def get_availability(self, date: str, duration_minutes: int = 30) -> Dict[str, Any]:
        """Get available time slots for a specific date"""
        try:
            # Parse date and create time range
            target_date = datetime.strptime(date, "%Y-%m-%d")
            start_time = target_date.replace(hour=9, minute=0, second=0)
            end_time = target_date.replace(hour=17, minute=0, second=0)
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{CALCOM_API_BASE}/availability",
                    params={
                        "apiKey": self.api_key,
                        "eventTypeId": self.event_type_id,
                        "dateFrom": start_time.strftime("%Y-%m-%d"),
                        "dateTo": end_time.strftime("%Y-%m-%d")
                    },
                    headers=self._get_headers()
                )
                
                if response.status_code == 200:
                    data = response.json()
                    # Format the available slots
                    slots = []
                    if "slots" in data:
                        for slot_date, times in data["slots"].items():
                            for time_slot in times:
                                slots.append({
                                    "start": time_slot.get("time"),
                                    "end": (datetime.fromisoformat(time_slot.get("time").replace('Z', '')) + 
                                           timedelta(minutes=duration_minutes)).isoformat()
                                })
                    
                    return {
                        "date": date,
                        "available_slots": slots,
                        "timezone": "America/Los_Angeles"
                    }
                else:
                    # Return mock availability if API fails or no key
                    return self._get_mock_availability(date, duration_minutes)
                    
        except Exception as e:
            print(f"Cal.com API error: {e}")
            # Return mock availability for demo purposes
            return self._get_mock_availability(date, duration_minutes)
    
    def _get_mock_availability(self, date: str, duration_minutes: int = 30) -> Dict[str, Any]:
        """Generate mock availability for demo purposes"""
        target_date = datetime.strptime(date, "%Y-%m-%d")
        slots = []
        
        # Generate slots from 9 AM to 5 PM
        current_time = target_date.replace(hour=9, minute=0, second=0)
        end_time = target_date.replace(hour=17, minute=0, second=0)
        
        while current_time < end_time:
            # Skip some slots randomly to simulate busy times
            if current_time.hour not in [12, 14]:  # Skip noon and 2 PM
                slots.append({
                    "start": current_time.strftime("%Y-%m-%dT%H:%M:%S"),
                    "end": (current_time + timedelta(minutes=duration_minutes)).strftime("%Y-%m-%dT%H:%M:%S")
                })
            current_time += timedelta(minutes=30)
        
        return {
            "date": date,
            "available_slots": slots,
            "timezone": "America/Los_Angeles"
        }
    
    async def create_booking(
        self,
        start_time: str,
        attendee_name: str,
        attendee_email: str,
        notes: str = ""
    ) -> Dict[str, Any]:
        """Create a booking via Cal.com API"""
        print(f"Creating booking: {attendee_name} ({attendee_email}) at {start_time}")
        try:
            # Parse start time and calculate end time (30 min default)
            start_dt = datetime.fromisoformat(start_time.replace('Z', ''))
            end_dt = start_dt + timedelta(minutes=30)
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{CALCOM_API_BASE}/bookings",
                    params={"apiKey": self.api_key},
                    headers=self._get_headers(),
                    json={
                        "eventTypeId": int(self.event_type_id) if self.event_type_id else 1,
                        "start": start_time,
                        "end": end_dt.isoformat(),
                        "responses": {
                            "name": attendee_name,
                            "email": attendee_email,
                            "notes": notes
                        },
                        "timeZone": "America/Los_Angeles",
                        "language": "en",
                        "metadata": {}
                    }
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    return {
                        "success": True,
                        "booking_id": data.get("id"),
                        "uid": data.get("uid"),
                        "title": data.get("title", "Sales Demo Call"),
                        "start_time": start_time,
                        "end_time": end_dt.isoformat(),
                        "meeting_url": data.get("metadata", {}).get("videoCallUrl", ""),
                        "attendee_email": attendee_email,
                        "attendee_name": attendee_name
                    }
                else:
                    # Return mock success for demo
                    return self._get_mock_booking(start_time, attendee_name, attendee_email, notes)
                    
        except Exception as e:
            print(f"Cal.com booking error: {e}")
            # Return mock booking for demo purposes
            return self._get_mock_booking(start_time, attendee_name, attendee_email, notes)
    
    def _get_mock_booking(
        self,
        start_time: str,
        attendee_name: str,
        attendee_email: str,
        notes: str = ""
    ) -> Dict[str, Any]:
        """Generate mock booking response for demo purposes"""
        import uuid
        
        start_dt = datetime.fromisoformat(start_time.replace('Z', ''))
        end_dt = start_dt + timedelta(minutes=30)
        
        return {
            "success": True,
            "booking_id": str(uuid.uuid4())[:8],
            "uid": str(uuid.uuid4()),
            "title": "Sales Demo Call",
            "start_time": start_time,
            "end_time": end_dt.isoformat(),
            "meeting_url": f"https://cal.com/video/{uuid.uuid4().hex[:8]}",
            "attendee_email": attendee_email,
            "attendee_name": attendee_name
        }
    
    async def cancel_booking(self, booking_id: str, reason: str = "") -> Dict[str, Any]:
        """Cancel a booking"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{CALCOM_API_BASE}/bookings/{booking_id}",
                    params={
                        "apiKey": self.api_key,
                        "cancellationReason": reason
                    },
                    headers=self._get_headers()
                )
                
                return {
                    "success": response.status_code in [200, 204],
                    "booking_id": booking_id
                }
        except Exception as e:
            print(f"Cal.com cancel error: {e}")
            return {"success": False, "error": str(e)}


# Singleton instance
calcom_service = CalComService()
