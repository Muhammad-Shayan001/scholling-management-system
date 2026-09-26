#!/usr/bin/env node
/**
 * Debug parser with user's SVG format
 */

import fs from 'fs';

function parseSVG(buffer) {
  const content = buffer.toString('utf-8');
  console.log('📝 Raw SVG content length:', content.length);
  
  const allText = [];
  
  // Extract text from <text> elements and <tspan> elements
  const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
  let match;
  let matchCount = 0;
  
  while ((match = textRegex.exec(content)) !== null) {
    matchCount++;
    const textContent = match[1];
    console.log(`  Match ${matchCount}: "${textContent}"`);
    
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
      if (directText) {
        allText.push(directText);
        console.log(`    → Extracted: "${directText}"`);
      }
    } else {
      allText.push(...tspans);
      console.log(`    → Extracted tspans: ${tspans.join(', ')}`);
    }
  }
  
  const result = allText.join('\n');
  console.log(`\n✅ Total text extracted: ${allText.length} elements`);
  console.log(`✅ Total characters: ${result.length}`);
  console.log(`\n📋 Extracted text preview:\n${result.substring(0, 300)}...\n`);
  
  return result;
}

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Main
try {
  console.log('🔍 Testing SVG Parser with User Format\n');
  
  const buffer = fs.readFileSync('test-user-svg.svg');
  const textContent = parseSVG(buffer);
  
  const lines = textContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  console.log(`📊 Lines extracted: ${lines.length}\n`);
  console.log('First 20 lines:');
  lines.slice(0, 20).forEach((line, idx) => {
    console.log(`  ${idx}: "${line}"`);
  });
  
  // Test header detection
  console.log('\n🔎 Testing header detection:\n');
  
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
  
  const headerPositions = {};
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    for (const [headerKey, pattern] of Object.entries(headerPatterns)) {
      if (pattern.test(lines[i])) {
        if (!headerPositions[headerKey]) {
          headerPositions[headerKey] = i;
          console.log(`  ✓ Found "${headerKey}" at line ${i}: "${lines[i]}"`);
        }
      }
    }
  }
  
  const foundHeaders = Object.keys(headerPositions).length;
  console.log(`\n📍 Headers found: ${foundHeaders}/8`);
  console.log(`   Positions: ${JSON.stringify(headerPositions)}`);
  
  if (foundHeaders > 0) {
    const dataStartIndex = Math.max(...Object.values(headerPositions)) + 1;
    console.log(`   Data starts at line: ${dataStartIndex}`);
    
    const fieldCount = Object.keys(headerPatterns).length;
    const allHeadersOnSeparateLine = 
      Object.values(headerPositions).length === fieldCount &&
      Math.max(...Object.values(headerPositions)) - Math.min(...Object.values(headerPositions)) >= fieldCount - 2;
    
    console.log(`   Headers on separate lines: ${allHeadersOnSeparateLine}`);
    
    // Try parsing
    if (allHeadersOnSeparateLine) {
      console.log(`\n🔄 Parsing student records (separate-line format):\n`);
      const dataLines = lines.slice(dataStartIndex);
      let studentCount = 0;
      
      for (let i = 0; i < dataLines.length; i += fieldCount) {
        if (i + fieldCount - 1 < dataLines.length) {
          const studentData = dataLines.slice(i, i + fieldCount);
          const field = {};
          const headerKeys = Object.keys(headerPatterns);
          
          for (let j = 0; j < studentData.length; j++) {
            const headerKey = headerKeys[j];
            field[headerKey] = studentData[j];
          }
          
          if (field.email && isValidEmail(field.email)) {
            studentCount++;
            console.log(`  Student ${studentCount}:`);
            console.log(`    Name: ${field.name}`);
            console.log(`    Email: ${field.email}`);
            console.log(`    Roll No: ${field.rollNo}`);
            console.log(`    Status: ✅ Valid\n`);
          }
        }
      }
      
      if (studentCount > 0) {
        console.log(`✅ SUCCESS: Parsed ${studentCount} students!`);
      } else {
        console.log(`❌ FAILED: No valid students found despite parsing`);
      }
    }
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
