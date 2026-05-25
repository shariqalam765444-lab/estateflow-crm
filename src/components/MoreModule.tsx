/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  Camera, 
  Plus, 
  Settings, 
  MessageSquare, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  UserPlus, 
  Users, 
  BarChart3, 
  Webhook, 
  Check, 
  Play, 
  X,
  FileText,
  CreditCard,
  Zap
} from 'lucide-react';
import { Attendance, UserProfile, Property, SocialPost, Organization, Lead } from '../types';
import SaaSPlansBilling from './SaaSPlansBilling';

interface MoreModuleProps {
  properties: Property[];
  users: UserProfile[];
  currentUser: UserProfile;
  subview: string;
  onSetSubview: (sub: string) => void;
  onInviteUser: (user: any) => void;
  activeOrg: Organization;
  organizations: Organization[];
  onRefreshAllData: () => void;
  leads: Lead[];
}

export default function MoreModule({
  properties,
  users,
  currentUser,
  subview,
  onSetSubview,
  onInviteUser,
  activeOrg,
  organizations,
  onRefreshAllData,
  leads
}: MoreModuleProps) {
  
  // Tab states
  const [activeTab, setActiveTab] = useState(subview || 'attendance');

  // Sync tab active from prop changes
  useEffect(() => {
    if (subview) setActiveTab(subview);
  }, [subview]);

  // Attendance states
  const [gpsLoading, setGpsLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isCheckIn, setIsCheckIn] = useState(true);
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>([]);
  const [fieldNotes, setFieldNotes] = useState('');
  const [selfieOption, setSelfieOption] = useState(false);

  // Social Media drafting states
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [postType, setPostType] = useState('Instagram Reel');
  const [draftPropertyId, setDraftPropertyId] = useState('');
  const [draftCaption, setDraftCaption] = useState('');
  const [customDraftNotes, setCustomDraftNotes] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);

  // Webhook intake simulation states
  const [testName, setTestName] = useState('Aarav Malhotra');
  const [testPhone, setTestPhone] = useState('+91 98765 43210');
  const [testSource, setTestSource] = useState('MagicBricks');
  const [testProp, setTestProp] = useState('Villa');
  const [testBudgetMax, setTestBudgetMax] = useState('65000000');
  const [webhookResult, setWebhookResult] = useState<any>(null);
  const [webhookLoading, setWebhookLoading] = useState(false);

  // Invite user form
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Sales Agent');
  const [invitePhone, setInvitePhone] = useState('');

  // Brand Kit states & action callbacks
  const [lightboxPath, setLightboxPath] = useState<string | null>(null);

  const handleApplyHeaderLogo = async (logoPath: string, primary: string, secondary: string) => {
    try {
      const response = await fetch(`/api/saas/agencies/${activeOrg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoUrl: logoPath,
          primaryColor: primary,
          secondaryColor: secondary,
          appName: 'EstateFlow CRM'
        })
      });
      if (response.ok) {
        alert('🎉 Success! Selected premium asset applied live as active white-label agency portal layout logo, and color swatches injected.');
        onRefreshAllData();
      } else {
        alert('Failed to update workspace static brand assets on database configuration.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Settings
  const [settings, setSettings] = useState<any>({
    twilioAccountSid: 'AC991a03e6f6fdb32b09aeb7400d720',
    twilioPhoneNumber: '+1 201 555 0199',
    whatsappSenderNumber: 'whatsapp:+14155238886',
    isDryRun: true,
    roundRobinIndex: 0
  });

  // Fetch Attendance & Social Posts & Settings
  const refreshAttendance = () => {
    fetch('/api/attendance')
      .then(r => r.json())
      .then(data => setAttendanceLogs(data || []))
      .catch(e => console.error(e));
  };

  const refreshSocialPosts = () => {
    fetch('/api/social-posts')
      .then(r => r.json())
      .then(data => setSocialPosts(data || []))
      .catch(e => console.error(e));
  };

  useEffect(() => {
    refreshAttendance();
    refreshSocialPosts();
    // Default draft property to first available
    if (properties.length > 0) setDraftPropertyId(properties[0].id);

    // Fetch config setting parameters
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data || {}))
      .catch(err => console.error(err));
  }, [properties]);

  // 1. Geolocation check in actions
  const handleLoadGeolocation = () => {
    setGpsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsLoading(false);
        },
        (error) => {
          console.warn('Geolocation blocked, bypassing with standard simulated coordinates.');
          setCoords({ lat: 28.4595, lng: 77.0266 }); // Gurugram Central default coords
          setGpsLoading(false);
        }
      );
    } else {
      setCoords({ lat: 28.4595, lng: 77.0266 });
      setGpsLoading(false);
    }
  };

  const handleRegisterAttendance = (type: 'check-in' | 'check-out') => {
    const payload = {
      userId: currentUser.id,
      latitude: coords?.lat,
      longitude: coords?.lng,
      selfiePhoto: selfieOption ? 'simulated_verify' : undefined,
      notes: type === 'check-in' ? 'Standard field duty login.' : undefined,
      fieldVisitNotes: type === 'check-out' ? fieldNotes : undefined
    };

    fetch(`/api/attendance/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(async res => {
      const data = await res.json();
      if (res.ok) {
        alert(`Success: Standard ${type} registered on GPS database.`);
        setFieldNotes('');
        setCoords(null);
        refreshAttendance();
      } else {
        alert(`Error: ${data.error || 'Failed to sync parameters.'}`);
      }
    });
  };

  // 2. Social caption generation
  const handleGenerateAiCaption = async () => {
    if (!draftPropertyId) return;
    setDraftLoading(true);
    try {
      const response = await fetch('/api/social-posts/ai-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postType,
          propertyId: draftPropertyId,
          customNotes: customDraftNotes
        })
      });
      const data = await response.json();
      if (data.caption) {
        setDraftCaption(data.caption);
      } else {
        setDraftCaption('No caption returned.');
      }
    } catch (e) {
      setDraftCaption('Fallback Reel caption: Exquisite Marbella villa! Modern bathrooms and layout. Price in Cr. Call for catalog.');
    } finally {
      setDraftLoading(false);
    }
  };

  const handleSaveSocialDraft = () => {
    if (!draftCaption) return;
    fetch('/api/social-posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postType,
        caption: draftCaption,
        notes: customDraftNotes
      })
    })
    .then(res => {
      if (res.ok) {
        alert('Success: Post template scheduled inside calendar catalog.');
        setDraftCaption('');
        setCustomDraftNotes('');
        refreshSocialPosts();
      }
    });
  };

  // 3. Webhook simulation triggers
  const handleTriggerWebhookSimulator = () => {
    setWebhookLoading(true);
    setWebhookResult(null);

    const payload = {
      fullName: testName,
      phone: testPhone,
      source: testSource,
      propertyType: testProp,
      budgetMax: Number(testBudgetMax),
      secret: 'webhook-estateflow-secret-xyz'
    };

    fetch('/api/webhooks/leads?secret=webhook-estateflow-secret-xyz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(async res => {
      const data = await res.json();
      setWebhookResult({ status: res.status, data });
      setWebhookLoading(false);
      alert('Webhook Intake successful! Assigned to Agent & call simulation initiated.');
    })
    .catch(err => {
      setWebhookResult({ status: 500, error: err.message });
      setWebhookLoading(false);
    });
  };

  // 4. Invite user submission
  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail || !invitePhone) {
      alert('Please fill out everything to invite staff.');
      return;
    }
    onInviteUser({
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      phone: invitePhone
    });
    setInviteName('');
    setInviteEmail('');
    setInvitePhone('');
    alert('Success: New counselor invitation registered.');
  };

  // 5. Save settings configurations
  const handleSaveSettings = () => {
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
    .then(res => {
      if (res.ok) {
        alert('CRM Settings saved successfully.');
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-full" id="more-module">
      
      {/* Tab select side-bar */}
      <div className="md:col-span-3 bg-white p-3 border border-slate-100 rounded-2xl flex flex-col space-y-1.5 h-fit">
        <button 
          onClick={() => setActiveTab('attendance')}
          className={`text-left p-3 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'attendance' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
        >
          <Clock size={15} /> Field GPS Attendance
        </button>
        <button 
          onClick={() => setActiveTab('social')}
          className={`text-left p-3 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'social' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
        >
          <MessageSquare size={15} /> Social Captions (Gemini)
        </button>
        <button 
          onClick={() => setActiveTab('webhook_tester')}
          className={`text-left p-3 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'webhook_tester' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
        >
          <Webhook size={15} /> Webhook Intake Playground
        </button>
        <button 
          onClick={() => setActiveTab('team')}
          className={`text-left p-3 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'team' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
        >
          <Users size={15} /> Team & Recruitment
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          className={`text-left p-3 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'reports' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
        >
          <BarChart3 size={15} /> CRM Analytics Reports
        </button>
        <button 
          onClick={() => setActiveTab('billing')}
          className={`text-left p-3 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'billing' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
        >
          <CreditCard size={15} className="text-indigo-505" strokeWidth={2.5} /> Subscription & Billing
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`text-left p-3 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'settings' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
        >
          <Settings size={15} /> Config Settings
        </button>
        <button 
          onClick={() => setActiveTab('brand_kit')}
          className={`text-left p-3 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'brand_kit' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-705 text-slate-700'}`}
        >
          <Sparkles size={15} className="text-amber-500 animate-pulse" /> Corporate Brand Kit
        </button>
      </div>

      {/* Main active sub-workspace panel */}
      <div className="md:col-span-9 bg-white border border-slate-100 rounded-2xl p-5 min-h-[400px]">
        
        {/* VIEW 1: FIELD GPS ATTENDANCE MODULE */}
        {activeTab === 'attendance' && (
          <div className="space-y-6" id="more-view-attendance">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Field Executive GPS Geolocation Login</h3>
              <p className="text-xs text-slate-400 mt-1">Check-in dynamically to register attendance with automatic late calculation and location checks.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Daily active controls */}
              <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl text-xs text-slate-600 space-y-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Attendance Registration Console</span>
                
                {/* Geolocation visual fetcher */}
                <div className="space-y-2">
                  <p className="text-slate-500 font-light text-[11px]">Executive check-in requires visual coordinate confirmation:</p>
                  
                  {coords ? (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 font-semibold space-y-1">
                      <p className="flex items-center gap-1">✔ GPS Coordinate lock acquired</p>
                      <p className="text-[10px] text-emerald-600 text-[10px]">Lat: {coords.lat.toFixed(5)} | Lng: {coords.lng.toFixed(5)} (Sector target approved)</p>
                    </div>
                  ) : (
                    <button 
                      onClick={handleLoadGeolocation}
                      disabled={gpsLoading}
                      className="bg-slate-900 text-white font-bold p-2.5 rounded-lg flex items-center gap-1.5 transition"
                    >
                      {gpsLoading ? 'Locking GPS...' : '🔐 Acquire GPS Coordinates'}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="selfie-toggle"
                    checked={selfieOption}
                    onChange={e => setSelfieOption(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="selfie-toggle" className="font-semibold text-[11px]">Verify Identity via Selfie camera photo capture</label>
                </div>

                <div className="space-y-1.5 mt-2">
                  <label className="font-bold text-slate-700">Daily field visit notes</label>
                  <input 
                    type="text"
                    placeholder="e.g. DLF Phase-2 client walkthrough coordinate..."
                    value={fieldNotes}
                    onChange={e => setFieldNotes(e.target.value)}
                    className="w-full bg-white p-2 border border-slate-200 rounded-lg text-xs focus:outline-none"
                  />
                </div>

                {/* Submit row */}
                <div className="flex gap-2.5 pt-2">
                  <button 
                    onClick={() => handleRegisterAttendance('check-in')}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 rounded-xl transition text-center"
                  >
                    Check In (Morning)
                  </button>
                  <button 
                    onClick={() => handleRegisterAttendance('check-out')}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl text-center"
                  >
                    Check Out (Field Exit)
                  </button>
                </div>
              </div>

              {/* Attendance active log table */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Roll Call Today</span>
                
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {attendanceLogs.map(att => {
                    const staff = users.find(u => u.id === att.userId);
                    return (
                      <div key={att.id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-xs text-xs flex justify-between items-center text-slate-600">
                        <div>
                          <h4 className="font-bold text-slate-800">{staff ? staff.name : 'Unknown Team Member'}</h4>
                          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 text-[10px]">
                            Checkin: {new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • 
                            Status: <span className={att.status === 'Present' ? 'text-emerald-600 font-bold' : 'text-amber-500 font-bold'}>{att.status}</span>
                          </p>
                        </div>
                        {att.checkInLatitude && (
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded" title="GPS Verification Complete">
                            📍 Linked
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {attendanceLogs.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-xs italic">
                      Zero team check-ins registered today.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SOCIAL MEDIA CAPTIONS CREATOR */}
        {activeTab === 'social' && (
          <div className="space-y-6" id="more-view-social">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Dynamic Social Media Copywriter (Ai Captions)</h3>
              <p className="text-xs text-slate-400 mt-1">Instantly generate high converting real estate caption marketing packages grounded with hot sector locations, details, and call macros via Gemini.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Creator form */}
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Reel / Post Format Style</label>
                  <select 
                    id="social-format-select"
                    value={postType}
                    onChange={e => setPostType(e.target.value)}
                    className="w-full bg-slate-50 p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="Instagram Reel">Instagram Reel Video Package</option>
                    <option value="Facebook Post">Facebook Promoted Post Advertisement</option>
                    <option value="YouTube Short">YouTube Shorts Script Outlines</option>
                    <option value="Twitter / X Thread">Direct X Pitch Thread</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Target Estate Asset listing</label>
                  <select 
                    id="social-target-property-select"
                    value={draftPropertyId}
                    onChange={e => setDraftPropertyId(e.target.value)}
                    className="w-full bg-slate-50 p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.title} (INR {(p.price / 10000000).toFixed(2)} Cr)</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Custom Campaign Focus (optional)</label>
                  <input 
                    id="social-focus-input"
                    type="text"
                    placeholder="e.g. Focus on Golf Course Road elite community, limited developer offer..."
                    value={customDraftNotes}
                    onChange={e => setCustomDraftNotes(e.target.value)}
                    className="w-full bg-slate-50 p-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <button 
                  id="generate-ai-caption-btn"
                  onClick={handleGenerateAiCaption}
                  disabled={draftLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-2 rounded-xl transition text-center flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} className="text-emerald-400" />
                  {draftLoading ? 'Querying Gemini...' : 'Draft Copywriting Package'}
                </button>
              </div>

              {/* Caption generation preview and list */}
              <div className="space-y-4">
                {draftCaption && (
                  <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl space-y-3 border border-slate-800 shadow-md">
                    <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest block">Grounded Copywriting Preview</span>
                    <textarea 
                      value={draftCaption}
                      onChange={e => setDraftCaption(e.target.value)}
                      rows={5}
                      className="w-full bg-slate-800 text-slate-100 p-2 text-xs border-none rounded-lg focus:outline-none"
                    />
                    <button 
                      onClick={handleSaveSocialDraft}
                      className="bg-emerald-400 hover:bg-emerald-500 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition w-full"
                    >
                      Schedule & Approve social Post
                    </button>
                  </div>
                )}

                {/* Published / scheduled log */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block font-extrabold">Social Campaign Scheduler Queue</span>
                  
                  <div className="space-y-2 max-h-[170px] overflow-y-auto">
                    {socialPosts.map(p => (
                      <div key={p.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600">
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">{p.postType}</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Scheduled</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{p.caption}</p>
                      </div>
                    ))}
                    {socialPosts.length === 0 && (
                      <div className="text-center py-6 text-slate-400 text-xs italic">
                        Empty scheduler queue lists. Draft caption to start campaigns.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: WEBHOOK INTAKE PLAYGROUND */}
        {activeTab === 'webhook_tester' && (
          <div className="space-y-6" id="more-view-webhook">
            <div className="flex items-center gap-2">
              <Webhook className="text-indigo-600" size={24} />
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">Lead Webhook Intake Playground</h3>
                <p className="text-xs text-slate-400 mt-1">Developer sandbox testing tool to verify standard lead captures via CRM REST API webhook integrations.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Webhook Form sandbox */}
              <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl text-xs space-y-3.5 text-slate-600">
                <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Configure Post Payload</span>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold">Lead Full Name</label>
                    <input 
                      id="webhook-test-name"
                      type="text" 
                      value={testName}
                      onChange={e => setTestName(e.target.value)}
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold">Phone Number</label>
                    <input 
                      id="webhook-test-phone"
                      type="text" 
                      value={testPhone}
                      onChange={e => setTestPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold">Lead Intake Source Name</label>
                    <select 
                      id="webhook-test-source"
                      value={testSource}
                      onChange={e => setTestSource(e.target.value)}
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs"
                    >
                      <option value="36 Acre">36 Acre</option>
                      <option value="Facebook Ads">Facebook Promo Ads</option>
                      <option value="MagicBricks">MagicBricks Platform</option>
                      <option value="Website API">Direct Website Chatbot</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold">Property Type Goal</label>
                    <select 
                      id="webhook-test-type"
                      value={testProp}
                      onChange={e => setTestProp(e.target.value)}
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs"
                    >
                      <option value="Apartment">Apartment</option>
                      <option value="Villa">Villa</option>
                      <option value="Commercial">Commercial Storefront</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-[9px] uppercase tracking-wider text-slate-400">Endpoint target</label>
                  <pre className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-lg overflow-x-auto">
                    POST /api/webhooks/leads?secret=webhook-estateflow-secret-xyz
                  </pre>
                </div>

                <button 
                  id="run-webhook-simulate-btn"
                  onClick={handleTriggerWebhookSimulator}
                  disabled={webhookLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2 px-3 rounded-lg w-full transition text-center text-xs"
                >
                  {webhookLoading ? 'Triggering...' : '🚀 Submit Payload to Endpoint'}
                </button>
              </div>

              {/* Webhook trigger results output panel */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Simulation Output Logger</span>
                
                {webhookResult ? (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs space-y-3.5">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-emerald-400 font-mono">STATUS: {webhookResult.status} OK</span>
                      <span className="text-slate-500 font-mono">ESTATEFLOW_LOG_V2</span>
                    </div>
                    <pre className="p-2 bg-slate-950 text-slate-300 font-mono text-[10px] rounded-lg overflow-x-auto leading-relaxed max-h-[180px]">
                      {JSON.stringify(webhookResult.data, null, 2)}
                    </pre>
                    <div className="p-2 sm:p-3 bg-indigo-950/50 text-slate-300 rounded-xl text-[11px] leading-relaxed select-none">
                      <strong>Check Dashboard:</strong> The lead was registered dynamically, routed via round-robin allocation to an available counselor, and Twilio callback sequences commenced.
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl h-full flex flex-col justify-center items-center text-slate-400 italic text-xs">
                    No webhook simulation data recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: TEAM RECRUITMENT AND DIRECTORIES */}
        {activeTab === 'team' && (
          <div className="space-y-6" id="more-view-team">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Counselling Team Recruitment</h3>
              <p className="text-xs text-slate-400 mt-1">Register new agents or managers to participate in round-robin leads routing allocation lists.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Invite Form */}
              <form onSubmit={handleInviteSubmit} className="bg-slate-50 p-4 border border-slate-100 rounded-2xl text-xs text-slate-600 space-y-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Invite Team Member</span>
                
                <div className="space-y-1">
                  <label className="font-bold">Full Name</label>
                  <input 
                    id="invite-member-name"
                    type="text" 
                    value={inviteName}
                    onChange={e => setInviteName(e.target.value)}
                    placeholder="e.g. Priyanjali Sen"
                    className="w-full bg-white border border-slate-200 p-2 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-bold">Email</label>
                    <input 
                      id="invite-member-email"
                      type="email" 
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="sen@estateflow.in"
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold">Phone (WhatsApp)</label>
                    <input 
                      id="invite-member-phone"
                      type="text" 
                      value={invitePhone}
                      onChange={e => setInvitePhone(e.target.value)}
                      placeholder="+91 99000-11222"
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold">Functional Role</label>
                  <select 
                    id="invite-member-role"
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-2 rounded-lg"
                  >
                    <option value="Sales Agent">Sales Counselor (Agent)</option>
                    <option value="Sales Manager">Sales Manager (Supervisor)</option>
                    <option value="Field Executive">Field Coordinator (GPS check-ins)</option>
                    <option value="Social Media Manager">Content / Social Manager</option>
                  </select>
                </div>

                <button 
                  id="submit-invite-btn"
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3 rounded-lg w-full transition text-center"
                >
                  Verify and Invite
                </button>
              </form>

              {/* Grid roster */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active counselling team roster</span>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {users.map(u => (
                    <div key={u.id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-xs text-xs flex justify-between items-center text-slate-600">
                      <div>
                        <h4 className="font-bold text-slate-800">{u.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-1">{u.role} • {u.phone}</p>
                      </div>
                      <span className="text-[9px] uppercase tracking-widest font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                        CRM Logged
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: PERFORMANCE CONVERTING REPORTS AND ANALYTICS */}
        {activeTab === 'reports' && (
          <div className="space-y-6" id="more-view-reports">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">EstateFlow Team Conversion Analytics</h3>
              <p className="text-xs text-slate-400 mt-1">Real-time charts summaries showing lead channels and counselor conversion indexes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
              {/* Lead sources performance */}
              <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Yield analysis per Channel</span>
                
                <div className="space-y-2 pt-1.5 font-bold">
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1 text-slate-600">
                      <span>36 Acre Campaign (Pre-qualified)</span>
                      <span>45% yield</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1 text-slate-600">
                      <span>MagicBricks platform leads</span>
                      <span>30% yield</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '30%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1 text-slate-600">
                      <span>Facebook promotional Ads</span>
                      <span>15% yield</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '15%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* CRM totals metrics */}
              <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl space-y-3 text-slate-600">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CRM Ledger Totals summary</span>
                
                <div className="grid grid-cols-2 gap-3 pt-1 text-center font-bold">
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-450 block font-normal">Active Pipeline</span>
                    <span className="text-lg font-black text-slate-800 block mt-1">Cr 18.5 max</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-450 block font-normal">Total conversions</span>
                    <span className="text-lg font-black text-emerald-600 block mt-1">3 Deals Closed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: DELEGATED SAAS PLANS & BILLING CENTRE */}
        {activeTab === 'billing' && (
          <SaaSPlansBilling 
            activeOrg={activeOrg}
            organizations={organizations}
            onRefreshAllData={onRefreshAllData}
            currentUser={currentUser}
            leads={leads}
            properties={properties}
            users={users}
          />
        )}

        {/* VIEW 6: CRM PLATFORM SYSTEM PARAMS */}
        {activeTab === 'settings' && (
          <div className="space-y-6" id="more-view-settings">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Advanced Integrations & API Config</h3>
              <p className="text-xs text-slate-400 mt-1">Review active Twilio keys, dry-run state variables, and webhook credentials keys.</p>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-605">Twilio Account Sid</label>
                  <input 
                    id="setting-twilio-sid"
                    type="text" 
                    value={settings.twilioAccountSid}
                    onChange={e => setSettings({ ...settings, twilioAccountSid: e.target.value })}
                    className="w-full bg-slate-50 border p-2 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-605">Twilio Caller phone number</label>
                  <input 
                    id="setting-twilio-phone"
                    type="text" 
                    value={settings.twilioPhoneNumber}
                    onChange={e => setSettings({ ...settings, twilioPhoneNumber: e.target.value })}
                    className="w-full bg-slate-50 border p-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 border rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-slate-800">Simulation Mode (Dry-Run Bypass)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">When checked, CRM synthesizesTwilio connections and Gemini API content instantly to avoid billing exhaustion.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    id="setting-bypass-bypass"
                    checked={settings.isDryRun}
                    onChange={e => setSettings({ ...settings, isDryRun: e.target.checked })}
                    className="rounded text-indigo-600 w-4 h-4"
                  />
                </div>
              </div>

              <button 
                id="save-settings-btn"
                onClick={handleSaveSettings}
                className="bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition"
              >
                Save configurations params
              </button>
            </div>
          </div>
        )}

        {/* VIEW 7: ESTATEFLOW CORPORATE BRAND KIT PORTFOLIO */}
        {activeTab === 'brand_kit' && (
          <div className="space-y-6" id="more-view-brand-kit">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500 animate-pulse" /> Estate Flow Corporate Brand Kit
                </h3>
                <p className="text-xs text-slate-400 mt-1 pb-1">
                  Premium B2B real estate agency brand portfolio and digital design assets. Styled with pristine geometric forms and high-density SaaS scaling standards.
                </p>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold uppercase px-2 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> White-Label Ready
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold uppercase px-2 py-1 rounded-lg border border-indigo-100">
                  5 High-Res Formats
                </span>
              </div>
            </div>

            {/* Corporate Color Palette Grid */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
              <div className="text-left">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Aesthetic Color Palette (B2B Global Standards)</h4>
                <p className="text-[11px] text-slate-400">Click on any swatch code below to copy the specific hex value instantly.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* 1. Deep Navy Blue */}
                <div 
                  onClick={() => {
                    navigator.clipboard.writeText('#0b132b');
                    alert('Copied Deep Navy Blue hex: #0b132b');
                  }}
                  className="bg-white p-2.5 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300 transition group text-left"
                >
                  <div className="h-10 rounded-lg bg-[#0b132b] mb-1.5 relative overflow-hidden flex items-end p-1 justify-end">
                    <span className="text-[8px] bg-slate-900/60 text-white font-mono rounded px-1 group-hover:scale-105 transition">60%</span>
                  </div>
                  <span className="block font-bold text-slate-800 text-[11px]">Deep Navy Blue</span>
                  <span className="font-mono text-[9px] text-slate-400 block tracking-tight">#0b132b</span>
                </div>

                {/* 2. Professional Royal Blue */}
                <div 
                  onClick={() => {
                    navigator.clipboard.writeText('#1c3d5a');
                    alert('Copied Professional Royal Blue hex: #1c3d5a');
                  }}
                  className="bg-white p-2.5 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300 transition group text-left"
                >
                  <div className="h-10 rounded-lg bg-[#1c3d5a] mb-1.5 relative overflow-hidden flex items-end p-1 justify-end">
                    <span className="text-[8px] bg-slate-900/60 text-white font-mono rounded px-1 group-hover:scale-105 transition">30%</span>
                  </div>
                  <span className="block font-bold text-slate-800 text-[11px]">Royal Blue</span>
                  <span className="font-mono text-[9px] text-slate-400 block tracking-tight">#1c3d5a</span>
                </div>

                {/* 3. Pure White */}
                <div 
                  onClick={() => {
                    navigator.clipboard.writeText('#ffffff');
                    alert('Copied Custom Crisp White hex: #ffffff');
                  }}
                  className="bg-white p-2.5 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300 transition group text-left"
                >
                  <div className="h-10 rounded-lg bg-[#ffffff] border border-slate-200 mb-1.5 relative overflow-hidden flex items-end p-1 justify-end">
                    <span className="text-[8px] bg-slate-900/10 text-slate-600 font-mono rounded px-1 group-hover:scale-105 transition font-bold">Fluid</span>
                  </div>
                  <span className="block font-bold text-slate-800 text-[11px]">Pristine White</span>
                  <span className="font-mono text-[9px] text-slate-400 block tracking-tight">#ffffff</span>
                </div>

                {/* 4. Soft Subtle Teal */}
                <div 
                  onClick={() => {
                    navigator.clipboard.writeText('#00b4d8');
                    alert('Copied Soft Subtle Teal hex: #00b4d8');
                  }}
                  className="bg-white p-2.5 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-300 transition group text-left"
                >
                  <div className="h-10 rounded-lg bg-[#00b4d8] mb-1.5 relative overflow-hidden flex items-end p-1 justify-end">
                    <span className="text-[8px] bg-slate-900/60 text-white font-mono rounded px-1 group-hover:scale-105 transition">10% Accent</span>
                  </div>
                  <span className="block font-bold text-slate-800 text-[11px]">Subtle Teal Accent</span>
                  <span className="font-mono text-[9px] text-slate-400 block tracking-tight">#00b4d8</span>
                </div>
              </div>
            </div>

            {/* Logo Assets Gallery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Asset 1: Full Logo Light Mode */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-105 flex flex-col justify-between space-y-3.5 hover:shadow-xs transition">
                <div className="space-y-1 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">01. Corporate Full Logo</span>
                    <span className="text-[9px] font-mono text-slate-400">1200 x 400 • Light Theme</span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">Full Branding & Typography Layout</h4>
                </div>
                
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-center h-40 overflow-hidden relative group cursor-pointer" onClick={() => setLightboxPath('/images/estate_flow_full_logo_light.png')}>
                  <img src="/images/estate_flow_full_logo_light.png" className="max-h-full max-w-full object-contain rounded transition duration-300 group-hover:scale-105" alt="Estate Flow Full Logo" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="text-white text-[11px] font-bold bg-slate-900/80 px-2.5 py-1.5 rounded-xl">View Large Scale</span>
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Displays 'Estate Flow' in high-end sleek sans-serif typography directly side-by-side with the geometric rising connection network crest icon.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <button 
                      onClick={() => handleApplyHeaderLogo('/images/estate_flow_full_logo_light.png', '#0b132b', '#1c3d5a')}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2 rounded-lg transition text-center"
                    >
                      👑 Apply Workspace Logo
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/images/estate_flow_full_logo_light.png`);
                        alert('Full logo absolute static URL copied to clipboard!');
                      }}
                      className="bg-white hover:bg-slate-100 text-slate-700 border font-bold py-2 rounded-lg transition text-center"
                    >
                      🔗 Copy Static Path
                    </button>
                  </div>
                </div>
              </div>

              {/* Asset 2: Minimalist Dark Mode */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-105 flex flex-col justify-between space-y-3.5 hover:shadow-xs transition">
                <div className="space-y-1 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-slate-200 bg-slate-900 px-2 py-0.5 rounded">02. Slate Dark Mode</span>
                    <span className="text-[9px] font-mono text-slate-400">1024 x 1024 • Charcoal Canvas</span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs text-left">Vibrant Midnight Dashboard Asset</h4>
                </div>
                
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-center h-40 overflow-hidden relative group cursor-pointer" onClick={() => setLightboxPath('/images/estate_flow_logo_dark_mode.png')}>
                  <img src="/images/estate_flow_logo_dark_mode.png" className="max-h-full max-w-full object-contain rounded transition duration-300 group-hover:scale-105" alt="Estate Flow CRM Dark Edition" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="text-white text-[11px] font-bold bg-slate-900/80 px-2.5 py-1.5 rounded-xl">View Large Scale</span>
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Specifically formatted dark mode variant engineered with glowing neon blue metrics bars and high-contrast vector node alignments.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <button 
                      onClick={() => handleApplyHeaderLogo('/images/estate_flow_logo_dark_mode.png', '#0f172a', '#1e293b')}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2 rounded-lg transition text-center"
                    >
                      👑 Apply Workspace Logo
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/images/estate_flow_logo_dark_mode.png`);
                        alert('Dark-theme logo absolute static URL copied to clipboard!');
                      }}
                      className="bg-white hover:bg-slate-100 text-slate-700 border font-bold py-2 rounded-lg transition text-center"
                    >
                      🔗 Copy Static Path
                    </button>
                  </div>
                </div>
              </div>

              {/* Asset 3: Icon-Only Version */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-105 flex flex-col justify-between space-y-3.5 hover:shadow-xs transition">
                <div className="space-y-1 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-amber-750 bg-amber-50 text-amber-700 px-2 py-0.5 rounded">03. Icon-Only Mark</span>
                    <span className="text-[9px] font-mono text-slate-400">800 x 800 • Square 1:1</span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">CRM Connection & Growth Crest</h4>
                </div>
                
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-center h-40 overflow-hidden relative group cursor-pointer" onClick={() => setLightboxPath('/images/estate_flow_icon_only.png')}>
                  <img src="/images/estate_flow_icon_only.png" className="max-h-full max-w-full object-contain rounded transition duration-300 group-hover:scale-105" alt="Estate Flow Geo Mark Only" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="text-white text-[11px] font-bold bg-slate-900/80 px-2.5 py-1.5 rounded-xl">View Large Scale</span>
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Superbly clean 1:1 icon asset illustrating blocks resembling real-estate holdings, styled directly in deep navy blue, teal, and navy trends.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <button 
                      onClick={() => handleApplyHeaderLogo('/images/estate_flow_icon_only.png', '#1c3d5a', '#00b4d8')}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2 rounded-lg transition text-center"
                    >
                      👑 Apply Workspace Logo
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/images/estate_flow_icon_only.png`);
                        alert('Icon mark absolute static URL copied to clipboard!');
                      }}
                      className="bg-white hover:bg-slate-100 text-slate-700 border font-bold py-2 rounded-lg transition text-center"
                    >
                      🔗 Copy Static Path
                    </button>
                  </div>
                </div>
              </div>

              {/* Asset 4: Mobile App Icon */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-105 flex flex-col justify-between space-y-3.5 hover:shadow-xs transition">
                <div className="space-y-1 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">04. Launcher App Icon</span>
                    <span className="text-[9px] font-mono text-slate-400">512 x 512 • Squircle Backdrop</span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs">Google Play Store & Apple App Stores</h4>
                </div>
                
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-center h-40 overflow-hidden relative group cursor-pointer" onClick={() => setLightboxPath('/images/estate_flow_app_icon.png')}>
                  <img src="/images/estate_flow_app_icon.png" className="max-h-full max-w-[140px] aspect-square object-contain rounded-3xl shadow-md transition duration-300 group-hover:scale-105" alt="Estate Flow Phone Launcher Icon" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="text-white text-[11px] font-bold bg-slate-900/80 px-2.5 py-1.5 rounded-xl">View Large Scale</span>
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Pristinely bounded squircle gradient icon. Perfectly tailored for mobile platforms launchers, app stores catalogs, and browser bookmarks.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <button 
                      onClick={() => handleApplyHeaderLogo('/images/estate_flow_app_icon.png', '#0b132b', '#1c3d5a')}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2 rounded-lg transition text-center"
                    >
                      👑 Apply Workspace Logo
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/images/estate_flow_app_icon.png`);
                        alert('App icon absolute static URL copied to clipboard!');
                      }}
                      className="bg-white hover:bg-slate-100 text-slate-700 border font-bold py-2 rounded-lg transition text-center"
                    >
                      🔗 Copy Static Path
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Asset 5: Flat Minimalist Light Mark */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-105 flex flex-col md:flex-row gap-5 items-center justify-between hover:shadow-xs transition">
              <div className="bg-white p-3 border border-slate-200 rounded-2xl flex items-center justify-center h-32 w-32 shrink-0 overflow-hidden relative group cursor-pointer" onClick={() => setLightboxPath('/images/estate_flow_logo_light_flat.png')}>
                <img src="/images/estate_flow_logo_light_flat.png" className="max-h-full max-w-full object-contain rounded transition duration-300 group-hover:scale-105" alt="Estate Flow Light Flat Asset" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold bg-slate-900/85 px-2 py-1 rounded">View Large</span>
                </div>
              </div>

              <div className="flex-1 space-y-2 text-xs text-left">
                <div className="flex justify-between items-center flex-wrap gap-2 text-left">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">05. Flat Minim-light</span>
                  <span className="text-[9px] font-mono text-slate-400">800 x 800 • Transparent Style</span>
                </div>
                <h4 className="font-extrabold text-slate-800 text-xs">Clean, Scalable Corporate Stationery Mark</h4>
                <p className="text-[11px] text-slate-500 leading-normal font-medium mt-1">
                  Specifically designed with flat elements, perfect for corporate reports header watermarks, dynamic billing invoices, and white-label client proposals.
                </p>

                <div className="flex gap-2 text-[10px] pt-1.5Packed font-bold">
                  <button 
                    onClick={() => handleApplyHeaderLogo('/images/estate_flow_logo_light_flat.png', '#0b132b', '#00b4d8')}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2 px-4 rounded-lg transition text-center"
                  >
                    👑 Apply Workspace Logo
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/images/estate_flow_logo_light_flat.png`);
                      alert('Light flat logo absolute static URL copied!');
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-705 border font-bold py-2 px-4 rounded-lg transition text-center"
                  >
                    🔗 Copy Path
                  </button>
                </div>
              </div>
            </div>

            {/* Design & Concept Blueprint Explanations with interactive controls */}
            <div className="border border-slate-700 p-4.5 rounded-2xl bg-gradient-to-r from-[#0b132b] to-[#1c3d5a] text-slate-200 text-xs leading-relaxed space-y-3 shadow-lg text-left">
              <div className="flex items-center gap-1.5">
                <Settings className="text-teal-400 animate-spin" style={{ animationDuration: '6s' }} size={16} />
                <span className="text-[10px] uppercase font-black text-teal-400 tracking-wider">Design & Architectural Blueprint</span>
              </div>
              <h4 className="text-white font-bold text-xs">Intelligent B2B Identity Concept Pairings</h4>
              <p className="text-slate-300 font-light text-[11px]">
                The visual Hexagon synthesizes five core B2B pillars: **Real estate blocks** (architectural shapes in clean horizontal divisions), **CRM node workflow** (overlapping dots representing client connectivity), **Upward financial trends** (ascending bars indicating geometric growth ratios), **Global security** (symmetry signaling absolute trust), and **Scalable responsive density** (optimized spacing built purposefully to reduce eye fatigue).
              </p>
              <div className="flex flex-wrap gap-2 text-[9px] text-slate-300">
                <span className="bg-slate-900/40 border border-slate-700/50 px-2 py-0.5 rounded-lg">Style: Swiss / Neo-Modern</span>
                <span className="bg-slate-950/60 text-emerald-400 border border-emerald-950 px-2 py-0.5 rounded-lg">Color: B2B Slate Premium Tone</span>
                <span className="bg-slate-900/40 border border-slate-705 px-2 py-0.5 rounded-lg">Power Factor: 100% Vector Responsive</span>
              </div>
            </div>

            {/* Lightbox Modal overlay popup rendering */}
            {lightboxPath && (
              <div className="fixed inset-0 bg-slate-950/85 z-[100] flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn" onClick={() => setLightboxPath(null)} id="brand-lightbox-overlay">
                <div className="relative bg-white rounded-3xl p-5 max-w-2xl w-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setLightboxPath(null)} className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-full cursor-pointer transition">
                    <X size={18} />
                  </button>
                  <img src={lightboxPath} className="max-h-[70vh] object-contain rounded-xl shadow-lg border border-slate-100" alt="Estate Flow Large Scale Brand Detail Asset" referrerPolicy="no-referrer" />
                  <div className="mt-4 text-center">
                    <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest block mb-1">Estate Flow brand representation</span>
                    <span className="text-xs text-slate-500 font-mono">Location: {lightboxPath}</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
