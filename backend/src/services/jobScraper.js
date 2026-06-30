const db = require('../db');
const { computeJobRelevance } = require('./gemini');

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
            company_name, position, salary, location, application_url, job_description, relevance_score, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (application_url) DO NOTHING
          RETURNING id;
        `;
        const params = [
          job.company_name,
          job.title,
          job.salary || 'Not specified',
          job.candidate_required_location || 'Remote',
          job.url,
          job.description,
          score,
          'Discovered'
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

module.exports = {
  scrapeRemotive
};
