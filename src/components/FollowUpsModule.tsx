/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Phone, 
  MessageSquare, 
  MapPin, 
  X, 
  CheckCircle2, 
  Circle,
  AlertCircle,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { FollowUp, Lead, UserProfile } from '../types';

interface FollowUpsModuleProps {
  followups: FollowUp[];
  leads: Lead[];
  users: UserProfile[];
  onCompleteFollowup: (id: string) => void;
  onSnoozeFollowup: (id: string, newTime: string) => void;
}

export default function FollowUpsModule({
  followups,
  leads,
  users,
  onCompleteFollowup,
  onSnoozeFollowup
}: FollowUpsModuleProps) {
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('Pending'); // Default to showing incomplete ones
  const [snoozingId, setSnoozingId] = useState<string | null>(null);
  const [snoozeTime, setSnoozeTime] = useState('');

  const handleSnoozeSubmit = (id: string) => {
    if (!snoozeTime) {
      alert('Choose time');
      return;
    }
    onSnoozeFollowup(id, snoozeTime);
    setSnoozingId(null);
    setSnoozeTime('');
    alert('Appointment snoozed successfully.');
  };

  const filteredFollowups = followups.filter(f => {
    const matchType = filterType ? f.type === filterType : true;
    const matchStatus = filterStatus === 'Pending' ? !f.completed : f.completed;
    return matchType && matchStatus;
  });

  // Helper date status
  const getDueStatus = (dateStr: string) => {
    const targetDate = new Date(dateStr);
    const now = new Date();
    if (targetDate.getTime() < now.getTime()) {
      return { label: 'Overdue Checklist', style: 'text-amber-600 bg-amber-50 border-amber-200' };
    }
    return { label: 'Scheduled Alert', style: 'text-slate-600 bg-slate-50 border-slate-100' };
  };

  return (
    <div className="space-y-4" id="followups-module">
      {/* Banner */}
      <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-xs flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800">Touchpoints & Action Calendars</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">Scheduled client engagements</p>
        </div>

        {/* Filter Selection */}
        <div className="flex gap-2 text-xs">
          <select 
            id="fup-status-filter"
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-bold text-slate-700 focus:outline-none"
          >
            <option value="Pending">Pending Tasks</option>
            <option value="Completed">Processed History</option>
          </select>

          <select 
            id="fup-type-filter"
            value={filterType} 
            onChange={e => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-bold text-slate-700 focus:outline-none"
          >
            <option value="">All Action Types</option>
            <option value="Call">📞 Phone Calls</option>
            <option value="WhatsApp">💬 WhatsApp</option>
            <option value="Site Visit">🏡 Site Walks</option>
            <option value="SMS">📨 SMS Drops</option>
          </select>
        </div>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="followups-layout-grid">
        {filteredFollowups.map(fup => {
          const lead = leads.find(l => l.id === fup.leadId);
          const agent = users.find(u => u.id === fup.agentId);
          const dateObj = new Date(fup.datetime);
          const dueResult = getDueStatus(fup.datetime);

          return (
            <div 
              key={fup.id}
              className={`bg-white border p-4 rounded-2xl shadow-xs space-y-3.5 transition ${
                fup.completed ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-100'
              }`}
            >
              {/* Card Title & Type Icon */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className={`p-2 rounded-xl text-xs ${
                    fup.type === 'Call' ? 'bg-indigo-50 text-indigo-600' :
                    fup.type === 'WhatsApp' ? 'bg-emerald-50 text-emerald-600' :
                    fup.type === 'Site Visit' ? 'bg-purple-50 text-purple-600' : 'bg-slate-50 text-slate-600'
                  }`}>
                    {fup.type === 'Call' ? <Phone size={14} /> :
                     fup.type === 'WhatsApp' ? <MessageSquare size={14} /> :
                     fup.type === 'Site Visit' ? <MapPin size={14} /> : <Calendar size={14} />}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-none">
                      {fup.type === 'Site Visit' ? 'Site walkthrough' : `${fup.type} Campaign`}
                    </h4>
                    <span className="text-[10px] text-slate-400 mt-1 block">Lead: {lead ? lead.fullName : 'Unknown'}</span>
                  </div>
                </div>

                {/* Overdue/Status Label */}
                {!fup.completed ? (
                  <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 border rounded-md ${dueResult.style}`}>
                    {dueResult.label}
                  </span>
                ) : (
                  <span className="text-[9px] uppercase tracking-wider font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                    Processed
                  </span>
                )}
              </div>

              {/* Action specific details */}
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl text-xs text-slate-600 border border-slate-100">
                <div className="flex items-center gap-1">
                  <Clock size={12} className="text-slate-400" />
                  <span>Datetime: <strong>{dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                </div>
                <div className="mt-1 flex items-start gap-1">
                  <span className="text-slate-400 font-bold">Notes:</span>
                  <span className="text-slate-500 font-light ml-0.5">{fup.notes}</span>
                </div>
              </div>

              {/* Action panel */}
              {!fup.completed && (
                <div className="flex items-center gap-2 border-t border-slate-50 pt-3 text-xs justify-between">
                  {snoozingId === fup.id ? (
                    <div className="flex-1 flex gap-2" id={`snooze-zone-${fup.id}`}>
                      <input 
                        type="datetime-local" 
                        value={snoozeTime}
                        onChange={e => setSnoozeTime(e.target.value)}
                        className="bg-white border rounded-lg p-1.5 text-xs flex-1"
                      />
                      <button 
                        onClick={() => handleSnoozeSubmit(fup.id)}
                        className="bg-slate-900 text-white px-3.5 py-1.5 rounded-lg font-bold"
                      >
                        Snooze
                      </button>
                      <button 
                        onClick={() => setSnoozingId(null)}
                        className="bg-slate-100 text-slate-400 p-1.5 rounded-lg"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button 
                        id={`complete-followup-btn-${fup.id}`}
                        onClick={() => {
                          onCompleteFollowup(fup.id);
                          alert('Task marked completed. System logging triggered.');
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl cursor-pointer"
                      >
                        ✓ Mask as Met
                      </button>
                      <button 
                        onClick={() => setSnoozingId(fup.id)}
                        className="text-xs text-slate-500 hover:underline font-bold"
                      >
                        Reschedule / Snooze
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredFollowups.length === 0 && (
          <div className="col-span-2 text-center py-20 bg-white border border-slate-50 rounded-2xl text-slate-400 text-xs italic">
            Zero counseling tasks schedules currently active matching parameters.
          </div>
        )}
      </div>
    </div>
  );
}
