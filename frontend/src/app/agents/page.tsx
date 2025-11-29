'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AgentCard } from '@/components/agent/agent-card';
import { PlusCircle, Bot } from 'lucide-react';
import { getAgents, deleteAgent, type Agent } from '@/lib/api';
import { toast } from 'sonner';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const data = await getAgents();
      setAgents(data);
    } catch (error) {
      console.error('Failed to load agents:', error);
      // Use mock data if API is not available
      setAgents([{
        id: 'default-agent',
        name: 'Sales Support Agent',
        description: 'AI-powered sales support and appointment booking agent',
        system_instructions: '',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    
    try {
      await deleteAgent(id);
      setAgents(agents.filter(a => a.id !== id));
      toast.success('Agent deleted successfully');
    } catch (error) {
      toast.error('Failed to delete agent');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Loading agents...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-sm text-gray-500">Manage your AI voice agents</p>
        </div>
        <Link href="/agents/create">
          <Button className="gap-2 bg-black hover:bg-gray-800">
            <PlusCircle className="h-4 w-4" />
            Create Agent
          </Button>
        </Link>
      </div>

      {/* Agents Grid */}
      {agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-12">
          <Bot className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">No agents yet</h3>
          <p className="mb-4 text-sm text-gray-500">Create your first AI voice agent to get started</p>
          <Link href="/agents/create">
            <Button className="gap-2 bg-black hover:bg-gray-800">
              <PlusCircle className="h-4 w-4" />
              Create Agent
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard 
              key={agent.id} 
              agent={agent} 
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
