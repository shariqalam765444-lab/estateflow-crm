/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole =
  | 'Admin / Business Owner'
  | 'Sales Manager'
  | 'Sales Agent'
  | 'Field Executive'
  | 'Social Media Manager';

export interface UserProfile {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  avatarSeed?: string; // used for custom styling or coloring
}

export interface Organization {
  id: string;
  name: string;
  domain: string;
  appName?: string;
  logoUrl?: string;
  primaryColor?: string; // hex value e.g. "#008069"
  secondaryColor?: string; // hex value e.g. "#1e293b"
  accentColor?: string; // e.g. "emerald" or "indigo"
  faviconUrl?: string;
  loginHeadline?: string;
  dashboardHeadline?: string;
  
  // Subscription parameters
  subscriptionPlan: 'Free' | 'Plus' | 'Pro' | 'Business' | 'Platinum' | 'Enterprise';
  status: 'Active' | 'Suspended';
  maxLeadsLimit: number;
  maxPropertiesLimit: number;
  maxUsersLimit: number;
  createdAt: string;
}

export type LeadSource =
  | '36 Acre'
  | 'MagicBricks'
  | 'Housing.com'
  | 'Facebook Ads'
  | 'Instagram Ads'
  | 'Website'
  | 'Referral'
  | 'Manual'
  | 'Other';

export type PropertyInterestedType =
  | 'Apartment'
  | 'Villa'
  | 'Plot'
  | 'Commercial'
  | 'Rental';

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Interested'
  | 'Site Visit Scheduled'
  | 'Negotiation'
  | 'Won'
  | 'Lost'
  | 'Not Responding';

export type LeadTemperature = 'Cold' | 'Warm' | 'Hot';

export interface Lead {
  id: string;
  organizationId: string;
  fullName: string;
  phone: string;
  email: string;
  source: LeadSource;
  propertyType: PropertyInterestedType;
  budgetMin: number;
  budgetMax: number;
  preferredLocation: string;
  status: LeadStatus;
  temperature: LeadTemperature;
  assignedAgentId: string; // references UserProfile.id
  notes: string;
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;
  isHot?: boolean;
}

export type PropertyAvailability = 'Available' | 'Hold' | 'Sold' | 'Rented';

export interface Property {
  id: string;
  organizationId: string;
  title: string;
  location: string;
  address: string;
  propertyType: PropertyInterestedType;
  price: number;
  size: string; // e.g. "1800 sq ft" or "3 BHK"
  bedrooms: number;
  bathrooms: number;
  floor: number;
  furnishingStatus: 'Unfurnished' | 'Semi-Furnished' | 'Fully-Furnished';
  availabilityStatus: PropertyAvailability;
  description: string;
  amenities: string[];
  images: string[]; // urls or key identifiers
  documents: string[]; // brochures or documents
  ownerInfo: {
    name: string;
    phone: string;
    role: string;
  };
  tags: string[];
  createdAt: string;
}

export interface LeadPropertyShare {
  id: string;
  organizationId: string;
  leadId: string;
  propertyId: string;
  agentId: string;
  sentAt: string;
  sentVia: 'WhatsApp' | 'SMS' | 'Email';
  link: string;
  messagePreview: string;
}

export interface Activity {
  id: string;
  organizationId: string;
  leadId: string;
  userId: string; // executive who did it
  type: 'Note' | 'Call' | 'Message' | 'Share' | 'StatusChange' | 'Assignment' | 'System';
  title: string;
  description: string;
  timestamp: string;
}

export interface CallLog {
  id: string;
  organizationId: string;
  leadId: string;
  agentId: string;
  callSid?: string;
  conferenceSid?: string;
  status: 'Completed' | 'No Answer' | 'Busy' | 'Failed' | 'Incoming' | 'Bridge Dialing';
  duration: number; // in seconds
  recordingUrl?: string;
  startedAt: string;
  endedAt: string;
  outcome: string; // e.g. "Spoke with client, site visit scheduled"
}

export interface MessageLog {
  id: string;
  organizationId: string;
  leadId: string;
  agentId: string;
  type: 'SMS' | 'WhatsApp';
  body: string;
  status: 'Sent' | 'Failed' | 'Delivered';
  sentAt: string;
}

export interface FollowUp {
  id: string;
  organizationId: string;
  leadId: string;
  agentId: string;
  datetime: string;
  notes: string;
  completed: boolean;
  type: 'Call' | 'WhatsApp' | 'SMS' | 'Email' | 'Site Visit';
  completedAt?: string;
}

export interface Attendance {
  id: string;
  organizationId: string;
  userId: string;
  checkInTime: string;
  checkOutTime?: string;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  status: 'Present' | 'Late' | 'Absent';
  notes?: string;
  fieldVisitNotes?: string;
}

export type SocialPostType = 'Instagram Reel' | 'Instagram Post' | 'Facebook Post' | 'LinkedIn Post' | 'Story';
export type SocialPostStatus = 'Idea' | 'Draft' | 'Scheduled' | 'Published';

export interface SocialPost {
  id: string;
  organizationId: string;
  postType: SocialPostType;
  caption: string;
  mediaUrl?: string; // or visual placeholder
  status: SocialPostStatus;
  scheduledTime: string;
  assignedUserId: string;
  notes?: string;
}

export interface IntegrationSettings {
  organizationId: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  whatsappSenderNumber: string;
  resendApiKey: string;
  openaiApiKey: string;
  leadWebhookSecret: string;
  leadAssignmentMode: 'Round Robin' | 'Manual' | 'Least Busy Agent';
  isDryRun: boolean; // default true for safe local/preview execution
}

export interface Notification {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  description: string;
  type: 'LeadAssigned' | 'MissedCall' | 'FollowUpDue' | 'SiteVisit' | 'PropShared' | 'Attendance' | 'SocialPostDue';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface DashboardStats {
  newLeadsToday: number;
  callsToday: number;
  followupsDueToday: number;
  hotLeadsCount: number;
  siteVisitsScheduledCount: number;
  availableInventoryCount: number;
  presentAgentsCount: number;
}

export interface ContactPerson {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company: string;
  notes: string;
  avatarSeed: string;
  createdAt: string;
}

