'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SystemInstructionsEditor } from '@/components/agent/system-instructions-editor';
import { LiveTestPanel } from '@/components/agent/live-test-panel';
import { getAgent, updateAgent, type Agent } from '@/lib/api';
import { toast } from 'sonner';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgent();
  }, [agentId]);

  const loadAgent = async () => {
    try {
      const data = await getAgent(agentId);
      setAgent(data);
    } catch (error) {
      console.error('Failed to load agent:', error);
      // Use mock data if API is not available
      if (agentId === 'default-agent') {
        setAgent({
          id: 'default-agent',
          name: 'Sales Support Agent',
          description: 'AI-powered sales support and appointment booking agent',
          system_instructions: `## Identity
You are a friendly and professional sales support agent. You help customers with inquiries, schedule meetings, and provide information about products and services.

## Style Guardrails
- Be Concise: Respond succinctly, addressing one topic at most.
- Be Conversational: Use everyday language, making the chat feel like talking to a friend.
- Be Proactive: Lead the conversation, often wrapping up with a question or next-step suggestion.
- Get Clarity: If the user only partially answers a question, keep asking to get clarity.

## Response Guideline
- Adapt and Guess: Try to understand transcripts that may contain transcription errors.
- Stay in Character: Keep conversations within your role's scope.
- Ensure Fluid Dialogue: Respond in a role-appropriate, direct manner.

## Task
1. Greet the customer warmly and ask how you can help.
2. Listen to their needs and provide relevant information.
3. If they want to schedule a meeting, use the booking tools to check availability and book.
4. If you cannot help, offer to transfer to a human agent.
5. Always confirm actions before taking them.`,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        toast.error('Agent not found');
        router.push('/agents');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (instructions: string) => {
    if (!agent) return;
    
    try {
      const updated = await updateAgent(agent.id, { system_instructions: instructions });
      setAgent(updated);
    } catch (error) {
      // Update local state even if API fails
      setAgent({ ...agent, system_instructions: instructions });
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Loading agent...</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Agent not found</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/agents" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-gray-400">/</span>
          <Link href="/agents" className="text-gray-500 hover:text-gray-700">Agents</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium">{agent.name}</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500">Test</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Panel */}
        <div className="flex-1 overflow-auto bg-white">
          <SystemInstructionsEditor
            agentId={agent.id}
            initialInstructions={agent.system_instructions}
            onSave={handleSave}
          />
        </div>

        {/* Live Test Panel */}
        <div className="w-[400px] overflow-hidden">
          <LiveTestPanel
            agentId={agent.id}
            agentName={agent.name}
          />
        </div>
      </div>
    </div>
  );
}
