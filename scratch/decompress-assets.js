const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const parentsPath = path.join(__dirname, '..', 'public', 'parents.html');
const content = fs.readFileSync(parentsPath, 'utf8');

const manifestMatch = content.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);

if (manifestMatch) {
  try {
    const manifest = JSON.parse(manifestMatch[1].trim());
    const uuid = '61b29d69-e725-4072-9983-c8e66644aee2';
    const entry = manifest[uuid];
    
    if (entry) {
      const buffer = Buffer.from(entry.data, 'base64');
      
      zlib.gunzip(buffer, (err, decompressed) => {
        if (err) {
          console.error('Gunzip error:', err);
          return;
        }
        
        const jsCode = decompressed.toString('utf8');
        const outputPath = path.join(__dirname, 'unpacked-asset.js');
        fs.writeFileSync(outputPath, jsCode, 'utf8');
        console.log('Successfully wrote decompressed JS to:', outputPath);
      });
    } else {
      console.log('Asset uuid not found in manifest');
    }
  } catch (err) {
    console.error('Error parsing manifest:', err);
  }
} else {
  console.log('Manifest script tag not found');
}
