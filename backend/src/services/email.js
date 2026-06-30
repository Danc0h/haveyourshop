const nodemailer = require('nodemailer');
require('dotenv').config();

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

// Personal (Job Scraper) configuration
const personalUser = process.env.PERSONAL_SMTP_USER || 'info.dancoda@gmail.com';
const personalPass = process.env.PERSONAL_SMTP_PASS;
const personalRecipient = process.env.PERSONAL_NOTIFICATION_EMAIL || 'info.dancoda@gmail.com';

// Business (Client Outreach & Inbound Form) configuration
const businessUser = process.env.BUSINESS_SMTP_USER || 'haveyourshop.online@gmail.com';
const businessPass = process.env.BUSINESS_SMTP_PASS;
const businessRecipient = process.env.BUSINESS_NOTIFICATION_EMAIL || 'haveyourshop.online@gmail.com';

/**
 * Generic transporter creator
 */
function createTransporter(user, pass) {
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: user,
      pass: pass
    }
  });
}

/**
 * Sends a personal update email (re. jobs).
 */
async function sendPersonalEmail({ subject, text, html }) {
  console.log(`📬 [Email Service] Preparing PERSONAL email for: ${personalRecipient}`);
  console.log(`📬 [Email Service] Subject: "${subject}"`);

  if (!personalUser || !personalPass) {
    console.log('ℹ️ [Email Service] Personal SMTP credentials (PERSONAL_SMTP_USER, PERSONAL_SMTP_PASS) not set in .env.');
    console.log('ℹ️ [Email Service] Running in SIMULATION mode. Email Content:');
    console.log('--------------------------------------------------');
    console.log(text);
    console.log('--------------------------------------------------');
    return { simulated: true, success: true };
  }

  try {
    const transporter = createTransporter(personalUser, personalPass);
    const mailOptions = {
      from: `"Dancun - SWE Career Bot" <${personalUser}>`,
      to: personalRecipient,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>')
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Email Service] Personal email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ [Email Service] Failed to send personal email via SMTP:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a business update email (re. client outreach and website inquiries).
 */
async function sendBusinessEmail({ subject, text, html }) {
  console.log(`📬 [Email Service] Preparing BUSINESS email for: ${businessRecipient}`);
  console.log(`📬 [Email Service] Subject: "${subject}"`);

  if (!businessUser || !businessPass) {
    console.log('ℹ️ [Email Service] Business SMTP credentials (BUSINESS_SMTP_USER, BUSINESS_SMTP_PASS) not set in .env.');
    console.log('ℹ️ [Email Service] Running in SIMULATION mode. Email Content:');
    console.log('--------------------------------------------------');
    console.log(text);
    console.log('--------------------------------------------------');
    return { simulated: true, success: true };
  }

  try {
    const transporter = createTransporter(businessUser, businessPass);
    const mailOptions = {
      from: `"Have Your Shop Online" <${businessUser}>`,
      to: businessRecipient,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>')
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Email Service] Business email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ [Email Service] Failed to send business email via SMTP:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendPersonalEmail,
  sendBusinessEmail
};
