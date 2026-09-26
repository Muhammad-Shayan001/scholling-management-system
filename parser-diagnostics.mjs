#!/usr/bin/env node
/**
 * Comprehensive Parser Diagnostics & Debug Tool
 * Tests the exact parseStudentRecords function from the API
 */

import fs from 'fs';

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function parseStudentRecords(text) {
  console.log('\n=== PARSING DEBUG ===\n');
  
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  console.log(`📊 Total lines extracted: ${lines.length}`);
  console.log('First 10 lines:');
  lines.slice(0, 10).forEach((line, i) => {
    console.log(`  ${i}: "${line}"`);
  });

  if (lines.length === 0) {
    throw new Error('Found 0 text nodes. File appears to be empty or unreadable.');
  }

  // Header patterns for flexible matching
  const headerPatterns = {
    name: /^(name|student name|student's name)$/i,
    rollNo: /^(roll\s?no(?:\.)?|roll\s?number|registration\s?no(?:\.)?|reg\s?no(?:\.)?|reg\.?no|student\s?id)$/i,
    class: /^(class|grade|standard|level)$/i,
    section: /^(section|div|division|stream)$/i,
    fatherName: /^(father\s?name|father's\s?name|parent\s?name|guardian\s?name)$/i,
    mobile: /^(mobile|phone|contact|mobile\s?no(?:\.)?|phone\s?no(?:\.)?|contact\s?number)$/i,
    email: /^(email|email\s?address|e-?mail)$/i,
    password: /^(password|login\s?password|pwd|pass)$/i,
  };

  // Find header row positions
  const headerPositions = {};
  let headerRowIndex = -1;

  const maxHeaderSearchLines = Math.min(20, lines.length);
  
  console.log(`\n🔍 Searching for headers in first ${maxHeaderSearchLines} lines...`);
  
  for (let i = 0; i < maxHeaderSearchLines; i++) {
    for (const [headerKey, pattern] of Object.entries(headerPatterns)) {
      if (pattern.test(lines[i])) {
        if (!headerPositions[headerKey]) {
          headerPositions[headerKey] = i;
          console.log(`  ✓ Found "${headerKey}" at line ${i}: "${lines[i]}"`);
          if (headerRowIndex === -1 || i < headerRowIndex) {
            headerRowIndex = i;
          }
        }
      }
    }
  }

  const foundHeaders = Object.keys(headerPositions).length;
  console.log(`\n📍 Headers found: ${foundHeaders}/8`);
  console.log(`   Positions: ${JSON.stringify(headerPositions)}`);

  const requiredHeaders = ['name', 'rollNo', 'class', 'section', 'email', 'password'];
  const missingHeaders = requiredHeaders.filter(h => headerPositions[h] === undefined);

  if (foundHeaders === 0) {
    const preview = lines.slice(0, 5).join(' | ');
    throw new Error(
      `No headers detected. Found ${lines.length} text nodes but no valid headers. First items: "${preview}"`
    );
  }

  if (missingHeaders.length > 0) {
    throw new Error(
      `Missing required headers: ${missingHeaders.join(', ')}. Found: ${Object.keys(headerPositions).join(', ')}`
    );
  }

  // Determine data row start
  const dataStartIndex = Math.max(...Object.values(headerPositions)) + 1;

  console.log(`\n📋 Data starts at line: ${dataStartIndex}`);
  console.log(`   Total data lines available: ${lines.length - dataStartIndex}`);

  if (dataStartIndex >= lines.length) {
    throw new Error('Headers found but no data rows detected');
  }

  // Group data lines into student records
  const students = [];
  const fieldCount = Object.keys(headerPatterns).length;
  
  // Try to detect if headers are on separate lines
  const allHeadersOnSeparateLine = 
    Object.values(headerPositions).length === fieldCount &&
    Math.max(...Object.values(headerPositions)) - Math.min(...Object.values(headerPositions)) >= fieldCount - 2;

  console.log(`\n🔄 Format detected: ${allHeadersOnSeparateLine ? 'SEPARATE-LINE' : 'SINGLE-LINE'}`);

  if (allHeadersOnSeparateLine) {
    console.log(`\n📦 Grouping data into chunks of ${fieldCount} fields...`);
    
    const dataLines = lines.slice(dataStartIndex);
    console.log(`   Data lines: ${dataLines.length}`);
    
    for (let i = 0; i < dataLines.length; i += fieldCount) {
      if (i + fieldCount - 1 < dataLines.length) {
        const studentData = dataLines.slice(i, i + fieldCount);
        const studentNum = Math.floor(i / fieldCount) + 1;
        
        console.log(`\n   Student ${studentNum}:`);
        const headerKeys = Object.keys(headerPatterns);
        const field = {};
        
        for (let j = 0; j < studentData.length; j++) {
          const headerKey = headerKeys[j];
          field[headerKey] = studentData[j];
          console.log(`     ${headerKey}: "${studentData[j]}"`);
        }

        // Validate email
        if (field.email && isValidEmail(field.email)) {
          const student = {
            name: field.name || '',
            rollNo: field.rollNo || '',
            class: field.class || '',
            section: field.section || '',
            fatherName: field.fatherName || '',
            mobile: field.mobile || '',
            email: field.email,
            password: field.password || '',
          };

          if (student.name && student.email) {
            students.push(student);
            console.log(`     ✅ Valid student - added`);
          } else {
            console.log(`     ❌ Invalid - missing name or email`);
          }
        } else {
          console.log(`     ❌ Invalid email: "${field.email}"`);
        }
      }
    }
  }

  console.log(`\n✅ Total students parsed: ${students.length}`);

  if (students.length === 0) {
    throw new Error(
      `Could not detect any student records. Found headers (${Object.keys(headerPositions).join(', ')}) ` +
      `and ${lines.length - dataStartIndex} data lines, but no valid email addresses detected.`
    );
  }

  return students;
}

// Test with user's SVG format
async function runTest() {
  console.log('🧪 COMPREHENSIVE PARSER DIAGNOSTICS\n');
  
  try {
    const buffer = fs.readFileSync('test-user-svg.svg');
    const content = buffer.toString('utf-8');
    
    // Extract text
    const allText = [];
    const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
    let match;

    while ((match = textRegex.exec(content)) !== null) {
      const textContent = match[1];
      const tspanRegex = /<tspan[^>]*>([^<]*)<\/tspan>/g;
      let tspanMatch;
      const tspans = [];

      while ((tspanMatch = tspanRegex.exec(textContent)) !== null) {
        const text = tspanMatch[1].trim();
        if (text) tspans.push(text);
      }

      if (tspans.length === 0) {
        const directText = textContent.replace(/<[^>]*>/g, '').trim();
        if (directText) allText.push(directText);
      } else {
        allText.push(...tspans);
      }
    }

    const textContent = allText.join('\n');
    console.log(`📝 Text extracted: ${allText.length} elements, ${textContent.length} chars\n`);

    // Parse records
    const students = parseStudentRecords(textContent);

    console.log('\n' + '='.repeat(80));
    console.log('✅ SUCCESS - PARSED STUDENTS:');
    console.log('='.repeat(80));
    students.forEach((s, i) => {
      console.log(`\n${i + 1}. ${s.name} (Roll: ${s.rollNo})`);
      console.log(`   Email: ${s.email}`);
      console.log(`   Class: ${s.class} Section: ${s.section}`);
      if (s.mobile) console.log(`   Mobile: ${s.mobile}`);
    });

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

runTest();
