#!/usr/bin/env node
/**
 * Test the fixed student records parser
 * Tests SVG text extraction and flexible header detection
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mock the parser functions
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

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function parseLineIntoFields(line) {
  // Try pipe-separated
  if (line.includes('|')) {
    return line.split('|').map(f => f.trim());
  }

  // Try comma-separated
  if (line.includes(',')) {
    return line.split(',').map(f => f.trim());
  }

  // Try tab-separated
  if (line.includes('\t')) {
    return line.split('\t').map(f => f.trim());
  }

  // Try multiple spaces
  return line.split(/\s{2,}/).map(f => f.trim());
}

function parseStudentRecords(text) {
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    throw new Error('Found 0 text nodes. File appears to be empty or unreadable.');
  }

  // Define flexible header patterns
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
  const missingHeaders = requiredHeaders.filter(h => !headerPositions[h]);

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
        
        const field = {};
        
        // Assign data based on position
        const headerKeys = Object.keys(headerPatterns);
        for (let j = 0; j < studentData.length; j++) {
          const headerKey = headerKeys[j];
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
    // Headers might be in a single line or delimited format
    const dataLines = lines.slice(dataStartIndex);
    
    for (const line of dataLines) {
      const fields = parseLineIntoFields(line);
      
      if (fields.length >= 5) {
        const student = {
          name: fields[0] || '',
          rollNo: fields[1] || '',
          class: fields[2] || '',
          section: fields[3] || '',
          fatherName: fields[4] || '',
          mobile: fields[5] || '',
          email: fields[6] || fields[6] || '',
          password: fields[7] || fields[7] || '',
        };

        if (student.email && isValidEmail(student.email) && student.name) {
          students.push(student);
        }
      }
    }
  }

  if (students.length === 0) {
    throw new Error(
      `Found ${lines.length} text nodes and detected headers (${Object.keys(headerPositions).join(', ')}) ` +
      `but could not parse any valid student records. Ensure data rows follow the header row.`
    );
  }

  return students;
}

// Test execution
async function test() {
  console.log('🧪 Testing Fixed Student Records Parser\n');
  
  const svgFile = path.join(__dirname, 'student_records.svg');
  
  if (!fs.existsSync(svgFile)) {
    console.error('❌ SVG file not found:', svgFile);
    process.exit(1);
  }

  try {
    console.log('📖 Reading SVG file...');
    const buffer = fs.readFileSync(svgFile);
    console.log(`   File size: ${buffer.length} bytes\n`);

    console.log('🔍 Extracting text from SVG...');
    const textContent = parseSVG(buffer);
    const lines = textContent.split('\n').filter(l => l.trim());
    console.log(`   Extracted ${lines.length} text nodes`);
    console.log(`   Total text length: ${textContent.length} characters\n`);

    console.log('📋 Parsing student records...');
    const students = parseStudentRecords(textContent);
    console.log(`   ✅ Successfully parsed ${students.length} student records\n`);

    console.log('📊 Student Records:');
    console.log('─'.repeat(120));
    console.log(
      'No | Name                | Roll No | Class | Section | Email                    | Password'
    );
    console.log('─'.repeat(120));
    
    students.forEach((student, idx) => {
      const no = String(idx + 1).padEnd(3);
      const name = student.name.padEnd(20);
      const rollNo = student.rollNo.padEnd(8);
      const cls = student.class.padEnd(6);
      const sec = student.section.padEnd(8);
      const email = student.email.padEnd(25);
      const pass = student.password;
      console.log(`${no}| ${name}| ${rollNo}| ${cls}| ${sec}| ${email}| ${pass}`);
    });
    
    console.log('─'.repeat(120));
    console.log(`\n✅ Test PASSED: All ${students.length} students parsed successfully!`);
    
  } catch (error) {
    console.error('\n❌ Test FAILED:');
    console.error('   Error:', error.message);
    process.exit(1);
  }
}

test();
