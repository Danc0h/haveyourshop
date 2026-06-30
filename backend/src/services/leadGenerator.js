const db = require('../db');
const { generateClientOutreach } = require('./gemini');

/**
 * Analyzes a website URL to identify potential digital presence gaps.
 */
async function auditWebsite(url) {
  const audit = {
    no_website: false,
    no_booking: false,
    no_ssl: false,
    outdated_tech: false,
    pagespeed_score: 100
  };

  if (!url || url.trim() === '') {
    audit.no_website = true;
    audit.no_booking = true;
    audit.pagespeed_score = 0;
    return audit;
  }

  try {
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    const start = Date.now();
    const response = await fetch(formattedUrl, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(6000) 
    });
    const duration = Date.now() - start;

    // Calculate mock Pagespeed based on response duration
    audit.pagespeed_score = Math.max(10, Math.min(99, Math.round(100 - (duration / 80))));
    
    // Check SSL
    if (!response.url.startsWith('https')) {
      audit.no_ssl = true;
    }

    const htmlText = await response.text();
    const cleanHtml = htmlText.toLowerCase();

    // Look for indicators of scheduling/booking widgets (Calendly, Acuity, Booking.com, Book, Schedule)
    const bookingIndicators = ['calendly', 'acuityscheduling', 'book-now', 'booking-widget', 'schedule-button', 'book online', 'reserve'];
    const hasBooking = bookingIndicators.some(indicator => cleanHtml.includes(indicator));
    if (!hasBooking) {
      audit.no_booking = true;
    }

    // Look for outdated technologies or framework indicators
    if (cleanHtml.includes('generator" content="wordpress') && cleanHtml.includes('wp-content/themes/twenty')) {
      audit.outdated_tech = true;
    }

  } catch (err) {
    console.warn(`⚠️ Lead Generator: Website audit failed for ${url}:`, err.message);
    // If request fails, treat website as broken or offline
    audit.no_website = false; // website exists but is broken
    audit.no_ssl = true;
    audit.outdated_tech = true;
    audit.pagespeed_score = 15;
  }

  return audit;
}

/**
 * Calculates a lead priority score based on digital deficiencies.
 * 0: perfect presence, 100: high deficiency (great prospect).
 */
function calculateLeadScore(audit) {
  let score = 0;
  if (audit.no_website) score += 50;
  if (audit.no_booking) score += 15;
  if (audit.no_ssl) score += 15;
  if (audit.outdated_tech) score += 10;
  
  // Lower pagespeed raises the priority score (means they need optimization)
  if (audit.pagespeed_score < 50) {
    score += 10;
  }
  return Math.min(score, 100);
}

/**
 * Discovers local business leads (crawls/scrapes mock target list for local service businesses).
 */
async function discoverLeads(city = 'Nairobi') {
  console.log(`⏳ Lead Generator: Searching for local leads in ${city}...`);
  
  // List of candidate business ideas to audit/scrape
  // In a real production setup, this would hit a maps search or list directories
  const businessSeedData = [
    { name: 'Apex Legal Consultants', industry: 'Legal', website: 'http://apexlegal-nairobi-example.com' },
    { name: 'Urban Green Cafe', industry: 'Restaurant', website: '' },
    { name: 'Starlight Dental Care', industry: 'Healthcare', website: 'http://starlightdental-example.co.ke' },
    { name: 'Prestige Boutiques', industry: 'E-commerce', website: 'http://prestigeboutiques-ke.com' },
    { name: 'Nairobi Fitness Gym', industry: 'Fitness', website: '' }
  ];

  let addedLeads = 0;

  for (const seed of businessSeedData) {
    const audit = await auditWebsite(seed.website);
    const leadScore = calculateLeadScore(audit);
    
    // Skip leads with perfect websites (low score)
    if (leadScore < 30) continue;

    try {
      const queryText = `
        INSERT INTO client_leads (
          business_name, industry, location, website_url, email, phone, lead_score, digital_audit, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;
      `;
      const params = [
        seed.name,
        seed.industry,
        city,
        seed.website,
        `info@${seed.name.toLowerCase().replace(/\s+/g, '')}-example.com`,
        '+254-700-000-000',
        leadScore,
        JSON.stringify(audit),
        'New'
      ];

      await db.query(queryText, params);
      addedLeads++;
    } catch (err) {
      // Ignore duplicates
    }
  }

  console.log(`✅ Lead Generator: Identified ${addedLeads} prospective client leads.`);
  return { success: true, leadsFound: addedLeads };
}

module.exports = {
  auditWebsite,
  calculateLeadScore,
  discoverLeads
};
