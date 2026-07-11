const db = require('../db');
const { computeJobRelevance } = require('./gemini');

/**
 * Filter to ensure location-specific strict country/time-zone jobs are skipped,
 * and only worldwide, global, Africa/EMEA-friendly, or general remote roles are ingested.
 */
function isAllowedRemoteLocation(location) {
  if (!location) return true;
  const loc = location.toLowerCase();

  // Strict country boundaries that exclude global remote developers
  const strictRestricted = [
    'us only', 'usa only', 'united states', 'canada only', 'uk only', 
    'united kingdom', 'brazil', 'mexico', 'india', 'japan', 'australia', 
    'germany', 'france', 'latin america', 'latam'
  ];

  // Check if location matches strict country restrictions
  const matchesStrict = strictRestricted.some(country => loc.includes(country));
  if (matchesStrict) {
    // Keep only if it explicitly permits worldwide/global applications too
    const matchesWorldwide = ['worldwide', 'global', 'anywhere', 'everywhere'].some(w => loc.includes(w));
    if (!matchesWorldwide) {
      console.log(`🚫 Skipping strict location job restricted to: "${location}"`);
      return false;
    }
  }
  return true;
}

// Fetch remote jobs from Remotive (public, free-tier friendly developer API)
async function scrapeRemotive() {
  console.log('⏳ Job Scraper: Fetching listings from Remotive API...');
  try {
    const response = await fetch('https://remotive.com/api/remote-jobs?category=software-development&limit=15');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const jobs = data.jobs || [];
    
    console.log(`ℹ️ Job Scraper: Retrieved ${jobs.length} raw listings from Remotive.`);
    
    let ingestedCount = 0;
    const ingestedJobs = [];
    
    for (const job of jobs) {
      const jobLocation = job.candidate_required_location || 'Remote';
      
      // Filter location constraints
      if (!isAllowedRemoteLocation(jobLocation)) continue;

      // 1. Basic stack filter (ensure relevance to Python, JS, Node, React, React Native, PHP)
      const contentText = `${job.title} ${job.description}`.toLowerCase();
      const hasKeywords = ['react', 'native', 'node', 'javascript', 'js', 'python', 'php', 'full stack', 'mobile'].some(kw => 
        contentText.includes(kw)
      );
      
      if (!hasKeywords) continue;
      
      // 2. Score job relevance
      const score = await computeJobRelevance(job.title, job.description);
      
      // We only store jobs that score moderately high (> 50)
      if (score < 50) continue;
      
      // 3. Save to database
      try {
        const queryText = `
          INSERT INTO job_listings (
            company_name, position, salary, location, application_url, job_description, relevance_score, status, posted_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (application_url) DO NOTHING
          RETURNING id;
        `;
        const params = [
          job.company_name,
          job.title,
          job.salary || 'Not specified',
          jobLocation,
          job.url,
          job.description,
          score,
          'Discovered',
          job.publication_date ? new Date(job.publication_date) : new Date()
        ];
        
        const result = await db.query(queryText, params);
        if (result.rows && result.rows.length > 0) {
          ingestedCount++;
          ingestedJobs.push({
            company_name: job.company_name,
            position: job.title,
            relevance_score: score,
            application_url: job.url
          });
        }
      } catch (dbErr) {
        // Silently skip duplicate entry violations if they occur (handled by unique constraint)
        if (!dbErr.message.includes('unique constraint')) {
          console.error(`❌ DB error ingesting job "${job.title}":`, dbErr.message);
        }
      }
    }
    
    console.log(`✅ Job Scraper: Ingested ${ingestedCount} matching jobs into the CRM.`);
    return { success: true, ingested: ingestedCount, jobs: ingestedJobs };
  } catch (err) {
    console.error('❌ Job Scraper: Remotive ingestion failed:', err.message);
    return { success: false, error: err.message };
  }
}

// Fetch remote jobs from Jobicy (free, open developer API v2)
async function scrapeJobicy() {
  console.log('⏳ Job Scraper: Fetching listings from Jobicy API...');
  try {
    const response = await fetch('https://jobicy.com/api/v2/remote-jobs?count=15&industry=development');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (!data.success || !Array.isArray(data.jobs)) {
      return { success: true, ingested: 0, jobs: [] };
    }
    const jobs = data.jobs;
    
    console.log(`ℹ️ Job Scraper: Retrieved ${jobs.length} raw listings from Jobicy.`);
    
    let ingestedCount = 0;
    const ingestedJobs = [];
    
    for (const job of jobs) {
      const jobLocation = job.jobGeo || 'Remote';

      // Filter location constraints
      if (!isAllowedRemoteLocation(jobLocation)) continue;

      // 1. Basic stack filter (ensure relevance to Python, JS, Node, React, React Native, PHP)
      const contentText = `${job.jobTitle} ${job.jobDescription}`.toLowerCase();
      const hasKeywords = ['react', 'native', 'node', 'javascript', 'js', 'python', 'php', 'full stack', 'mobile'].some(kw => 
        contentText.includes(kw)
      );
      
      if (!hasKeywords) continue;
      
      // 2. Score job relevance
      let score = 75;
      try {
        score = await computeJobRelevance(job.jobTitle, job.jobDescription);
      } catch (e) {
        score = 75;
      }
      
      if (score < 50) continue;
      
      // 3. Save to database
      try {
        const queryText = `
          INSERT INTO job_listings (
            company_name, position, salary, location, application_url, job_description, relevance_score, status, posted_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (application_url) DO NOTHING
          RETURNING id;
        `;
        const params = [
          job.companyName,
          job.jobTitle,
          job.salaryMin ? `${job.salaryMin} - ${job.salaryMax} ${job.salaryCurrency}` : 'Remote',
          jobLocation,
          job.url,
          job.jobDescription,
          score,
          'Discovered',
          job.pubDate ? new Date(job.pubDate) : new Date()
        ];
        
        const result = await db.query(queryText, params);
        if (result.rows && result.rows.length > 0) {
          ingestedCount++;
          ingestedJobs.push({
            company_name: job.companyName,
            position: job.jobTitle,
            relevance_score: score,
            application_url: job.url
          });
        }
      } catch (dbErr) {
        if (!dbErr.message.includes('unique constraint')) {
          console.error(`❌ DB error ingesting job "${job.jobTitle}":`, dbErr.message);
        }
      }
    }
    
    console.log(`✅ Job Scraper: Ingested ${ingestedCount} matching jobs from Jobicy into the CRM.`);
    return { success: true, ingested: ingestedCount, jobs: ingestedJobs };
  } catch (err) {
    console.error('❌ Job Scraper: Jobicy ingestion failed:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  scrapeRemotive,
  scrapeJobicy,
  isAllowedRemoteLocation
};
