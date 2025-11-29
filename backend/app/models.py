from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class AgentStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TESTING = "testing"


class Agent(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    system_instructions: str
    status: AgentStatus = AgentStatus.INACTIVE
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()


class AgentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    system_instructions: str = ""


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    system_instructions: Optional[str] = None
    status: Optional[AgentStatus] = None


class CalendarSlot(BaseModel):
    start: str
    end: str


class BookingRequest(BaseModel):
    event_type_id: int
    start: str
    name: str
    email: str
    notes: Optional[str] = None
    timezone: str = "America/Los_Angeles"


class BookingResponse(BaseModel):
    id: int
    uid: str
    title: str
    start_time: str
    end_time: str
    attendees: List[Dict[str, Any]]


class ConversationMessage(BaseModel):
    role: str
    content: str
    timestamp: datetime = datetime.now()


class Session(BaseModel):
    id: str
    agent_id: str
    messages: List[ConversationMessage] = []
    created_at: datetime = datetime.now()
    status: str = "active"


class CallTransferRequest(BaseModel):
    session_id: str
    reason: str
    phone_number: Optional[str] = None


class ToolCall(BaseModel):
    name: str
    arguments: Dict[str, Any]


class RealtimeConfig(BaseModel):
    voice: str = "alloy"
    system_instructions: str = ""
    tools: List[Dict[str, Any]] = []


# Campaign Models
class CampaignStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"


class ContactStatus(str, Enum):
    PENDING = "pending"
    EMAIL_SENT = "email_sent"
    EMAIL_OPENED = "email_opened"
    CALL_STARTED = "call_started"
    CALL_COMPLETED = "call_completed"
    MEETING_BOOKED = "meeting_booked"
    NOT_INTERESTED = "not_interested"


class Contact(BaseModel):
    id: str
    name: str
    email: str
    company: Optional[str] = None
    status: ContactStatus = ContactStatus.PENDING
    call_token: Optional[str] = None
    created_at: datetime = datetime.now()
    last_activity: Optional[datetime] = None


class ContactCreate(BaseModel):
    name: str
    email: str
    company: Optional[str] = None


class Campaign(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    agent_id: str
    contacts: List[Contact] = []
    email_subject: str = "Exclusive Offer Just For You!"
    email_template: str = ""
    status: CampaignStatus = CampaignStatus.DRAFT
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()
    stats: Dict[str, int] = {
        "total_contacts": 0,
        "emails_sent": 0,
        "calls_started": 0,
        "meetings_booked": 0
    }


class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    agent_id: str
    email_subject: Optional[str] = "Exclusive Offer Just For You!"
    email_template: Optional[str] = ""


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    email_subject: Optional[str] = None
    email_template: Optional[str] = None
    status: Optional[CampaignStatus] = None

