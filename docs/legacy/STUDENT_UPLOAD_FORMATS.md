# Student Bulk Upload - Supported Formats Guide

## ✅ Supported File Types

The system accepts **SVG** and **PDF** files only.

---

## 📋 File Format Requirements

### Option 1: SVG Format (Recommended) ✅

**Structure**: Horizontal table with columns for student data

**Required Headers** (at least these):
- Name
- Roll No (or Roll Number, Registration No)
- Class
- Section
- Email (or Email Address)
- Password (or Login Password)
- Optional: Father Name, Mobile

**How to Create:**

1. **In Excel/LibreOffice Calc:**
   - Create a table with columns: Name | Roll No | Class | Section | Father Name | Mobile | Email | Password
   - Add student data rows
   - Export as **SVG** (or print to SVG)

2. **Using Microsoft Word:**
   - Create a table with the same columns
   - Save As → Other Formats → Select SVG format

3. **Using Google Sheets:**
   - Create the table in Google Sheets
   - File → Download → Download as SVG

**SVG File Structure (What's Inside):**
```xml
<svg>
  <!-- Header row at y="45" -->
  <text x="30" y="45" font-weight="bold">Name</text>
  <text x="160" y="45" font-weight="bold">Roll No</text>
  <text x="240" y="45" font-weight="bold">Class</text>
  <text x="300" y="45" font-weight="bold">Section</text>
  <text x="370" y="45" font-weight="bold">Father Name</text>
  <text x="500" y="45" font-weight="bold">Mobile</text>
  <text x="640" y="45" font-weight="bold">Email</text>
  <text x="900" y="45" font-weight="bold">Password</text>

  <!-- Data rows - each field on same y-coordinate -->
  <!-- Student 1 at y="85" -->
  <text x="30" y="85">Ahmed Khan</text>
  <text x="160" y="85">001</text>
  <text x="240" y="85">5</text>
  <text x="300" y="85">A</text>
  <text x="370" y="85">Khan Ahmed</text>
  <text x="500" y="85">0310-1234567</text>
  <text x="640" y="85">ahmed.khan@school.com</text>
  <text x="900" y="85">SecurePass001!</text>

  <!-- Student 2 at y="125" -->
  <text x="30" y="125">Sara Ali</text>
  <text x="160" y="125">002</text>
  ...
</svg>
```

---

### Option 2: PDF Format ✅

**Structure**: Table or spreadsheet format with headers and data

**Required Headers**:
- Name
- Roll No
- Class
- Section
- Email
- Password

**How to Create:**

1. **From Excel:**
   - Create table with required columns
   - File → Export as PDF

2. **From Word:**
   - Create table with required columns
   - File → Export as PDF

3. **From Google Sheets:**
   - Create table with required columns
   - File → Download → PDF Document

**PDF Data Format (Text-based, readable by the parser):**
```
Name | Roll No | Class | Section | Father Name | Mobile | Email | Password
Ahmed Khan | 001 | 5 | A | Khan Ahmed | 0310-1234567 | ahmed.khan@school.com | SecurePass001!
Sara Ali | 002 | 5 | A | Ali Raza | 0311-2345678 | sara.ali@school.com | SecurePass002!
```

---

## 📊 Complete Example - Step by Step

### Step 1: Prepare Your Data
Create a spreadsheet with this structure:

| Name | Roll No | Class | Section | Father Name | Mobile | Email | Password |
|------|---------|-------|---------|-------------|--------|-------|----------|
| Ahmed Khan | 001 | 5 | A | Khan Ahmed | 0310-1111111 | ahmed.khan@school.com | UserPass001! |
| Sara Ahmed | 002 | 5 | A | Ahmed Raza | 0311-2222222 | sara.ahmed@school.com | UserPass002! |
| Zainab Tariq | 003 | 5 | A | Tariq Hassan | 0312-3333333 | zainab.tariq@school.com | UserPass003! |

### Step 2: Export as SVG or PDF
- **SVG**: File → Export → Select "SVG" format
- **PDF**: File → Export/Print → Save as PDF

### Step 3: Upload to System
- Go to Admin Dashboard
- Click "Import Students"
- Select your SVG or PDF file
- Click Upload

---

## ❌ Common Errors & Solutions

### Error: "No readable text found in the file"
**Causes:**
- File is image-based PDF (scanned document)
- File is corrupted
- File is empty

**Solution:**
- Use a text-based PDF (from Excel/Word export)
- Ensure file is not scanned/image
- Re-export the file

### Error: "Could not detect any student records"
**Causes:**
- Headers not recognized
- Email column missing or invalid
- Password column missing

**Solution:**
- Ensure exact header names: Name, Roll No, Class, Section, Email, Password
- Check all emails are valid format (xxx@xxx.com)
- Check password field is not empty

### Error: "Missing required headers"
**Causes:**
- One or more required columns missing
- Header names misspelled

**Solution:**
- Use exact header names:
  - ✅ "Name" or "Student Name"
  - ✅ "Roll No" or "Roll Number" or "Registration No"
  - ✅ "Class" or "Grade"
  - ✅ "Section" or "Division"
  - ✅ "Email" or "Email Address"
  - ✅ "Password" or "Login Password"

---

## ✔️ Validation Checklist

Before uploading, verify:

- [ ] File is either **SVG or PDF** format
- [ ] File contains a **header row** with column names
- [ ] All required columns are present: Name, Roll No, Class, Section, Email, Password
- [ ] **Email addresses** are valid (contain @ and .)
- [ ] **Password** field is not empty
- [ ] File is not corrupted
- [ ] File is not an image/scanned document

---

## 🎯 Quick Start - Best Practice

**Recommended Steps:**

1. **Use Excel/Sheets**
   ```
   Name | Roll No | Class | Section | Father Name | Mobile | Email | Password
   ```

2. **Fill in your data**
   - Name: Full student name
   - Roll No: Student ID (001, 002, etc.)
   - Class: Grade/Level
   - Section: Division (A, B, C, etc.)
   - Father Name: Parent name
   - Mobile: Phone number
   - Email: Valid email address (required for account creation)
   - Password: At least 8 characters

3. **Export to SVG**
   - File → Export As → Select SVG format
   - Or File → Print → Save as PDF

4. **Upload**
   - Go to Admin Dashboard
   - Click "Import Students"
   - Select file
   - Wait for confirmation

---

## 📞 Need Help?

If upload still fails:
1. Check error message - it tells you what's wrong
2. Verify all headers are spelled correctly
3. Ensure all emails are valid
4. Try converting to different format (SVG ↔ PDF)
5. Check file is not corrupted by opening it first

**Valid Email Format**: `firstname.lastname@domain.com`

**Valid Password Examples**: 
- `SecurePass001!`
- `Student@123`
- `Password2024`

---

## 🔒 Security Note

Passwords are:
- Stored securely in database
- Never shown in plain text
- Hashed using industry-standard encryption
- Only visible when creating accounts

Students can reset passwords after first login.
