const db = require('../db');
const { computeScholarshipRelevance } = require('./gemini');

/**
 * Simulates scraping/pulling scholarship opportunities from Erasmus Mundus, DAAD, 
 * and direct CS advisor RA funding portals, evaluating them against the user profile.
 */
async function scrapeScholarships() {
  console.log('⏳ Scholarship Scraper: Scanning postgraduate scholarship portals and research lab directories...');
  
  // High-value computing-related Master scholarships and Advisor RA openings
  const seedOpportunities = [
    {
      program_name: 'Erasmus Mundus Joint Master in Software Engineering (EMSE)',
      institution: 'Consortium of European Universities (University of L’Aquila, Free University of Bozen-Bolzano, etc.)',
      location: 'Europe (Italy, Finland, Sweden, Spain)',
      funding_type: 'Fully Funded (Erasmus+ Scholarship)',
      deadline: '2027-01-15',
      application_url: 'https://emse-erasmusmundus.eu/apply',
      description: 'Erasmus Mundus Joint Master Degree in Software Engineering focusing on software architectures, systems design, cloud architectures, and data engineering. Includes fully funded tuition, insurance, and monthly living stipends.',
      eligibility_criteria: 'B.Sc. in CS/Software Engineering or related computing degree. Strong academic background and proficiency in English required.'
    },
    {
      program_name: 'CS Research Lab Graduate Assistantship (Dr. Sarah Jenkins - Distributed Systems & Green Computing)',
      institution: 'University of British Columbia (UBC)',
      location: 'Canada',
      funding_type: 'RA/TA Advisor Position (Direct Lab Funding)',
      deadline: '2026-12-01',
      application_url: 'https://cs.ubc.ca/labs/distributed-systems/advisor-openings',
      description: 'Graduate Research Assistantship opening in Distributed Systems & Green Computing. Seeking students with background in system architectures, carbon asset accounting, or backend databases to write cloud data pipelines.',
      eligibility_criteria: 'M.Sc./B.Sc. in Software Engineering or CS, experience with PostgreSQL, cloud platforms, or systems programming is highly preferred.'
    },
    {
      program_name: 'DAAD EPOS Scholarship for MSc in Development-Related Computer Science',
      institution: 'Technical University of Munich (TUM) & DAAD Consortium',
      location: 'Germany',
      funding_type: 'Fully Funded (DAAD Stipend + Tuition Waiver)',
      deadline: '2026-10-31',
      application_url: 'https://www.daad.de/en/study-and-research-in-germany/scholarships',
      description: 'Postgraduate scholarship for computing professionals from developing nations focusing on software engineering for sustainable development, e-commerce networks, and digitalization of SME business infrastructure.',
      eligibility_criteria: 'B.Sc. in Computer Science/Software Engineering, minimum 2 years of professional software development experience, proof of English/German.'
    },
    {
      program_name: 'Chevening Postgraduate Scholarship - MSc in Advanced Computing / Software Engineering',
      institution: 'Imperial College London',
      location: 'United Kingdom',
      funding_type: 'Fully Funded (Chevening Fellowship)',
      deadline: '2026-11-05',
      application_url: 'https://www.chevening.org/apply',
      description: 'UK government global scholarship program. Covers full tuition, monthly stipends, and travel allowance to pursue a Master’s degree in advanced computing architectures, e-commerce, or mobile systems.',
      eligibility_criteria: 'Undergraduate degree, minimum 2 years of work experience, leadership potential, plan to return to home country to implement digital systems.'
    },
    {
      program_name: 'Research Assistantship in Secure Smart Contracts & Blockchain systems',
      institution: 'University of Waterloo (Cryptology & Security Lab)',
      location: 'Canada',
      funding_type: 'RA Advisor Position (Direct Funding)',
      deadline: '2026-11-15',
      application_url: 'https://uwaterloo.ca/cryptology-security/advisor-openings',
      description: 'Advisor-funded Graduate Research Assistantship. Researching scalable distributed systems and secure transaction ledgers (carbon credits / e-commerce security). Looking for candidates with strong Python/Node.js experience.',
      eligibility_criteria: 'B.Sc. in Software Engineering or CS, proficiency in Python or JavaScript backend development, understanding of cryptography.'
    }
  ];

  let addedOpportunities = 0;

  for (const opp of seedOpportunities) {
    // 1. Calculate relevance matching score using Gemini
    const score = await computeScholarshipRelevance(opp.program_name, opp.description);

    // 2. Insert into database
    try {
      const queryText = `
        INSERT INTO scholarship_listings (
          program_name, institution, location, funding_type, deadline, application_url, description, eligibility_criteria, relevance_score, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (application_url) DO UPDATE SET
          relevance_score = EXCLUDED.relevance_score,
          deadline = EXCLUDED.deadline
        RETURNING id;
      `;
      
      const params = [
        opp.program_name,
        opp.institution,
        opp.location,
        opp.funding_type,
        opp.deadline,
        opp.application_url,
        opp.description,
        opp.eligibility_criteria,
        score,
        'Discovered'
      ];

      const result = await db.query(queryText, params);
      if (result.rows && result.rows.length > 0) {
        addedOpportunities++;
      }
    } catch (err) {
      console.error(`❌ DB error ingesting scholarship "${opp.program_name}":`, err.message);
    }
  }

  console.log(`✅ Scholarship Scraper: Ingested ${addedOpportunities} CS graduate funding opportunities.`);
  return { success: true, ingested: addedOpportunities };
}

module.exports = {
  scrapeScholarships
};
