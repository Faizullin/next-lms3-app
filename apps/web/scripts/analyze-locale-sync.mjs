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

function getNamespaceKeys(localesDir, locale, namespace) {
  const filePath = path.join(localesDir, locale, `${namespace}.json`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  try {
    const json = readJsonFile(filePath);
    return new Set(flattenObjectKeys(json));
  } catch (error) {
    console.warn(`⚠️  Error reading ${filePath}:`, error.message);
    return null;
  }
}

function getAllNamespaces(localesDir, sourceLocale) {
  const sourceDir = path.join(localesDir, sourceLocale);
  
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Source locale directory not found: ${sourceLocale}`);
    return [];
  }
  
  const files = fs.readdirSync(sourceDir).filter((f) => {
    return f.endsWith('.json') && 
           !f.includes('_formatted') && 
           !f.startsWith('_');
  });
  
  return files.map(f => path.basename(f, '.json'));
}

function analyzeNamespace(localesDir, namespace, sourceLocale, targetLocales) {
  const sourceKeys = getNamespaceKeys(localesDir, sourceLocale, namespace);
  
  if (!sourceKeys) {
    return {
      namespace,
      error: `Source file not found: ${sourceLocale}/${namespace}.json`,
      targetResults: {}
    };
  }
  
  const targetResults = {};
  
  for (const targetLocale of targetLocales) {
    const targetKeys = getNamespaceKeys(localesDir, targetLocale, namespace);
    
    if (!targetKeys) {
      targetResults[targetLocale] = {
        error: `File not found: ${targetLocale}/${namespace}.json`,
        missing: [],
        extra: []
      };
      continue;
    }
    
    const missing = Array.from(sourceKeys).filter(key => !targetKeys.has(key));
    const extra = Array.from(targetKeys).filter(key => !sourceKeys.has(key));
    
    targetResults[targetLocale] = {
      missing: missing.sort(),
      extra: extra.sort(),
      totalKeys: sourceKeys.size,
      matchedKeys: sourceKeys.size - missing.length,
      coverage: ((sourceKeys.size - missing.length) / sourceKeys.size * 100).toFixed(1)
    };
  }
  
  return {
    namespace,
    sourceKeyCount: sourceKeys.size,
    targetResults
  };
}

function generateReport(analyses, sourceLocale, targetLocales) {
  const lines = [];
  
  lines.push('='.repeat(80));
  lines.push('LOCALE SYNCHRONIZATION ANALYSIS REPORT');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(`Source Locale: ${sourceLocale}`);
  lines.push(`Target Locales: ${targetLocales.join(', ')}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('='.repeat(80));
  lines.push('');
  
  let totalMissing = 0;
  let totalExtra = 0;
  let namespacesWithIssues = 0;
  
  for (const analysis of analyses) {
    const { namespace, sourceKeyCount, targetResults, error } = analysis;
    
    if (error) {
      lines.push(`📄 ${namespace}.json`);
      lines.push(`   ❌ ERROR: ${error}`);
      lines.push('');
      continue;
    }
    
    let hasIssues = false;
    const namespaceIssues = {};
    
    for (const targetLocale of targetLocales) {
      const result = targetResults[targetLocale];
      
      if (result.error) {
        hasIssues = true;
        namespaceIssues[targetLocale] = { error: result.error };
        continue;
      }
      
      if (result.missing.length > 0 || result.extra.length > 0) {
        hasIssues = true;
        namespaceIssues[targetLocale] = {
          missing: result.missing,
          extra: result.extra,
          coverage: result.coverage
        };
        totalMissing += result.missing.length;
        totalExtra += result.extra.length;
      }
    }
    
    if (hasIssues) {
      namespacesWithIssues++;
      lines.push(`📄 ${namespace}.json`);
      lines.push(`   Source Keys: ${sourceKeyCount}`);
      lines.push('');
      
      for (const targetLocale of targetLocales) {
        const result = targetResults[targetLocale];
        const issues = namespaceIssues[targetLocale];
        
        if (!issues) {
          lines.push(`   ✅ ${targetLocale}: Perfect match (${result.coverage}% coverage)`);
          continue;
        }
        
        if (issues.error) {
          lines.push(`   ❌ ${targetLocale}: ${issues.error}`);
          continue;
        }
        
        const status = issues.missing.length === 0 && issues.extra.length === 0 ? '✅' : '⚠️';
        lines.push(`   ${status} ${targetLocale}: ${issues.coverage}% coverage`);
        
        if (issues.missing.length > 0) {
          lines.push(`      🔴 Missing ${issues.missing.length} key(s):`);
          for (const key of issues.missing) {
            lines.push(`         - ${key}`);
          }
        }
        
        if (issues.extra.length > 0) {
          lines.push(`      🟡 Extra ${issues.extra.length} key(s) (not in source):`);
          for (const key of issues.extra) {
            lines.push(`         - ${key}`);
          }
        }
        
        lines.push('');
      }
      
      lines.push('-'.repeat(80));
      lines.push('');
    } else {
      lines.push(`✅ ${namespace}.json - All locales synchronized`);
      lines.push('');
    }
  }
  
  lines.push('='.repeat(80));
  lines.push('SUMMARY');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(`Total Namespaces: ${analyses.length}`);
  lines.push(`Namespaces with Issues: ${namespacesWithIssues}`);
  lines.push(`Perfect Namespaces: ${analyses.length - namespacesWithIssues}`);
  lines.push('');
  lines.push(`Total Missing Keys: ${totalMissing}`);
  lines.push(`Total Extra Keys: ${totalExtra}`);
  lines.push('');
  
  if (namespacesWithIssues === 0) {
    lines.push('🎉 ALL LOCALES ARE PERFECTLY SYNCHRONIZED! 🎉');
  } else {
    lines.push(`⚠️  ${namespacesWithIssues} namespace(s) need attention`);
  }
  
  lines.push('');
  lines.push('='.repeat(80));
  
  return lines.join('\n');
}

function main(sourceLocale, targetLocales) {
  const root = process.cwd();
  const localesDir = path.join(root, 'public', 'locales');
  
  if (!fs.existsSync(localesDir)) {
    console.error('❌ Locales directory not found:', localesDir);
    process.exit(1);
  }
  
  console.log('🔍 Analyzing locale synchronization...\n');
  
  const namespaces = getAllNamespaces(localesDir, sourceLocale);
  
  if (namespaces.length === 0) {
    console.error(`❌ No namespace files found in ${sourceLocale}`);
    process.exit(1);
  }
  
  console.log(`📚 Found ${namespaces.length} namespaces: ${namespaces.join(', ')}\n`);
  console.log(`🎯 Analyzing against source: ${sourceLocale}`);
  console.log(`🌍 Target locales: ${targetLocales.join(', ')}\n`);
  
  const analyses = [];
  
  for (const namespace of namespaces) {
    const analysis = analyzeNamespace(localesDir, namespace, sourceLocale, targetLocales);
    analyses.push(analysis);
  }
  
  const report = generateReport(analyses, sourceLocale, targetLocales);
  
  const outFile = path.join(root, 'locale-sync-analysis.txt');
  try {
    fs.writeFileSync(outFile, report, 'utf8');
    console.log(`\n📝 Report saved to: locale-sync-analysis.txt`);
  } catch (error) {
    console.error('❌ Failed to write report file:', error.message);
  }
  
  console.log('\n✨ Analysis complete!');
}

const SOURCE_LOCALE = 'en-US';
const TARGET_LOCALES = ['kz', 'ru'];

main(SOURCE_LOCALE, TARGET_LOCALES);

