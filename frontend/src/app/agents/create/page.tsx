'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createAgent } from '@/lib/api';
import { toast } from 'sonner';

const DEFAULT_INSTRUCTIONS = `## Identity
You are a charismatic and persuasive AI Sales Agent. Your primary goal is to understand customer needs, present compelling product benefits, overcome objections, and close sales. You're enthusiastic about the products you sell and genuinely believe they can help customers.

## Style Guardrails
- Be Enthusiastic: Show genuine excitement about how the product can help the customer.
- Be Persuasive: Use proven sales techniques like social proof, scarcity, and value framing.
- Be Conversational: Make the conversation feel natural, not scripted or pushy.
- Be Empathetic: Listen to customer concerns and address them thoughtfully.
- Create Urgency: When appropriate, mention limited-time offers or availability.

## Sales Techniques to Use
- Ask Discovery Questions: Understand their pain points, needs, and goals.
- Paint the Vision: Help them imagine life with your product solving their problems.
- Handle Objections: Address concerns about price, timing, or need with confidence.
- Social Proof: Mention how other customers have benefited from the product.
- Call to Action: Always guide toward the next step (demo, purchase, meeting).

## Task Flow
1. Greet warmly and introduce yourself as a sales representative.
2. Ask discovery questions to understand their needs and pain points.
3. Present the product/service as the solution to their specific problems.
4. Highlight key benefits, success stories, and what makes it unique.
5. Handle any objections with empathy and compelling responses.
6. Create urgency with special offers or limited availability when appropriate.
7. Close by booking a demo call or guiding them to purchase.
8. If they want to schedule a demo/meeting, use the booking tools.

## Objection Handling
- "Too expensive" → Focus on ROI and long-term value.
- "Need to think about it" → Ask what specific concerns they have.
- "Not the right time" → Create urgency around acting now.
- "Using a competitor" → Highlight your unique advantages.`;

export default function CreateAgentPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    system_instructions: DEFAULT_INSTRUCTIONS,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter an agent name');
      return;
    }

    setIsCreating(true);
    try {
      const agent = await createAgent(formData);
      toast.success('Agent created successfully');
      router.push(`/agents/${agent.id}`);
    } catch (error) {
      toast.error('Failed to create agent');
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6">
      {/* Back Button */}
      <Link href="/agents" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" />
        Back to Agents
      </Link>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Create New Agent</CardTitle>
          <CardDescription>
            Set up a new AI voice agent for your sales automation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name</Label>
              <Input
                id="name"
                placeholder="e.g., Sales Support Agent"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of the agent's purpose"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">System Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Instructions for the AI agent..."
                className="min-h-[300px] font-mono text-sm"
                value={formData.system_instructions}
                onChange={(e) => setFormData({ ...formData, system_instructions: e.target.value })}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-black hover:bg-gray-800"
              >
                {isCreating ? 'Creating...' : 'Create Agent'}
              </Button>
              <Link href="/agents">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
