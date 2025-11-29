import uuid
import secrets
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from app.models import (
    Campaign, CampaignCreate, CampaignUpdate, 
    Contact, ContactCreate, ContactStatus, CampaignStatus
)
from app.services.email import email_service
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/campaigns", tags=["campaigns"])

# In-memory storage for campaigns
campaigns_store: Dict[str, Dict[str, Any]] = {}


class AddContactsRequest(BaseModel):
    contacts: List[ContactCreate]


class SendCampaignRequest(BaseModel):
    contact_ids: Optional[List[str]] = None  # If None, send to all pending


@router.get("/", response_model=List[Dict[str, Any]])
async def get_campaigns():
    """Get all campaigns"""
    return list(campaigns_store.values())


@router.post("/", response_model=Dict[str, Any])
async def create_campaign(campaign: CampaignCreate):
    """Create a new campaign"""
    campaign_id = str(uuid.uuid4())
    
    new_campaign = {
        "id": campaign_id,
        "name": campaign.name,
        "description": campaign.description or "",
        "agent_id": campaign.agent_id,
        "contacts": [],
        "email_subject": campaign.email_subject or "Exclusive Offer Just For You!",
        "email_template": campaign.email_template or "",
        "status": CampaignStatus.DRAFT.value,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "stats": {
            "total_contacts": 0,
            "emails_sent": 0,
            "calls_started": 0,
            "meetings_booked": 0
        }
    }
    
    campaigns_store[campaign_id] = new_campaign
    return new_campaign


@router.get("/{campaign_id}", response_model=Dict[str, Any])
async def get_campaign(campaign_id: str):
    """Get a specific campaign"""
    if campaign_id not in campaigns_store:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaigns_store[campaign_id]


@router.put("/{campaign_id}", response_model=Dict[str, Any])
async def update_campaign(campaign_id: str, updates: CampaignUpdate):
    """Update a campaign"""
    if campaign_id not in campaigns_store:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = campaigns_store[campaign_id]
    update_data = updates.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if value is not None:
            if key == "status":
                campaign[key] = value.value if hasattr(value, 'value') else value
            else:
                campaign[key] = value
    
    campaign["updated_at"] = datetime.now().isoformat()
    return campaign


@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str):
    """Delete a campaign"""
    if campaign_id not in campaigns_store:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    del campaigns_store[campaign_id]
    return {"success": True}


@router.post("/{campaign_id}/contacts", response_model=Dict[str, Any])
async def add_contacts(campaign_id: str, request: AddContactsRequest):
    """Add contacts to a campaign"""
    if campaign_id not in campaigns_store:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = campaigns_store[campaign_id]
    added_contacts = []
    
    for contact_data in request.contacts:
        contact_id = str(uuid.uuid4())
        # Generate unique call token for this contact
        call_token = secrets.token_urlsafe(32)
        
        contact = {
            "id": contact_id,
            "name": contact_data.name,
            "email": contact_data.email,
            "company": contact_data.company or "",
            "status": ContactStatus.PENDING.value,
            "call_token": call_token,
            "created_at": datetime.now().isoformat(),
            "last_activity": None
        }
        
        campaign["contacts"].append(contact)
        added_contacts.append(contact)
    
    campaign["stats"]["total_contacts"] = len(campaign["contacts"])
    campaign["updated_at"] = datetime.now().isoformat()
    
    return {
        "success": True,
        "added_count": len(added_contacts),
        "contacts": added_contacts
    }


@router.delete("/{campaign_id}/contacts/{contact_id}")
async def remove_contact(campaign_id: str, contact_id: str):
    """Remove a contact from a campaign"""
    if campaign_id not in campaigns_store:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = campaigns_store[campaign_id]
    campaign["contacts"] = [c for c in campaign["contacts"] if c["id"] != contact_id]
    campaign["stats"]["total_contacts"] = len(campaign["contacts"])
    campaign["updated_at"] = datetime.now().isoformat()
    
    return {"success": True}


