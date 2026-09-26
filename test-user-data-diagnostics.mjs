#!/usr/bin/env node

/**
 * Diagnostic script to test user's actual SVG data
 * Tests the exact 10 students provided by the user
 */

import fs from 'fs';
import path from 'path';

// Parse SVG file - extract all text including tspan elements
function parseSVG(buffer) {
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

// Parse student records from text
function parseStudentRecords(text) {
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  console.log(`[LINES] Total text lines: ${lines.length}`);
  console.log(`[LINES] First 20 lines:`, lines.slice(0, 20));

  // Define flexible header patterns
  const headerPatterns = {
    name: /^(name|student name|student's name)$/i,
    rollNo: /^(roll\s?no(?:\.)?|roll\s?number|registration\s?no(?:\.)?|reg\s?no(?:\.)?|reg\.?no|student\s?id)$/i,
    class: /^(class|grade|standard|level)$/i,
    section: /^(section|div|division|stream)$/i,
    fatherName: /^(father\s?name|father's\s?name|parent\s?name|guardian\s?name)$/i,
    mobile: /^(mobile|phone|contact|mobile\s?no(?:\.)?|phone\s?no(?:\.)?|contact\s?number)$/i,
    email: /^(email|email\s?address|e-?mail)$/i,
    password: /^(password|pass|pwd|pass\s?word)$/i,
  };

  // Find header positions
  console.log('[HEADERS] Looking for headers...');
  const headerPositions = {};
  for (const [i, line] of lines.entries()) {
    for (const [headerKey, pattern] of Object.entries(headerPatterns)) {
      if (pattern.test(line)) {
        headerPositions[headerKey] = i;
        console.log(`  Found "${headerKey}" at line ${i}: "${line}"`);
      }
    }
  }

  const headerCount = Object.keys(headerPositions).length;
  console.log(`[HEADERS] Total headers found: ${headerCount}/8`);

  if (headerCount === 0) {
    throw new Error('No headers detected. Ensure file has: Name, Roll No, Class, Section, Father Name, Mobile, Email, Password');
  }

  // Find data start index (first line after last header)
  const dataStartIndex = Math.max(...Object.values(headerPositions)) + 1;
  console.log(`[DATA START] Data starts at line ${dataStartIndex}`);

  // Group data lines into student records
  const students = [];
  const fieldCount = Object.keys(headerPatterns).length;
  
  // Check if headers are on separate lines
  const headerLineIndices = Object.values(headerPositions);
  const allHeadersOnSeparateLine = 
    headerCount === fieldCount &&
    Math.max(...headerLineIndices) - Math.min(...headerLineIndices) >= fieldCount - 2;

  console.log(`[FORMAT] Separate-line format: ${allHeadersOnSeparateLine}`);

  if (allHeadersOnSeparateLine) {
    // Headers are on separate lines - group data in chunks of fieldCount
    const dataLines = lines.slice(dataStartIndex);
    console.log(`[DATA] Data lines: ${dataLines.length}`);
    console.log(`[DATA] Grouping by ${fieldCount} fields per student`);
    
    for (let i = 0; i < dataLines.length; i += fieldCount) {
      if (i + fieldCount - 1 < dataLines.length) {
        const studentData = dataLines.slice(i, i + fieldCount);
        const field = {};
        
        // Assign data based on header order
        const headerKeys = Object.keys(headerPatterns);
        for (let j = 0; j < Math.min(studentData.length, headerKeys.length); j++) {
          field[headerKeys[j]] = studentData[j] || '';
        }

        // Validate: must have name, email, and valid email format
        const hasRequiredFields = field.name && field.name.trim().length > 0 && 
                                 field.email && field.email.trim().length > 0;
        
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.email.trim());
        
        if (hasRequiredFields && isValidEmail) {
          const student = {
            name: field.name.trim(),
            rollNo: field.rollNo?.trim() || '',
            class: field.class?.trim() || '',
            section: field.section?.trim() || '',
            fatherName: field.fatherName?.trim() || '',
            mobile: field.mobile?.trim() || '',
            email: field.email.trim(),
            password: (field.password?.trim() || 'DefaultPass123!'),
          };
          
          students.push(student);
          console.log(`[✓] Student ${students.length}: ${student.name} (${student.email})`);
        } else {
          console.log(`[✗] Skipped: name="${field.name}" email="${field.email}" valid=${isValidEmail}`);
        }
      }
    }
  } else {
    // Single-line or delimited format
    console.log('[FORMAT] Using single-line/delimited parsing');
    const dataLines = lines.slice(dataStartIndex);
    
    for (const line of dataLines) {
      const fields = line.split(/\s{2,}/).map(f => f.trim());
      
      if (fields.length >= 5) {
        const student = {
          name: (fields[0] || '').trim(),
          rollNo: (fields[1] || '').trim(),
          class: (fields[2] || '').trim(),
          section: (fields[3] || '').trim(),
          fatherName: (fields[4] || '').trim(),
          mobile: (fields[5] || '').trim(),
          email: (fields[6] || '').trim(),
          password: (fields[7] || 'DefaultPass123!').trim(),
        };

        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email);
        
        if (student.name.length > 0 && isValidEmail) {
          students.push(student);
          console.log(`[✓] Student ${students.length}: ${student.name} (${student.email})`);
        }
      }
    }
  }

  if (students.length === 0) {
    throw new Error(
      `Could not detect any student records. Found headers (${Object.keys(headerPositions).join(', ')}) ` +
      `and ${lines.length - dataStartIndex} data lines.`
    );
  }

  return students;
}

// Main
async function main() {
  try {
    const svgFile = path.join(process.cwd(), 'test-user-data-svg.svg');
    
    if (!fs.existsSync(svgFile)) {
      console.error(`File not found: ${svgFile}`);
      process.exit(1);
    }

    console.log(`[START] Testing SVG file: ${svgFile}`);
    console.log('---');

    // Read and parse SVG
    const buffer = fs.readFileSync(svgFile);
    console.log(`[FILE] Size: ${buffer.length} bytes\n`);

    const textContent = parseSVG(buffer);
    console.log(`\n[TEXT] Extracted ${textContent.length} characters\n`);

    // Parse students
    const students = parseStudentRecords(textContent);
    
    console.log(`\n---`);
    console.log(`[FINAL] Successfully parsed ${students.length} students!\n`);
    
    // Display each student
    students.forEach((s, i) => {
      console.log(`${i + 1}. ${s.name}`);
      console.log(`   Roll: ${s.rollNo}, Class: ${s.class}, Section: ${s.section}`);
      console.log(`   Father: ${s.fatherName}`);
      console.log(`   Mobile: ${s.mobile}`);
      console.log(`   Email: ${s.email}`);
      console.log(`   Password: ${s.password}`);
      console.log();
    });
    
  } catch (error) {
    console.error('\n[ERROR]', error.message);
    process.exit(1);
  }
}

main();
