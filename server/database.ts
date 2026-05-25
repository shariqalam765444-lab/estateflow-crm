/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import {
  Lead,
  UserProfile,
  Property,
  LeadPropertyShare,
  Activity,
  CallLog,
  MessageLog,
  FollowUp,
  Attendance,
  SocialPost,
  IntegrationSettings,
  Notification,
  Organization,
  PropertyInterestedType,
  ContactPerson
} from '../src/types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

export interface DBStore {
  organization: Organization; // Default for backwards compatibility
  organizations: Organization[]; // SaaS Tenant registry
  users: UserProfile[];
  leads: Lead[];
  properties: Property[];
  shares: LeadPropertyShare[];
  activities: Activity[];
  calls: CallLog[];
  messages: MessageLog[];
  followups: FollowUp[];
  attendance: Attendance[];
  socialPosts: SocialPost[];
  settings: IntegrationSettings;
  notifications: Notification[];
  contacts: ContactPerson[];
}

// Simple unique ID generator
export function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// SaaS Multiple Tenants White Label seed database
const seedOrganizations: Organization[] = [
  {
    id: 'org-estateflow-1',
    name: 'EstateFlow Premium Realty',
    domain: 'estateflow.in',
    appName: 'EstateFlow Premium',
    primaryColor: '#0f765e', // Emerald Teal
    secondaryColor: '#0f172a', // Charcoal Dark
    accentColor: 'emerald',
    loginHeadline: 'EstateFlow Enterprise CRM Workspace',
    dashboardHeadline: 'Welcome to EstateFlow Premium Dashboard',
    subscriptionPlan: 'Business',
    status: 'Active',
    maxLeadsLimit: 1000,
    maxPropertiesLimit: 500,
    maxUsersLimit: 30,
    createdAt: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'org-apex-2',
    name: 'Apex Global Realty Group',
    domain: 'apexrealty.com',
    appName: 'Apex International',
    primaryColor: '#1d4ed8', // Royal Blue
    secondaryColor: '#1e1b4b', // Deep Royal Blue Slate
    accentColor: 'indigo',
    loginHeadline: 'Apex Global White Label Portal',
    dashboardHeadline: 'Welcome to Apex Global Realty Central',
    subscriptionPlan: 'Enterprise',
    status: 'Active',
    maxLeadsLimit: 99999,
    maxPropertiesLimit: 99999,
    maxUsersLimit: 99999,
    createdAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'org-star-3',
    name: 'Star Homes Boutique',
    domain: 'starhomes.net',
    appName: 'Star CRM Lite',
    primaryColor: '#ea580c', // Bright Orange
    secondaryColor: '#1c1917', // Sandy Stone
    accentColor: 'orange',
    loginHeadline: 'Star Homes - Small Team Big Deeds',
    dashboardHeadline: 'Let\'s close some boutique deeds today!',
    subscriptionPlan: 'Free',
    status: 'Active',
    maxLeadsLimit: 8,  // Very small limit so the limit-warning will trigger!
    maxPropertiesLimit: 4, // Intentionally low limit!
    maxUsersLimit: 3,
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'org-suspended-4',
    name: 'Suspended Capital Real Estate',
    domain: 'suspendedrealty.org',
    appName: 'Suspended Realty Portal',
    primaryColor: '#be123c', // Warm Maroon Red
    secondaryColor: '#3f0712', // Rose Red Dark Slate
    accentColor: 'rose',
    loginHeadline: 'Account Suspended - Contact Billing Support',
    dashboardHeadline: 'This workspace is Suspended.',
    subscriptionPlan: 'Pro',
    status: 'Suspended',
    maxLeadsLimit: 200,
    maxPropertiesLimit: 100,
    maxUsersLimit: 8,
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  }
];

