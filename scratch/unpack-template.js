const fs = require('fs');
const path = require('path');

const parentsPath = path.join(__dirname, '..', 'public', 'parents.html');
const content = fs.readFileSync(parentsPath, 'utf8');

// The template is JSON encoded inside <script type="__bundler/template">
const templateMatch = content.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);

if (templateMatch) {
  try {
    const rawJSON = templateMatch[1].trim();
    const templateHTML = JSON.parse(rawJSON);
    
    const outputPath = path.join(__dirname, 'parents-template.html');
    fs.writeFileSync(outputPath, templateHTML, 'utf8');
    console.log('Successfully wrote template HTML to:', outputPath);
  } catch (err) {
    console.error('Error parsing JSON:', err);
  }
} else {
  console.log('Template script tag not found');
}
