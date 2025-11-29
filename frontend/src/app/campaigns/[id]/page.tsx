'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Plus, 
  Send, 
  Trash2, 
  Users, 
  Mail, 
  Phone, 
  Calendar,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { 
  getCampaign, 
  addContactsToCampaign, 
  removeContact, 
  sendCampaignEmails,
  getCampaignStats,
  type Campaign,
  type CampaignStats
} from '@/lib/api';
import { toast } from 'sonner';

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [addingContacts, setAddingContacts] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [bulkInput, setBulkInput] = useState('');

  useEffect(() => {
    loadCampaign();
  }, [id]);

  const loadCampaign = async () => {
    try {
      const [campaignData, statsData] = await Promise.all([
        getCampaign(id),
        getCampaignStats(id)
      ]);
      setCampaign(campaignData);
      setStats(statsData);
    } catch (error) {
      toast.error('Failed to load campaign');
      router.push('/campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContacts = async () => {
    if (!bulkInput.trim()) {
      toast.error('Please enter at least one contact');
      return;
    }

    setAddingContacts(true);
    try {
      const lines = bulkInput.trim().split('\n');
      const contacts = lines.map(line => {
        const parts = line.split(',').map(p => p.trim());
        return {
          name: parts[0] || '',
          email: parts[1] || '',
          company: parts[2] || undefined
        };
      }).filter(c => c.name && c.email);

      if (contacts.length === 0) {
        toast.error('No valid contacts found. Format: name,email or name,email,company');
        return;
      }

      const result = await addContactsToCampaign(id, contacts);
      toast.success(`Added ${result.added_count} contacts`);
      setShowAddDialog(false);
      setBulkInput('');
      loadCampaign();
    } catch (error) {
      toast.error('Failed to add contacts');
    } finally {
      setAddingContacts(false);
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    if (!confirm('Remove this contact from the campaign?')) return;
    
    try {
      await removeContact(id, contactId);
      toast.success('Contact removed');
      loadCampaign();
    } catch (error) {
      toast.error('Failed to remove contact');
    }
  };

  const handleSendEmails = async () => {
    if (!campaign?.contacts.length) {
      toast.error('No contacts to send emails to');
      return;
    }

    const pendingCount = campaign.contacts.filter(c => c.status === 'pending').length;
    if (pendingCount === 0) {
      toast.error('No pending contacts to send emails to');
      return;
    }

    if (!confirm(`Send emails to ${pendingCount} pending contacts?`)) return;

    setSending(true);
    try {
      const result = await sendCampaignEmails(id);
      toast.success(`Sent ${result.sent_count} emails`);
      loadCampaign();
    } catch (error) {
      toast.error('Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 -ml-4">
          <Link href="/campaigns">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <p className="text-sm text-muted-foreground">{campaign.description || 'No description'}</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contacts
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Contacts</DialogTitle>
                  <DialogDescription>
                    Add contacts to this campaign. Enter one contact per line.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Contacts (one per line)</Label>
                    <Textarea
                      placeholder="John Doe,john@example.com,Acme Inc&#10;Jane Smith,jane@example.com"
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: name,email or name,email,company
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddContacts} disabled={addingContacts}>
                      {addingContacts && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Contacts
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={handleSendEmails} disabled={sending}>
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Send Emails
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats?.total_contacts || 0}</p>
                <p className="text-sm text-muted-foreground">Total Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Mail className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats?.emails_sent || 0}</p>
                <p className="text-sm text-muted-foreground">Emails Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Phone className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats?.calls_started || 0}</p>
                <p className="text-sm text-muted-foreground">Calls Started</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats?.meetings_booked || 0}</p>
                <p className="text-sm text-muted-foreground">Meetings Booked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
          <CardDescription>
            {campaign.contacts.length} contacts in this campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaign.contacts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No contacts added yet</p>
              <Button variant="outline" onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Contacts
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaign.contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell>{contact.company || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={contact.status === 'meeting_booked' ? 'default' : 'secondary'}>
                        {contact.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveContact(contact.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
