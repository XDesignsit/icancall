const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Helper to parse .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

async function sendTestEmail() {
  const targetEmail = process.argv[2];
  if (!targetEmail) {
    console.error('❌ Please specify a recipient email address.');
    console.error('Usage: node scratch/send-test-email.js <recipient-email>');
    process.exit(1);
  }

  console.log('🔗 Configuring SMTP Transporter using Maileroo...');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.maileroo.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@yourdomain.com';
  const fromName = process.env.SMTP_FROM_NAME || 'iCanCall Support';

  console.log(`✉️ Sending test transactional email to: ${targetEmail}...`);

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: targetEmail,
      subject: 'iCanCall Maileroo Test Email 🚀',
      text: `Hi there!\n\nThis is a test transactional email sent from iCanCall to verify SMTP configurations.\n\nSent using: ${process.env.SMTP_HOST || 'smtp.maileroo.com'}\n\nBest,\nThe iCanCall Team`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-bottom: 16px;">iCanCall Maileroo Test Email 🚀</h2>
          <p style="color: #475569; line-height: 1.6;">This is a test transactional email sent from the iCanCall codebase to verify that Maileroo SMTP settings are fully functioning.</p>
          <ul style="color: #334155; line-height: 1.6;">
            <li><strong>SMTP Server:</strong> ${process.env.SMTP_HOST || 'smtp.maileroo.com'}</li>
            <li><strong>SMTP Port:</strong> ${process.env.SMTP_PORT || '587'}</li>
            <li><strong>From Identity:</strong> "${fromName}" &lt;${fromEmail}&gt;</li>
          </ul>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0 24px 0;" />
          <p style="color: #94a3b8; font-size: 0.875rem;">If you did not initiate this test, please ignore this email.</p>
        </div>
      `,
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
}

sendTestEmail();
