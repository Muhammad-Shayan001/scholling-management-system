/**
 * Student Records Parser & Auto-Signup System
 * Extracts student data from PDF/SVG and creates accounts automatically
 * Supports both PDF and SVG formats with robust error handling
 */

import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// Parser for extracting text from PDF
async function parsePDF(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(fileBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF parsing error:', error.message);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

// Parser for extracting text from SVG
async function parseSVG(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract all text content from SVG
    const textRegex = /<text[^>]*>([^<]+)<\/text>/g;
    const matches = [];
    let match;
    
    while ((match = textRegex.exec(content)) !== null) {
      matches.push(match[1].trim());
    }
    
    return matches.join('\n');
  } catch (error) {
    console.error('SVG parsing error:', error.message);
    throw new Error(`Failed to parse SVG: ${error.message}`);
  }
}

// Parse text content into structured student records
function parseTextContent(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length === 0) {
    throw new Error('Could not detect any student records. File appears to be empty.');
  }

  // Expected headers
  const expectedHeaders = ['Name', 'Roll No', 'Class', 'Section', 'Father Name', 'Mobile', 'Email', 'Password'];

  // Find header row - look for lines containing these headers (they might be consecutive)
  let headerLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    // Check if this line starts with first header
    if (lines[i] === 'Name') {
      // Check if next 7 lines contain the rest of the headers
      const headersFound = expectedHeaders.every((header, idx) => {
        return i + idx < lines.length && lines[i + idx] === header;
      });
      
      if (headersFound) {
        headerLineIndex = i;
        break;
      }
    }
    
    // Also check for headers on a single line (PDF case)
    if (expectedHeaders.every(header => lines[i].includes(header))) {
      headerLineIndex = i;
      break;
    }
  }

  if (headerLineIndex === -1) {
    throw new Error('Could not detect any student records. Ensure the file has a header row with columns like Name, Roll No, Class, Section, Email, Password.');
  }

  const students = [];
  
  // Skip the header rows (if headers are consecutive, skip them all)
  let dataStartIndex = headerLineIndex + 1;
  if (lines[headerLineIndex] === 'Name') {
    // Headers are consecutive separate lines, skip 8 of them
    dataStartIndex = headerLineIndex + 8;
  }
  
  const dataLines = lines.slice(dataStartIndex);

  // Check if we have separate-line format (SVG) or inline format (PDF/CSV)
  const isSeparateLineFormat = lines[headerLineIndex] === 'Name';

  if (isSeparateLineFormat) {
    // Each field is on a separate line: parse 8 consecutive lines as one student
    for (let i = 0; i < dataLines.length; i += 8) {
      if (i + 7 < dataLines.length) {
        const student = {
          name: dataLines[i],
          rollNo: dataLines[i + 1],
          class: dataLines[i + 2],
          section: dataLines[i + 3],
          fatherName: dataLines[i + 4],
          mobile: dataLines[i + 5],
          email: dataLines[i + 6],
          password: dataLines[i + 7]
        };

        // Validate email
        if (!isValidEmail(student.email)) {
          console.warn(`⚠ Skipping invalid email for ${student.name}: ${student.email}`);
          continue;
        }

        students.push(student);
      }
    }
  } else {
    // Inline format: try to parse each line as a delimited row
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      
      // Try to parse as a CSV-like row or space-separated values
      const fields = parseLineIntoFields(line, expectedHeaders.length);
      
      if (fields.length >= 8) {
        const student = {
          name: fields[0],
          rollNo: fields[1],
          class: fields[2],
          section: fields[3],
          fatherName: fields[4],
          mobile: fields[5],
          email: fields[6],
          password: fields[7]
        };

        // Validate email
        if (!isValidEmail(student.email)) {
          console.warn(`⚠ Skipping invalid email for ${student.name}: ${student.email}`);
          continue;
        }

        students.push(student);
      }
    }
  }

  if (students.length === 0) {
    throw new Error('Could not parse any valid student records from the file.');
  }

  return students;
}

