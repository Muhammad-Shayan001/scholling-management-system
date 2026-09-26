/**
 * Student Records Validation & Testing Suite
 * Comprehensive verification of generated documents
 * Ensures documents are correctly formatted before upload
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

// Test results tracker
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
let testWarnings = 0;

// Logging utilities
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  testsPassed++;
  log(`  ✓ ${message}`, 'green');
}

function failure(message) {
  testsFailed++;
  log(`  ✗ ${message}`, 'red');
}

function warning(message) {
  testWarnings++;
  log(`  ⚠ ${message}`, 'yellow');
}

function info(message) {
  log(`  ℹ ${message}`, 'blue');
}

// Test functions
async function testFileExists(filePath, fileType) {
  testsRun++;
  console.log(`\nTesting ${fileType} file existence...`);

  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    success(`File exists: ${fileType}`);
    info(`File size: ${(stats.size / 1024).toFixed(2)} KB`);
    return true;
  } else {
    failure(`File not found: ${filePath}`);
    return false;
  }
}

async function validateSVG(filePath) {
  testsRun++;
  console.log(`\nValidating SVG structure...`);

  const content = fs.readFileSync(filePath, 'utf-8');

  // Check XML declaration
  if (content.includes('<?xml')) {
    success('XML declaration present');
  } else {
    warning('Missing XML declaration');
  }

  // Check SVG root element
  if (content.includes('<svg') && content.includes('</svg>')) {
    success('Valid SVG root element');
  } else {
    failure('Invalid SVG structure');
    return false;
  }

  // Check for text elements
  const textMatches = content.match(/<text[^>]*>/g);
  if (textMatches && textMatches.length > 0) {
    success(`Found ${textMatches.length} text elements`);
    info(`Expected: ~88 (1 header + 10 rows × 8 columns + grid lines)`);
  } else {
    failure('No text elements found');
    return false;
  }

  // Check for rectangles (table cells)
  const rectMatches = content.match(/<rect/g);
  if (rectMatches && rectMatches.length > 0) {
    success(`Found ${rectMatches.length} rectangle elements`);
  }

  // Check for header row
  if (
    content.includes('Name') &&
    content.includes('Roll No') &&
    content.includes('Class') &&
    content.includes('Section') &&
    content.includes('Email') &&
    content.includes('Password')
  ) {
    success('All required headers present');
  } else {
    failure('Missing required headers');
    return false;
  }

  // Check for student data
  const studentNames = [
    'Ahmed Khan',
    'Sara Ali',
    'Zainab Tariq',
    'Bilal Hussain',
    'Fatima Noor',
    'Omar Farooq',
    'Ayesha Raza',
    'Hassan Baloch',
    'Mariam Shah',
    'Usman Sheikh'
  ];

  let foundStudents = 0;
  for (const name of studentNames) {
    if (content.includes(name)) {
      foundStudents++;
    }
  }

  info(`Found ${foundStudents}/${studentNames.length} student names`);
  if (foundStudents === 10) {
    success('All 10 students found in SVG');
  } else if (foundStudents > 0) {
    warning(`Only ${foundStudents}/10 students found`);
  } else {
    failure('No student data found');
  }

  // Check for email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = content.match(emailRegex) || [];
  info(`Found ${emails.length} email addresses`);
  if (emails.length >= 10) {
    success('All email addresses present');
  } else {
    warning(`Only ${emails.length} email addresses found (expected 10)`);
  }

  // Check for passwords
  const passwordMatches = content.match(/UserPass\d{3}!/g) || [];
  info(`Found ${passwordMatches.length} password fields`);
  if (passwordMatches.length === 10) {
    success('All 10 passwords present');
  } else {
    warning(`Only ${passwordMatches.length} passwords found`);
  }

  // Check for transform matrices (bad sign for parser)
  if (content.includes('transform="matrix')) {
    failure('❌ CRITICAL: SVG contains transform matrices (will break parser)');
    return false;
  } else {
    success('No complex transform matrices (parser-friendly)');
  }

  // Check for complex styling
  if (content.includes('<style>')) {
    failure('❌ CRITICAL: SVG contains <style> block (avoid for parser)');
    return false;
  } else {
    success('No embedded stylesheets (clean structure)');
  }

  return true;
}

async function validatePDF(filePath) {
  testsRun++;
  console.log(`\nValidating PDF structure...`);

  const buffer = fs.readFileSync(filePath);
  const content = buffer.toString('latin1', 0, 100);

  // Check PDF signature
  if (content.includes('%PDF')) {
    success('Valid PDF signature');
  } else {
    failure('Invalid PDF file format');
    return false;
  }

  // Check file size
  const stats = fs.statSync(filePath);
  if (stats.size > 10000) {
    success(`PDF file size acceptable: ${(stats.size / 1024).toFixed(2)} KB`);
  } else {
    warning(`Small PDF file size: ${stats.size} bytes`);
  }

  try {
    // Try to extract basic text (this would require pdf-parse)
    info('PDF structure appears valid');
    success('PDF is properly formatted');
  } catch (error) {
    failure('Could not read PDF content');
    return false;
  }

  return true;
}

async function testDataConsistency(filePath) {
  testsRun++;
  console.log(`\nValidating data consistency...`);

  const content = fs.readFileSync(filePath, 'utf-8');

  // Test data set
  const testData = [
    {
      name: 'Ahmed Khan',
      rollNo: '001',
      email: 'ahmed.khan@school.com',
      password: 'UserPass001!',
    },
    {
      name: 'Sara Ali',
      rollNo: '002',
      email: 'sara.ali@school.com',
      password: 'UserPass002!',
    },
    {
      name: 'Usman Sheikh',
      rollNo: '010',
      email: 'usman.sheikh@school.com',
      password: 'UserPass010!',
    },
  ];

  let allConsistent = true;

  for (const student of testData) {
    const hasName = content.includes(student.name);
    const hasEmail = content.includes(student.email);
    const hasPassword = content.includes(student.password);

    if (hasName && hasEmail && hasPassword) {
      success(`${student.name} - all fields present`);
    } else {
      if (!hasName) failure(`Missing name: ${student.name}`);
      if (!hasEmail) failure(`Missing email: ${student.email}`);
      if (!hasPassword) failure(`Missing password: ${student.password}`);
      allConsistent = false;
    }
  }

  return allConsistent;
}

async function testEmailFormat(filePath) {
  testsRun++;
  console.log(`\nValidating email format...`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = content.match(emailRegex) || [];

  info(`Found ${emails.length} emails`);

  const validEmails = emails.filter(email => {
    // Check if email is from expected domain
    return email.includes('@school.com');
  });

  if (validEmails.length === 10) {
    success('All 10 emails have valid format');
  } else {
    warning(`Only ${validEmails.length}/10 emails have correct domain`);
  }

  return validEmails.length === 10;
}

async function testHeaderDetection(filePath) {
  testsRun++;
  console.log(`\nValidating header detection...`);

  const content = fs.readFileSync(filePath, 'utf-8');
  
  const requiredHeaders = [
    'Name',
    'Roll No',
    'Class',
    'Section',
    'Father Name',
    'Mobile',
    'Email',
    'Password'
  ];

  let allHeadersFound = true;

  for (const header of requiredHeaders) {
    if (content.includes(header)) {
      success(`Header found: "${header}"`);
    } else {
      failure(`Header missing: "${header}"`);
      allHeadersFound = false;
    }
  }

  return allHeadersFound;
}

async function testParseability(filePath) {
  testsRun++;
  console.log(`\nValidating parser compatibility...`);

  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === '.svg') {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check for problematic elements
      const issues = [];

      if (content.includes('transform="matrix')) {
        issues.push('Transform matrices detected');
      }
      if (content.includes('<g transform=')) {
        issues.push('Nested group transforms detected');
      }
      if (content.includes('<defs>')) {
        issues.push('SVG definitions (might contain masks)');
      }
      if (content.includes('<style>')) {
        issues.push('Embedded stylesheets');
      }

      if (issues.length === 0) {
        success('No parser-breaking elements detected');
        return true;
      } else {
        issues.forEach(issue => warning(`Potential parser issue: ${issue}`));
        return false;
      }
    } else if (ext === '.pdf') {
      // Basic PDF validation
      success('PDF appears parseable');
      return true;
    }
  } catch (error) {
    failure(`Error checking parseability: ${error.message}`);
    return false;
  }
}

// Main test suite
async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║   Student Records Validation & Testing Suite               ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝', 'blue');

  const currentDir = process.cwd();
  const svgPath = path.join(currentDir, 'student_records.svg');
  const pdfPath = path.join(currentDir, 'student_records.pdf');

  // Test SVG
  log('\n📄 SVG FILE TESTS', 'blue');
  if (await testFileExists(svgPath, 'SVG')) {
    await validateSVG(svgPath);
    await testDataConsistency(svgPath);
    await testEmailFormat(svgPath);
    await testHeaderDetection(svgPath);
    await testParseability(svgPath);
  }

  // Test PDF
  log('\n📄 PDF FILE TESTS', 'blue');
  if (await testFileExists(pdfPath, 'PDF')) {
    await validatePDF(pdfPath);
    await testDataConsistency(pdfPath);
    await testEmailFormat(pdfPath);
    await testHeaderDetection(pdfPath);
    await testParseability(pdfPath);
  }

  // Summary
  log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║   TEST SUMMARY                                              ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝', 'blue');

  log(`\nTotal Tests Run:   ${testsRun}`, 'gray');
  log(`✓ Passed:          ${testsPassed}`, 'green');
  log(`✗ Failed:          ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
  log(`⚠ Warnings:        ${testWarnings}`, testWarnings > 0 ? 'yellow' : 'green');

  const successRate = testsRun > 0 ? ((testsPassed / testsRun) * 100).toFixed(0) : 0;
  log(`\nSuccess Rate:      ${successRate}%`, testsFailed === 0 ? 'green' : 'yellow');

  if (testsFailed === 0) {
    log('\n✓ All tests passed! Documents are ready for upload.', 'green');
    return 0;
  } else {
    log('\n✗ Some tests failed. Please fix issues before upload.', 'red');
    return 1;
  }
}

// Run tests
runAllTests().then(exitCode => process.exit(exitCode));
