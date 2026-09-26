/**
 * PDF Student Records Generator
 * Generates a clean, parser-friendly PDF file with student records
 * Uses PDFKit for reliable PDF generation
 */

import PDFDocument from 'pdfkit';
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

// Column definitions
const COLUMNS = [
  { header: 'Name', key: 'name', width: 85 },
  { header: 'Roll No', key: 'rollNo', width: 55 },
  { header: 'Class', key: 'class', width: 40 },
  { header: 'Section', key: 'section', width: 45 },
  { header: 'Father Name', key: 'fatherName', width: 75 },
  { header: 'Mobile', key: 'mobile', width: 80 },
  { header: 'Email', key: 'email', width: 100 },
  { header: 'Password', key: 'password', width: 85 }
];

class StudentRecordsPDFGenerator {
  constructor() {
    this.doc = null;
    this.pageWidth = 0;
    this.pageHeight = 0;
    this.margins = 30;
    this.headerColor = '#1e3a8a';
    this.alternateRowColor = '#f8fafc';
    this.borderColor = '#cbd5e1';
    this.textColor = '#1e293b';
  }

  generate(outputPath) {
    this.doc = new PDFDocument({
      size: 'A3',
      margin: this.margins,
      bufferPages: true
    });

    this.pageWidth = this.doc.page.width;
    this.pageHeight = this.doc.page.height;

    const stream = fs.createWriteStream(outputPath);
    this.doc.pipe(stream);

    this.addTitle();
    this.addTable();

    this.doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve(outputPath);
      });
      stream.on('error', reject);
    });
  }

  addTitle() {
    this.doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor(this.headerColor)
      .text('Student Admission Records', { align: 'center' })
      .moveDown(0.5);

    this.doc.stroke();
  }

  addTable() {
    const startY = this.doc.y;
    const tableWidth = this.pageWidth - 2 * this.margins;
    const rowHeight = 30;
    const headerRowHeight = 35;

    let currentY = startY;

    // Draw header row
    currentY = this.drawHeaderRow(currentY, tableWidth, headerRowHeight);

    // Draw data rows
    studentData.forEach((student, index) => {
      const isEvenRow = index % 2 === 0;
      currentY = this.drawDataRow(student, currentY, tableWidth, rowHeight, isEvenRow);

      // Check if we need a new page
      if (currentY > this.pageHeight - this.margins - 50) {
        this.doc.addPage();
        currentY = this.margins + 20;
        currentY = this.drawHeaderRow(currentY, tableWidth, headerRowHeight);
      }
    });
  }

  drawHeaderRow(startY, tableWidth, rowHeight) {
    const cellStartX = this.margins;

    // Draw header background
    this.doc
      .rect(cellStartX, startY, tableWidth, rowHeight)
      .fillAndStroke(this.headerColor, this.borderColor);

    // Draw column headers
    let currentX = cellStartX;
    this.doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('white');

    COLUMNS.forEach((col) => {
      this.drawCell(currentX, startY, col.width, rowHeight, col.header, 'center', 'middle');
      currentX += col.width;
    });

    return startY + rowHeight;
  }

  drawDataRow(student, startY, tableWidth, rowHeight, isEvenRow) {
    const cellStartX = this.margins;

    // Draw row background
    const bgColor = isEvenRow ? this.alternateRowColor : 'white';
    this.doc
      .rect(cellStartX, startY, tableWidth, rowHeight)
      .fillAndStroke(bgColor, this.borderColor);

    // Draw cell borders and content
    let currentX = cellStartX;
    this.doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(this.textColor);

    COLUMNS.forEach((col) => {
      const cellValue = student[col.key] || '';
      this.drawCell(currentX, startY, col.width, rowHeight, cellValue, 'left', 'middle');
      currentX += col.width;
    });

    return startY + rowHeight;
  }

  drawCell(x, y, width, height, text, alignment = 'left', verticalAlignment = 'top') {
    // Draw cell borders
    this.doc
      .moveTo(x, y)
      .lineTo(x + width, y)
      .lineTo(x + width, y + height)
      .lineTo(x, y + height)
      .lineTo(x, y)
      .stroke();

    // Draw text without word wrapping (direct output for parser compatibility)
    const textX = x + 5;
    const textY = y + 5;
    const textWidth = width - 10;
    const fontSize = 8;

    this.doc
      .fontSize(fontSize)
      .text(String(text), textX, textY, {
        width: textWidth,
        height: height - 10,
        align: alignment,
        valign: verticalAlignment,
        ellipsis: false,
        continued: false
      });
  }
}

async function main() {
  try {
    const generator = new StudentRecordsPDFGenerator();
    const outputPath = path.join(process.cwd(), 'student_records.pdf');

    const result = await generator.generate(outputPath);
    console.log(`✓ PDF generated successfully: ${result}`);
    console.log(`✓ Total students: ${studentData.length}`);
    console.log(`✓ File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
    console.log(`✓ Structure: Clean, parser-friendly table with headers`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    process.exit(1);
  }
}

main();
