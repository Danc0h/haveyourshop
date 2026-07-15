const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Load balance using process.env.GEMINI_API_KEYS (comma-separated list of keys)
// and fallback to process.env.GEMINI_API_KEY
const extraKeys = (process.env.GEMINI_API_KEYS || '').split(',').map(k => k.trim());
const apiKeys = [
  process.env.GEMINI_API_KEY,
  ...extraKeys
].filter(key => key && key.trim() !== '');

let isMockAI = apiKeys.length === 0;
let keyIndex = 0;
const aiClient = apiKeys.length > 0 ? new GoogleGenerativeAI(apiKeys[0]) : null;

if (isMockAI) {
  console.log('⚠️ No Gemini API keys found. Running in MOCK AI mode.');
} else {
  console.log(`✅ Gemini Load Balancer initialized with ${apiKeys.length} API keys.`);
}

/**
 * Returns a generative model using round-robin rotated API keys for load balancing.
 */
function getBalancerModel(options = {}) {
  if (isMockAI || apiKeys.length === 0) {
    console.log('⚠️ Balancer returning mock fallback.');
    return null;
  }
  const key = apiKeys[keyIndex % apiKeys.length];
  console.log(`♻️ [Gemini Load Balancer] Selected API Key index ${keyIndex % apiKeys.length} (Total: ${apiKeys.length})`);
  keyIndex++;

  try {
    const client = new GoogleGenerativeAI(key);
    return client.getGenerativeModel({
      model: options.model || 'gemini-2.5-flash',
      tools: options.tools || undefined
    });
  } catch (err) {
    console.error('❌ Balancer construction failed, using first key:', err.message);
    const fallbackClient = new GoogleGenerativeAI(apiKeys[0]);
    return fallbackClient.getGenerativeModel({
      model: options.model || 'gemini-2.5-flash',
      tools: options.tools || undefined
    });
  }
}

// System Persona & User Background details for LLM tailoring
const developerProfile = `
Applicant Name: Dancun Kipkorir
Degree: B.Sc. in Software Engineering (Kisii University, Second Class Honours Upper Division, graduated Dec 2025)
Portfolio Website: dancunsoftwares.online (https://dancunsoftwares.online)
Company Brand: Have Your Shop Online (https://haveyourshop.online)
Contact Details: +254791993510 | info.dancoda@gmail.com | Bomet, Kenya

Current Work:
- System Architect and Mobile Developer for TerraQuant: An AI-powered climate intelligence platform that measures, predicts, and monetizes environmental value. We combine satellite imagery, earth observation, machine learning, and environmental data to help governments, conservation organizations, businesses, and investors understand climate risk, quantify carbon potential, and unlock new revenue from natural assets.

Core Skills: Python (Django), PHP (Laravel), JavaScript (ReactJS, React Native, Vite, Node.js, Express), HTML, CSS, Bootstrap, PostgreSQL, MySQL, NoSQL (MongoDB, Firebase), Docker, Kubernetes (Containerization), Postman, UI/UX Design, SEO, Git/GitHub.

Key Projects & Experience:
1. System Architect and Mobile Developer for TerraQuant (Current Work):
   * Designed and built the systems architecture and mobile application for the TerraQuant AI climate intelligence platform. Orchestrated satellite imagery and earth observation data feeds, environmental data processing pipelines, and machine learning model integrations to quantify environmental value and carbon potential.
2. Freelance Web Developer (Jan 2026 - Present):
   * Developed "E-Commerce King" (https://ecommerceking.shop), a full-stack e-commerce platform with product management, PayPal, VISA card integration and locally available payments plus order tracking.
   * Built with Node/Express backend, MongoDB, and React Redux frontend.
3. Mobile App Developer (Nov 2025 - Dec 2025):
   * Built "AI Smart Study", an AI-powered app that helps students study smarter.
   * Generates summaries and practice questions from PDFs/docs. Utilized DeepSeek LLM APIs.
4. Web Developer at "Have Your Shop Online" (July 2025 - Sept 2025):
   * Designed a SaaS MERN stack solution allowing small/medium businesses to request and configure custom online stores.
5. Web Developer (May 2024 - June 2024):
   * Built "X Clone" (https://x-by-dan.fun), a social media web app inspired by Twitter.
   * Node/Express/MongoDB backend, React/Vite frontend.
6. AI Business Chatbot Developer (May 2024 - Present):
   * Created and maintained Telegram AI chatbot (https://t.me/bestglamou).
7. Attachment Student (Jan 2024 - Feb 2024):
   * Built "Attachment Student Management System" (http://attache-manager.netlify.app/) using Django (Python), PostgreSQL, and React.
8. Web Developer (Feb 2023 - March 2023):
   * Built "Chat Application" (http://chat.dancunsoftwares.online), a real-time messaging app with auth, using PHP, MySQL, HTML, and CSS.
`;

