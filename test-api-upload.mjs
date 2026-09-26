#!/usr/bin/env node

/**
 * Test script to upload SVG file to the API and see detailed response
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testUpload() {
  try {
    const svgFile = path.join(__dirname, 'test-user-data-svg.svg');
    
    if (!fs.existsSync(svgFile)) {
      console.error(`[ERROR] File not found: ${svgFile}`);
      process.exit(1);
    }

    console.log('[TEST] Reading SVG file...');
    const fileBuffer = fs.readFileSync(svgFile);
    console.log(`[TEST] File size: ${fileBuffer.length} bytes\n`);

    // Create FormData
    console.log('[TEST] Creating FormData...');
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'image/svg+xml' });
    formData.append('file', blob, path.basename(svgFile));

    // Post to API
    const url = 'http://localhost:3000/api/admin/student-bulk-upload';
    console.log(`[TEST] POSTing to: ${url}\n`);
    console.log('[TEST] Waiting for response...\n');

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    console.log('\n=== RESPONSE ===');
    console.log(`Status: ${response.status}`);
    console.log('\nResponse Data:');
    console.log(JSON.stringify(data, null, 2));

    if (data.error) {
      console.log('\n[ERROR]', data.error);
      if (data.diagnostics) {
        console.log('\nDiagnostics:');
        console.log(JSON.stringify(data.diagnostics, null, 2));
      }
    } else {
      console.log(`\n[SUCCESS] ${data.successful}/${data.totalStudents} students created`);
    }

  } catch (error) {
    console.error('\n[FATAL ERROR]', error.message);
    process.exit(1);
  }
}

console.log('============================================');
console.log('   Student Upload API Test');
console.log('============================================\n');

testUpload();
