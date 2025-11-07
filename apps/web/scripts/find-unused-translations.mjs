import fs from 'fs';
import path from 'path';

/**
 * Find Unused Translations Script
 * 
 * This script finds translation keys that are defined in namespace files
 * but are NOT used in any source files.
 * 
 * It helps identify:
 * 1. Unused/orphaned translation keys
 * 2. Keys that can be safely removed
 * 3. Translation bloat in namespace files
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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
  const keysByNamespace = {};
  
  // Use first locale from list to get all available keys
  const primaryLocale = localesList[0];
  const localeDir = path.join(localesDir, primaryLocale);
  
  if (!fs.existsSync(localeDir)) {
    console.warn(`⚠️  Locale directory not found: ${primaryLocale}`);
    return { keysByNamespace };
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
      keysByNamespace[namespace] = flattened;
    } catch (_) {
      keysByNamespace[namespace] = [];
    }
  }
  
  return { keysByNamespace };
}

function walkDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== 'build' && file !== 'dist') {
        walkDirectory(filePath, fileList);
      }
    } else if (stat.isFile() && /\.(tsx?|jsx?)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Extract all translation keys used in t() calls from file content
 */
function extractUsedKeys(content) {
  const usedKeys = new Set();
  
  // Match t("key"), t('key'), t(`key`), t("namespace:key"), etc.
  // Also handles template literals with variables like t(`namespace:key.${variable}`)
  const tCallRegex = /\bt\s*\(\s*["'`]([^"'`$]+)(?:\$\{[^}]+\})?[^"'`]*["'`]/g;
  
  let match;
  while ((match = tCallRegex.exec(content)) !== null) {
    let fullKey = match[1];
    
    // Remove trailing dots or incomplete parts
    fullKey = fullKey.replace(/\.$/, '');
    
    // Skip if it's just a template variable
    if (!fullKey || fullKey.trim() === '') continue;
    
    usedKeys.add(fullKey);
  }
  
  return usedKeys;
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

function findUnusedTranslations(keysByNamespace, sourceFiles, root) {
  // Collect all used keys from all source files
  const allUsedKeys = new Set();
  
  for (const filePath of sourceFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const usedKeys = extractUsedKeys(content);
      
      for (const key of usedKeys) {
        allUsedKeys.add(key);
      }
    } catch (err) {
      // Skip files that can't be read
    }
  }
  
  // For each namespace, find unused keys
  const unusedByNamespace = {};
  let totalUnused = 0;
  let totalKeys = 0;
  
  for (const [namespace, keys] of Object.entries(keysByNamespace)) {
    const unused = [];
    
    for (const key of keys) {
      totalKeys++;
      const fullKeyWithNs = `${namespace}:${key}`;
      const fullKeyWithoutNs = key;
      
      // Check if used with explicit namespace or implicitly
      const isUsed = allUsedKeys.has(fullKeyWithNs) || 
                     allUsedKeys.has(fullKeyWithoutNs) ||
                     // Check for partial matches (for template literals)
                     Array.from(allUsedKeys).some(usedKey => {
                       return usedKey.startsWith(fullKeyWithNs) || 
                              usedKey.startsWith(fullKeyWithoutNs) ||
                              fullKeyWithNs.startsWith(usedKey) ||
                              fullKeyWithoutNs.startsWith(usedKey);
                     });
      
      if (!isUsed) {
        unused.push(key);
      }
    }
    
    if (unused.length > 0) {
      unusedByNamespace[namespace] = unused;
      totalUnused += unused.length;
    }
  }
  
  return { unusedByNamespace, totalUnused, totalKeys };
}

// ============================================================================
// REPORTING FUNCTIONS
// ============================================================================

function generateUnusedReport(unusedByNamespace, totalUnused, totalKeys, totalFiles) {
  const outputLines = [];
  const usedKeys = totalKeys - totalUnused;
  const usagePercentage = totalKeys > 0 ? ((usedKeys / totalKeys) * 100).toFixed(1) : 0;
  
  const header = '=== Unused Translations Report ===\n';
  const summary = `Scanned ${totalFiles} source files\n` +
                  `Total translation keys: ${totalKeys}\n` +
                  `Used keys: ${usedKeys} (${usagePercentage}%)\n` +
                  `Unused keys: ${totalUnused}\n`;
  
  console.log(header);
  console.log(summary);
  outputLines.push(header);
  outputLines.push(summary);
  
  if (totalUnused === 0) {
    const success = '✅ All translations are being used!\n';
    console.log(success);
    outputLines.push(success);
  } else {
    const namespacesWithUnused = Object.keys(unusedByNamespace).length;
    console.log(`Found unused keys in ${namespacesWithUnused} namespace(s):\n`);
    outputLines.push(`Found unused keys in ${namespacesWithUnused} namespace(s):\n`);
    
    // Sort namespaces by number of unused keys (descending)
    const sortedNamespaces = Object.entries(unusedByNamespace)
      .sort((a, b) => b[1].length - a[1].length);
    
    for (const [namespace, keys] of sortedNamespaces) {
      const namespaceHeader = `\n📄 ${namespace}.json (${keys.length} unused)`;
      const separator = '─'.repeat(60);
      
      console.log(namespaceHeader);
      console.log(separator);
      outputLines.push(namespaceHeader);
      outputLines.push(separator);
      
      // Sort keys alphabetically for easier reading
      const sortedKeys = keys.sort();
      
      for (const key of sortedKeys) {
        const line = `  ❌ ${namespace}:${key}`;
        console.log(line);
        outputLines.push(line);
      }
    }
    
    const footer = `\n⚠️  Total: ${totalUnused} unused translation keys`;
    const recommendation = `\n💡 Recommendation: Review these keys and remove if no longer needed.`;
    
    console.log(footer);
    console.log(recommendation);
    outputLines.push(footer);
    outputLines.push(recommendation);
  }
  
  return outputLines.join('\n');
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main(localesList, inputFolders) {
  const root = process.cwd();
  const localesDir = path.join(root, 'public', 'locales');
  
  if (!fs.existsSync(localesDir)) {
    console.error('❌ Locales directory not found:', localesDir);
    process.exit(1);
  }

  console.log(`📚 Loading locale keys from ${localesList[0]}...\n`);
  const { keysByNamespace } = getAllLocaleKeys(localesDir, localesList);
  
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

  console.log(`🔍 Scanning ${sourceFiles.length} files for translation usage...\n`);
  
  // Find unused translations
  const { unusedByNamespace, totalUnused, totalKeys } = findUnusedTranslations(
    keysByNamespace,
    sourceFiles,
    root
  );
  
  // Generate report
  const report = generateUnusedReport(unusedByNamespace, totalUnused, totalKeys, sourceFiles.length);
  
  // Save to file
  const outFile = path.join(root, 'locale-unused-keys.txt');
  try {
    fs.writeFileSync(outFile, report, 'utf8');
    console.log(`\n📝 Report saved to: locale-unused-keys.txt`);
  } catch (err) {
    console.error('Failed to write report file:', err.message);
  }
  
  // Exit with warning code if unused keys found (but don't fail CI)
  if (totalUnused > 0) {
    console.log(`\n⚠️  Found ${totalUnused} unused keys (this is informational only)`);
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

