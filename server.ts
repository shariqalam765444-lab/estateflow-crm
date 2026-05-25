/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Database, generateId } from './server/database';
import { callService, messageService, emailService, aiService } from './server/services';
import { Lead, Property, UserProfile, SocialPost, FollowUp, Attendance, UserRole } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Set up databases from store
Database.initialize();

// API ROUTES

// SaaS Super Admin routes
app.get('/api/saas/agencies', (req, res) => {
  const store = Database.get();
  res.json(store.organizations || []);
});

app.post('/api/saas/agencies', (req, res) => {
  const { name, domain, appName, primaryColor, secondaryColor, accentColor, subscriptionPlan, status, maxLeadsLimit, maxPropertiesLimit, maxUsersLimit, logoUrl } = req.body;
  if (!name || !domain) {
    res.status(400).json({ error: 'Agency name and domain are required.' });
    return;
  }
  const store = Database.get();
  const id = `org-${domain.replace(/\./g, '-')}-${Math.floor(Math.random() * 100)}`;
  const newAgency = {
    id,
    name,
    domain,
    appName: appName || name,
    primaryColor: primaryColor || '#008069',
    secondaryColor: secondaryColor || '#1e293b',
    accentColor: accentColor || 'emerald',
    subscriptionPlan: subscriptionPlan || 'Free',
    status: status || 'Active',
    maxLeadsLimit: Number(maxLeadsLimit) || 15,
    maxPropertiesLimit: Number(maxPropertiesLimit) || 10,
    maxUsersLimit: Number(maxUsersLimit) || 3,
    logoUrl: logoUrl || '',
    createdAt: new Date().toISOString()
  };

  store.organizations.push(newAgency);

  // Invite an initial Admin for this new agency
  const adminName = `${name} Owner`;
  store.users.push({
    id: `user-admin-${id}`,
    organizationId: id,
    name: adminName,
    email: `owner@${domain}`,
    role: 'Admin / Business Owner',
    phone: '+919999900100',
    avatarSeed: 'admin'
  });

  Database.save();
  res.status(201).json(newAgency);
});

app.put('/api/saas/agencies/:id', (req, res) => {
  const { id } = req.params;
  const store = Database.get();
  const index = store.organizations.findIndex(org => org.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Agency not found' });
    return;
  }
  
  const updatedOrg = {
    ...store.organizations[index],
    ...req.body
  };
  
  store.organizations[index] = updatedOrg;
  Database.save();
  res.json(updatedOrg);
});

app.delete('/api/saas/agencies/:id', (req, res) => {
  const { id } = req.params;
  const store = Database.get();
  store.organizations = store.organizations.filter(org => org.id !== id);
  // Optional cascade deletes
  store.leads = store.leads.filter(l => l.organizationId !== id);
  store.properties = store.properties.filter(p => p.organizationId !== id);
  store.users = store.users.filter(u => u.organizationId !== id);
  Database.save();
  res.json({ success: true });
});

app.get('/api/saas/super-stats', (req, res) => {
  const store = Database.get();
  const totalAgencies = store.organizations.length;
  const activeAgencies = store.organizations.filter(o => o.status === 'Active').length;
  const suspendedAgencies = store.organizations.filter(o => o.status === 'Suspended').length;
  
  // Tiers counters
  const freeCount = store.organizations.filter(o => o.subscriptionPlan === 'Free').length;
  const proCount = store.organizations.filter(o => o.subscriptionPlan === 'Pro').length;
  const bizCount = store.organizations.filter(o => o.subscriptionPlan === 'Business').length;
  const enterpriseCount = store.organizations.filter(o => o.subscriptionPlan === 'Enterprise').length;
  
  res.json({
    totalAgencies,
    activeAgencies,
    suspendedAgencies,
    freeCount,
    proCount,
    bizCount,
    enterpriseCount,
    totalLeads: store.leads.length,
    totalProperties: store.properties.length,
    totalUsers: store.users.length,
    totalContacts: (store.contacts || []).length
  });
});

// 1. User/Team routes with tenant isolation
app.get('/api/users', (req, res) => {
  const store = Database.get();
  const orgId = req.query.organizationId as string;
  if (orgId) {
    res.json(store.users.filter(u => u.organizationId === orgId));
  } else {
    res.json(store.users);
  }
});

// Contacts routes with tenant isolation
app.get('/api/contacts', (req, res) => {
  const store = Database.get();
  const orgId = req.query.organizationId as string;
  const contactsList = store.contacts || [];
  if (orgId) {
    res.json(contactsList.filter(c => c.organizationId === orgId));
  } else {
    res.json(contactsList);
  }
});

