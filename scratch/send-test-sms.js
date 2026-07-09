const fs = require('fs');
const path = require('path');
const twilio = require('twilio');

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

async function sendTestSms() {
  const toPhone = process.argv[2];
  if (!toPhone) {
    console.error('❌ Please specify a recipient phone number (E.164 format recommended, e.g., +18542262250).');
    console.error('Usage: node scratch/send-test-sms.js <recipient-phone>');
    process.exit(1);
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER || '+18542262250';

  console.log('🔑 Credentials check:');
  console.log('  TWILIO_ACCOUNT_SID:', accountSid ? `${accountSid.substring(0, 8)}...` : '(Not configured)');
  console.log('  TWILIO_AUTH_TOKEN: ', authToken ? `set (${authToken.length} chars)` : '(Not configured)');
  console.log('  TWILIO_PHONE_NUMBER:', fromPhone);

  if (!accountSid || !authToken) {
    console.error('\n❌ Error: Twilio credentials are not configured in your .env.local file.');
    console.log('Please edit .env.local and set:');
    console.log('  TWILIO_ACCOUNT_SID="your_account_sid"');
    console.log('  TWILIO_AUTH_TOKEN="your_auth_token"');
    process.exit(1);
  }

  console.log(`\n💬 Dispatching test SMS from ${fromPhone} to ${toPhone}...`);

  try {
    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({
      to: toPhone,
      from: fromPhone,
      body: 'iCanCall SMS Notification Test! 🚀 Your A2P compliant messaging system is functioning perfectly.'
    });

    console.log('✅ Success! SMS message sent.');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
  } catch (error) {
    console.error('❌ Failed to dispatch SMS:', error.message);
  }
}

sendTestSms();