const seedUsers: UserProfile[] = [
  // 1. EstateFlow Premium Realty
  {
    id: 'user-admin-1',
    organizationId: 'org-estateflow-1',
    name: 'Shariq Alam (Admin)',
    email: 'shariqalam765444@gmail.com',
    role: 'Admin / Business Owner',
    phone: '+919999900001',
    avatarSeed: 'shariq'
  },
  {
    id: 'user-manager-1',
    organizationId: 'org-estateflow-1',
    name: 'Prem Nath',
    email: 'prem.nath@estateflow.in',
    role: 'Sales Manager',
    phone: '+919999900002',
    avatarSeed: 'prem'
  },
  {
    id: 'user-agent-1',
    organizationId: 'org-estateflow-1',
    name: 'Arjun Kumar',
    email: 'arjun.k@estateflow.in',
    role: 'Sales Agent',
    phone: '+919999900003',
    avatarSeed: 'arjun'
  },
  {
    id: 'user-agent-2',
    organizationId: 'org-estateflow-1',
    name: 'Neha Sharma',
    email: 'neha.s@estateflow.in',
    role: 'Sales Agent',
    phone: '+919999900004',
    avatarSeed: 'neha'
  },
  {
    id: 'user-field-1',
    organizationId: 'org-estateflow-1',
    name: 'Vikram Rathore',
    email: 'vikram.r@estateflow.in',
    role: 'Field Executive',
    phone: '+919999900005',
    avatarSeed: 'vikram'
  },
  {
    id: 'user-social-1',
    organizationId: 'org-estateflow-1',
    name: 'Riya Sen',
    email: 'riya.s@estateflow.in',
    role: 'Social Media Manager',
    phone: '+919999900006',
    avatarSeed: 'riya'
  },

  // 2. Apex Global Realty Group
  {
    id: 'user-apex-admin',
    organizationId: 'org-apex-2',
    name: 'Maximilian Sterling (SaaS Owner)',
    email: 'm.sterling@apexrealty.com',
    role: 'Admin / Business Owner',
    phone: '+14155550199',
    avatarSeed: 'maximilian'
  },
  {
    id: 'user-apex-manager',
    organizationId: 'org-apex-2',
    name: 'Marcus Aurelius (Apex)',
    email: 'm.aurelius@apexrealty.com',
    role: 'Sales Manager',
    phone: '+14155550198',
    avatarSeed: 'marcus'
  },
  {
    id: 'user-apex-agent',
    organizationId: 'org-apex-2',
    name: 'Seraphina Vance',
    email: 's.vance@apexrealty.com',
    role: 'Sales Agent',
    phone: '+14155550197',
    avatarSeed: 'seraphina'
  },

  // 3. Star Homes Boutique
  {
    id: 'user-star-admin',
    organizationId: 'org-star-3',
    name: 'Gary Star (Boutique Admin)',
    email: 'gary@starhomes.net',
    role: 'Admin / Business Owner',
    phone: '+61299990001',
    avatarSeed: 'gary'
  },
  {
    id: 'user-star-agent',
    organizationId: 'org-star-3',
    name: 'Tina Star',
    email: 'tina@starhomes.net',
    role: 'Sales Agent',
    phone: '+61299990002',
    avatarSeed: 'tina'
  },

  // 4. Suspended Capital Real Estate
  {
    id: 'user-suspended-admin',
    organizationId: 'org-suspended-4',
    name: 'Burt Debt (Suspended)',
    email: 'debt@suspendedrealty.org',
    role: 'Admin / Business Owner',
    phone: '+442079460192',
    avatarSeed: 'burt'
  },
  {
    id: 'user-suspended-agent',
    organizationId: 'org-suspended-4',
    name: 'Sally Late',
    email: 'sally@suspendedrealty.org',
    role: 'Sales Agent',
    phone: '+442079460193',
    avatarSeed: 'sally'
  }
];

const seedSettings: IntegrationSettings = {
  organizationId: 'org-estateflow-1',
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioPhoneNumber: '',
  whatsappSenderNumber: '',
  resendApiKey: '',
  openaiApiKey: '',
  leadWebhookSecret: 'estateflow_secret_abc123',
  leadAssignmentMode: 'Round Robin',
  isDryRun: true
};

