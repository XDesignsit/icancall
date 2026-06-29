const http = require('http');

const postData = JSON.stringify({
  action: 'verify',
  email: 'support@icancall.co',
  token: '123456'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`LOGIN STATUS: ${res.statusCode}`);
  const cookies = res.headers['set-cookie'] || [];
  const sessionCookie = cookies.find(c => c.startsWith('session='));
  
  if (!sessionCookie) {
    console.error('❌ Error: No session cookie returned.');
    process.exit(1);
  }

  const cookieVal = sessionCookie.split(';')[0];
  console.log(`🍪 Found Session Cookie: ${cookieVal.substring(0, 30)}...`);

  // 2. Fetch Profile
  const profileOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/caregiver/profile',
    method: 'GET',
    headers: {
      'Cookie': cookieVal
    }
  };

  const profileReq = http.request(profileOptions, (profileRes) => {
    console.log(`PROFILE STATUS: ${profileRes.statusCode}`);
    let profileBody = '';
    profileRes.on('data', d => profileBody += d);
    profileRes.on('end', () => {
      console.log(`PROFILE BODY: ${profileBody}`);
      
      // 3. Fetch Lines
      const linesOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/caregiver/lines',
        method: 'GET',
        headers: {
          'Cookie': cookieVal
        }
      };

      const linesReq = http.request(linesOptions, (linesRes) => {
        console.log(`LINES STATUS: ${linesRes.statusCode}`);
        let linesBody = '';
        linesRes.on('data', d => linesBody += d);
        linesRes.on('end', () => {
          console.log(`LINES BODY: ${linesBody}`);
        });
      });
      linesReq.end();
    });
  });
  profileReq.end();
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
