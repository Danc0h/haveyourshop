import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Globe, 
  Smartphone, 
  Cpu, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Send, 
  Mail, 
  Phone, 
  MapPin, 
  Menu, 
  X,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Trash2,
  TrendingUp,
  Briefcase,
  Users,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
  FileText,
  FileSpreadsheet,
  Terminal
} from 'lucide-react';
import './App.css';

// API Configuration
const API_URL = 'https://haveyourshop.onrender.com/api';

const groupItemsByDate = (items) => {
  const groups = {};
  if (!items || !Array.isArray(items)) return groups;
  items.forEach(item => {
    const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Discovered';
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(item);
  });
  return groups;
};

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Admin Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(localStorage.getItem('isAdmin') === 'true');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [cronRuns, setCronRuns] = useState([]);

  // Custom Pricing and Geolocation States
  const [pricingConfigs, setPricingConfigs] = useState([
    { template_key: 'business_website', base_price_one_time: 1499.00, base_price_yearly: 999.00, base_price_monthly: 99.00, local_discount_multiplier: 0.40 },
    { template_key: 'ecommerce_platform', base_price_one_time: 3499.00, base_price_yearly: 2399.00, base_price_monthly: 199.00, local_discount_multiplier: 0.40 },
    { template_key: 'restaurant_platform', base_price_one_time: 2499.00, base_price_yearly: 1799.00, base_price_monthly: 149.00, local_discount_multiplier: 0.40 },
    { template_key: 'booking_system', base_price_one_time: 1999.00, base_price_yearly: 1399.00, base_price_monthly: 119.00, local_discount_multiplier: 0.40 },
    { template_key: 'clinic_mgmt', base_price_one_time: 4499.00, base_price_yearly: 2999.00, base_price_monthly: 249.00, local_discount_multiplier: 0.40 },
    { template_key: 'real_estate_hotel', base_price_one_time: 5999.00, base_price_yearly: 3999.00, base_price_monthly: 349.00, local_discount_multiplier: 0.40 }
  ]);
  const [clientCountry, setClientCountry] = useState('US');
  const [clientCurrency, setClientCurrency] = useState('USD');
  const [priceMultiplier, setPriceMultiplier] = useState(1.0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [selectedPricingTier, setSelectedPricingTier] = useState('monthly'); // 'monthly', 'yearly', 'onetime'

  // Admin Custom Scraper Command States
  const [scraperCountry, setScraperCountry] = useState('United States');
  const [scraperCities, setScraperCities] = useState(['New York']);
  const [customCityInput, setCustomCityInput] = useState('');
  const [scraperNiche, setScraperNiche] = useState('Dentists and Dental Practices');
  const [customNicheInput, setCustomNicheInput] = useState('');

  // Analytics tab filter range
  const [analyticsRange, setAnalyticsRange] = useState('overall'); // 'overall', 'last7Days', 'last30Days'
  
  // CRM Dashboard State
  const [crmTab, setCrmTab] = useState('leads'); // 'leads', 'jobs', 'scholarships', 'analytics', 'logs'
  const [leads, setLeads] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [metrics, setMetrics] = useState({
    leads: { New: 0, Contacted: 0, Replied: 0, 'Meeting Scheduled': 0, 'Proposal Sent': 0, Won: 0, Lost: 0 },
    jobs: { Discovered: 0, Applied: 0, Interview: 0, Rejected: 0, Offer: 0 },
    outreach: { Email: 0, LinkedIn: 0, WhatsApp: 0, 'Contact Form': 0 },
    scholarships: { Discovered: 0, 'SOP Drafted': 0, Applied: 0, Interview: 0, Accepted: 0, Rejected: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [scrapingJobs, setScrapingJobs] = useState(false);
  const [crawlingLeads, setCrawlingLeads] = useState(false);
  const [scrapingScholarships, setScrapingScholarships] = useState(false);
  
  // Active Lead Details Modal
  const [selectedLead, setSelectedLead] = useState(null);
  const [outreachDraft, setOutreachDraft] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [loggedOutreachChannel, setLoggedOutreachChannel] = useState('Email');
  const [loggedOutreachMessage, setLoggedOutreachMessage] = useState('');

  // Active Job Details Modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [tailorLoading, setTailorLoading] = useState(false);

  // Active Scholarship Details Modal
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [sopLoading, setSopLoading] = useState(false);

  // Manual Lead Creation State
  const [showAddLead, setShowAddLead] = useState(false);
  const [showImportLeadText, setShowImportLeadText] = useState(false);
  const [importLeadText, setImportLeadText] = useState('');
  const [importLeadNiche, setImportLeadNiche] = useState('');
  const [importLeadCity, setImportLeadCity] = useState('');
  const [importingLeads, setImportingLeads] = useState(false);
  const [showImportFileModal, setShowImportFileModal] = useState(false);
  const [importFileNiche, setImportFileNiche] = useState('');
  const [importFileCity, setImportFileCity] = useState('');
  const [importingFile, setImportingFile] = useState(false);
  const [showImportJobModal, setShowImportJobModal] = useState(false);
  const [importingJobFile, setImportingJobFile] = useState(false);
  const [acquisitionTargets, setAcquisitionTargets] = useState([]);
  const [newTargetCity, setNewTargetCity] = useState('');
  const [newTargetNiche, setNewTargetNiche] = useState('Clinic Management Systems');
  const [newLeadData, setNewLeadData] = useState({
    business_name: '',
    industry: '',
    location: '',
    website_url: '',
    email: '',
    phone: ''
  });

  // Technical Arsenal State
  const [techNiches, setTechNiches] = useState([]);
  const [selectedNiche, setSelectedNiche] = useState(null);
  const [techTopics, setTechTopics] = useState([]);
  const [newNicheName, setNewNicheName] = useState('');
  const [newNicheDesc, setNewNicheDesc] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicNotes, setNewTopicNotes] = useState('');
  const [newSubtopicName, setNewSubtopicName] = useState('');
  const [selectedTopicForSubtopic, setSelectedTopicForSubtopic] = useState(null);
  const [editingNotesTopic, setEditingNotesTopic] = useState(null);
  const [editingNotesText, setEditingNotesText] = useState('');

  // Public Contact Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    service: 'ecommerce',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  // Resolve client IP and fetch custom pricing configs
  const fetchPricingConfigs = async () => {
    try {
      const res = await fetch(`${API_URL}/crm/pricing-configs`);
      if (res.ok) {
        const data = await res.json();
        setPricingConfigs(data);
      }
    } catch (e) {
      console.warn('Pricing config fetch failed.');
    }
  };

  useEffect(() => {
    const getGeoIp = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const data = await res.json();
          setClientCountry(data.country || 'US');
          setClientCurrency('USD'); // Always USD
          if (['KE', 'NG', 'TZ', 'UG', 'RW', 'ZA'].includes(data.country)) {
            setPriceMultiplier(0.40); // 60% regional discount
          } else {
            setPriceMultiplier(1.0);
          }
        }
      } catch (err) {
        console.warn('GeoIP fetch failed, defaulting to USD.');
        setClientCountry('US');
        setClientCurrency('USD');
        setPriceMultiplier(1.0);
      }
    };
    getGeoIp();
    fetchPricingConfigs();
  }, []);

  // Monitor scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
  }, []);

  const templatesData = [
    {
      key: 'business_website',
      title: 'Premium Business Website',
      description: 'A fully custom corporate presence designed to showcase services, build inbound authority, integrate lead capture, and establish brand confidence.',
      duration: '5 Days Launch',
      color: 'rgba(6, 182, 212, 0.15)',
      badgeColor: 'var(--secondary)',
      features: [
        'Brand credibility custom layout design',
        'SEO-optimized meta tags & markup structure',
        'Interactive lead capture & contact forms',
        'Fully responsive design for all screen resolutions',
        'Integrated company blog & content directory'
      ]
    },
    {
      key: 'ecommerce_platform',
      title: 'SupaCart E-Commerce Platform',
      description: 'High-speed storefront with custom shopping cart drawers, catalog filtering, mobile-friendly checkouts, and payment gateway integrations.',
      duration: '6 Days Launch',
      color: 'rgba(139, 92, 246, 0.15)',
      badgeColor: 'var(--primary)',
      features: [
        'Interactive sliding cart & drawer experience',
        'Advanced catalog search, sort & filters',
        'Multi-gateway payment support (PayPal, Cards, M-Pesa)',
        'Low-stock inventory tracking alerts',
        'Sales analytics & admin reporting dashboard'
      ]
    },
    {
      key: 'restaurant_platform',
      title: 'Restaurant Ordering Platform',
      description: 'Interactive digital menus, table reservation modules, real-time kitchen order tracking, and mobile payments for seamless dining experiences.',
      duration: '5 Days Launch',
      color: 'rgba(234, 179, 8, 0.15)',
      badgeColor: '#eab308',
      features: [
        'Digital QR-code menu directories',
        'Online table reservation calendar',
        'Real-time kitchen order dispatch console',
        'Automated order confirmation billing validation',
        'SMS delivery driver notification webhooks'
      ]
    },
    {
      key: 'booking_system',
      title: 'Appointment Booking System',
      description: 'Ideal for consultants, agencies, and service centers. Calendar slot allocations, confirmation notifications, and automated email webhook reminders.',
      duration: '4 Days Launch',
      color: 'rgba(236, 72, 153, 0.15)',
      badgeColor: 'var(--accent)',
      features: [
        'Dynamic interactive booking calendar scheduler',
        'Roster scheduling for individual consultants',
        'Automated confirmation email/SMS reminders',
        'Customer secure profile dashboard portal',
        'Two-way sync with Google Calendar API'
      ]
    },
    {
      key: 'clinic_mgmt',
      title: 'Clinic Management System',
      description: 'Secure clinical software for patient onboarding, digital health records tracking, practitioner scheduling, and prescription billing portals.',
      duration: '7 Days Launch',
      color: 'rgba(16, 185, 129, 0.15)',
      badgeColor: 'var(--secondary)',
      features: [
        'Patient digital onboarding registration flow',
        'AI clinic assistant chatbot integration',
        'Doctor scheduling rosters & availability slots',
        'HIPAA-compliant EHR clinical charts logs',
        'E-prescription & drug inventory records billing'
      ]
    },
    {
      key: 'real_estate_hotel',
      title: 'Real Estate & Hotel Booking',
      description: 'Advanced catalog layouts featuring interactive maps, property filtering, booking reservation flows, and client review dashboards.',
      duration: '7 Days Launch',
      color: 'rgba(239, 68, 68, 0.15)',
      badgeColor: '#ef4444',
      features: [
        'Real estate property/hotel room catalog lists',
        'Interactive map layout filtering integrations',
        'Direct booking reservation checkout engines',
        'Channel manager syncing (Airbnb, Booking.com)',
        'Guest invoice generator & billing ledger tracker'
      ]
    }
  ];

  // Auto-advancing templates carousel
  useEffect(() => {
    if (currentPage !== 'home' || isCarouselPaused) return;
    const interval = setInterval(() => {
      setCarouselIndex(prev => (prev === templatesData.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [currentPage, templatesData.length, isCarouselPaused]);

  const renderPrice = (key, tier) => {
    const conf = pricingConfigs.find(c => c.template_key === key);
    if (!conf) return '';
    let basePrice = 0;
    if (tier === 'monthly') {
      basePrice = parseFloat(conf.base_price_monthly);
    } else if (tier === 'six_months') {
      basePrice = parseFloat(conf.base_price_six_months || (parseFloat(conf.base_price_monthly) * 6 * 0.85));
    } else if (tier === 'yearly') {
      basePrice = parseFloat(conf.base_price_yearly);
    } else {
      basePrice = parseFloat(conf.base_price_one_time);
    }

    const finalPrice = basePrice * priceMultiplier;
    const isDiscountActive = priceMultiplier < 1.0;
    const discountPercent = Math.round((1 - priceMultiplier) * 100);
    
    let suffix = '';
    if (isDiscountActive) {
      suffix = ` (${discountPercent}% off)`;
    }

    return `$${Math.round(finalPrice).toLocaleString()}${suffix}`;
  };

  const renderOriginalPrice = (key, tier) => {
    const conf = pricingConfigs.find(c => c.template_key === key);
    if (!conf) return '';
    let basePrice = 0;
    if (tier === 'monthly') {
      basePrice = parseFloat(conf.base_price_monthly);
    } else if (tier === 'six_months') {
      basePrice = parseFloat(conf.base_price_six_months || (parseFloat(conf.base_price_monthly) * 6 * 0.85));
    } else if (tier === 'yearly') {
      basePrice = parseFloat(conf.base_price_yearly);
    } else {
      basePrice = parseFloat(conf.base_price_one_time);
    }
    
    const markupPrice = basePrice * 1.35; // 35% default markup for original price comparison
    const finalOriginalPrice = markupPrice * priceMultiplier;
    return `$${Math.round(finalOriginalPrice).toLocaleString()}`;
  };

  // Fetch CRM Data
  const fetchCrmData = async () => {
    setLoading(true);
    try {
      const [leadsRes, jobsRes, scholarshipsRes, metricsRes, targetsRes] = await Promise.all([
        fetch(`${API_URL}/crm/leads`).then(r => r.ok ? r.json() : []),
        fetch(`${API_URL}/crm/jobs`).then(r => r.ok ? r.json() : []),
        fetch(`${API_URL}/crm/scholarships`).then(r => r.ok ? r.json() : []),
        fetch(`${API_URL}/crm/metrics`).then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/crm/targets`).then(r => r.ok ? r.json() : [])
      ]);
      
      if (leadsRes.length > 0) setLeads(leadsRes);
      if (jobsRes.length > 0) setJobs(jobsRes);
      if (scholarshipsRes.length > 0) setScholarships(scholarshipsRes);
      if (metricsRes) setMetrics(metricsRes);
      if (targetsRes) setAcquisitionTargets(targetsRes);
    } catch (err) {
      console.warn('⚠️ CRM API unavailable. Using default mock datasets.');
      loadLocalMockData();
    } finally {
      setLoading(false);
    }
  };

  const fetchCronRuns = async () => {
    try {
      const res = await fetch(`${API_URL}/crm/cron-runs`);
      if (res.ok) {
        const data = await res.json();
        setCronRuns(data);
      } else {
        throw new Error('Cron runs API error');
      }
    } catch (err) {
      // Offline mock logs
      setCronRuns([
        {
          id: 'mock-cron-1',
          run_time: new Date(Date.now() - 12 * 3600000).toISOString(),
          pipeline_type: 'job_scraper',
          status: 'Success',
          tasks_executed: [
            { name: 'Check Remotive', status: 'Success', details: 'Ingested 2 new remote jobs' },
            { name: 'Check LinkedIn', status: 'Warning', details: 'Session cookies missing, ran AI-Assisted simulation (1 target generated)' },
            { name: 'Google Search (US, UK, AUS rotating)', status: 'Success', details: 'Scraped 3 career pages' },
            { name: 'Check Wellfound', status: 'Warning', details: 'Session cookies missing, ran AI-Assisted simulation' }
          ],
          log_output: 'Starting job scraper pipeline...\nTask 1: Remotive: Success\nTask 2: LinkedIn: Warnings (cookies missing)\nPipeline complete.',
          created_at: new Date(Date.now() - 12 * 3600000).toISOString()
        },
        {
          id: 'mock-cron-2',
          run_time: new Date(Date.now() - 24 * 3600000).toISOString(),
          pipeline_type: 'client_outreach',
          status: 'Success',
          tasks_executed: [
            { name: 'Instagram Shops Scan', status: 'Warning', details: 'Session cookie missing; generated 1 AI shop lead.' },
            { name: 'FB Marketplace Scan', status: 'Warning', details: 'Auth token missing; generated 1 local lead.' },
            { name: 'Google Search Leads', status: 'Success', details: 'Discovered 1 dentist clinic in London with outdated tech.' }
          ],
          log_output: 'Starting client outreach pipeline...\nTask 1: Instagram: Warnings\nTask 2: Facebook: Warnings\nTask 3: Google Search: Success\nPipeline complete.',
          created_at: new Date(Date.now() - 24 * 3600000).toISOString()
        }
      ]);
    }
  };

  const loadLocalMockData = () => {
    const mockLeads = [
      {
        id: 'mock-lead-1',
        business_name: 'Apex Legal Consultants',
        industry: 'Legal',
        location: 'Nairobi',
        website_url: 'apexlegal.co.ke',
        email: 'info@apexlegal.co.ke',
        phone: '+254711223344',
        lead_score: 85,
        digital_audit: { no_website: false, no_booking: true, outdated_tech: true, pagespeed_score: 42 },
        status: 'New',
        created_at: new Date().toISOString()
      },
      {
        id: 'mock-lead-2',
        business_name: 'Urban Cafe',
        industry: 'Restaurant',
        location: 'Nairobi',
        website_url: '',
        email: 'contact@urbancafe.com',
        phone: '+254722334455',
        lead_score: 95,
        digital_audit: { no_website: true, no_booking: true, outdated_tech: false, pagespeed_score: 0 },
        status: 'Contacted',
        created_at: new Date().toISOString()
      }
    ];
    const mockJobs = [
      {
        id: 'mock-job-1',
        company_name: 'Sassify Solutions',
        position: 'Remote React Developer',
        salary: '$90,000 - $110,000',
        location: 'Remote (Global)',
        application_url: 'https://remotive.com/jobs/sassify-react',
        job_description: 'We are seeking a React Developer experienced in custom component building and CSS optimization...',
        relevance_score: 92,
        status: 'Discovered',
        cover_letter_text: ''
      },
      {
        id: 'mock-job-2',
        company_name: 'Apex Automations',
        position: 'Python & Node.js Engineer',
        salary: '$120,000 - $150,000',
        location: 'Remote (US/Canada)',
        application_url: 'https://remotive.com/jobs/apex-python',
        job_description: 'Looking for a senior engineer with background in API connections, scraping engines, and database systems...',
        relevance_score: 88,
        status: 'Applied',
        cover_letter_text: 'Dear Hiring Manager, I am a B.Sc Software Engineering graduate with strong background in scripting...'
      }
    ];
    const mockScholarships = [
      {
        id: 'mock-scholarship-1',
        program_name: 'Erasmus Mundus Joint Master in Software Engineering (EMSE)',
        institution: 'Consortium of European Universities',
        location: 'Europe (Multiple)',
        funding_type: 'Fully Funded',
        deadline: '2027-01-15',
        application_url: 'https://emse-erasmusmundus.eu',
        description: 'Joint Master Degree in Software Engineering focusing on software architectures, systems design, and cloud architectures...',
        relevance_score: 95,
        status: 'Discovered',
        sop_text: ''
      },
      {
        id: 'mock-scholarship-2',
        program_name: 'CS Advisor Position (Direct Research Lab Funding)',
        institution: 'University of British Columbia (UBC)',
        location: 'Canada',
        funding_type: 'RA/TA Advisor position',
        deadline: '2026-12-01',
        application_url: 'https://cs.ubc.ca/people/faculty-advisor-pitch',
        description: 'Research Lab Assistantship opening in Distributed Systems & Green Computing under Dr. Sarah Jenkins. Seeking students with systems engineering background...',
        relevance_score: 98,
        status: 'Discovered',
        sop_text: ''
      }
    ];
    
    setLeads(mockLeads);
    setJobs(mockJobs);
    setScholarships(mockScholarships);
    
    const countsLeads = { New: 1, Contacted: 1, Replied: 0, 'Meeting Scheduled': 0, 'Proposal Sent': 0, Won: 0, Lost: 0 };
    const countsJobs = { Discovered: 1, Applied: 1, Interview: 0, Rejected: 0, Offer: 0 };
    const countsSch = { Discovered: 2, 'SOP Drafted': 0, Applied: 0, Interview: 0, Accepted: 0, Rejected: 0 };
    setMetrics({
      leads: countsLeads,
      jobs: countsJobs,
      outreach: { Email: 1, LinkedIn: 0, WhatsApp: 0, 'Contact Form': 0 },
      scholarships: countsSch
    });
  };

  useEffect(() => {
    if (currentPage === 'crm' && isAdminAuthenticated) {
      fetchCrmData();
      fetchCronRuns();
      fetchNiches();
    }
  }, [currentPage, isAdminAuthenticated]);

  useEffect(() => {
    if (selectedNiche) {
      fetchTopicsForNiche(selectedNiche.id);
    }
  }, [selectedNiche]);

  const handleNavClick = (page) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/website/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setFormSubmitted(true);
      } else {
        setFormSubmitted(true);
      }
    } catch (err) {
      console.warn('⚠️ Network failed, simulating contact form submission.');
      setFormSubmitted(true);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      company: '',
      service: 'ecommerce',
      message: ''
    });
    setFormSubmitted(false);
  };

  // CRM Actions
  const updateLeadStatus = async (leadId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/crm/leads/${leadId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchCrmData();
      }
    } catch (err) {
      setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    }
  };

  const updateJobStatus = async (jobId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/crm/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchCrmData();
      }
    } catch (err) {
      setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
    }
  };

  const updateScholarshipStatus = async (schId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/crm/scholarships/${schId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchCrmData();
      }
    } catch (err) {
      setScholarships(scholarships.map(s => s.id === schId ? { ...s, status: newStatus } : s));
    }
  };

  const handleGenerateOutreachDraft = async (lead) => {
    setDraftLoading(true);
    setSelectedLead(lead);
    setOutreachDraft('');
    try {
      const response = await fetch(`${API_URL}/crm/leads/${lead.id}/outreach-draft`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        setOutreachDraft(data.draft);
        setLoggedOutreachMessage(data.draft);
      }
    } catch (err) {
      setOutreachDraft(`Subject: Digital Presence Optimization for ${lead.business_name}\n\nHello Team,\n\nI noticed your website lacks booking options and load speeds are low. We can build storefronts.\n- Dancun`);
      setLoggedOutreachMessage(`Subject: Digital Presence Optimization for ${lead.business_name}\n\nHello Team,\n\nI noticed your website lacks booking options and load speeds are low. We can build storefronts.\n- Dancun`);
    } finally {
      setDraftLoading(false);
    }
  };

  const handleLogOutreach = async () => {
    if (!selectedLead) return;
    try {
      await fetch(`${API_URL}/crm/leads/${selectedLead.id}/outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: loggedOutreachChannel,
          message_content: loggedOutreachMessage
        })
      });
      updateLeadStatus(selectedLead.id, 'Contacted');
      alert(`Success: Outreach logged & lead status updated to Contacted.`);
      setSelectedLead(null);
      fetchCrmData();
    } catch (err) {
      setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, status: 'Contacted' } : l));
      setSelectedLead(null);
      alert(`Success (Offline Mode): Logged outreach.`);
    }
  };

  const handleTailorJob = async (job) => {
    setTailorLoading(true);
    setSelectedJob(job);
    try {
      const response = await fetch(`${API_URL}/crm/jobs/${job.id}/generate`, {
        method: 'POST'
      });
      if (response.ok) {
        const tailoredJob = await response.json();
        setSelectedJob(tailoredJob);
        fetchCrmData();
      }
    } catch (err) {
      setSelectedJob({
        ...job,
        cover_letter_text: `Dear Hiring Team at ${job.company_name},\n\nI am writing to express my interest in the ${job.position} position. As a software engineering graduate with experience matching your stack, I can add immediate value.\nPlease view my projects at dancunsoftwares.online.\n\nBest,\nDancun`
      });
    } finally {
      setTailorLoading(false);
    }
  };

  const handleTailorScholarship = async (sch) => {
    setSopLoading(true);
    setSelectedScholarship(sch);
    try {
      const response = await fetch(`${API_URL}/crm/scholarships/${sch.id}/generate`, {
        method: 'POST'
      });
      if (response.ok) {
        const tailoredSch = await response.json();
        setSelectedScholarship(tailoredSch);
        fetchCrmData();
      }
    } catch (err) {
      const isAdvisor = sch.funding_type && sch.funding_type.toLowerCase().includes('advisor');
      setSelectedScholarship({
        ...sch,
        sop_text: isAdvisor 
          ? `Subject: Prospective MSc Student Inquiry - CS Systems Lab\n\nDear Professor,\n\nI am a software engineering graduate with hands-on systems architect experience at TerraQuant and SME automation projects at Have Your Business Online. I would love to join your research group...\n\nBest,\nDancun Kipkorir`
          : `STATEMENT OF PURPOSE\n\nI am applying for the ${sch.program_name} at ${sch.institution}. My SWE background at Kisii, TerraQuant architectures, and SME business automations prepare me...`
      });
    } finally {
      setSopLoading(false);
    }
  };

  const handleTriggerScraper = async () => {
    setScrapingJobs(true);
    try {
      const res = await fetch(`${API_URL}/automation/scrape-jobs`, { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        alert(`Success: Job Scraper completed! Ingested remote jobs.`);
        fetchCrmData();
        fetchCronRuns();
      }
    } catch (err) {
      alert('Error: Scraper API unavailable. (Running in offline mode)');
    } finally {
      setScrapingJobs(false);
    }
  };

  const handleTriggerCrawl = async () => {
    setCrawlingLeads(true);
    const finalCities = [...scraperCities];
    if (customCityInput.trim() !== '') {
      customCityInput.split(',').forEach(c => {
        if (c.trim()) finalCities.push(c.trim());
      });
    }
    const finalNiche = customNicheInput.trim() !== '' ? customNicheInput : scraperNiche;

    try {
      const res = await fetch(`${API_URL}/automation/crawl-leads`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: finalNiche,
          country: scraperCountry,
          city: finalCities.join(', ')
        })
      });
      if (res.ok) {
        alert(`Success: Lead Scraper crawl completed!`);
        fetchCrmData();
        fetchCronRuns();
      }
    } catch (err) {
      alert('Error: Crawl API unavailable. (Running in offline mode)');
    } finally {
      setCrawlingLeads(false);
    }
  };

  const handleTriggerScholarshipScraper = async () => {
    setScrapingScholarships(true);
    try {
      const res = await fetch(`${API_URL}/automation/scrape-scholarships`, { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        alert(`Success: Scholarship Scraper completed! Ingested new funding programs.`);
        fetchCrmData();
        fetchCronRuns();
      }
    } catch (err) {
      alert('Error: Scraper API unavailable. (Running in offline mode)');
    } finally {
      setScrapingScholarships(false);
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!confirm('Are you sure you want to delete this client lead?')) return;
    try {
      const res = await fetch(`${API_URL}/crm/leads/${leadId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCrmData();
      }
    } catch (e) {
      setLeads(leads.filter(l => l.id !== leadId));
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this remote job?')) return;
    try {
      const res = await fetch(`${API_URL}/crm/jobs/${jobId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCrmData();
      }
    } catch (e) {
      setJobs(jobs.filter(j => j.id !== jobId));
    }
  };

  const handleDeleteScholarship = async (schId) => {
    if (!confirm('Are you sure you want to delete this graduate funding scholarship?')) return;
    try {
      const res = await fetch(`${API_URL}/crm/scholarships/${schId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCrmData();
      }
    } catch (e) {
      setScholarships(scholarships.filter(s => s.id !== schId));
    }
  };

  const handleStopJob = async (type) => {
    try {
      const res = await fetch(`${API_URL}/automation/stop/${type}`, { method: 'POST' });
      if (res.ok) {
        if (type === 'job_scraper') setScrapingJobs(false);
        if (type === 'client_outreach') setCrawlingLeads(false);
        if (type === 'scholarship_scraper') setScrapingScholarships(false);
        alert(`Stop signal sent to ${type}. The pipeline will abort shortly.`);
        fetchCrmData();
        fetchCronRuns();
      }
    } catch (e) {
      console.error('Failed to send stop signal:', e.message);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/crm/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeadData)
      });
      if (res.ok) {
        setShowAddLead(false);
        setNewLeadData({ business_name: '', industry: '', location: '', website_url: '', email: '', phone: '' });
        fetchCrmData();
      }
    } catch (err) {
      const offlineLead = {
        id: `lead-off-${Date.now()}`,
        ...newLeadData,
        lead_score: 50,
        digital_audit: { no_website: !newLeadData.website_url },
        status: 'New',
        created_at: new Date().toISOString()
      };
      setLeads([offlineLead, ...leads]);
      setShowAddLead(false);
      setNewLeadData({ business_name: '', industry: '', location: '', website_url: '', email: '', phone: '' });
    }
  };

  const handleImportLeadText = async (e) => {
    e.preventDefault();
    if (importLeadText.trim() === '') {
      alert('Please paste some text search results.');
      return;
    }
    setImportingLeads(true);
    const finalNiche = importLeadNiche.trim() !== '' ? importLeadNiche : scraperNiche;
    const finalCity = importLeadCity.trim() !== '' ? importLeadCity : 'Mombasa';
    try {
      const res = await fetch(`${API_URL}/crm/leads/import-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: importLeadText,
          niche: finalNiche,
          city: finalCity
        })
      });
      if (res.ok) {
        const result = await res.json();
        alert(`Success: Extracted and audited ${result.count} new leads!`);
        setShowImportLeadText(false);
        setImportLeadText('');
        fetchCrmData();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error}`);
      }
    } catch (err) {
      alert('Error parsing or auditing leads from pasted text. Please check server logs.');
    } finally {
      setImportingLeads(false);
    }
  };

  const handleImportLeadFile = async (file, nicheInput, cityInput) => {
    if (!file) {
      alert('Please select an HTML or MHT search file.');
      return;
    }
    setImportingFile(true);
    const finalNiche = nicheInput.trim() !== '' ? nicheInput : scraperNiche;
    const finalCity = cityInput.trim() !== '' ? cityInput : 'Mombasa';

    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileContent = e.target.result;
      try {
        const res = await fetch(`${API_URL}/crm/leads/import-file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileContent: fileContent,
            niche: finalNiche,
            city: finalCity
          })
        });
        if (res.ok) {
          const result = await res.json();
          alert(`Success: Extracted and audited ${result.count} new leads from search file!`);
          setShowImportFileModal(false);
          fetchCrmData();
        } else {
          const errData = await res.json();
          alert(`Error: ${errData.error}`);
        }
      } catch (err) {
        alert('Error parsing or auditing leads from the file content.');
      } finally {
        setImportingFile(false);
      }
    };
    reader.onerror = () => {
      alert('Failed to read search file.');
      setImportingFile(false);
    };
    reader.readAsText(file);
  };

  const handleImportJobFile = async (file) => {
    if (!file) {
      alert('Please select an HTML or MHT job search file.');
      return;
    }
    setImportingJobFile(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileContent = e.target.result;
      try {
        const res = await fetch(`${API_URL}/crm/jobs/import-file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileContent })
        });
        if (res.ok) {
          const result = await res.json();
          alert(`Success: Extracted and evaluated ${result.count} new remote jobs!`);
          setShowImportJobModal(false);
          fetchCrmData();
        } else {
          const errData = await res.json();
          alert(`Error: ${errData.error}`);
        }
      } catch (err) {
        alert('Error parsing or rating jobs from the file content.');
      } finally {
        setImportingJobFile(false);
      }
    };
    reader.onerror = () => {
      alert('Failed to read search file.');
      setImportingJobFile(false);
    };
    reader.readAsText(file);
  };

  const fetchNiches = async () => {
    try {
      const res = await fetch(`${API_URL}/tech/niches`);
      if (res.ok) {
        const data = await res.json();
        setTechNiches(data);
        if (data.length > 0 && !selectedNiche) {
          setSelectedNiche(data[0]);
        }
      }
    } catch (err) {
      console.warn('⚠️ Niches API unavailable.');
    }
  };

  const fetchTopicsForNiche = async (nicheId) => {
    if (!nicheId) return;
    try {
      const res = await fetch(`${API_URL}/tech/niches/${nicheId}/topics`);
      if (res.ok) {
        const data = await res.json();
        setTechTopics(data);
      }
    } catch (err) {
      console.warn('⚠️ Topics API unavailable.');
    }
  };

  const handleCreateNiche = async (e) => {
    e.preventDefault();
    if (newNicheName.trim() === '') {
      alert('Please specify a niche name.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/tech/niches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newNicheName, description: newNicheDesc })
      });
      if (res.ok) {
        const newNiche = await res.json();
        setTechNiches(prev => [...prev, newNiche]);
        setSelectedNiche(newNiche);
        setNewNicheName('');
        setNewNicheDesc('');
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error}`);
      }
    } catch (err) {
      alert('Error creating technical niche.');
    }
  };

  const handleDeleteNiche = async (nicheId) => {
    if (!window.confirm('Are you sure you want to delete this technical niche? All nested topics and subtopics will be permanently lost.')) {
      return;
    }
    try {
      const res = await fetch(`${API_URL}/tech/niches/${nicheId}`, { method: 'DELETE' });
      if (res.ok) {
        setTechNiches(prev => prev.filter(n => n.id !== nicheId));
        if (selectedNiche && selectedNiche.id === nicheId) {
          const fallback = techNiches.find(n => n.id !== nicheId) || null;
          setSelectedNiche(fallback);
        }
      }
    } catch (err) {
      alert('Error deleting technical niche.');
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!selectedNiche) {
      alert('Please select a niche first.');
      return;
    }
    if (newTopicName.trim() === '') {
      alert('Please specify a topic name.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/tech/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche_id: selectedNiche.id, name: newTopicName, notes: newTopicNotes })
      });
      if (res.ok) {
        const newTopic = await res.json();
        setTechTopics(prev => [...prev, newTopic]);
        setNewTopicName('');
        setNewTopicNotes('');
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error}`);
      }
    } catch (err) {
      alert('Error creating topic.');
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Delete this topic?')) return;
    try {
      const res = await fetch(`${API_URL}/tech/topics/${topicId}`, { method: 'DELETE' });
      if (res.ok) {
        setTechTopics(prev => prev.filter(t => t.id !== topicId));
      }
    } catch (err) {
      alert('Error deleting topic.');
    }
  };

  const handleUpdateTopicStatus = async (topicId, currentStatus) => {
    const statuses = ['Pending', 'In Progress', 'Mastered'];
    const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];
    
    const payload = { status: nextStatus };
    if (nextStatus === 'Mastered') {
      payload.last_revised = new Date().toISOString();
    }

    try {
      const res = await fetch(`${API_URL}/tech/topics/${topicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        setTechTopics(prev => prev.map(t => t.id === topicId ? { ...t, ...updated } : t));
      }
    } catch (err) {
      alert('Error updating topic status.');
    }
  };

  const handleSaveTopicNotes = async () => {
    if (!editingNotesTopic) return;
    try {
      const res = await fetch(`${API_URL}/tech/topics/${editingNotesTopic.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editingNotesText })
      });
      if (res.ok) {
        const updated = await res.json();
        setTechTopics(prev => prev.map(t => t.id === editingNotesTopic.id ? { ...t, ...updated } : t));
        setEditingNotesTopic(null);
        setEditingNotesText('');
      }
    } catch (err) {
      alert('Error saving topic notes.');
    }
  };

  const handleCreateSubtopic = async (e, topicId) => {
    e.preventDefault();
    if (newSubtopicName.trim() === '') return;
    try {
      const res = await fetch(`${API_URL}/tech/subtopics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_id: topicId, name: newSubtopicName })
      });
      if (res.ok) {
        const newSub = await res.json();
        setTechTopics(prev => prev.map(t => {
          if (t.id === topicId) {
            return { ...t, subtopics: [...(t.subtopics || []), newSub] };
          }
          return t;
        }));
        setNewSubtopicName('');
        setSelectedTopicForSubtopic(null);
      }
    } catch (err) {
      alert('Error adding subtopic.');
    }
  };

  const handleToggleSubtopic = async (subtopicId, currentStatus, topicId) => {
    const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    try {
      const res = await fetch(`${API_URL}/tech/subtopics/${subtopicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setTechTopics(prev => prev.map(t => {
          if (t.id === topicId) {
            return {
              ...t,
              subtopics: t.subtopics.map(s => s.id === subtopicId ? updated : s)
            };
          }
          return t;
        }));
      }
    } catch (err) {
      alert('Error toggling subtopic status.');
    }
  };

  const handleDeleteSubtopic = async (subtopicId, topicId) => {
    if (!window.confirm('Delete this subtopic?')) return;
    try {
      const res = await fetch(`${API_URL}/tech/subtopics/${subtopicId}`, { method: 'DELETE' });
      if (res.ok) {
        setTechTopics(prev => prev.map(t => {
          if (t.id === topicId) {
            return {
              ...t,
              subtopics: t.subtopics.filter(s => s.id !== subtopicId)
            };
          }
          return t;
        }));
      }
    } catch (err) {
      alert('Error deleting subtopic.');
    }
  };

  const handleAddTarget = async (e) => {
    e.preventDefault();
    if (newTargetCity.trim() === '') {
      alert('Please specify a target city.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/crm/targets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: newTargetCity.trim(),
          niche: newTargetNiche
        })
      });
      if (res.ok) {
        setNewTargetCity('');
        fetchCrmData();
      }
    } catch (err) {
      alert('Failed to add target.');
    }
  };

  const handleToggleTargetStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Pending' ? 'Done' : 'Pending';
    try {
      const res = await fetch(`${API_URL}/crm/targets/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchCrmData();
      }
    } catch (err) {
      alert('Failed to toggle target status.');
    }
  };

  const handleDeleteTarget = async (id) => {
    if (!window.confirm('Are you sure you want to delete this target?')) return;
    try {
      const res = await fetch(`${API_URL}/crm/targets/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchCrmData();
      }
    } catch (err) {
      alert('Failed to delete target.');
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'admin123') { // simple local password
      setIsAdminAuthenticated(true);
      localStorage.setItem('isAdmin', 'true');
      setAdminError('');
    } else {
      setAdminError('Invalid Password.');
    }
  };

  const handleClearDatabase = async () => {
    if (!window.confirm('⚠️ WARNING: Are you sure you want to clear the entire CRM database? This will permanently delete all leads, jobs, scholarships, outreach logs, and execution summaries.')) {
      return;
    }
    try {
      const res = await fetch(`${API_URL}/crm/clear-database`, {
        method: 'POST'
      });
      if (res.ok) {
        alert('Database cleared successfully.');
        setLeads([]);
        setJobs([]);
        setScholarships([]);
        setCronRuns([]);
        setMetrics({
          leads: { New: 0, Contacted: 0, Replied: 0, 'Meeting Scheduled': 0, 'Proposal Sent': 0, Won: 0, Lost: 0 },
          jobs: { Discovered: 0, Applied: 0, Interview: 0, Rejected: 0, Offer: 0 },
          outreach: { Email: 0, LinkedIn: 0, WhatsApp: 0, 'Contact Form': 0 },
          scholarships: { Discovered: 0, 'SOP Drafted': 0, Applied: 0, Interview: 0, Accepted: 0, Rejected: 0 }
        });
      } else {
        throw new Error('Server responded with an error');
      }
    } catch (err) {
      setLeads([]);
      setJobs([]);
      setScholarships([]);
      setCronRuns([]);
      setMetrics({
        leads: { New: 0, Contacted: 0, Replied: 0, 'Meeting Scheduled': 0, 'Proposal Sent': 0, Won: 0, Lost: 0 },
        jobs: { Discovered: 0, Applied: 0, Interview: 0, Rejected: 0, Offer: 0 },
        outreach: { Email: 0, LinkedIn: 0, WhatsApp: 0, 'Contact Form': 0 },
        scholarships: { Discovered: 0, 'SOP Drafted': 0, Applied: 0, Interview: 0, Accepted: 0, Rejected: 0 }
      });
      alert('Database cleared (Offline Mock Mode).');
    }
  };

  return (
    <div className="website-app">
      {/* Header Navigation */}
      <header className={isScrolled ? 'scrolled' : ''}>
        <div className="container flex-between" style={{ height: '70px' }}>
          <div className="flex-center" style={{ cursor: 'pointer' }} onClick={() => handleNavClick('home')}>
            <div className="logo-icon flex-center">
              <Globe size={16} color="#fff" />
            </div>
            <span className="footer-logo text-gradient" style={{ fontWeight: '800' }}>Have Your Business Online</span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="nav-links">
            <span className={`nav-link ${currentPage === 'home' ? 'active' : ''}`} onClick={() => handleNavClick('home')}>Home</span>
            <span className={`nav-link ${currentPage === 'services' ? 'active' : ''}`} onClick={() => handleNavClick('services')}>Services</span>
            <span className={`nav-link ${currentPage === 'case-studies' ? 'active' : ''}`} onClick={() => handleNavClick('case-studies')}>Case Studies</span>
            <span className={`nav-link ${currentPage === 'pricing' ? 'active' : ''}`} onClick={() => handleNavClick('pricing')}>Pricing</span>
            <span className={`nav-link ${currentPage === 'blog' ? 'active' : ''}`} onClick={() => handleNavClick('blog')}>Blog</span>
            <span className={`nav-link ${currentPage === 'contact' ? 'active' : ''}`} onClick={() => handleNavClick('contact')}>Contact</span>
            <span className={`nav-link ${currentPage === 'crm' ? 'active' : ''}`} style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '16px', color: 'var(--secondary)' }} onClick={() => handleNavClick('crm')}>CRM Panel</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span onClick={() => handleNavClick('contact')} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
              Consultation
            </span>
            {/* Mobile menu trigger */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              className="mobile-menu-btn"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '70px',
            left: 0,
            width: '100%',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
            gap: '16px',
            zIndex: 99
          }}>
            <span className={`nav-link ${currentPage === 'home' ? 'active' : ''}`} onClick={() => handleNavClick('home')}>Home</span>
            <span className={`nav-link ${currentPage === 'services' ? 'active' : ''}`} onClick={() => handleNavClick('services')}>Services</span>
            <span className={`nav-link ${currentPage === 'case-studies' ? 'active' : ''}`} onClick={() => handleNavClick('case-studies')}>Case Studies</span>
            <span className={`nav-link ${currentPage === 'pricing' ? 'active' : ''}`} onClick={() => handleNavClick('pricing')}>Pricing</span>
            <span className={`nav-link ${currentPage === 'blog' ? 'active' : ''}`} onClick={() => handleNavClick('blog')}>Blog</span>
            <span className={`nav-link ${currentPage === 'contact' ? 'active' : ''}`} onClick={() => handleNavClick('contact')}>Contact</span>
            <span className={`nav-link ${currentPage === 'crm' ? 'active' : ''}`} style={{ color: 'var(--secondary)' }} onClick={() => handleNavClick('crm')}>CRM Dashboard</span>
            <button onClick={() => handleNavClick('contact')} className="btn btn-primary" style={{ width: '100%' }}>
              Get a Free Audit
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main style={{ flexGrow: 1 }}>
        
        {/* PUBLIC HOMEPAGE */}
        {currentPage === 'home' && (
          <div className="animate-fade-in">
            <section className="section container hero-section">
              <span className="badge">Next-Gen Software Development</span>
              <h1 style={{ maxWidth: '900px', margin: '0 auto' }}>
                We Bring Your Business Online with Custom Software Systems & <span className="text-gradient">AI Automations</span>
              </h1>
              <p className="hero-subtitle">
                Helping businesses transition from manual workflows to scalable custom software. High-performance software engineering tailored for digital growth.
              </p>
              <div className="hero-buttons">
                <button onClick={() => handleNavClick('contact')} className="btn btn-primary">
                  Start Your Project <ArrowRight size={18} />
                </button>
                <button onClick={() => handleNavClick('services')} className="btn btn-secondary">
                  Explore Services
                </button>
              </div>
            </section>

            <section className="section" style={{ background: 'rgba(139, 92, 246, 0.03)', borderY: '1px solid var(--border-color)', padding: '60px 0' }}>
              <div className="container flex-between" style={{ flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
                <div style={{ maxWidth: '700px' }}>
                  <span className="badge badge-secondary">Complimentary Audit</span>
                  <h2 style={{ marginTop: '8px' }}>Is your digital presence holding you back?</h2>
                  <p>We will audit your existing website, check loading speeds, mobile-responsiveness, e-commerce workflow gaps, and send you a detailed action plan. Free of charge.</p>
                </div>
                <button onClick={() => handleNavClick('contact')} className="btn btn-primary" style={{ padding: '12px 24px' }}>
                  Request Free Audit
                </button>
              </div>
            </section>

            <section className="section container">
              <div className="section-header">
                <h2>Our Core Specialties</h2>
                <p className="section-subtitle">We design and construct premium applications with modern engineering stacks.</p>
              </div>
              <div className="grid-cols-3">
                <div className="glass-card">
                  <div className="feature-icon"><ShoppingBag size={24} /></div>
                  <h3>Enterprice Grade Business Systems</h3>
                  <p>We build stunning, highly optimized custom business systems ranging from E-commerce to Automated Softwares,aiming to maximize conversions and customer retention.</p>
                </div>
                <div className="glass-card">
                  <div className="feature-icon cyan"><Smartphone size={24} /></div>
                  <h3>Mobile Applications</h3>
                  <p>Tailored cross-platform iOS & Android mobile applications built using React Native for exceptional performance and UI fluidity.</p>
                </div>
                <div className="glass-card">
                  <div className="feature-icon pink"><Cpu size={24} /></div>
                  <h3>AI Agent Development</h3>
                  <p>Intelligent AI agent systems integrated with your operations to automate inquiries, support, lead qualification, and reporting.</p>
                </div>
              </div>
            </section>

            <section className="section container" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '60px' }}>
              <div className="section-header">
                <span className="badge badge-secondary">Ready Storefronts</span>
                <h2>Explore  <span className="text-gradient">Free templates</span></h2>
                <p className="section-subtitle">
                  Request our software templates regarding your business interests ! Whether you're in Real Estate, Health , Hotel & Restaurant or any other business industry, we got you covered ! Reach Out for free Templates!
                </p>
              </div>

              {/* Template Quick Jump Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
                {templatesData.map((tmpl, idx) => (
                  <button
                    key={tmpl.key}
                    onClick={() => setCarouselIndex(idx)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: `1px solid ${carouselIndex === idx ? 'var(--primary)' : 'var(--border-color)'}`,
                      background: carouselIndex === idx ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                      color: carouselIndex === idx ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      transition: 'all 0.2s ease',
                      boxShadow: carouselIndex === idx ? '0 0 12px rgba(139, 92, 246, 0.2)' : 'none'
                    }}
                  >
                    {tmpl.title}
                  </button>
                ))}
              </div>

              {/* Pricing Tier Selector */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px', border: '1px solid var(--border-color)', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['monthly', 'six_months', 'yearly', 'onetime'].map(tier => (
                    <button
                      key={tier}
                      onClick={() => setSelectedPricingTier(tier)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        background: selectedPricingTier === tier ? 'var(--primary)' : 'transparent',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {tier === 'onetime' ? 'One-time Payment' : tier === 'six_months' ? '6-Month Plan' : `${tier.replace('_', ' ')} billing`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider View */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', position: 'relative' }}>
                <div 
                  className="glass-card animate-fade-in" 
                  style={{ 
                    width: '100%',
                    maxWidth: '800px',
                    display: 'flex', 
                    flexDirection: 'column', 
                    textAlign: 'left', 
                    border: `1px solid ${templatesData[carouselIndex].color.replace('0.15', '0.3')}`,
                    padding: '32px',
                    minHeight: '340px',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setIsCarouselPaused(true)}
                  onMouseLeave={() => setIsCarouselPaused(false)}
                  onTouchStart={() => setIsCarouselPaused(true)}
                  onTouchEnd={() => setIsCarouselPaused(false)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                    <div>
                      <span className="badge" style={{ margin: '0 0 10px 0', background: templatesData[carouselIndex].color, color: templatesData[carouselIndex].badgeColor }}>
                        {templatesData[carouselIndex].duration}
                      </span>
                      <h3 style={{ margin: 0, fontSize: '1.6rem' }}>{templatesData[carouselIndex].title}</h3>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: '500' }}>
                          Was {renderOriginalPrice(templatesData[carouselIndex].key, selectedPricingTier)}
                        </span>
                        <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--secondary)' }}>
                          Now {renderPrice(templatesData[carouselIndex].key, selectedPricingTier)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {selectedPricingTier === 'monthly' ? 'per month' : selectedPricingTier === 'six_months' ? 'for 6 months' : selectedPricingTier === 'yearly' ? 'billed annually' : 'one-time purchase'}
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
                    {templatesData[carouselIndex].description}
                  </p>

                  <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <strong style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>💡 Key Business Capabilities:</strong>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {templatesData[carouselIndex].features.map(f => (
                        <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          <CheckCircle2 size={14} color="var(--secondary)" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                    <button onClick={() => handleNavClick('contact')} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                      Free Template <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* SERVICES PAGE */}
        {currentPage === 'services' && (
          <div className="container animate-fade-in" style={{ padding: '80px 24px' }}>
            <div className="section-header">
              <span className="badge">Services Directory</span>
              <h1>High-Impact Technology Services</h1>
              <p className="section-subtitle">We design, implement, and maintain custom applications that drive growth and reduce manual bottlenecks.</p>
            </div>
            <div className="grid-cols-2" style={{ gap: '32px' }}>
              <div className="glass-card">
                <div className="feature-icon"><Zap size={24} /></div>
                <h3>Custom Business Software</h3>
                <p>We build tailored web applications, secure portals, and clinic or booking platforms that digitize offline tasks and automate scheduling.</p>
              </div>
              <div className="glass-card">
                <div className="feature-icon cyan"><Globe size={24} /></div>
                <h3>Business Marketing Sites</h3>
                <p>Captures client details, schedules consultation bookings, and boosts SEO presence automatically to expand local market authority.</p>
              </div>
              <div className="glass-card">
                <div className="feature-icon pink"><Smartphone size={24} /></div>
                <h3>Mobile Application Development</h3>
                <p>Bespoke React Native cross-platform applications published on iOS & Google App Stores with offline sync capabilities.</p>
              </div>
              <div className="glass-card">
                <div className="feature-icon"><TrendingUp size={24} /></div>
                <h3>Business Automation Systems</h3>
                <p>Scrapers, background worker scripts, and custom API connections designed to sync your CRM databases and spreadsheets.</p>
              </div>
            </div>
          </div>
        )}

        {/* CASE STUDIES PAGE */}
        {currentPage === 'case-studies' && (
          <div className="container animate-fade-in" style={{ padding: '80px 24px' }}>
            <div className="section-header">
              <span className="badge">Our Success Stories</span>
              <h1>Proven Engineering Case Studies</h1>
              <p className="section-subtitle">A look into how we help companies digitize, automate, and expand their online scope.</p>
            </div>
            <div className="case-study-grid">
              <div className="glass-card case-study-card">
                <div className="case-study-image text-gradient" style={{ fontWeight: '800', fontSize: '1.8rem' }}>Business Portal</div>
                <h3>Scaling Business Operations</h3>
                <p>Modernized slow legacy operational software into a unified custom cloud platform. Load times reduced by 75% and automated manual rosters.</p>
              </div>
            </div>
          </div>
        )}

        {/* PRICING PAGE */}
        {currentPage === 'pricing' && (
          <div className="container animate-fade-in" style={{ padding: '80px 24px' }}>
            <div className="section-header">
              <span className="badge">Flexible Pricing</span>
              <h1>Tailored Implementation Tiers</h1>
              <p className="section-subtitle">No hidden fees. We host on free-tier friendly serverless environments.</p>
            </div>
            <div className="grid-cols-3">
              <div className="glass-card pricing-card" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span className="badge badge-secondary" style={{ alignSelf: 'flex-start', marginBottom: '12px' }}>SME Starter</span>
                <h3>Business Website</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>Custom landing page or marketing site to establish local brand authority.</p>
                
                <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>Was $2,499 setup / $149 mo</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', marginTop: '4px' }}>
                    $1,499 <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>one-time setup</span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--secondary)', marginTop: '4px' }}>
                    or $99 <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>/ month sub</span>
                  </div>
                </div>

                <ul className="pricing-features" style={{ flexGrow: 1, listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><CheckCircle2 size={16} color="var(--secondary)" /> Custom React Landing Page</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><CheckCircle2 size={16} color="var(--secondary)" /> Booking Form Integration</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><CheckCircle2 size={16} color="var(--secondary)" /> SEO & Managed Free Hosting</li>
                </ul>
                <button onClick={() => handleNavClick('contact')} className="btn btn-secondary" style={{ width: '100%' }}>Get Started</button>
              </div>

              <div className="glass-card pricing-card popular" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', border: '2px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="badge" style={{ margin: 0, background: 'rgba(139, 92, 246, 0.2)', color: 'var(--primary)' }}>Most Popular</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700' }}>RECOMMENDED</span>
                </div>
                <h3>Growth E-Commerce</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>Complete custom shopping storefronts built to scale retail revenue.</p>
                
                <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>Was $4,999 setup / $299 mo</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', marginTop: '4px' }}>
                    $3,499 <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>one-time setup</span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary)', marginTop: '4px' }}>
                    or $199 <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>/ month sub</span>
                  </div>
                </div>

                <ul className="pricing-features" style={{ flexGrow: 1, listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><CheckCircle2 size={16} color="var(--primary)" /> Custom SupaCart Storefront</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><CheckCircle2 size={16} color="var(--primary)" /> Stripe / PayPal / M-Pesa</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><CheckCircle2 size={16} color="var(--primary)" /> Configurable Admin Dashboard</li>
                </ul>
                <button onClick={() => handleNavClick('contact')} className="btn btn-primary" style={{ width: '100%' }}>Launch Shop</button>
              </div>

              <div className="glass-card pricing-card" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span className="badge badge-secondary" style={{ alignSelf: 'flex-start', marginBottom: '12px' }}>Enterprise Suite</span>
                <h3>Enterprise POS & Systems</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>Full Point of Sale systems and automated mobile/web applications.</p>
                
                <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>Was $8,499 setup / $499 mo</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', marginTop: '4px' }}>
                    $5,999 <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>one-time setup</span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--secondary)', marginTop: '4px' }}>
                    or $349 <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>/ month sub</span>
                  </div>
                </div>

                <ul className="pricing-features" style={{ flexGrow: 1, listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><CheckCircle2 size={16} color="var(--secondary)" /> Custom Cloud/Offline POS System</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><CheckCircle2 size={16} color="var(--secondary)" /> React Native Mobile App</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><CheckCircle2 size={16} color="var(--secondary)" /> Custom Workflow AI Automation</li>
                </ul>
                <button onClick={() => handleNavClick('contact')} className="btn btn-secondary" style={{ width: '100%' }}>Book Call</button>
              </div>
            </div>
          </div>
        )}

        {/* BLOG PAGE */}
        {currentPage === 'blog' && (
          <div className="container animate-fade-in" style={{ padding: '80px 24px' }}>
            <div className="section-header">
              <span className="badge">Insights</span>
              <h1>Engineering & Automation Blog</h1>
              <p className="section-subtitle">Case studies, tech decisions, and guides to automating your company operations.</p>
            </div>
            <div className="grid-cols-3">
              <div className="glass-card blog-card">
                <div className="blog-date">June 20, 2026 • 5 min read</div>
                <h3>The Cost of Slow Load Times</h3>
                <p>Why a 1-second delay in page load is bleeding sales, and why Custom React storefronts outperform generic builders.</p>
              </div>
              <div className="glass-card blog-card">
                <div className="blog-date">June 14, 2026 • 7 min read</div>
                <h3>AI Agents in Local Business</h3>
                <p>Deploying cheap AI agents to crawl local directories, audit websites, score leads, and save sales hours.</p>
              </div>
              <div className="glass-card blog-card">
                <div className="blog-date">May 28, 2026 • 6 min read</div>
                <h3>Choosing a Mobile Strategy</h3>
                <p>React Native vs Progressive Web Apps. Discover when native mobile features warrant React Native development.</p>
              </div>
            </div>
          </div>
        )}

        {/* CONTACT PAGE */}
        {currentPage === 'contact' && (
          <div className="container animate-fade-in" style={{ padding: '80px 24px' }}>
            <div className="section-header">
              <h1>Build Your Digital Pipeline</h1>
              <p className="section-subtitle">Reach out to request a project audit, get a tailored quote, or book a consultation call.</p>
            </div>
            <div className="contact-container">
              <div className="contact-info">
                <h2>Get in touch directly</h2>
                <div className="contact-method" style={{ marginTop: '24px' }}>
                  <div className="contact-method-icon"><Mail size={18} /></div>
                  <div>
                    <h4>Email</h4>
                    <p>info.haveyourbusinessonline@gmail.com</p>
                  </div>
                </div>
                <div className="contact-method">
                  <div className="contact-method-icon"><Phone size={18} /></div>
                  <div>
                    <h4>WhatsApp Business</h4>
                    <p><a href="https://wa.me/13022039218" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>+1 (302) 203-9218</a></p>
                  </div>
                </div>
                <div className="contact-method">
                  <div className="contact-method-icon"><Globe size={18} /></div>
                  <div>
                    <h4>Website</h4>
                    <p>www.haveyourbusiness.online</p>
                  </div>
                </div>
              </div>
              <div className="glass-card">
                {formSubmitted ? (
                  <div style={{ textAlign: 'center' }}>
                    <CheckCircle2 size={36} color="var(--secondary)" style={{ margin: '0 auto 16px auto' }} />
                    <h3>Audit Request Logged!</h3>
                    <p>We will generate a digital presence audit for you within 24 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input type="text" required className="form-input" value={formData.name} onChange={(e)=>setFormData({...formData, name:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input type="email" required className="form-input" value={formData.email} onChange={(e)=>setFormData({...formData, email:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Requested Service</label>
                      <select className="form-input" value={formData.service} onChange={(e)=>setFormData({...formData, service:e.target.value})} style={{ background: '#0f111a', color: '#fff' }}>
                        <option value="ecommerce">E-Commerce Development</option>
                        <option value="ecommerce">Custom and Personal Business Website</option>
                        <option value="automation">Appointment Booking System </option>
                        <option value="ai">Clinic Management System</option>
                        <option value="ecommerce">Real Estate & Rental System</option>
                        <option value="automation">Restaurant & Hotel System</option>
                        
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Extra Explanation / Requirements (Optional)</label>
                      <textarea 
                        className="form-input" 
                        value={formData.message} 
                        onChange={(e)=>setFormData({...formData, message:e.target.value})} 
                        style={{ background: '#0f111a', color: '#fff', height: '100px', resize: 'vertical' }}
                        placeholder="Tell us more about your business needs or the features you want..."
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Submit Request</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CRM PANEL SECURED SECTION */}
        {currentPage === 'crm' && !isAdminAuthenticated && (
          <div className="container animate-fade-in" style={{ padding: '80px 24px' }}>
            <div className="glass-card" style={{ maxWidth: '420px', margin: '0 auto' }}>
              <h3 style={{ marginBottom: '16px' }}>CRM Portal Authentication</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Secure access for Have Your Business Online architects. Use the developer password to authenticate.
              </p>
              <form onSubmit={handleAdminLogin}>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label">Password</label>
                  <input 
                    type="password" 
                    required 
                    className="form-input" 
                    value={adminPassword} 
                    onChange={(e) => setAdminPassword(e.target.value)} 
                    placeholder="Enter password..."
                    style={{ background: '#0f111a', color: '#fff' }}
                  />
                </div>
                {adminError && <p style={{ color: 'var(--accent)', fontSize: '0.85rem', margin: '-10px 0 16px 0', textAlign: 'left' }}>{adminError}</p>}
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Authenticate</button>
              </form>
            </div>
          </div>
        )}

        {currentPage === 'crm' && isAdminAuthenticated && (
          <div className="container animate-fade-in" style={{ padding: '40px 24px' }}>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '30px' }}>
              <div>
                <span className="badge badge-secondary" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <Sparkles size={12} /> Acquisition Command Hub
                </span>
                <h1 style={{ fontSize: '2.2rem' }}>Acquisition CRM Dashboard</h1>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button 
                    onClick={handleTriggerScraper} 
                    disabled={scrapingJobs} 
                    className="btn btn-secondary" 
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    <RefreshCw size={14} className={scrapingJobs ? 'animate-spin' : ''} /> {scrapingJobs ? 'Scraping Jobs...' : 'Scrape Jobs'}
                  </button>
                  {scrapingJobs && (
                    <button 
                      onClick={() => handleStopJob('job_scraper')} 
                      className="btn btn-secondary" 
                      style={{ padding: '8px 12px', fontSize: '0.85rem', color: 'var(--accent)', border: '1px solid var(--accent)' }}
                    >
                      Stop
                    </button>
                  )}
                </div>


                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button 
                    onClick={handleTriggerScholarshipScraper} 
                    disabled={scrapingScholarships} 
                    className="btn btn-secondary" 
                    style={{ padding: '8px 16px', fontSize: '0.85rem', border: '1px solid var(--secondary)' }}
                  >
                    <RefreshCw size={14} className={scrapingScholarships ? 'animate-spin' : ''} /> {scrapingScholarships ? 'Scanning Funding...' : 'Scrape Scholarships'}
                  </button>
                  {scrapingScholarships && (
                    <button 
                      onClick={() => handleStopJob('scholarship_scraper')} 
                      className="btn btn-secondary" 
                      style={{ padding: '8px 12px', fontSize: '0.85rem', color: 'var(--accent)', border: '1px solid var(--accent)' }}
                    >
                      Stop
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dashboard Sub Navigation Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
              <button 
                onClick={() => setCrmTab('leads')} 
                className={`btn ${crmTab === 'leads' ? 'btn-primary' : 'btn-secondary'}`} 
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                <Users size={16} /> Client Leads ({leads.length})
              </button>
              <button 
                onClick={() => setCrmTab('jobs')} 
                className={`btn ${crmTab === 'jobs' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                <Briefcase size={16} /> Remote Jobs ({jobs.length})
              </button>
              <button 
                onClick={() => setCrmTab('scholarships')} 
                className={`btn ${crmTab === 'scholarships' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                <Sparkles size={16} /> Scholarships ({scholarships.length})
              </button>
              <button 
                onClick={() => setCrmTab('tech')} 
                className={`btn ${crmTab === 'tech' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                <Terminal size={16} /> Technical Arsenal
              </button>
              <button 
                onClick={() => setCrmTab('analytics')} 
                className={`btn ${crmTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                <TrendingUp size={16} /> Metrics & Reports
              </button>
              <button 
                onClick={() => setCrmTab('logs')} 
                className={`btn ${crmTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                <Clock size={16} /> Automation Logs ({cronRuns.length})
              </button>
              <button 
                onClick={() => setCrmTab('settings')} 
                className={`btn ${crmTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                <Cpu size={16} /> Pricing Configs
              </button>
              <button 
                onClick={handleClearDatabase} 
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.9rem', marginLeft: 'auto', border: '1px solid var(--accent)', color: 'var(--accent)', marginRight: '8px' }}
              >
                Clear CRM Data
              </button>
              <button 
                onClick={() => {
                  setIsAdminAuthenticated(false);
                  localStorage.removeItem('isAdmin');
                  setAdminPassword('');
                }} 
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.9rem', border: '1px solid var(--border-color)' }}
              >
                Log Out Admin
              </button>
            </div>

            {/* CRM LEADS PANEL */}
            {crmTab === 'leads' && (
              <div>
                <div className="flex-between" style={{ marginBottom: '16px' }}>
                  <h3>Identified Business Leads</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setShowImportFileModal(true); setImportFileNiche(scraperNiche); setImportFileCity(scraperCities[0] || 'Mombasa'); }} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', border: '1px solid var(--secondary)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <FileSpreadsheet size={14} color="var(--primary)" /> Import HTML/MHT Search File
                    </button>
                    <button onClick={() => setShowAddLead(true)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <Plus size={14} /> Add Lead Manually
                    </button>
                  </div>
                </div>

                {showImportFileModal && (
                  <div className="glass-card animate-fade-in" style={{ marginBottom: '24px', padding: '24px', border: '1px solid var(--primary)', textAlign: 'left' }}>
                    <h4 style={{ color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileSpreadsheet size={18} /> Google Search HTML/MHT File Importer
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                      Search Google or Google Maps, click <strong>"More businesses"</strong> to load listings, then save the webpage (as <strong>"Webpage, Single File (*.mht)"</strong> or standard <strong>*.html</strong>). Upload that file below and the AI will extract all phone numbers (from Call buttons), websites (from Globe icons), addresses, and execute dynamic audits!
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="grid-cols-2" style={{ gap: '16px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Niche Category</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. Clinics" 
                            value={importFileNiche} 
                            onChange={(e) => setImportFileNiche(e.target.value)} 
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">City Location</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. Mombasa" 
                            value={importFileCity} 
                            onChange={(e) => setImportFileCity(e.target.value)} 
                          />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Upload Saved Webpage File (.html / .mht)</label>
                        <input 
                          type="file" 
                          accept=".html,.htm,.mht"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              handleImportLeadFile(file, importFileNiche, importFileCity);
                            }
                          }}
                          style={{ color: '#fff', padding: '10px 0' }}
                          disabled={importingFile}
                        />
                      </div>

                      {importingFile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem' }}>
                          <RefreshCw size={16} className="animate-spin" /> Decoding search file, parsing local listings & performing audits... Please wait!
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={() => setShowImportFileModal(false)} className="btn btn-secondary" style={{ padding: '10px 20px' }}>Cancel</button>
                      </div>
                    </div>
                  </div>
                )}

                {showAddLead && (
                  <div className="glass-card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--secondary)' }}>
                    <form onSubmit={handleCreateLead} className="grid-cols-3" style={{ gap: '16px', textAlign: 'left' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Business Name</label>
                        <input type="text" required className="form-input" placeholder="e.g. Urban Cafe" value={newLeadData.business_name} onChange={(e)=>setNewLeadData({...newLeadData, business_name: e.target.value})} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Industry</label>
                        <input type="text" className="form-input" placeholder="e.g. Food / Retail" value={newLeadData.industry} onChange={(e)=>setNewLeadData({...newLeadData, industry: e.target.value})} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Website URL</label>
                        <input type="text" className="form-input" placeholder="e.g. urbancafe.com" value={newLeadData.website_url} onChange={(e)=>setNewLeadData({...newLeadData, website_url: e.target.value})} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Email</label>
                        <input type="email" className="form-input" value={newLeadData.email} onChange={(e)=>setNewLeadData({...newLeadData, email: e.target.value})} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Phone</label>
                        <input type="text" className="form-input" value={newLeadData.phone} onChange={(e)=>setNewLeadData({...newLeadData, phone: e.target.value})} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                        <button type="submit" className="btn btn-primary" style={{ flexGrow: 1, padding: '12px' }}>Save Lead</button>
                        <button type="button" onClick={() => setShowAddLead(false)} className="btn btn-secondary" style={{ padding: '12px' }}>Cancel</button>
                      </div>
                    </form>
                  </div>
                )}
                  {/* Acquisition Target Tracker Board */}
                <div className="glass-card" style={{ marginBottom: '24px', padding: '24px', textAlign: 'left', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={18} /> Acquisition Target Tracker Board
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                    Track your upcoming agency target cities and niche campaigns. Click on a target niche or city to automatically pre-fill your HTML/MHT search and paste importers!
                  </p>
                  
                  {/* Add New Target Form */}
                  <form onSubmit={handleAddTarget} className="grid-cols-3" style={{ gap: '16px', marginBottom: '20px', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Target Town / City</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        required
                        placeholder="e.g. Mombasa, Nairobi, Dubai" 
                        value={newTargetCity} 
                        onChange={(e) => setNewTargetCity(e.target.value)} 
                        style={{ background: '#12131a', border: '1px solid var(--border-color)', color: '#fff', width: '100%', padding: '10px', borderRadius: '6px' }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Business Niche System</label>
                      <select 
                        className="form-input" 
                        value={newTargetNiche} 
                        onChange={(e) => setNewTargetNiche(e.target.value)}
                        style={{ background: '#12131a', border: '1px solid var(--border-color)', color: '#fff', width: '100%', padding: '10px', borderRadius: '6px' }}
                      >
                        <option value="Business website Templates">💼 Business website Templates</option>
                        <option value="E-commerce Platforms">🛒 E-commerce Platforms</option>
                        <option value="Restaurant Platforms">🍔 Restaurant Platforms</option>
                        <option value="Booking Systems">📅 Booking Systems</option>
                        <option value="Clinic Management Systems">🦷 Clinic Management Systems</option>
                        <option value="Real Estate & Hotel Management Systems">🏢 Real Estate & Hotel Management Systems</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px 16px', fontSize: '0.85rem' }}>
                        + Add Target Target
                      </button>
                    </div>
                  </form>

                  {/* Targets List */}
                  <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#fff' }}>
                      <thead>
                        <tr style={{ background: '#0a0b10', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                          <th style={{ padding: '10px' }}>Target Town/City</th>
                          <th style={{ padding: '10px' }}>Business Niche System</th>
                          <th style={{ padding: '10px' }}>Campaign Status</th>
                          <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acquisitionTargets.length === 0 ? (
                          <tr>
                            <td colSpan="4" style={{ padding: '15px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                              No targets added. Use the form above to add your first target city!
                            </td>
                          </tr>
                        ) : (
                          acquisitionTargets.map(target => (
                            <tr 
                              key={target.id} 
                              style={{ 
                                borderBottom: '1px solid var(--border-color)', 
                                cursor: 'pointer', 
                                background: target.status === 'Done' ? 'rgba(16, 185, 129, 0.04)' : 'transparent' 
                              }}
                              onClick={() => {
                                // Auto fill selectors when clicked
                                setImportFileNiche(target.niche);
                                setImportFileCity(target.city);
                                setImportLeadNiche(target.niche);
                                setImportLeadCity(target.city);
                                // Open file uploader panel
                                setShowImportFileModal(true);
                              }}
                              title="Click to pre-fill importer settings"
                            >
                              <td style={{ padding: '10px', fontWeight: '600' }}>📍 {target.city}</td>
                              <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{target.niche}</td>
                              <td style={{ padding: '10px' }}>
                                <span 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleTargetStatus(target.id, target.status);
                                  }}
                                  style={{ 
                                    padding: '2px 8px', 
                                    borderRadius: '4px', 
                                    fontSize: '0.75rem', 
                                    fontWeight: 'bold',
                                    background: target.status === 'Done' ? 'var(--secondary)' : '#3b82f6',
                                    color: '#000',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {target.status}
                                </span>
                              </td>
                              <td style={{ padding: '10px', textAlign: 'right' }}>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTarget(target.id);
                                  }}
                                  className="btn btn-secondary" 
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', border: '1px solid var(--accent)', color: 'var(--accent)' }}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}><RefreshCw size={24} className="animate-spin" /> Fetching pipeline...</div>
                ) : (
                  <div>
                    {(() => {
                      const groupedLeads = groupItemsByDate(leads);
                      if (Object.keys(groupedLeads).length === 0) {
                        return <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>No leads acquired yet. Run the Organic Scan above to crawl targets.</div>;
                      }
                      return Object.keys(groupedLeads).map(dateGroup => (
                        <div key={dateGroup} style={{ marginBottom: '32px', textAlign: 'left' }}>
                          <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>
                            📅 Scanned on: {dateGroup}
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {groupedLeads[dateGroup].map(lead => (
                              <div key={lead.id} className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                                <div style={{ textAlign: 'left' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <h4 style={{ margin: 0 }}>{lead.business_name}</h4>
                                    <span className="badge badge-secondary" style={{ margin: 0, padding: '2px 8px', fontSize: '0.75rem' }}>{lead.industry}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {lead.location}</span>
                                  </div>
                                  <p style={{ fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                                    🌐 {lead.website_url ? <a href={`http://${lead.website_url}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary)' }}>{lead.website_url} <ExternalLink size={10} /></a> : <span style={{ color: 'var(--accent)' }}>No website found</span>}
                                    {lead.email && <span style={{ marginLeft: '16px' }}>✉️ {lead.email}</span>}
                                    {lead.social_media_url && <span style={{ marginLeft: '16px' }}>📱 <a href={lead.social_media_url.startsWith('http') ? lead.social_media_url : `https://${lead.social_media_url}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>Social Media <ExternalLink size={10} /></a></span>}
                                  </p>
                                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', fontSize: '0.8rem' }}>
                                    <span style={{ color: lead.digital_audit?.no_ssl ? 'var(--accent)' : 'var(--text-secondary)' }}>🔒 SSL: {lead.digital_audit?.no_ssl ? 'Missing' : 'Active'}</span>
                                    <span>•</span>
                                    <span style={{ color: lead.digital_audit?.no_booking ? 'var(--text-secondary)' : 'var(--secondary)' }}>📅 Booking: {lead.digital_audit?.no_booking ? 'None' : 'Integrated'}</span>
                                    <span>•</span>
                                    <span>⚡ Pagespeed: {lead.digital_audit?.pagespeed_score || 0}/100</span>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                  <div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lead Score:</span>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: lead.lead_score > 80 ? 'var(--accent)' : 'var(--secondary)' }}>{lead.lead_score}</div>
                                  </div>

                                  <div className="form-group" style={{ margin: 0 }}>
                                    <select 
                                      value={lead.status} 
                                      onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                      className="form-input"
                                      style={{ padding: '8px 12px', fontSize: '0.85rem', background: '#0a0b10', color: '#fff', border: '1px solid var(--border-color)' }}
                                    >
                                      <option value="New">New</option>
                                      <option value="Contacted">Contacted</option>
                                      <option value="Replied">Replied</option>
                                      <option value="Meeting Scheduled">Meeting Scheduled</option>
                                      <option value="Proposal Sent">Proposal Sent</option>
                                      <option value="Won">Won</option>
                                      <option value="Lost">Lost</option>
                                    </select>
                                  </div>

                                  <button onClick={() => handleGenerateOutreachDraft(lead)} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                                    <Sparkles size={14} color="var(--primary)" /> Draft Outreach
                                  </button>

                                  <button 
                                    onClick={() => handleDeleteLead(lead.id)} 
                                    className="btn btn-secondary" 
                                    style={{ padding: '8px 8px', fontSize: '0.85rem', color: 'var(--accent)', border: '1px solid var(--accent)' }}
                                    title="Delete Lead"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}

                {selectedLead && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}>
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '650px', background: 'var(--bg-secondary)', border: '1px solid var(--primary)', textAlign: 'left' }}>
                      <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0 }}>Personalized Outreach Pitch for {selectedLead.business_name}</h3>
                        <button onClick={() => setSelectedLead(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
                      </div>

                      {draftLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}><RefreshCw size={24} className="animate-spin" /> Tailoring with Gemini AI...</div>
                      ) : (
                        <div>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                            The Gemini AI engine has analyzed this lead's digital presence (SSL missing, booking missing, low pagespeed) to tailor this pitch:
                          </p>
                          <textarea 
                            value={loggedOutreachMessage} 
                            onChange={(e) => setLoggedOutreachMessage(e.target.value)} 
                            className="form-textarea" 
                            style={{ height: '220px', fontFamily: 'monospace', fontSize: '0.9rem' }}
                          />
                          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }} className="flex-between">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Channel:</span>
                              <select 
                                value={loggedOutreachChannel} 
                                onChange={(e)=>setLoggedOutreachChannel(e.target.value)}
                                className="form-input"
                                style={{ padding: '6px 10px', fontSize: '0.85rem', background: '#0a0b10', color: '#fff' }}
                              >
                                <option value="Email">Email</option>
                                <option value="LinkedIn">LinkedIn</option>
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="Contact Form">Contact Form</option>
                              </select>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => { navigator.clipboard.writeText(loggedOutreachMessage); alert('Copied text!'); }} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                                Copy Copy
                              </button>
                              <button onClick={handleLogOutreach} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                                Log Outreach Sent
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CRM JOBS PANEL */}
            {crmTab === 'jobs' && (
              <div>
                <div className="flex-between" style={{ marginBottom: '16px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: 0 }}>Target Remote Software Roles</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                      Automatically pulled from Remotive remote board and evaluated against your profile: React Native, Python, Node.js, PHP, E-Commerce.
                    </p>
                  </div>
                  <button onClick={() => setShowImportJobModal(true)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', border: '1px solid var(--secondary)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <FileSpreadsheet size={14} color="var(--primary)" /> Import LinkedIn/Wellfound File
                  </button>
                </div>

                {showImportJobModal && (
                  <div className="glass-card animate-fade-in" style={{ marginBottom: '24px', padding: '24px', border: '1px solid var(--primary)', textAlign: 'left' }}>
                    <h4 style={{ color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileSpreadsheet size={18} /> LinkedIn / Wellfound Job File Importer
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                      Search jobs on LinkedIn or Wellfound (e.g. <em>"Software Engineer Remote"</em>), scroll to load listings, and save the webpage as <strong>"Webpage, Single File (*.mht)"</strong> or standard <strong>*.html</strong>. Upload the file below, and the AI will parse listings, compute your match score, and import them!
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Upload Saved Job Webpage (.html / .mht)</label>
                        <input 
                          type="file" 
                          accept=".html,.htm,.mht"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              handleImportJobFile(file);
                            }
                          }}
                          style={{ color: '#fff', padding: '10px 0' }}
                          disabled={importingJobFile}
                        />
                      </div>

                      {importingJobFile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem' }}>
                          <RefreshCw size={16} className="animate-spin" /> Decoding file, extracting remote roles & checking profile relevance score... Please wait!
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={() => setShowImportJobModal(false)} className="btn btn-secondary" style={{ padding: '10px 20px' }}>Cancel</button>
                      </div>
                    </div>
                  </div>
                )}

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}><RefreshCw size={24} className="animate-spin" /> Loading job board...</div>
                ) : (
                  <div>
                    {(() => {
                      const groupedJobs = groupItemsByDate(jobs);
                      if (Object.keys(groupedJobs).length === 0) {
                        return <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>No remote jobs found yet. Run Scrape Jobs above to poll boards.</div>;
                      }
                      return Object.keys(groupedJobs).map(dateGroup => (
                        <div key={dateGroup} style={{ marginBottom: '32px', textAlign: 'left' }}>
                          <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>
                            📅 Scanned on: {dateGroup}
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {groupedJobs[dateGroup].map(job => (
                              <div key={job.id} className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                                <div style={{ textAlign: 'left', flex: 1, minWidth: '280px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <h4 style={{ margin: 0 }}>{job.position}</h4>
                                    <span className="badge" style={{ margin: 0, padding: '2px 8px', fontSize: '0.75rem' }}>{job.company_name}</span>
                                  </div>
                                  <p style={{ fontSize: '0.85rem', margin: '4px 0 8px 0', color: 'var(--text-secondary)' }}>
                                    📍 {job.location} | 💰 {job.salary} | 📅 Posted: {job.posted_at ? new Date(job.posted_at).toLocaleDateString() : 'Recent'} | 🔍 Scanned: {new Date(job.created_at).toLocaleDateString()} | 🌐 <a href={job.application_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary)' }}>View Job <ExternalLink size={10} /></a>
                                  </p>
                                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: '8px' }}>
                                    {job.job_description?.replace(/<[^>]*>/g, '')}
                                  </p>
                                  {job.how_to_apply && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--primary)', margin: '4px 0 0 0' }}>
                                      📝 <strong>How to Apply:</strong> {job.how_to_apply}
                                    </p>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-end' }}>
                                  <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Match:</span>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: job.relevance_score > 85 ? 'var(--secondary)' : 'var(--text-secondary)' }}>{job.relevance_score}%</div>
                                  </div>

                                  <div className="form-group" style={{ margin: 0 }}>
                                    <select 
                                      value={job.status} 
                                      onChange={(e) => updateJobStatus(job.id, e.target.value)}
                                      className="form-input"
                                      style={{ padding: '8px 12px', fontSize: '0.85rem', background: '#0a0b10', color: '#fff' }}
                                    >
                                      <option value="Discovered">Discovered</option>
                                      <option value="Applied">Applied</option>
                                      <option value="Interview">Interview</option>
                                      <option value="Rejected">Rejected</option>
                                      <option value="Offer">Offer</option>
                                    </select>
                                  </div>

                                  <button onClick={() => handleTailorJob(job)} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                                    <FileText size={14} color="var(--primary)" /> Tailor CV & Letter
                                  </button>

                                  <button 
                                    onClick={() => handleDeleteJob(job.id)} 
                                    className="btn btn-secondary" 
                                    style={{ padding: '8px 8px', fontSize: '0.85rem', color: 'var(--accent)', border: '1px solid var(--accent)' }}
                                    title="Delete Job"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}

                {/* Job Tailoring Modal */}
                {selectedJob && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}>
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '650px', background: 'var(--bg-secondary)', border: '1px solid var(--secondary)', textAlign: 'left' }}>
                      <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ margin: 0 }}>Tailored Cover Letter</h3>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedJob.position} at {selectedJob.company_name}</span>
                        </div>
                        <button onClick={() => setSelectedJob(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
                      </div>

                      {tailorLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}><RefreshCw size={24} className="animate-spin" /> Aligning experience with Gemini AI...</div>
                      ) : (
                        <div>
                          <textarea 
                            value={selectedJob.cover_letter_text || 'No letter generated yet. Click generate.'} 
                            readOnly
                            className="form-textarea" 
                            style={{ height: '220px', fontFamily: 'monospace', fontSize: '0.9rem' }}
                          />
                          <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={14} /> Tailored PDF CV path generated:
                            </span>
                            <code style={{ fontSize: '0.8rem' }}>{selectedJob.cv_generated_path || '/resumes/custom_cv.pdf'}</code>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
                            <a href={selectedJob.application_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                              Quick Apply Link <ExternalLink size={12} />
                            </a>
                            <button onClick={() => { navigator.clipboard.writeText(selectedJob.cover_letter_text); alert('Cover letter copied!'); }} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                              Copy Letter
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CRM SCHOLARSHIPS PANEL */}
            {crmTab === 'scholarships' && (
              <div>
                <h3>MSc Graduate Funding & Advisor Outreach</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
                  Tracks fully funded international programs (Erasmus Mundus, DAAD, Chevening) and direct CS advisor RA funding openings.
                </p>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}><RefreshCw size={24} className="animate-spin" /> Loading funding opportunities...</div>
                ) : (
                  <div>
                    {(() => {
                      const groupedSch = groupItemsByDate(scholarships);
                      if (Object.keys(groupedSch).length === 0) {
                        return <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>No scholarship funding targets found yet. Run Scrape Scholarships above.</div>;
                      }
                      return Object.keys(groupedSch).map(dateGroup => (
                        <div key={dateGroup} style={{ marginBottom: '32px', textAlign: 'left' }}>
                          <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>
                            📅 Scanned on: {dateGroup}
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {groupedSch[dateGroup].map(sch => (
                              <div key={sch.id} className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                                <div style={{ textAlign: 'left', flex: 1, minWidth: '280px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <h4 style={{ margin: 0 }}>{sch.program_name}</h4>
                                    <span className="badge" style={{ margin: 0, padding: '2px 8px', fontSize: '0.75rem' }}>{sch.institution}</span>
                                  </div>
                                  <p style={{ fontSize: '0.85rem', margin: '4px 0 8px 0', color: 'var(--text-secondary)' }}>
                                    📍 {sch.location} | 🎓 {sch.funding_type} | 📅 Deadline: {sch.deadline ? new Date(sch.deadline).toLocaleDateString() : 'Rolling'} | 🌐 <a href={sch.application_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary)' }}>View Portal <ExternalLink size={10} /></a>
                                  </p>
                                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                    {sch.description}
                                  </p>
                                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0' }}>
                                    📋 <strong>Eligibility:</strong> {sch.eligibility_criteria}
                                  </p>
                                  {sch.how_to_apply && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--accent)', margin: '4px 0 0 0' }}>
                                      📝 <strong>How to Apply:</strong> {sch.how_to_apply}
                                    </p>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-end' }}>
                                  <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Match:</span>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: sch.relevance_score > 90 ? 'var(--secondary)' : 'var(--text-secondary)' }}>{sch.relevance_score}%</div>
                                  </div>

                                  <div className="form-group" style={{ margin: 0 }}>
                                    <select 
                                      value={sch.status} 
                                      onChange={(e) => updateScholarshipStatus(sch.id, e.target.value)}
                                      className="form-input"
                                      style={{ padding: '8px 12px', fontSize: '0.85rem', background: '#0a0b10', color: '#fff' }}
                                    >
                                      <option value="Discovered">Discovered</option>
                                      <option value="SOP Drafted">SOP Drafted</option>
                                      <option value="Applied">Applied</option>
                                      <option value="Interview">Interview</option>
                                      <option value="Accepted">Accepted</option>
                                      <option value="Rejected">Rejected</option>
                                    </select>
                                  </div>

                                  <button onClick={() => handleTailorScholarship(sch)} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                                    <FileText size={14} color="var(--primary)" /> {sch.funding_type?.toLowerCase().includes('advisor') ? 'Tailor Advisor Email' : 'Tailor SOP'}
                                  </button>

                                  <button 
                                    onClick={() => handleDeleteScholarship(sch.id)} 
                                    className="btn btn-secondary" 
                                    style={{ padding: '8px 8px', fontSize: '0.85rem', color: 'var(--accent)', border: '1px solid var(--accent)' }}
                                    title="Delete Scholarship"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}

                {/* SOP / Advisor Email Modal */}
                {selectedScholarship && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}>
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '650px', background: 'var(--bg-secondary)', border: '1px solid var(--secondary)', textAlign: 'left' }}>
                      <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ margin: 0 }}>
                            {selectedScholarship.funding_type?.toLowerCase().includes('advisor') ? 'Tailored Professor Pitch' : 'Tailored Statement of Purpose (SOP)'}
                          </h3>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedScholarship.program_name} at {selectedScholarship.institution}</span>
                        </div>
                        <button onClick={() => setSelectedScholarship(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
                      </div>

                      {sopLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}><RefreshCw size={24} className="animate-spin" /> {"Customizing with Gemini AI (Degree -> TerraQuant -> SME Automation)..."}</div>
                      ) : (
                        <div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                            {selectedScholarship.funding_type?.toLowerCase().includes('advisor') 
                              ? 'This email connects your academic background, your TerraQuant systems architect achievements, and your Have Your Business Online automation projects to this professor\'s research group:'
                              : 'This SOP links your Software Engineering degree, your architectural role at TerraQuant, and your Have Your Business Online business automation work to demonstrate academic competence:'}
                          </p>
                          <textarea 
                            value={selectedScholarship.sop_text || 'No document generated yet.'} 
                            readOnly
                            className="form-textarea" 
                            style={{ height: '240px', fontFamily: 'monospace', fontSize: '0.9rem' }}
                          />
                          <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
                            <a href={selectedScholarship.application_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                              Visit Portal <ExternalLink size={12} />
                            </a>
                            <button onClick={() => { navigator.clipboard.writeText(selectedScholarship.sop_text); alert('Text copied to clipboard!'); }} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                              Copy Document Text
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CRM ANALYTICS TAB */}
            {crmTab === 'analytics' && (
              <div className="animate-fade-in">
                <div className="flex-between" style={{ marginBottom: '24px', alignItems: 'center' }}>
                  <div>
                    <h3>Acquisition Engine Pipeline Metrics</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Summaries of client conversions, job applications, and graduate funding pipelines.</p>
                  </div>
                  
                  {/* Range Switcher */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px', border: '1px solid var(--border-color)' }}>
                    {[
                      { key: 'overall', label: 'Overall Stats' },
                      { key: 'last7Days', label: 'Last 7 Days' },
                      { key: 'last30Days', label: 'Last 30 Days' }
                    ].map(range => (
                      <button
                        key={range.key}
                        onClick={() => setAnalyticsRange(range.key)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: analyticsRange === range.key ? 'var(--primary)' : 'transparent',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(() => {
                  const activeMetrics = metrics[analyticsRange] || (metrics.leads ? metrics : {
                    leads: { New: 0, Contacted: 0, Replied: 0, 'Meeting Scheduled': 0, 'Proposal Sent': 0, Won: 0, Lost: 0 },
                    jobs: { Discovered: 0, Applied: 0, Interview: 0, Rejected: 0, Offer: 0 },
                    scholarships: { Discovered: 0, 'SOP Drafted': 0, Applied: 0, Interview: 0, Accepted: 0, Rejected: 0 }
                  });
                  return (
                    <div>
                      <div className="grid-cols-3" style={{ marginBottom: '32px' }}>
                        <div className="glass-card" style={{ textAlign: 'left' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Client Leads Found</span>
                            <Users size={20} color="var(--primary)" />
                          </div>
                          <h1 style={{ fontSize: '3rem', margin: '10px 0 5px 0' }}>{Object.values(activeMetrics.leads || {}).reduce((a,b)=>a+b, 0)}</h1>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <span>New: {activeMetrics.leads?.New || 0}</span> | <span>Contacted: {activeMetrics.leads?.Contacted || 0}</span>
                          </div>
                        </div>

                        <div className="glass-card" style={{ textAlign: 'left' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Job Leads Found</span>
                            <Briefcase size={20} color="var(--secondary)" />
                          </div>
                          <h1 style={{ fontSize: '3rem', margin: '10px 0 5px 0' }}>{Object.values(activeMetrics.jobs || {}).reduce((a,b)=>a+b, 0)}</h1>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <span>Discovered: {activeMetrics.jobs?.Discovered || 0}</span> | <span>Applied: {activeMetrics.jobs?.Applied || 0}</span>
                          </div>
                        </div>

                        <div className="glass-card" style={{ textAlign: 'left' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Scholarship Funnel</span>
                            <Sparkles size={20} color="var(--accent)" />
                          </div>
                          <h1 style={{ fontSize: '3rem', margin: '10px 0 5px 0' }}>{Object.values(activeMetrics.scholarships || {}).reduce((a,b)=>a+b, 0)}</h1>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <span>Discovered: {activeMetrics.scholarships?.Discovered || 0}</span> | <span>SOP Drafted: {activeMetrics.scholarships?.['SOP Drafted'] || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Pipeline Stage Visual Cards */}
                      <div className="grid-cols-3" style={{ gap: '24px' }}>
                        <div className="glass-card" style={{ textAlign: 'left' }}>
                          <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>Client Lead Funnel</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {Object.entries(activeMetrics.leads || {}).map(([stage, count]) => (
                              <div key={stage} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--border-color)' }}>
                                <span style={{ fontSize: '0.95rem' }}>{stage}</span>
                                <span style={{ fontWeight: '700' }} className="text-gradient">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="glass-card" style={{ textAlign: 'left' }}>
                          <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>Job Application Pipeline</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {Object.entries(activeMetrics.jobs || {}).map(([stage, count]) => (
                              <div key={stage} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--border-color)' }}>
                                <span style={{ fontSize: '0.95rem' }}>{stage}</span>
                                <span style={{ fontWeight: '700' }} className="text-gradient-accent">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="glass-card" style={{ textAlign: 'left' }}>
                          <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>Funding & MSc Pipeline</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {Object.entries(activeMetrics.scholarships || {}).map(([stage, count]) => (
                              <div key={stage} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--border-color)' }}>
                                <span style={{ fontSize: '0.95rem' }}>{stage}</span>
                                <span style={{ fontWeight: '700', color: 'var(--accent)' }}>{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* CRM AUTOMATION LOGS TAB */}
            {crmTab === 'logs' && (
              <div className="animate-fade-in" style={{ textAlign: 'left' }}>
                <div className="flex-between" style={{ marginBottom: '20px', alignItems: 'center' }}>
                  <div>
                    <h3>Daily Acquisition Automation Logs</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Detailed reports of the background task runners (nodes) executed at 9:30 AM daily or triggered manually.
                    </p>
                  </div>
                  <button onClick={fetchCronRuns} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    <RefreshCw size={14} /> Refresh Logs
                  </button>
                </div>

                {cronRuns.length === 0 ? (
                  <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                    No execution logs found in the database. Run the scraper or outreach scan above to generate logs.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {cronRuns.map(run => (
                      <div key={run.id} className="glass-card" style={{ padding: '24px' }}>
                        <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <span style={{ fontWeight: '700', fontSize: '1.1rem', marginRight: '12px' }}>
                              {run.pipeline_type === 'job_scraper' ? '💼 Job Scraper Pipeline' : run.pipeline_type === 'client_outreach' ? '✉️ Client Outreach Pipeline' : '🎓 Scholarship Scraper Pipeline'}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              Ran on: {new Date(run.run_time).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="badge" style={{ 
                              background: run.status === 'Success' ? 'rgba(6, 182, 212, 0.15)' : 
                                          run.status === 'Warning' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: run.status === 'Success' ? 'var(--secondary)' : 
                                     run.status === 'Warning' ? '#eab308' : '#ef4444',
                              border: `1px solid ${
                                run.status === 'Success' ? 'var(--secondary)' : 
                                run.status === 'Warning' ? '#eab308' : '#ef4444'
                              }`,
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '0.85rem',
                              fontWeight: '700'
                            }}>
                              {run.status}
                            </span>
                          </div>
                        </div>

                        {/* Task by task status list */}
                        <div style={{ marginBottom: '16px' }}>
                          <h5 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Task Breakdown:</h5>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                            {(typeof run.tasks_executed === 'string' ? JSON.parse(run.tasks_executed) : run.tasks_executed || []).map((task, tIdx) => (
                              <div key={tIdx} style={{ 
                                padding: '12px', 
                                borderRadius: '8px', 
                                background: 'rgba(255,255,255,0.02)', 
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{task.name}</span>
                                  <span style={{ 
                                    fontSize: '0.75rem', 
                                    fontWeight: '700',
                                    color: task.status === 'Success' ? 'var(--secondary)' : 
                                           task.status === 'Warning' ? '#eab308' : '#ef4444'
                                  }}>
                                    {task.status}
                                  </span>
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{task.details}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Console Output Toggle */}
                        <details style={{ marginTop: '12px' }}>
                          <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600' }}>
                            View Raw Runner Output Logs
                          </summary>
                          <pre style={{ 
                            marginTop: '8px', 
                            padding: '16px', 
                            background: '#0a0b10', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: '8px', 
                            fontSize: '0.8rem', 
                            fontFamily: 'monospace', 
                            color: '#10b981',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {run.log_output}
                          </pre>
                        </details>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CRM PRICING CONFIGURATIONS SETTINGS TAB */}
            {crmTab === 'settings' && (
              <div className="animate-fade-in" style={{ textAlign: 'left' }}>
                <div style={{ marginBottom: '24px' }}>
                  <h3>Template Price Customization Panel</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Adjust base pricing values and regional discount ratios. Saving configurations will automatically update template prices viewed by prospective clients based on their visitor IP geolocations.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {pricingConfigs.map(conf => (
                    <div key={conf.template_key} className="glass-card" style={{ padding: '24px', border: '1px solid var(--border-color)' }}>
                      <h4 style={{ textTransform: 'capitalize', color: 'var(--primary)', marginBottom: '16px' }}>
                        📋 {conf.template_key.replace('_', ' ')}
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Monthly Subscription ($)</label>
                          <input 
                            type="number" 
                            className="form-input" 
                            value={conf.base_price_monthly} 
                            onChange={(e) => {
                              const updated = pricingConfigs.map(c => c.template_key === conf.template_key ? { ...c, base_price_monthly: e.target.value } : c);
                              setPricingConfigs(updated);
                            }} 
                            style={{ background: '#12131a', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '4px' }}
                          />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>6-Month Plan ($)</label>
                          <input 
                            type="number" 
                            className="form-input" 
                            value={conf.base_price_six_months || ''} 
                            onChange={(e) => {
                              const updated = pricingConfigs.map(c => c.template_key === conf.template_key ? { ...c, base_price_six_months: e.target.value } : c);
                              setPricingConfigs(updated);
                            }} 
                            style={{ background: '#12131a', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '4px' }}
                          />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Yearly Subscription ($)</label>
                          <input 
                            type="number" 
                            className="form-input" 
                            value={conf.base_price_yearly} 
                            onChange={(e) => {
                              const updated = pricingConfigs.map(c => c.template_key === conf.template_key ? { ...c, base_price_yearly: e.target.value } : c);
                              setPricingConfigs(updated);
                            }} 
                            style={{ background: '#12131a', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '4px' }}
                          />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>One-time Setup ($)</label>
                          <input 
                            type="number" 
                            className="form-input" 
                            value={conf.base_price_one_time} 
                            onChange={(e) => {
                              const updated = pricingConfigs.map(c => c.template_key === conf.template_key ? { ...c, base_price_one_time: e.target.value } : c);
                              setPricingConfigs(updated);
                            }} 
                            style={{ background: '#12131a', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '4px' }}
                          />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Local Discount Ratio (e.g. 0.40)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            className="form-input" 
                            value={conf.local_discount_multiplier} 
                            onChange={(e) => {
                              const updated = pricingConfigs.map(c => c.template_key === conf.template_key ? { ...c, local_discount_multiplier: e.target.value } : c);
                              setPricingConfigs(updated);
                            }} 
                            style={{ background: '#12131a', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '4px' }}
                          />
                        </div>
                      </div>

                      <button 
                        onClick={async () => {
                          try {
                            const res = await fetch(`${API_URL}/crm/pricing-configs`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(conf)
                            });
                            if (res.ok) {
                              alert(`Successfully updated pricing configurations for ${conf.template_key.replace('_', ' ')}!`);
                              fetchPricingConfigs();
                            }
                          } catch (e) {
                            alert(`Success (Offline/Mock Mode): Config saved locally.`);
                          }
                        }} 
                        className="btn btn-primary" 
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        Save Configuration
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CRM TECHNICAL ARSENAL TAB */}
            {crmTab === 'tech' && (
              <div className="animate-fade-in" style={{ textAlign: 'left' }}>
                <div style={{ marginBottom: '24px' }}>
                  <h3>Technical Arsenal & Interview Progress</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Track programming languages, framework topics, and Data Structures & Algorithms (DSA) milestones to systematically prepare for engineering interviews.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  {/* Left Sidebar: Niches List */}
                  <div style={{ flex: '1 1 280px', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="glass-card" style={{ padding: '20px', border: '1px solid var(--border-color)' }}>
                      <h4 style={{ margin: '0 0 16px 0', color: 'var(--primary)' }}>🎯 Tech Niches</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                        {techNiches.map(niche => (
                          <div 
                            key={niche.id} 
                            onClick={() => setSelectedNiche(niche)}
                            style={{ 
                              padding: '12px', 
                              borderRadius: '6px', 
                              background: selectedNiche && selectedNiche.id === niche.id ? 'rgba(139, 92, 246, 0.15)' : '#12131a', 
                              border: selectedNiche && selectedNiche.id === niche.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <strong style={{ fontSize: '0.9rem', color: selectedNiche && selectedNiche.id === niche.id ? '#fff' : 'var(--text-secondary)' }}>{niche.name}</strong>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteNiche(niche.id); }}
                              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', padding: '2px' }}
                              title="Delete Niche"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        {techNiches.length === 0 && (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No niches added yet.</div>
                        )}
                      </div>

                      {/* Add Niche Form */}
                      <form onSubmit={handleCreateNiche} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Add New Niche</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. System Design, React Native"
                            value={newNicheName}
                            onChange={(e) => setNewNicheName(e.target.value)}
                            style={{ background: '#12131a', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '4px', width: '100%', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Brief description..."
                            value={newNicheDesc}
                            onChange={(e) => setNewNicheDesc(e.target.value)}
                            style={{ background: '#12131a', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '4px', width: '100%', fontSize: '0.85rem' }}
                          />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ padding: '8px', fontSize: '0.85rem', width: '100%' }}>
                          <Plus size={14} /> Add Niche
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Right Panel: Topics and Subtopics */}
                  <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {selectedNiche ? (
                      <div>
                        {/* Header Details */}
                        <div className="glass-card" style={{ padding: '24px', border: '1px solid var(--border-color)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                          <div style={{ textAlign: 'left' }}>
                            <h3 style={{ margin: 0, color: 'var(--primary)' }}>{selectedNiche.name}</h3>
                            <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{selectedNiche.description || 'No description provided.'}</p>
                          </div>
                          
                          {/* Progress Statistics */}
                          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Topics Mastered</div>
                              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--secondary)' }}>
                                {techTopics.filter(t => t.status === 'Mastered').length} / {techTopics.length}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }}>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Subtopics Completed</div>
                              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)' }}>
                                {techTopics.reduce((acc, t) => acc + (t.subtopics ? t.subtopics.filter(s => s.status === 'Completed').length : 0), 0)} / {techTopics.reduce((acc, t) => acc + (t.subtopics ? t.subtopics.length : 0), 0)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Add Topic Form */}
                        <div className="glass-card" style={{ padding: '20px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
                          <h4 style={{ margin: '0 0 12px 0', color: '#fff', fontSize: '0.95rem' }}>➕ Add New Learning Topic</h4>
                          <form onSubmit={handleCreateTopic} className="grid-cols-3" style={{ gap: '12px', alignItems: 'flex-end' }}>
                            <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                              <label className="form-label" style={{ fontSize: '0.75rem' }}>Topic Name</label>
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="e.g. Graphs DFS/BFS, Metaclasses, Event Loop"
                                value={newTopicName}
                                onChange={(e) => setNewTopicName(e.target.value)}
                                style={{ background: '#12131a', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 12px', borderRadius: '4px', width: '100%', fontSize: '0.85rem' }}
                              />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', fontSize: '0.85rem', height: '38px' }}>
                              Add Topic
                            </button>
                          </form>
                        </div>

                        {/* Topics Board List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {techTopics.map(topic => {
                            const totalSubs = topic.subtopics ? topic.subtopics.length : 0;
                            const doneSubs = topic.subtopics ? topic.subtopics.filter(s => s.status === 'Completed').length : 0;
                            const progressPercent = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0;

                            let statusColor = 'rgba(239, 68, 68, 0.2)'; 
                            let statusTextCol = '#ef4444';
                            if (topic.status === 'In Progress') {
                              statusColor = 'rgba(245, 158, 11, 0.2)'; 
                              statusTextCol = '#f59e0b';
                            } else if (topic.status === 'Mastered') {
                              statusColor = 'rgba(16, 185, 129, 0.2)'; 
                              statusTextCol = '#10b981';
                            }

                            return (
                              <div key={topic.id} className="glass-card" style={{ padding: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Topic Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{topic.name}</h4>
                                    
                                    <span 
                                      onClick={() => handleUpdateTopicStatus(topic.id, topic.status)}
                                      className="badge" 
                                      style={{ 
                                        margin: 0, 
                                        background: statusColor, 
                                        color: statusTextCol, 
                                        border: `1px solid ${statusTextCol}`,
                                        cursor: 'pointer',
                                        userSelect: 'none'
                                      }}
                                      title="Click to cycle status: Pending -> In Progress -> Mastered"
                                    >
                                      {topic.status}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    {topic.last_revised && (
                                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        📅 Revised: {new Date(topic.last_revised).toLocaleDateString()}
                                      </span>
                                    )}
                                    <button 
                                      onClick={() => handleDeleteTopic(topic.id)}
                                      style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '4px' }}
                                      title="Delete Topic"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>

                                {/* Notes Summary & Edit Card */}
                                <div style={{ background: '#12131a', padding: '12px 16px', borderRadius: '6px', borderLeft: '3px solid var(--primary)', fontSize: '0.85rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                    <strong style={{ color: 'var(--primary)' }}>Cheat Sheet Notes</strong>
                                    <button 
                                      onClick={() => { setEditingNotesTopic(topic); setEditingNotesText(topic.notes || ''); }} 
                                      className="btn btn-secondary" 
                                      style={{ padding: '2px 8px', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}
                                    >
                                      Edit Notes
                                    </button>
                                  </div>
                                  <p style={{ margin: 0, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                                    {topic.notes || 'No complexity bounds, formulas, or cheat sheets noted yet. Click Edit Notes to add key details.'}
                                  </p>
                                </div>

                                {/* Subtopics nested progress list */}
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Nested Concepts / LeetCode Tasks</span>
                                    {totalSubs > 0 && (
                                      <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>
                                        {progressPercent}% Complete
                                      </span>
                                    )}
                                  </div>

                                  {/* Subtopics items checklist */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                                    {topic.subtopics && topic.subtopics.map(sub => (
                                      <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <input 
                                            type="checkbox"
                                            checked={sub.status === 'Completed'}
                                            onChange={() => handleToggleSubtopic(sub.id, sub.status, topic.id)}
                                            style={{ cursor: 'pointer' }}
                                          />
                                          <span style={{ 
                                            fontSize: '0.85rem', 
                                            color: sub.status === 'Completed' ? 'var(--text-muted)' : '#fff',
                                            textDecoration: sub.status === 'Completed' ? 'line-through' : 'none'
                                          }}>
                                            {sub.name}
                                          </span>
                                        </div>
                                        <button 
                                          onClick={() => handleDeleteSubtopic(sub.id, topic.id)}
                                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '2px' }}
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    ))}

                                    {totalSubs === 0 && (
                                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                        No nested subtopics or checklist items. Add one below to build your revision map.
                                      </div>
                                    )}
                                  </div>

                                  {/* Add Subtopic form */}
                                  {selectedTopicForSubtopic === topic.id ? (
                                    <form 
                                      onSubmit={(e) => handleCreateSubtopic(e, topic.id)} 
                                      style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '400px' }}
                                    >
                                      <input 
                                        type="text" 
                                        className="form-input" 
                                        placeholder="e.g. Sliding window, Two-pointer..."
                                        value={newSubtopicName}
                                        onChange={(e) => setNewSubtopicName(e.target.value)}
                                        style={{ background: '#12131a', border: '1px solid var(--border-color)', color: '#fff', padding: '6px 10px', borderRadius: '4px', flex: 1, fontSize: '0.8rem' }}
                                        autoFocus
                                      />
                                      <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Add</button>
                                      <button type="button" onClick={() => setSelectedTopicForSubtopic(null)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Cancel</button>
                                    </form>
                                  ) : (
                                    <button 
                                      onClick={() => setSelectedTopicForSubtopic(topic.id)} 
                                      className="btn btn-secondary" 
                                      style={{ padding: '6px 12px', fontSize: '0.8rem', border: '1px dashed var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    >
                                      <Plus size={12} /> Add Nested Concept / LeetCode Task
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {techTopics.length === 0 && (
                            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                              No topics created in this niche. Add your first learning topic above!
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Select or create a Technical Niche in the sidebar to start tracking interview concepts.
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes Editing Modal */}
                {editingNotesTopic && (
                  <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '600px', padding: '24px', border: '1px solid var(--primary)', textAlign: 'left' }}>
                      <h4 style={{ color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📝 Edit Notes: {editingNotesTopic.name}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Add key complexities, code snippets, or cheat sheet references here.
                      </p>
                      <textarea 
                        rows={8}
                        className="form-input" 
                        value={editingNotesText} 
                        onChange={(e) => setEditingNotesText(e.target.value)}
                        style={{ width: '100%', background: '#12131a', border: '1px solid var(--border-color)', color: '#fff', padding: '12px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '16px', lineHeight: '1.5' }}
                        placeholder="e.g. Sliding window approach. Time complexity O(N), space complexity O(1)."
                      />
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setEditingNotesTopic(null); setEditingNotesText(''); }} className="btn btn-secondary" style={{ padding: '8px 16px' }}>Cancel</button>
                        <button onClick={handleSaveTopicNotes} className="btn btn-primary" style={{ padding: '8px 16px' }}>Save Notes</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        padding: '60px 0 40px 0',
        marginTop: '80px'
      }}>
        <div className="container">
          <div className="grid-cols-3" style={{ textAlign: 'left', marginBottom: '40px' }}>
            <div>
              <div className="flex-center" style={{ justifyContent: 'flex-start', marginBottom: '20px' }}>
                <div className="logo-icon flex-center">
                  <Globe size={16} color="#fff" />
                </div>
                <span className="footer-logo text-gradient">Have Your Business Online</span>
              </div>
              <p style={{ fontSize: '0.9rem' }}>
                Premium custom web portals, native mobile applications, and workflow AI automation services designed to bring your business online and grow operational efficiency.
              </p>
            </div>
            
            <div style={{ paddingLeft: '40px' }}>
              <h4 style={{ marginBottom: '20px', fontSize: '1rem' }}>Navigation</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li><span onClick={() => handleNavClick('home')} style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }} className="nav-link">Home</span></li>
                <li><span onClick={() => handleNavClick('services')} style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }} className="nav-link">Services</span></li>
                <li><span onClick={() => handleNavClick('case-studies')} style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }} className="nav-link">Case Studies</span></li>
                <li><span onClick={() => handleNavClick('pricing')} style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }} className="nav-link">Pricing</span></li>
                <li><span onClick={() => handleNavClick('contact')} style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }} className="nav-link">Contact</span></li>
              </ul>
            </div>

            <div>
              <h4 style={{ marginBottom: '20px', fontSize: '1rem' }}>Contact Info</h4>
              <p style={{ fontSize: '0.9rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} /> info.haveyourbusinessonline@gmail.com
              </p>
              <p style={{ fontSize: '0.9rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} /> <a href="https://wa.me/13022039218" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>+1 (302) 203-9218 (WhatsApp)</a>
              </p>
              <p style={{ fontSize: '0.9rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={14} /> www.haveyourbusiness.online
              </p>
              <p style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={14} /> Remote (Global Services)
              </p>
            </div>
          </div>
          
          <div style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '30px',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '15px',
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}>
            <span>© {new Date().getFullYear()} Have Your Business Online. All rights reserved.</span>
            <div style={{ display: 'flex', gap: '20px' }}>
              <span>B.Sc Software Engineering Powered</span>
              <span>•</span>
              <a href="https://dancunsoftwares.online" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Portfolio Website</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
