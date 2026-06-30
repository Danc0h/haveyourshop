const { Pool } = require('pg');
require('dotenv').config();

let pool = null;
let isMockDB = false;

// In-memory data store for fallback/mock database mode
const mockDb = {
  client_leads: [
    {
      id: 'mock-lead-1',
      business_name: 'Local Gourmet Bakery',
      industry: 'Bakery / Food',
      location: 'New York, NY',
      website_url: 'http://bakerygourmet-nyc-example.com',
      email: 'owner@bakerygourmet-example.com',
      phone: '+1-555-0192',
      lead_score: 85,
      digital_audit: { no_website: false, no_booking: true, outdated_tech: true, pagespeed_score: 42 },
      status: 'New',
      created_at: new Date().toISOString()
    },
    {
      id: 'mock-lead-2',
      business_name: 'Downtown Dental Practice',
      industry: 'Healthcare / Dental',
      location: 'Boston, MA',
      website_url: '',
      email: 'contact@downtowndental-example.com',
      phone: '+1-555-0143',
      lead_score: 95,
      digital_audit: { no_website: true, no_booking: true, outdated_tech: false, pagespeed_score: 0 },
      status: 'Contacted',
      created_at: new Date().toISOString()
    }
  ],
  outreach_history: [
    {
      id: 'mock-outreach-1',
      lead_id: 'mock-lead-2',
      channel: 'Email',
      sent_at: new Date(Date.now() - 86400000).toISOString(),
      message_content: 'Hello, we noticed your business lacks an online storefront. We can build one...',
      response_received: true,
      response_content: 'Thanks, we are interested in booking a call.',
      response_at: new Date().toISOString()
    }
  ],
  job_listings: [
    {
      id: 'mock-job-1',
      company_name: 'TechCorp Solutions',
      position: 'Senior Python & React Engineer',
      salary: '$110,000 - $140,000',
      location: 'Remote (US/Canada)',
      application_url: 'https://remotive.com/jobs/example-1',
      job_description: 'We are looking for a software developer skilled in React, Python, Node.js and PostgreSQL to join our product team...',
      relevance_score: 95,
      status: 'Discovered',
      cv_generated_path: '',
      cover_letter_text: '',
      created_at: new Date().toISOString()
    },
    {
      id: 'mock-job-2',
      company_name: 'Innovative E-Commerce',
      position: 'Full Stack Node.js/React Developer',
      salary: '$90,000 - $115,000',
      location: 'Remote (Global)',
      application_url: 'https://remotive.com/jobs/example-2',
      job_description: 'Looking for a full stack developer with experience building e-commerce carts and managing databases using PostgreSQL...',
      relevance_score: 88,
      status: 'Applied',
      cv_generated_path: '/resumes/custom_cv_innovative.pdf',
      cover_letter_text: 'Dear Hiring Manager, I am a software engineering graduate with hands-on experience in React and Node.js...',
      created_at: new Date().toISOString()
    }
  ],
  blog_posts: [
    {
      id: 'mock-blog-1',
      title: 'The Hidden Cost of Slow Load Times in E-Commerce',
      slug: 'hidden-cost-slow-load-times',
      content: 'Detailed article content...',
      summary: 'Why a 1-second delay in your page loading speeds could be bleeding up to 7% of your daily sales...',
      is_case_study: false,
      tags: ['E-Commerce', 'Web Performance'],
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
  ],
  daily_metrics: {},
  scholarship_listings: [
    {
      id: 'mock-scholarship-1',
      program_name: 'Erasmus Mundus Joint Master in Software Engineering (EMSE)',
      institution: 'Consortium of European Universities (Ulaan, Free University of Bozen-Bolzano, etc.)',
      location: 'Europe (Multiple)',
      funding_type: 'Fully Funded',
      deadline: '2027-01-15',
      application_url: 'https://emse-erasmusmundus.eu',
      description: 'Erasmus Mundus Joint Master Degree in Software Engineering focusing on software architectures, systems design, and cloud architectures...',
      eligibility_criteria: 'B.Sc. in CS/Software Engineering or related computing degree. Minimum GPA requirements apply.',
      relevance_score: 95,
      status: 'Discovered',
      sop_text: ''
    },
    {
      id: 'mock-scholarship-2',
      program_name: 'CS Research Group Advisor Position (Direct Advisor Funding)',
      institution: 'University of British Columbia (UBC)',
      location: 'Canada',
      funding_type: 'RA/TA Advisor position',
      deadline: '2026-12-01',
      application_url: 'https://cs.ubc.ca/people/faculty-advisor-pitch',
      description: 'Research Lab Assistantship opening in Distributed Systems & Green Computing under Dr. Sarah Jenkins. Seeking students with systems engineering background...',
      eligibility_criteria: 'M.Sc./B.Sc. in Software Engineering, experience with systems architectures, carbon asset accounting, or databases is a strong plus.',
      relevance_score: 98,
      status: 'Discovered',
      sop_text: ''
    }
  ],
  cron_runs: [
    {
      id: 'mock-cron-1',
      run_time: new Date(Date.now() - 12 * 3600000).toISOString(),
      pipeline_type: 'job_scraper',
      status: 'Success',
      tasks_executed: [
        { name: 'Check Remotive', status: 'Success', details: 'Ingested 2 new remote jobs' },
        { name: 'Check LinkedIn', status: 'Warning', details: 'Session cookies missing, ran AI-Assisted simulation' },
        { name: 'Google Search (US, UK, AUS rotating)', status: 'Success', details: 'Scraped 3 career pages' },
        { name: 'Check Wellfound', status: 'Warning', details: 'Session cookies missing, ran AI-Assisted simulation' }
      ],
      log_output: 'Starting job scraper pipeline...\nTask 1: Remotive: Success\nTask 2: LinkedIn: Warnings (cookies missing)\nPipeline complete.',
      created_at: new Date(Date.now() - 12 * 3600000).toISOString()
    }
  ]
};

// Initialize PostgreSQL pool
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // If deployed to Neon/Supabase, enable SSL:
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    // Test the pool connection
    pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.warn('⚠️ PostgreSQL connection failed. Falling back to IN-MEMORY database mode.', err.message);
        isMockDB = true;
      } else {
        console.log('✅ PostgreSQL connected successfully:', res.rows[0].now);
      }
    });
  } catch (e) {
    console.warn('⚠️ Error initializing database connection. Falling back to IN-MEMORY mode.', e.message);
    isMockDB = true;
  }
} else {
  console.log('⚠️ DATABASE_URL not set in .env. Running in IN-MEMORY mock database mode.');
  isMockDB = true;
}

