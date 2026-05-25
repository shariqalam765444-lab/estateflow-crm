/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  User, 
  Phone, 
  Mail, 
  Building2, 
  FileText, 
  X, 
  Check, 
  MessageSquare,
  Sparkles,
  Trash2,
  BookmarkCheck
} from 'lucide-react';
import { ContactPerson } from '../types';

interface ContactsModuleProps {
  currentUser: any;
  onRefreshActivities?: () => void;
}

export default function ContactsModule({ currentUser, onRefreshActivities }: ContactsModuleProps) {
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  
  // Custom avatar seed state to simulate custom styling
  const [avatarIndex, setAvatarIndex] = useState(1);
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);

  // Suggested preset photos for randomizing
  const PRESET_AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  ];

  const fetchContacts = () => {
    fetch('/api/contacts')
      .then(r => r.json())
      .then(data => setContacts(data || []))
      .catch(e => console.error('Error fetching contacts:', e));
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !phone.trim()) {
      alert('First Name and Phone Number are mandatory to save custom contacts.');
      return;
    }

    setLoading(true);
    const finalPhone = phone.trim().startsWith('+') ? phone.trim() : `+91${phone.trim().replace(/\D/g, '')}`;

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: finalPhone,
      email: email.trim(),
      company: company.trim(),
      notes: notes.trim()
    };

    fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        if (res.ok) {
          alert('Success: Contact cataloged securely inside WhatsApp Directory.');
          setFirstName('');
          setLastName('');
          setPhone('');
          setEmail('');
          setCompany('');
          setNotes('');
          setCustomAvatarUrl(null);
          setShowAddModal(false);
          fetchContacts();
          if (onRefreshActivities) {
            onRefreshActivities();
          }
        } else {
          const err = await res.json();
          alert(`Error: ${err.error || 'Failed to save contact person.'}`);
        }
      })
      .catch(err => {
        console.error(err);
        alert('Server connection trouble saving contact person.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Filter contacts list by search query
  const filteredContacts = contacts.filter(contact => {
    const q = searchQuery.toLowerCase();
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    return (
      fullName.includes(q) ||
      contact.phone.includes(q) ||
      (contact.company && contact.company.toLowerCase().includes(q))
    );
  });

  // Action bypass simulator triggers
  const triggerWhatsAppBypass = (contact: ContactPerson) => {
    const defaultText = `Hi ${contact.firstName}, regarding our real estate listings conversation...`;
    const encodedText = encodeURIComponent(defaultText);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${contact.phone.replace(/\+/g, '')}&text=${encodedText}`;
    alert(`Redirecting to mock WhatsApp chat thread with ${contact.firstName} (${contact.phone})`);
    window.open(whatsappUrl, '_blank');
  };

  const triggerCallBypass = (contact: ContactPerson) => {
    alert(`Placing counselor VoIP bridge call to ${contact.firstName} [${contact.phone}]...`);
  };

  // Helper colors for default avatars
  const getAvatarColorClass = (letter: string) => {
    const code = letter.charCodeAt(0) % 5;
    switch (code) {
      case 0: return 'bg-teal-650 text-white';
      case 1: return 'bg-emerald-600 text-white';
      case 2: return 'bg-indigo-600 text-white';
      case 3: return 'bg-amber-600 text-white';
      default: return 'bg-rose-600 text-white';
    }
  };

  return (
    <div className="space-y-5" id="whatsapp-contacts-engine">
      
      {/* HEADER HERO BAR */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg border border-slate-800 relative overflow-hidden flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-slate-950 text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase">
              WhatsApp Connect
            </span>
            <span className="text-emerald-400 font-bold text-xs animate-pulse flex items-center gap-1">
              • Saved Locally
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white uppercase">WhatsApp-Style Contacts</h2>
          <p className="text-slate-400 text-xs font-medium max-w-lg leading-relaxed">
            Manage your customer database manually. Add immediate contacts matching standard WhatsApp quick fields with live integration logs.
          </p>
        </div>

        <button
          id="open-whats-contact-btn"
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl transition duration-150 flex items-center justify-center gap-1.5 self-start cursor-pointer shadow-md shadow-emerald-950/20"
        >
          <Plus size={15} /> Save New Contact
        </button>
      </div>

      {/* SEARCH AND DIRECTORY CARD */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
        
        {/* Search controls */}
        <div className="relative">
          <input
            id="whats-contact-search-bar"
            type="text"
            placeholder="Search saved contacts by name, telephone or company..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <Search size={16} className="absolute left-4 top-3.5 text-slate-450" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-3 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total listings: {filteredContacts.length} people
          </span>
          {searchQuery && (
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">
              Filtered results
            </span>
          )}
        </div>

        {/* Contacts Grid/List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[500px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
          {filteredContacts.map(contact => {
            const initialLetter = contact.firstName ? contact.firstName.charAt(0).toUpperCase() : '?';
            const generatedAvatarBg = getAvatarColorClass(initialLetter);

            return (
              <div 
                key={contact.id} 
                className="p-4 bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-2xl transition duration-150 flex items-center justify-between gap-3 group relative hover:shadow-md"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* WhatsApp-Style Left Greenish/Color Circle Avatar */}
                  <div className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 uppercase tracking-wider relative ${generatedAvatarBg}`}>
                    {initialLetter}
                    <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 border-2 border-slate-50 h-3.5 w-3.5 rounded-full flex items-center justify-center">
                      <BookmarkCheck size={8} className="text-white" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 truncate">
                      {contact.firstName} {contact.lastName}
                      {contact.company && (
                        <span className="font-semibold text-[9px] bg-slate-200/80 text-slate-650 px-1.5 py-0.5 rounded-md truncate">
                          {contact.company}
                        </span>
                      )}
                    </h3>
                    
                    <p className="text-[11px] font-bold text-slate-500 mt-0.5 flex items-center gap-1 font-mono">
                      <Phone size={11} className="text-slate-400" /> {contact.phone}
                    </p>

                    {contact.email && (
                      <p className="text-[9px] text-slate-450 mt-0.5 flex items-center gap-1 truncate font-medium">
                        <Mail size={10} className="text-slate-450" /> {contact.email}
                      </p>
                    )}

                    {contact.notes && (
                      <p className="text-[10px] text-slate-400 leading-relaxed italic mt-1 line-clamp-1 border-t border-slate-200/50 pt-1 border-dashed">
                        "{contact.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* WhatsApp Action Buttons on Right */}
                <div className="flex items-center gap-1.5 shrink-0 pl-1">
                  
                  {/* Simulate Direct WhatsApp Chat Trigger */}
                  <button
                    onClick={() => triggerWhatsAppBypass(contact)}
                    className="p-2.5 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-slate-950 rounded-xl transition cursor-pointer"
                    title="Send WhatsApp Message"
                  >
                    <MessageSquare size={14} />
                  </button>

                  {/* Simulate Direct telephone dialing / voip callback */}
                  <button
                    onClick={() => triggerCallBypass(contact)}
                    className="p-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl transition cursor-pointer"
                    title="Initiate Real Phone Call"
                  >
                    <Phone size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredContacts.length === 0 && (
            <div className="col-span-2 text-center py-16 border rounded-2xl border-dashed border-slate-200 bg-slate-50 text-slate-400 text-xs italic">
              No contacts matched your search filter parameters. Try saving a new contact!
            </div>
          )}
        </div>
      </div>

      {/* WHATSAPP CONTACT SAVING MODAL DIALOG */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/65 z-50 flex items-center justify-center p-4" id="whatsapp-save-overlay">
          <div className="bg-white text-slate-800 rounded-3xl max-w-md w-full flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150" id="whatsapp-save-form-card">
            
            {/* WhatsApp Green Top Banner Header */}
            <div className="bg-[#008069] text-white px-5 py-4 flex items-center justify-between border-b border-emerald-850">
              <div className="flex items-center gap-2">
                <div className="bg-white/10 p-1.5 rounded-lg">
                  <User size={16} className="text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-widest text-white leading-none">WhatsApp Save Contact</h3>
                  <span className="text-[9px] text-teal-100 mt-1 block">Live EstateFlow CRM sync</span>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white transition p-1 hover:bg-black/10 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              
              {/* Profile Avatar simulation circle with camera click */}
              <div className="flex flex-col items-center space-y-1.5 py-1">
                <div className="relative group shrink-0 select-none">
                  {customAvatarUrl ? (
                    <img src={customAvatarUrl} alt="Contact custom" className="h-16 w-16 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 group-hover:bg-slate-50 transition">
                      <User size={24} className="text-slate-400 animate-pulse" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const nextAvatar = PRESET_AVATARS[avatarIndex % PRESET_AVATARS.length];
                      setCustomAvatarUrl(nextAvatar);
                      setAvatarIndex(prev => prev + 1);
                    }}
                    className="absolute -bottom-1 -right-1 bg-[#008069] text-white p-1 rounded-full border-2 border-white cursor-pointer active:scale-90 transition"
                    title="Change Profile Photo"
                  >
                    <Sparkles size={11} />
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Generate Contact photo</span>
              </div>

              {/* Form Input fields */}
              <div className="space-y-3.5 text-xs">
                
                {/* First Name & Last Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-550 block">First Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Priyanjali"
                      required
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-250 p-2.5 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-550 block">Last Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sen"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-250 p-2.5 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                    />
                  </div>
                </div>

                {/* Phone number */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-550 block">Phone Number <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. 9900011222 or +919900011222"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-250 pl-3 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Email address */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-550 block">Email address</label>
                  <input
                    type="email"
                    placeholder="e.g. sen@godrej.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 p-2.5 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Organization / Company */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-550 block flex items-center gap-1">
                    <Building2 size={11} className="text-[#008069]" /> Oragnization / Company
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Godrej Properties Developers"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 p-2.5 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                {/* Notes/Counselor info */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-550 block flex items-center gap-1">
                    <FileText size={11} className="text-[#008069]" /> Relationship Notes
                  </label>
                  <textarea
                    placeholder="Write details e.g. Territory bookings manager for real estate team..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-250 p-2.5 rounded-xl resize-none placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

              </div>

              {/* Confirm submit actions */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-center active:scale-98 transition"
                >
                  Discard
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#008069] hover:bg-[#006e5a] text-white font-black py-3 rounded-xl text-center flex items-center justify-center gap-1 active:scale-98 transition cursor-pointer shadow-md"
                >
                  <Check size={14} className="text-emerald-200" />
                  {loading ? 'Processing...' : 'Confirm Save'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
