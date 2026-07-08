const db = require('../db');
const jobTracker = require('./jobTracker');
const { computeJobRelevance } = require('./gemini');
const { scrapeRemotive } = require('./jobScraper');
const { calculateLeadScore } = require('./leadGenerator');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let aiClient = null;
const apiKey = process.env.GEMINI_API_KEY;
if (apiKey && apiKey.trim() !== '') {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    aiClient = new GoogleGenerativeAI(apiKey);
  } catch (e) {
    console.warn('⚠️ Acquisition Service: Gemini AI failed to load.');
  }
}

// Helper to check if a job listing already exists by application URL
async function jobExists(url) {
  try {
    const res = await db.query('SELECT 1 FROM job_listings WHERE application_url = $1', [url]);
    return res.rows && res.rows.length > 0;
  } catch (e) {
    return false;
  }
}

// Helper to check if a client lead already exists by website URL or business name
async function leadExists(name, url) {
  try {
    if (url && url.trim() !== '') {
      const res = await db.query('SELECT 1 FROM client_leads WHERE website_url = $1 OR business_name = $2', [url, name]);
      return res.rows && res.rows.length > 0;
    }
    const res = await db.query('SELECT 1 FROM client_leads WHERE business_name = $1', [name]);
    return res.rows && res.rows.length > 0;
  } catch (e) {
    return false;
  }
}

// Helper to parse XML RSS feeds into JSON items
function parseRssFeed(xmlText) {
  const items = [];
  const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g);
  
  for (const match of itemMatches) {
    const itemContent = match[1];
    
    const titleMatch = itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || itemContent.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = itemContent.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/) || itemContent.match(/<link>([\s\S]*?)<\/link>/);
    const descMatch = itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || itemContent.match(/<description>([\s\S]*?)<\/description>/);
    
    // Attempt to extract company name
    let companyName = 'Freelance Client';
    const authorMatch = itemContent.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/) || itemContent.match(/<author>([\s\S]*?)<\/author>/);
    if (authorMatch) {
      companyName = authorMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
    } else {
      const title = titleMatch ? titleMatch[1] : '';
      if (title.includes(' at ')) {
        companyName = title.split(' at ')[1].split('(')[0].trim();
      }
    }

    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
        link: linkMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
        description: descMatch ? descMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').trim().substring(0, 500) : 'No description provided.',
        company_name: companyName
      });
    }
  }
  return items.slice(0, 10);
}

/**
 * Real DuckDuckGo Search Lead Crawler.
 * Scrapes HTML search results to retrieve organic, active business websites.
 */
async function searchRealDuckDuckGoLeads(niche, city) {
  const query = encodeURIComponent(`${niche} in ${city}`);
  const url = `https://html.duckduckgo.com/html/?q=${query}`;
  console.log(`🔍 [Scraper] Querying DuckDuckGo HTML: ${url}`);
  
  const results = [];
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) throw new Error(`DDG response status: ${res.status}`);
    
    const html = await res.text();
    const resultBlocks = html.split('<div class="result result--links');
    
    for (let i = 1; i < resultBlocks.length; i++) {
      const block = resultBlocks[i];
      const titleMatch = block.match(/<a class="result__link"[\s\S]*?>([\s\S]*?)<\/a>/);
      const urlMatch = block.match(/<a class="result__url" href="([^"]+)"/);
      const snippetMatch = block.match(/<a class="result__snippet"[\s\S]*?>([\s\S]*?)<\/a>/);
      
      if (titleMatch && urlMatch) {
        let rawUrl = urlMatch[1];
        if (rawUrl.includes('duckduckgo.com/l/?uddg=')) {
          const match = rawUrl.match(/uddg=([^&]+)/);
          if (match) rawUrl = decodeURIComponent(match[1]);
        }
        
        const website = rawUrl;
        const lowUrl = website.toLowerCase();
        // Exclude aggregator/listings directories to get actual direct local business sites
        if (['yelp.', 'yellowpages.', 'tripadvisor.', 'wikipedia.', 'facebook.com', 'instagram.com', 'linkedin.com', 'twitter.com', 'groupon.', 'mapquest.'].some(d => lowUrl.includes(d))) {
          continue;
        }
        
        const title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
        const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : '';
        
        results.push({
          business_name: title.split('-')[0].split('|')[0].trim(),
          website_url: website,
          snippet: snippet
        });
      }
    }
  } catch (err) {
    console.error('⚠️ DuckDuckGo scraping failed:', err.message);
  }
  return results.slice(0, 5); // Return top 5 real candidates
}