app.post('/api/contacts', (req, res) => {
  const { firstName, lastName, phone, email, company, notes, organizationId } = req.body;
  if (!firstName || !phone) {
    res.status(400).json({ error: 'First Name and Phone Number are mandatory.' });
    return;
  }
  const store = Database.get();
  const orgId = organizationId || store.organizations[0].id;
  
  const newContact = {
    id: generateId('contact'),
    organizationId: orgId,
    firstName,
    lastName: lastName || '',
    phone,
    email: email || '',
    company: company || '',
    notes: notes || '',
    avatarSeed: firstName.toLowerCase() + '-' + Math.floor(Math.random() * 100),
    createdAt: new Date().toISOString()
  };
  
  if (!store.contacts) {
    store.contacts = [];
  }
  store.contacts.push(newContact);
  Database.save();

  // Log contact creation in activity timeline
  const nowStr = new Date().toISOString();
  store.activities.unshift({
    id: generateId('act'),
    organizationId: orgId,
    leadId: '',
    userId: `user-admin-${orgId}`,
    type: 'System',
    title: 'Manual Contact Saved',
    description: `Manually saved WhatsApp-style contact: ${firstName} ${lastName} (${phone})`,
    timestamp: nowStr
  });
  Database.save();

  res.status(201).json(newContact);
});

app.post('/api/users/invite', (req, res) => {
  const { name, email, role, phone, organizationId } = req.body;
  if (!name || !email || !role || !phone) {
    res.status(400).json({ error: 'Please provide all details to invite standard staff.' });
    return;
  }
  const store = Database.get();
  const orgId = organizationId || store.organizations[0].id;
  
  // Enforce Multi-tenant team member subscription limit!
  const targetOrg = store.organizations.find(o => o.id === orgId);
  if (targetOrg) {
    const currentUsersCount = store.users.filter(u => u.organizationId === orgId).length;
    if (currentUsersCount >= targetOrg.maxUsersLimit) {
      res.status(400).json({ 
        error: `Subscription Limit Reached! Under your ${targetOrg.subscriptionPlan} Plan, you are limited to a maximum of ${targetOrg.maxUsersLimit} team members. Please upgrade your plan in the Super Admin panel to add more.` 
      });
      return;
    }
  }

  const newUser: UserProfile = {
    id: generateId('user'),
    organizationId: orgId,
    name,
    email,
    role,
    phone,
    avatarSeed: name.toLowerCase().split(' ')[0]
  };
  store.users.push(newUser);
  Database.save();

  // Also create a system activity log
  const nowStr = new Date().toISOString();
  store.activities.unshift({
    id: generateId('act'),
    organizationId: orgId,
    leadId: '',
    userId: `user-admin-${orgId}`,
    type: 'System',
    title: 'Staff Invited',
    description: `New team member [${name}] invited as Role [${role}].`,
    timestamp: nowStr
  });
  Database.save();

  res.status(201).json(newUser);
});

// 2. Lead routes with tenant isolation and subscription verification
app.get('/api/leads', (req, res) => {
  const store = Database.get();
  const orgId = req.query.organizationId as string;
  if (orgId) {
    res.json(store.leads.filter(l => l.organizationId === orgId));
  } else {
    res.json(store.leads);
  }
});

app.post('/api/leads', (req, res) => {
  const { fullName, phone, email, source, propertyType, budgetMin, budgetMax, preferredLocation, notes, temperature, organizationId } = req.body;
  
  if (!fullName || !phone || !source || !propertyType) {
    res.status(400).json({ error: 'Full name, Phone number, Source and Property Type are mandatory.' });
    return;
  }

  const store = Database.get();
  const orgId = organizationId || store.organizations[0].id;

  // Verify Lead counts against Plan Limit!
  const targetOrg = store.organizations.find(o => o.id === orgId);
  if (targetOrg) {
    const currentLeadsCount = store.leads.filter(l => l.organizationId === orgId).length;
    if (currentLeadsCount >= targetOrg.maxLeadsLimit) {
      res.status(400).json({
        error: `Subscription Limit Reached! Under your ${targetOrg.subscriptionPlan} Plan, you are limited to a maximum of ${targetOrg.maxLeadsLimit} leads. Please upgrade your agency plan in the Super Admin Panel to capture more leads.`
      });
      return;
    }
  }
  
  // Create lead using proper dynamic tenant allocation
  const newLead = Database.assignLeadToAgent({
    fullName,
    phone,
    email: email || '',
    source,
    propertyType,
    budgetMin: Number(budgetMin) || 1000000,
    budgetMax: Number(budgetMax) || 10000000,
    preferredLocation: preferredLocation || 'Gurgaon',
    status: 'New',
    temperature: temperature || 'Warm',
    notes: notes || '',
    isHot: temperature === 'Hot'
  }, orgId);

  // Automatically trigger the automatic agent-to-lead call bridge
  callService.triggerCallBridge(newLead.id);

  res.status(201).json(newLead);
});

