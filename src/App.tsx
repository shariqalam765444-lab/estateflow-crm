/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Users, 
  Clock, 
  Calendar, 
  MoreHorizontal, 
  Plus, 
  Bell, 
  Check, 
  X, 
  Sparkles, 
  PhoneCall, 
  Award,
  BookOpen,
  Mic,
  Send,
  Phone,
  MessageSquare,
  Layers,
  ShieldAlert
} from 'lucide-react';

import { Lead, Property, UserProfile, DashboardStats, Activity, Notification, FollowUp, Organization } from './types';
import Dashboard from './components/Dashboard';
import LeadsModule from './components/LeadsModule';
import PropertiesModule from './components/PropertiesModule';
import FollowUpsModule from './components/FollowUpsModule';
import MoreModule from './components/MoreModule';
import ContactsModule from './components/ContactsModule';
import SuperAdminPanel from './components/SuperAdminPanel';

export default function App() {
  // Global tab levels
  const [activeTab, setActiveTab] = useState('dashboard');
  const [moreSubview, setMoreSubview] = useState('attendance');
  const [leadsFilterRedirect, setLeadsFilterRedirect] = useState('');

  // Multi-tenant Dynamic SaaS States
  const [activeOrgId, setActiveOrgId] = useState<string>('org-estateflow-1');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isSuperAdminMode, setIsSuperAdminMode] = useState<boolean>(false);

  // Domain state layers
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    newLeadsToday: 0,
    callsToday: 0,
    followupsDueToday: 0,
    hotLeadsCount: 0,
    siteVisitsScheduledCount: 0,
    availableInventoryCount: 0,
    presentAgentsCount: 0
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [followups, setFollowups] = useState<FollowUp[]>([]);

  // Testing user simulation switch state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Notification drawer state
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);

  // Add manual lead modal state
  const [showAddLead, setShowAddLead] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSource, setLeadSource] = useState('36 Acre');
  const [leadProp, setLeadProp] = useState('Apartment');
  const [leadBudgetMin, setLeadBudgetMin] = useState('3500000');
  const [leadBudgetMax, setLeadBudgetMax] = useState('8500000');
  const [leadLocation, setLeadLocation] = useState('Sector 54, Gurgaon');
  const [leadTemp, setLeadTemp] = useState('Hot');
  const [leadNotes, setLeadNotes] = useState('');

  // Floating AI Co-Pilot state
  const [showAiCopilot, setShowAiCopilot] = useState(false);
  const [copilotPrompt, setCopilotPrompt] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<Array<{ sender: 'agent' | 'copilot'; text: string; timestamp: Date; action?: string }>>([
    {
      sender: 'copilot',
      text: 'Hello! I am your AI CRM Co-Pilot. Tell me or type what you would like to do. (e.g. "Create a hot lead Rohit Sharma phone +919875550000" or "Schedule site visit with Rahul Sharma next Monday" or "Add a note to Vikram Grover regarding current quote")',
      timestamp: new Date()
    }
  ]);

  const startSpeechListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Your browser does not support Speech Recognition. Please type your query in the input field!');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setCopilotPrompt(speechToText);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSendCopilotCommand = async (customText?: string) => {
    const textToSend = customText || copilotPrompt;
    if (!textToSend.trim()) return;

    // Append agent message
    const userMsg = {
      sender: 'agent' as const,
      text: textToSend,
      timestamp: new Date()
    };
    setCopilotMessages(prev => [...prev, userMsg]);
    setCopilotPrompt('');
    setCopilotLoading(true);

    try {
     try {
  const response = await fetch('https://estateflow-crm-production-c127.up.railway.app/api/ai/process-command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: textToSend,
      userId: currentUser?.id,
      organizationId: activeOrgId
    })
  });

      if (response.ok) {
        const result = await response.json();
        
        // Append copilot response
        setCopilotMessages(prev => [...prev, {
          sender: 'copilot',
          text: result.explanation || "Action matched and incorporated successfully into CRM pipeline.",
          timestamp: new Date(),
          action: result.action
        }]);

        // Refresh all elements
        await refreshCRMData();
      } else {
        const error = await response.json();
        setCopilotMessages(prev => [...prev, {
          sender: 'copilot',
          text: `Oops, I encountered an error: ${error.error || "Please try again."}`,
          timestamp: new Date()
        }]);
      }
    } catch (err: any) {
      console.error(err);
      setCopilotMessages(prev => [...prev, {
        sender: 'copilot',
        text: `Network failure while executing your request: ${err.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Fetch all domain elements from Express backend isolating by activeOrgId
  const refreshCRMData = async () => {
    try {
      const orgQuery = activeOrgId ? `?organizationId=${activeOrgId}` : '';
      const [rLeads, rUsers, rProps, rStats, rActs, rNotifs, rFups, rOrgs] = await Promise.all([
        fetch(`/api/leads${orgQuery}`).then(res => res.json()),
        fetch(`/api/users${orgQuery}`).then(res => res.json()),
        fetch(`/api/properties${orgQuery}`).then(res => res.json()),
        fetch(`/api/stats${orgQuery}`).then(res => res.json()),
        fetch(`/api/activities${orgQuery}`).then(res => res.json()),
        fetch(`/api/notifications${orgQuery}`).then(res => res.json()),
        fetch(`/api/followups${orgQuery}`).then(res => res.json()),
        fetch('/api/saas/agencies').then(res => res.json())
      ]);

      setLeads(rLeads || []);
      setUsers(rUsers || []);
      setProperties(rProps || []);
      setStats(rStats || {});
      setActivities(rActs || []);
      setNotifications(rNotifs || []);
      setFollowups(rFups || []);
      setOrganizations(rOrgs || []);

      // Autofill default active current user if not configured or matches another org
      if (rUsers && rUsers.length > 0) {
        const hasMatchingActiveUser = currentUser && rUsers.some((u: any) => u.id === currentUser.id);
        if (!hasMatchingActiveUser) {
          const adminUser = rUsers.find((u: any) => u.role.includes('Owner') || u.role.includes('Admin')) || rUsers[0];
          setCurrentUser(adminUser);
        }
      }
    } catch (e) {
      console.error('API Sync Error:', e);
    }
  };

  // Poll database inputs periodically to ensure simulated bridges sync
  useEffect(() => {
    refreshCRMData();
    const interval = setInterval(() => {
      refreshCRMData();
    }, 4500); // 4.5 seconds poll
    return () => clearInterval(interval);
  }, []);

  // Handle manual lead creations
  const handleCreateLeadManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadPhone) {
      alert('Candidate full name and phone number is required.');
      return;
    }

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: leadName,
          phone: leadPhone,
          email: leadEmail,
          source: leadSource,
          propertyType: leadProp,
          budgetMin: Number(leadBudgetMin),
          budgetMax: Number(leadBudgetMax),
          preferredLocation: leadLocation,
          temperature: leadTemp,
          notes: leadNotes
        })
      });

      if (response.ok) {
        alert('Success: Lead added. Assigned using round robin and Twilio Bridge initiated!');
        
        // Reset states
        setLeadName('');
        setLeadPhone('');
        setLeadEmail('');
        setLeadNotes('');
        setShowAddLead(false);
        
        await refreshCRMData();
        // Redirect to leads tab to see allocation
        setActiveTab('leads');
        setLeadsFilterRedirect('New');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Lead update action
  const handleUpdateLeadParameters = (leadId: string, updates: Partial<Lead>) => {
    fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    .then(res => {
      if (res.ok) refreshCRMData();
    });
  };

  // Note addition action
  const handleAddTimelineNote = async (leadId: string, text: string) => {
    await fetch(`/api/leads/${leadId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, userId: currentUser?.id })
    });
    refreshCRMData();
  };

  // Manual Twilio bridge command
  const handleManualCallBridge = (leadId: string) => {
    fetch('/api/calls/bridge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId })
    })
    .then(() => refreshCRMData());
  };

  // Property dispatch action 
  const handleSharePropertyBypass = (leadId: string, propertyId: string, channel: 'WhatsApp' | 'SMS' | 'Email') => {
    fetch('/api/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, propertyId, agentId: currentUser?.id, channel })
    })
    .then(() => refreshCRMData());
  };

  // Schedule followup tasks
  const handleScheduleFollowup = (data: { leadId: string; datetime: string; type: string; notes: string }) => {
    fetch('/api/followups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        agentId: currentUser?.id
      })
    })
    .then(() => refreshCRMData());
  };

  // Team Invite action callback
  const handleInviteUserCallback = (userObj: any) => {
    fetch('/api/users/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userObj)
    })
    .then(() => refreshCRMData());
  };

  // Complete touchpoint
  const handleCompleteFollowupMet = (id: string) => {
    fetch(`/api/followups/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(() => refreshCRMData());
  };

  // Snooze touchpoint
  const handleSnoozeFollowupMet = (id: string, newTime: string) => {
    fetch(`/api/followups/${id}/snooze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newTime })
    })
    .then(() => refreshCRMData());
  };

  // Mark all notifications read
  const handleClearNotifications = () => {
    fetch('/api/notifications/read', { method: 'POST' })
      .then(() => {
        refreshCRMData();
        setShowNotifDrawer(false);
      });
  };

  // Deep Link tab navigation redirects
  const handleDashboardNavigateRedirect = (tab: string, subFilters?: string) => {
    setActiveTab(tab);
    if (tab === 'leads' && subFilters) {
      setLeadsFilterRedirect(subFilters);
    } else if (tab === 'more' && subFilters) {
      setMoreSubview(subFilters);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-500 font-medium text-xs">
        Connecting EstateFlow server resources...
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const activeOrg = organizations.find(o => o.id === activeOrgId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" id="crm-app-shell">
      {/* Dynamic White Label Color Styles Injection */}
      <style>{`
        :root {
          --brand-primary: ${activeOrg?.primaryColor || '#008069'};
          --brand-secondary: ${activeOrg?.secondaryColor || '#1e293b'};
        }
        /* Custom buttons style override */
        .btn-brand-primary {
          background-color: var(--brand-primary) !important;
          color: white !important;
        }
        .btn-brand-primary:hover {
          opacity: 0.9;
        }
        .text-brand-primary {
          color: var(--brand-primary) !important;
        }
        .bg-brand-primary {
          background-color: var(--brand-primary) !important;
        }
        .border-brand-primary {
          border-color: var(--brand-primary) !important;
        }
      `}</style>
      
      {/* 1. TOP STATIC WORKSPACE CONTROLS BAR (Branding and Tester identity) */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-40 shadow-xs flex justify-between items-center" id="crm-header-nav">
        <div className="flex items-center gap-2">
          {activeOrg?.logoUrl ? (
            <img 
              src={activeOrg.logoUrl} 
              className="h-8 max-w-[120px] object-contain rounded" 
              alt={activeOrg.name} 
              referrerPolicy="no-referrer" 
            />
          ) : (
            <span 
              className="p-2 text-white rounded-xl font-black text-xs tracking-wider uppercase flex items-center justify-center min-w-[34px]"
              style={{ backgroundColor: activeOrg?.primaryColor || '#008069' }}
            >
              {activeOrg?.appName?.substring(0, 2).toUpperCase() || 'EF'}
            </span>
          )}
          <div>
            <h1 className="text-xs font-black tracking-tight text-slate-900 uppercase">
              {activeOrg?.appName || 'EstateFlow CRM'}
            </h1>
            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
              {activeOrg?.name || 'Mobile First Edition'} ({activeOrg?.subscriptionPlan || 'Free'})
            </p>
          </div>
        </div>

        {/* Dynamic Testing User switcher and SaaS controllers */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* SaaS Controller Switch Toggle */}
          <button 
            id="saas-super-admin-toggle"
            onClick={() => setIsSuperAdminMode(prev => !prev)}
            className={`text-[9px] font-black uppercase tracking-wide px-2.5 py-1.5 rounded-xl transition cursor-pointer shrink-0 border border-slate-200 flex items-center gap-1 ${
              isSuperAdminMode 
                ? 'bg-indigo-600 text-white border-transparent shadow' 
                : 'bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Layers size={11} />
            <span className="hidden sm:inline">{isSuperAdminMode ? '👑 Super Admin Console' : '🏢 SaaS Workspace'}</span>
            <span className="inline sm:hidden">{isSuperAdminMode ? 'Super' : 'SaaS'}</span>
          </button>

          <div className="relative">
            <select 
              id="role-identity-dropdown"
              value={currentUser.id}
              onChange={e => {
                const target = users.find(u => u.id === e.target.value);
                if (target) {
                  setCurrentUser(target);
                  alert(`Testing Mode: Active role identity changed to [${target.name}] as [${target.role}].`);
                }
              }}
              className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1.5 rounded-xl focus:outline-none cursor-pointer"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role?.split(' ')[0] || 'Agent'})</option>
              ))}
            </select>
          </div>

          {/* Quick Notifications bell */}
          <button 
            id="notif-drawer-bell"
            onClick={() => setShowNotifDrawer(true)} 
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition relative cursor-pointer"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-extrabold text-[8px] h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 2. CORE WORKSPACE CONTENT PANEL */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 pb-24" id="crm-workspace">
        {activeOrg?.status === 'Suspended' && !isSuperAdminMode ? (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-rose-100 shadow-xl max-w-lg mx-auto text-center space-y-4 my-10 animate-slideUp" id="agency-suspended-blocker">
            <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="text-rose-600" size={32} />
            </div>
            <h2 className="text-lg font-black text-slate-900">Workspace Suspended</h2>
            <p className="text-xs text-slate-505 leading-normal">
              Access to this white-label agency platform (<strong>{activeOrg.appName || activeOrg.name}</strong>) has been restricted by the system administrator due to billing issues.
            </p>
            <div className="bg-slate-50 p-4 rounded-xl text-left text-xs text-slate-600 border border-solid border-slate-100 space-y-2">
              <strong className="block text-slate-800 font-bold uppercase tracking-wider text-[10px]">Payment Required:</strong>
              <p>Under the <strong>{activeOrg.subscriptionPlan} Plan</strong>, automatic renewal failed on the registered payment method.</p>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-400">
                💡 <strong>Tester Tip:</strong> Click the <strong>👑 Super Admin Console</strong> button in the top navigation strip bar, select another agency or toggle London Head Office to active, or adjust this agency's status back to Active.
              </div>
            </div>
          </div>
        ) : isSuperAdminMode ? (
          <SuperAdminPanel 
            onRefreshAllData={refreshCRMData}
            activeOrgId={activeOrgId}
            onSelectOrg={(orgId) => {
              setActiveOrgId(orgId);
              // auto refresh
              setTimeout(() => refreshCRMData(), 200);
            }}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard 
                stats={stats}
                activities={activities}
                currentUser={currentUser}
                leads={leads}
                onNavigate={handleDashboardNavigateRedirect}
                onOpenAddLead={() => setShowAddLead(true)}
                onTriggerAiAssistant={() => setShowAiCopilot(true)}
              />
            )}

            {activeTab === 'leads' && (
              <LeadsModule 
                leads={leads}
                users={users}
                properties={properties}
                currentUser={currentUser}
                onUpdateLead={handleUpdateLeadParameters}
                onAddNote={handleAddTimelineNote}
                onTriggerCallBridge={handleManualCallBridge}
                onShareProperty={handleSharePropertyBypass}
                onScheduleFollowup={handleScheduleFollowup}
                onOpenAddLead={() => setShowAddLead(true)}
                initialFilter={leadsFilterRedirect}
              />
            )}

            {activeTab === 'properties' && (
              <PropertiesModule 
                properties={properties}
                leads={leads}
                currentUser={currentUser}
                onAddProperty={(prop) => {
                  fetch('/api/properties', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...prop, organizationId: activeOrgId })
                  }).then(async (res) => {
                    if (res.ok) {
                      refreshCRMData();
                    } else {
                      const err = await res.json();
                      alert(`Billing Threshold Restriction: ${err.error || 'Check plans limits.'}`);
                    }
                  });
                }}
                onShareProperty={handleSharePropertyBypass}
              />
            )}

            {activeTab === 'followups' && (
              <FollowUpsModule 
                followups={followups}
                leads={leads}
                users={users}
                onCompleteFollowup={handleCompleteFollowupMet}
                onSnoozeFollowup={handleSnoozeFollowupMet}
              />
            )}

            {activeTab === 'contacts' && (
              <ContactsModule 
                currentUser={currentUser}
                onRefreshActivities={refreshCRMData}
              />
            )}

            {activeTab === 'more' && (
              <MoreModule
                properties={properties}
                users={users}
                currentUser={currentUser!}
                subview={moreSubview}
                onSetSubview={setMoreSubview}
                activeOrg={activeOrg!}
                organizations={organizations}
                onRefreshAllData={refreshCRMData}
                leads={leads}
                onInviteUser={(userObj) => {
                  fetch('/api/users/invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...userObj, organizationId: activeOrgId })
                  }).then(async (res) => {
                    if (res.ok) {
                      refreshCRMData();
                    } else {
                      const err = await res.json();
                      alert(`Subscription Limit Warn: ${err.error}`);
                    }
                  });
                }}
              />
            )}
          </>
        )}
      </main>

      {/* 3. MOBILE BOTTOM NAVIGATION STRIP BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 z-40 flex justify-around items-center text-center shadow-lg sm:max-w-md sm:mx-auto sm:border sm:rounded-full sm:bottom-4 sm:shadow-xl" id="bottom-navigation-bar">
        <button 
          id="nav-tab-dashboard"
          onClick={() => { setActiveTab('dashboard'); setLeadsFilterRedirect(''); }}
          className={`flex-1 flex flex-col items-center py-1 transition ${activeTab === 'dashboard' ? 'text-slate-900 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Home size={18} />
          <span className="text-[10px] uppercase font-bold mt-1 tracking-tight">Home</span>
        </button>

        <button 
          id="nav-tab-leads"
          onClick={() => { setActiveTab('leads'); setLeadsFilterRedirect(''); }}
          className={`flex-1 flex flex-col items-center py-1 transition ${activeTab === 'leads' ? 'text-slate-900 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Users size={18} />
          <span className="text-[10px] uppercase font-bold mt-1 tracking-tight font-sans">Leads</span>
        </button>

        <button 
          id="nav-tab-properties"
          onClick={() => { setActiveTab('properties'); setLeadsFilterRedirect(''); }}
          className={`flex-1 flex flex-col items-center py-1 transition ${activeTab === 'properties' ? 'text-slate-900 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Award size={18} />
          <span className="text-[10px] uppercase font-bold mt-1 tracking-tight">Hot Estates</span>
        </button>

        <button 
          id="nav-tab-followups"
          onClick={() => { setActiveTab('followups'); setLeadsFilterRedirect(''); }}
          className={`flex-1 flex flex-col items-center py-1 transition ${activeTab === 'followups' ? 'text-slate-900 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Calendar size={18} />
          <span className="text-[10px] uppercase font-bold mt-1 tracking-tight">Schedules</span>
        </button>

        <button 
          id="nav-tab-contacts"
          onClick={() => { setActiveTab('contacts'); setLeadsFilterRedirect(''); }}
          className={`flex-1 flex flex-col items-center py-1 transition ${activeTab === 'contacts' ? 'text-slate-950 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <MessageSquare size={18} className={activeTab === 'contacts' ? 'text-emerald-600' : ''} />
          <span className="text-[10px] uppercase font-bold mt-1 tracking-tight">WhatsApp</span>
        </button>

        <button 
          id="nav-tab-more"
          onClick={() => { setActiveTab('more'); setMoreSubview('attendance'); }}
          className={`flex-1 flex flex-col items-center py-1 transition ${activeTab === 'more' ? 'text-slate-900 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <MoreHorizontal size={18} />
          <span className="text-[10px] uppercase font-bold mt-1 tracking-tight">More</span>
        </button>
      </nav>

      {/* 4. NOTIFICATION FEED SIDE DRAWER */}
      {showNotifDrawer && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex justify-end" id="notif-drawer-overlay">
          <div className="bg-white max-w-sm w-full h-full p-5 flex flex-col shadow-2xl relative" id="notif-drawer">
            <div className="flex justify-between items-center border-b border-solid border-slate-100 pb-3">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-800">Notifications Feed ({notifications.length})</h3>
              <button 
                onClick={() => setShowNotifDrawer(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Notification Cards list */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
              {notifications.map(n => (
                <div key={n.id} className={`p-3 rounded-xl border border-solid text-xs text-slate-650 ${n.isRead ? 'bg-slate-50 border-slate-100' : 'bg-indigo-50/40 border-indigo-100'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{n.title}</span>
                    <span className="text-[9px] text-slate-400">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{n.description}</p>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs italic">
                  Zero notifications received.
                </div>
              )}
            </div>

            <button 
              id="clear-all-notifs-btn"
              onClick={handleClearNotifications}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition"
            >
              Mark all notifications read
            </button>
          </div>
        </div>
      )}

      {/* 5. ADD MANUAL LEAD BOTTOM DRAWER OR MODAL */}
      {showAddLead && (
        <div className="fixed inset-0 bg-slate-900/65 z-50 flex items-center justify-center p-4" id="add-lead-modal-overlay">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4 shadow-xl border border-slate-100" id="add-lead-form-modal">
            <div className="flex justify-between items-center border-b border-solid border-slate-100 pb-2">
              <h3 className="font-black text-xs text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                <Plus size={16} className="text-emerald-500" /> Manual Lead Intake
              </h3>
              <button onClick={() => setShowAddLead(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateLeadManual} className="grid grid-cols-2 gap-3 text-xs leading-relaxed">
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Lead Full Name</label>
                <input 
                  id="add-lead-name"
                  type="text" 
                  value={leadName}
                  onChange={e => setLeadName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full bg-slate-50 border p-2 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">WhatsApp / Phone</label>
                <input 
                  id="add-lead-phone"
                  type="text" 
                  value={leadPhone}
                  onChange={e => setLeadPhone(e.target.value)}
                  placeholder="+91 99999-99999"
                  className="w-full bg-slate-50 border p-2 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Email Adresse</label>
                <input 
                  id="add-lead-email"
                  type="email" 
                  value={leadEmail}
                  onChange={e => setLeadEmail(e.target.value)}
                  placeholder="sharma@example.com"
                  className="w-full bg-slate-50 border p-2 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Intake Source Channel</label>
                <select 
                  id="add-lead-source"
                  value={leadSource}
                  onChange={e => setLeadSource(e.target.value)}
                  className="w-full bg-slate-50 border p-2 rounded-lg"
                >
                  <option value="36 Acre">36 Acre Campaign</option>
                  <option value="MagicBricks">MagicBricks</option>
                  <option value="Housing.com">Housing.com</option>
                  <option value="Facebook Ads">Facebook Promo</option>
                  <option value="Manual Referral">Referral</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Property Type target</label>
                <select 
                  id="add-lead-type"
                  value={leadProp}
                  onChange={e => setLeadProp(e.target.value)}
                  className="w-full bg-slate-50 border p-2 rounded-lg"
                >
                  <option value="Apartment">Apartment Complex</option>
                  <option value="Villa">Penthouse / Villa</option>
                  <option value="Commercial">Office / Commercial</option>
                  <option value="Land Plot">Independent land plot</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Sector target Location</label>
                <input 
                  id="add-lead-location"
                  type="text" 
                  value={leadLocation}
                  onChange={e => setLeadLocation(e.target.value)}
                  placeholder="Sector 54, Gurgaon"
                  className="w-full bg-slate-50 border p-2 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Budget Max (INR)</label>
                <input 
                  id="add-lead-budget-max"
                  type="number" 
                  value={leadBudgetMax}
                  onChange={e => setLeadBudgetMax(e.target.value)}
                  placeholder="e.g. 7500000"
                  className="w-full bg-slate-50 border p-2 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Lead Temperature</label>
                <select 
                  id="add-lead-temp"
                  value={leadTemp}
                  onChange={e => setLeadTemp(e.target.value)}
                  className="w-full bg-slate-50 border p-2 rounded-lg"
                >
                  <option value="Hot">🔥 Hot pitch priority</option>
                  <option value="Warm">⚡ Warm counselor follow-up</option>
                  <option value="Cold">❄️ Cold list reserve</option>
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="font-bold text-slate-600">Specific Counseling candidate needs</label>
                <textarea 
                  id="add-lead-notes"
                  value={leadNotes}
                  onChange={e => setLeadNotes(e.target.value)}
                  placeholder="Prefers high floor, modular developer kitchens..."
                  rows={2}
                  className="w-full bg-slate-50 border p-1 rounded-lg shrink-0 text-xs resize-none"
                />
              </div>

              <button 
                id="submit-add-lead-btn"
                type="submit"
                className="col-span-2 mt-2 bg-slate-905 bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 rounded-xl text-center shadow-md transition"
              >
                Confirm Add & Allocate Agent
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. GLOBAL AI CO-PILOT FLOATING ACTION ACTION BUBBLE */}
      <button
        id="global-ai-copilot-bubble"
        onClick={() => setShowAiCopilot(true)}
        className="fixed bottom-22 right-4 sm:bottom-6 sm:right-6 bg-slate-950 border border-slate-800 text-emerald-400 hover:text-white px-4 py-3.5 rounded-2xl shadow-2xl transition duration-300 z-40 flex items-center gap-2 font-black text-xs cursor-pointer group hover:bg-slate-900"
      >
        <Sparkles size={16} className="animate-spin text-emerald-400" style={{ animationDuration: '4s' }} />
        <span className="font-bold text-[11px] text-emerald-400">
          AI Co-Pilot
        </span>
      </button>

      {/* 7. INTRODUCED AI CO-PILOT CHATBOT SYSTEM DIALOG MODAL */}
      {showAiCopilot && (
        <div className="fixed inset-0 bg-slate-900/65 z-50 flex items-center justify-center p-4" id="ai-copter-modal-overlay">
          <div className="bg-slate-950 text-slate-100 rounded-3xl p-5 max-w-md w-full flex flex-col h-[520px] shadow-2xl border border-slate-800" id="ai-copter-layout-sheet">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-solid border-slate-850 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-400 animate-pulse" />
                <div>
                  <h3 className="font-black text-xs uppercase tracking-widest text-white leading-none">CRM AI Co-Pilot</h3>
                  <span className="text-[9px] text-slate-400">Powered by Gemini 3.5 Flash</span>
                </div>
              </div>
              <button 
                onClick={() => setShowAiCopilot(false)} 
                className="text-slate-400 hover:text-slate-200 transition p-1 rounded-lg hover:bg-slate-850"
              >
                <X size={16} />
              </button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs" style={{ scrollbarWidth: 'thin' }}>
              {copilotMessages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex flex-col ${msg.sender === 'agent' ? 'items-end' : 'items-start'} max-w-[88%] ${msg.sender === 'agent' ? 'ml-auto' : 'mr-auto'}`}
                >
                  <div className={`p-3 rounded-2xl leading-relaxed ${
                    msg.sender === 'agent' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
                  }`}>
                    {msg.text}

                    {/* Integrated Action Pillar Badges */}
                    {msg.action && msg.action !== 'UNRECOGNIZED' && (
                      <div className="mt-2 flex items-center gap-1.5 select-none font-bold text-[9px] uppercase tracking-wider bg-emerald-950/80 border border-emerald-900 text-emerald-400 px-2 py-0.5 rounded-lg w-fit">
                        <Check size={11} /> Successfully Integrated: {msg.action}
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] text-slate-500 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {copilotLoading && (
                <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-bold bg-slate-900/40 p-3 rounded-2xl border border-dashed border-slate-800 max-w-[70%] select-none">
                  <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" />
                  AI agent incorporating request...
                </div>
              )}
            </div>

            {/* Micro Quick Suggestion Tabs */}
            <div className="space-y-1 mt-1 border-t border-slate-850 pt-2 pb-1.5">
              <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-widest block pl-1">Suggestion Shortcuts:</span>
              <div className="flex gap-1 overflow-x-auto py-0.5" style={{ scrollbarWidth: 'none' }}>
                <button 
                  onClick={() => handleSendCopilotCommand('Add quick hot lead Varun Sharma, phone +919999912345')}
                  className="bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap border border-slate-800 transition shrink-0 cursor-pointer"
                >
                  + Add Lead Varun
                </button>
                <button 
                  onClick={() => handleSendCopilotCommand('Schedule site visit with Rahul Sharma tomorrow afternoon')}
                  className="bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap border border-slate-800 transition shrink-0 cursor-pointer"
                >
                  + Visit tomorrow
                </button>
                <button 
                  onClick={() => handleSendCopilotCommand('Add a counselor note to Priya Patel confirming high-floor target')}
                  className="bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap border border-slate-800 transition shrink-0 cursor-pointer"
                >
                  + Note Priya target
                </button>
              </div>
            </div>

            {/* Input Action Panel Form */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-850">
              <button 
                onClick={startSpeechListening}
                className={`p-2.5 rounded-xl transition cursor-pointer shrink-0 ${
                  isListening 
                    ? 'bg-rose-600 text-white animate-pulse' 
                    : 'bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800'
                }`}
                title="Talk to AI Chatbot (Voice Activation)"
              >
                <Mic size={15} />
              </button>
              
              <input 
                id="ai-copilot-text-input"
                type="text"
                placeholder={isListening ? "Listening / Or speak voice query..." : "Speak command or type client info..."}
                value={copilotPrompt}
                onChange={e => setCopilotPrompt(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleSendCopilotCommand();
                  }
                }}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              
              <button 
                onClick={() => handleSendCopilotCommand()}
                disabled={copilotLoading || !copilotPrompt.trim()}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 p-2.5 rounded-xl transition duration-150 disabled:opacity-50 disabled:hover:bg-emerald-500 shrink-0 cursor-pointer"
              >
                <Send size={14} />
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
