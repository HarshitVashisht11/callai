'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

interface SystemInstructionsEditorProps {
  agentId: string;
  initialInstructions: string;
  onSave: (instructions: string) => Promise<void>;
}

export function SystemInstructionsEditor({
  agentId,
  initialInstructions,
  onSave,
}: SystemInstructionsEditorProps) {
  const [instructions, setInstructions] = useState(initialInstructions);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setInstructions(initialInstructions);
    setHasChanges(false);
  }, [initialInstructions]);

  const handleChange = (value: string) => {
    setInstructions(value);
    setHasChanges(value !== initialInstructions);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(instructions);
      setHasChanges(false);
      toast.success('System instructions saved successfully');
    } catch (error) {
      toast.error('Failed to save system instructions');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">System Instructions</h2>
          <p className="text-sm text-gray-500">Edit the agent&apos;s behavior and test in real-time</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="gap-2 bg-black hover:bg-gray-800"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 p-6">
        <Textarea
          value={instructions}
          onChange={(e) => handleChange(e.target.value)}
          className="h-full min-h-[500px] resize-none font-mono text-sm bg-gray-50 border-gray-200"
          placeholder="Enter system instructions for the agent..."
        />
      </div>
    </div>
  );
}