app.put('/api/leads/:id', (req, res) => {
  const { id } = req.params;
  const store = Database.get();
  const leadIndex = store.leads.findIndex(l => l.id === id);

  if (leadIndex === -1) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }

  const oldLead = store.leads[leadIndex];
  const updatedLead = {
    ...oldLead,
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  store.leads[leadIndex] = updatedLead;

  // Log status changes or reassignments
  const nowStr = new Date().toISOString();
  if (oldLead.status !== updatedLead.status) {
    store.activities.unshift({
      id: generateId('act'),
      organizationId: oldLead.organizationId,
      leadId: id,
      userId: updatedLead.assignedAgentId || `user-admin-${oldLead.organizationId}`,
      type: 'StatusChange',
      title: 'Status Updated',
      description: `Lead status progressed from [${oldLead.status}] to [${updatedLead.status}].`,
      timestamp: nowStr
    });
  }

  if (oldLead.assignedAgentId !== updatedLead.assignedAgentId) {
    const newAgent = store.users.find(u => u.id === updatedLead.assignedAgentId);
    store.activities.unshift({
      id: generateId('act'),
      organizationId: oldLead.organizationId,
      leadId: id,
      userId: `user-admin-${oldLead.organizationId}`,
      type: 'Assignment',
      title: 'Lead Reassigned',
      description: `Lead assigned agent reallocated to [${newAgent ? newAgent.name : 'Unknown Agent'}].`,
      timestamp: nowStr
    });

    if (updatedLead.assignedAgentId) {
      store.notifications.unshift({
        id: generateId('notif'),
        organizationId: oldLead.organizationId,
        userId: updatedLead.assignedAgentId,
        title: 'New Lead Reassigned',
        description: `Lead ${updatedLead.fullName} has been reallocated to you by management.`,
        type: 'LeadAssigned',
        isRead: false,
        createdAt: nowStr
      });
    }
  }

  Database.save();
  res.json(updatedLead);
});

// 3. Webhook Intake Endpoint
app.post('/api/webhooks/leads', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const store = Database.get();
  
  // Optional security token verify
  const providedSecret = req.query.secret || req.body.secret || '';
  if (store.settings.leadWebhookSecret && providedSecret && providedSecret !== store.settings.leadWebhookSecret) {
    res.status(401).json({ error: 'Unauthorized webhook secret code verification failed.' });
    return;
  }

  const { fullName, phone, email, source, propertyType, budgetMin, budgetMax, preferredLocation, notes } = req.body;
  if (!fullName || !phone) {
    res.status(400).json({ error: 'Payload must contain at least fullName and phone parameters.' });
    return;
  }

  const newLead = Database.assignLeadToAgent({
    fullName,
    phone,
    email: email || '',
    source: (source || 'Website') as any,
    propertyType: (propertyType || 'Apartment') as any,
    budgetMin: Number(budgetMin) || 1000000,
    budgetMax: Number(budgetMax) || 10000000,
    preferredLocation: preferredLocation || 'Gurgaon',
    status: 'New',
    temperature: 'Hot', // webhook leads defaulted to hot
    notes: notes || 'Lead entered via automated API webhook.',
    isHot: true
  });

  // Trigger instant bridge call automation
  callService.triggerCallBridge(newLead.id);

  res.status(201).json({
    message: 'Webhook processed, agent allocated, and call-bridge triggered successfully.',
    lead: newLead
  });
});

// 4. Force Connect Bridge manual trigger
app.post('/api/calls/bridge', (req, res) => {
  const { leadId } = req.body;
  if (!leadId) {
    res.status(400).json({ error: 'leadId is required' });
    return;
  }
  callService.triggerCallBridge(leadId);
  res.json({ message: 'Bridge sequence initiated.' });
});

// 5. Fetch activities logs
app.get('/api/activities', (req, res) => {
  const store = Database.get();
  res.json(store.activities);
});

app.get('/api/leads/:leadId/timeline', (req, res) => {
  const { leadId } = req.params;
  const store = Database.get();
  const timeline = store.activities.filter(a => a.leadId === leadId);
  res.json(timeline);
});

