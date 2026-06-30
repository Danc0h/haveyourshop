/**
 * Shared state manager to track running automation scrapers/crawlers
 * and allow cancelling them on user request.
 */
const activeJobs = {
  job_scraper: false,
  client_outreach: false,
  scholarship_scraper: false
};

module.exports = {
  startJob: (type) => { 
    activeJobs[type] = true; 
    console.log(`ℹ️ [Tracker] Started background job: ${type}`);
  },
  stopJob: (type) => { 
    activeJobs[type] = false; 
    console.log(`⚠️ [Tracker] Stopped background job: ${type}`);
  },
  isJobActive: (type) => {
    return activeJobs[type] === true;
  }
};
