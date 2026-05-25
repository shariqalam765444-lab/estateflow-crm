/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldAlert, 
  CreditCard, 
  Sliders, 
  Users, 
  TrendingUp, 
  Calendar,
  Layers, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Paintbrush, 
  Hash, 
  Percent, 
  Sparkles,
  Link,
  RefreshCw,
  Award,
  BookOpen
} from 'lucide-react';
import { Organization } from '../types';

interface SuperAdminPanelProps {
  onRefreshAllData: () => void;
  activeOrgId: string;
  onSelectOrg: (orgId: string) => void;
}

interface SuperStats {
  totalAgencies: number;
  activeAgencies: number;
  suspendedAgencies: number;
  freeCount: number;
  proCount: number;
  bizCount: number;
  enterpriseCount: number;
  totalLeads: number;
  totalProperties: number;
  totalUsers: number;
  totalContacts: number;
}

export default function SuperAdminPanel({ 
  onRefreshAllData, 
  activeOrgId,
  onSelectOrg 
}: SuperAdminPanelProps) {
  const [agencies, setAgencies] = useState<Organization[]>([]);
  const [stats, setStats] = useState<SuperStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Agency Creation Form States
  const [formName, setFormName] = useState('');
  const [formDomain, setFormDomain] = useState('');
  const [formAppName, setFormAppName] = useState('');
  const [formPlan, setFormPlan] = useState<'Free' | 'Pro' | 'Business' | 'Enterprise'>('Free');
  const [formColor, setFormColor] = useState('#0f765e'); // emerald
  const [formSecColor, setFormSecColor] = useState('#0f172a');
  const [formAccent, setFormAccent] = useState('emerald');
  const [formMaxLeads, setFormMaxLeads] = useState(15);
  const [formMaxProps, setFormMaxProps] = useState(8);
  const [formMaxUsers, setFormMaxUsers] = useState(3);
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Agency Editing state
  const [editingAgencyId, setEditingAgencyId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAppName, setEditAppName] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editColor, setEditColor] = useState('#008069');
  const [editSecColor, setEditSecColor] = useState('#1e293b');
  const [editPlan, setEditPlan] = useState<'Free' | 'Pro' | 'Business' | 'Enterprise'>('Free');
  const [editStatus, setEditStatus] = useState<'Active' | 'Suspended'>('Active');
  const [editMaxLeads, setEditMaxLeads] = useState(10);
  const [editMaxProps, setEditMaxProps] = useState(5);
  const [editMaxUsers, setEditMaxUsers] = useState(3);

  // Load super admin data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/saas/agencies').then(res => res.json()),
      fetch('/api/saas/super-stats').then(res => res.json())
    ])
      .then(([agenciesData, statsData]) => {
        setAgencies(agenciesData || []);
        setStats(statsData || null);
        setLoading(false);
      })
      .catch(err => {
        console.error('Super Admin Data Load Failed:', err);
        setLoading(false);
      });
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    onRefreshAllData();
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'form' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      alert('File size exceeds 1.5MB. Please choose a smaller brand logo image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (target === 'form') {
        setFormLogoUrl(base64String);
      } else {
        setEditLogoUrl(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearLogo = (target: 'form' | 'edit') => {
    if (target === 'form') {
      setFormLogoUrl('');
    } else {
      setEditLogoUrl('');
    }
  };

  // Create new Agency
  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formDomain) {
      alert('Agency Name and Custom Domain are mandatory fields.');
      return;
    }

    try {
      const resp = await fetch('/api/saas/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          domain: formDomain,
          appName: formAppName || formName,
          primaryColor: formColor,
          secondaryColor: formSecColor,
          accentColor: formAccent,
          subscriptionPlan: formPlan,
          maxLeadsLimit: Number(formMaxLeads),
          maxPropertiesLimit: Number(formMaxProps),
          maxUsersLimit: Number(formMaxUsers),
          logoUrl: formLogoUrl
        })
      });

      if (resp.ok) {
        alert(`Success! [${formName}] registered as a workspace tenant. Default administrator invited successfully.`);
        setFormName('');
        setFormDomain('');
        setFormAppName('');
        setFormLogoUrl('');
        setShowCreateForm(false);
        handleRefresh();
      } else {
        const err = await resp.json();
        alert(`Failed: ${err.error || 'Server rejected creation'}`);
      }
    } catch (err: any) {
      alert(`Network error during creation: ${err.message}`);
    }
  };

  // Delete Agency
  const handleDeleteAgency = async (id: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to completely delete the workspace tenant: "${name}"? This will permanently cascade-delete all properties, team members, and CRM leads associated with it. This action cannot be undone.`)) {
      return;
    }

    try {
      const resp = await fetch(`/api/saas/agencies/${id}`, { method: 'DELETE' });
      if (resp.ok) {
        alert(`Workspace "${name}" and all encapsulated multi-tenant rows purged.`);
        handleRefresh();
      }
    } catch (err: any) {
      alert(`Purge error: ${err.message}`);
    }
  };

  // Toggle Suspended state
  const handleToggleSuspension = async (agency: Organization) => {
    const nextStatus = agency.status === 'Active' ? 'Suspended' : 'Active';
    try {
      const resp = await fetch(`/api/saas/agencies/${agency.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (resp.ok) {
        alert(`Security status for ${agency.name} modified to [${nextStatus}].`);
        handleRefresh();
      }
    } catch (err: any) {
      alert(`Status toggle failed: ${err.message}`);
    }
  };

  // Save quick modifiers limits
  const handleSaveLimits = async (agencyId: string) => {
    try {
      const resp = await fetch(`/api/saas/agencies/${agencyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          appName: editAppName,
          logoUrl: editLogoUrl,
          primaryColor: editColor,
          secondaryColor: editSecColor,
          subscriptionPlan: editPlan,
          status: editStatus,
          maxLeadsLimit: Number(editMaxLeads),
          maxPropertiesLimit: Number(editMaxProps),
          maxUsersLimit: Number(editMaxUsers)
        })
      });
      if (resp.ok) {
        alert('Agency parameters and corporate branding updated successfully.');
        setEditingAgencyId(null);
        handleRefresh();
      }
    } catch (err: any) {
      alert(`Configuration failed: ${err.message}`);
    }
  };

  const startEditing = (agency: Organization) => {
    setEditingAgencyId(agency.id);
    setEditName(agency.name);
    setEditAppName(agency.appName || agency.name);
    setEditLogoUrl(agency.logoUrl || '');
    setEditColor(agency.primaryColor || '#008069');
    setEditSecColor(agency.secondaryColor || '#1e293b');
    setEditPlan(agency.subscriptionPlan);
    setEditStatus(agency.status);
    setEditMaxLeads(agency.maxLeadsLimit);
    setEditMaxProps(agency.maxPropertiesLimit);
    setEditMaxUsers(agency.maxUsersLimit);
  };

  // Autofill limits based on plan selection in editing or creation
  const handlePlanChangeFill = (plan: 'Free' | 'Pro' | 'Business' | 'Enterprise', state: 'form' | 'edit') => {
    let leads = 15;
    let props = 8;
    let users = 3;

    if (plan === 'Pro') {
      leads = 100;
      props = 50;
      users = 8;
    } else if (plan === 'Business') {
      leads = 1000;
      props = 500;
      users = 30;
    } else if (plan === 'Enterprise') {
      leads = 99999;
      props = 99999;
      users = 99999;
    }

    if (state === 'form') {
      setFormPlan(plan);
      setFormMaxLeads(leads);
      setFormMaxProps(props);
      setFormMaxUsers(users);
    } else {
      setEditPlan(plan);
      setEditMaxLeads(leads);
      setEditMaxProps(props);
      setEditMaxUsers(users);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 p-8 space-y-4">
        <RefreshCw size={28} className="animate-spin text-indigo-600" />
        <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase">Reading SaaS registries & statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="super-admin-root">
      {/* SaaS Meta title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold uppercase px-2.5 py-1 rounded-full">
            SaaS Platform Administration Control
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-2">Super Admin Central Console</h1>
          <p className="text-xs text-slate-500">Full tenant lifecycle operations, subscription tiers, white label constraints, and aggregated system insights.</p>
        </div>
        <div className="flex items-center gap-2 select-none">
          <button 
            onClick={handleRefresh}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 transition rounded-xl flex items-center justify-center"
            title="Force refresh database records"
          >
            <RefreshCw size={15} />
          </button>
          <button 
            onClick={() => setShowCreateForm(prev => !prev)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={14} /> Register Agency Workspace
          </button>
        </div>
      </div>

      {/* Aggregate Platform Metrics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3" id="super-admin-dashboard-stats">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Total Tenants</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-xl font-bold text-slate-900">{stats.totalAgencies}</span>
              <span className="text-[9px] text-slate-400 font-semibold">agencies</span>
            </div>
            <div className="mt-2 text-[9px] text-emerald-600 flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              {stats.activeAgencies} Active Workspace Instances
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Enterprise Tiers</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-xl font-bold text-indigo-600">{stats.enterpriseCount}</span>
              <span className="text-[9px] text-slate-400 font-semibold">unlimited</span>
            </div>
            <span className="text-[9px] text-slate-400 block mt-2">
              Business plan accounts: <strong>{stats.bizCount}</strong>
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Free Tiers</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-xl font-bold text-slate-900">{stats.freeCount}</span>
              <span className="text-[9px] text-amber-600 font-bold">Limited</span>
            </div>
            <span className="text-[9px] text-amber-600 block mt-2">
              Pro plan accounts: <strong>{stats.proCount}</strong>
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Platform CRM Rows</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-xl font-bold text-slate-900">
                {stats.totalLeads + stats.totalProperties}
              </span>
              <span className="text-[9px] text-slate-400 font-semibold block">Total units</span>
            </div>
            <span className="text-[9px] text-slate-500 block mt-2">
              Leads: <strong>{stats.totalLeads}</strong> | Properties: <strong>{stats.totalProperties}</strong>
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Suspended Pools</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-xl font-bold text-rose-600">{stats.suspendedAgencies}</span>
              <span className="text-[9px] text-rose-500 font-medium">Overdue</span>
            </div>
            <div className="mt-2 text-[9px] text-rose-500 flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              Restricted workspace access
            </div>
          </div>
        </div>
      )}

      {/* Register New Agency Form Modal Drawer */}
      {showCreateForm && (
        <form onSubmit={handleCreateAgency} className="bg-white border border-indigo-100 rounded-2xl p-5 space-y-4" id="create-agency-form">
          <div className="flex justify-between items-center border-b border-solid border-slate-100 pb-2">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-800 flex items-center gap-1.5">
              <Building2 className="text-indigo-600 animate-bounce" size={15} />
              Provision New Workspace Account (Agency Tenant)
            </h3>
            <button 
              type="button" 
              onClick={() => setShowCreateForm(false)} 
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Company / Agency Name</label>
              <input 
                type="text" 
                required
                value={formName}
                onChange={e => {
                  setFormName(e.target.value);
                  if(!formAppName) setFormAppName(e.target.value);
                }}
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. London Elite Realty"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Custom Mapping Domain</label>
              <input 
                type="text" 
                required
                value={formDomain}
                onChange={e => {
                  setFormDomain(e.target.value.toLowerCase().trim());
                }}
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. londonrealty.co.uk"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">White Label Custom App Name</label>
              <input 
                type="text" 
                value={formAppName}
                onChange={e => setFormAppName(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500"
                placeholder="Custom App Name (optional)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-slate-100 pt-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Subscription Licensing Plan</label>
              <select 
                value={formPlan}
                onChange={e => handlePlanChangeFill(e.target.value as any, 'form')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs"
              >
                <option value="Free">Free (Limited Trial)</option>
                <option value="Pro">Pro (Growing Teams)</option>
                <option value="Business">Business (Enterprise-lite)</option>
                <option value="Enterprise">Enterprise (Fully Scaled)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Brand Main Accent Color</label>
              <div className="flex items-center gap-1">
                <input 
                  type="color" 
                  value={formColor} 
                  onChange={e => setFormColor(e.target.value)}
                  className="h-8 w-8 rounded-lg overflow-hidden border-none cursor-pointer p-0 bg-transparent animate-pulse"
                />
                <select 
                  value={formAccent}
                  onChange={e => setFormAccent(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-[10px] rounded-lg px-1 py-1 flex-1"
                >
                  <option value="emerald">Emerald Green</option>
                  <option value="indigo">Royal Indigo</option>
                  <option value="orange">Bright Orange</option>
                  <option value="rose">Soft Rose Red</option>
                  <option value="violet">Cosmic Violet</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Subsciption Lead Cap Limit</label>
              <input 
                type="number" 
                required
                value={formMaxLeads}
                onChange={e => setFormMaxLeads(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Max Assigned Properties Slot</label>
              <input 
                type="number" 
                required
                value={formMaxProps}
                onChange={e => setFormMaxProps(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
              />
            </div>
          </div>

          {/* Logo Upload Feature Container */}
          <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 space-y-3">
            <span className="block text-[10px] uppercase font-bold text-slate-500">Agency Corporate Branding Logo</span>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Preview Circle */}
              <div className="h-16 w-32 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0 relative group shadow-xs">
                {formLogoUrl ? (
                  <>
                    <img src={formLogoUrl} className="h-full w-full object-contain p-2" alt="Logo preview" referrerPolicy="no-referrer" />
                    <button 
                      type="button" 
                      onClick={() => clearLogo('form')}
                      className="absolute inset-0 bg-black/60 text-white text-[9px] font-black uppercase tracking-wide opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer"
                    >
                      Clear Logo
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">No Brand Logo</span>
                )}
              </div>

              {/* Upload Interactions */}
              <div className="space-y-2 flex-grow w-full">
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl border border-slate-300 transition cursor-pointer text-center inline-block shrink-0">
                    📤 Select Corporate Logo File
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleLogoFileChange(e, 'form')} 
                      className="hidden" 
                    />
                  </label>
                  
                  <input 
                    type="text" 
                    value={formLogoUrl}
                    onChange={(e) => setFormLogoUrl(e.target.value)}
                    placeholder="Or copy and paste an external Logo image URL here..."
                    className="flex-1 bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  Ideal dimension is landscapes (aspect 4:1 max, e.g. 240x60 pixels under 1.5MB in size). Real-time uploads support standard formats securely.
                </p>

                {/* Preset Templates */}
                <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-slate-150">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase">Instant Tester Mock Logos:</span>
                  <button 
                    type="button"
                    onClick={() => setFormLogoUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80')}
                    className="text-[9px] bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 text-yellow-800 px-2 py-0.5 rounded-lg font-bold transition cursor-pointer"
                  >
                    👑 Gold Premium Crest
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormLogoUrl('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=80')}
                    className="text-[9px] bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 px-2 py-0.5 rounded-lg font-bold transition cursor-pointer"
                  >
                    🏙️ Modern Metropolitan
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormLogoUrl('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=120&q=80')}
                    className="text-[9px] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-lg font-bold transition cursor-pointer"
                  >
                    🌿 Emerald Garden Homes
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button 
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
            >
              Confirm System Registration
            </button>
          </div>
        </form>
      )}

      {/* Agencies registry table grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden" id="agencies-registry-sandbox">
        <div className="px-5 py-4 border-b border-solid border-slate-50 bg-slate-50 flex justify-between items-center">
          <h2 className="text-xs uppercase font-extrabold tracking-wider text-slate-700 flex items-center gap-1.5">
            <Layers size={15} /> Registered Client Tenants Database (SaaS Workspace Isolation)
          </h2>
          <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md animate-pulse">
            Active Multi-Agency Segmentation
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {agencies.map(agency => {
            const isEditing = editingAgencyId === agency.id;
            const isDefaultSelected = activeOrgId === agency.id;

            return (
              <div key={agency.id} className={`p-5 transition hover:bg-slate-50/50 ${isDefaultSelected ? 'border-l-4 border-indigo-600 bg-indigo-50/30' : ''}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  {/* Name, app title, URL, mapping status */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1 px-2 rounded-lg text-white font-black text-xs uppercase" style={{ backgroundColor: agency.primaryColor || '#000' }}>
                        {agency.appName?.substring(0, 2) || agency.name.substring(0,2)}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{agency.name}</h3>
                      
                      {/* Sub Tag */}
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        agency.subscriptionPlan === 'Enterprise' ? 'bg-indigo-100 text-indigo-700' :
                        agency.subscriptionPlan === 'Business' ? 'bg-emerald-100 text-emerald-700' :
                        agency.subscriptionPlan === 'Pro' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {agency.subscriptionPlan} Plan
                      </span>

                      {/* Status Tag */}
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        agency.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 animate-pulse'
                      }`}>
                        {agency.status === 'Active' ? <CheckCircle size={9} /> : <XCircle size={9} />}
                        {agency.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <strong>ID:</strong> <code className="text-[10px] bg-slate-100 px-1 rounded">{agency.id}</code>
                      </span>
                      <span className="flex items-center gap-1">
                        <strong>Mapped Domain:</strong> <code className="text-[10px] text-indigo-600 hover:underline">{agency.domain}</code>
                      </span>
                      <span className="flex items-center gap-1">
                        <strong>Primary Accent:</strong> <span className="h-3 w-3 rounded inline-block" style={{ backgroundColor: agency.primaryColor }} /> {agency.primaryColor || '#008069'}
                      </span>
                    </div>
                  </div>

                  {/* Actions bar / workspace jump login */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => {
                        onSelectOrg(agency.id);
                        alert(`Tenant Workspace context swapped! Dynamic UI components & secure data filters relocated to [${agency.name}] branding environment.`);
                      }}
                      className={`font-semibold text-[11px] px-3.5 py-1.5 rounded-xl transition ${
                        isDefaultSelected 
                          ? 'bg-slate-900 text-white cursor-default font-black' 
                          : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 cursor-pointer'
                      }`}
                    >
                      {isDefaultSelected ? '✓ Active Context' : '🔌 Jump Into Agency Workspace'}
                    </button>

                    {!isEditing && (
                      <button 
                        onClick={() => startEditing(agency)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
                        title="Configure limits and subscriptions"
                      >
                        <Sliders size={14} />
                      </button>
                    )}

                    <button 
                      onClick={() => handleToggleSuspension(agency)}
                      className={`p-1.5 rounded-xl transition ${
                        agency.status === 'Active' 
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-600' 
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                      }`}
                      title={agency.status === 'Active' ? "Suspend Agency Access" : "Activate Agency Workspace"}
                    >
                      <ShieldAlert size={14} />
                    </button>

                    <button 
                      onClick={() => handleDeleteAgency(agency.id, agency.name)}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition"
                      title="Decommission Tenant Workspace"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Inline Editing for Plan details & constraints limits */}
                {isEditing && (
                  <div className="bg-slate-50 p-4 rounded-xl mt-3 space-y-4 border border-slate-200 animate-slideUp">
                    {/* Basic details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Update Agency Name</label>
                        <input 
                          type="text" 
                          required
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="bg-white border text-xs text-slate-800 rounded-lg px-2.5 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Corporate App Title</label>
                        <input 
                          type="text" 
                          required
                          value={editAppName}
                          onChange={e => setEditAppName(e.target.value)}
                          className="bg-white border text-xs text-slate-800 rounded-lg px-2.5 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 font-mono">Accent Theme Color</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={editColor}
                            onChange={e => setEditColor(e.target.value)}
                            className="h-8 w-12 rounded overflow-hidden border-none cursor-pointer bg-transparent"
                          />
                          <input 
                            type="text" 
                            value={editColor}
                            onChange={e => setEditColor(e.target.value)}
                            className="bg-white border text-xs text-slate-800 rounded-lg px-2 py-1.5 w-24 text-center font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Logo upload feature directly inside edit */}
                    <div className="bg-white p-3.5 rounded-xl border border-solid border-slate-205 space-y-2">
                      <span className="block text-[10px] uppercase font-extrabold text-slate-650">Modify Corporate Logo</span>
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="h-14 w-28 bg-slate-50 border border-slate-200 rounded flex items-center justify-center overflow-hidden shrink-0 relative group">
                          {editLogoUrl ? (
                            <>
                              <img src={editLogoUrl} className="h-full w-full object-contain p-1.5" alt="Logo edit" referrerPolicy="no-referrer" />
                              <button 
                                type="button" 
                                onClick={() => clearLogo('edit')}
                                className="absolute inset-0 bg-black/70 text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer uppercase tracking-wider"
                              >
                                Clear
                              </button>
                            </>
                          ) : (
                            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">No Logo</span>
                          )}
                        </div>

                        <div className="space-y-1.5 flex-1 w-full">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <label className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[11px] px-3 py-1.5 rounded-lg border border-slate-300 transition cursor-pointer text-center inline-block shrink-0">
                              📤 Upload New Logo
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleLogoFileChange(e, 'edit')} 
                                className="hidden" 
                              />
                            </label>
                            <input 
                              type="text" 
                              value={editLogoUrl}
                              onChange={(e) => setEditLogoUrl(e.target.value)}
                              placeholder="Or paste an image URL directly here..."
                              className="flex-1 bg-white border border-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Threshold Limits */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Set Subscription Plan</label>
                        <select 
                          value={editPlan}
                          onChange={e => handlePlanChangeFill(e.target.value as any, 'edit')}
                          className="bg-white border text-xs text-slate-800 rounded-lg px-2 py-1.5 w-full"
                        >
                          <option value="Free">Free (Limited Trial)</option>
                          <option value="Pro">Pro (Growing Teams)</option>
                          <option value="Business">Business (Enterprise-lite)</option>
                          <option value="Enterprise">Enterprise (Fully Scaled)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1 font-mono">Leads Allocation Threshold</label>
                        <input 
                          type="number" 
                          value={editMaxLeads}
                          onChange={e => setEditMaxLeads(Number(e.target.value))}
                          className="bg-white border text-xs rounded-lg px-2.5 py-1 w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1 font-mono">Properties Limit</label>
                        <input 
                          type="number" 
                          value={editMaxProps}
                          onChange={e => setEditMaxProps(Number(e.target.value))}
                          className="bg-white border text-xs rounded-lg px-2.5 py-1 w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1 font-mono">Team Seats Limit</label>
                        <input 
                          type="number" 
                          value={editMaxUsers}
                          onChange={e => setEditMaxUsers(Number(e.target.value))}
                          className="bg-white border text-xs rounded-lg px-2.5 py-1 w-full"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-1.5 pt-3 border-t border-slate-200">
                      <button 
                        type="button" 
                        onClick={() => setEditingAgencyId(null)}
                        className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg"
                      >
                        Abort
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleSaveLimits(agency.id)}
                        className="text-[10px] uppercase font-bold text-white px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
                      >
                        Save Agency Brand & Settings
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SaaS Architecture System Documentation Section */}
      <div className="bg-slate-900 text-slate-300 rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-6">
          <Layers size={180} />
        </div>
        <div className="space-y-3 relative z-10">
          <h3 className="text-xs uppercase tracking-wider font-extrabold text-indigo-400 flex items-center gap-1.5">
            <Award size={14} /> Scalable SaaS Architecture & White Label Licensing Blueprints
          </h3>
          <p className="text-xs leading-relaxed max-w-4xl text-slate-350">
            This platform runs a fully multitenant database layer segregated by <code className="text-[11px] bg-slate-800 text-emerald-400 rounded px-1">organizationId</code> keys. 
            All API retrievals and creations query dynamic tenant registers, securing data isolation between rival brokers in real-time. 
            When jumping into an isolated agency workspace above, standard panels dynamically adapt brand color variables, custom welcome banners, and custom application titles instantly!
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400 pt-2">
            <div className="bg-slate-950/40 p-2.5 border border-slate-800/50 rounded-lg">
              <strong className="text-white block mb-1">⭐ White Label UI Engine</strong>
              Dynamic styles insert a live style tag modifying raw theme variables according to the tenant colors config.
            </div>
            <div className="bg-slate-950/40 p-2.5 border border-slate-800/50 rounded-lg">
              <strong className="text-white block mb-1">📈 Billing Limit Interceptors</strong>
              Free plan restricts counts. Star Homes (Free tier, limits: 8 leads / 4 properties) triggers alerts on exceeding bounds.
            </div>
            <div className="bg-slate-950/40 p-2.5 border border-slate-800/50 rounded-lg">
              <strong className="text-white block mb-1">🔒 High-Security Suspension Overlay</strong>
              Set status as 'Suspended' for Suspended Capital etc. to immediately hide normal tabs beneath a payment-reminder shield!
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
