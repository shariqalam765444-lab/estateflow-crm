import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Zap, 
  Check, 
  X, 
  TrendingUp, 
  Sparkles, 
  Award, 
  CheckCircle, 
  Globe, 
  FileText, 
  RefreshCw, 
  ShieldAlert,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Building,
  Mail,
  Phone,
  Clock,
  Unlock,
  Coins,
  Receipt,
  Download,
  Info,
  Sliders,
  Bell,
  CheckSquare,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { Organization, Lead, Property, UserProfile } from '../types';

interface SaaSPlansBillingProps {
  activeOrg: Organization;
  organizations: Organization[];
  onRefreshAllData: () => void;
  currentUser: UserProfile | null;
  leads: Lead[];
  properties: Property[];
  users: UserProfile[];
}

interface PaymentCard {
  id: string;
  brand: 'Visa' | 'Mastercard' | 'Amex' | 'Discovery';
  last4: string;
  holderName: string;
  expiry: string;
  isDefault: boolean;
}

interface InvoiceLog {
  id: string;
  date: string;
  amount: number;
  plan: string;
  status: 'Paid' | 'Failed' | 'Pending' | 'Draft';
  paymentMethod: string;
  taxAmount: number;
}

export default function SaaSPlansBilling({
  activeOrg,
  organizations,
  onRefreshAllData,
  currentUser,
  leads,
  properties,
  users
}: SaaSPlansBillingProps) {
  // Tab states
  const [activeSubTab, setActiveSubTab] = useState<'pricing' | 'billing' | 'comparison' | 'methods'>('pricing');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Simulation controls / mock notifications states
  const [simTrialDaysLeft, setSimTrialDaysLeft] = useState<number | null>(null);
  const [simStatus, setSimStatus] = useState<'Active' | 'Trial' | 'Expired' | 'Cancelled'>('Active');
  const [activeAlerts, setActiveAlerts] = useState<string[]>([]);

  // Checkout gateway state variables
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethodSelection, setPaymentMethodSelection] = useState<'card' | 'paypal'>('card');
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0); 
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Stripe Mock Card Form state for input
  const [formCardName, setFormCardName] = useState('');
  const [formCardNumber, setFormCardNumber] = useState('');
  const [formCardExpiry, setFormCardExpiry] = useState('');
  const [formCardCvv, setFormCardCvv] = useState('');
  const [formCardBrand, setFormCardBrand] = useState<'Visa' | 'Mastercard' | 'Amex'>('Visa');
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState('');

  // Transaction animations progress states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processLogs, setProcessLogs] = useState<string[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'processing' | 'success' | 'failed'>('form');
  const [checkoutErrorMsg, setCheckoutErrorMsg] = useState('');

  // Billing address profiles (persisted locally in localState on load or overridden)
  const [companyName, setCompanyName] = useState(activeOrg.name);
  const [billingAddress, setBillingAddress] = useState('1109 Broadway, Manhattan, NY 10001');
  const [taxId, setTaxId] = useState('US-98765432-A');
  const [billingEmail, setBillingEmail] = useState(currentUser?.email || 'owner@estateflow.in');
  const [billingPhone, setBillingPhone] = useState('+1 (555) 902-1244');
  const [isEditingBilling, setIsEditingBilling] = useState(false);

  // Cancel subscription modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Pricing is too high');
  const [isCanceledSuccess, setIsCanceledSuccess] = useState(false);

  // Resume subscription animation loaders
  const [isResuming, setIsResuming] = useState(false);

  // Interactive print dialog popups for Invoice Details
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceLog | null>(null);

  // Credit/Debit Card dynamic local List values
  const [paymentCards, setPaymentCards] = useState<PaymentCard[]>([
    { id: 'pm-1', brand: 'Visa', last4: '4242', holderName: currentUser?.name || 'Prem Nath', expiry: '12/28', isDefault: true },
    { id: 'pm-2', brand: 'Mastercard', last4: '9901', holderName: currentUser?.name || 'Prem Nath', expiry: '06/29', isDefault: false }
  ]);

  // Track dynamic custom local storage or organization state synchronizations
  const [billingNotification, setBillingNotification] = useState<string | null>(null);

  // Invoices simulation bank history list (dynamic based on activePlan and period is updated)
  const [invoices, setInvoices] = useState<InvoiceLog[]>([
    { id: 'INV-2026-004', date: '2026-05-15', amount: 39.00, plan: 'Pro', status: 'Paid', paymentMethod: 'Visa ending 4242', taxAmount: 3.12 },
    { id: 'INV-2026-003', date: '2026-04-15', amount: 39.00, plan: 'Pro', status: 'Paid', paymentMethod: 'Visa ending 4242', taxAmount: 3.12 },
    { id: 'INV-2026-002', date: '2026-03-15', amount: 39.00, plan: 'Pro', status: 'Paid', paymentMethod: 'Visa ending 4242', taxAmount: 3.12 },
    { id: 'INV-2026-001', date: '2026-02-15', amount: 49.00, plan: 'Pro', status: 'Failed', paymentMethod: 'Mastercard ending 9901', taxAmount: 3.92 }
  ]);

  // Synchronize component base inputs when agency profiles change
  useEffect(() => {
    if (activeOrg) {
      setCompanyName(activeOrg.name);
      // Preset status of current organization subscription plan for warning triggers
      if (activeOrg.status === 'Suspended') {
        setSimStatus('Expired');
      } else {
        setSimStatus('Active');
      }
    }
  }, [activeOrg]);

  // Toast auto-clearing timer
  useEffect(() => {
    if (billingNotification) {
      const t = setTimeout(() => {
        setBillingNotification(null);
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [billingNotification]);

  // Preset plans detail configurations matching Free, Plus, Pro, Business, Platinum
  const plans = [
    {
      id: 'Free',
      name: 'Free Plan',
      priceMonthly: 0,
      priceYearly: 0,
      badge: 'Starter',
      description: 'Ideal configuration for solo realtors to configure CRM features.',
      icon: Globe,
      limits: { maxUsers: 1, maxLeads: 100, maxProperties: 10 },
      features: [
        '1 User Account License Seat',
        '100 Real CRM Leads Storage',
        '10 Active Property Slots',
        'Basic Leads Pipeline & Funnels',
        'Email Support standard tier'
      ],
      notIncluded: [
        'Unlimited CRM Leads Intake',
        'Gemini AI smart agent helper',
        'Integrated WhatsApp Outreach App',
        'Whitelabel custom branding files'
      ]
    },
    {
      id: 'Plus',
      name: 'Plus Plan',
      priceMonthly: 19,
      priceYearly: 15, 
      badge: 'Growing Broker',
      description: 'Perfect for small teams seeking optimized tracking workflows.',
      icon: TrendingUp,
      limits: { maxUsers: 3, maxLeads: 1000, maxProperties: 50 },
      features: [
        '3 Team License Seats included',
        '1,000 Total Leads Storage',
        '50 Unified Property Slots',
        'Standard Real Estate Analytics',
        'Priority email response SLA'
      ],
      notIncluded: [
        'WhatsApp direct outreach API',
        'Gemini AI smart agent helper',
        'Whitelabel custom branding files'
      ]
    },
    {
      id: 'Pro',
      name: 'Pro Broker',
      priceMonthly: 49,
      priceYearly: 39, 
      badge: 'Industry Recommended',
      isPopular: true,
      description: 'Unlock maximum productivity with built-in AI assistance & WhatsApp.',
      icon: Zap,
      limits: { maxUsers: 10, maxLeads: 99999, maxProperties: 250 },
      features: [
        '10 Dedicated Seat Licenses',
        'Unlimited Leads Storage DB',
        '250 Premium Property Slots',
        'Integrated WhatsApp Gateway',
        'Gemini LLM smart agent chatbot',
        'Advanced visual pipeline reports',
        'Priority 24/7 client live support'
      ],
      notIncluded: [
        'Upload agency custom branding files',
        'Whitelabel customized CRM title settings'
      ]
    },
    {
      id: 'Business',
      name: 'Agency Business',
      priceMonthly: 99,
      priceYearly: 79, 
      badge: 'Enterprise Starter',
      description: 'Robust automation pipelines for elite high-volume teams.',
      icon: Award,
      limits: { maxUsers: 50, maxLeads: 99999, maxProperties: 99999 },
      features: [
        '50 Full License Seats included',
        'Unlimited Real Leads Storage',
        'Unlimited Property Listings Slots',
        'Rule-based Lead assignments',
        'Interactive team attendance maps',
        'Tailored agency automated rules',
        'Exclusive Direct call support queue'
      ],
      notIncluded: [
        'Agency custom site favicon logo setup'
      ]
    },
    {
      id: 'Platinum',
      name: 'Platinum Whitelabel',
      priceMonthly: 199,
      priceYearly: 159, 
      badge: 'Ultimate Whitelabel',
      description: 'Unleash full white-label capabilities with personalized platform identity.',
      icon: Sparkles,
      limits: { maxUsers: 99999, maxLeads: 99999, maxProperties: 99999 },
      features: [
        'Unlimited Team seats / licenses',
        'Unlimited Leads and Properties Listings',
        'Replace with your white-label business logo',
        'Configure your custom application title',
        'Deploy custom branding client colors',
        'Personal 1-on-1 CRM account executive',
        'Enterprise customized SLA guarantee'
      ],
      notIncluded: []
    }
  ];

  const currentLeadsCount = leads.length;
  const currentPropsCount = properties.length;
  const currentUsersCount = users.length;

  const currentLimitLeads = activeOrg.maxLeadsLimit;
  const currentLimitProps = activeOrg.maxPropertiesLimit;
  const currentLimitUsers = activeOrg.maxUsersLimit;

  // Compute usage percentages
  const leadsPct = Math.min(100, Math.round((currentLeadsCount / currentLimitLeads) * 100)) || 0;
  const propsPct = Math.min(100, Math.round((currentPropsCount / currentLimitProps) * 100)) || 0;
  const usersPct = Math.min(100, Math.round((currentUsersCount / currentLimitUsers) * 100)) || 0;

  // 1. SELECT UPGRADE OR DOWNGRADE PLAN ACTION
  const handleSelectPlan = (planId: string) => {
    // Fill Stripe default testing configurations
    setSelectedPlanId(planId);
    setFormCardNumber('4242 4242 4242 4242');
    setFormCardName(currentUser?.name || companyName + ' Owner');
    setFormCardExpiry('12/28');
    setFormCardCvv('123');
    setFormCardBrand('Visa');
    setPaypalEmail(currentUser?.email || 'owner@estateflow.in');
    setCheckoutStep('form');
    setAppliedDiscount(0);
    setCouponCode('');
    setCouponError('');
    setCouponSuccess('');
    setShowCheckoutModal(true);
  };

  // 2. APPLY SANDBOX COUPON VALIDATOR
  const handleApplyCoupon = () => {
    setCouponError('');
    setCouponSuccess('');
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    if (code === 'ESTATE20') {
      setAppliedDiscount(20);
      setCouponSuccess('20% coupon code applied successfully!');
      setBillingNotification('🏷 Estate20 Code successfully processed. 20% Discount unlocked!');
    } else if (code === 'PLATINUM100') {
      setAppliedDiscount(100);
      setCouponSuccess('VIP 100% Sponsor billing discount activated!');
      setBillingNotification('⚡ Creator VIP discount registered. Free billing access unlocked.');
    } else {
      setCouponError('Invalid coupon. Try ESTATE20 (20%) or PLATINUM100 (100% discount).');
    }
  };

  // 3. SECURE STRIPE MOCK CHECKOUT ENGINE WITH TICK LOGS
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return;

    // Validate entries
    if (paymentMethodSelection === 'card') {
      const cleanNum = formCardNumber.replace(/\s/g, '');
      if (cleanNum.length < 16) {
        setBillingNotification('❌ Card input rejected. Card must have 16 numeric inputs.');
        alert('Payment Declined: Invalid card layout. Please review inputs.');
        return;
      }
      if (formCardExpiry.indexOf('/') === -1) {
        setBillingNotification('❌ Card input rejected. Incorrect expiry pattern.');
        alert('Payment Declined: Expiry must fit MM/YY format.');
        return;
      }
    } else {
      if (!paypalEmail.includes('@')) {
        alert('Please enter a valid PayPal test credentials account.');
        return;
      }
    }

    setCheckoutStep('processing');
    setProcessLogs(['Establishing PCI-DSS secure card tunnel...', 'Validating Stripe mock verification codes...']);

    // Log feedback increments
    setTimeout(() => {
      setProcessLogs(prev => [...prev, 'Stripe Token generated: tok_sandbox_crm_' + Math.floor(Math.random()*90000)]);
    }, 450);

    setTimeout(() => {
      setProcessLogs(prev => [...prev, 'Authenticating user billing address data...']);
    }, 900);

    // Final outcome after timeout
    setTimeout(async () => {
      // Logic for Decline test override: card ending in 4000
      if (paymentMethodSelection === 'card' && formCardNumber.endsWith('4000')) {
        setCheckoutStep('failed');
        setCheckoutErrorMsg('Stripe Code card_declined: Insufficient funds in bank balance account. Code 4000 override activated.');
        setBillingNotification('❌ Error: Payment Authorization Rejected (Stripe Code 4000).');
        return;
      }

      // Successful update sequence
      const targetPlan = plans.find(p => p.id === selectedPlanId);
      if (!targetPlan) {
        setCheckoutStep('failed');
        setCheckoutErrorMsg('Invalid subscription package ID.');
        return;
      }

      const updatedLimits = {
        subscriptionPlan: targetPlan.id as any,
        maxUsersLimit: targetPlan.limits.maxUsers,
        maxLeadsLimit: targetPlan.limits.maxLeads,
        maxPropertiesLimit: targetPlan.limits.maxProperties,
        status: 'Active' as const
      };

      try {
        const res = await fetch(`/api/saas/agencies/${activeOrg.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedLimits)
        });

        if (res.ok) {
          // Add dynamic invoice log
          const basePrice = billingPeriod === 'monthly' ? targetPlan.priceMonthly : targetPlan.priceYearly;
          const discountedPrice = basePrice * (1 - appliedDiscount / 100);
          const finalVal = billingPeriod === 'yearly' ? discountedPrice * 12 : discountedPrice;
          
          const newInvoice: InvoiceLog = {
            id: 'INV-' + new Date().getFullYear() + '-' + (Math.floor(Math.random()*900)+100),
            date: new Date().toISOString().split('T')[0],
            amount: finalVal,
            plan: targetPlan.name,
            status: 'Paid',
            paymentMethod: paymentMethodSelection === 'card' 
              ? `Visa ending ${formCardNumber.slice(-4)}`
              : `PayPal (${paypalEmail})`,
            taxAmount: Number((finalVal * 0.08).toFixed(2))
          };

          setInvoices(prev => [newInvoice, ...prev]);
          setSimStatus('Active');
          setCheckoutStep('success');
          setBillingNotification(`🎉 Successfully upgraded subscription to ${targetPlan.name}!`);
          onRefreshAllData();
        } else {
          throw new Error('SaaS Update server route failed');
        }
      } catch (err) {
        setCheckoutStep('failed');
        setCheckoutErrorMsg('Internal data sync failure. Please review your network state.');
      }
    }, 2200);
  };

  // 4. CANCEL/DOWNGRADE WORKFLOW (SETS TO FREE PLAN LIMITS)
  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    setProcessLogs(['Downgrading subscription state to Free Tier...', 'Restricting staff license seats and caps...']);
    
    try {
      const response = await fetch(`/api/saas/agencies/${activeOrg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionPlan: 'Free',
          maxLeadsLimit: 100,
          maxPropertiesLimit: 10,
          maxUsersLimit: 1,
          status: 'Active'
        })
      });

      if (response.ok) {
        setIsCanceledSuccess(true);
        setSimStatus('Cancelled');
        setBillingNotification('ℹ Subscription cancelled. Account set to downgrading status.');
        setTimeout(() => {
          setShowCancelModal(false);
          setIsCanceledSuccess(false);
          onRefreshAllData();
        }, 1200);
      }
    } catch (e) {
      alert('Failed to connect to active update api route.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. RESUME CANCELLED SUBSCRIPTION PLAN
  const handleResumeSubscription = async (targetPlanId: string) => {
    setIsResuming(true);
    const planDetails = plans.find(p => p.id === targetPlanId) || plans[2]; // fallback to Pro
    
    // Simulate payment resolution
    setTimeout(async () => {
      try {
        const res = await fetch(`/api/saas/agencies/${activeOrg.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscriptionPlan: targetPlanId as any,
            maxUsersLimit: planDetails.limits.maxUsers,
            maxLeadsLimit: planDetails.limits.maxLeads,
            maxPropertiesLimit: planDetails.limits.maxProperties,
            status: 'Active'
          })
        });

        if (res.ok) {
          setSimStatus('Active');
          setBillingNotification(`✨ Welcome Back! Unlimited Auto-Renewal re-established for your ${planDetails.name}.`);
          onRefreshAllData();
        }
      } catch (err) {
        alert('Server failure resuming subscription.');
      } finally {
        setIsResuming(false);
      }
    }, 1200);
  };

  // 6. RENEW DYNAMIC TRIAL OR SUBSCRIPTION NOW
  const handleRenewNow = async () => {
    setIsProcessing(true);
    setBillingNotification('🔄 Requesting instant cycle renewal with default card...');

    setTimeout(async () => {
      try {
        const response = await fetch(`/api/saas/agencies/${activeOrg.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Active' })
        });
        
        if (response.ok) {
          setSimStatus('Active');
          setBillingNotification('✔ Auto-renew date reset. Premium subscription term prolonged for 30 days.');
          
          // Generate a custom new payment history
          const activePlanData = plans.find(p => p.id === activeOrg.subscriptionPlan) || plans[2];
          const calculatedCharge = billingPeriod === 'monthly' ? activePlanData.priceMonthly : activePlanData.priceYearly;
          
          const renewalInvoice: InvoiceLog = {
            id: 'INV-' + new Date().getFullYear() + '-' + Math.floor(Math.random()*900 + 100),
            date: new Date().toISOString().split('T')[0],
            amount: calculatedCharge,
            plan: activePlanData.name,
            status: 'Paid',
            paymentMethod: paymentCards.find(c => c.isDefault)?.brand + ' ending ' + paymentCards.find(c => c.isDefault)?.last4 || 'Visa ending 4242',
            taxAmount: Number((calculatedCharge * 0.08).toFixed(2))
          };

          setInvoices(prev => [renewalInvoice, ...prev]);
          onRefreshAllData();
          alert('Renewal processed successfully! A dynamic pro-forma invoice has been appended below.');
        }
      } catch (err) {
        alert('Could not update active renewal data on server database.');
      } finally {
        setIsProcessing(false);
      }
    }, 1000);
  };

  // 7. PAYMENT WALLET: ADD SECURE MOCK CARD
  const handleAddNewCard = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = formCardNumber.replace(/\s/g, '');
    if (cleanNum.length < 16) {
      alert('Invalid card number count! Must contain 16 digit items.');
      return;
    }

    const brandName = cleanNum.startsWith('3') ? 'Amex' : cleanNum.startsWith('5') ? 'Mastercard' : 'Visa';

    const newPm: PaymentCard = {
      id: 'pm-' + Date.now(),
      brand: brandName as any,
      last4: cleanNum.slice(-4),
      holderName: formCardName,
      expiry: formCardExpiry || '12/29',
      isDefault: paymentCards.length === 0
    };

    setPaymentCards(prev => [...prev, newPm]);
    setBillingNotification(`💳 Verified ${brandName} ending ${newPm.last4} saved to secure sandbox portal Wallet!`);
    
    // reset card form inputs
    setFormCardNumber('');
    setFormCardName('');
    setFormCardExpiry('');
    setFormCardCvv('');
    alert('Payment Method Added Successfully!');
  };

  // set card as default selector
  const handleSetCardDefault = (id: string) => {
    setPaymentCards(prev => prev.map(c => ({
      ...c,
      isDefault: c.id === id
    })));
    setBillingNotification('⭐ Default payment gateway credit card restructured successfully.');
  };

  // delete a card from wallet
  const handleDeleteCard = (id: string) => {
    const cardToDelete = paymentCards.find(c => c.id === id);
    if (!cardToDelete) return;
    if (cardToDelete.isDefault && paymentCards.length > 1) {
      alert('Please set another default card before removing this settlement method.');
      return;
    }
    setPaymentCards(prev => prev.filter(c => c.id !== id));
    setBillingNotification(`🗑 Settlement method ending ${cardToDelete.last4} expunged cleanly.`);
  };

  // 8. SAVE BUSINESS BILLING REGISTRATIONS INFORMATION
  const handleSaveBillingInformation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingBilling(false);
    setBillingNotification('🏢 Corporate Billing Information Records synchronized flawlessly.');
    alert('Billing credentials update has been verified.');
  };

  // Quick sandbox helper to toggle mock state situations
  const applySandboxOverrides = (status: 'Active' | 'Trial' | 'Expired' | 'Cancelled') => {
    setSimStatus(status);
    if (status === 'Trial') {
      setSimTrialDaysLeft(3);
      setActiveAlerts(['⚠️ Critical Alert: Your Sandbox Premium Trial remains active for 3 testing days only.']);
      setBillingNotification('⏳ Workspace state forced to Trial environment.');
    } else if (status === 'Expired') {
      setSimTrialDaysLeft(null);
      setActiveAlerts(['❌ Critical lock: Overdue subscription balance. Team limits restricted to standard free.']);
      setBillingNotification('🔒 Overdue mock payment simulated. Account restricted.');
    } else if (status === 'Cancelled') {
      setSimTrialDaysLeft(null);
      setActiveAlerts(['⚠️ Notice: Auto-renewal is paused. Service terminates June 24, 2026.']);
      setBillingNotification('🔕 Auto-renew ceased in sandbox container.');
    } else {
      setSimTrialDaysLeft(null);
      setActiveAlerts([]);
      setBillingNotification('✅ Full Active tier state restored.');
    }
  };

  return (
    <div className="space-y-6" id="saas-plans-billing-module">
      {/* 8. Notification Center alert alerts */}
      {billingNotification && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-indigo-500 text-white rounded-2xl p-4.5 max-w-sm shadow-2xl z-50 animate-slideUp flex items-center justify-between gap-3 gap-y-1">
          <div className="flex items-center gap-2">
            <Bell className="text-amber-400 animate-bounce shrink-0" size={16} />
            <p className="text-xs font-semibold leading-snug">{billingNotification}</p>
          </div>
          <button onClick={() => setBillingNotification(null)} className="text-slate-400 hover:text-white shrink-0">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Main Alerts Drawer for trials and limits */}
      {activeAlerts.map((alt, key) => (
        <div key={key} className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-3 shadow-2xs">
          <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={17} />
          <div className="flex-1">
            <span className="text-xs font-black text-rose-950 block">SYSTEM STATUS ALERT</span>
            <p className="text-xs text-rose-800 font-semibold mt-0.5">{alt}</p>
          </div>
          <button 
            onClick={() => setActiveAlerts(prev => prev.filter((_, i) => i !== key))}
            className="text-rose-400 hover:text-rose-900"
          >
            <X size={15} />
          </button>
        </div>
      ))}

      {/* Status Warning for Cancelled but active, Trial, or Expired statuses */}
      {simStatus === 'Cancelled' && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-center justify-between gap-4 shadow-3xs">
          <div className="flex items-start gap-3 text-xs text-amber-905">
            <Clock className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <div>
              <strong className="font-extrabold uppercase tracking-wide block">Cancellation Processing Active</strong>
              <p className="text-amber-800 font-medium">Your platform capabilities will remain fully functional until June 24, 2026. Auto-renewal ceased.</p>
            </div>
          </div>
          <button
            onClick={() => handleResumeSubscription(activeOrg.subscriptionPlan)}
            disabled={isResuming}
            className="bg-amber-600 hover:bg-amber-700 font-extrabold uppercase text-[10px] text-white px-3.5 py-1.5 rounded-lg shrink-0 tracking-wider shadow"
          >
            {isResuming ? 'Resuming...' : '⚡ Resume Auto-Renew'}
          </button>
        </div>
      )}

      {simStatus === 'Trial' && (
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-xl flex items-center justify-between gap-4 shadow-3xs">
          <div className="flex items-start gap-3 text-xs text-indigo-955">
            <Sparkles className="text-indigo-600 shrink-0 mt-0.5" size={18} />
            <div>
              <strong className="font-extrabold uppercase tracking-wide block">Sandbox Professional Premium Trial Enabled</strong>
              <p className="text-indigo-805 font-medium">You have {simTrialDaysLeft || '3'} days remaining in your developer premium sandbox trial evaluate.</p>
            </div>
          </div>
          <button
            onClick={() => setActiveSubTab('pricing')}
            className="bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-[10px] text-white px-3.5 py-1.5 rounded-lg shrink-0 tracking-wider shadow"
          >
            Choose Paid Tier
          </button>
        </div>
      )}

      {/* Hero Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl border border-slate-105 shadow-xs gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Coins className="text-indigo-600 animate-pulse" size={19} /> CRM Billing, Subscription & Limits Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Activate premium real estate whitelabel licenses, configure integrated billing cards, track usage limits, or toggle monthly & yearly subscription contracts.
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-indigo-50 border border-indigo-100 uppercase px-3.5 py-1.5 rounded-xl font-mono text-[10px] font-black tracking-wider text-indigo-800">
            Plan: {activeOrg.subscriptionPlan}
          </div>
          <div className={`border uppercase px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold ${
            simStatus === 'Active' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
            simStatus === 'Trial' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
            'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            Status: {simStatus}
          </div>
        </div>
      </div>

      {/* Tabs Layout Switcher */}
      <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl max-w-xl border">
        <button
          onClick={() => setActiveSubTab('pricing')}
          className={`flex-1 min-w-[100px] py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
            activeSubTab === 'pricing' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          🏷 Pricing & Upgrades
        </button>
        <button
          onClick={() => setActiveSubTab('billing')}
          className={`flex-1 min-w-[100px] py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
            activeSubTab === 'billing' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          💳 Subscriptions / Limits
        </button>
        <button
          onClick={() => setActiveSubTab('methods')}
          className={`flex-1 min-w-[100px] py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
            activeSubTab === 'methods' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          🔐 Payment Methods
        </button>
        <button
          onClick={() => setActiveSubTab('comparison')}
          className={`flex-1 min-w-[100px] py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
            activeSubTab === 'comparison' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          📊 Capability Matrix
        </button>
      </div>

      {/* --- TAB 1: PRICING & UPGRADE CENTRE --- */}
      {activeSubTab === 'pricing' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between bg-indigo-50/50 border border-indigo-100 p-4.5 rounded-2xl gap-4">
            <div>
              <strong className="text-indigo-950 font-black block text-xs uppercase tracking-wide">Save 20% by locking Annual Cycles</strong>
              <p className="text-slate-500 text-[11px] mt-0.5">Toggle annual billing cycles to unlock extreme enterprise discounts instantly.</p>
            </div>
            
            <div className="flex items-center gap-3 shrink-1">
              <span className={`text-[11px] font-bold ${billingPeriod === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>Billed Monthly</span>
              
              <button 
                onClick={() => {
                  setBillingPeriod(p => p === 'monthly' ? 'yearly' : 'monthly');
                  setBillingNotification(`🔄 Billing period modified to ${billingPeriod === 'monthly' ? 'Yearly (20% Off)' : 'Monthly'}`);
                }}
                className="relative h-6 w-11 bg-indigo-650 bg-indigo-600 rounded-full cursor-pointer transition p-0.5 shrink-0"
              >
                <div className={`h-5 w-5 bg-white rounded-full shadow-sm transform transition-transform ${billingPeriod === 'yearly' ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>

              <span className={`text-[11px] font-bold flex items-center gap-1.5 ${billingPeriod === 'yearly' ? 'text-slate-900' : 'text-slate-400'}`}>
                Billed Annually
                <span className="bg-emerald-500 text-white text-[9px] font-black py-0.5 px-2 rounded-full uppercase animate-pulse">20% Discount</span>
              </span>
            </div>
          </div>

          {/* Pricing list columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {plans.map((p) => {
              const basePrice = billingPeriod === 'monthly' ? p.priceMonthly : p.priceYearly;
              const isCurrent = activeOrg.subscriptionPlan === p.id;

              return (
                <div 
                  key={p.id}
                  className={`bg-white rounded-2xl p-4 border flex flex-col justify-between transition-all relative ${
                    p.isPopular ? 'border-indigo-600 shadow-md ring-2 ring-indigo-600/20' : isCurrent ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-100 hover:border-slate-300 shadow-3xs'
                  }`}
                >
                  {p.isPopular && (
                    <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                      RECOMMENDED
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                      ✔ ACTIVE
                    </span>
                  )}

                  <div className="space-y-4">
                    <div>
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">{p.badge}</span>
                      <h4 className="text-xs font-black text-slate-900 uppercase mt-0.5 flex items-center gap-1">
                        <p.icon size={13} className="text-indigo-600" /> {p.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-normal mt-1 min-h-[44px]">{p.description}</p>
                    </div>

                    <div className="pt-2.5 border-t">
                      <div className="flex items-baseline">
                        <span className="text-lg font-black text-slate-900">${basePrice}</span>
                        <span className="text-[9px] text-slate-400 font-bold lowercase ml-0.5">/month</span>
                      </div>
                      <span className="text-[9px] text-indigo-605 text-indigo-600 font-extrabold block">
                        {p.priceMonthly === 0 ? 'Free Sandbox Access' : billingPeriod === 'yearly' ? `Billed annually ($${basePrice * 12}/yr)` : 'Monthly Terms'}
                      </span>
                    </div>

                    <div className="space-y-1.5 p-2.5 bg-slate-50 border rounded-xl text-[9.5px]">
                      <div className="flex justify-between font-semibold text-slate-600">
                        <span>Staff Seats included:</span>
                        <span className="text-slate-900 font-black">{p.limits.maxUsers >= 9999 ? 'No Limit' : `${p.limits.maxUsers} License`}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-slate-600">
                        <span>Leads Records Limit:</span>
                        <span className="text-slate-900 font-black">{p.limits.maxLeads >= 9999 ? 'No Limit' : `${p.limits.maxLeads}`}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-slate-600">
                        <span>Property Listings slots:</span>
                        <span className="text-slate-900 font-black">{p.limits.maxProperties >= 9999 ? 'No Limit' : `${p.limits.maxProperties}`}</span>
                      </div>
                    </div>

                    <ul className="space-y-1.5 pt-1 text-[9.5px] text-slate-600">
                      {p.features.map((feat, i) => (
                        <li key={i} className="flex gap-1 items-start">
                          <Check size={11} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-tight">{feat}</span>
                        </li>
                      ))}
                      {p.notIncluded.map((feat, i) => (
                        <li key={i} className="flex gap-1 items-start text-slate-400">
                          <X size={11} className="text-slate-300 shrink-0 mt-0.5" />
                          <span className="leading-tight line-through">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3.5 border-t mt-4">
                    {isCurrent ? (
                      <button disabled className="w-full text-center py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase rounded-lg cursor-default">
                        Current Enabled Tier
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSelectPlan(p.id)}
                        className={`w-full text-center py-2 text-[10px] uppercase font-black tracking-wider rounded-lg transition-all cursor-pointer ${
                          p.isPopular ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' : 'bg-slate-900 hover:bg-indigo-600 text-white'
                        }`}
                      >
                        {p.priceMonthly === 0 ? 'Downgrade' : 'Secure Upgrade'} <ArrowRight className="inline" size={10} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 2: ACTIVE SUBSCRIPTIONS & LIMITS --- */}
      {activeSubTab === 'billing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Usage panel, upgraded limits dynamically */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border shadow-xs space-y-4">
              <div>
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-900">Workspace Quotas Monitor</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Compare active staff count, properties, and lead storage listings against the ceiling limits of your plan.</p>
              </div>

              {/* Progress dynamic bars */}
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs text-slate-700 font-semibold">
                    <span>Leads storage ({currentLeadsCount} of {currentLimitLeads >= 9999 ? 'Unlimited' : currentLimitLeads})</span>
                    <span className="font-mono text-[10px] font-bold">{leadsPct}% used</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 rounded-full ${leadsPct > 90 ? 'bg-rose-500' : 'bg-indigo-600'}`} style={{ width: `${leadsPct}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400">{currentLimitLeads >= 9999 ? 'Unlimited dynamic storage enabled' : `${currentLimitLeads - currentLeadsCount} lead slots remaining`}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs text-slate-700 font-semibold">
                    <span>Property Stocks storage ({currentPropsCount} of {currentLimitProps >= 9999 ? 'Unlimited' : currentLimitProps})</span>
                    <span className="font-mono text-[10px] font-bold">{propsPct}% used</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 rounded-full ${propsPct > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${propsPct}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400">{currentLimitProps >= 9999 ? 'Unlimited property listing nodes' : `${currentLimitProps - currentPropsCount} listings slots remaining`}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs text-slate-700 font-semibold">
                    <span>Active Staff Seats ({currentUsersCount} of {currentLimitUsers >= 9999 ? 'Unlimited' : currentLimitUsers})</span>
                    <span className="font-mono text-[10px] font-bold">{usersPct}% used</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 rounded-full ${usersPct > 90 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${usersPct}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400">{currentLimitUsers >= 9999 ? 'No seating license limit' : `${currentLimitUsers - currentUsersCount} seats remaining`}</p>
                </div>
              </div>

              {/* Action operations buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={handleRenewNow}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl cursor-default flex items-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw size={12} className={isProcessing ? 'animate-spin' : ''} />
                    {isProcessing ? 'Processing...' : 'Force Cycle Renewal'}
                  </button>
                  <button 
                    onClick={() => setActiveSubTab('pricing')}
                    className="bg-white border text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all"
                  >
                    🚀 Switch Plan Edition
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="text-rose-600 border border-transparent hover:border-rose-100 hover:bg-rose-50 text-[10px] font-black uppercase px-3.5 py-2 rounded-xl transition-all"
                >
                  Cancel Plan
                </button>
              </div>
            </div>

            {/* Billing Addresses information */}
            <div className="bg-white rounded-2xl p-5 border shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-900 flex items-center gap-1">
                  <Building size={14} className="text-slate-500" /> Invoice Addresses
                </h3>
                <button 
                  onClick={() => setIsEditingBilling(e => !e)}
                  className="text-[11px] text-indigo-605 text-indigo-700 font-black hover:underline cursor-pointer"
                >
                  {isEditingBilling ? 'Cancel Form' : '✐ Edit Details'}
                </button>
              </div>

              {isEditingBilling ? (
                <form onSubmit={handleSaveBillingInformation} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-500 text-[9px] uppercase block tracking-wider">Company Registered Name</label>
                    <input 
                      type="text"
                      required
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      className="w-full bg-slate-50 p-2 border text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-500 text-[9px] uppercase block tracking-wider">Invoice Address</label>
                    <textarea 
                      required
                      value={billingAddress}
                      onChange={e => setBillingAddress(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-50 p-2 border text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-500 text-[9px] uppercase block tracking-wider">Tax Registration ID</label>
                      <input 
                        type="text" 
                        required
                        value={taxId}
                        onChange={e => setTaxId(e.target.value)}
                        className="w-full bg-slate-50 p-2 border text-xs rounded-xl focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-500 text-[9px] uppercase block tracking-wider">Contact Email</label>
                      <input 
                        type="email" 
                        required
                        value={billingEmail}
                        onChange={e => setBillingEmail(e.target.value)}
                        className="w-full bg-slate-50 p-2 border text-xs rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-500 text-[9px] uppercase block tracking-wider">Billing Contact Phone</label>
                    <input 
                      type="text"
                      value={billingPhone}
                      onChange={e => setBillingPhone(e.target.value)}
                      className="w-full bg-slate-50 p-2 border text-xs rounded-xl focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-center shadow-xs"
                  >
                    Confirm & Update Info
                  </button>
                </form>
              ) : (
                <div className="space-y-3.5 text-xs">
                  <div className="bg-slate-50/70 p-3.5 rounded-xl space-y-2 border">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 block">Current Billing Party</span>
                    <p className="font-extrabold text-slate-900">{companyName}</p>
                    <p className="font-medium text-slate-500 leading-normal flex items-start gap-1"><Mail size={12} className="mt-0.5" /> {billingEmail}</p>
                    <p className="font-medium text-slate-500 leading-normal flex items-start gap-1"><Phone size={12} className="mt-0.5" /> {billingPhone}</p>
                  </div>

                  <div className="space-y-2.5 text-slate-600 font-medium">
                    <p className="flex justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Tax ID (Unified):</span>
                      <span className="font-mono text-slate-900 font-bold">{taxId}</span>
                    </p>
                    <p className="flex justify-between items-start text-xs">
                      <span className="text-slate-400 font-semibold shrink-0">Address:</span>
                      <span className="text-slate-800 text-right max-w-[160px] truncate" title={billingAddress}>{billingAddress}</span>
                    </p>
                  </div>

                  <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-100/50 flex gap-1.5 text-[9.5px]">
                    <ShieldCheck size={14} className="shrink-0 text-emerald-600 mt-0.5" />
                    <p>Standardized corporate VAT compliance applied successfully.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Invoice ledger history */}
          <div className="bg-white rounded-2xl p-5 border shadow-xs space-y-3.5">
            <div>
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-900">Invoices & Payment Log Archives</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Direct printable cash transactional history ledger for current billing terms cycles.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-[9px] uppercase font-bold text-slate-400 font-mono">
                    <th className="p-3">Cash Reference</th>
                    <th className="p-3">Charged Date</th>
                    <th className="p-3">Billed Tier</th>
                    <th className="p-3">Owed Amount</th>
                    <th className="p-3">Method used</th>
                    <th className="p-3">Trans. Status</th>
                    <th className="p-3 text-right">Receipt Sheet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-indigo-950">{inv.id}</td>
                      <td className="p-3">{inv.date}</td>
                      <td className="p-3">
                        <span className="bg-indigo-50 text-indigo-805 text-[10px] px-2 py-0.5 rounded font-extrabold">
                          {inv.plan}
                        </span>
                      </td>
                      <td className="p-3 font-black text-slate-900">${inv.amount.toFixed(2)}</td>
                      <td className="p-3">{inv.paymentMethod}</td>
                      <td className="p-3">
                        <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase inline-block ${
                          inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                          inv.status === 'Failed' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setViewingInvoice(inv);
                            setBillingNotification(`📄 Printing layout initialized for reference ${inv.id}`);
                          }}
                          className="bg-white hover:bg-slate-50 border border-slate-200 text-[10px] py-1 px-2.5 rounded-lg font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <FileText size={11} className="text-indigo-600" /> View Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: PAYMENT METHODS WALLET --- */}
      {activeSubTab === 'methods' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Wallet list of saved payment items */}
            <div className="bg-white rounded-2xl p-5 border shadow-xs space-y-4">
              <div>
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-900">Your Saved Cards</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Set default, verify card details, or remove payment methods for monthly auto-renew deals.</p>
              </div>

              {paymentCards.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 border rounded-xl text-slate-400 text-xs">
                  No payment cards registered in active wallet. Please append new ones.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {paymentCards.map((card) => (
                    <div 
                      key={card.id}
                      className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                        card.isDefault ? 'bg-indigo-50/30 border-indigo-400/80' : 'bg-white border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-slate-900 text-white rounded-lg shrink-0">
                          <CreditCard size={18} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
                            {card.brand} ending •••• {card.last4}
                            {card.isDefault && (
                              <span className="bg-indigo-600 text-white text-[8px] py-0.5 px-2 rounded-full uppercase tracking-wider">
                                Default
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-550">Holder: <strong>{card.holderName}</strong> | Exp: <strong>{card.expiry}</strong></p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!card.isDefault && (
                          <button
                            onClick={() => handleSetCardDefault(card.id)}
                            className="text-[9px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-850 px-2 py-1 border border-indigo-200 bg-white rounded-lg hover:bg-indigo-50/50"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5"
                          title="Remove settlement instrument"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-100 flex items-start gap-2 text-amber-805 text-[10px] leading-relaxed">
                <Info size={14} className="shrink-0 mt-0.5" />
                <p><strong>PCI-DSS Secured Vault:</strong> Real card elements are tunneled transparently to Stripe; AI Studio Sandbox never stores complete PAN credentials.</p>
              </div>
            </div>

            {/* Form to save card instrument */}
            <div className="bg-white rounded-2xl p-5 border shadow-xs space-y-4">
              <div>
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-900">Add Credit / Debit Card Form</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Saves a simulated transaction card securely to sandbox workspace profiles.</p>
              </div>

              <form onSubmit={handleAddNewCard} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-505 text-[9px] uppercase tracking-wide block">Card Network Type</label>
                    <select
                      value={formCardBrand}
                      onChange={e => setFormCardBrand(e.target.value as any)}
                      className="w-full bg-slate-50 border p-2 rounded-xl text-xs text-slate-900"
                    >
                      <option value="Visa">Visa Verification card</option>
                      <option value="Mastercard">Mastercard SecureCode</option>
                      <option value="Amex">American Express Smart Card</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-505 text-[9px] uppercase tracking-wide block">Holder Full Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="Prem Nath"
                      value={formCardName}
                      onChange={e => setFormCardName(e.target.value)}
                      className="w-full bg-slate-50 border p-2 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-505 text-[9px] uppercase tracking-wide block">16-Digit Card Number</label>
                  <input 
                    type="text"
                    required
                    maxLength={19}
                    placeholder="4242 4242 4242 4242"
                    value={formCardNumber}
                    onChange={e => setFormCardNumber(e.target.value)}
                    className="w-full bg-slate-50 border p-2 rounded-xl font-mono text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-505 text-[9px] uppercase tracking-wide block">Expiration (MM/YY)</label>
                    <input 
                      type="text"
                      required
                      maxLength={5}
                      placeholder="12/28"
                      value={formCardExpiry}
                      onChange={e => setFormCardExpiry(e.target.value)}
                      className="w-full bg-slate-50 border p-2 rounded-xl text-center focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-505 text-[9px] uppercase tracking-wide block">CVC Security Key</label>
                    <input 
                      type="password"
                      required
                      maxLength={3}
                      placeholder="•••"
                      value={formCardCvv}
                      onChange={e => setFormCardCvv(e.target.value)}
                      className="w-full bg-slate-50 border p-2 rounded-xl text-center focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2 rounded-xl text-center transition-all shadow-xs uppercase tracking-wider text-[10px]"
                >
                  🔒 Register Payment Card
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: COMPLETE COMPARISON MATRIX --- */}
      {activeSubTab === 'comparison' && (
        <div className="bg-white rounded-2xl p-5 border shadow-xs space-y-4">
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-900">Premium Real Estate CRM Matrix comparison</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Explore built-in capabilities across free, team-oriented, and high-production Whitelabel plans.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-indigo-50/20 border-y text-[9.5px] uppercase font-bold text-slate-400 text-center font-mono text-indigo-950">
                  <th className="p-3 text-left w-1/4">Capability Specs</th>
                  <th className="p-3">Free Edition</th>
                  <th className="p-3">Plus Edition</th>
                  <th className="p-3 bg-indigo-50 border-x border-indigo-100 text-indigo-700 font-extrabold">Pro Broker (Choice)</th>
                  <th className="p-3">Agency Business</th>
                  <th className="p-3">Platinum Whitelabel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-center font-bold text-slate-705">
                <tr className="hover:bg-slate-50/40">
                  <td className="p-3.5 text-left font-bold text-slate-805 text-[11px]">Monthly Price Cycle</td>
                  <td className="p-3 font-mono text-slate-400">$0 / mo</td>
                  <td className="p-3">$19 / mo</td>
                  <td className="p-3 bg-indigo-50/35 border-x border-indigo-100 text-indigo-700 font-mono">$49 / mo</td>
                  <td className="p-3">$99 / mo</td>
                  <td className="p-3 font-mono text-slate-900 font-black">$199 / mo</td>
                </tr>
                <tr className="hover:bg-slate-50/40">
                  <td className="p-3.5 text-left font-bold text-slate-805 text-[11px]">Annually Discounted Rate</td>
                  <td className="p-3 font-mono text-slate-400">Not Applicable</td>
                  <td className="p-3 text-emerald-600 font-semibold">$15/mo ($180 billed)</td>
                  <td className="p-3 bg-indigo-50/35 border-x border-indigo-100 text-indigo-700 font-bold">$39/mo ($468 billed)</td>
                  <td className="p-3 text-emerald-600">$79/mo ($948 billed)</td>
                  <td className="p-3 font-mono text-slate-900 font-black text-emerald-605 text-emerald-600">$159/mo ($1908 billed)</td>
                </tr>
                <tr className="hover:bg-slate-50/40">
                  <td className="p-3.5 text-left font-bold text-slate-805 text-[11px]">Staff Seat Licenses Limit</td>
                  <td className="p-3 text-slate-400">1 Team Seat</td>
                  <td className="p-3">3 Seat slots</td>
                  <td className="p-3 bg-indigo-50/35 border-x border-indigo-100 text-indigo-700">10 Seats Licenses</td>
                  <td className="p-3">50 Seats Limit</td>
                  <td className="p-3 text-emerald-605 text-emerald-600 font-black uppercase">UNLIMITED SEATS</td>
                </tr>
                <tr className="hover:bg-slate-50/40">
                  <td className="p-3.5 text-left font-bold text-slate-805 text-[11px]">Leads Intake Records Limit</td>
                  <td className="p-3 text-slate-400">100 Leads max</td>
                  <td className="p-3">1,000 Leads max</td>
                  <td className="p-3 bg-indigo-50/35 border-x border-indigo-100 text-emerald-650 text-emerald-600 font-black uppercase">UNLIMITED LEADS</td>
                  <td className="p-3 text-emerald-600 font-black uppercase">UNLIMITED LEADS</td>
                  <td className="p-3 text-emerald-600 font-black uppercase">UNLIMITED LEADS</td>
                </tr>
                <tr className="hover:bg-slate-50/40">
                  <td className="p-3.5 text-left font-bold text-slate-805 text-[11px]">Properties Database Slots</td>
                  <td className="p-3 text-slate-400">10 Slots max</td>
                  <td className="p-3">50 Slots max</td>
                  <td className="p-3 bg-indigo-50/35 border-x border-indigo-100 text-slate-900">250 Property Slots</td>
                  <td className="p-3 text-emerald-600 uppercase">UNLIMITED SLOTS</td>
                  <td className="p-3 text-emerald-600 font-black uppercase">UNLIMITED SLOTS</td>
                </tr>
                <tr className="hover:bg-slate-50/40">
                  <td className="p-3.5 text-left font-bold text-slate-805 text-[11px]">Direct WhatsApp Gateway API</td>
                  <td className="p-3 text-slate-300">✖ Not Included</td>
                  <td className="p-3 text-slate-300">✖ Not Included</td>
                  <td className="p-3 bg-indigo-50/35 border-x border-indigo-100 text-emerald-600">✔ Yes, Integrated</td>
                  <td className="p-3 text-emerald-600">✔ Yes, Integrated</td>
                  <td className="p-3 text-emerald-600 font-black">✔ Yes, Full API access</td>
                </tr>
                <tr className="hover:bg-slate-50/40">
                  <td className="p-3.5 text-left font-bold text-slate-805 text-[11px]">Gemini 2.5 LLM AI Smart Agent</td>
                  <td className="p-3 text-slate-305 text-slate-300">✖ Not Included</td>
                  <td className="p-3 text-slate-400">✖ Limited trial</td>
                  <td className="p-3 bg-indigo-50/35 border-x border-indigo-100 text-emerald-600">✔ Yes, Ultra response</td>
                  <td className="p-3 text-emerald-600">✔ Yes, Custom tuning</td>
                  <td className="p-3 text-emerald-650 text-emerald-600 font-black uppercase">✔ Complete Suite with Voice</td>
                </tr>
                <tr className="hover:bg-slate-50/40">
                  <td className="p-3.5 text-left font-bold text-slate-805 text-[11px]">Upload Custom logo & Whitelabel branding</td>
                  <td className="p-3 text-slate-300">✖ Not Included</td>
                  <td className="p-3 text-slate-300">✖ Not Included</td>
                  <td className="p-3 bg-indigo-50/35 border-x border-indigo-100 text-slate-300">✖ Not Included</td>
                  <td className="p-3 text-slate-300">✖ Not Included</td>
                  <td className="p-3 text-emerald-600 font-black flex items-center justify-center gap-1">
                    <Sparkles size={11} className="text-pink-500 animate-spin" /> Unlocked Whitelabeling
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- RECONCILED SANDBOX DEMO CONTROL PANEL --- */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="text-amber-400 animate-spin" size={17} />
            <div>
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-amber-300">SaaS Simulator Control Center</h4>
              <p className="text-[10px] text-slate-400 font-mono">Simulate trial expiries, overdue failures, or cancelled renewal warnings instantly on the fly!</p>
            </div>
          </div>
          <span className="bg-slate-800 text-[8px] font-bold text-slate-405 font-mono px-2 py-0.5 rounded border border-slate-700 uppercase">
            Tester Tool Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button 
            onClick={() => applySandboxOverrides('Trial')}
            className={`p-2.5 rounded-xl text-[10px] font-bold uppercase text-center transition-all cursor-pointer ${
              simStatus === 'Trial' ? 'bg-indigo-600 text-white font-black' : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
            }`}
          >
            ⏳ Force Trial State (3 Days Remaining)
          </button>
          
          <button 
            onClick={() => applySandboxOverrides('Expired')}
            className={`p-2.5 rounded-xl text-[10px] font-bold uppercase text-center transition-all cursor-pointer ${
              simStatus === 'Expired' ? 'bg-rose-600 text-white font-black' : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
            }`}
          >
            🔒 Force Overdue / Locked State
          </button>

          <button 
            onClick={() => applySandboxOverrides('Cancelled')}
            className={`p-2.5 rounded-xl text-[10px] font-bold uppercase text-center transition-all cursor-pointer ${
              simStatus === 'Cancelled' ? 'bg-amber-600 text-white font-black' : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
            }`}
          >
            🔕 Force Ceased Auto-Renew
          </button>

          <button 
            onClick={() => applySandboxOverrides('Active')}
            className={`p-2.5 rounded-xl text-[10px] font-bold uppercase text-center transition-all cursor-pointer ${
              simStatus === 'Active' ? 'bg-emerald-600 text-white font-black' : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
            }`}
          >
            ✅ Restore Default Active System Status
          </button>
        </div>
      </div>

      {/* --- CHECKOUT GATEWAY SECURE MODAL --- */}
      {showCheckoutModal && selectedPlanId && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4" id="checkout-gateway-modal-wrapper">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border flex flex-col overflow-hidden max-h-[92vh]">
            
            {/* Modal security header */}
            <div className="bg-slate-950 text-white p-4.5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg animate-pulse shrink-0">
                  <CreditCard size={15} />
                </div>
                <div>
                  <h4 className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">SECURE BILLING DEPLOYER</h4>
                  <p className="text-[9px] text-slate-400 font-mono">PCI-DSS Secure AES Encrypted Sandbox Environment</p>
                </div>
              </div>
              <button 
                onClick={() => { if (!isProcessing) setShowCheckoutModal(false); }} 
                className="text-slate-400 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-4">
              {checkoutStep === 'form' && (
                <form onSubmit={handleProcessPayment} className="space-y-4">
                  {/* Order review billing component */}
                  <div className="bg-slate-50 border p-3.5 rounded-xl text-xs space-y-1.5">
                    <span className="text-[8px] uppercase font-extrabold text-indigo-700 block tracking-widest font-mono">ORDER SELECTION SUMMARY:</span>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-800 uppercase">{plans.find(p => p.id === selectedPlanId)?.name} Edition Contract</span>
                      <span className="text-slate-900">
                        ${billingPeriod === 'monthly' ? plans.find(p => p.id === selectedPlanId)?.priceMonthly : (plans.find(p => p.id === selectedPlanId)?.priceYearly || 0) * 12}
                        <span className="text-[10px] text-slate-400 lowercase font-medium">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                      </span>
                    </div>

                    {appliedDiscount > 0 && (
                      <div className="flex justify-between text-emerald-650 text-emerald-700 pt-1.5 border-t border-dashed">
                        <span>Promo Code Activated ({appliedDiscount}% Off)</span>
                        <span>-${((billingPeriod === 'monthly' ? (plans.find(p => p.id === selectedPlanId)?.priceMonthly || 0) : (plans.find(p => p.id === selectedPlanId)?.priceYearly || 0) * 12) * appliedDiscount) / 100}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-black border-t pt-1.5 text-slate-900 text-sm">
                      <span>Standard Amount Due:</span>
                      <span>
                        ${(billingPeriod === 'monthly' 
                          ? (plans.find(p => p.id === selectedPlanId)?.priceMonthly || 0) 
                          : (plans.find(p => p.id === selectedPlanId)?.priceYearly || 0) * 12) * (1 - appliedDiscount / 100)}
                      </span>
                    </div>
                  </div>

                  {/* Payment selector toggle */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold text-center bg-slate-50 p-1 rounded-xl border">
                    <button 
                      type="button" 
                      onClick={() => setPaymentMethodSelection('card')}
                      className={`py-1.5 rounded-lg transition-all ${paymentMethodSelection === 'card' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500'}`}
                    >
                      💳 Credit / Debit Card
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setPaymentMethodSelection('paypal')}
                      className={`py-1.5 rounded-lg transition-all ${paymentMethodSelection === 'paypal' ? 'bg-amber-500 text-white shadow' : 'text-slate-500'}`}
                    >
                      🌀 PayPal checkout
                    </button>
                  </div>

                  {/* Promo coupons selector input */}
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    <input 
                      type="text" 
                      placeholder="Enter promo coupon or code"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      className="col-span-2 bg-slate-50 border rounded-lg px-2.5 py-1.5 uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button 
                      type="button" 
                      onClick={handleApplyCoupon}
                      className="bg-slate-905 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-center cursor-pointer transition-all py-1.5 text-[10px] uppercase font-bold tracking-wider"
                    >
                      Verify
                    </button>
                    {couponError && <p className="col-span-3 text-[9px] text-rose-605 text-rose-600 font-bold">{couponError}</p>}
                    {couponSuccess && <p className="col-span-3 text-[9px] text-emerald-605 text-emerald-600 font-extrabold">{couponSuccess}</p>}
                  </div>

                  {paymentMethodSelection === 'card' ? (
                    <div className="space-y-3.5">
                      {/* Interactive Credit Card display container with flip mechanism */}
                      <div 
                        className="h-28 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-xl p-3 text-white font-mono relative cursor-pointer overflow-hidden shadow-sm"
                        onClick={() => setIsCardFlipped(p => !p)}
                        title="Click to flip your checkout card"
                      >
                        {!isCardFlipped ? (
                          <div className="space-y-3 h-full flex flex-col justify-between">
                            <span className="text-[9px] font-black italic tracking-widest text-indigo-305">STRIPE SECURITY MOCKCARD</span>
                            <p className="text-center font-bold tracking-widest text-[13px]">{formCardNumber || '•••• •••• •••• ••••'}</p>
                            <div className="flex justify-between text-[8px] uppercase tracking-wide text-slate-300">
                              <span>Holder: {formCardName || 'Cardholder Name'}</span>
                              <span>Expiry: {formCardExpiry || 'MM/YY'}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3 h-full flex flex-col justify-between">
                            <div className="h-3 bg-black -mx-3" />
                            <div className="flex justify-end pr-3.5 text-[9px] items-center gap-1">
                              <span className="bg-white text-slate-950 px-1 font-bold italic">CVC:</span>
                              <span className="bg-amber-100 text-slate-900 font-bold px-1.5 rounded">{formCardCvv || '•••'}</span>
                            </div>
                            <span className="text-[7.5px] text-center text-slate-400">Secure end-to-end sandbox verification token</span>
                          </div>
                        )}
                        <span className="absolute bottom-1 right-2 text-[7px] font-bold text-indigo-400">Click to flip</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="col-span-2 space-y-1">
                          <label className="font-extrabold text-slate-600 block text-[9.5px]">Card Number</label>
                          <input 
                            required
                            type="text" 
                            placeholder="4242 4242 4242 4242"
                            value={formCardNumber}
                            onChange={e => setFormCardNumber(e.target.value)}
                            onFocus={() => setIsCardFlipped(false)}
                            className="w-full bg-slate-50 border p-2 rounded-xl text-slate-900 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-600 block text-[9.5px]">Card Holder</label>
                          <input 
                            required
                            type="text" 
                            placeholder="Prem Nath"
                            value={formCardName}
                            onChange={e => setFormCardName(e.target.value)}
                            onFocus={() => setIsCardFlipped(false)}
                            className="w-full bg-slate-50 border p-2 rounded-xl text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="space-y-1">
                            <label className="font-extrabold text-slate-600 block text-[9.5px]">Expiry</label>
                            <input 
                              required
                              type="text" 
                              maxLength={5}
                              placeholder="12/28"
                              value={formCardExpiry}
                              onChange={e => setFormCardExpiry(e.target.value)}
                              onFocus={() => setIsCardFlipped(false)}
                              className="w-full bg-slate-50 border p-2 rounded-xl text-center"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-extrabold text-slate-600 block text-[9.5px]">CVV</label>
                            <input 
                              required
                              type="password" 
                              maxLength={3}
                              placeholder="123"
                              value={formCardCvv}
                              onChange={e => setFormCardCvv(e.target.value)}
                              onFocus={() => setIsCardFlipped(true)}
                              className="w-full bg-slate-50 border p-2 rounded-xl text-center"
                            />
                          </div>
                        </div>
                        
                        <p className="col-span-2 text-[9px] text-slate-400 leading-normal">
                          💡 Sandbox Declines: Input card ending on <code>4000</code> to trigger bank transaction failure simulations.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5 text-xs">
                      <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-[10px] text-amber-800 leading-relaxed">
                        <strong>Mock PayPal Gateway Active:</strong> Secure checkouts bypass PayPal redirect window. Enter paypal registered email address to authorize immediately.
                      </div>
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-600 block text-[9.5px]">PayPal Email Address</label>
                        <input 
                          required
                          type="email" 
                          value={paypalEmail}
                          onChange={e => setPaypalEmail(e.target.value)}
                          placeholder="buyer@estateflow-developer-paypal-sandbox.com"
                          className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-4 border-t">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setShowCheckoutModal(false)}
                      className="flex-1 text-slate-500 hover:text-slate-800 border p-2.5 rounded-xl text-center font-bold uppercase text-[10px] cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl text-center font-black uppercase text-[10px] cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                    >
                      Authorize Payment
                    </button>
                  </div>
                </form>
              )}

              {/* Secure sandbox processing dialog */}
              {checkoutStep === 'processing' && (
                <div className="text-center py-8 space-y-4" id="checkout-gateway-processing-view">
                  <div className="h-12 w-12 border-4 border-indigo-505 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-xs uppercase font-extrabold text-slate-900 tracking-wider">Contacting Payment Gateway...</h4>
                    <p className="text-[11px] text-slate-500">Communicating with Sandbox processors securely</p>
                  </div>

                  <div className="bg-slate-50 border p-3 rounded-xl max-w-sm mx-auto space-y-1 text-left">
                    {processLogs.map((log, key) => (
                      <p key={key} className="text-[9px] font-mono text-slate-600 leading-normal flex items-start gap-1">
                        <span className="text-indigo-650 text-indigo-600">❯</span> {log}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* SUCCESS checkout STEP */}
              {checkoutStep === 'success' && (
                <div className="text-center py-5 space-y-4" id="payment-gate-success-view">
                  <div className="h-14 w-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xs border border-emerald-100">
                    <CheckCircle2 size={36} className="animate-bounce text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-902 text-slate-900">Subscription Updated</h3>
                    <p className="text-xs text-slate-500 leading-normal px-2">
                      Fantastic! Your mock banking credentials have been resolved cleanly. Your client limits upgraded to <strong>{selectedPlanId} plan level</strong>.
                    </p>
                  </div>

                  <div className="bg-slate-50 border p-3.5 rounded-xl text-[10px] font-bold space-y-1.5 text-slate-600 max-w-sm mx-auto text-left font-mono">
                    <p className="flex justify-between"><span>Reference ID:</span> <span className="text-slate-900">TXN-{Math.floor(Math.random()*90000)+10000}</span></p>
                    <p className="flex justify-between"><span>Active Plan ID:</span> <span className="text-indigo-600 uppercase font-black">{selectedPlanId} tier loaded</span></p>
                    <p className="flex justify-between"><span>Limits Status:</span> <span className="text-emerald-600 uppercase">Ceilings expanded instantly</span></p>
                  </div>

                  <button
                    onClick={() => {
                      setShowCheckoutModal(false);
                      setActiveSubTab('billing');
                    }}
                    className="bg-slate-950 hover:bg-slate-850 text-white text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-lg mx-auto block cursor-pointer"
                  >
                    Go back to Billing Center
                  </button>
                </div>
              )}

              {/* FAILED upgrade STEP */}
              {checkoutStep === 'failed' && (
                <div className="text-center py-5 space-y-4">
                  <div className="h-14 w-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-xs border border-rose-100">
                    <ShieldAlert size={32} className="text-rose-600" />
                  </div>
                  <div className="space-y-1 text-center">
                    <h3 className="text-xs font-black uppercase text-rose-600">Charge declined by Sandbox card issuer</h3>
                    <p className="text-[11px] text-slate-505 text-slate-500 leading-normal max-w-xs mx-auto">
                      Checkout request declined securely. Exception: <strong>{checkoutErrorMsg}</strong>
                    </p>
                  </div>

                  <div className="bg-slate-50 border p-3 rounded-xl text-[9.5px] text-left text-slate-500 space-y-1 max-w-xs mx-auto font-medium leading-relaxed">
                    <p className="font-extrabold text-slate-700 uppercase tracking-wider">Troubleshooting checks:</p>
                    <p>• Avoid card inputs terminating on CVV ending in '4000'.</p>
                    <p>• Review CVV verification input codes (e.g. '123' standard sandbox).</p>
                    <p>• Check default PayPal buyer accounts registration.</p>
                  </div>

                  <div className="flex justify-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        setFormCardNumber('4242 4242 4242 1111'); // restore clean digits
                        setCheckoutStep('form');
                      }}
                      className="bg-indigo-600 text-white text-[10px] font-bold py-2 px-3 rounded-lg uppercase cursor-pointer hover:bg-indigo-700 transition"
                    >
                      Retry Payment Form
                    </button>
                    <button
                      onClick={() => {
                        setPaymentMethodSelection('paypal');
                        setCheckoutStep('form');
                      }}
                      className="bg-amber-500 text-white text-[10px] font-bold py-2 px-3 rounded-lg uppercase cursor-pointer hover:bg-amber-600 transition"
                    >
                      Switch to Mock PayPal
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* --- RENEWAL CANCEL CONFIRMATION SUB MODAL --- */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl border">
            <h4 className="text-xs font-black text-rose-605 text-rose-600 uppercase flex items-center gap-1">
              <AlertCircle size={15} /> Confirm Downgrade Request
            </h4>
            
            {isCanceledSuccess ? (
              <div className="text-center py-4 space-y-2">
                <CheckCircle2 size={32} className="text-rose-500 mx-auto animate-bounce" />
                <p className="text-[10.5px] text-slate-505 text-slate-500">Downgraded to Free Level limits successfully. Staff seat licenses reduced to 1.</p>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs leading-normal font-medium text-slate-600">
                <p>
                  Reverting will adjust your team ceilings instantly. Staff licenses reduce to 1 seat, property database slots cut back to 10 max, and AI integrations will cease.
                </p>
                
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border text-[10px]">
                  <strong>Current metrics check:</strong>
                  <p>• Active Users inside your agency: {currentUsersCount}</p>
                  <p>• Registered leads records list: {currentLeadsCount}</p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-505 text-[10px] uppercase block">Why are you canceling terms?</label>
                  <select 
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    className="w-full text-xs p-1.5 border bg-slate-50 rounded-lg focus:outline-none"
                  >
                    <option value="Pricing is too high">Rate list too expensive for current agents</option>
                    <option value="Temporary closure">Temporarily pausing my team</option>
                    <option value="Switching to another service">Switching to traditional Excel tools</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2 border-t font-extrabold uppercase text-[10px]">
                  <button 
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-center cursor-pointer transition-all"
                  >
                    Keep subscription
                  </button>
                  <button 
                    onClick={handleCancelSubscription}
                    className="flex-1 bg-rose-600 text-white py-2 rounded-xl text-center cursor-pointer hover:bg-rose-700 transition"
                  >
                    Confirm Downgrade
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- PRINTABLE VIEW INVOICE DETAILED MODAL --- */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border print:p-0 print:border-none print:shadow-none">
            
            {/* Invoice Header details */}
            <div className="flex justify-between items-start border-b pb-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase tracking-wide">Pro-Forma Invoice Receipt</span>
                <p className="text-xs font-black text-slate-900">{viewingInvoice.id}</p>
                <p className="text-[10px] text-indigo-600 font-bold uppercase">{viewingInvoice.plan} Plan Cycle</p>
              </div>
              
              <div className="text-right">
                <span className="bg-emerald-50 text-emerald-800 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase">
                  ✔ Paid Status
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">{viewingInvoice.date}</p>
              </div>
            </div>

            {/* Address fields */}
            <div className="grid grid-cols-2 gap-4 text-[10.5px]">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] block">ISSUER:</span>
                <strong className="text-indigo-950 font-black block">Real Estate CRM Inc.</strong>
                <p className="text-slate-500 leading-normal">Cloud Native SaaS Suite Ltd.<br />1 Corporate Boulevard, San Francisco, CA</p>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] block">BILLED TO:</span>
                <strong className="text-slate-900 font-black block">{companyName}</strong>
                <p className="text-slate-550 leading-normal">{billingAddress}<br />Tax ID Ref: {taxId}</p>
              </div>
            </div>

            {/* Line items dynamic mapping */}
            <div className="border rounded-xl overflow-hidden text-[11px] font-medium text-slate-700">
              <div className="bg-slate-50 border-b p-2 px-3 font-semibold text-slate-500 grid grid-cols-4 font-mono text-[9px] uppercase text-center">
                <span className="text-left py-0.5">Item Description</span>
                <span className="py-0.5">Qty</span>
                <span className="py-0.5">Rate</span>
                <span className="text-right py-0.5">Amount</span>
              </div>
              <div className="p-3 grid grid-cols-4 text-center items-center divide-y divide-slate-100">
                <span className="text-left font-bold text-slate-900">{viewingInvoice.plan} CRM subscription licence</span>
                <span>1</span>
                <span>${(viewingInvoice.amount - viewingInvoice.taxAmount).toFixed(2)}</span>
                <span className="text-right font-bold text-slate-900">${(viewingInvoice.amount - viewingInvoice.taxAmount).toFixed(2)}</span>
              </div>
              <div className="bg-slate-50/50 p-2.5 px-3 select-none text-right text-[10px] space-y-1 border-t">
                <p className="flex justify-between max-w-[180px] ml-auto">
                  <span className="text-slate-400 font-semibold">Subtotal:</span>
                  <span className="font-bold text-slate-800">${(viewingInvoice.amount - viewingInvoice.taxAmount).toFixed(2)}</span>
                </p>
                <p className="flex justify-between max-w-[180px] ml-auto text-slate-400">
                  <span>Standard Taxes (8%):</span>
                  <span className="font-bold text-slate-800">${viewingInvoice.taxAmount.toFixed(2)}</span>
                </p>
                <p className="flex justify-between max-w-[180px] ml-auto font-black text-xs text-indigo-950 border-t pt-1 mt-1">
                  <span>Total Settled:</span>
                  <span>${viewingInvoice.amount.toFixed(2)}</span>
                </p>
              </div>
            </div>

            {/* Close / Action controls */}
            <div className="flex gap-2 pt-3 border-t print:hidden uppercase text-[10px] font-extrabold">
              <button
                onClick={() => setViewingInvoice(null)}
                className="flex-1 bg-slate-550 bg-slate-205 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-center cursor-pointer"
              >
                Close View
              </button>
              <button
                onClick={() => {
                  window.print();
                  setBillingNotification('📄 Initiated standard OS system print dialog cleanly.');
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-center cursor-pointer shadow flex items-center justify-center gap-1.5"
              >
                <Download size={12} /> Print Statement
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
