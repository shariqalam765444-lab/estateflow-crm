/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Phone, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Home, 
  Users, 
  TrendingUp, 
  Activity,
  Plus,
  Sparkles,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { Lead, Activity as CRMActivity, DashboardStats, UserProfile } from '../types';

interface DashboardProps {
  stats: DashboardStats;
  activities: CRMActivity[];
  currentUser: UserProfile;
  leads: Lead[];
  onNavigate: (tab: string, subview?: string) => void;
  onOpenAddLead: () => void;
  onTriggerAiAssistant: () => void;
}

export default function Dashboard({ 
  stats, 
  activities, 
  currentUser, 
  leads,
  onNavigate,
  onOpenAddLead,
  onTriggerAiAssistant
}: DashboardProps) {
  
  const hotLeads = leads.filter(l => l.temperature === 'Hot' && l.status !== 'Won' && l.status !== 'Lost');
  const greeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6" id="dashboard-module">
      {/* Personalized Greeting banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden" id="dashboard-hero">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-6 translate-x-6">
          <TrendingUp size={200} />
        </div>
        <div className="relative z-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full">
            EstateFlow CRM Live
          </span>
          <h1 className="text-2xl font-bold mt-3 tracking-tight">
            {greeting()}, {currentUser.name}!
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-md">
            Managed role: <strong className="text-emerald-300">{currentUser.role}</strong>. Here is your team's real-time productivity overview.
          </p>
          
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button 
              id="quick-add-lead-btn"
              onClick={onOpenAddLead}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition duration-150 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <Plus size={14} /> Add Lead
            </button>
            <button 
              id="quick-attendance-btn"
              onClick={() => onNavigate('more', 'attendance')}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition duration-150 flex items-center gap-1.5"
            >
              <MapPin size={14} /> Attendance Login
            </button>
          </div>
        </div>
      </div>

      {/* AI command co-pilot dashboard block */}
      <div 
        id="dashboard-ai-pilot-widget"
        onClick={onTriggerAiAssistant}
        className="bg-slate-950 p-5 rounded-2xl border border-slate-850 shadow-xl relative overflow-hidden cursor-pointer hover:border-emerald-500/50 transition duration-150 group"
      >
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-3 translate-x-3">
          <Sparkles size={110} className="text-emerald-400 animate-pulse" />
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-900/50 px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit select-none">
              <Sparkles size={11} className="animate-spin text-emerald-400" style={{ animationDuration: '3s' }} /> Co-Pilot Automation Active
            </span>
            <h3 className="text-sm font-bold text-white mt-1.5">Voice & Text CRM Assistant</h3>
            <p className="text-[11px] text-slate-400 leading-normal max-w-2xl">
              Tap here to quickly tell the custom Gemini model to map candidate profiles, write notes, schedule site visit tasks, and draft planner events directly from chat or spoken voice commands.
            </p>
          </div>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-xl transition font-black text-xs flex items-center gap-1.5 group-hover:scale-105 select-none shrink-0">
            Launch Co-Pilot
          </button>
        </div>
      </div>

      {/* Metric Cards Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" id="dashboard-metrics">
        <div 
          onClick={() => onNavigate('leads', 'New')}
          className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-slate-300 transition cursor-pointer flex flex-col justify-between shadow-xs"
        >
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-medium">New Today</span>
            <span className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg">
              <Plus size={16} />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{stats.newLeadsToday}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Auto-assigned</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('followups')}
          className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-slate-300 transition cursor-pointer flex flex-col justify-between shadow-xs"
        >
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-medium">Due Followups</span>
            <span className="bg-blue-50 text-blue-600 p-1.5 rounded-lg">
              <Clock size={16} />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{stats.followupsDueToday}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Pending action</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('leads', 'Hot')}
          className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-slate-300 transition cursor-pointer flex flex-col justify-between shadow-xs"
        >
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-medium">Hot Leads</span>
            <span className="bg-amber-50 text-amber-600 p-1.5 rounded-lg animate-pulse">
              <AlertTriangle size={16} />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{stats.hotLeadsCount}</span>
            <span className="text-[10px] text-amber-600 block mt-0.5">High conversion</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('more', 'attendance')}
          className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-slate-300 transition cursor-pointer flex flex-col justify-between shadow-xs"
        >
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-medium">Active Staff</span>
            <span className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg">
              <Users size={16} />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{stats.presentAgentsCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Currently in field</span>
          </div>
        </div>
      </div>

      {/* Secondary Quick Overview Bento bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Inventory & Visits */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Home size={16} className="text-indigo-500" />
            Active Properties Summary
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl text-center">
              <span className="text-xs text-slate-500 block">Available Inventory</span>
              <span className="text-2xl font-bold text-slate-800 block mt-1">{stats.availableInventoryCount}</span>
              <button 
                onClick={() => onNavigate('properties')}
                className="text-[11px] text-indigo-600 hover:underline font-semibold mt-1"
              >
                View Catalog
              </button>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl text-center">
              <span className="text-xs text-slate-500 block">Site Visits Scheduled</span>
              <span className="text-2xl font-bold text-slate-800 block mt-1">{stats.siteVisitsScheduledCount}</span>
              <button 
                onClick={() => onNavigate('followups')}
                className="text-[11px] text-indigo-600 hover:underline font-semibold mt-1"
              >
                Schedule Log
              </button>
            </div>
          </div>
        </div>

        {/* Hot Leads Mini Strip List */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles size={16} className="text-amber-500" />
              Hot Leads Awaiting Action
            </h2>
            <button 
              onClick={() => onNavigate('leads', 'Hot')}
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              See All
            </button>
          </div>
          
          <div className="space-y-2">
            {hotLeads.slice(0, 3).map(lead => (
              <div 
                key={lead.id} 
                onClick={() => onNavigate('leads')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 border border-amber-100/50 hover:bg-amber-50 transition cursor-pointer"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{lead.fullName}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{lead.preferredLocation} • {lead.propertyType}</p>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-md">
                  {lead.status}
                </span>
              </div>
            ))}
            {hotLeads.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">
                Zero active Hot Leads today. Excellent performance!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent CRM Activities timeline */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Activity size={16} className="text-emerald-500" />
            Live CRM Activity Feed
          </h2>
          <span className="text-xs text-slate-400 uppercase tracking-widest text-[9px] font-bold">
            Realtime Active
          </span>
        </div>

        <div className="relative pl-3 border-l-2 border-slate-100 space-y-4" id="activities-timeline">
          {activities.slice(0, 6).map((act, index) => (
            <div key={act.id || index} className="relative space-y-1">
              {/* Dot marker */}
              <span className={`absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                act.type === 'Call' ? 'bg-indigo-500' :
                act.type === 'Message' ? 'bg-emerald-500' :
                act.type === 'Assignment' ? 'bg-pink-500' :
                act.type === 'StatusChange' ? 'bg-blue-500' : 'bg-slate-400'
              }`} />
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-800">{act.title}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-slate-500 mr-2 leading-relaxed">{act.description}</p>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              No recent CRM activities logged yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