function getSeedLeads(): Lead[] {
  return [
    // org-estateflow-1
    { id: 'lead-1', organizationId: 'org-estateflow-1', fullName: 'Rahul Sharma', phone: '+919999911111', email: 'rahul@example.com', source: '36 Acre', propertyType: 'Apartment', budgetMin: 15000000, budgetMax: 35000000, preferredLocation: 'Golf Course Road, Gurgaon', status: 'New', temperature: 'Hot', assignedAgentId: 'user-agent-1', notes: 'Interested in luxury 3 BHK in DLF Crest. Needs immediate dial-back.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'lead-2', organizationId: 'org-estateflow-1', fullName: 'Priya Patel', phone: '+919811022222', email: 'priya.patel@gmail.com', source: 'MagicBricks', propertyType: 'Apartment', budgetMin: 12000000, budgetMax: 20000000, preferredLocation: 'Sohna Road, Gurgaon', status: 'Contacted', temperature: 'Warm', assignedAgentId: 'user-agent-2', notes: 'Requested brochure for Vatika Sovereign Park. Wants high floors.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'lead-3', organizationId: 'org-estateflow-1', fullName: 'Anjali Gupta', phone: '+919911223344', email: 'anjali.g@gmail.com', source: 'Facebook Ads', propertyType: 'Villa', budgetMin: 50000000, budgetMax: 80000000, preferredLocation: 'Sohna Road, Gurgaon', status: 'Site Visit Scheduled', temperature: 'Hot', assignedAgentId: 'user-agent-1', notes: 'Marbella Villas inquiry. Scheduled site visit with Vikram Rathore.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'lead-4', organizationId: 'org-estateflow-1', fullName: 'Vikram Grover', phone: '+919899881122', email: 'vikram.g@grovercorp.com', source: 'Website', propertyType: 'Commercial', budgetMin: 30000000, budgetMax: 50000000, preferredLocation: 'Cyber City, Gurgaon', status: 'Interested', temperature: 'Warm', assignedAgentId: 'user-agent-2', notes: 'Looking for a premium corporate office setup of 1000+ sq ft.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'lead-5', organizationId: 'org-estateflow-1', fullName: 'Rajesh Singhania', phone: '+14085550192', email: 'singhania.r@outlook.com', source: 'Referral', propertyType: 'Apartment', budgetMin: 30000000, budgetMax: 40000000, preferredLocation: 'Golf Course Road, Gurgaon', status: 'Negotiation', temperature: 'Hot', assignedAgentId: 'user-agent-1', notes: 'NRI client based in USA. In final stages of booking DLF unit.', isHot: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // org-apex-2
    { id: 'lead-apex-1', organizationId: 'org-apex-2', fullName: 'Elizabeth Montgomery', phone: '+12125550125', email: 'e.montgomery@nycapitol.com', source: 'Website', propertyType: 'Apartment', budgetMin: 4000000, budgetMax: 9000000, preferredLocation: 'Manhattan, NY', status: 'New', temperature: 'Hot', assignedAgentId: 'user-apex-agent', notes: 'Wants to view Central Park luxury penthouse options. Ready for rapid Cash transaction.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'lead-apex-2', organizationId: 'org-apex-2', fullName: 'John Rockefeller Jr', phone: '+13105550171', email: 'jr@rockefellerestates.com', source: 'Referral', propertyType: 'Villa', budgetMin: 12000000, budgetMax: 20000000, preferredLocation: 'Beverly Hills, LA', status: 'Site Visit Scheduled', temperature: 'Hot', assignedAgentId: 'user-apex-agent', notes: 'Scheduled site visit for Beverly Hills colonial mansion block. Demands supreme privacy.', isHot: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // org-star-3
    { id: 'lead-star-1', organizationId: 'org-star-3', fullName: 'Bruce Goldcoast', phone: '+6149991192', email: 'bruce@goldcoastliving.au', source: 'MagicBricks', propertyType: 'Apartment', budgetMin: 900000, budgetMax: 1500000, preferredLocation: 'Broadbeach, QLD', status: 'New', temperature: 'Warm', assignedAgentId: 'user-star-agent', notes: 'Wants ocean view unit with spacious balcony.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'lead-star-2', organizationId: 'org-star-3', fullName: 'Kylie Minogue', phone: '+6149991193', email: 'kylie@minogue.com', source: 'Instagram Ads', propertyType: 'Apartment', budgetMin: 1000000, budgetMax: 2200000, preferredLocation: 'Sydney Harbour', status: 'Interested', temperature: 'Hot', assignedAgentId: 'user-star-agent', notes: 'Looking for trendy lifestyle beach loft asset.', isHot: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ];
}

function getSeedProperties(): Property[] {
  return [
    // org-estateflow-1 (Golf course standard)
    {
      id: 'prop-1',
      organizationId: 'org-estateflow-1',
      title: 'DLF The Crest Premium Penthouse',
      location: 'Sector 54, Golf Course Road',
      address: 'Sky Tower A,DLF Phase 5, Gurgaon',
      propertyType: 'Apartment',
      price: 68000000,
      size: '4 BHK 4600 Sq-Ft',
      bedrooms: 4,
      bathrooms: 4,
      floor: 18,
      furnishingStatus: 'Fully-Furnished',
      availabilityStatus: 'Available',
      description: 'Exclusive state penthouses towering high above the Gurgaon horizon with custom double glazed windows, massive terraces, and elite clubhouse accesses.',
      amenities: ['24x7 Security', 'Club House', 'Swimming Pool', 'Gymnasium', 'Power Backup'],
      images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'],
      documents: ['Brochure_Crest_DLF.pdf'],
      ownerInfo: { name: 'Sanjay Dutt representative', phone: '+919999011122', role: 'Main Broker' },
      tags: ['Luxury', 'Gated Community', 'Super Premium'],
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'prop-2',
      organizationId: 'org-estateflow-1',
      title: 'M3M Golf Estate Sky Residences',
      location: 'Sector 65, Golf Course Ext.',
      address: 'Tower G, Golf Estate, Gurgaon',
      propertyType: 'Apartment',
      price: 36000000,
      size: '3 BHK 3200 Sq-Ft',
      bedrooms: 3,
      bathrooms: 3,
      floor: 8,
      furnishingStatus: 'Semi-Furnished',
      availabilityStatus: 'Available',
      description: 'Surrounded by 9-hole executive golf course. Boasts high-ceiling living rooms and fully integrated central climate controllers.',
      amenities: ['Club House', 'Swimming Pool', 'Golf Course View', 'Central AC'],
      images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80'],
      documents: ['M3M_Brochure.pdf'],
      ownerInfo: { name: 'Devendra Malik Broker', phone: '+919999011133', role: 'Direct Partner' },
      tags: ['Golf Course Facing', 'High Appraisal'],
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    },

    // org-apex-2
    {
      id: 'prop-apex-1',
      organizationId: 'org-apex-2',
      title: 'Central Park West Skyline Loft',
      location: 'Manhattan, NY',
      address: '740 Central Park West, New York, NY 10023',
      propertyType: 'Apartment',
      price: 8500000,
      size: '5 BHK 5800 Sq-Ft',
      bedrooms: 5,
      bathrooms: 5,
      floor: 42,
      furnishingStatus: 'Fully-Furnished',
      availabilityStatus: 'Available',
      description: 'Breathtaking 270-degree perspectives overlooking Central Park. Pure luxury materials, white marble bathtubs, private elevator foyer.',
      amenities: ['24x7 Security', 'Concierge Service', 'Swimming Pool', 'Gymnasium', 'Valet Parking'],
      images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80'],
      documents: ['Central_Park_West_Specs.pdf'],
      ownerInfo: { name: 'Maximilian Sterling', phone: '+14155550199', role: 'Exclusive Agent' },
      tags: ['Park Facing', 'Historic', 'Elite Location'],
      createdAt: new Date().toISOString()
    },

    // org-star-3
    {
      id: 'prop-star-1',
      organizationId: 'org-star-3',
      title: 'Surfers Paradise Oceanfront Loft',
      location: 'Gold Coast, Australia',
      address: '88 Hanlan St, Surfers Paradise, QLD 4217',
      propertyType: 'Apartment',
      price: 1350000,
      size: '2 BHK 1400 Sq-Ft',
      bedrooms: 2,
      bathrooms: 2,
      floor: 12,
      furnishingStatus: 'Fully-Furnished',
      availabilityStatus: 'Available',
      description: 'Bright beach loft with infinite Pacific Ocean vistas. Perfect investment or coastal lifestyle asset for high yields.',
      amenities: ['Swimming Pool', 'Gymnasium', 'Beach Front Access', 'Balcony'],
      images: ['https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=600&q=80'],
      documents: ['Beach_Loft_Queensland.pdf'],
      ownerInfo: { name: 'Gary Star', phone: '+61299990001', role: 'Business Owner' },
      tags: ['Oceanfront', 'Boutique Collection'],
      createdAt: new Date().toISOString()
    }
  ];
}

function getSeedFollowUps(): FollowUp[] {
  return [
    { id: 'fup-1', organizationId: 'org-estateflow-1', leadId: 'lead-1', agentId: 'user-agent-1', datetime: new Date(Date.now() + 4 * 3600 * 1000).toISOString(), notes: 'Call Rahul back for DLF Crest 3BHK high-rise floor confirmation.', completed: false, type: 'Call' },
    { id: 'fup-2', organizationId: 'org-estateflow-1', leadId: 'lead-3', agentId: 'user-agent-1', datetime: new Date(Date.now() + 25 * 3600 * 1000).toISOString(), notes: 'Vikram Rathore site visit companion at Marbella Villas.', completed: false, type: 'Site Visit' },
    { id: 'fup-apex', organizationId: 'org-apex-2', leadId: 'lead-apex-1', agentId: 'user-apex-agent', datetime: new Date(Date.now() + 8 * 3600 * 1000).toISOString(), notes: 'Prepare central park west contract copy and draft custom greeting.', completed: false, type: 'Call' },
    { id: 'fup-star', organizationId: 'org-star-3', leadId: 'lead-star-1', agentId: 'user-star-agent', datetime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(), notes: 'Deliver broadbeach beach loft pricing spreadsheet to Bruce.', completed: false, type: 'WhatsApp' }
  ];
}

function getSeedActivities(): Activity[] {
  return [
    { id: 'act-1', organizationId: 'org-estateflow-1', leadId: 'lead-1', userId: 'user-agent-1', type: 'System', title: 'Lead Created', description: 'Rahul Sharma entered via webhook source 36 Acre. Auto-assigned to Sales Agent Arjun Kumar.', timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
    { id: 'act-2', organizationId: 'org-estateflow-1', leadId: 'lead-1', userId: 'user-agent-1', type: 'Call', title: 'Call Bridged', description: 'Instant bridge call completed. Outcome: Client answered, requested evening call.', timestamp: new Date(Date.now() - 1.8 * 3600 * 1000).toISOString() },
    { id: 'act-apex', organizationId: 'org-apex-2', leadId: 'lead-apex-1', userId: 'user-apex-agent', type: 'System', title: 'Portal Signup', description: 'Elizabeth registered on white label front-end portal regarding skyline option.', timestamp: new Date().toISOString() }
  ];
}

function getSeedCalls(): CallLog[] {
  return [
    { id: 'call-1', organizationId: 'org-estateflow-1', leadId: 'lead-1', agentId: 'user-agent-1', status: 'Completed', duration: 112, startedAt: new Date(Date.now() - 1.8 * 3600 * 1000).toISOString(), endedAt: new Date(Date.now() - 1.78 * 3600 * 1000).toISOString(), outcome: 'Positive response. Client agreed to review sky residence brochure.' },
    { id: 'call-apex', organizationId: 'org-apex-2', leadId: 'lead-apex-1', agentId: 'user-apex-agent', status: 'Completed', duration: 180, startedAt: new Date().toISOString(), endedAt: new Date().toISOString(), outcome: 'Discussed sterling penthouse pricing and security layers.' }
  ];
}

function getSeedAttendance(): Attendance[] {
  return [
    { id: 'att-1', organizationId: 'org-estateflow-1', userId: 'user-agent-1', checkInTime: new Date(new Date().setHours(9, 15, 0)).toISOString(), status: 'Present', notes: 'Check-in from golf course extension road sector office.' },
    { id: 'att-2', organizationId: 'org-estateflow-1', userId: 'user-agent-2', checkInTime: new Date(new Date().setHours(9, 45, 0)).toISOString(), status: 'Late', notes: 'Delayed due to traffic on NH8.' },
    { id: 'att-apex', organizationId: 'org-apex-2', userId: 'user-apex-agent', checkInTime: new Date(new Date().setHours(9, 0, 0)).toISOString(), status: 'Present', notes: 'Remote check-in from New York office lounge.' }
  ];
}

function getSeedSocialPosts(): SocialPost[] {
  return [
    { id: 'post-1', organizationId: 'org-estateflow-1', postType: 'Instagram Reel', caption: 'Step inside Gurgaon\'s most expensive penthouses! #luxuryrealty #estateflow', status: 'Draft', scheduledTime: new Date(Date.now() + 18 * 3600 * 1000).toISOString(), assignedUserId: 'user-social-1', notes: 'Add trending ambient tracks.' },
    { id: 'post-apex-1', organizationId: 'org-apex-2', postType: 'LinkedIn Post', caption: 'Announcing our exclusive Skyline listing overlooking iconic Central Park at 740 CPW. Experience ultimate prestige. #ApexRealty #ManhattanPremium', status: 'Draft', scheduledTime: new Date(Date.now() + 30 * 3600 * 1000).toISOString(), assignedUserId: 'user-apex-agent' }
  ];
}

function getSeedContacts(): ContactPerson[] {
  return [
    { id: 'contact-1', organizationId: 'org-estateflow-1', firstName: 'Varun', lastName: 'Sharma', phone: '+919999912345', email: 'varun.sharma@dlf.in', company: 'DLF Developers', notes: 'Superintendent for DLF Crest & Aralias bookings. Very cooperative.', avatarSeed: 'varun', createdAt: new Date().toISOString() },
    { id: 'contact-2', organizationId: 'org-estateflow-1', firstName: 'Rohan', lastName: 'Mehra', phone: '+919875550000', email: 'rohan@m3m.com', company: 'M3M India', notes: 'Key coordinator for Golf Estate Phase 2 commercial slots.', avatarSeed: 'rohan', createdAt: new Date().toISOString() },
    { id: 'contact-apex', organizationId: 'org-apex-2', firstName: 'John', lastName: 'Lenox', phone: '+12128889900', email: 'j.lenox@manhattanbuilders.com', company: 'Manhattan Builders', notes: 'High-end general contractor for remodeling.', avatarSeed: 'john-10', createdAt: new Date().toISOString() }
  ];
}

export class Database {
  private static store: DBStore | null = null;

  public static initialize(): DBStore {
    if (this.store) return this.store;

    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        this.store = JSON.parse(fileContent) as DBStore;
        
        // Dynamic additions or repairs for multi-tenant SaaS Upgrade
        if (!this.store.organizations || this.store.organizations.length === 0) {
          this.store.organizations = seedOrganizations;
          this.save();
        }
        if (!this.store.contacts) {
          this.store.contacts = getSeedContacts();
          this.save();
        }
      } else {
        throw new Error('File not found');
      }
    } catch (e) {
      // Seed completely from scratch
      this.store = {
        organization: seedOrganizations[0],
        organizations: seedOrganizations,
        users: seedUsers,
        leads: getSeedLeads(),
        properties: getSeedProperties(),
        shares: [],
        activities: getSeedActivities(),
        calls: getSeedCalls(),
        messages: [],
        followups: getSeedFollowUps(),
        attendance: getSeedAttendance(),
        socialPosts: getSeedSocialPosts(),
        contacts: getSeedContacts(),
        settings: seedSettings,
        notifications: [
          {
            id: 'notif-1',
            organizationId: 'org-estateflow-1',
            userId: 'user-agent-1',
            title: 'New Hot Lead Assigned',
            description: 'Rahul Sharma assigned. Take action immediate.',
            type: 'LeadAssigned',
            isRead: false,
            createdAt: new Date().toISOString()
          }
        ]
      };
      this.save();
    }
    return this.store!;
  }

  public static save(): void {
    if (!this.store) return;
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.store, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  public static get(): DBStore {
    return this.initialize();
  }

  // Round robin lead assignment within tenant isolation
  public static assignLeadToAgent(
    leadData: Omit<Lead, 'id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'assignedAgentId'>,
    tenantOrgId: string = 'org-estateflow-1'
  ): Lead {
    const store = this.get();
    
    // Find agents belonging to that specific organization
    const agents = store.users.filter(u => u.organizationId === tenantOrgId && u.role === 'Sales Agent');
    
    // Fallback: if no sales agents, find ANY user in that org, or default to an admin
    const orgUsers = store.users.filter(u => u.organizationId === tenantOrgId);
    let assignedAgentId = '';
    
    if (agents.length > 0) {
      assignedAgentId = agents[0].id;

      if (store.settings.leadAssignmentMode === 'Round Robin') {
        const sortedLeads = [...store.leads]
          .filter(l => l.organizationId === tenantOrgId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const lastLeadWithAgent = sortedLeads.find(l => l.assignedAgentId && agents.some(a => a.id === l.assignedAgentId));

        if (lastLeadWithAgent) {
          const lastAgentIndex = agents.findIndex(a => a.id === lastLeadWithAgent.assignedAgentId);
          const nextAgentIndex = (lastAgentIndex + 1) % agents.length;
          assignedAgentId = agents[nextAgentIndex].id;
        }
      } else {
        // Find agent with lowest count in this org
        const agentCounts = agents.map(agent => {
          const count = store.leads.filter(l => l.organizationId === tenantOrgId && l.assignedAgentId === agent.id && l.status !== 'Won' && l.status !== 'Lost').length;
          return { agentId: agent.id, count };
        });
        agentCounts.sort((a, b) => a.count - b.count);
        assignedAgentId = agentCounts[0].agentId;
      }
    } else if (orgUsers.length > 0) {
      // fallback assign to the first org user
      assignedAgentId = orgUsers[0].id;
    } else {
      // Absolute fallback to user-admin-1
      assignedAgentId = 'user-admin-1';
    }

    const nowStr = new Date().toISOString();
    const newLead: Lead = {
      ...leadData,
      id: generateId('lead'),
      organizationId: tenantOrgId,
      assignedAgentId,
      createdAt: nowStr,
      updatedAt: nowStr
    };

    store.leads.unshift(newLead);

    // Create Activity Log
    const agentName = store.users.find(a => a.id === assignedAgentId)?.name || 'Team member';
    const activity: Activity = {
      id: generateId('act'),
      organizationId: tenantOrgId,
      leadId: newLead.id,
      userId: assignedAgentId,
      type: 'Assignment',
      title: 'Lead Registered',
      description: `New lead created from [${newLead.source}] and allocated to [${agentName}] within the secure sandbox pipeline.`,
      timestamp: nowStr
    };
    store.activities.unshift(activity);

    // Push notification
    const notification: Notification = {
      id: generateId('notif'),
      organizationId: tenantOrgId,
      userId: assignedAgentId,
      title: 'New Lead Allocated',
      description: `${newLead.fullName} from ${newLead.source} has been allocated to you.`,
      type: 'LeadAssigned',
      isRead: false,
      createdAt: nowStr
    };
    store.notifications.unshift(notification);

    this.save();
    return newLead;
  }
}
