export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export interface Agent {
  id: string;
  name: string;
  description: string;
  system_instructions: string;
  status: 'active' | 'inactive' | 'testing';
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  agent_id: string;
  messages: Message[];
  created_at: string;
  status: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

// Campaign types
export interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  status: 'pending' | 'email_sent' | 'email_opened' | 'call_started' | 'call_completed' | 'meeting_booked' | 'not_interested';
  call_token?: string;
  created_at: string;
  last_activity?: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  agent_id: string;
  contacts: Contact[];
  email_subject: string;
  email_template: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
  stats: {
    total_contacts: number;
    emails_sent: number;
    calls_started: number;
    meetings_booked: number;
  };
}

export interface CampaignStats {
  total_contacts: number;
  emails_sent: number;
  calls_started: number;
  meetings_booked: number;
  not_interested: number;
}

// Agent API
export async function getAgents(): Promise<Agent[]> {
  const res = await fetch(`${API_URL}/api/agents/`);
  if (!res.ok) throw new Error('Failed to fetch agents');
  return res.json();
}

export async function getAgent(id: string): Promise<Agent> {
  const res = await fetch(`${API_URL}/api/agents/${id}`);
  if (!res.ok) throw new Error('Failed to fetch agent');
  return res.json();
}

export async function createAgent(data: Partial<Agent>): Promise<Agent> {
  const res = await fetch(`${API_URL}/api/agents/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create agent');
  return res.json();
}

export async function updateAgent(id: string, data: Partial<Agent>): Promise<Agent> {
  const res = await fetch(`${API_URL}/api/agents/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update agent');
  return res.json();
}

export async function deleteAgent(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/agents/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete agent');
}

// Session API
export async function createSession(agentId: string): Promise<Session> {
  const res = await fetch(`${API_URL}/api/agents/${agentId}/sessions`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to create session');
  return res.json();
}

export async function sendMessage(agentId: string, sessionId: string, message: string): Promise<{ response: string }> {
  const res = await fetch(`${API_URL}/api/agents/${agentId}/sessions/${sessionId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

// Campaign API
export async function getCampaigns(): Promise<Campaign[]> {
  const res = await fetch(`${API_URL}/api/campaigns/`);
  if (!res.ok) throw new Error('Failed to fetch campaigns');
  return res.json();
}

export async function getCampaign(id: string): Promise<Campaign> {
  const res = await fetch(`${API_URL}/api/campaigns/${id}`);
  if (!res.ok) throw new Error('Failed to fetch campaign');
  return res.json();
}

export async function createCampaign(data: {
  name: string;
  description?: string;
  agent_id: string;
  email_subject?: string;
  email_template?: string;
}): Promise<Campaign> {
  const res = await fetch(`${API_URL}/api/campaigns/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create campaign');
  return res.json();
}

export async function updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
  const res = await fetch(`${API_URL}/api/campaigns/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update campaign');
  return res.json();
}

export async function deleteCampaign(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/campaigns/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete campaign');
}

export async function addContactsToCampaign(
  campaignId: string,
  contacts: { name: string; email: string; company?: string }[]
): Promise<{ success: boolean; added_count: number; contacts: Contact[] }> {
  const res = await fetch(`${API_URL}/api/campaigns/${campaignId}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contacts }),
  });
  if (!res.ok) throw new Error('Failed to add contacts');
  return res.json();
}

export async function removeContact(campaignId: string, contactId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/campaigns/${campaignId}/contacts/${contactId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to remove contact');
}

export async function sendCampaignEmails(
  campaignId: string,
  contactIds?: string[]
): Promise<{ success: boolean; sent_count: number; total_contacts: number; errors?: any[] }> {
  const res = await fetch(`${API_URL}/api/campaigns/${campaignId}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contact_ids: contactIds }),
  });
  if (!res.ok) throw new Error('Failed to send campaign emails');
  return res.json();
}

export async function getCampaignStats(campaignId: string): Promise<CampaignStats> {
  const res = await fetch(`${API_URL}/api/campaigns/${campaignId}/stats`);
  if (!res.ok) throw new Error('Failed to fetch campaign stats');
  return res.json();
}

export async function validateCallToken(
  campaignId: string,
  callToken: string
): Promise<{ valid: boolean; contact_name: string; contact_email: string; agent_id: string; campaign_name: string }> {
  const res = await fetch(`${API_URL}/api/campaigns/validate-token/${campaignId}/${callToken}`);
  if (!res.ok) throw new Error('Invalid or expired link');
  return res.json();
}

// WebSocket connection for realtime
export function connectRealtime(agentId: string): WebSocket {
  return new WebSocket(`${WS_URL}/api/realtime/ws/${agentId}`);
}
