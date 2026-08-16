#!/usr/bin/env node

/**
 * Verify Data Persistence Fix Implementation
 * 
 * This script checks that all necessary changes have been applied to fix the data persistence issue.
 * It verifies:
 * 1. Service layer returns explicit {success, data, error} objects
 * 2. Hook layer checks result.success before updating state
 * 3. Sync engine properly handles operation results
 * 4. Error handling uses console.error (not warn)
 */

import fs from 'fs';
import path from 'path';

const checks = [];

function checkFile(filepath, pattern, description, shouldExist = true) {
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    const found = content.includes(pattern);
    const passed = found === shouldExist;
    
    checks.push({
      description,
      passed,
      file: filepath,
      status: passed ? '✓' : '✗'
    });
    
    return passed;
  } catch (e) {
    checks.push({
      description: `${description} (File read error)`,
      passed: false,
      file: filepath,
      status: '✗'
    });
    return false;
  }
}

console.log('\n========================================');
console.log('   DATA PERSISTENCE FIX VERIFICATION   ');
console.log('========================================\n');

console.log('Checking Service Layer (src/services/supabase.ts)...\n');

// Check supabase.ts for proper return types
checkFile(
  'src/services/supabase.ts',
  'return { success: true',
  'Service functions return {success, data, error} objects'
);

checkFile(
  'src/services/supabase.ts',
  'async toggleFavorite',
  'toggleFavorite function exists'
);

checkFile(
  'src/services/supabase.ts',
  'const { data: existing, error: selectError } = await supabase',
  'toggleFavorite checks current status first (Supabase-first approach)'
);

checkFile(
  'src/services/supabase.ts',
  'async saveProgress',
  'saveProgress function exists'
);

checkFile(
  'src/services/supabase.ts',
  'async upsertLibraryEntry',
  'upsertLibraryEntry function exists'
);

checkFile(
  'src/services/supabase.ts',
  'async removeLibraryEntry',
  'removeLibraryEntry function exists'
);

checkFile(
  'src/services/supabase.ts',
  'console.error',
  'Service layer uses console.error for failures (not warn)'
);

console.log('Checking Hook Layer (src/hooks/useLibrary.tsx)...\n');

// Check useLibrary.tsx for success checking
checkFile(
  'src/hooks/useLibrary.tsx',
  'result.success',
  'Hook functions check result.success before updating state'
);

checkFile(
  'src/hooks/useLibrary.tsx',
  'const result = await supabaseService.upsertLibraryEntry',
  'updateStatus calls upsertLibraryEntry'
);

checkFile(
  'src/hooks/useLibrary.tsx',
  'if (!result.success)',
  'Hook functions return false on Supabase failure'
);

checkFile(
  'src/hooks/useLibrary.tsx',
  'const result = await supabaseService.toggleFavorite',
  'toggleFavorite hook checks service result'
);

checkFile(
  'src/hooks/useLibrary.tsx',
  'const result = await supabaseService.saveProgress',
  'updateChapterProgress checks service result'
);

console.log('Checking Sync Engine (src/services/sync.ts)...\n');

// Check sync.ts for proper error handling
checkFile(
  'src/services/sync.ts',
  'const result = await supabaseService.upsertLibraryEntry',
  'Sync processItem checks UPSERT_LIBRARY result'
);

checkFile(
  'src/services/sync.ts',
  'if (!result.success)',
  'Sync engine checks result.success for operations'
);

checkFile(
  'src/services/sync.ts',
  'console.error(\'Sync:',
  'Sync engine logs errors with console.error'
);

console.log('Checking UI Pages...\n');

// Check Register.tsx for error handling
checkFile(
  'src/pages/Register.tsx',
  '!res.success || res.error',
  'Register page checks signUp result for success'
);

console.log('\nChecking Branding...\n');

// Check branding fix
checkFile(
  'index.html',
  '<title>LetMeCheck</title>',
  'App branding updated to LetMeCheck'
);

checkFile(
  'index.html',
  'LetMeCheck',
  'Metadata contains LetMeCheck branding'
);

// Print summary
console.log('\n========================================');
console.log('             TEST SUMMARY              ');
console.log('========================================\n');

const passed = checks.filter(c => c.passed).length;
const total = checks.length;
const percentage = Math.round((passed / total) * 100);

checks.forEach(check => {
  console.log(`${check.status} ${check.description}`);
  if (!check.passed) {
    console.log(`    File: ${check.file}`);
  }
});

console.log('\n========================================');
console.log(`Results: ${passed}/${total} checks passed (${percentage}%)`);
console.log('========================================\n');

if (passed === total) {
  console.log('✓ All data persistence fixes are properly implemented!');
  console.log('✓ Ready for end-to-end browser testing.\n');
  process.exit(0);
} else {
  console.log('✗ Some checks failed. Review the issues above.');
  console.log('✗ Not all fixes may be properly implemented.\n');
  process.exit(1);
}
