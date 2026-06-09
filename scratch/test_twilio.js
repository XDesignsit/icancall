const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*TWILIO_([A-Z_]+)\s*=\s*(.*?)\s*$/);
  if (match) {
    env[`TWILIO_${match[1]}`] = match[2];
  }
});

const accountSid = env.TWILIO_ACCOUNT_SID;
const authToken = env.TWILIO_AUTH_TOKEN;

console.log('Using Account SID:', accountSid);

if (!accountSid || !authToken) {
  console.error('Error: TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is missing in .env.local');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

client.incomingPhoneNumbers.create({ phoneNumber: '+15005550006' })
  .then(number => {
    console.log('✅ Success! Connection to Twilio API is active.');
    console.log('Successfully simulated purchase of test phone number:', number.phoneNumber);
  })
  .catch(err => {
    // If it's already purchased, it still means credentials are valid!
    if (err.message.includes('already exists') || err.code === 21440) {
      console.log('✅ Success! Connection to Twilio API is active (number already purchased in test environment).');
    } else {
      console.error('❌ Failed to connect to Twilio API:', err.message);
    }
  });