// Robust SQL query wrapper
async function query(text, params) {
  if (isMockDB) {
    return queryMock(text, params);
  }
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('❌ PostgreSQL Query Error:', err.message);
    // If pool is broken mid-flight, fall back gracefully
    throw err;
  }
}

// In-Memory query simulator for easy offline development
async function queryMock(text, params = []) {
  // Console log query for debugging
  // console.log(`[Mock DB Query]: ${text.replace(/\s+/g, ' ')} | Params:`, params);

  const cleanText = text.trim().toLowerCase();

  // Simple Mocking Logic based on standard SQL statements used in our API:
  
  // 1. SELECT * FROM client_leads
  if (cleanText.includes('select') && cleanText.includes('client_leads')) {
    if (cleanText.includes('where id =')) {
      const id = params[0];
      const lead = mockDb.client_leads.find(l => l.id === id);
      return { rows: lead ? [lead] : [] };
    }
    return { rows: mockDb.client_leads };
  }

  // 2. SELECT * FROM job_listings
  if (cleanText.includes('select') && cleanText.includes('job_listings')) {
    if (cleanText.includes('where id =')) {
      const id = params[0];
      const job = mockDb.job_listings.find(j => j.id === id);
      return { rows: job ? [job] : [] };
    }
    return { rows: mockDb.job_listings };
  }

  // 3. SELECT * FROM outreach_history
  if (cleanText.includes('select') && cleanText.includes('outreach_history')) {
    if (cleanText.includes('where lead_id =')) {
      const lead_id = params[0];
      const history = mockDb.outreach_history.filter(h => h.lead_id === lead_id);
      return { rows: history };
    }
    return { rows: mockDb.outreach_history };
  }

  // 3b. SELECT * FROM cron_runs
  if (cleanText.includes('select') && cleanText.includes('cron_runs')) {
    const sortedRuns = [...mockDb.cron_runs].sort((a, b) => new Date(b.run_time) - new Date(a.run_time));
    return { rows: sortedRuns };
  }

  // 3c. SELECT * FROM scholarship_listings
  if (cleanText.includes('select') && cleanText.includes('scholarship_listings')) {
    if (cleanText.includes('where id =')) {
      const id = params[0];
      const sch = mockDb.scholarship_listings.find(s => s.id === id);
      return { rows: sch ? [sch] : [] };
    }
    const sortedSchs = [...mockDb.scholarship_listings].sort((a, b) => b.relevance_score - a.relevance_score);
    return { rows: sortedSchs };
  }

  // 4. INSERT INTO client_leads
  if (cleanText.includes('insert into client_leads')) {
    const newLead = {
      id: `lead-${Date.now()}`,
      business_name: params[0],
      industry: params[1],
      location: params[2],
      website_url: params[3],
      email: params[4],
      phone: params[5],
      lead_score: params[6] || 0,
      digital_audit: typeof params[7] === 'string' ? JSON.parse(params[7]) : params[7] || {},
      status: params[8] || 'New',
      created_at: new Date().toISOString()
    };
    mockDb.client_leads.push(newLead);
    return { rows: [newLead] };
  }

  // 5. UPDATE client_leads (Update status/lead_score etc)
  if (cleanText.includes('update client_leads')) {
    // Basic status update simulation
    if (cleanText.includes('set status =') && cleanText.includes('where id =')) {
      const status = params[0];
      const id = params[1];
      const lead = mockDb.client_leads.find(l => l.id === id);
      if (lead) lead.status = status;
      return { rows: lead ? [lead] : [] };
    }
  }

  // 6. INSERT INTO job_listings
  if (cleanText.includes('insert into job_listings')) {
    const newJob = {
      id: `job-${Date.now()}`,
      company_name: params[0],
      position: params[1],
      salary: params[2],
      location: params[3],
      application_url: params[4],
      job_description: params[5],
      relevance_score: params[6] || 0,
      status: params[7] || 'Discovered',
      cv_generated_path: '',
      cover_letter_text: '',
      created_at: new Date().toISOString()
    };
    // Avoid duplicates
    if (!mockDb.job_listings.some(j => j.application_url === newJob.application_url)) {
      mockDb.job_listings.push(newJob);
    }
    return { rows: [newJob] };
  }

  // 7. UPDATE job_listings
  if (cleanText.includes('update job_listings')) {
    if (cleanText.includes('status =') && cleanText.includes('where id =')) {
      const status = params[0];
      const id = params[1];
      const job = mockDb.job_listings.find(j => j.id === id);
      if (job) job.status = status;
      return { rows: job ? [job] : [] };
    }
    if (cleanText.includes('cv_generated_path =') && cleanText.includes('where id =')) {
      const cv_path = params[0];
      const letter = params[1];
      const id = params[2];
      const job = mockDb.job_listings.find(j => j.id === id);
      if (job) {
        job.cv_generated_path = cv_path;
        job.cover_letter_text = letter;
      }
      return { rows: job ? [job] : [] };
    }
  }

  // 8. INSERT INTO outreach_history
  if (cleanText.includes('insert into outreach_history')) {
    const newOutreach = {
      id: `outreach-${Date.now()}`,
      lead_id: params[0],
      channel: params[1],
      message_content: params[2],
      sent_at: new Date().toISOString(),
      response_received: false
    };
    mockDb.outreach_history.push(newOutreach);
    
    // Auto update lead status to 'Contacted'
    const lead = mockDb.client_leads.find(l => l.id === params[0]);
    if (lead && lead.status === 'New') {
      lead.status = 'Contacted';
    }

    return { rows: [newOutreach] };
  }

  // 9. INSERT INTO cron_runs
  if (cleanText.includes('insert into cron_runs')) {
    const isOutreach = cleanText.includes("'client_outreach'");
    const newRun = {
      id: `cron-${Date.now()}`,
      run_time: new Date().toISOString(),
      pipeline_type: isOutreach ? 'client_outreach' : 'job_scraper',
      status: params[0],
      tasks_executed: typeof params[1] === 'string' ? JSON.parse(params[1]) : params[1] || [],
      log_output: params[2],
      created_at: new Date().toISOString()
    };
    mockDb.cron_runs.push(newRun);
    return { rows: [newRun] };
  }

  // 10. INSERT INTO scholarship_listings
  if (cleanText.includes('insert into scholarship_listings')) {
    const newSch = {
      id: `sch-${Date.now()}`,
      program_name: params[0],
      institution: params[1],
      location: params[2],
      funding_type: params[3] || 'Fully Funded',
      deadline: params[4],
      application_url: params[5],
      description: params[6],
      eligibility_criteria: params[7],
      relevance_score: params[8] || 0,
      status: params[9] || 'Discovered',
      sop_text: '',
      created_at: new Date().toISOString()
    };
    if (!mockDb.scholarship_listings.some(s => s.application_url === newSch.application_url)) {
      mockDb.scholarship_listings.push(newSch);
    }
    return { rows: [newSch] };
  }

  // 11. UPDATE scholarship_listings
  if (cleanText.includes('update scholarship_listings')) {
    if (cleanText.includes('status =') && cleanText.includes('where id =')) {
      const status = params[0];
      const id = params[1];
      const sch = mockDb.scholarship_listings.find(s => s.id === id);
      if (sch) sch.status = status;
      return { rows: sch ? [sch] : [] };
    }
    if (cleanText.includes('sop_text =') && cleanText.includes('where id =')) {
      const sop = params[0];
      const id = params[1];
      const sch = mockDb.scholarship_listings.find(s => s.id === id);
      if (sch) sch.sop_text = sop;
      return { rows: sch ? [sch] : [] };
    }
  }

  // 12. TRUNCATE tables (Clear database)
  if (cleanText.includes('truncate')) {
    mockDb.client_leads = [];
    mockDb.job_listings = [];
    mockDb.scholarship_listings = [];
    mockDb.outreach_history = [];
    mockDb.cron_runs = [];
    return { rows: [] };
  }

  // Return default response
  return { rows: [] };
}

module.exports = {
  query,
  isMockMode: () => isMockDB
};
