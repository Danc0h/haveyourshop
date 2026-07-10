const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const db = require('./db');
const { initDb } = require('./initDb');
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
// 2. CRM TARGET TRACKER APIS
// ----------------------------------------------------

/**
 * Get all target cities & niches.
 */
app.get('/api/crm/targets', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM acquisition_targets ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Create a new target.
 */
app.post('/api/crm/targets', async (req, res) => {
  const { city, niche } = req.body;
  if (!city || !niche) {
    return res.status(400).json({ error: 'City and niche are required.' });
  }
  try {
    const result = await db.query(
      'INSERT INTO acquisition_targets (city, niche, status) VALUES ($1, $2, $3) RETURNING *',
      [city, niche, 'Pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Update target status.
 */
app.put('/api/crm/targets/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await db.query(
      'UPDATE acquisition_targets SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Delete a target.
 */
app.delete('/api/crm/targets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM acquisition_targets WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 2B. CRM CLIENT LEADS APIS
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
 * AI Lead Copy-Paste Parser Endpoint.
 * Parses raw text copied from Google Search/Maps results using Gemini 2.5 Flash,
 * performs live website presence audits, calculates scores, and inserts leads into CRM.
 */
app.post('/api/crm/leads/import-text', async (req, res) => {
  const { rawText, niche, city } = req.body;
  if (!rawText || !niche || !city) {
    return res.status(400).json({ error: 'rawText, niche, and city are required.' });
  }

  try {
    const { parsePastedLeads } = require('./services/gemini');
    const { calculateLeadScore } = require('./services/leadGenerator');
    
    console.log(`📋 [AI Paste Parser] Parsing pasted lead text for: ${niche} in ${city}...`);
    const parsedLeads = await parsePastedLeads(rawText, niche, city);
    console.log(`📋 [AI Paste Parser] Successfully extracted ${parsedLeads.length} business candidates.`);

    const ingestedLeads = [];

    for (const lead of parsedLeads) {
      if (!lead.business_name) continue;

      // Check if lead already exists in DB
      let exists = false;
      try {
        if (lead.website_url && lead.website_url.trim() !== '') {
          const check = await db.query('SELECT 1 FROM client_leads WHERE website_url = $1 OR business_name = $2', [lead.website_url, lead.business_name]);
          exists = check.rows && check.rows.length > 0;
        } else {
          const check = await db.query('SELECT 1 FROM client_leads WHERE business_name = $1', [lead.business_name]);
          exists = check.rows && check.rows.length > 0;
        }
      } catch (e) {
        exists = false;
      }

      if (exists) continue;

      // Conduct audit
      let auditData = {
        no_website: true,
        no_booking: true,
        no_ssl: true,
        outdated_tech: true,
        pagespeed_score: 0
      };

      const hasWebsite = lead.website_url && 
                         lead.website_url.trim() !== '' && 
                         !lead.website_url.toLowerCase().includes('yelp.com') && 
                         !lead.website_url.toLowerCase().includes('yellowpages.com');

      if (hasWebsite) {
        try {
          const cleanUrl = lead.website_url.startsWith('http') ? lead.website_url : `http://${lead.website_url}`;
          const startTime = Date.now();
          const auditRes = await fetch(cleanUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            signal: AbortSignal.timeout(5000)
          });
          const latency = Date.now() - startTime;
          
          auditData.no_website = false;
          auditData.no_ssl = !cleanUrl.startsWith('https://') && !auditRes.url.startsWith('https://');
          auditData.pagespeed_score = Math.max(10, Math.min(100, Math.round(100 - (latency / 50))));

          const html = await auditRes.text();
          const lowerHtml = html.toLowerCase();
          
          if (['booking', 'calendar', 'schedule', 'appoint', 'reserv', 'book online'].some(kw => lowerHtml.includes(kw))) {
            auditData.no_booking = false;
          }
          if (['wp-content', 'wp-includes', 'joomla', 'drupal', 'generator'].some(kw => lowerHtml.includes(kw))) {
            auditData.outdated_tech = true;
          }
        } catch (auditErr) {
          console.warn(`[Audit] Failed to audit website ${lead.website_url}:`, auditErr.message);
          auditData.outdated_tech = true;
          auditData.pagespeed_score = 25;
        }
      }

      const score = calculateLeadScore(auditData);

      // Save to database
      try {
        const queryText = `
          INSERT INTO client_leads (
            business_name, industry, location, website_url, email, phone, lead_score, digital_audit, status, social_media_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'New', $9)
          RETURNING *;
        `;
        const params = [
          lead.business_name,
          niche,
          city,
          hasWebsite ? lead.website_url : '',
          lead.email || null,
          lead.phone || null,
          score,
          JSON.stringify(auditData),
          lead.social_media_url || null
        ];
        const resObj = await db.query(queryText, params);
        if (resObj.rows && resObj.rows.length > 0) {
          ingestedLeads.push(resObj.rows[0]);
        }
      } catch (dbErr) {
        console.error(`❌ DB error saving AI parsed lead ${lead.business_name}:`, dbErr.message);
      }
    }

    res.json({ success: true, count: ingestedLeads.length, leads: ingestedLeads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * AI Lead MHT/HTML File Importer Endpoint.
 * Decodes and parses raw browser MHT or HTML search files using Gemini 2.5 Flash,
 * performs live website audits, deficiency scores, and inserts them into CRM.
 */
app.post('/api/crm/leads/import-file', async (req, res) => {
  const { fileContent, niche, city } = req.body;
  if (!fileContent || !niche || !city) {
    return res.status(400).json({ error: 'fileContent, niche, and city are required.' });
  }

  try {
    const { parsePastedLeads } = require('./services/gemini');
    const { calculateLeadScore } = require('./services/leadGenerator');

    // Decode MHT to clean HTML
    function decodeQuotedPrintable(str) {
      return str
        .replace(/=\r?\n/g, '') // Remove soft line breaks
        .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    }

    function extractHtmlFromMht(content) {
      const boundaryMatch = content.match(/boundary="([^"]+)"/);
      const boundary = boundaryMatch ? boundaryMatch[1] : null;
      if (boundary) {
        const parts = content.split('--' + boundary);
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (part.includes('Content-Type: text/html')) {
            const headerEnd = part.indexOf('\r\n\r\n');
            const body = headerEnd !== -1 ? part.substring(headerEnd + 4) : part;
            return decodeQuotedPrintable(body);
          }
        }
      }
      return content;
    }

    console.log(`📋 [AI File Importer] Decoding file for ${niche} in ${city}...`);
    const cleanHtml = extractHtmlFromMht(fileContent);

    // Strip script, style, svg to minimize tokens
    const miniHtml = cleanHtml
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/svg[\s\S]*?<\/svg>/gi, '')
      .replace(/<link[\s\S]*?>/gi, '')
      .substring(0, 500000); // safety cap to support ~20-30 listings comfortably

    console.log(`📋 [AI File Importer] Parsed clean HTML size: ${miniHtml.length} characters. Forwarding to Gemini...`);
    const parsedLeads = await parsePastedLeads(miniHtml, niche, city);
    console.log(`📋 [AI File Importer] Extracted ${parsedLeads.length} listings from file.`);

    const ingestedLeads = [];

    for (const lead of parsedLeads) {
      if (!lead.business_name) continue;

      let exists = false;
      try {
        if (lead.website_url && lead.website_url.trim() !== '') {
          const check = await db.query('SELECT 1 FROM client_leads WHERE website_url = $1 OR business_name = $2', [lead.website_url, lead.business_name]);
          exists = check.rows && check.rows.length > 0;
        } else {
          const check = await db.query('SELECT 1 FROM client_leads WHERE business_name = $1', [lead.business_name]);
          exists = check.rows && check.rows.length > 0;
        }
      } catch (e) {
        exists = false;
      }

      if (exists) continue;

      // Conduct audit
      let auditData = {
        no_website: true,
        no_booking: true,
        no_ssl: true,
        outdated_tech: true,
        pagespeed_score: 0
      };

      const hasWebsite = lead.website_url && 
                         lead.website_url.trim() !== '' && 
                         !lead.website_url.toLowerCase().includes('yelp.com') && 
                         !lead.website_url.toLowerCase().includes('yellowpages.com');

      if (hasWebsite) {
        try {
          const cleanUrl = lead.website_url.startsWith('http') ? lead.website_url : `http://${lead.website_url}`;
          const startTime = Date.now();
          const auditRes = await fetch(cleanUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            signal: AbortSignal.timeout(5000)
          });
          const latency = Date.now() - startTime;
          
          auditData.no_website = false;
          auditData.no_ssl = !cleanUrl.startsWith('https://') && !auditRes.url.startsWith('https://');
          auditData.pagespeed_score = Math.max(10, Math.min(100, Math.round(100 - (latency / 50))));

          const html = await auditRes.text();
          const lowerHtml = html.toLowerCase();
          
          if (['booking', 'calendar', 'schedule', 'appoint', 'reserv', 'book online'].some(kw => lowerHtml.includes(kw))) {
            auditData.no_booking = false;
          }
          if (['wp-content', 'wp-includes', 'joomla', 'drupal', 'generator'].some(kw => lowerHtml.includes(kw))) {
            auditData.outdated_tech = true;
          }
        } catch (auditErr) {
          console.warn(`[Audit] Failed to audit website ${lead.website_url}:`, auditErr.message);
          auditData.outdated_tech = true;
          auditData.pagespeed_score = 25;
        }
      }

      const score = calculateLeadScore(auditData);

      // Save to database
      try {
        const queryText = `
          INSERT INTO client_leads (
            business_name, industry, location, website_url, email, phone, lead_score, digital_audit, status, social_media_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'New', $9)
          RETURNING *;
        `;
        const params = [
          lead.business_name,
          niche,
          city,
          hasWebsite ? lead.website_url : '',
          lead.email || null,
          lead.phone || null,
          score,
          JSON.stringify(auditData),
          lead.social_media_url || null
        ];
        const resObj = await db.query(queryText, params);
        if (resObj.rows && resObj.rows.length > 0) {
          ingestedLeads.push(resObj.rows[0]);
        }
      } catch (dbErr) {
        console.error(`❌ DB error saving MHT parsed lead ${lead.business_name}:`, dbErr.message);
      }
    }

    res.json({ success: true, count: ingestedLeads.length, leads: ingestedLeads });
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

const jobTracker = require('./services/jobTracker');

/**
 * Stop signal endpoints.
 */
app.post('/api/automation/stop/:type', (req, res) => {
  const { type } = req.params;
  jobTracker.stopJob(type);
  res.json({ success: true, message: `Cancellation signal sent to ${type}.` });
});

/**
 * Trigger remote job scraper pipeline immediately.
 */
app.post('/api/automation/scrape-jobs', async (req, res) => {
  try {
    jobTracker.startJob('job_scraper');
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
  const { niche, country, city } = req.body;
  try {
    jobTracker.startJob('client_outreach');
    const result = await runClientOutreachPipeline(niche, country, city);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/automation/scrape-scholarships', async (req, res) => {
  try {
    jobTracker.startJob('scholarship_scraper');
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
    // 1. Overall
    const leadsResult = await db.query('SELECT status, COUNT(*) FROM client_leads GROUP BY status');
    const jobsResult = await db.query('SELECT status, COUNT(*) FROM job_listings GROUP BY status');
    const scholarshipsResult = await db.query('SELECT status, COUNT(*) FROM scholarship_listings GROUP BY status');

    // 2. Last 7 Days
    const leads7Result = await db.query("SELECT status, COUNT(*) FROM client_leads WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY status");
    const jobs7Result = await db.query("SELECT status, COUNT(*) FROM job_listings WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY status");
    const scholarships7Result = await db.query("SELECT status, COUNT(*) FROM scholarship_listings WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY status");

    // 3. Last 30 Days
    const leads30Result = await db.query("SELECT status, COUNT(*) FROM client_leads WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY status");
    const jobs30Result = await db.query("SELECT status, COUNT(*) FROM job_listings WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY status");
    const scholarships30Result = await db.query("SELECT status, COUNT(*) FROM scholarship_listings WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY status");

    const getStatsStructure = () => ({
      leads: { New: 0, Contacted: 0, Replied: 0, 'Meeting Scheduled': 0, 'Proposal Sent': 0, Won: 0, Lost: 0 },
      jobs: { Discovered: 0, Applied: 0, Interview: 0, Rejected: 0, Offer: 0 },
      scholarships: { Discovered: 0, 'SOP Drafted': 0, Applied: 0, Interview: 0, Accepted: 0, Rejected: 0 }
    });

    const statsOverall = getStatsStructure();
    const stats7Days = getStatsStructure();
    const stats30Days = getStatsStructure();

    leadsResult.rows.forEach(row => { statsOverall.leads[row.status] = parseInt(row.count, 10); });
    jobsResult.rows.forEach(row => { statsOverall.jobs[row.status] = parseInt(row.count, 10); });
    scholarshipsResult.rows.forEach(row => { statsOverall.scholarships[row.status] = parseInt(row.count, 10); });

    leads7Result.rows.forEach(row => { stats7Days.leads[row.status] = parseInt(row.count, 10); });
    jobs7Result.rows.forEach(row => { stats7Days.jobs[row.status] = parseInt(row.count, 10); });
    scholarships7Result.rows.forEach(row => { stats7Days.scholarships[row.status] = parseInt(row.count, 10); });

    leads30Result.rows.forEach(row => { stats30Days.leads[row.status] = parseInt(row.count, 10); });
    jobs30Result.rows.forEach(row => { stats30Days.jobs[row.status] = parseInt(row.count, 10); });
    scholarships30Result.rows.forEach(row => { stats30Days.scholarships[row.status] = parseInt(row.count, 10); });

    res.json({
      overall: statsOverall,
      last7Days: stats7Days,
      last30Days: stats30Days
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Pricing Configurations endpoints.
 */
app.get('/api/crm/pricing-configs', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM pricing_configs ORDER BY template_key');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/crm/pricing-configs', async (req, res) => {
  const { template_key, base_price_one_time, base_price_yearly, base_price_monthly, local_discount_multiplier } = req.body;
  try {
    await db.query(`
      INSERT INTO pricing_configs (template_key, base_price_one_time, base_price_yearly, base_price_monthly, local_discount_multiplier)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (template_key) DO UPDATE SET
        base_price_one_time = EXCLUDED.base_price_one_time,
        base_price_yearly = EXCLUDED.base_price_yearly,
        base_price_monthly = EXCLUDED.base_price_monthly,
        local_discount_multiplier = EXCLUDED.local_discount_multiplier;
    `, [template_key, base_price_one_time, base_price_yearly, base_price_monthly, local_discount_multiplier]);
    res.json({ success: true, message: `Pricing configuration updated for ${template_key}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Granular Deletion endpoints.
 */
app.delete('/api/crm/leads/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM client_leads WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Lead deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/crm/jobs/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM job_listings WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Job deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/crm/scholarships/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM scholarship_listings WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Scholarship deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Clear the database (Purge all tables).
 */
app.post('/api/crm/clear-database', async (req, res) => {
  try {
    await db.query('TRUNCATE TABLE client_leads, job_listings, scholarship_listings, outreach_history, cron_runs RESTART IDENTITY CASCADE');
    res.json({ success: true, message: 'Database cleared successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 [Server] Express API server running on port ${PORT}`);
  console.log(`ℹ️ [Database] Running in ${db.isMockMode() ? 'IN-MEMORY MOCK' : 'POSTGRESQL'} mode`);
});
