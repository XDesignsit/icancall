const fs = require('fs');
const path = require('path');

// 1. Reset local_db.json
try {
  const dbPath = path.join(__dirname, '../scratch/local_db.json');
  if (fs.existsSync(dbPath)) {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    if (db.profiles && db.profiles.length > 0) {
      db.profiles.forEach(p => {
        if (p.settings && p.settings.addons) {
          p.settings.addons.extraNumbers = 0;
          console.log(`Reset extraNumbers to 0 for profile ${p.email} in local_db.json`);
        }
      });
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    }
  }
} catch (err) {
  console.error('Failed to reset local_db.json:', err.message);
}

// 2. Reset Supabase if configured
try {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = match[2] || '';
        if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
        env[match[1]] = val.trim();
      }
    });

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      console.log('Connecting to Supabase to reset addons.extraNumbers...');
      fetch(`${supabaseUrl}/rest/v1/profiles?select=*`, {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      })
      .then(res => res.json())
      .then(async (profiles) => {
        if (!Array.isArray(profiles)) {
          console.log('No profiles found or invalid response:', profiles);
          return;
        }
        for (const p of profiles) {
          if (p.settings && p.settings.addons && p.settings.addons.extraNumbers !== 0) {
            const updatedSettings = { ...p.settings };
            updatedSettings.addons = { ...updatedSettings.addons, extraNumbers: 0 };
            
            const updateRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${p.id}`, {
              method: 'PATCH',
              headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ settings: updatedSettings })
            });
            if (updateRes.ok) {
              console.log(`✅ Successfully reset extraNumbers to 0 for profile ${p.email} in Supabase.`);
            } else {
              console.error(`❌ Failed to reset profile ${p.email}:`, await updateRes.text());
            }
          }
        }
      })
      .catch(err => {
        console.error('Error querying profiles in Supabase:', err.message);
      });
    }
  }
} catch (err) {
  console.error('Failed to reset Supabase database:', err.message);
}
