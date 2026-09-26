/**
 * SVG Student Records Generator
 * Generates a clean, parser-friendly SVG file with student records
 * No complex transforms, nested groups, or CSS that obscures text layers
 */

import fs from 'fs';
import path from 'path';

const studentData = [
  { name: 'Ahmed Khan', rollNo: '001', class: '5', section: 'A', fatherName: 'Khan Sr.', mobile: '0300-1111111', email: 'ahmed.khan@school.com', password: 'UserPass001!' },
  { name: 'Sara Ali', rollNo: '002', class: '5', section: 'A', fatherName: 'Ali Sr.', mobile: '0301-2222222', email: 'sara.ali@school.com', password: 'UserPass002!' },
  { name: 'Zainab Tariq', rollNo: '003', class: '5', section: 'A', fatherName: 'Tariq J.', mobile: '0302-3333333', email: 'zainab.tariq@school.com', password: 'UserPass003!' },
  { name: 'Bilal Hussain', rollNo: '004', class: '5', section: 'A', fatherName: 'Hussain M.', mobile: '0303-4444444', email: 'bilal.hussain@school.com', password: 'UserPass004!' },
  { name: 'Fatima Noor', rollNo: '005', class: '5', section: 'A', fatherName: 'Noor N.', mobile: '0304-5555555', email: 'fatima.noor@school.com', password: 'UserPass005!' },
  { name: 'Omar Farooq', rollNo: '006', class: '5', section: 'A', fatherName: 'Farooq S.', mobile: '0305-6666666', email: 'omar.farooq@school.com', password: 'UserPass006!' },
  { name: 'Ayesha Raza', rollNo: '007', class: '5', section: 'A', fatherName: 'Raza K.', mobile: '0306-7777777', email: 'ayesha.raza@school.com', password: 'UserPass007!' },
  { name: 'Hassan Baloch', rollNo: '008', class: '5', section: 'A', fatherName: 'Baloch H.', mobile: '0307-8888888', email: 'hassan.baloch@school.com', password: 'UserPass008!' },
  { name: 'Mariam Shah', rollNo: '009', class: '5', section: 'A', fatherName: 'Shah T.', mobile: '0308-9999999', email: 'mariam.shah@school.com', password: 'UserPass009!' },
  { name: 'Usman Sheikh', rollNo: '010', class: '5', section: 'A', fatherName: 'Sheikh A.', mobile: '0309-0000000', email: 'usman.sheikh@school.com', password: 'UserPass010!' }
];

// Constants for layout (all in pixels, no transforms needed)
const SVG_WIDTH = 2000;
const SVG_HEIGHT = 2200;
const HEADER_Y = 80;
const ROW_HEIGHT = 120;
const PADDING = 40;
const CELL_PADDING = 8;
const BORDER_WIDTH = 1;

// Column definitions: name, x position, width
const COLUMNS = [
  { header: 'Name', x: PADDING, width: 140 },
  { header: 'Roll No', x: PADDING + 140, width: 80 },
  { header: 'Class', x: PADDING + 220, width: 60 },
  { header: 'Section', x: PADDING + 280, width: 60 },
  { header: 'Father Name', x: PADDING + 340, width: 130 },
  { header: 'Mobile', x: PADDING + 470, width: 120 },
  { header: 'Email', x: PADDING + 590, width: 200 },
  { header: 'Password', x: PADDING + 790, width: 150 }
];