/**
 * Computes a relevance score (0-100) for a job listing based on target stack skills.
 */
async function computeJobRelevance(position, description) {
  if (isMockAI) {
    // Basic heuristics for mock mode
    const text = `${position} ${description}`.toLowerCase();
    let score = 30; // base score
    if (text.includes('react') || text.includes('native')) score += 20;
    if (text.includes('node') || text.includes('javascript') || text.includes('js')) score += 15;
    if (text.includes('python') || text.includes('django') || text.includes('flask') || text.includes('postgressql') || text.includes('postgresql')) score += 15;
    if (text.includes('php') || text.includes('laravel')) score += 15;
    if (text.includes('docker') || text.includes('kubernetes') || text.includes('container')) score += 15;
    return Math.min(score, 100);
  }

  try {
    const model = getBalancerModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      You are an expert technical recruiter analyzing a job opening for a software developer.
      Review the applicant's profile:
      ${developerProfile}

      Job Position: ${position}
      Job Description: ${description}

      Based on the candidate's skills, compute a relevance score from 0 to 100.
      0 means no match at all. 100 means perfect match (matches React, React Native, Node.js, Python, PHP, or E-commerce).
      Return ONLY a single integer representing the score. No explanation, no text, just the number.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const score = parseInt(text, 10);
    return isNaN(score) ? 75 : score;
  } catch (err) {
    console.error('❌ Gemini Job Relevance Error:', err.message);
    return 70; // fallback score
  }
}

/**
 * Tailors the cover letter for a specific job listing.
 */
async function generateCoverLetter(company, position, description) {
  if (isMockAI) {
    return `Dear Hiring Team at ${company},

I am writing to express my strong interest in the ${position} position. As a B.Sc. Software Engineering graduate with deep experience in React Native, Node.js, Python, and PHP, I specialize in building robust full-stack applications and automated systems.

I have spent substantial time designing customer acquisition tools, scraper services, and e-commerce architectures. My professional portfolio at dancunsoftwares.online showcases my focus on clean code and client-first delivery. 

Additionally, as the founder of Have Your Shop Online (haveyourshop.online), I help businesses automate their operations and launch premium digital stores. I am confident my technical background matches your needs, and I look forward to discussing how I can add value to ${company}.

Best regards,
Dancun`;
  }

  try {
    const model = getBalancerModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      You are an expert career consultant writing a tailored cover letter for a candidate.
      
      Candidate Background:
      ${developerProfile}

      Target Company: ${company}
      Target Position: ${position}
      Job Description: ${description}

      Write a professional, concise, and compelling cover letter (max 300 words).
      Highlight the candidate's software engineering degree, specific matching projects from their experience (e.g. referencing E-Commerce King if the job is about ecommerce/payments, AI Smart Study if it's about AI/LLMs/Python, TerraQuant if it's about system architecture or environmental tech, or X Clone/Student Management for web apps), and point them to their portfolio (dancunsoftwares.online) and brand (haveyourshop.online).
      Connect the candidate's hands-on project accomplishments directly to the requirements in the job description to demonstrate real-world competence. Maintain a confident, technical, yet professional tone. Do not use generic placeholders.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('❌ Gemini Cover Letter Error:', err.message);
    return `Error generating cover letter: ${err.message}`;
  }
}

/**
 * Generates tailored outreach messages for client acquisition.
 */