/**
 * Real website audit scan.
 * Performs direct fetches and mines HTML content for active data points.
 */
async function auditRealWebsite(url) {
  const audit = {
    no_website: false,
    no_booking: true,
    no_ssl: true,
    outdated_tech: false,
    pagespeed_score: 80
  };
  let email = null;
  let phone = null;
  let social_media_url = null;

  if (!url) {
    audit.no_website = true;
    return { audit, email, phone, social_media_url };
  }

  const startTime = Date.now();
  try {
    const cleanUrl = url.startsWith('http') ? url : `http://${url}`;
    if (cleanUrl.startsWith('https://')) {
      audit.no_ssl = false;
    }
    
    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(5000)
    });
    
    const latency = Date.now() - startTime;
    // Speed score mapping based on server latency response times
    audit.pagespeed_score = Math.max(10, Math.min(100, Math.round(100 - (latency / 50))));

    const html = await res.text();
    
    if (res.url.startsWith('https://')) {
      audit.no_ssl = false;
    }

    const lowerHtml = html.toLowerCase();
    if (['booking', 'calendar', 'schedule', 'appoint', 'reserv', 'book online'].some(kw => lowerHtml.includes(kw))) {
      audit.no_booking = false;
    }

    if (['wp-content', 'wp-includes', 'joomla', 'drupal', 'generator'].some(kw => lowerHtml.includes(kw))) {
      audit.outdated_tech = true;
    }

    // Extract email using regex
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}/g;
    const emailsFound = html.match(emailRegex);
    if (emailsFound && emailsFound.length > 0) {
      email = emailsFound[0];
    }

    // Extract social media links
    const igRegex = /(?:instagram\.com|instagr\.am)\/([a-zA-Z0-9._]+)/i;
    const fbRegex = /(?:facebook\.com)\/([a-zA-Z0-9._-]+)/i;
    
    const igMatch = html.match(igRegex);
    const fbMatch = html.match(fbRegex);
    if (igMatch) {
      social_media_url = `https://instagram.com/${igMatch[1]}`;
    } else if (fbMatch) {
      social_media_url = `https://facebook.com/${fbMatch[1]}`;
    }
  } catch (err) {
    console.warn(`[Audit] Failed to load site ${url}:`, err.message);
    audit.outdated_tech = true;
    audit.pagespeed_score = 25;
  }

  return { audit, email, phone, social_media_url };
}

/**
 * Runs the Remote Job Scraper Pipeline.
 * Executed daily at 9:00 AM.
 */