app.post('/api/leads/:leadId/notes', (req, res) => {
  const { leadId } = req.params;
  const { text, userId } = req.body;
  if (!text) {
    res.status(400).json({ error: 'Text required' });
    return;
  }
  const store = Database.get();
  const nowStr = new Date().toISOString();
  
  const lead = store.leads.find(l => l.id === leadId);
  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }

  // Append note to timeline
  store.activities.unshift({
    id: generateId('act'),
    organizationId: store.organization.id,
    leadId,
    userId: userId || 'user-admin-1',
    type: 'Note',
    title: 'Note Added',
    description: text,
    timestamp: nowStr
  });

  // Also update lead's core notes view
  lead.notes = `${lead.notes}\n[Note by ${store.users.find(u => u.id === userId)?.name || 'Agent'} on ${new Date().toLocaleDateString()}]: ${text}`;
  lead.updatedAt = nowStr;

  Database.save();
  res.json({ success: true, timeline: store.activities.filter(a => a.leadId === leadId) });
});

// 6. Property Inventory routes with tenant isolation & plan-limit checks
app.get('/api/properties', (req, res) => {
  const store = Database.get();
  const orgId = req.query.organizationId as string;
  if (orgId) {
    res.json(store.properties.filter(p => p.organizationId === orgId));
  } else {
    res.json(store.properties);
  }
});

app.post('/api/properties', (req, res) => {
  const { title, location, address, propertyType, price, size, bedrooms, bathrooms, floor, furnishingStatus, description, amenities, images, ownerInfo, tags, organizationId } = req.body;
  if (!title || !location || !propertyType || !price) {
    res.status(400).json({ error: 'Property title, location, type and pricing are required.' });
    return;
  }
  const store = Database.get();
  const orgId = organizationId || store.organizations[0].id;

  // Verify Property counts against Plan Limit!
  const targetOrg = store.organizations.find(o => o.id === orgId);
  if (targetOrg) {
    const currentPropsCount = store.properties.filter(p => p.organizationId === orgId).length;
    if (currentPropsCount >= targetOrg.maxPropertiesLimit) {
      res.status(400).json({
        error: `Subscription Limit Reached! Under your ${targetOrg.subscriptionPlan} Plan, you are limited to a maximum of ${targetOrg.maxPropertiesLimit} properties. Please upgrade your plan in the Super Admin Panel to add more listings.`
      });
      return;
    }
  }

  const newProperty: Property = {
    id: generateId('prop'),
    organizationId: orgId,
    title,
    location,
    address: address || location,
    propertyType,
    price: Number(price),
    size: size || 'Super Built up',
    bedrooms: Number(bedrooms) || 0,
    bathrooms: Number(bathrooms) || 0,
    floor: Number(floor) || 0,
    furnishingStatus: furnishingStatus || 'Semi-Furnished',
    availabilityStatus: 'Available',
    description: description || 'Beautiful estate managed exclusively by our agency.',
    amenities: amenities || ['Gated community', 'Power Backup'],
    images: images && images.length > 0 ? images : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c'],
    documents: ['Brochure_Estate.pdf'],
    ownerInfo: ownerInfo || { name: 'Agency Representative', phone: '+919999900001', role: 'In-house Listing' },
    tags: tags || ['Exclusive'],
    createdAt: new Date().toISOString()
  };
  store.properties.push(newProperty);
  Database.save();
  res.status(201).json(newProperty);
});

// 7. Property Custom Share trigger
app.post('/api/shares', async (req, res) => {
  const { leadId, propertyId, agentId, channel } = req.body;
  if (!leadId || !propertyId) {
    res.status(400).json({ error: 'leadId and propertyId are critical.' });
    return;
  }
  const store = Database.get();
  const lead = store.leads.find(l => l.id === leadId);
  const property = store.properties.find(p => p.id === propertyId);
  const agent = store.users.find(u => u.id === agentId) || store.users[0];

  if (!lead || !property) {
    res.status(404).json({ error: 'Lead or Property data not resolved.' });
    return;
  }

  const shareLink = `${process.env.APP_URL || 'https://estateflow.in'}/properties/${property.id}?shareLead=${lead.id}`;
  const priceStr = `INR ${property.price.toLocaleString('en-IN')}`;
  const customMessage = `Hi ${lead.fullName}, sharing details of our premium listing: "${property.title}" in ${property.location}. Price: ${priceStr}. Explore high-definition pictures and layouts here: ${shareLink}`;

  const nowStr = new Date().toISOString();

  // Send via specialized adapters
  if (channel === 'WhatsApp') {
    await messageService.sendWhatsApp(leadId, agent.id, customMessage);
  } else if (channel === 'SMS') {
    await messageService.sendSMS(leadId, agent.id, customMessage);
  } else {
    // Default to email
    await emailService.sendEmail(
      lead.email || 'lead@example.com',
      `Premium Real Estate Option: ${property.title}`,
      `<div style="font-family: sans-serif; padding: 20px;">
        <h2>Greetings ${lead.fullName},</h2>
        <p>Your personal counselor <strong>${agent.name}</strong> from EstateFlow CRM has recommended an exclusive property:</p>
        <h3>${property.title}</h3>
        <p><strong>Location:</strong> ${property.location}</p>
        <p><strong>Value:</strong> ${priceStr}</p>
        <p>${property.description}</p>
        <p><a href="${shareLink}" style="background: #111; color: #fff; padding: 10px 15px; text-decoration: none; border-radius: 4px;">View Full Project Details & Photos</a></p>
      </div>`,
      leadId,
      agent.id
    );
  }

  // Create customized Share Entry Log
  store.shares.unshift({
    id: generateId('share'),
    organizationId: store.organization.id,
    leadId,
    propertyId,
    agentId: agent.id,
    sentAt: nowStr,
    sentVia: channel || 'WhatsApp',
    link: shareLink,
    messagePreview: customMessage
  });

  Database.save();
  res.json({ success: true, message: 'Property shared and timeline recorded.' });
});