async function generateClientOutreach(businessName, industry, auditDetails) {
  const auditString = JSON.stringify(auditDetails);
  
  if (isMockAI) {
    return `Subject: Ready-to-Use Web Portal for ${businessName} - Have Your Shop Online

Hello Team at ${businessName},

I hope this message finds you well. 

My name is Dancun, founder of Have Your Shop Online (haveyourshop.online). We build high-performance digital solutions for businesses in your industry.

We recently analyzed your business online presence and noticed some digital gaps (such as no active booking channel or website interface). To help you solve this, we have already built a fully functional web application template tailored specifically for businesses like yours:
- If you need e-commerce, we have a fast, mobile-friendly storefront with checkout ready.
- If you need bookings, we have a scheduling portal synced with calendar and reminders.

You can preview our templates and previous work at dancunsoftwares.online. Since the core system is already built, we can customize it with your branding and launch it for you in under a week.

Would you be open to a quick 5-minute call this week to see if this template matches what you need?

Best regards,
Dancun
Lead Architect, Have Your Shop Online
hello@haveyourshop.online`;
  }

  try {
    const model = getBalancerModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      You are a software engineering consultant cold pitching ready-made digital templates to local and global businesses.
      
      Our Company Brand:
      ${developerProfile}

      Target Business: ${businessName} (Industry: ${industry})
      Digital Audit Indicators: ${auditString}

      We have developed the following ready-to-launch template projects:
      1. Retail E-Commerce: Mobile-friendly shop storefront with cart, product search, and checkout.
      2. Medical/Dental Booking: Online scheduler synced with Google Calendar and SMS notifications.
      3. AI Customer Support Bot: 24/7 client onboarding and FAQ automated bot (Telegram/WhatsApp).
      4. Real Estate Listings Portal: Showcase hub with map search and viewing bookings.
      5. Fitness/Gym Member Portal: Class scheduling and billing interface.

      Write a highly personalized, value-driven cold pitch message to this business.
      
      Key Guidelines:
      - Instead of saying "we will build a site for you", explain that we have already built a ready-made digital template tailored for their industry (choose the most matching one from the list above) and can customize/launch it for them in under a week.
      - Address their specific digital gaps (from the audit indicators).
      - Keep it concise, professional, and friendly. Speak like a helpful software engineer, not a pushy salesperson.
      - End with a low-friction call-to-action (e.g. asking if they would be open to a 5-minute call to see the live template demo).
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('❌ Gemini Client Outreach Error:', err.message);
    return `Error generating outreach: ${err.message}`;
  }
}

/**
 * Computes a matching relevance score (0-100) for a scholarship/sponsorship listing.
 */
