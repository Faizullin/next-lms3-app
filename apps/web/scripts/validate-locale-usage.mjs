import fs from 'fs';
import path from 'path';

function readJsonFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function flattenObjectKeys(object, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(object)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenObjectKeys(value, nextPrefix));
    } else {
      keys.push(nextPrefix);
    }
  }
  return keys;
}

function getAllLocaleKeys(localesDir, localesList) {
  const allKeys = new Set();
  const keysByNamespace = {};
  
  // Use first locale from list to get all available keys
  const primaryLocale = localesList[0];
  const localeDir = path.join(localesDir, primaryLocale);
  
  if (!fs.existsSync(localeDir)) {
    console.warn(`⚠️  Locale directory not found: ${primaryLocale}`);
    return { allKeys, keysByNamespace };
  }
  
  const files = fs.readdirSync(localeDir).filter((f) => {
    return f.endsWith('.json') && 
           !f.includes('_formatted') && 
           !f.startsWith('_');
  });
  
  for (const file of files) {
    const namespace = path.basename(file, '.json');
    const filePath = path.join(localeDir, file);
    
    try {
      const json = readJsonFile(filePath);
      const flattened = flattenObjectKeys(json);
      keysByNamespace[namespace] = new Set(flattened);
      
      for (const key of flattened) {
        allKeys.add(`${namespace}:${key}`);
        allKeys.add(key);
      }
    } catch (_) {}
  }
  
  return { allKeys, keysByNamespace };
}

function walkDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== 'build') {
        walkDirectory(filePath, fileList);
      }
    } else if (stat.isFile() && /\.(tsx?|jsx?)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function extractTranslationInfo(filePath, content) {
  const issues = [];
  
  const useTranslationRegex = /useTranslation\s*\(\s*(?:["'`]([^"'`]+)["'`])?\s*\)/g;
  const getTRegex = /getT\s*\(\s*(?:["'`]([^"'`]+)["'`])?\s*\)/g;
  
  const namespaces = new Set();
  let match;
  
  while ((match = useTranslationRegex.exec(content)) !== null) {
    if (match[1]) {
      namespaces.add(match[1]);
    } else {
      namespaces.add('common');
    }
  }
  
  while ((match = getTRegex.exec(content)) !== null) {
    if (match[1]) {
      namespaces.add(match[1]);
    } else {
      namespaces.add('common');
    }
  }
  
  const tCallRegex = /\bt\s*\(\s*["'`]([^"'`]+)["'`]/g;
  const translations = [];
  
  while ((match = tCallRegex.exec(content)) !== null) {
    translations.push(match[1]);
  }
  
  return { namespaces: Array.from(namespaces), translations };
}

function validateTranslations(filePath, namespaces, translations, allKeys, keysByNamespace) {
  const issues = [];
  
  for (const translation of translations) {
    let found = false;
    
    if (translation.includes(':')) {
      if (allKeys.has(translation)) {
        found = true;
      } else {
        issues.push({
          type: 'missing',
          key: translation,
          message: `Key not found: ${translation}`
        });
      }
    } else {
      if (namespaces.length === 0) {
        namespaces = ['common'];
      }
      
      for (const ns of namespaces) {
        if (keysByNamespace[ns] && keysByNamespace[ns].has(translation)) {
          found = true;
          break;
        }
      }
      
      if (!found) {
        const possibleKeys = namespaces.map(ns => `${ns}:${translation}`).join(' or ');
        issues.push({
          type: 'missing',
          key: translation,
          message: `Key not found in namespaces [${namespaces.join(', ')}]: ${translation}`
        });
      }
    }
  }
  
  return issues;
}

function main(localesList, inputFolders) {
  const root = process.cwd();
  const localesDir = path.join(root, 'public', 'locales');
  
  if (!fs.existsSync(localesDir)) {
    console.error('❌ Locales directory not found:', localesDir);
    process.exit(1);
  }

  console.log(`📚 Loading locale keys from ${localesList[0]}...\n`);
  const { allKeys, keysByNamespace } = getAllLocaleKeys(localesDir, localesList);
  
  console.log(`   Found ${Object.keys(keysByNamespace).length} namespaces: ${Object.keys(keysByNamespace).join(', ')}\n`);
  
  // Scan directories from input folders
  const sourceFiles = [];
  for (const folder of inputFolders) {
    const folderPath = path.join(root, folder.path);
    if (fs.existsSync(folderPath)) {
      const files = walkDirectory(folderPath);
      sourceFiles.push(...files);
    } else {
      console.warn(`⚠️  Folder not found: ${folder.path}`);
    }
  }

  console.log(`🔍 Scanning ${sourceFiles.length} files...\n`);
  
  const fileIssues = [];
  let totalIssues = 0;
  
  for (const filePath of sourceFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { namespaces, translations } = extractTranslationInfo(filePath, content);
      
      if (translations.length === 0) continue;
      
      const issues = validateTranslations(filePath, namespaces, translations, allKeys, keysByNamespace);
      
      if (issues.length > 0) {
        const relativePath = path.relative(root, filePath);
        fileIssues.push({
          file: relativePath,
          namespaces,
          issues
        });
        totalIssues += issues.length;
      }
    } catch (_) {}
  }
  
  const outputLines = [];
  
  if (fileIssues.length === 0) {
    const message = '✅ All translation keys are valid!';
    console.log(message);
    outputLines.push(message);
  } else {
    const header = `=== Translation Validation Issues ===\n`;
    const summary = `Found ${totalIssues} issues in ${fileIssues.length} files\n`;
    
    console.log(header);
    console.log(summary);
    outputLines.push(header);
    outputLines.push(summary);
    
    for (const { file, namespaces, issues } of fileIssues) {
      const fileHeader = `📄 ${file}`;
      console.log(fileHeader);
      outputLines.push(fileHeader);
      
      if (namespaces.length > 0) {
        const nsLine = `   Namespaces: [${namespaces.join(', ')}]`;
        console.log(nsLine);
        outputLines.push(nsLine);
      }
      
      for (const issue of issues) {
        const issueLine = `   ❌ ${issue.message}`;
        console.log(issueLine);
        outputLines.push(issueLine);
      }
      
      console.log('');
      outputLines.push('');
    }
    
    const footer = `\n⚠️  Total: ${totalIssues} missing translation keys`;
    console.log(footer);
    outputLines.push(footer);
  }
  
  const outFile = path.join(root, 'locale-usage-validation.txt');
  try {
    fs.writeFileSync(outFile, outputLines.join('\n'), 'utf8');
    console.log(`\n📝 Report saved to: locale-usage-validation.txt`);
  } catch (_) {}
  
  // Exit with error code if issues found
  if (totalIssues > 0) {
    process.exit(1);
  }
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const LOCALES_LIST = ['en-US', 'ru', 'kz'];

const INPUT_FOLDERS = [
  { name: 'apps/web', path: 'src' },
  { name: 'packages/components-library', path: '../../packages/components-library/src' }
];

main(LOCALES_LIST, INPUT_FOLDERS);