// 8. Followups Management with tenant isolation
app.get('/api/followups', (req, res) => {
  const store = Database.get();
  const orgId = req.query.organizationId as string;
  if (orgId) {
    res.json(store.followups.filter(f => f.organizationId === orgId));
  } else {
    res.json(store.followups);
  }
});

app.post('/api/followups', (req, res) => {
  const { leadId, agentId, datetime, notes, type, organizationId } = req.body;
  if (!leadId || !datetime || !type) {
    res.status(400).json({ error: 'leadId, scheduled date-time and type are required.' });
    return;
  }
  const store = Database.get();
  const orgId = organizationId || store.organizations[0].id;

  const newFollowup: FollowUp = {
    id: generateId('fup'),
    organizationId: orgId,
    leadId,
    agentId: agentId || 'user-agent-1',
    datetime,
    notes: notes || 'Routine counseling touchpoint.',
    completed: false,
    type
  };
  store.followups.unshift(newFollowup);

  // Logging on activity
  const leadName = store.leads.find(l => l.id === leadId)?.fullName || 'Lead';
  store.activities.unshift({
    id: generateId('act'),
    organizationId: store.organization.id,
    leadId,
    userId: agentId || 'user-agent-1',
    type: 'System',
    title: 'Follow-up Scheduled',
    description: `Registered [${type}] action check with ${leadName} on ${new Date(datetime).toLocaleString()}`,
    timestamp: new Date().toISOString()
  });

  Database.save();
  res.status(201).json(newFollowup);
});

app.post('/api/followups/:id/complete', (req, res) => {
  const { id } = req.params;
  const store = Database.get();
  const fUp = store.followups.find(f => f.id === id);
  if (!fUp) {
    res.status(404).json({ error: 'Follow-up not found' });
    return;
  }
  fUp.completed = true;
  fUp.completedAt = new Date().toISOString();

  // Log complete in lead history
  store.activities.unshift({
    id: generateId('act'),
    organizationId: store.organization.id,
    leadId: fUp.leadId,
    userId: fUp.agentId,
    type: 'System',
    title: 'Follow-up Met',
    description: `Follow-up action catalog [${fUp.type}] marked successfully as Completed. Notes: ${fUp.notes}`,
    timestamp: new Date().toISOString()
  });

  Database.save();
  res.json({ success: true, fUp });
});

app.post('/api/followups/:id/snooze', (req, res) => {
  const { id } = req.params;
  const { newTime } = req.body;
  if (!newTime) {
    res.status(400).json({ error: 'newTime is required' });
    return;
  }
  const store = Database.get();
  const fUp = store.followups.find(f => f.id === id);
  if (!fUp) {
    res.status(404).json({ error: 'Follow-up not found' });
    return;
  }
  fUp.datetime = newTime;
  Database.save();
  res.json({ success: true, fUp });
});

// 9. Employee Attendance with geolocation
app.get('/api/attendance', (req, res) => {
  const store = Database.get();
  res.json(store.attendance);
});