async function computeScholarshipRelevance(programName, description) {
  if (isMockAI) {
    const text = `${programName} ${description}`.toLowerCase();
    let score = 50; // base score
    if (text.includes('software') || text.includes('computing') || text.includes('computer science')) score += 30;
    if (text.includes('system') || text.includes('distributed') || text.includes('data')) score += 15;
    return Math.min(score, 100);
  }

  try {
    const model = getBalancerModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      You are an academic admissions evaluator reviewing a postgraduate computing scholarship.
      Candidate profile:
      ${developerProfile}

      Program Name: ${programName}
      Program Description: ${description}

      Rate how well the candidate's software engineering background matches the program's academic/research topics (0-100).
      Return ONLY a single integer. No explanation, just the number.
    `;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const score = parseInt(text, 10);
    return isNaN(score) ? 80 : score;
  } catch (err) {
    console.error('❌ Gemini Scholarship Relevance Error:', err.message);
    return 75;
  }
}

/**
 * Generates either a tailored Statement of Purpose (SOP) or a Cold Email Pitch to a professor (advisor)
 * based on the funding type.
 */
async function generateSopOrPitch(programName, institution, description, fundingType) {
  const isAdvisorEmail = fundingType && fundingType.toLowerCase().includes('advisor');

  if (isMockAI) {
    if (isAdvisorEmail) {
      return `Subject: Prospective MSc Student Inquiry - CS Systems & AI Climate Observation Lab

Dear Dr. Professor,

I hope this email finds you well.

My name is Dancun Kipkorir, a B.Sc. Software Engineering graduate with a strong focus on distributed architectures and systems automation. I am writing to express my interest in joining your research group at ${institution} as a Graduate Research Assistant for the upcoming term.

My academic background at Kisii University established my core theoretical foundation. Since graduating, I have served as the System Architect and Mobile Developer for TerraQuant, an AI-powered climate intelligence platform that measures, predicts, and monetizes environmental value. In this role, I engineered architectures combining satellite imagery, earth observation, and machine learning models to quantify environmental data. 

Additionally, I invite you to view my personal portfolio website at dancunsoftwares.online to review my other projects, including e-commerce startup developments and workflow automation systems built under my brand Have Your Shop Online.

I have read your lab's publications and believe my systems engineering skills align with your group. I have attached my CV and transcript for your review, and would welcome a brief virtual conversation to discuss potential opportunities.

Sincerely,
Dancun Kipkorir
dancunsoftwares.online`;
    } else {
      return `STATEMENT OF PURPOSE

Candidate: Dancun Kipkorir
Target Program: ${programName}
Target Institution: ${institution}

Since graduating with a B.Sc. in Software Engineering, my career has been driven by a passion for building scalable, high-performance systems. My academic journey at Kisii University provided me with a robust foundation in software engineering principles. 

Following my studies, I immediately applied these theoretical insights to complex real-world challenges. As the System Architect for TerraQuant, I designed an AI-powered climate intelligence platform designed to measure, predict, and monetize environmental value. This role required integrating satellite imagery and earth observation data with machine learning pipelines to quantify carbon potential and climate risk. 

Additionally, as showcased on my personal portfolio website at dancunsoftwares.online, I have successfully developed other projects, including custom e-commerce startup automation engines under my company Have Your Shop Online. These experiences have solidified my practical systems engineering and software design skills.

I am eager to pursue my Masters at ${institution} to deepen my research in computing systems. The ${programName} aligns perfectly with my goal to design distributed architectures that leverage machine learning and earth observation datasets.

Sincerely,
Dancun Kipkorir`;
    }
  }

  try {
    const model = getBalancerModel({ model: 'gemini-2.5-flash' });
    let prompt = '';

    if (isAdvisorEmail) {
      prompt = `
        You are a graduate advisor writing a highly personalized academic cold email to a computer science professor (Advisor) at ${institution}.
        
        Applicant Profile:
        ${developerProfile}

        Target Advisor Group Research: ${description}

        Write a professional, compelling cold email (max 250 words) from Dancun Kipkorir inquiring about research assistantship (RA) funding.
        You MUST structure the description of his experience in this order:
        1. B.Sc. Software Engineering degree.
        2. System Architect role at TerraQuant (an AI-powered climate intelligence platform that measures, predicts, and monetizes environmental value by combining satellite imagery, earth observation, machine learning, and environmental data).
        3. A pointer to Dancun's personal portfolio website at dancunsoftwares.online to view "other projects" worked on (specifically focusing on custom SME e-commerce startups under Have Your Shop Online).

        Connect these experiences to the professor's research topics to pitch Dancun as a developer who can construct clean code/systems for the lab. Tone should be highly academic, respectful, and technical.
      `;
    } else {
      prompt = `
        You are an expert admissions consultant writing a tailored Statement of Purpose (SOP) for a Masters application.
        
        Applicant Profile:
        ${developerProfile}

        Program: ${programName} at ${institution}
        Program details: ${description}

        Write a formal, compelling Statement of Purpose (max 400 words) for Dancun Kipkorir.
        You MUST frame his narrative in this logical order:
        1. B.Sc. Software Engineering degree foundation.
        2. TerraQuant experience (System Architect on the AI climate intelligence platform combining satellite imagery, earth observation, and machine learning to quantify carbon potential and monetize environmental value).
        3. A pointer to Dancun's personal portfolio website at dancunsoftwares.online to view "other projects" worked on (specifically custom SME e-commerce startup engines and automations under Have Your Shop Online).

        Explain how this trajectory qualifies him for the ${programName} at ${institution} and matches his long-term career aspirations. Tone should be professional, academic, and passionate.
      `;
    }

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('❌ Gemini SOP/Pitch Generation Error:', err.message);
    return `Error generating document: ${err.message}`;
  }
}

/**
 * Uses Gemini 2.5 Flash with Google Search Grounding to find real-world local businesses.
 */
async function searchRealBusinessesWithAI(niche, city, country) {
  if (isMockAI || !aiClient) {
    console.log('⚠️ Gemini Search Grounding: Running in mock/offline mode.');
    return [];
  }

  try {
    const model = getBalancerModel({
      model: 'gemini-2.5-flash',
      tools: [{ googleSearch: {} }]
    });

    const prompt = `
      Perform a live Google Search to identify up to 5 real, active local businesses of niche category "${niche}" in the city "${city}" (${country}).
      Find actual businesses that are currently operating.
      
      Note: If the city is clearly located in a different country (e.g. Mombasa is in Kenya, Dubai is in UAE) than the suggested country "${country}", ignore the country suggestion and prioritize the city's true location.

      For each business, find actual details:
      - business_name: Full name of the business.
      - website_url: The direct website URL (e.g. "chicagodental.com"). If they do not have a website or only have directories like Yelp or Facebook, provide their Facebook page/Instagram page URL or set it to null/empty if no website is found.
      - snippet: A 1-2 sentence description summarizing their services or focus.
      - location: The city name, e.g. "${city}".
      - email: Contact email address if found, or null.
      - phone: Direct phone number if found, or null.
      - social_media_url: Direct Instagram, Facebook, or LinkedIn business profile page if found, or null.

      Output the results as a raw JSON array of objects. Do NOT wrap in markdown fences or include any conversational intro/outro text. Only raw JSON.
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Extract JSON block if model still wrapped it in backticks
    if (text.startsWith('```json')) text = text.substring(7);
    if (text.startsWith('```')) text = text.substring(3);
    if (text.endsWith('```')) text = text.substring(0, text.length - 3);
    text = text.trim();
    
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('❌ searchRealBusinessesWithAI failed:', err.message);
    return [];
  }
}