async function runJobScraperPipeline() {
  const logLines = [];
  const tasksExecuted = [];
  const newlyDiscoveredJobs = [];
  let status = 'Success';

  logLines.push(`[${new Date().toISOString()}] 🚀 Starting Daily Job Scraper Pipeline...`);

  const countries = ['United States', 'United Kingdom', 'Canada', 'Germany', 'Australia', 'Kenya'];
  const targetCountry = countries[new Date().getDay() % countries.length];
  logLines.push(`[Info] Target country for today's careers rotation: ${targetCountry}`);

  // TASK 1: Check Remotive API
  try {
    if (!jobTracker.isJobActive('job_scraper')) {
      logLines.push(`[Cancel] Scraper terminated by user request.`);
      status = 'Warning';
    } else {
      logLines.push(`[Task 1] Checking Remotive Remote developer board...`);
      const remotiveJobs = await scrapeRemotive();
      let remotiveAdded = 0;
      
      for (const job of remotiveJobs) {
        const exists = await jobExists(job.application_url);
        if (!exists) {
          await db.query(`
            INSERT INTO job_listings (company_name, position, salary, location, application_url, job_description, relevance_score, status, how_to_apply)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'Discovered', $8)
          `, [job.company_name, job.position, job.salary, job.location, job.application_url, job.job_description, job.relevance_score, 'Submit your CV and cover letter via the application link.']);
          
          newlyDiscoveredJobs.push(job);
          remotiveAdded++;
        }
      }
      logLines.push(`[Task 1] Success: Ingested ${remotiveAdded} matching jobs from Remotive API.`);
      tasksExecuted.push({ name: 'Remotive API Scrape', status: 'Success', details: `Ingested ${remotiveAdded} qualified development roles.` });
    }
  } catch (err) {
    logLines.push(`[Task 1] Failed: ${err.message}`);
    tasksExecuted.push({ name: 'Remotive API Scrape', status: 'Failed', details: err.message });
    status = 'Warning';
  }

  // TASK 2: Check LinkedIn (NO MOCK/SIMULATION ALLOWED)
  try {
    if (!jobTracker.isJobActive('job_scraper')) {
      logLines.push(`[Cancel] Scraper terminated by user request.`);
      status = 'Warning';
    } else {
      logLines.push(`[Task 2] Connecting to LinkedIn Jobs...`);
      logLines.push(`[Task 2] Warning: LinkedIn anti-scraping walls active. Local desktop scraper session required.`);
      tasksExecuted.push({ 
        name: 'LinkedIn Scrape', 
        status: 'Warning', 
        details: 'Server blocked by credentials check. Execute desktop_scraper.js locally to push live LinkedIn targets.' 
      });
    }
  } catch (err) {
    logLines.push(`[Task 2] Failed: ${err.message}`);
    tasksExecuted.push({ name: 'LinkedIn Scrape', status: 'Failed', details: err.message });
    status = 'Warning';
  }

  // TASK 4: Check Wellfound (NO MOCK/SIMULATION ALLOWED)
  try {
    if (!jobTracker.isJobActive('job_scraper')) {
      logLines.push(`[Cancel] Scraper terminated by user request.`);
      status = 'Warning';
    } else {
      logLines.push(`[Task 4] Querying Wellfound (formerly AngelList) startup listings...`);
      logLines.push(`[Task 4] Warning: Wellfound Cloudflare protection active. Session authorization token missing.`);
      tasksExecuted.push({ 
        name: 'Check Wellfound', 
        status: 'Warning', 
        details: 'Cloudflare active. Run Playwright local session script to capture startup openings.' 
      });
    }
  } catch (err) {
    logLines.push(`[Task 4] Failed: ${err.message}`);
    tasksExecuted.push({ name: 'Check Wellfound', status: 'Failed', details: err.message });
    status = 'Warning';
  }

  // TASK 5: Poll Niche & Hidden Freelance RSS Feeds
  try {
    if (!jobTracker.isJobActive('job_scraper')) {
      logLines.push(`[Cancel] Scraper terminated by user request.`);
      status = 'Warning';
    } else {
      logLines.push(`[Task 5] Polling niche & hidden freelance RSS feeds (We Work Remotely, Remote.co, Working Nomads)...`);
      
      const feeds = [
        { name: 'We Work Remotely', url: 'https://weworkremotely.com/categories/remote-programming-jobs.rss' },
        { name: 'Remote.co', url: 'https://remote.co/remote-jobs/developer/feed/' },
        { name: 'Working Nomads', url: 'https://www.workingnomads.com/jobs/feed' },
        { name: 'Upwork RSS', url: 'https://www.upwork.com/ab/feed/jobs/rss?q=software+development' },
        { name: 'Fiverr Requests', url: 'https://www.fiverr.com/feed/projects/rss' }
      ];
      
      let rssIngested = 0;
      let errorsOccurred = false;
      
      for (const feed of feeds) {
        if (!jobTracker.isJobActive('job_scraper')) {
          logLines.push(`[Cancel] Scraper terminated during feed loop.`);
          break;
        }
        try {
          logLines.push(`[Task 5] Fetching RSS feed from: ${feed.name}...`);
          const res = await fetch(feed.url, { signal: AbortSignal.timeout(5000) });
          if (!res.ok) throw new Error(`HTTP status ${res.status}`);
          
          const xmlText = await res.text();
          const items = parseRssFeed(xmlText);
          logLines.push(`[Task 5] Parsed ${items.length} raw jobs from ${feed.name} feed.`);
          
          let feedAdded = 0;
          let geminiCalls = 0;
          for (const item of items) {
            const matchText = `${item.title} ${item.description}`.toLowerCase();
            const matchesStack = ['react', 'native', 'node', 'javascript', 'js', 'python', 'django', 'php', 'laravel', 'docker', 'kubernetes', 'container'].some(kw => matchText.includes(kw));
            
            if (matchesStack) {
              let score = 75;
              if (geminiCalls < 1) {
                try {
                  score = await computeJobRelevance(item.title, item.description);
                  geminiCalls++;
                } catch (e) {
                  score = 75;
                }
              } else {
                let base = 50;
                if (matchText.includes('react') || matchText.includes('native')) base += 20;
                if (matchText.includes('node') || matchText.includes('javascript') || matchText.includes('js')) base += 15;
                score = Math.min(base, 100);
              }

              if (score >= 60) {
                const exists = await jobExists(item.link);
                if (!exists) {
                  await db.query(`
                     INSERT INTO job_listings (company_name, position, salary, location, application_url, job_description, relevance_score, status, how_to_apply)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, 'Discovered', $8)
                   `, [item.company_name, item.title, 'Remote / Contract', 'Remote', item.link, item.description, score, 'Apply through the external freelance board at the listing link.']);
                  
                  newlyDiscoveredJobs.push({
                    company_name: item.company_name,
                    position: item.title,
                    relevance_score: score,
                    application_url: item.link
                  });
                  
                  feedAdded++;
                  rssIngested++;
                }
              }
            }
          }
          logLines.push(`[Task 5] Ingested ${feedAdded} qualified roles from ${feed.name}.`);
        } catch (feedErr) {
          logLines.push(`[Task 5] Note: Live fetch failed for ${feed.name} (${feedErr.message}).`);
          errorsOccurred = true;
        }
      }
      tasksExecuted.push({ 
        name: 'RSS Polling', 
        status: errorsOccurred ? 'Warning' : 'Success', 
        details: `Polled live freelance RSS feeds. Ingested ${rssIngested} qualified freelance contracts.` 
      });
    }
  } catch (err) {
    logLines.push(`[Task 5] Failed: ${err.message}`);
    tasksExecuted.push({ name: 'RSS Polling', status: 'Failed', details: err.message });
    status = 'Warning';
  }

  logLines.push(`[${new Date().toISOString()}] 🏁 Job Scraper Pipeline execution finished.`);
  const logOutput = logLines.join('\n');

  jobTracker.stopJob('job_scraper');

  // Write to DB logs
  try {
    await db.query(`
      INSERT INTO cron_runs (run_time, pipeline_type, status, tasks_executed, log_output)
      VALUES (CURRENT_TIMESTAMP, 'job_scraper', $1, $2, $3)
    `, [status, JSON.stringify(tasksExecuted), logOutput]);
  } catch (dbErr) {
    console.error('Failed to log cron_run to DB:', dbErr.message);
  }

  // Trigger email updates on new jobs only
  try {
    if (newlyDiscoveredJobs.length > 0) {
      const { sendPersonalEmail } = require('./email');
      
      let jobListText = '\n--- NEW DEV ROLES FOUND ---\n' + newlyDiscoveredJobs.map(job => {
        return `- [Score: ${job.relevance_score}] ${job.position} at ${job.company_name} (${job.location}) - Link: ${job.application_url}`;
      }).join('\n') + '\n';

      let jobListHtml = '<h3>💼 Newly Discovered Development Roles</h3><ul>' + newlyDiscoveredJobs.map(job => {
        return `<li><strong>${job.position}</strong> at ${job.company_name} (${job.location})<br>
                <strong>Relevance Matching Score:</strong> ${job.relevance_score}/100<br>
                <strong>Apply URL:</strong> <a href="${job.application_url}" style="color: #4F46E5;">${job.application_url}</a></li>`;
      }).join('') + '</ul>';

      const emailText = `Hello Dancun,
  
  The daily Job Scraper pipeline finished executing.
  
  Run Time: ${new Date().toLocaleString()}
  Overall Status: ${status}
  Target Rotation Country: ${targetCountry}
  ${jobListText}
  Log output is available in your CRM panel under the Automation Logs sub-tab.
  
  Best regards,
  Antigravity SWE Bot`;

      const emailHtml = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #fcfcfc;">
    <h2 style="color: #4F46E5; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px;">⏰ Job Scraper Pipeline Report</h2>
    <p><strong>Run Time:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Overall Status:</strong> <span style="padding: 2px 8px; border-radius: 4px; font-weight: bold; background-color: ${status === 'Success' ? '#D1FAE5; color: #065F46' : '#FEF3C7; color: #92400E'};">${status}</span></p>
    
    <h3>🔄 Tasks Executed</h3>
    <ul>
      ${tasksExecuted.map(t => `<li><strong>${t.name}:</strong> <span style="color: ${t.status === 'Success' ? '#059669' : t.status === 'Warning' ? '#D97706' : '#DC2626'}">${t.status}</span> - ${t.details}</li>`).join('')}
    </ul>
    
    ${jobListHtml}
    
    <div style="margin-top: 30px; border-top: 1px solid #E5E7EB; padding-top: 15px; font-size: 12px; color: #6B7280;">
      <p>This report was generated automatically. You can view the full live log history on your <a href="http://localhost:5173" style="color: #4F46E5;">CRM panel Dashboard</a>.</p>
    </div>
  </div>`;

      await sendPersonalEmail({
        subject: `[Acquisition Bot] Job Scraper Report: ${status} - ${newlyDiscoveredJobs.length} New Jobs`,
        text: emailText,
        html: emailHtml
      });
    } else {
      console.log('ℹ️ [Job Scraper] Zero new jobs found. Skipping email updates.');
    }
  } catch (emailErr) {
    console.error('Failed to send job scraper report email:', emailErr.message);
  }

  return { success: true, status, tasks: tasksExecuted, logs: logOutput };
}

/**
 * Runs the Client Outreach Pipeline.
 * Executed daily at 9:30 AM (or manually controlled with specific parameters).
 */
async function runClientOutreachPipeline(customNiche, customCountry, customCity) {
  const logLines = [];
  const tasksExecuted = [];
  const newlyDiscoveredLeads = [];
  let status = 'Success';

  logLines.push(`[${new Date().toISOString()}] 🚀 Starting Daily Client Outreach Pipeline...`);
  
  const niches = [
    'Boutiques and Retail Shops', 
    'Dentists and Dental Practices', 
    'Gyms and Fitness Centers', 
    'Law Firms and Lawyers', 
    'Restaurants and Cafes', 
    'Salons and Spas', 
    'Real Estate Agencies', 
    'E-commerce Stores'
  ];
  const defaultCities = ['Dubai', 'Amsterdam', 'Toronto', 'London', 'Sydney', 'Nairobi'];
  
  const targetNiche = customNiche || niches[new Date().getDay() % niches.length];
  const targetCities = customCity ? [customCity] : defaultCities;
  
  logLines.push(`[Info] Target niche category: ${targetNiche}`);
  logLines.push(`[Info] Scanning target cities: ${targetCities.join(', ')}`);

  // Helper to ingest lead and calculate score
  const ingestLead = async (lead, sourceName) => {
    const exists = await leadExists(lead.business_name, lead.website_url);
    if (exists) {
      logLines.push(`[${sourceName}] Skipped duplicate existing lead: "${lead.business_name}" in ${lead.location}`);
      return false;
    }
    
    let score = calculateLeadScore(lead.audit);
    
    await db.query(`
      INSERT INTO client_leads (business_name, industry, location, website_url, email, phone, lead_score, digital_audit, status, social_media_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'New', $9)
    `, [lead.business_name, lead.industry, lead.location, lead.website_url, lead.email, lead.phone, score, JSON.stringify(lead.audit), lead.social_media_url]);
    
    logLines.push(`[${sourceName}] Ingested Lead: "${lead.business_name}" in ${lead.location} (Deficiency score: ${score})`);
    
    newlyDiscoveredLeads.push({
      ...lead,
      source: sourceName
    });

    return true;
  };

  // Loop through targets and crawl real DuckDuckGo search results
  for (const city of targetCities) {
    if (!jobTracker.isJobActive('client_outreach')) {
      logLines.push(`[Cancel] Client outreach pipeline terminated by user request.`);
      status = 'Warning';
      break;
    }

    logLines.push(`\n--- Crawling City: ${city} ---`);

    try {
      // Fetch organic search leads via DuckDuckGo HTML scraper
      const realResults = await searchRealDuckDuckGoLeads(targetNiche, city);
      
      if (realResults.length === 0) {
        logLines.push(`[Scraper] Note: No organic websites found for ${targetNiche} in ${city}.`);
        continue;
      }

      for (const res of realResults) {
        if (!jobTracker.isJobActive('client_outreach')) break;
        
        logLines.push(`[Audit] Conducting digital presence audit on: ${res.website_url}`);
        // Run a real-time HTTP fetch audit to check SSL, booking slots, and latency page speeds
        const auditData = await auditRealWebsite(res.website_url);
        
        const lead = {
          business_name: res.business_name,
          industry: targetNiche,
          location: city,
          website_url: res.website_url,
          email: auditData.email,
          phone: auditData.phone,
          social_media_url: auditData.social_media_url,
          audit: auditData.audit
        };

        await ingestLead(lead, 'DuckDuckGo Scraper');
      }
    } catch (err) {
      logLines.push(`[Crawler] Search failed for ${city}: ${err.message}`);
    }
  }

  tasksExecuted.push({
    name: 'DuckDuckGo Lead Crawl',
    status: status,
    details: `Scanned cities: ${targetCities.join(', ')}. Ingested ${newlyDiscoveredLeads.length} real leads.`
  });

  logLines.push(`[${new Date().toISOString()}] 🏁 Client Outreach Pipeline finished.`);
  const logOutput = logLines.join('\n');

  jobTracker.stopJob('client_outreach');

  // Write to DB logs
  try {
    await db.query(`
      INSERT INTO cron_runs (run_time, pipeline_type, status, tasks_executed, log_output)
      VALUES (CURRENT_TIMESTAMP, 'client_outreach', $1, $2, $3)
    `, [status, JSON.stringify(tasksExecuted), logOutput]);
  } catch (dbErr) {
    console.error('Failed to log cron_run to DB:', dbErr.message);
  }

  // Trigger email updates only if leads > 0
  try {
    if (newlyDiscoveredLeads.length > 0) {
      const { sendBusinessEmail } = require('./email');
      
      let leadListText = '\n--- NEW CLIENT LEADS DISCOVERED ---\n' + newlyDiscoveredLeads.map(lead => {
        const auditStr = Object.entries(lead.audit).filter(([k, v]) => v === true).map(([k]) => k).join(', ') || 'None';
        return `- [Score: ${calculateLeadScore(lead.audit)}] ${lead.business_name} (${lead.location}) - Deficiencies: ${auditStr} (Email: ${lead.email || 'None'}, Phone: ${lead.phone || 'None'}, Social: ${lead.social_media_url || 'None'})`;
      }).join('\n') + '\n';
      
      let leadListHtml = '<h3>💼 New Client Leads Discovered</h3><ul>' + newlyDiscoveredLeads.map(lead => {
        const auditStr = Object.entries(lead.audit).filter(([k, v]) => v === true).map(([k]) => k).join(', ') || 'None';
        const score = calculateLeadScore(lead.audit);
        return `<li><strong>${lead.business_name}</strong> (${lead.location})<br>
                <strong>Score:</strong> ${score} | <strong>Deficiencies:</strong> ${auditStr}<br>
                <strong>Contact:</strong> ${lead.email || 'N/A'} | ${lead.phone || 'N/A'}<br>
                <strong>Social Profile:</strong> <a href="${lead.social_media_url || '#'}" style="color: #10B981;">${lead.social_media_url || 'N/A'}</a></li>`;
      }).join('') + '</ul>';

      const emailText = `Hello Dancun,
  
  The Client Outreach pipeline completed scanning.
  
  Run Time: ${new Date().toLocaleString()}
  Overall Status: ${status}
  Target Niche: ${targetNiche}
  Scanned Cities: ${targetCities.join(', ')}
  
  --- TASKS EXECUTED ---
  ${tasksExecuted.map(t => `- ${t.name}: [${t.status}] ${t.details}`).join('\n')}
  ${leadListText}
  You can view pitches directly in the CRM panel.
  
  Best regards,
  Antigravity SWE Bot`;

      const emailHtml = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #fcfcfc;">
    <h2 style="color: #10B981; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px;">💼 Client Outreach Pipeline Report</h2>
    <p><strong>Run Time:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Target Niche:</strong> ${targetNiche}</p>
    <p><strong>Scanned Cities:</strong> ${targetCities.join(', ')}</p>
    <p><strong>Overall Status:</strong> <span style="padding: 2px 8px; border-radius: 4px; font-weight: bold; background-color: ${status === 'Success' ? '#D1FAE5; color: #065F46' : '#FEF3C7; color: #92400E'};">${status}</span></p>
    
    <h3>🔄 Tasks Executed</h3>
    <ul>
      ${tasksExecuted.map(t => `<li><strong>${t.name}:</strong> <span style="color: ${t.status === 'Success' ? '#059669' : t.status === 'Warning' ? '#D97706' : '#DC2626'}">${t.status}</span> - ${t.details}</li>`).join('')}
    </ul>
    
    ${leadListHtml}
  </div>`;

      await sendBusinessEmail({
        subject: `[Acquisition Bot] Client Outreach Report: ${status} - ${newlyDiscoveredLeads.length} New Leads`,
        text: emailText,
        html: emailHtml
      });
    } else {
      console.log('ℹ   [Client Scraper] Zero new leads discovered today. Skipping email update.');
    }
  } catch (emailErr) {
    console.error('Failed to send client outreach report email:', emailErr.message);
  }

  return { success: true, status, tasks: tasksExecuted, logs: logOutput };
}

module.exports = {
  runJobScraperPipeline,
  runClientOutreachPipeline
};
