const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const db = require('./db');
const initDb = require('./initDb');
const { generateCoverLetter, generateClientOutreach, computeScholarshipRelevance, generateSopOrPitch } = require('./services/gemini');
const { scrapeRemotive } = require('./services/jobScraper');
const { discoverLeads, auditWebsite, calculateLeadScore } = require('./services/leadGenerator');
const { scrapeScholarships } = require('./services/scholarshipScraper');
const { runJobScraperPipeline, runClientOutreachPipeline } = require('./services/acquisition');
const { sendBusinessEmail } = require('./services/email');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite application
app.use(cors());
app.use(express.json());

// Initialize Database schema on startup
initDb();

// Schedule acquisition pipelines to run daily at 9:30 AM system time
cron.schedule('30 9 * * *', async () => {
  console.log('⏰ [Cron] Daily Job Scraper pipeline triggered at 09:30 AM...');
  try {
    const res = await runJobScraperPipeline();
    console.log(`✅ [Cron] Job Scraper complete. Status: ${res.status}`);
  } catch (err) {
    console.error('❌ [Cron] Job Scraper pipeline error:', err.message);
  }
  
  console.log('⏰ [Cron] Daily Client Outreach pipeline triggered at 09:30 AM...');
  try {
    const res = await runClientOutreachPipeline();
    console.log(`✅ [Cron] Client Outreach complete. Status: ${res.status}`);
  } catch (err) {
    console.error('❌ [Cron] Client Outreach pipeline error:', err.message);
  }
});

// ----------------------------------------------------
// 1. PUBLIC WEBSITE INBOUND LEADS
// ----------------------------------------------------

/**
 * Capture inquiry from Have Your Shop Online contact form.
 */
app.post('/api/website/contact', async (req, res) => {
  const { name, email, company, service, message } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  try {
    const industry = service || 'General';
    const auditData = { no_website: false, requested_service: service, user_message: message };
    const score = 40; // Default inbound interest score

    const queryText = `
      INSERT INTO client_leads (
        business_name, industry, location, website_url, email, phone, lead_score, digital_audit, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const params = [
      company || name,
      industry,
      'Inbound Web',
      company ? `${company.toLowerCase().replace(/\s+/g, '')}.com` : '',
      email,
      '',
      score,
      JSON.stringify(auditData),
      'New'
    ];

    const result = await db.query(queryText, params);
    
    // Simulate auto-alert / notification
    console.log(`✉️ [Inbound Alert] New Lead Captured: "${name}" representing "${company || 'Self'}"`);
    
    // Send immediate email notification to developer
    try {
      const emailText = `Hello Dancun,

You have received a new inbound lead from your portfolio website's contact form!

Lead Details:
- Name: ${name}
- Email: ${email}
- Company: ${company || 'N/A'}
- Service Requested: ${service || 'General'}
- Date: ${new Date().toLocaleString()}

Message:
"${message || 'No message provided.'}"

You can view this lead and manage it in your CRM panel.

Best regards,
Antigravity SWE Bot`;

      const emailHtml = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #fcfcfc;">
  <h2 style="color: #4F46E5; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px;">✉️ New Inbound Lead Captured</h2>
  <p><strong>Name:</strong> ${name}</p>
  <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
  <p><strong>Company:</strong> ${company || 'N/A'}</p>
  <p><strong>Service Requested:</strong> ${service || 'General'}</p>
  <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
  
  <div style="background-color: #F9FAFB; border-left: 4px solid #4F46E5; padding: 10px 15px; margin: 15px 0;">
    <p style="margin: 0; font-style: italic; color: #374151;">"${message || 'No message provided.'}"</p>
  </div>
  
  <p>You can view and manage this lead in your <a href="http://localhost:5173" style="color: #4F46E5;">CRM panel Dashboard</a>.</p>
</div>`;

      await sendBusinessEmail({
        subject: `[CRM Alert] New Inbound Lead: ${name} (${company || 'Self'})`,
        text: emailText,
        html: emailHtml
      });
    } catch (emailErr) {
      console.error('Failed to send inbound lead notification email:', emailErr.message);
    }
    
    res.status(201).json({ success: true, lead: result.rows[0] });
  } catch (err) {
    console.error('❌ Website Lead Capture Failed:', err.message);
    res.status(500).json({ error: 'Database entry failed.' });
  }
});


// ----------------------------------------------------
// 2. CRM CLIENT LEADS APIS
// ----------------------------------------------------

/**
 * Get all client leads.
 */