// Parse a line into fields (handles various formats)
function parseLineIntoFields(line, expectedFieldCount) {
  // Try pipe-separated first
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

  // Try multiple spaces as delimiter
  const parts = line.split(/\s{2,}/).map(f => f.trim());
  if (parts.length >= expectedFieldCount * 0.8) {
    return parts;
  }

  // Fallback: try to intelligently split based on common patterns
  return smartSplitLine(line, expectedFieldCount);
}

// Intelligently split a line into expected number of fields
function smartSplitLine(line, expectedFieldCount) {
  // Look for email patterns and phone patterns as delimiters
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /\d{4}-\d{7}/g;
  
  const fields = [];
  let lastIndex = 0;
  
  const emailMatches = [...line.matchAll(emailRegex)];
  const phoneMatches = [...line.matchAll(phoneRegex)];
  
  // This is a fallback - in ideal case, the document is well-formatted
  return line.split(/\s+/).slice(0, expectedFieldCount);
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Mock signup function - replace with actual backend call
async function createStudentAccount(student) {
  try {
    console.log(`Creating account for: ${student.name} (${student.email})`);
    
    // Here you would typically call your backend API or database
    // Example:
    // const response = await fetch('http://localhost:3000/api/auth/signup', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     email: student.email,
    //     password: student.password,
    //     name: student.name,
    //     rollNo: student.rollNo,
    //     class: student.class,
    //     section: student.section,
    //     fatherName: student.fatherName,
    //     mobile: student.mobile
    //   })
    // });
    
    // For now, return success indicator
    return {
      success: true,
      email: student.email,
      name: student.name,
      message: `Account created successfully for ${student.name}`
    };
  } catch (error) {
    return {
      success: false,
      email: student.email,
      name: student.name,
      error: error.message
    };
  }
}

// Main extraction and signup orchestrator
async function processStudentFile(filePath) {
  try {
    console.log(`\n📄 Processing file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Determine file type
    const ext = path.extname(filePath).toLowerCase();
    let textContent;

    if (ext === '.pdf') {
      console.log('📖 Parsing PDF...');
      textContent = await parsePDF(filePath);
    } else if (ext === '.svg') {
      console.log('🎨 Parsing SVG...');
      textContent = await parseSVG(filePath);
    } else {
      throw new Error(`Unsupported file format: ${ext}. Please use PDF or SVG.`);
    }

    // Extract structured student records
    console.log('📊 Extracting student records...');
    const students = parseTextContent(textContent);
    console.log(`✓ Found ${students.length} valid student records\n`);

    // Create accounts for each student
    console.log('👥 Creating student accounts...\n');
    const results = [];

    for (const student of students) {
      const result = await createStudentAccount(student);
      results.push(result);

      if (result.success) {
        console.log(`  ✓ ${student.name} (${student.email})`);
      } else {
        console.log(`  ✗ ${student.name} (${student.email}): ${result.error}`);
      }
    }

    // Summary report
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n📋 Summary:`);
    console.log(`  Total: ${results.length}`);
    console.log(`  ✓ Successful: ${successful}`);
    console.log(`  ✗ Failed: ${failed}`);

    return {
      success: failed === 0,
      totalProcessed: results.length,
      successful,
      failed,
      details: results
    };
  } catch (error) {
    console.error(`\n❌ Parse Error: ${error.message}`);
    process.exit(1);
  }
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: node generate-student-records-parser.mjs <file-path>

Example:
  node generate-student-records-parser.mjs student_records.pdf
  node generate-student-records-parser.mjs student_records.svg

Supported formats: PDF, SVG
    `);
    process.exit(0);
  }

  const filePath = args[0];
  await processStudentFile(filePath);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

export { processStudentFile, parseTextContent, parsePDF, parseSVG };
