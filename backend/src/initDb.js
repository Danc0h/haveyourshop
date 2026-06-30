const { Pool } = require('pg');
require('dotenv').config();

const schemaSql = `
-- Enums creation (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
    CREATE TYPE lead_status AS ENUM ('New', 'Contacted', 'Replied', 'Meeting Scheduled', 'Proposal Sent', 'Won', 'Lost');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'outreach_channel') THEN
    CREATE TYPE outreach_channel AS ENUM ('Email', 'LinkedIn', 'WhatsApp', 'Contact Form');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE job_status AS ENUM ('Discovered', 'Applied', 'Interview', 'Rejected', 'Offer');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scholarship_status') THEN
    CREATE TYPE scholarship_status AS ENUM ('Discovered', 'SOP Drafted', 'Applied', 'Interview', 'Accepted', 'Rejected');
  END IF;
END$$;

-- 1. Client Leads Table
CREATE TABLE IF NOT EXISTS client_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  location VARCHAR(255),
  website_url VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  lead_score INTEGER DEFAULT 0,
  digital_audit JSONB,
  status lead_status DEFAULT 'New',
  social_media_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Outreach History Table
CREATE TABLE IF NOT EXISTS outreach_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES client_leads(id) ON DELETE CASCADE,
  channel outreach_channel NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  message_content TEXT NOT NULL,
  response_received BOOLEAN DEFAULT FALSE,
  response_content TEXT,
  response_at TIMESTAMP WITH TIME ZONE
);

-- 3. Job Boards Listings Table
CREATE TABLE IF NOT EXISTS job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  salary VARCHAR(100),
  location VARCHAR(255),
  application_url TEXT NOT NULL UNIQUE,
  job_description TEXT,
  relevance_score INTEGER DEFAULT 0,
  status job_status DEFAULT 'Discovered',
  cv_generated_path TEXT,
  cover_letter_text TEXT,
  how_to_apply TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Scholarship Listings Table
CREATE TABLE IF NOT EXISTS scholarship_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_name VARCHAR(255) NOT NULL,
  institution VARCHAR(255) NOT NULL,
  location VARCHAR(100) NOT NULL,
  funding_type VARCHAR(100) DEFAULT 'Fully Funded',
  deadline DATE,
  application_url TEXT NOT NULL UNIQUE,
  description TEXT,
  eligibility_criteria TEXT,
  relevance_score INTEGER DEFAULT 0,
  status scholarship_status DEFAULT 'Discovered',
  sop_text TEXT,
  how_to_apply TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Business CRM Performance Metrics
CREATE TABLE IF NOT EXISTS crm_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date DATE UNIQUE DEFAULT CURRENT_DATE,
  leads_contacted INTEGER DEFAULT 0,
  leads_won INTEGER DEFAULT 0,
  interviews_scheduled INTEGER DEFAULT 0,
  offers_received INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0.00
);

-- 6. Cron Runs Logs Table
CREATE TABLE IF NOT EXISTS cron_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  pipeline_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  tasks_executed JSONB NOT NULL,
  log_output TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Migrations/Alter statements for existing schemas
ALTER TABLE client_leads ADD COLUMN IF NOT EXISTS social_media_url VARCHAR(255);
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS how_to_apply TEXT;
ALTER TABLE scholarship_listings ADD COLUMN IF NOT EXISTS how_to_apply TEXT;
`;

async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ DATABASE_URL not set in .env. Skipping PostgreSQL table initialization.');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    console.log('⏳ Running database initialization script on PostgreSQL...');
    await pool.query(schemaSql);
    console.log('✅ PostgreSQL Schema initialized successfully.');
  } catch (err) {
    console.error('❌ Failed to initialize schema on PostgreSQL:', err.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  initDb();
}

module.exports = {
  initDb
};
