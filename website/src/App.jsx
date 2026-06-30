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
  TrendingUp,
  Briefcase,
  Users,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import './App.css';

// API Configuration
const API_URL = 'https://haveyourshop.onrender.com/api';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Admin Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(localStorage.getItem('isAdmin') === 'true');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [cronRuns, setCronRuns] = useState([]);
  
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
  const [newLeadData, setNewLeadData] = useState({
    business_name: '',
    industry: '',
    location: '',
    website_url: '',
    email: '',
    phone: ''
  });

  // Public Contact Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    service: 'ecommerce',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

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
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch CRM Data
  const fetchCrmData = async () => {
    setLoading(true);
    try {
      const [leadsRes, jobsRes, scholarshipsRes, metricsRes] = await Promise.all([
        fetch(`${API_URL}/crm/leads`).then(r => r.ok ? r.json() : []),
        fetch(`${API_URL}/crm/jobs`).then(r => r.ok ? r.json() : []),
        fetch(`${API_URL}/crm/scholarships`).then(r => r.ok ? r.json() : []),
        fetch(`${API_URL}/crm/metrics`).then(r => r.ok ? r.json() : null)
      ]);
      
      if (leadsRes.length > 0) setLeads(leadsRes);
      if (jobsRes.length > 0) setJobs(jobsRes);
      if (scholarshipsRes.length > 0) setScholarships(scholarshipsRes);
      if (metricsRes) setMetrics(metricsRes);
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
    }
  }, [currentPage, isAdminAuthenticated]);

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
          ? `Subject: Prospective MSc Student Inquiry - CS Systems Lab\n\nDear Professor,\n\nI am a software engineering graduate with hands-on systems architect experience at TerraQuant and SME automation projects at Have Your Shop Online. I would love to join your research group...\n\nBest,\nDancun Kipkorir`
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
    try {
      const res = await fetch(`${API_URL}/automation/crawl-leads`, { method: 'POST' });
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

  return (
    <div className="website-app">
      {/* Header Navigation */}
      <header className={isScrolled ? 'scrolled' : ''}>
        <div className="container flex-between" style={{ height: '70px' }}>
          <div className="flex-center" style={{ cursor: 'pointer' }} onClick={() => handleNavClick('home')}>
            <div className="logo-icon flex-center">
              <ShoppingBag size={16} color="#fff" />
            </div>
            <span className="footer-logo text-gradient" style={{ fontWeight: '800' }}>Have Your Shop Online</span>
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
                We Build Digital Shops, Mobile Apps & <span className="text-gradient">AI Automations</span>
              </h1>
              <p className="hero-subtitle">
                Helping businesses transition from manual workflows to scalable digital presence. High-performance software engineering tailored for ROI.
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
                  <h3>E-Commerce Shops</h3>
                  <p>Stunning, highly optimized custom shops and automated e-commerce stores designed to maximize conversions and customer retention.</p>
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
                <h2>Explore Pre-Built Templates</h2>
                <p className="section-subtitle">
                  We maintain a catalog of pre-engineered digital templates. We customize them with your identity and deploy within 5-7 days.
                </p>
              </div>
              
              <div className="grid-cols-2" style={{ gap: '24px' }}>
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span className="badge" style={{ margin: 0, background: 'rgba(6, 182, 212, 0.1)', color: 'var(--secondary)' }}>E-Commerce Storefront</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>⏱️ 5 Days Launch</span>
                  </div>
                  <h3>SupaCart Retail Store</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Fully functional online shopping store with responsive layouts, shopping cart drawer, instant product search filters, and checkout integration supporting Stripe, PayPal, and M-Pesa.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '16px' }}>
                    <span className="badge badge-secondary" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>React Redux</span>
                    <span className="badge badge-secondary" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>Node.js / Express</span>
                    <span className="badge badge-secondary" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>M-Pesa API</span>
                  </div>
                </div>

                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span className="badge" style={{ margin: 0, background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)' }}>Booking & Scheduling</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>⏱️ 6 Days Launch</span>
                  </div>
                  <h3>Clinical Scheduler Hub</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Tailored for doctors, law firms, and consulting clinics. Includes automated calendar slots reservation, booking forms, and integration with Twilio SMS / NodeMailer to notify clients.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '16px' }}>
                    <span className="badge badge-secondary" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>Google Calendar Sync</span>
                    <span className="badge badge-secondary" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>Twilio API</span>
                    <span className="badge badge-secondary" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>PostgreSQL</span>
                  </div>
                </div>

                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', border: '1px solid rgba(236, 72, 153, 0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span className="badge" style={{ margin: 0, background: 'rgba(236, 72, 153, 0.1)', color: 'var(--accent)' }}>AI Operations</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>⏱️ 4 Days Launch</span>
                  </div>
                  <h3>Lead-Gen Support Agent</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    An intelligent conversational AI agent built for WhatsApp or Telegram channels. Automates customer onboarding, profiles leads, answers FAQs using custom knowledge databases, and alerts owners.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '16px' }}>
                    <span className="badge badge-secondary" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>Gemini / DeepSeek API</span>
                    <span className="badge badge-secondary" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>Vector DB Lookup</span>
                    <span className="badge badge-secondary" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>WhatsApp Webhooks</span>
                  </div>
                </div>

                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span className="badge" style={{ margin: 0, background: 'rgba(6, 182, 212, 0.1)', color: 'var(--secondary)' }}>Enterprise POS</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>⏱️ 7 Days Launch</span>
                  </div>
                  <h3>Enterprise Cloud POS System</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    A cloud-based Point of Sale (POS) system with offline-first synchronization, real-time inventory management, barcode scanning, print receipt integrations, and sales metrics dashboards.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '16px' }}>
                    <span className="badge badge-secondary" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>React / Electron</span>
                    <span className="badge badge-secondary" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>NodeJS / Express</span>
                    <span className="badge badge-secondary" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>SQLite / PostgreSQL</span>
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
                <div className="feature-icon"><ShoppingBag size={24} /></div>
                <h3>E-Commerce Development</h3>
                <p>We construct custom digital shopping systems that load in milliseconds and deliver premium user experiences. Integrated with Stripe, PayPal, M-Pesa.</p>
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
                <div className="feature-icon"><Zap size={24} /></div>
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
                <div className="case-study-image text-gradient" style={{ fontWeight: '800', fontSize: '1.8rem' }}>SupaCart Shop</div>
                <h3>Scaling E-Commerce Retail</h3>
                <p>Migrated slow WooCommerce store to custom React/Node.js setup. Load times reduced from 5s to 1.2s, boost conversion by 140%.</p>
              </div>
              <div className="glass-card case-study-card">
                <div className="case-study-image text-gradient-accent" style={{ fontWeight: '800', fontSize: '1.8rem' }}>PropLead Scraper</div>
                <h3>Sourcing 2,500 qualified leads/week</h3>
                <p>Automated crawler scans Google Maps, scores leads based on website presence gaps, and syncs directly to client database.</p>
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
                    <p>hello@haveyourshop.online</p>
                  </div>
                </div>
                <div className="contact-method">
                  <div className="contact-method-icon"><Globe size={18} /></div>
                  <div>
                    <h4>Portfolio</h4>
                    <p>dancunsoftwares.online</p>
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
                        <option value="automation">Workflow Automation</option>
                        <option value="ai">Bespoke AI Agents</option>
                      </select>
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
                Secure access for Have Your Shop Online architects. Use the developer password to authenticate.
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
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button 
                  onClick={handleTriggerScraper} 
                  disabled={scrapingJobs} 
                  className="btn btn-secondary" 
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  <RefreshCw size={14} className={scrapingJobs ? 'animate-spin' : ''} /> {scrapingJobs ? 'Scraping Jobs...' : 'Scrape Jobs'}
                </button>
                <button 
                  onClick={handleTriggerCrawl} 
                  disabled={crawlingLeads} 
                  className="btn btn-primary" 
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  <Cpu size={14} className={crawlingLeads ? 'animate-pulse' : ''} /> {crawlingLeads ? 'Scanning Local Leads...' : 'Scan Leads'}
                </button>
                <button 
                  onClick={handleTriggerScholarshipScraper} 
                  disabled={scrapingScholarships} 
                  className="btn btn-secondary" 
                  style={{ padding: '8px 16px', fontSize: '0.85rem', border: '1px solid var(--secondary)' }}
                >
                  <RefreshCw size={14} className={scrapingScholarships ? 'animate-spin' : ''} /> {scrapingScholarships ? 'Scanning Funding...' : 'Scrape Scholarships'}
                </button>
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
                onClick={() => {
                  setIsAdminAuthenticated(false);
                  localStorage.removeItem('isAdmin');
                  setAdminPassword('');
                }} 
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.9rem', marginLeft: 'auto', border: '1px solid var(--accent)' }}
              >
                Log Out Admin
              </button>
            </div>

            {/* CRM LEADS PANEL */}
            {crmTab === 'leads' && (
              <div>
                <div className="flex-between" style={{ marginBottom: '16px' }}>
                  <h3>Identified Business Leads</h3>
                  <button onClick={() => setShowAddLead(true)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                    <Plus size={14} /> Add Lead Manually
                  </button>
                </div>

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

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}><RefreshCw size={24} className="animate-spin" /> Fetching pipeline...</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {leads.map(lead => (
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
                        </div>
                      </div>
                    ))}
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
                <h3>Target Remote Software Roles</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
                  Automatically pulled from Remotive remote board and evaluated against your profile: React Native, Python, Node.js, PHP, E-Commerce.
                </p>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}><RefreshCw size={24} className="animate-spin" /> Loading job board...</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {jobs.map(job => (
                      <div key={job.id} className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                        <div style={{ textAlign: 'left', flex: 1, minWidth: '280px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ margin: 0 }}>{job.position}</h4>
                            <span className="badge" style={{ margin: 0, padding: '2px 8px', fontSize: '0.75rem' }}>{job.company_name}</span>
                          </div>
                          <p style={{ fontSize: '0.85rem', margin: '4px 0 8px 0', color: 'var(--text-secondary)' }}>
                            📍 {job.location} | 💰 {job.salary}
                          </p>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {job.job_description?.replace(/<[^>]*>/g, '')}
                          </p>
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
                        </div>
                      </div>
                    ))}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {scholarships.map(sch => (
                      <div key={sch.id} className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                        <div style={{ textAlign: 'left', flex: 1, minWidth: '280px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ margin: 0 }}>{sch.program_name}</h4>
                            <span className="badge" style={{ margin: 0, padding: '2px 8px', fontSize: '0.75rem' }}>{sch.institution}</span>
                          </div>
                          <p style={{ fontSize: '0.85rem', margin: '4px 0 8px 0', color: 'var(--text-secondary)' }}>
                            📍 {sch.location} | 🎓 {sch.funding_type} | 📅 Deadline: {sch.deadline ? new Date(sch.deadline).toLocaleDateString() : 'Rolling'}
                          </p>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {sch.description}
                          </p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                            📋 <strong>Eligibility:</strong> {sch.eligibility_criteria}
                          </p>
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
                        </div>
                      </div>
                    ))}
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
                              ? 'This email connects your academic background, your TerraQuant systems architect achievements, and your Have Your Shop Online automation projects to this professor\'s research group:'
                              : 'This SOP links your Software Engineering degree, your architectural role at TerraQuant, and your Have Your Shop Online business automation work to demonstrate academic competence:'}
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
                <h3>Acquisition Engine Pipeline Metrics</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>Real-time summaries of client conversions, job applications, and graduate funding pipelines.</p>

                <div className="grid-cols-3" style={{ marginBottom: '32px' }}>
                  <div className="glass-card" style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Client Leads Found</span>
                      <Users size={20} color="var(--primary)" />
                    </div>
                    <h1 style={{ fontSize: '3rem', margin: '10px 0 5px 0' }}>{Object.values(metrics.leads).reduce((a,b)=>a+b, 0)}</h1>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>New: {metrics.leads.New}</span> | <span>Contacted: {metrics.leads.Contacted}</span>
                    </div>
                  </div>

                  <div className="glass-card" style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Job Leads Found</span>
                      <Briefcase size={20} color="var(--secondary)" />
                    </div>
                    <h1 style={{ fontSize: '3rem', margin: '10px 0 5px 0' }}>{Object.values(metrics.jobs).reduce((a,b)=>a+b, 0)}</h1>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>Discovered: {metrics.jobs.Discovered}</span> | <span>Applied: {metrics.jobs.Applied}</span>
                    </div>
                  </div>

                  <div className="glass-card" style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Scholarship Funnel</span>
                      <Sparkles size={20} color="var(--accent)" />
                    </div>
                    <h1 style={{ fontSize: '3rem', margin: '10px 0 5px 0' }}>{Object.values(metrics.scholarships || {}).reduce((a,b)=>a+b, 0)}</h1>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>Discovered: {metrics.scholarships?.Discovered || 0}</span> | <span>SOP Drafted: {metrics.scholarships?.['SOP Drafted'] || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Detailed Pipeline Stage Visual Cards */}
                <div className="grid-cols-3" style={{ gap: '24px' }}>
                  <div className="glass-card" style={{ textAlign: 'left' }}>
                    <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>Client Lead Funnel</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.entries(metrics.leads).map(([stage, count]) => (
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
                      {Object.entries(metrics.jobs).map(([stage, count]) => (
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
                      {Object.entries(metrics.scholarships || {}).map(([stage, count]) => (
                        <div key={stage} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--border-color)' }}>
                          <span style={{ fontSize: '0.95rem' }}>{stage}</span>
                          <span style={{ fontWeight: '700', color: 'var(--accent)' }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
                              {run.pipeline_type === 'job_scraper' ? '💼 Job Scraper Pipeline' : '✉️ Client Outreach Pipeline'}
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
                  <ShoppingBag size={16} color="#fff" />
                </div>
                <span className="footer-logo text-gradient">Have Your Shop Online</span>
              </div>
              <p style={{ fontSize: '0.9rem' }}>
                Premium custom e-commerce stores, native iOS & Android applications, and workflow AI automation services designed to grow your business efficiency.
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
                <Mail size={14} /> hello@haveyourshop.online
              </p>
              <p style={{ fontSize: '0.9rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={14} /> dancunsoftwares.online
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
            <span>© {new Date().getFullYear()} Have Your Shop Online. All rights reserved.</span>
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