app.post('/api/attendance/check-in', (req, res) => {
  const { userId, latitude, longitude, notes, selfiePhoto } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }
  const store = Database.get();
  
  // Prevent double check-in same day
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const existing = store.attendance.find(a => 
    a.userId === userId && 
    new Date(a.checkInTime).getTime() >= todayStart.getTime()
  );

  if (existing) {
    res.status(400).json({ error: 'Staff already registered attendance parameters today.' });
    return;
  }

  // Calculate late status
  const now = new Date();
  let status: 'Present' | 'Late' | 'Absent' = 'Present';
  if (now.getHours() >= 10) {
    status = 'Late';
  }

  const checkIn: Attendance = {
    id: generateId('att'),
    organizationId: store.organization.id,
    userId,
    checkInTime: now.toISOString(),
    checkInLatitude: latitude ? Number(latitude) : undefined,
    checkInLongitude: longitude ? Number(longitude) : undefined,
    status,
    notes: notes || (selfiePhoto ? '[Selfie verified] Standard mobile check-in.' : 'GPS Verified entry.')
  };

  store.attendance.unshift(checkIn);

  // Push activity
  const staffName = store.users.find(u => u.id === userId)?.name || 'Executive';
  store.activities.unshift({
    id: generateId('act'),
    organizationId: store.organization.id,
    leadId: '',
    userId,
    type: 'System',
    title: 'Attendance Present',
    description: `Staff member [${staffName}] checked in. GPS: ${latitude && longitude ? `${latitude}, ${longitude}` : 'Desktop bypass'}. Status: ${status}.`,
    timestamp: now.toISOString()
  });

  Database.save();
  res.status(201).json(checkIn);
});

app.post('/api/attendance/check-out', (req, res) => {
  const { userId, latitude, longitude, fieldVisitNotes } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }
  const store = Database.get();
  
  // Find current active check-in
  const checkLog = store.attendance.find(a => a.userId === userId && !a.checkOutTime);
  if (!checkLog) {
    res.status(404).json({ error: 'No active check-in found for this session session.' });
    return;
  }

  const now = new Date();
  checkLog.checkOutTime = now.toISOString();
  checkLog.checkOutLatitude = latitude ? Number(latitude) : undefined;
  checkLog.checkOutLongitude = longitude ? Number(longitude) : undefined;
  if (fieldVisitNotes) {
    checkLog.fieldVisitNotes = fieldVisitNotes;
  }

  // Log activity
  const staffName = store.users.find(u => u.id === userId)?.name || 'Executive';
  store.activities.unshift({
    id: generateId('act'),
    organizationId: store.organization.id,
    leadId: '',
    userId,
    type: 'System',
    title: 'Attendance Dismissed',
    description: `Staff member [${staffName}] registered check-out. Notes: ${fieldVisitNotes || 'Coordinated exit.'}`,
    timestamp: now.toISOString()
  });

  Database.save();
  res.json(checkLog);
});

// 10. Social Media posts Planning 
app.get('/api/social-posts', (req, res) => {
  const store = Database.get();
  res.json(store.socialPosts);
});

app.post('/api/social-posts', (req, res) => {
  const { postType, caption, scheduledTime, assignedUserId, notes } = req.body;
  if (!postType || !caption) {
    res.status(400).json({ error: 'Post type and Caption cannot be blank.' });
    return;
  }
  const store = Database.get();
  const newPost: SocialPost = {
    id: generateId('post'),
    organizationId: store.organization.id,
    postType,
    caption,
    status: 'Draft',
    scheduledTime: scheduledTime || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    assignedUserId: assignedUserId || 'user-social-1',
    notes: notes || ''
  };
  store.socialPosts.push(newPost);
  Database.save();
  res.status(201).json(newPost);
});

app.post('/api/social-posts/ai-caption', async (req, res) => {
  const { postType, propertyId, customNotes } = req.body;
  if (!postType || !propertyId) {
    res.status(400).json({ error: 'postType and propertyId are needed to draft copywriting.' });
    return;
  }
  const store = Database.get();
  const property = store.properties.find(p => p.id === propertyId);
  if (!property) {
    res.status(404).json({ error: 'Resolved property listing not found.' });
    return;
  }

  const draftedText = await aiService.draftSocialCaption(postType, property.title, property.location, customNotes);
  res.json({ caption: draftedText });
});

app.post('/api/social-posts/:id/approve', (req, res) => {
  const { id } = req.params;
  const store = Database.get();
  const post = store.socialPosts.find(p => p.id === id);
  if (!post) {
    res.status(404).json({ error: 'Post task not found' });
    return;
  }
  post.status = 'Scheduled';
  Database.save();
  res.json(post);
});

app.post('/api/social-posts/:id/publish', (req, res) => {
  const { id } = req.params;
  const store = Database.get();
  const post = store.socialPosts.find(p => p.id === id);
  if (!post) {
    res.status(404).json({ error: 'Post task not found' });
    return;
  }
  post.status = 'Published';
  Database.save();
  res.json(post);
});

