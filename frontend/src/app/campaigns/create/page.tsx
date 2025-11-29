'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createCampaign, getAgents, type Agent } from '@/lib/api';
import { toast } from 'sonner';

export default function CreateCampaignPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    agent_id: '',
    email_subject: 'Exclusive Offer Just For You!',
  });

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const data = await getAgents();
      setAgents(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, agent_id: data[0].id }));
      }
    } catch (error) {
      toast.error('Failed to load agents');
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }

    if (!formData.agent_id) {
      toast.error('Please select an agent');
      return;
    }

    setIsCreating(true);
    try {
      const campaign = await createCampaign({
        name: formData.name,
        description: formData.description,
        agent_id: formData.agent_id,
        email_subject: formData.email_subject,
      });
      
      toast.success('Campaign created successfully');
      router.push(`/campaigns/${campaign.id}`);
    } catch (error) {
      toast.error('Failed to create campaign');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 -ml-4">
          <Link href="/campaigns">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Create Campaign</h1>
        <p className="text-sm text-muted-foreground">Set up a new email campaign with AI-powered voice calls</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>
              Basic information about your campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Q1 Sales Outreach"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this campaign..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent">AI Agent *</Label>
              <Select
                value={formData.agent_id}
                onValueChange={(value: string) => setFormData({ ...formData, agent_id: value })}
                disabled={loadingAgents}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingAgents ? "Loading agents..." : "Select an agent"} />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This agent will handle the voice calls with your contacts
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_subject">Email Subject Line</Label>
              <Input
                id="email_subject"
                placeholder="e.g., Exclusive Offer Just For You!"
                value={formData.email_subject}
                onChange={(e) => setFormData({ ...formData, email_subject: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                This will be the subject of emails sent to your contacts
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/campaigns">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Campaign
          </Button>
        </div>
      </form>
    </div>
  );
}
