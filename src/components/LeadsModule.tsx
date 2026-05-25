/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  User, 
  Clock, 
  Sparkles, 
  Share2, 
  MessageSquare, 
  FileText, 
  Trash2,
  CheckCircle,
  AlertTriangle,
  Send,
  MoreVertical,
  X,
  Volume2,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';
import { Lead, UserProfile, LeadStatus, LeadTemperature, Property, LeadSource } from '../types';

interface LeadsModuleProps {
  leads: Lead[];
  users: UserProfile[];
  properties: Property[];
  currentUser: UserProfile;
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void;
  onAddNote: (leadId: string, text: string) => Promise<void>;
  onTriggerCallBridge: (leadId: string) => void;
  onShareProperty: (leadId: string, propertyId: string, channel: 'WhatsApp' | 'SMS' | 'Email') => void;
  onScheduleFollowup: (followup: { leadId: string; datetime: string; type: string; notes: string }) => void;
  onOpenAddLead: () => void;
  initialFilter?: string; // e.g. "New" or "Hot"
}

export default function LeadsModule({
  leads,
  users,
  properties,
  currentUser,
  onUpdateLead,
  onAddNote,
  onTriggerCallBridge,
  onShareProperty,
  onScheduleFollowup,
  onOpenAddLead,
  initialFilter = ''
}: LeadsModuleProps) {
  
  // UI States
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter === 'New' ? 'New' : '');
  const [tempFilter, setTempFilter] = useState<string>(initialFilter === 'Hot' ? 'Hot' : '');
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  
  const [newNote, setNewNote] = useState('');
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [followupType, setFollowupType] = useState('Call');
  const [followupDatetime, setFollowupDatetime] = useState('');
  const [followupNotes, setFollowupNotes] = useState('');
  
  // Quick Call bridge simulation popup
  const [callSession, setCallSession] = useState<{
    visible: boolean;
    leadId: string | null;
    step: 'ring_agent' | 'connected_agent' | 'dial_client' | 'active_bridge' | 'ended';
    timer: number;
    agentAnswers: boolean;
    clientAnswers: boolean;
  } | null>(null);

  // Property Sharing Selector popup
  const [sharingPropertyId, setSharingPropertyId] = useState<string | null>(null);
  const [shareChannel, setShareChannel] = useState<'WhatsApp' | 'SMS' | 'Email'>('WhatsApp');
  const [shareOverlay, setShareOverlay] = useState(false);

  // AI draft messaging state
  const [aiDraftPrompt, setAiDraftPrompt] = useState('Ask for weekend site visit confirmation');
  const [aiDraftText, setAiDraftText] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  
  const [timeline, setTimeline] = useState<any[]>([]);

  // Reset selected lead when initialFilter changes (for dashboard redirect support)
  useEffect(() => {
    if (initialFilter === 'New') {
      setStatusFilter('New');
      setTempFilter('');
    } else if (initialFilter === 'Hot') {
      setTempFilter('Hot');
      setStatusFilter('');
    }
    setSelectedLeadId(null);
  }, [initialFilter]);

  // Load Timeline
  const activeLead = leads.find(l => l.id === selectedLeadId);
  
  useEffect(() => {
    if (selectedLeadId) {
      fetch(`/api/leads/${selectedLeadId}/timeline`)
        .then(res => res.json())
        .then(data => setTimeline(data || []))
        .catch(err => console.error(err));
    }
  }, [selectedLeadId, leads]);

  // Handle Note Add
  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedLeadId) return;
    await onAddNote(selectedLeadId, newNote);
    setNewNote('');
    // refresh timeline
    const res = await fetch(`/api/leads/${selectedLeadId}/timeline`);
    const data = await res.json();
    setTimeline(data || []);
  };

  // Call Bridge simulation triggers
  const handleStartCallSimulation = (lead: Lead) => {
    onTriggerCallBridge(lead.id);
    
    setCallSession({
      visible: true,
      leadId: lead.id,
      step: 'ring_agent',
      timer: 0,
      agentAnswers: true,
      clientAnswers: true
    });
  };

  useEffect(() => {
    let timerId: any;
    if (callSession && callSession.visible && callSession.step !== 'ended') {
      timerId = setInterval(() => {
        setCallSession(prev => {
          if (!prev) return null;
          
          if (prev.step === 'ring_agent') {
            return { ...prev, step: 'connected_agent', timer: 3 };
          }
          if (prev.step === 'connected_agent') {
            return { ...prev, step: 'dial_client', timer: 6 };
          }
          if (prev.step === 'dial_client') {
            return { ...prev, step: 'active_bridge', timer: 10 };
          }
          if (prev.step === 'active_bridge') {
            if (prev.timer >= 45) {
              return { ...prev, step: 'ended', timer: prev.timer + 1 };
            }
            return { ...prev, timer: prev.timer + 2 };
          }
          return prev;
        });
      }, 3000);
    }
    return () => clearInterval(timerId);
  }, [callSession]);

  // Trigger AI customized message draft
  const handleGenerateAiMessage = async () => {
    if (!selectedLeadId) return;
    setLoadingAi(true);
    setAiDraftText('');
    try {
      const response = await fetch('/api/ai/draft-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedLeadId, templateContext: aiDraftPrompt })
      });
      const data = await response.json();
      if (data.draftedText) {
        setAiDraftText(data.draftedText);
      } else {
        setAiDraftText('Could not generate message content.');
      }
    } catch (e) {
      setAiDraftText('Fallback: Hi! We have a few new exclusive apartments matching your price and sector target. When can we coordinate a short video preview or site visit today?');
    } finally {
      setLoadingAi(false);
    }
  };

  // Send the drafted AI message
  const handleSendDraft = () => {
    if (!selectedLeadId || !aiDraftText) return;
    onShareProperty(selectedLeadId, properties[0].id, shareChannel); // Log it as share event with default first property
    alert(`Success: Message dispatched via ${shareChannel}! Recorded in client timeline logs.`);
    setAiDraftText('');
  };

  // Schedule follow up submission
  const submitFollowUp = () => {
    if (!selectedLeadId || !followupDatetime) return;
    onScheduleFollowup({
      leadId: selectedLeadId,
      datetime: followupDatetime,
      type: followupType,
      notes: followupNotes
    });
    setFollowupDatetime('');
    setFollowupNotes('');
    setShowFollowupModal(false);
    alert('Success: Follow-up action registered.');
  };

  // Automated pricing/location property recommendations
  const recommendedProperties = properties.filter(prop => {
    if (!activeLead) return false;
    // Matches if price is within budget limits (with 15% allowance)
    const budgetAllowanceMax = activeLead.budgetMax * 1.15;
    const budgetAllowanceMin = activeLead.budgetMin * 0.85;
    const matchesPrice = prop.price >= budgetAllowanceMin && prop.price <= budgetAllowanceMax;
    
    // Matches if type or location contains elements
    const matchesType = prop.propertyType === activeLead.propertyType;
    const matchesLocation = prop.location.toLowerCase().includes(activeLead.preferredLocation.toLowerCase()) || 
                            activeLead.preferredLocation.toLowerCase().includes(prop.location.toLowerCase());

    return matchesPrice || matchesType || matchesLocation;
  });

  // Filters calculation
  const filteredLeads = leads.filter(lead => {
    const term = searchQuery.toLowerCase();
    const matchSearch = 
      lead.fullName.toLowerCase().includes(term) || 
      lead.phone.includes(term) || 
      lead.email.toLowerCase().includes(term) ||
      (lead.preferredLocation || '').toLowerCase().includes(term);

    const matchStatus = statusFilter ? lead.status === statusFilter : true;
    const matchTemp = tempFilter ? lead.temperature === tempFilter : true;
    const matchAgent = agentFilter ? lead.assignedAgentId === agentFilter : true;
    const matchSource = sourceFilter ? lead.source === sourceFilter : true;

    return matchSearch && matchStatus && matchTemp && matchAgent && matchSource;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full" id="leads-module-container">
      {/* 1. Left Leads Listing Panel */}
      <div className={`lg:col-span-4 bg-white rounded-2xl border border-slate-100 flex flex-col h-[calc(100vh-140px)] ${selectedLeadId ? 'hidden lg:flex' : 'flex'}`}>
        {/* Panel Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Counseled Leads ({filteredLeads.length})</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Round-robin live allocation</p>
          </div>
          <button 
            id="add-lead-top-btn"
            onClick={onOpenAddLead}
            className="bg-slate-900 hover:bg-slate-800 text-white p-1.5 rounded-xl transition cursor-pointer"
            title="Create Lead Manually"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Search & Mini Filters Bar */}
        <div className="p-3 border-b border-slate-100 space-y-2">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input 
              id="lead-search-input"
              type="text"
              placeholder="Search by name, phone sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 pl-8 pr-3 py-2 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Quick Filters Pill strip */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px]" id="leads-filter-strip">
            {/* Status Selector */}
            <select 
              id="filter-status-select"
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-[10px] text-slate-600 font-semibold focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Interested">Interested</option>
              <option value="Site Visit Scheduled">Site Visit</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
              <option value="Not Responding">No Reply</option>
            </select>

            {/* Temp Selector */}
            <select 
              id="filter-temp-select"
              value={tempFilter} 
              onChange={e => setTempFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-[10px] text-slate-600 font-semibold focus:outline-none"
            >
              <option value="">All Temps</option>
              <option value="Hot">🔥 Hot</option>
              <option value="Warm">⚡ Warm</option>
              <option value="Cold">❄️ Cold</option>
            </select>

            {/* Source filter */}
            <select 
              id="filter-source-select"
              value={sourceFilter} 
              onChange={e => setSourceFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-[10px] text-slate-600 font-semibold focus:outline-none"
            >
              <option value="">All Sources</option>
              <option value="36 Acre">36 Acre</option>
              <option value="MagicBricks">MagicBricks</option>
              <option value="Housing.com">Housing.com</option>
              <option value="Facebook Ads">Facebook</option>
              <option value="Instagram Ads">Instagram</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Manual">Manual</option>
            </select>
          </div>
        </div>

        {/* Lead Rows List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50" id="leads-rows">
          {filteredLeads.map(lead => {
            const agent = users.find(u => u.id === lead.assignedAgentId);
            const isSelected = selectedLeadId === lead.id;

            return (
              <div 
                key={lead.id}
                id={`lead-row-${lead.id}`}
                onClick={() => setSelectedLeadId(lead.id)}
                className={`p-3.5 hover:bg-slate-50/75 transition cursor-pointer flex flex-col gap-2 relative ${
                  isSelected ? 'bg-indigo-50/50 border-r-4 border-indigo-600' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      {lead.fullName}
                      {lead.temperature === 'Hot' && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" title="Hot temperature Lead" />
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{lead.preferredLocation}</p>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded ${
                    lead.status === 'New' ? 'bg-emerald-100 text-emerald-800' :
                    lead.status === 'Won' ? 'bg-green-100 text-green-900 border border-green-200' :
                    lead.status === 'Lost' ? 'bg-rose-100 text-rose-800' :
                    lead.status === 'Negotiation' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {lead.status}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-0.5">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-600">
                    {lead.source}
                  </span>
                  <span className="text-[9px]">
                    Budget: <strong>{(lead.budgetMax / 10000000).toFixed(2)} Cr max</strong>
                  </span>
                </div>

                {/* Agent Assignment bottom preview */}
                <div className="flex justify-between items-center border-t border-slate-50 pt-2 text-[9px] text-slate-400">
                  <span>Owner: {agent ? agent.name : 'Unallocated'}</span>
                  <span>{new Date(lead.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            );
          })}

          {filteredLeads.length === 0 && (
            <div className="text-center py-16 text-slate-400 text-xs">
              No matching counseling leads standard search.
            </div>
          )}
        </div>
      </div>

      {/* 2. Right Actions & Lead Details Detail View Panel */}
      <div className={`lg:col-span-8 flex flex-col h-[calc(100vh-140px)] bg-slate-50 rounded-2xl overflow-hidden ${selectedLeadId ? 'flex' : 'hidden lg:flex justify-center items-center bg-slate-50/50 border border-dashed border-slate-200'}`}>
        {activeLead ? (
          <div className="flex-1 flex flex-col h-full bg-white border border-slate-100 rounded-2xl shadow-xs overflow-y-auto" id="lead-details-card">
            {/* Lead Card Header Panel */}
            <div className="p-4 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedLeadId(null)}
                  className="lg:hidden bg-slate-800 hover:bg-slate-700 text-white p-1 rounded-lg transition"
                >
                  <X size={16} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white tracking-wide">{activeLead.fullName}</h2>
                    {activeLead.temperature === 'Hot' && (
                      <span className="bg-amber-400 text-amber-950 font-black text-[9px] px-1.5 py-0.5 rounded">HOT LEAD</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-300 mt-0.5">Budget Class: {activeLead.propertyType} • {(activeLead.budgetMin / 100000).toFixed(0)}L - {(activeLead.budgetMax / 100000).toFixed(0)}L</p>
                </div>
              </div>
              
              {/* Quick Dials Dials */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button 
                  onClick={() => handleStartCallSimulation(activeLead)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2.5 rounded-xl transition font-black text-xs flex items-center gap-1 cursor-pointer"
                  title="Direct Call Bridge Dialer"
                >
                  <Phone size={13} /> Bridge Call
                </button>
                <a 
                  href={`https://wa.me/${activeLead.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    // Log WhatsApp dispatch event mock
                    onShareProperty(activeLead.id, properties[0]?.id || "prop-1", 'WhatsApp');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl transition font-black text-xs flex items-center gap-1.5 text-center"
                  title="Direct callback on WhatsApp if busy"
                >
                  <MessageSquare size={13} /> WhatsApp Direct
                </a>
              </div>
            </div>

            {/* Quick configuration settings and Details Row */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Status Update Trigger */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase">Lead Progress Status</label>
                <select 
                  id="lead-details-status-select"
                  value={activeLead.status} 
                  onChange={e => onUpdateLead(activeLead.id, { status: e.target.value as LeadStatus })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Interested">Interested</option>
                  <option value="Site Visit Scheduled">Site Visit Scheduled</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Won">Won (Deal Closed)</option>
                  <option value="Lost">Lost</option>
                  <option value="Not Responding">Not Responding</option>
                </select>
              </div>

              {/* Agent Assign Reallocation */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase">Assigned Counselor</label>
                <select 
                  id="lead-details-agent-select"
                  value={activeLead.assignedAgentId} 
                  onChange={e => onUpdateLead(activeLead.id, { assignedAgentId: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700"
                >
                  {users.filter(u => u.role === 'Sales Agent' || u.role === 'Admin / Business Owner').map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role.split(' ')[0]})</option>
                  ))}
                </select>
              </div>

              {/* Temperature Selector */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase">Lead Temperature</label>
                <select 
                  id="lead-details-temp-select"
                  value={activeLead.temperature} 
                  onChange={e => onUpdateLead(activeLead.id, { temperature: e.target.value as LeadTemperature })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700"
                >
                  <option value="Hot">🔥 Hot conversion priority</option>
                  <option value="Warm">⚡ Warm option active</option>
                  <option value="Cold">❄️ Cold lead pool</option>
                </select>
              </div>
            </div>

            {/* Core Action Workspace Tab Sheets */}
            <div className="p-4 flex-1 space-y-6">
              {/* Profile Meta Cards */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 min-w-[150px]">
                  <Phone size={13} className="text-slate-400" />
                  <span>Phone: <strong>{activeLead.phone}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 min-w-[200px]">
                  <Mail size={13} className="text-slate-400" />
                  <span>Email: <strong>{activeLead.email || 'None added'}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-slate-400" />
                  <span>Sector target: <strong>{activeLead.preferredLocation}</strong></span>
                </div>
              </div>

              {/* 1. Send Property brochure one-click dispatch panel */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Share2 size={14} className="text-indigo-500" />
                  Instant Property Sharing & Recommendations
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="recommended-properties-grid">
                  {recommendedProperties.slice(0, 2).map(prop => (
                    <div key={prop.id} className="border border-slate-100 rounded-xl p-3.5 space-y-3.5 bg-slate-50 hover:border-indigo-100 hover:bg-indigo-50/20 transition">
                      <div className="space-y-1">
                        <span className="text-[10px] bg-slate-200 font-extrabold px-1.5 py-0.5 rounded">
                          {prop.propertyType}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800">{prop.title}</h4>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <MapPin size={10} /> {prop.location} • <strong>INR {(prop.price / 10000000).toFixed(2)} Cr</strong>
                        </p>
                      </div>

                      {/* Share Click Actions */}
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => {
                            onShareProperty(activeLead.id, prop.id, 'WhatsApp');
                            alert('Success: Sent brochure link to client via EstateFlow WhatsApp sender.');
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 px-2 rounded-lg transition"
                        >
                          Send WhatsApp
                        </button>
                        <button 
                          onClick={() => {
                            onShareProperty(activeLead.id, prop.id, 'Email');
                            alert('Success: Dispatched HTML marketing mail package.');
                          }}
                          className="flex-1 bg-slate-900 border border-slate-200 text-white text-[10px] font-bold py-1.5 px-2 rounded-lg transition"
                        >
                          Send Email
                        </button>
                      </div>
                    </div>
                  ))}

                  {recommendedProperties.length === 0 && (
                    <div className="col-span-2 text-center py-4 bg-slate-50 rounded-xl text-xs text-slate-400">
                      No matching properties cataloged matching this tier.
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Interactive AI customized draft helper using Gemini */}
              <div className="bg-slate-900 p-4 rounded-xl text-white space-y-3 shadow-md" id="ai-copywriter-sandbox">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald-400 animate-pulse" />
                    AI Followup Assistant (Gemini)
                  </h3>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                    Server Side Grounded
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] text-slate-300">
                    Draft a custom WhatsApp or SMS client outreach message. Select context goals:
                  </p>
                  
                  <div className="flex gap-1.5">
                    <input 
                      id="ai-prompt-input"
                      type="text" 
                      value={aiDraftPrompt}
                      onChange={e => setAiDraftPrompt(e.target.value)}
                      placeholder="e.g. Schedule a Marbella villa walkthrough..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                    />
                    <button 
                      id="draft-ai-message-btn"
                      onClick={handleGenerateAiMessage}
                      disabled={loadingAi}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      {loadingAi ? 'AI Drafting...' : 'Gemini Draft'}
                    </button>
                  </div>
                </div>

                {/* Response area */}
                {aiDraftText && (
                  <div className="bg-slate-850 p-3 rounded-lg border border-slate-700 space-y-2.5">
                    <textarea 
                      id="ai-draft-content"
                      value={aiDraftText}
                      onChange={e => setAiDraftText(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-800 border-none text-[11px] leading-relaxed text-slate-100 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                    
                    <div className="flex justify-between items-center">
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setShareChannel('WhatsApp')}
                          className={`text-[10px] px-2 py-1 rounded ${shareChannel === 'WhatsApp' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-700 text-slate-300'}`}
                        >
                          WhatsApp Sender
                        </button>
                        <button 
                          onClick={() => setShareChannel('SMS')}
                          className={`text-[10px] px-2 py-1 rounded ${shareChannel === 'SMS' ? 'bg-slate-500 text-white font-bold' : 'bg-slate-700 text-slate-300'}`}
                        >
                          SMS Sender
                        </button>
                      </div>
                      <button 
                        onClick={handleSendDraft}
                        className="bg-emerald-400 hover:bg-emerald-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-lg transition flex items-center gap-1"
                      >
                        <Send size={12} /> Send Now
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Manual timeline additions & action logs list */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Clock size={14} className="text-slate-500" />
                    Timeline & History Log
                  </h3>
                  <button 
                    onClick={() => setShowFollowupModal(true)}
                    className="text-[11px] text-indigo-600 font-bold hover:underline"
                  >
                    + Schedule Followup
                  </button>
                </div>

                {/* Add dynamic manual Note Box */}
                <form onSubmit={handleSubmitNote} className="flex gap-2">
                  <input 
                    id="add-note-input"
                    type="text" 
                    placeholder="Type counselor note to add to patient sheet..."
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none placeholder:text-slate-400"
                  />
                  <button 
                    id="add-note-submit-btn"
                    type="submit"
                    className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    Add
                  </button>
                </form>

                {/* Timeline items list */}
                <div className="relative pl-3 border-l border-slate-100 space-y-3.5 mt-2">
                  {timeline.map((act) => (
                    <div key={act.id} className="relative text-xs">
                      {/* marker dot icon */}
                      <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full border border-white bg-slate-400" />
                      <div className="flex justify-between items-start text-xs">
                        <span className="font-bold text-slate-800 leading-tight block">{act.title}</span>
                        <span className="text-[9px] text-slate-400">{new Date(act.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-500 mt-1 max-w-xl">{act.description}</p>
                    </div>
                  ))}

                  {timeline.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs italic">
                      Zero counseling notes, calls, or dispatch records registered yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
            <User size={48} className="text-slate-200 border-2 border-dashed border-slate-200 p-2.5 rounded-full" />
            <div className="text-center">
              <h3 className="text-slate-700 font-bold text-sm">Select Counseling Candidate Sheet</h3>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs px-4">Choose a client from the left-hand panel list or trigger webhook logs to evaluate round robin auto-routing.</p>
              <button 
                onClick={onOpenAddLead} 
                className="mt-4 bg-slate-900 text-white text-xs font-bold py-1.5 px-3 rounded-lg"
              >
                + Create New Lead
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CALL DIALER POPUP MODAL (CONNECT BRIDGE SIMULATION) */}
      {callSession && callSession.visible && (
        <div className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl max-w-sm w-full text-center space-y-5" id="call-bridge-modal">
            <div className="mx-auto bg-emerald-500/10 p-3 rounded-full w-12 h-12 flex items-center justify-center">
              <Volume2 className="text-emerald-400 animate-bounce" size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-100">Twilio Bridge Connect</h3>
              <p className="text-xs text-slate-400">Step sequence tracker (Dry-run mode)</p>
            </div>

            {/* Simulated Sequence track */}
            <div className="text-xs leading-relaxed py-3 px-3 bg-slate-950/50 rounded-xl border border-slate-800 text-slate-300">
              {callSession.step === 'ring_agent' && (
                <div className="space-y-1.5">
                  <p className="text-amber-400 font-bold animate-pulse">Dialing Sales agent first...</p>
                  <p className="text-[10px] text-slate-400">Target phone: +91 99999-00003</p>
                </div>
              )}
              {callSession.step === 'connected_agent' && (
                <div className="space-y-1.5">
                  <p className="text-emerald-400 font-bold">✔ Counselor Arjun Kumar Connected</p>
                  <p className="text-[10px] text-slate-400">“New 36 Acre property lead. Press any key to bind connection with Rahul Sharma.”</p>
                </div>
              )}
              {callSession.step === 'dial_client' && (
                <div className="space-y-1.5">
                  <p className="text-indigo-400 font-bold animate-pulse">Arjun accepted. Dialing client Rahul Sharma...</p>
                  <p className="text-[10px] text-slate-400">Target routing: +91 99999-99999</p>
                </div>
              )}
              {callSession.step === 'active_bridge' && (
                <div className="space-y-2">
                  <p className="text-emerald-500 font-bold animate-pulse">● Live Conference Bridged Successfully</p>
                  <p className="text-[11px] text-slate-350">Agent and Client are talking in conference room DLF_CONF_8.</p>
                  <p className="text-[10px] text-indigo-300 font-semibold font-mono">Elapsed elapsed time: {callSession.timer} seconds</p>
                </div>
              )}
              {callSession.step === 'ended' && (
                <div className="space-y-1">
                  <p className="text-slate-400 font-bold">Bridge terminated or saved.</p>
                  <p className="text-[10px] text-xs text-emerald-400 font-semibold mt-1">Status logged: Spoke to client successfully.</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              {callSession.step !== 'ended' ? (
                <button 
                  onClick={() => setCallSession(prev => prev ? { ...prev, step: 'ended' } : null)}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 rounded-xl transition cursor-pointer"
                >
                  Hang Up Call
                </button>
              ) : (
                <button 
                  onClick={() => setCallSession(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 rounded-xl"
                >
                  Close Manager Window
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE FOLLOWUP MODAL */}
      {showFollowupModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-slate-100" id="followup-scheduler-modal">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Schedule Lead Action Checklist</h3>
              <button onClick={() => setShowFollowupModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Action Type</label>
                <select 
                  id="followup-type-select"
                  value={followupType} 
                  onChange={e => setFollowupType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                >
                  <option value="Call">Call Back Reminder</option>
                  <option value="WhatsApp">WhatsApp Touchpoint</option>
                  <option value="SMS">SMS Notification Drop</option>
                  <option value="Site Visit">Site Visit Guided Walkthrough</option>
                  <option value="Email">Email Marketing Brochure</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Target Date & Time</label>
                <input 
                  id="followup-time-input"
                  type="datetime-local" 
                  value={followupDatetime}
                  onChange={e => setFollowupDatetime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Specific Guidelines Note</label>
                <textarea 
                  id="followup-notes-input"
                  value={followupNotes}
                  onChange={e => setFollowupNotes(e.target.value)}
                  placeholder="Need to review floor registry authorization..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                />
              </div>
            </div>

            <button 
              id="confirm-followup-btn"
              onClick={submitFollowUp}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl transition"
            >
              Verify & Add Schedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