// 11. AI draft message helper
app.post('/api/ai/draft-message', async (req, res) => {
  const { leadId, templateContext } = req.body;
  if (!leadId || !templateContext) {
    res.status(400).json({ error: 'leadId and templateContext are mandatory.' });
    return;
  }
  const store = Database.get();
  const lead = store.leads.find(l => l.id === leadId);
  if (!lead) {
    res.status(404).json({ error: 'Lead not resolved.' });
    return;
  }

  const responseText = await aiService.draftMessageFollowup(
    lead.fullName,
    lead.propertyType,
    lead.preferredLocation,
    templateContext
  );

  res.json({ draftedText: responseText });
});

// 11.5 AI Chatbot command processor helper
app.post('/api/ai/process-command', async (req, res) => {
  const { prompt, userId } = req.body;
  if (!prompt) {
    res.status(400).json({ error: 'Prompt is mandatory.' });
    return;
  }

  const store = Database.get();
  
  try {
    const rawResult = await aiService.processAiCRMCommand(
      prompt,
      store.leads,
      store.users,
      new Date().toISOString()
    );

    const action = rawResult.action;
    const data = rawResult.data || {};
    let explanation = rawResult.explanation || "Command processed successfully.";

    if (action === "CREATE_LEAD") {
      const { fullName, phone, email, source, propertyType, budgetMin, budgetMax, preferredLocation, notes, temperature } = data;
      
      const newLead = Database.assignLeadToAgent({
        fullName: fullName || "Generated Lead",
        phone: phone || "+919999911111",
        email: email || "",
        source: source || "Manual",
        propertyType: propertyType || "Apartment",
        budgetMin: Number(budgetMin) || 12000000,
        budgetMax: Number(budgetMax) || 35000000,
        preferredLocation: preferredLocation || "Gurgaon",
        status: 'New',
        temperature: temperature || 'Warm',
        notes: notes || 'Created via virtual Co-Pilot assistant command.',
        isHot: temperature === 'Hot'
      });

      // Automatically trigger call sequence
      callService.triggerCallBridge(newLead.id);
      explanation = `[Co-Pilot] Successfully created Lead profile: "${newLead.fullName}" (allocated to ${store.users.find(u => u.id === newLead.assignedAgentId)?.name || 'Agent'}) and triggered Call bridge sequence.`;

    } else if (action === "CREATE_FOLLOWUP") {
      const { leadId, datetime, notes, type } = data;
      
      // Determine leadId by matching text or default to lead-1
      let matchedLeadId = leadId;
      if (!matchedLeadId) {
        matchedLeadId = store.leads[0]?.id || "lead-1";
      }

      const activeAgentId = userId || 'user-admin-1';
      
      const newFollowup: FollowUp = {
        id: generateId('fup'),
        organizationId: store.organization.id,
        leadId: matchedLeadId,
        agentId: activeAgentId,
        datetime: datetime || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        notes: notes || 'Followup task scheduled via AI Co-Pilot command.',
        completed: false,
        type: type || 'Call'
      };

      store.followups.unshift(newFollowup);

      // Activity timeline logging
      const leadName = store.leads.find(l => l.id === matchedLeadId)?.fullName || 'Client';
      store.activities.unshift({
        id: generateId('act'),
        organizationId: store.organization.id,
        leadId: matchedLeadId,
        userId: activeAgentId,
        type: 'System',
        title: 'Follow-up Scheduled',
        description: `Registered [${newFollowup.type}] action check with ${leadName} scheduled via Voice/Chat Assistant: ${newFollowup.notes}`,
        timestamp: new Date().toISOString()
      });

      Database.save();
      explanation = `[Co-Pilot] I have successfully scheduled a [${newFollowup.type}] event with ${leadName} on ${new Date(newFollowup.datetime).toLocaleString()}.`;

    } else if (action === "CREATE_NOTE") {
      const { leadId, text } = data;
      
      let matchedLeadId = leadId;
      if (!matchedLeadId) {
        matchedLeadId = store.leads[0]?.id || "lead-1";
      }

      const activeAgentId = userId || 'user-admin-1';
      const lead = store.leads.find(l => l.id === matchedLeadId);

      if (lead && text) {
        const nowStr = new Date().toISOString();
        store.activities.unshift({
          id: generateId('act'),
          organizationId: store.organization.id,
          leadId: matchedLeadId,
          userId: activeAgentId,
          type: 'Note',
          title: 'Note Added',
          description: text,
          timestamp: nowStr
        });

        const agentName = store.users.find(u => u.id === activeAgentId)?.name || 'Co-Pilot';
        lead.notes = `${lead.notes}\n[Note by ${agentName} on ${new Date().toLocaleDateString()} via Co-Pilot]: ${text}`;
        lead.updatedAt = nowStr;

        Database.save();
        explanation = `[Co-Pilot] Added a profile note onto client ${lead.fullName}'s sheet timeline: "${text}"`;
      } else {
        explanation = `[Co-Pilot] Couldn't save note: Lead profile record was not matched correctly.`;
      }

    } else if (action === "CREATE_SOCIAL_POST") {
      const { postType, caption, scheduledTime, notes } = data;
      const activeAgentId = userId || 'user-admin-1';

      const newPost: SocialPost = {
        id: generateId('post'),
        organizationId: store.organization.id,
        postType: postType || 'Instagram Post',
        caption: caption || 'Check out premium real estate opportunities with EstateFlow!',
        status: 'Draft',
        scheduledTime: scheduledTime || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        assignedUserId: activeAgentId,
        notes: notes || 'Generated automatically by AI planner.'
      };

      store.socialPosts.push(newPost);
      Database.save();
      explanation = `[Co-Pilot] Successfully drafted a new social content media task: [${newPost.postType}] in content planners!`;
    }

    res.json({
      success: true,
      action,
      explanation,
      data
    });

  } catch (error: any) {
    console.error("Endpoint Command Processing Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 12. Settings endpoint
app.get('/api/settings', (req, res) => {
  const store = Database.get();
  res.json(store.settings);
});

app.post('/api/settings', (req, res) => {
  const store = Database.get();
  store.settings = {
    ...store.settings,
    ...req.body
  };
  Database.save();
  res.json(store.settings);
});

// 13. Notifications endpoint with tenant filter
app.get('/api/notifications', (req, res) => {
  const store = Database.get();
  const orgId = req.query.organizationId as string;
  if (orgId) {
    res.json(store.notifications.filter(n => n.organizationId === orgId));
  } else {
    res.json(store.notifications);
  }
});

app.post('/api/notifications/read', (req, res) => {
  const store = Database.get();
  const orgId = req.query.organizationId as string;
  if (orgId) {
    store.notifications.filter(n => n.organizationId === orgId).forEach(n => n.isRead = true);
  } else {
    store.notifications.forEach(n => n.isRead = true);
  }
  Database.save();
  res.json({ success: true });
});

// 14. Core global dashboard stats query with tenant isolation
app.get('/api/stats', (req, res) => {
  const store = Database.get();
  const orgId = (req.query.organizationId as string) || 'org-estateflow-1';
  const now = new Date();
  const todayStr = now.toLocaleDateString();

  const orgLeads = store.leads.filter(l => l.organizationId === orgId);
  const orgCalls = store.calls.filter(c => c.organizationId === orgId);
  const orgFollowups = store.followups.filter(f => f.organizationId === orgId);
  const orgProps = store.properties.filter(p => p.organizationId === orgId);
  const orgAttendance = store.attendance.filter(a => a.organizationId === orgId);

  const leadsToday = orgLeads.filter(l => new Date(l.createdAt).toLocaleDateString() === todayStr).length;
  const callsToday = orgCalls.filter(c => new Date(c.startedAt).toLocaleDateString() === todayStr && c.status === 'Completed').length;
  const followupsDueToday = orgFollowups.filter(f => !f.completed && new Date(f.datetime).toLocaleDateString() === todayStr).length;
  const hotLeads = orgLeads.filter(l => l.temperature === 'Hot' && l.status !== 'Won' && l.status !== 'Lost').length;
  const siteVisits = orgFollowups.filter(f => !f.completed && f.type === 'Site Visit').length;
  const iventory = orgProps.filter(p => p.availabilityStatus === 'Available').length;
  const activeStaff = orgAttendance.filter(a => !a.checkOutTime).length;

  res.json({
    newLeadsToday: leadsToday,
    callsToday: callsToday,
    followupsDueToday,
    hotLeadsCount: hotLeads,
    siteVisitsScheduledCount: siteVisits,
    availableInventoryCount: iventory,
    presentAgentsCount: activeStaff
  });
});

// Vite & Static file integration
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  // ESM Dynamic Import of Vite
  import('vite').then((Vite) => {
    Vite.createServer({
      server: { middlewareMode: true },
      appType: 'custom',
    }).then((vite) => {
      app.use(vite.middlewares);
      app.use('*', async (req, res, next) => {
        const url = req.originalUrl;
        
        // Skip API routes so they don't serve html fallback template
        if (url.startsWith('/api/')) {
          return next();
        }

        try {
          let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (e: any) {
          vite.ssrFixStacktrace(e);
          next(e);
        }
      });
    });
  });
} else {
  // Production mode serves pre-built static client bundles
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`EstateFlow CRM Node app running on port ${PORT}...`);
});