@router.post("/{campaign_id}/send")
async def send_campaign_emails(campaign_id: str, request: SendCampaignRequest = None):
    """Send campaign emails to contacts"""
    if campaign_id not in campaigns_store:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = campaigns_store[campaign_id]
    
    # Get contacts to send to
    contacts_to_send = []
    if request and request.contact_ids:
        contacts_to_send = [
            c for c in campaign["contacts"] 
            if c["id"] in request.contact_ids
        ]
    else:
        # Send to all pending contacts
        contacts_to_send = [
            c for c in campaign["contacts"] 
            if c["status"] == ContactStatus.PENDING.value
        ]
    
    if not contacts_to_send:
        raise HTTPException(status_code=400, detail="No contacts to send emails to")
    
    sent_count = 0
    errors = []
    
    for contact in contacts_to_send:
        try:
            # Generate the AI call link
            call_link = f"{settings.frontend_url}/call/{campaign_id}/{contact['call_token']}"
            
            # Send the campaign email
            result = await email_service.send_campaign_email(
                to_email=contact["email"],
                to_name=contact["name"],
                subject=campaign["email_subject"],
                campaign_name=campaign["name"],
                call_link=call_link,
                custom_template=campaign.get("email_template", "")
            )
            
            if result.get("success"):
                contact["status"] = ContactStatus.EMAIL_SENT.value
                contact["last_activity"] = datetime.now().isoformat()
                sent_count += 1
            else:
                errors.append({
                    "contact_id": contact["id"],
                    "email": contact["email"],
                    "error": result.get("error", "Unknown error")
                })
        except Exception as e:
            errors.append({
                "contact_id": contact["id"],
                "email": contact["email"],
                "error": str(e)
            })
    
    campaign["stats"]["emails_sent"] += sent_count
    campaign["status"] = CampaignStatus.ACTIVE.value
    campaign["updated_at"] = datetime.now().isoformat()
    
    return {
        "success": True,
        "sent_count": sent_count,
        "total_contacts": len(contacts_to_send),
        "errors": errors if errors else None
    }


@router.get("/{campaign_id}/stats")
async def get_campaign_stats(campaign_id: str):
    """Get campaign statistics"""
    if campaign_id not in campaigns_store:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = campaigns_store[campaign_id]
    
    # Calculate stats from contacts
    stats = {
        "total_contacts": len(campaign["contacts"]),
        "emails_sent": sum(1 for c in campaign["contacts"] if c["status"] != ContactStatus.PENDING.value),
        "calls_started": sum(1 for c in campaign["contacts"] if c["status"] in [
            ContactStatus.CALL_STARTED.value,
            ContactStatus.CALL_COMPLETED.value,
            ContactStatus.MEETING_BOOKED.value,
            ContactStatus.NOT_INTERESTED.value
        ]),
        "meetings_booked": sum(1 for c in campaign["contacts"] if c["status"] == ContactStatus.MEETING_BOOKED.value),
        "not_interested": sum(1 for c in campaign["contacts"] if c["status"] == ContactStatus.NOT_INTERESTED.value)
    }
    
    return stats


# Endpoint to validate call token (for public call page)
@router.get("/validate-token/{campaign_id}/{call_token}")
async def validate_call_token(campaign_id: str, call_token: str):
    """Validate a call token and get contact info"""
    if campaign_id not in campaigns_store:
        raise HTTPException(status_code=404, detail="Invalid link")
    
    campaign = campaigns_store[campaign_id]
    
    # Find contact with this token
    contact = next(
        (c for c in campaign["contacts"] if c["call_token"] == call_token),
        None
    )
    
    if not contact:
        raise HTTPException(status_code=404, detail="Invalid link")
    
    # Update contact status to call started
    contact["status"] = ContactStatus.CALL_STARTED.value
    contact["last_activity"] = datetime.now().isoformat()
    campaign["stats"]["calls_started"] = sum(
        1 for c in campaign["contacts"] 
        if c["status"] in [
            ContactStatus.CALL_STARTED.value,
            ContactStatus.CALL_COMPLETED.value,
            ContactStatus.MEETING_BOOKED.value
        ]
    )
    
    return {
        "valid": True,
        "contact_name": contact["name"],
        "contact_email": contact["email"],
        "agent_id": campaign["agent_id"],
        "campaign_name": campaign["name"]
    }


# Update contact status (called after call ends)
@router.patch("/{campaign_id}/contacts/{contact_id}/status")
async def update_contact_status(campaign_id: str, contact_id: str, status: str):
    """Update contact status after call"""
    if campaign_id not in campaigns_store:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = campaigns_store[campaign_id]
    contact = next((c for c in campaign["contacts"] if c["id"] == contact_id), None)
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    contact["status"] = status
    contact["last_activity"] = datetime.now().isoformat()
    
    # Update stats
    if status == ContactStatus.MEETING_BOOKED.value:
        campaign["stats"]["meetings_booked"] = sum(
            1 for c in campaign["contacts"] 
            if c["status"] == ContactStatus.MEETING_BOOKED.value
        )
    
    return {"success": True}
