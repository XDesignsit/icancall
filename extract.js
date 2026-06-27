const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const filesToExtract = [
  'iCanCall 404 (standalone).html',
  'iCanCall Dashboard (standalone).html',
  'iCanCall Landing Page (standalone).html',
  'iCanCall Signup (standalone).html',
  'iCanCall Super Admin (standalone).html',
  'iCanCall Coming Soon (standalone).html'
];

const outputDir = path.join(__dirname, 'extracted_designs');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function extractFile(fileName) {
  const filePath = path.join(__dirname, fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${fileName}: File not found`);
    return;
  }

  console.log(`\n========================================`);
  console.log(`Extracting: ${fileName}`);
  console.log(`========================================`);

  const content = fs.readFileSync(filePath, 'utf8');

  // 1. Extract Manifest JSON
  const manifestMatch = content.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
  // 2. Extract Template JSON
  const templateMatch = content.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);

  const fileBaseName = fileName.replace(' (standalone).html', '').replace(/\s+/g, '_').toLowerCase();
  const fileOutputDir = path.join(outputDir, fileBaseName);
  if (!fs.existsSync(fileOutputDir)) {
    fs.mkdirSync(fileOutputDir, { recursive: true });
  }

  // Save the main template HTML
  if (templateMatch) {
    try {
      const templateHtml = JSON.parse(templateMatch[1].trim());
      fs.writeFileSync(path.join(fileOutputDir, 'template.html'), templateHtml, 'utf8');
      console.log(`Saved template.html for ${fileName}`);
    } catch (e) {
      console.error(`Error parsing template for ${fileName}:`, e.message);
    }
  }

  if (!manifestMatch) {
    console.log(`No manifest found in ${fileName} (may be pure HTML).`);
    return;
  }

  try {
    const manifest = JSON.parse(manifestMatch[1].trim());
    const uuids = Object.keys(manifest);
    console.log(`Found ${uuids.length} assets in manifest.`);

    for (const uuid of uuids) {
      const entry = manifest[uuid];
      const buffer = Buffer.from(entry.data, 'base64');
      
      let finalData;
      if (entry.compressed) {
        try {
          finalData = zlib.gunzipSync(buffer);
        } catch (err) {
          console.error(`Failed to gunzip ${uuid}:`, err.message);
          finalData = buffer;
        }
      } else {
        finalData = buffer;
      }

      // Deduce a reasonable name or use UUID
      // Some templates might include reference comments or IDs
      const extension = entry.mime.includes('javascript') ? 'js' : entry.mime.includes('css') ? 'css' : 'txt';
      const outputFileName = `${uuid}.${extension}`;
      fs.writeFileSync(path.join(fileOutputDir, outputFileName), finalData);
      console.log(`- Extracted asset ${outputFileName} (${entry.mime}, compressed: ${entry.compressed})`);
    }
  } catch (e) {
    console.error(`Error parsing manifest for ${fileName}:`, e);
  }
}

async function run() {
  for (const file of filesToExtract) {
    await extractFile(file);
  }
  console.log('\nUnpacking completed! Files saved in extracted_designs/');
}

run();