function generateSVG() {
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${SVG_WIDTH}" height="${SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <!-- Background -->
  <rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="#ffffff"/>
  
  <!-- Title -->
  <text x="${SVG_WIDTH / 2}" y="40" font-size="28" font-weight="bold" text-anchor="middle" fill="#1e3a8a">Student Admission Records</text>
  
`;

  // Generate header row
  svg += generateHeaderRow();

  // Generate data rows
  studentData.forEach((student, index) => {
    svg += generateDataRow(student, index);
  });

  svg += `</svg>`;
  
  return svg;
}

function generateHeaderRow() {
  const y = HEADER_Y;
  let svg = '  <!-- Header Row -->\n';
  
  // Header background
  svg += `  <rect x="${PADDING}" y="${y}" width="${SVG_WIDTH - 2 * PADDING}" height="${ROW_HEIGHT}" fill="#1e3a8a" stroke="#0f172a" stroke-width="${BORDER_WIDTH}"/>\n`;
  
  // Header columns
  COLUMNS.forEach(col => {
    // Column divider
    svg += `  <line x1="${col.x}" y1="${y}" x2="${col.x}" y2="${y + ROW_HEIGHT}" stroke="#0f172a" stroke-width="${BORDER_WIDTH}"/>\n`;
    
    // Header text
    svg += `  <text x="${col.x + CELL_PADDING + col.width / 2}" y="${y + ROW_HEIGHT / 2 + 8}" `;
    svg += `font-size="13" font-weight="bold" text-anchor="middle" fill="#ffffff">${col.header}</text>\n`;
  });
  
  // Final right border
  svg += `  <line x1="${PADDING + COLUMNS.reduce((sum, c) => sum + c.width, 0)}" y1="${y}" x2="${PADDING + COLUMNS.reduce((sum, c) => sum + c.width, 0)}" y2="${y + ROW_HEIGHT}" stroke="#0f172a" stroke-width="${BORDER_WIDTH}"/>\n`;
  
  return svg;
}

function generateDataRow(student, index) {
  const y = HEADER_Y + ROW_HEIGHT + (index * ROW_HEIGHT);
  const isEvenRow = index % 2 === 0;
  const bgColor = isEvenRow ? '#f8fafc' : '#ffffff';
  const borderColor = '#cbd5e1';
  
  let svg = `  <!-- Row ${index + 1} -->\n`;
  
  // Row background
  svg += `  <rect x="${PADDING}" y="${y}" width="${SVG_WIDTH - 2 * PADDING}" height="${ROW_HEIGHT}" fill="${bgColor}" stroke="${borderColor}" stroke-width="${BORDER_WIDTH}"/>\n`;
  
  // Data cells
  const cellData = [
    student.name,
    student.rollNo,
    student.class,
    student.section,
    student.fatherName,
    student.mobile,
    student.email,
    student.password
  ];
  
  COLUMNS.forEach((col, colIndex) => {
    // Column divider
    svg += `  <line x1="${col.x}" y1="${y}" x2="${col.x}" y2="${y + ROW_HEIGHT}" stroke="${borderColor}" stroke-width="${BORDER_WIDTH}"/>\n`;
    
    // Cell text (no truncation - include full text for parser)
    let text = cellData[colIndex] || '';
    
    svg += `  <text x="${col.x + CELL_PADDING + 5}" y="${y + ROW_HEIGHT / 2 + 5}" `;
    svg += `font-size="11" fill="#1e293b">${escapeXml(text)}</text>\n`;
  });
  
  // Final right border
  svg += `  <line x1="${PADDING + COLUMNS.reduce((sum, c) => sum + c.width, 0)}" y1="${y}" x2="${PADDING + COLUMNS.reduce((sum, c) => sum + c.width, 0)}" y2="${y + ROW_HEIGHT}" stroke="${borderColor}" stroke-width="${BORDER_WIDTH}"/>\n`;
  
  return svg;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function main() {
  const svg = generateSVG();
  const outputPath = path.join(process.cwd(), 'student_records.svg');
  
  fs.writeFileSync(outputPath, svg, 'utf-8');
  console.log(`✓ SVG generated successfully: ${outputPath}`);
  console.log(`✓ Total students: ${studentData.length}`);
  console.log(`✓ File size: ${(svg.length / 1024).toFixed(2)} KB`);
  console.log(`✓ Structure: Flat, parser-friendly grid table`);
}

main();
