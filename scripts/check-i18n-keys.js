import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { translations } from '../frontend/src/i18n/translations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../frontend/src');

function getAllFiles(dir, exts = ['.jsx', '.js']) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.some((ext) => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = getAllFiles(srcDir);
const usedKeys = new Set();

const tRegex = /\bt\(\s*['"]([a-zA-Z0-9_.]+)['"]\s*\)/g;

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  let match;
  while ((match = tRegex.exec(content)) !== null) {
    usedKeys.add(match[1]);
  }
}

console.log(`Total unique t() keys used in frontend: ${usedKeys.size}`);

const languages = Object.keys(translations);
const missingByLang = {};

for (const lang of languages) {
  missingByLang[lang] = [];
  for (const key of usedKeys) {
    if (!translations[lang][key]) {
      missingByLang[lang].push(key);
    }
  }
}

for (const lang of languages) {
  console.log(`\nLanguage [${lang}]: missing ${missingByLang[lang].length} keys:`);
  if (missingByLang[lang].length > 0) {
    console.log(missingByLang[lang]);
  }
}