app.get('/api/crm/leads', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM client_leads ORDER BY lead_score DESC, created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Insert a lead manually into CRM.
 */
app.post('/api/crm/leads', async (req, res) => {
  const { business_name, industry, location, website_url, email, phone } = req.body;
  if (!business_name) {
    return res.status(400).json({ error: 'Business name is required.' });
  }

  try {
    const audit = await auditWebsite(website_url);
    const score = calculateLeadScore(audit);

    const queryText = `
      INSERT INTO client_leads (
        business_name, industry, location, website_url, email, phone, lead_score, digital_audit, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const params = [business_name, industry, location, website_url, email, phone, score, JSON.stringify(audit), 'New'];
    const result = await db.query(queryText, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Update CRM lead stage.
 */
app.put('/api/crm/leads/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const result = await db.query(
      'UPDATE client_leads SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Generate customized client outreach draft using Gemini API.
 */
app.post('/api/crm/leads/:id/outreach-draft', async (req, res) => {
  const { id } = req.params;
  try {
    const leadResult = await db.query('SELECT * FROM client_leads WHERE id = $1', [id]);
    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    
    const lead = leadResult.rows[0];
    const draft = await generateClientOutreach(lead.business_name, lead.industry, lead.digital_audit);
    
    res.json({ draft });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Log outreach sent.
 */
app.post('/api/crm/leads/:id/outreach', async (req, res) => {
  const { id } = req.params;
  const { channel, message_content } = req.body;

  if (!channel || !message_content) {
    return res.status(400).json({ error: 'Channel and message content are required.' });
  }

  try {
    const result = await db.query(
      'INSERT INTO outreach_history (lead_id, channel, message_content) VALUES ($1, $2, $3) RETURNING *',
      [id, channel, message_content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ----------------------------------------------------
// 3. CRM JOB BOARDS APIS
// ----------------------------------------------------

/**
 * Get all remote jobs.
 */
app.get('/api/crm/jobs', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM job_listings ORDER BY relevance_score DESC, created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Update remote job status.
 */
app.put('/api/crm/jobs/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await db.query(
      'UPDATE job_listings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job listing not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Generate tailored cover letter/CV info using Gemini API.
 */
app.post('/api/crm/jobs/:id/generate', async (req, res) => {
  const { id } = req.params;
  try {
    const jobResult = await db.query('SELECT * FROM job_listings WHERE id = $1', [id]);
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    const job = jobResult.rows[0];
    const letter = await generateCoverLetter(job.company_name, job.position, job.job_description);
    
    // Simulate creating tailored PDF CV path (store mock path in DB)
    const cvPath = `/resumes/cv_tailored_${job.company_name.toLowerCase().replace(/\s+/g, '_')}.pdf`;
    
    const updateResult = await db.query(
      'UPDATE job_listings SET cv_generated_path = $1, cover_letter_text = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [cvPath, letter, id]
    );

    res.json(updateResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ----------------------------------------------------
// 3c. CRM SCHOLARSHIP & SPONSORSHIP APIS
// ----------------------------------------------------

/**
 * Get all scholarships.
 */
app.get('/api/crm/scholarships', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM scholarship_listings ORDER BY relevance_score DESC, created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Update scholarship status.
 */
app.put('/api/crm/scholarships/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await db.query(
      'UPDATE scholarship_listings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scholarship not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Tailor Statement of Purpose or Advisor Email Pitch using Gemini.
 */
app.post('/api/crm/scholarships/:id/generate', async (req, res) => {
  const { id } = req.params;
  try {
    const schResult = await db.query('SELECT * FROM scholarship_listings WHERE id = $1', [id]);
    if (schResult.rows.length === 0) {
      return res.status(404).json({ error: 'Scholarship listing not found.' });
    }

    const sch = schResult.rows[0];
    const sop = await generateSopOrPitch(sch.program_name, sch.institution, sch.description, sch.funding_type);

    const updateResult = await db.query(
      'UPDATE scholarship_listings SET sop_text = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [sop, id]
    );

    res.json(updateResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ----------------------------------------------------
// 4. AUTOMATION MANUAL TRIGGERS
// ----------------------------------------------------

/**
 * Trigger remote job scraper pipeline immediately.
 */
app.post('/api/automation/scrape-jobs', async (req, res) => {
  try {
    const result = await runJobScraperPipeline();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Trigger client lead scanning outreach crawler immediately.
 */
app.post('/api/automation/crawl-leads', async (req, res) => {
  try {
    const result = await runClientOutreachPipeline();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Trigger scholarship and advisor listing scrape immediately.
 */
app.post('/api/automation/scrape-scholarships', async (req, res) => {
  try {
    const result = await scrapeScholarships();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Retrieve database logs of the cron job runs.
 */
app.get('/api/crm/cron-runs', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM cron_runs ORDER BY run_time DESC LIMIT 20');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ----------------------------------------------------
// 5. CRM ANALYTICS & DASHBOARD METRICS
// ----------------------------------------------------

/**
 * Aggregate pipeline metrics for dashboards.
 */
app.get('/api/crm/metrics', async (req, res) => {
  try {
    const leadsResult = await db.query('SELECT status, COUNT(*) FROM client_leads GROUP BY status');
    const jobsResult = await db.query('SELECT status, COUNT(*) FROM job_listings GROUP BY status');
    const outreachResult = await db.query('SELECT channel, COUNT(*) FROM outreach_history GROUP BY channel');
    const scholarshipsResult = await db.query('SELECT status, COUNT(*) FROM scholarship_listings GROUP BY status');
    
    // Structure stats
    const stats = {
      leads: { New: 0, Contacted: 0, Replied: 0, 'Meeting Scheduled': 0, 'Proposal Sent': 0, Won: 0, Lost: 0 },
      jobs: { Discovered: 0, Applied: 0, Interview: 0, Rejected: 0, Offer: 0 },
      outreach: { Email: 0, LinkedIn: 0, WhatsApp: 0, 'Contact Form': 0 },
      scholarships: { Discovered: 0, 'SOP Drafted': 0, Applied: 0, Interview: 0, Accepted: 0, Rejected: 0 }
    };

    leadsResult.rows.forEach(row => { stats.leads[row.status] = parseInt(row.count, 10); });
    jobsResult.rows.forEach(row => { stats.jobs[row.status] = parseInt(row.count, 10); });
    outreachResult.rows.forEach(row => { stats.outreach[row.channel] = parseInt(row.count, 10); });
    scholarshipsResult.rows.forEach(row => { stats.scholarships[row.status] = parseInt(row.count, 10); });

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 [Server] Express API server running on port ${PORT}`);
  console.log(`ℹ️ [Database] Running in ${db.isMockMode() ? 'IN-MEMORY MOCK' : 'POSTGRESQL'} mode`);
});
