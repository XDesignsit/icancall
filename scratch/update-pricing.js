const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

// 1. Update src/lib/translations.ts
function updateTranslations() {
  const filePath = path.join(projectRoot, 'src/lib/translations.ts');
  if (!fs.existsSync(filePath)) {
    console.log(`Translations file not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace $10.75 with $12.42 (including comma decimals for French/German etc.)
  const count1 = (content.match(/10\.75/g) || []).length;
  const count2 = (content.match(/10,75/g) || []).length;
  content = content.replace(/10\.75/g, '12.42');
  content = content.replace(/10,75/g, '12,42');

  // Replace $16.58 with $20.75
  const count3 = (content.match(/16\.58/g) || []).length;
  const count4 = (content.match(/16,58/g) || []).length;
  content = content.replace(/16\.58/g, '20.75');
  content = content.replace(/16,58/g, '20,75');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated translations in ${filePath}:`);
  console.log(` - 10.75 -> 12.42: ${count1} replacements`);
  console.log(` - 10,75 -> 12,42: ${count2} replacements`);
  console.log(` - 16.58 -> 20.75: ${count3} replacements`);
  console.log(` - 16,58 -> 20,75: ${count4} replacements`);
}

// Helper to perform replacements on a string
function replacePricingStrings(str, filename) {
  let initial = str;

  // Let's log replacements specifically
  // We'll replace the full patterns to avoid partial mismatches or breaking unrelated numbers
  
  // Starting/Monthly Essential
  str = str.replace(/\$12\.99/g, '$14.99');
  str = str.replace(/12,99\s*\$/g, '14,99 $');
  str = str.replace(/12\.99\s*\$/g, '14.99 $');
  // Starting/Monthly Pro
  str = str.replace(/\$19\.99/g, '$24.99');
  str = str.replace(/19,99\s*\$/g, '24,99 $');
  str = str.replace(/19\.99\s*\$/g, '24.99 $');
  
  // Annual Essential
  str = str.replace(/\$129/g, '$149');
  str = str.replace(/129\s*\$/g, '149 $');
  // Annual Pro
  str = str.replace(/\$199/g, '$249');
  str = str.replace(/199\s*\$/g, '249 $');

  // Breakdown Essential
  str = str.replace(/\$10\.75/g, '$12.42');
  str = str.replace(/10,75\s*\$/g, '12,42 $');
  str = str.replace(/10\.75\s*\$/g, '12.42 $');
  // Breakdown Pro
  str = str.replace(/\$16\.58/g, '$20.75');
  str = str.replace(/16,58\s*\$/g, '20,75 $');
  str = str.replace(/16\.58\s*\$/g, '20.75 $');

  if (initial !== str) {
    console.log(`Performed pricing string replacements in: ${filename}`);
  }
  return str;
}

// 2. Update comparison chart HTML files
function updateComparisonCharts() {
  const files = [
    'ICanCall_Comparison_Chart.html',
    'public/comparison-chart.html'
  ];

  files.forEach(file => {
    const filePath = path.join(projectRoot, file);
    if (!fs.existsSync(filePath)) {
      console.log(`Comparison chart file not found: ${file}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    content = replacePricingStrings(content, file);
    fs.writeFileSync(filePath, content, 'utf8');
  });
}

// 3. Update packed/standalone HTML files
const packedFiles = [
  'public/parents.html',
  'public/seniors.html',
  'public/caregivers.html',
  'iCanCall 404 (standalone).html',
  'iCanCall Caregivers Landing (standalone).html',
  'iCanCall Landing Page (standalone).html',
  'iCanCall Onboarding (standalone).html',
  'iCanCall Dashboard (standalone).html',
  'iCanCall Super Admin (standalone).html',
  'iCanCall Parents Landing (standalone).html',
  'iCanCall Seniors Landing (standalone).html',
];

function updatePackedHtmlFiles() {
  packedFiles.forEach(file => {
    const filePath = path.join(projectRoot, file);
    if (!fs.existsSync(filePath)) {
      console.log(`Packed file not found: ${file}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find the __bundler/template script tag
    const templateMatch = content.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);
    if (templateMatch) {
      try {
        const rawJsonString = templateMatch[1].trim();
        let templateHtml = JSON.parse(rawJsonString);
        
        // Modify the template HTML content
        const updatedHtml = replacePricingStrings(templateHtml, `${file} [template]`);
        
        let newJsonString = JSON.stringify(updatedHtml);
        // Safely escape the closing script tags inside JSON
        newJsonString = newJsonString.replace(/<\/script>/g, '<\\/script>');

        const startIdx = content.indexOf(rawJsonString);
        if (startIdx !== -1) {
          const endIdx = startIdx + rawJsonString.length;
          content = content.slice(0, startIdx) + newJsonString + content.slice(endIdx);
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`Successfully packed and wrote updated pricing to: ${file}`);
        } else {
          console.error(`Could not locate the raw JSON template block in: ${file}`);
        }
      } catch (err) {
        console.error(`Error processing JSON template for ${file}:`, err.message);
      }
    } else {
      // Direct replacement for non-templated files or if template is not found
      console.log(`No __bundler/template tag found in ${file}, attempting direct replacement`);
      const updatedContent = replacePricingStrings(content, file);
      if (updatedContent !== content) {
        fs.writeFileSync(filePath, updatedContent, 'utf8');
      }
    }
  });
}

updateTranslations();
updateComparisonCharts();
updatePackedHtmlFiles();
console.log("All pricing updates completed successfully!");
