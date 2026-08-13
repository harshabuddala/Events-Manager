'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Play, Users, CheckCircle, XCircle, MessageSquare, Trash2, Edit3 } from 'lucide-react';
import * as xlsx from 'xlsx';
import DashboardLayout from '@/app/components/DashboardLayout';

export default function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const campaignId = unwrappedParams.id;
  const router = useRouter();
  
  const [campaign, setCampaign] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSid, setEditSid] = useState('');

  // Test Run State
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testContacts, setTestContacts] = useState([{ name: '', phone: '' }]);

  const fetchCampaign = async () => {
    const res = await fetch(`/api/campaigns/${campaignId}`);
    if (res.ok) {
      const data = await res.json();
      setCampaign(data.campaign);
      setAnalytics(data.analytics);
      if (!editName) {
        setEditName(data.campaign.name);
        setEditSid(data.campaign.contentSid);
      }
    }
  };

  useEffect(() => {
    fetchCampaign();
    // Setup simple polling for live updates while running
    const interval = setInterval(fetchCampaign, 5000);
    return () => clearInterval(interval);
  }, [campaignId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`/api/campaigns/${campaignId}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      alert(`Successfully uploaded ${data.count} contacts.`);
      fetchCampaign();
    } else {
      const errorData = await res.json();
      alert(`Upload failed: ${errorData.error}`);
    }
    setIsUploading(false);
    e.target.value = '';
  };

  const downloadSampleExcel = () => {
    const data = [
      { 'Name': 'John Doe', 'Phone number': '9876543210' },
      { 'Name': 'Jane Smith', 'Phone number': '9123456780' }
    ];
    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Contacts");
    xlsx.writeFile(wb, "Sample_Contacts.xlsx");
  };

  const handleRunCampaign = async () => {
    if (!confirm('Are you sure you want to run this campaign and send messages to all pending contacts?')) return;
    
    setIsRunning(true);
    const res = await fetch(`/api/campaigns/${campaignId}/run`, {
      method: 'POST',
    });
    
    if (res.ok) {
      alert('Campaign started successfully!');
      fetchCampaign();
    } else {
      alert('Failed to start campaign');
    }
    setIsRunning(false);
  };

  const handleTestRun = async (e: React.FormEvent) => {
    e.preventDefault();
    const validContacts = testContacts.filter(c => c.name.trim() && c.phone.trim());
    if (validContacts.length === 0) {
      alert('Please provide at least one valid name and phone number.');
      return;
    }

    setIsTesting(true);
    const res = await fetch(`/api/campaigns/${campaignId}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts: validContacts })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        alert('Test messages sent successfully!');
      } else {
        alert('Some or all test messages failed to send. Check console or Twilio logs.');
      }
      setIsTestModalOpen(false);
    } else {
      const errorData = await res.json();
      alert(`Test run failed: ${errorData.error}`);
    }
    setIsTesting(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/campaigns/${campaignId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, contentSid: editSid })
    });
    if (res.ok) {
      setIsEditing(false);
      fetchCampaign();
    } else {
      alert('Failed to update campaign');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) return;
    const res = await fetch(`/api/campaigns/${campaignId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/dashboard/campaigns');
    } else {
      alert('Failed to delete campaign');
    }
  };

  if (!campaign) {
    return (
      <DashboardLayout title="Campaign Details" subtitle="Loading...">
        <div className="p-6 text-slate-500">Loading campaign...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={campaign.name} subtitle={`Status: ${campaign.status} | SID: ${campaign.contentSid}`}>
      <div className="p-6">
        <Link href="/dashboard/campaigns" className="inline-flex items-center text-sm text-slate-500 hover:text-violet-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Campaigns
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-medium text-sm"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors font-medium text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
          <div className="flex items-center gap-3">
            <label className={`flex items-center gap-2 px-4 py-2 ${isUploading ? 'bg-slate-200 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200 cursor-pointer'} text-slate-700 rounded-xl transition-colors font-medium`}>
              <Upload className="w-4 h-4" />
              {isUploading ? 'Uploading...' : 'Upload Excel'}
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
            </label>
            <button
              onClick={() => setIsTestModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors font-medium text-sm border border-indigo-200"
            >
              Test Run
            </button>
            <button
              onClick={handleRunCampaign}
              disabled={isRunning || campaign.status === 'RUNNING' || analytics?.pending === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors font-medium text-white ${
                isRunning || campaign.status === 'RUNNING' || analytics?.pending === 0 ? 'bg-violet-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700'
              }`}
            >
              <Play className="w-4 h-4" />
              {campaign.status === 'RUNNING' ? 'Running...' : 'Run Script'}
            </button>
          </div>
        </div>

        {isTestModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Test Campaign</h2>
              <p className="text-sm text-slate-500 mb-4">Send this campaign to specific numbers to verify it looks correct before blasting your list.</p>
              
              <form onSubmit={handleTestRun}>
                <div className="space-y-4 mb-6">
                  {testContacts.map((contact, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Name"
                          value={contact.name}
                          onChange={(e) => {
                            const newContacts = [...testContacts];
                            newContacts[index].name = e.target.value;
                            setTestContacts(newContacts);
                          }}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm mb-2"
                        />
                        <input
                          type="text"
                          placeholder="Phone (e.g. +919876543210)"
                          value={contact.phone}
                          onChange={(e) => {
                            const newContacts = [...testContacts];
                            newContacts[index].phone = e.target.value;
                            setTestContacts(newContacts);
                          }}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        />
                      </div>
                      {testContacts.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => setTestContacts(testContacts.filter((_, i) => i !== index))}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button 
                    type="button"
                    onClick={() => setTestContacts([...testContacts, { name: '', phone: '' }])}
                    className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1"
                  >
                    + Add another contact
                  </button>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsTestModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                    disabled={isTesting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:bg-indigo-400"
                    disabled={isTesting}
                  >
                    {isTesting ? 'Sending...' : 'Send Test Messages'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isEditing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit Campaign</h2>
              <form onSubmit={handleEdit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Twilio Content SID</label>
                  <input
                    type="text"
                    required
                    value={editSid}
                    onChange={(e) => setEditSid(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mb-6 flex justify-end">
          <button onClick={downloadSampleExcel} className="text-sm text-violet-600 hover:underline">
            Download Sample Excel Sheet
          </button>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center"><Users className="w-5 h-5 text-blue-500" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Contacts</p>
              <p className="text-2xl font-bold text-slate-800">{analytics?.total || 0}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-emerald-500" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Sent Messages</p>
              <p className="text-2xl font-bold text-slate-800">{analytics?.sent || 0}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center"><XCircle className="w-5 h-5 text-rose-500" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Failed</p>
              <p className="text-2xl font-bold text-slate-800">{analytics?.failed || 0}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-violet-500" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Brochures Requested</p>
              <p className="text-2xl font-bold text-slate-800">{analytics?.responded || 0}</p>
            </div>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Contact List</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Responded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaign.contacts?.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No contacts uploaded yet.</td></tr>
                ) : (
                  campaign.contacts?.map((contact: any) => (
                    <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{contact.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{contact.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          contact.status === 'SENT' ? 'bg-emerald-100 text-emerald-800' :
                          contact.status === 'FAILED' ? 'bg-rose-100 text-rose-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {contact.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {contact.hasResponded ? <span className="text-violet-600 font-semibold">Yes</span> : 'No'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
