#!/usr/bin/env node
/**
 * Comprehensive test simulating the exact API route behavior
 */

import fs from 'fs';

// Copy the exact same parseSVG function from the route
async function parseSVG(buffer) {
  const content = buffer.toString('utf-8');
  const allText = [];

  // Extract text from <text> elements and <tspan> elements
  const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
  let match;

  while ((match = textRegex.exec(content)) !== null) {
    const textContent = match[1];

    // Extract tspan content
    const tspanRegex = /<tspan[^>]*>([^<]*)<\/tspan>/g;
    let tspanMatch;
    const tspans = [];

    while ((tspanMatch = tspanRegex.exec(textContent)) !== null) {
      const text = tspanMatch[1].trim();
      if (text) tspans.push(text);
    }

    // If no tspans, extract direct text content
    if (tspans.length === 0) {
      const directText = textContent.replace(/<[^>]*>/g, '').trim();
      if (directText) allText.push(directText);
    } else {
      allText.push(...tspans);
    }
  }

  return allText.join('\n');
}

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function parseStudentRecords(text) {
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    throw new Error('No text found in document');
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

  // Look for headers in first 20 lines
  const maxHeaderSearchLines = Math.min(20, lines.length);

  for (let i = 0; i < maxHeaderSearchLines; i++) {
    for (const [headerKey, pattern] of Object.entries(headerPatterns)) {
      if (pattern.test(lines[i])) {
        if (!headerPositions[headerKey]) {
          headerPositions[headerKey] = i;
          if (headerRowIndex === -1 || i < headerRowIndex) {
            headerRowIndex = i;
          }
        }
      }
    }
  }

  const foundHeaders = Object.keys(headerPositions).length;
  const requiredHeaders = ['name', 'rollNo', 'class', 'section', 'email', 'password'];
  const missingHeaders = requiredHeaders.filter(h => headerPositions[h] === undefined);

  if (foundHeaders === 0) {
    const preview = lines.slice(0, 5).join(' | ');
    throw new Error(
      `No headers detected. Found ${lines.length} text nodes but no valid headers (Name, Roll No, Class, Section, Email, Password). ` +
      `First items: "${preview}"`
    );
  }

  if (missingHeaders.length > 0) {
    throw new Error(
      `Missing required headers: ${missingHeaders.join(', ')}. ` +
      `Found: ${Object.keys(headerPositions).join(', ')}`
    );
  }

  // Determine data row start (after all headers)
  const dataStartIndex = Math.max(...Object.values(headerPositions)) + 1;

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

  if (allHeadersOnSeparateLine) {
    // Headers are on separate lines - group data in chunks of fieldCount
    const dataLines = lines.slice(dataStartIndex);

    for (let i = 0; i < dataLines.length; i += fieldCount) {
      if (i + fieldCount - 1 < dataLines.length) {
        const studentData = dataLines.slice(i, i + fieldCount);

        // Create position-to-field mapping based on headers
        const field = {};

        // Assign data based on column position
        for (let j = 0; j < studentData.length; j++) {
          const headerKey = Object.keys(headerPatterns)[j];
          field[headerKey] = studentData[j];
        }

        // Validate and create student record
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
          }
        }
      }
    }
  } else {
    // Try to parse single-line format with delimiters
    const dataLines = lines.slice(dataStartIndex);

    for (const line of dataLines) {
      const parsed = parseLineIntoFields(line);
      if (parsed && parsed.email && isValidEmail(parsed.email)) {
        students.push(parsed);
      }
    }
  }

  if (students.length === 0) {
    throw new Error(
      `Could not detect any student records. Found headers (${Object.keys(headerPositions).join(', ')}) ` +
      `and ${lines.length - dataStartIndex} data lines, but no valid email addresses detected.`
    );
  }

  return students;
}

function parseLineIntoFields(line) {
  // Try different delimiters
  const delimiters = ['|', ',', '\t', /\s{2,}/];

  for (const delimiter of delimiters) {
    const parts = line.split(delimiter).map(p => (typeof p === 'string' ? p.trim() : p));

    if (parts.length >= 8) {
      const [name, rollNo, classValue, section, fatherName, mobile, email, password] = parts;

      if (isValidEmail(email)) {
        return {
          name,
          rollNo,
          class: classValue,
          section,
          fatherName,
          mobile,
          email,
          password: password || '',
        };
      }
    }
  }

  return null;
}

// Main test
(async () => {
  console.log('🧪 Comprehensive Parser Test (API Simulation)\n');

  try {
    // Read the user's SVG file
    console.log('📖 Reading test-user-svg.svg...');
    const buffer = fs.readFileSync('test-user-svg.svg');
    console.log(`   File size: ${buffer.length} bytes\n`);

    // Parse SVG (step 1 of API route)
    console.log('🔍 Step 1: Parsing SVG...');
    const textContent = await parseSVG(buffer);
    console.log(`   ✅ Text extracted: ${textContent.length} characters\n`);

    // Log first 300 chars
    console.log('📋 Extracted text preview:');
    console.log(textContent.substring(0, 300));
    console.log(`...\n`);

    // Validate text extraction (step 2 of API route)
    console.log('🔎 Step 2: Validating text extraction...');
    if (!textContent || textContent.trim().length === 0) {
      console.error('   ❌ FAILED: No readable text found!');
      process.exit(1);
    }
    console.log(`   ✅ Text validation passed\n`);

    // Parse student records (step 3 of API route)
    console.log('📊 Step 3: Parsing student records...');
    const students = parseStudentRecords(textContent);
    console.log(`   ✅ Successfully parsed ${students.length} student records\n`);

    // Display results
    console.log('📋 Parsed Students:');
    console.log('─'.repeat(100));
    console.log(
      'No | Name                 | Roll No | Email                      | Status'
    );
    console.log('─'.repeat(100));

    students.forEach((student, idx) => {
      console.log(
        `${String(idx + 1).padStart(2)} | ${student.name.padEnd(20)} | ${student.rollNo.padEnd(7)} | ${student.email.padEnd(26)} | ✅ Valid`
      );
    });
    console.log('─'.repeat(100));

    console.log(`\n✅ SUCCESS: All ${students.length} students parsed correctly!`);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
})();