/**
 * Uses Gemini 2.5 Flash with Google Search Grounding to find real active scholarship & funding opportunities.
 */
async function searchRealScholarshipsWithAI() {
  if (isMockAI || !aiClient) {
    console.log('⚠️ Gemini Search Grounding: Running in mock/offline mode for scholarships.');
    return [];
  }

  try {
    const model = getBalancerModel({
      model: 'gemini-2.5-flash',
      tools: [{ googleSearch: {} }]
    });

    const prompt = `
      Perform a live Google Search to identify 5 real, active fully-funded Master's (MSc) computer science, software engineering scholarships, or direct CS professor Research Assistantship (RA) funding openings open for international applications in 2026/2027.
      Specifically look for major programs (like Erasmus Mundus Joint Masters, DAAD EPOS, Chevening, or direct advisor openings at universities in USA, Canada, UK, Germany, Europe).
      
      For each opportunity, find actual details:
      - program_name: Name of the scholarship program or position.
      - institution: University or consortium name.
      - location: Country or countries where the program is hosted.
      - funding_type: Fully Funded, RA/TA Advisor Position, Fellowship, etc.
      - deadline: Application deadline in YYYY-MM-DD format (or null if rolling/unknown).
      - application_url: Actual direct portal application URL.
      - description: 2-3 sentence summary of the program focus.
      - eligibility_criteria: Key criteria (degree requirements, experience, country, etc.).
      - how_to_apply: Brief steps on how to apply.

      Output the results as a raw JSON array of objects. Do NOT wrap in markdown fences or include any conversational intro/outro text. Only raw JSON.
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Extract JSON block if model still wrapped it in backticks
    if (text.startsWith('```json')) text = text.substring(7);
    if (text.startsWith('```')) text = text.substring(3);
    if (text.endsWith('```')) text = text.substring(0, text.length - 3);
    text = text.trim();
    
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('❌ searchRealScholarshipsWithAI failed:', err.message);
    return [];
  }
}

/**
 * Uses Gemini 2.5 Flash to parse raw text copied from Google/Google Maps search results
 * and extract a structured list of businesses.
 */
async function parsePastedLeads(rawText, targetNiche, city) {
  if (isMockAI || !aiClient) {
    console.log('⚠️ Gemini Lead Parser: Running in mock/offline mode.');
    return [];
  }

  try {
    const model = getBalancerModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      You are an expert data parsing assistant.
      The user has searched for "${targetNiche}" in "${city}" and copied the raw text results from their browser (Google Search, Google Maps, or local directories).
      
      Review the raw copied text:
      --- START RAW TEXT ---
      ${rawText}
      --- END RAW TEXT ---

      Extract up to 15 businesses mentioned in this text. For each business, extract:
      - business_name: The company/clinic name.
      - website_url: The direct website address (e.g. "chicagoclinic.com"). If they do not have a website or it is not listed, specify null or leave blank.
      - snippet: A brief description or note about what they do or their services.
      - location: The city name, e.g. "${city}".
      - email: Email address if found in the text, or null.
      - phone: Phone number if found in the text, or null.
      - social_media_url: Direct Instagram/Facebook link if found in the text, or null.

      Output the results as a raw JSON array of objects. Do NOT wrap in markdown fences or include any conversational intro/outro text. Only raw JSON.
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Clean code fences if generated
    if (text.startsWith('```json')) text = text.substring(7);
    if (text.startsWith('```')) text = text.substring(3);
    if (text.endsWith('```')) text = text.substring(0, text.length - 3);
    text = text.trim();
    
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('❌ AI Pasted Leads Parser Failed:', err.message);
    return [];
  }
}

module.exports = {
  computeJobRelevance,
  generateCoverLetter,
  generateClientOutreach,
  computeScholarshipRelevance,
  generateSopOrPitch,
  searchRealBusinessesWithAI,
  searchRealScholarshipsWithAI,
  parsePastedLeads,
  isMockMode: () => isMockAI
};
