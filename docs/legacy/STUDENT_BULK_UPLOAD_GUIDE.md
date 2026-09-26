# Student Bulk Upload Integration Guide

## Quick Start

### 1. Access the Upload Feature
Navigate to: **Admin Dashboard → Import Students** or `/admin/import-students`

### 2. Prepare Your File

**Requirements**:
- Format: SVG or PDF
- Contains headers: **Name**, **Roll No**, **Class**, **Section**, **Email**, **Password**
- Data rows follow headers

**Sample File Structure**:
```
Name
Roll No
Class
Section
Father Name
Mobile
Email
Password
Ahmed Khan
001
5
A
Khan Sr.
0300-1111111
ahmed.khan@school.com
UserPass001!
...
```

### 3. Upload Process

1. **Select File**
   - Drag file onto the upload area, or
   - Click to browse and select file

2. **Confirm Import**
   - Review file selection
   - Click "Confirm Import"
   - System will process the file

3. **View Results**
   - See import summary (Total, Successful, Failed)
   - Review detailed results table
   - Each student shows: Name, Email, Status

### 4. Account Creation

Once uploaded, the system automatically:
- ✅ Creates user accounts in Supabase Auth
- ✅ Sets email and password
- ✅ Creates student database records
- ✅ Associates with your school
- ✅ Sets status to "active"

## Supported File Formats

### SVG Files ✅
- Created with: Adobe Illustrator, Inkscape, Figma, browsers
- Best for: Clean, structured student data
- Recommended: Yes - best compatibility

### PDF Files ✅
- Created with: PDFKit, Adobe, other PDF generators
- Best for: Professional documents, forms
- Recommended: Yes - if PDF available

## Error Messages & Solutions

### Error: "No readable text found in the file"
**Cause**: File cannot be read as text
**Solution**:
- Ensure file is SVG or PDF (not image-based)
- Try re-exporting the document
- Check file is not corrupted

### Error: "No headers detected"
**Cause**: Headers not recognized
**Solution**:
- Verify file contains required headers:
  - Name / Student Name
  - Roll No / Roll Number
  - Class / Grade
  - Section
  - Email
  - Password

### Error: "Missing required headers"
**Cause**: One or more required headers not found
**Solution**:
- Add missing headers to source file
- Re-export and try again

### Error: "Found X text nodes but could not parse..."
**Cause**: Headers found but no valid data rows
**Solution**:
- Ensure student data rows are present after headers
- Check email format is valid
- Verify data structure matches headers

## Data Requirements

### Required Fields
| Field | Format | Example | Notes |
|-------|--------|---------|-------|
| Name | Text | Ahmed Khan | Student full name |
| Roll No | Text/Number | 001 | Must be unique |
| Class | Text/Number | 5 | Grade or class level |
| Section | Text | A | Division/section identifier |
| Email | Email | ahmed@school.com | Must be valid email |
| Password | Text | UserPass001! | Should be strong |

### Optional Fields
| Field | Format | Notes |
|-------|--------|-------|
| Father Name | Text | Parent/guardian name |
| Mobile | Phone | Contact number |
| Address | Text | Student address |

## Import Results

### Successful Import
```
Total Found: 50
Successful: 50
Failed: 0
```
✅ All students imported successfully

### Partial Success
```
Total Found: 50
Successful: 48
Failed: 2
```
⚠️ Review failed records in results table

### Complete Failure
```
Total Found: 0
Successful: 0
Failed: 0
```
❌ Check file format and headers

## Troubleshooting

### File Won't Upload
- Check file size (should be < 50MB)
- Ensure browser has permission to upload
- Try different browser
- Clear browser cache

### Some Students Failed
- Check failed records in results table
- Common issues:
  - Invalid email format
  - Duplicate email address
  - Missing required fields
  - Special characters in name

### Accounts Not Created
- Check admin permissions
- Verify Supabase connection
- Review error details
- Contact system administrator

## Best Practices

### 1. **Prepare Data Carefully**
- Use consistent naming
- Verify email addresses
- Use strong passwords
- No duplicate emails

### 2. **Test First**
- Try with small batch (5-10 students)
- Verify results before large import
- Check account creation in database

### 3. **Keep Records**
- Save upload confirmation
- Note timestamp of import
- Store success report
- Keep original file as backup

### 4. **Security**
- Use strong passwords
- Don't share imported file
- Review access logs
- Limit who can upload

## Performance

- **Small files** (1-10 students): < 1 second
- **Medium files** (11-100 students): 1-5 seconds
- **Large files** (100+ students): 5-30 seconds

## FAQ

**Q: Can I import duplicate emails?**
A: No. System will reject duplicate emails. Each email must be unique.

**Q: Can I import without passwords?**
A: No. Password field is required. Provide secure passwords.

**Q: Can I edit data after import?**
A: Yes. Edit individual student records in student management page.

**Q: What if import fails?**
A: Review error details, fix issues, and try again. No partial imports succeed.

**Q: Can I delete imported students?**
A: Yes. Go to student list and delete individual records.

**Q: Is there an import limit?**
A: No hard limit, but 500+ students may take several minutes.

**Q: Can I schedule bulk imports?**
A: Not yet. Manual upload required. Scheduled imports coming soon.

**Q: Are passwords sent to students?**
A: Not automatically. Passwords shown in import result - share securely with students.

## Support

**Issues?**
1. Check error message
2. Review this guide
3. Check diagnostic information
4. Contact admin@school.com
5. Check server logs for details

**Feature Requests?**
- Email feature request to: admin@school.com
- Include use case and requirements
- Priority given to high-impact features
