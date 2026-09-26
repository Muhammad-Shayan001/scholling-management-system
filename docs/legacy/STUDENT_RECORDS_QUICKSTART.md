# Student Records System - Quick Start Guide

Complete step-by-step instructions to get the automated student onboarding system running.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase project (for backend integration)
- Next.js application running

## Installation (5 minutes)

### Step 1: Install Dependencies

```bash
cd d:\Projects\School\school-management-web

npm install pdfkit pdf-parse
```

Or update all dependencies:

```bash
npm install
```

### Step 2: Verify Installation

```bash
npm list pdfkit pdf-parse
```

Expected output:
```
├── pdf-parse@2.4.5
└── pdfkit@0.13.0
```

## Generate Student Records (10 minutes)

### Option A: Generate SVG Format

Generate a lightweight SVG file with 10 student records:

```bash
node generate-student-records-svg.mjs
```

**Output:**
- File: `student_records.svg` (~50-80 KB)
- Contains 10 students with complete data
- Professional table layout
- Browser viewable

**Verify the file:**
```bash
# Check file was created
ls -lh student_records.svg

# View in browser
start student_records.svg
```

### Option B: Generate PDF Format

Generate a professional PDF file with 10 student records:

```bash
node generate-student-records-pdf.mjs
```

**Output:**
- File: `student_records.pdf` (~30-50 KB)
- Contains 10 students with complete data
- Print-ready quality
- Standard PDF format

**Verify the file:**
```bash
# Check file was created
ls -lh student_records.pdf

# View in PDF viewer
start student_records.pdf
```

## Parse Documents & Test Locally (10 minutes)

### Parse SVG File

```bash
node generate-student-records-parser.mjs student_records.svg
```

**Expected Output:**
```
📄 Processing file: student_records.svg
🎨 Parsing SVG...
📊 Extracting student records...
✓ Found 10 valid student records

👥 Creating student accounts...

  ✓ Ahmed Khan (ahmed.khan@school.com)
  ✓ Sara Ali (sara.ali@school.com)
  ✓ Zainab Tariq (zainab.tariq@school.com)
  ✓ Bilal Hussain (bilal.hussain@school.com)
  ✓ Fatima Noor (fatima.noor@school.com)
  ✓ Omar Farooq (omar.farooq@school.com)
  ✓ Ayesha Raza (ayesha.raza@school.com)
  ✓ Hassan Baloch (hassan.baloch@school.com)
  ✓ Mariam Shah (mariam.shah@school.com)
  ✓ Usman Sheikh (usman.sheikh@school.com)

📋 Summary:
  Total: 10
  ✓ Successful: 10
  ✗ Failed: 0
```

### Parse PDF File

```bash
node generate-student-records-parser.mjs student_records.pdf
```

Same successful output as above.

## Backend Integration (15 minutes)

### Step 1: Set Up API Endpoint

The API endpoint file has been created at:
```
src/app/api/admin/student-bulk-upload/route.ts
```

This endpoint:
- ✓ Validates admin authentication
- ✓ Accepts PDF or SVG file upload
- ✓ Parses student data
- ✓ Creates Supabase auth users
- ✓ Creates student records in database
- ✓ Returns detailed success/failure report

### Step 2: Create Frontend Upload Component

Create `src/app/_components/admin/student-bulk-upload.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/app/_components/ui/button';
import { toast } from 'sonner';

interface UploadResult {
  success: boolean;
  totalStudents: number;
  successful: number;
  failed: number;
  details: Array<{
    email: string;
    name: string;
    success: boolean;
    error?: string;
  }>;
}

export function StudentBulkUpload() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const ext = selectedFile.name.toLowerCase();
      if (ext.endsWith('.pdf') || ext.endsWith('.svg')) {
        setFile(selectedFile);
        toast.success(`File selected: ${selectedFile.name}`);
      } else {
        toast.error('Please select a PDF or SVG file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/student-bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const data: UploadResult = await response.json();

      if (response.ok) {
        toast.success(
          `✓ ${data.successful} students created successfully!`
        );
        
        if (data.failed > 0) {
          toast.error(`✗ ${data.failed} students failed to create`);
        }

        // Show details
        console.log('Upload Results:', data.details);
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Error uploading file');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Bulk Student Upload</h2>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
        <input
          type="file"
          accept=".pdf,.svg"
          onChange={handleFileChange}
          disabled={loading}
          className="block w-full"
        />
        <p className="text-sm text-gray-500 mt-2">
          Supported formats: PDF, SVG
        </p>
      </div>

      {file && (
        <p className="text-sm text-gray-600">
          Selected: <strong>{file.name}</strong>
        </p>
      )}

      <Button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full"
      >
        {loading ? 'Uploading...' : 'Upload & Create Accounts'}
      </Button>
    </div>
  );
}
```

### Step 3: Add to Admin Dashboard

Update `src/app/(dashboard)/admin/dashboard/page.tsx`:

```typescript
import { StudentBulkUpload } from '@/app/_components/admin/student-bulk-upload';

export default function AdminDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Other components */}
      <StudentBulkUpload />
    </div>
  );
}
```

## Complete Workflow

### Full End-to-End Process

```bash
# 1. Generate documents (choose one)
node generate-student-records-svg.mjs      # OR
node generate-student-records-pdf.mjs

# 2. Test locally (optional)
node generate-student-records-parser.mjs student_records.pdf

# 3. Upload via web interface
# - Go to Admin Dashboard
# - Click "Bulk Upload Students"
# - Select student_records.pdf or .svg
# - Click "Upload & Create Accounts"

# 4. Monitor results
# - See success/failure summary
# - Check dashboard for new students
# - Verify email credentials sent
```

## Student Data Format

Each generated document contains:

```
Name             | Roll No | Class | Section | Father Name   | Mobile        | Email                      | Password
Ahmed Khan       | 001     | 5     | A       | Khan Sr.      | 0300-1111111  | ahmed.khan@school.com      | UserPass001!
Sara Ali         | 002     | 5     | A       | Ali Sr.       | 0301-2222222  | sara.ali@school.com        | UserPass002!
Zainab Tariq     | 003     | 5     | A       | Tariq J.      | 0302-3333333  | zainab.tariq@school.com    | UserPass003!
... (7 more)
```

## Testing Checklist

- [ ] Dependencies installed: `npm list pdfkit pdf-parse`
- [ ] SVG generated: `student_records.svg` exists
- [ ] PDF generated: `student_records.pdf` exists
- [ ] SVG parses correctly: `node generate-student-records-parser.mjs student_records.svg`
- [ ] PDF parses correctly: `node generate-student-records-parser.mjs student_records.pdf`
- [ ] API endpoint responds: `POST /api/admin/student-bulk-upload`
- [ ] Students created in database
- [ ] Accounts created in Supabase Auth
- [ ] Email credentials sent to students (if configured)

## Troubleshooting

### Issue: "Error: Cannot find module 'pdfkit'"

**Solution:**
```bash
npm install pdfkit
```

### Issue: "PDF parsing fails"

**Solution:**
```bash
npm install --save pdf-parse
node generate-student-records-pdf.mjs
```

### Issue: "Parse Error: Could not detect any student records"

**Solution:**
1. Regenerate file:
   ```bash
   node generate-student-records-svg.mjs
   # OR
   node generate-student-records-pdf.mjs
   ```
2. Check file is not corrupted
3. Verify header row exists

### Issue: "Unauthorized" when uploading

**Solution:**
- Verify you're logged in as admin
- Check admin profile has school_id
- Verify Supabase session is active

### Issue: "Failed to create account"

**Solution:**
- Check Supabase credentials in `.env.local`
- Verify database schema for `students` table
- Check email is not already registered

## Configuration

### Environment Variables

Ensure `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Schema

Ensure `students` table has columns:
- `id` (uuid)
- `user_id` (uuid, foreign key to auth.users)
- `school_id` (uuid, foreign key to schools)
- `name` (text)
- `email` (text)
- `roll_number` (text)
- `class` (text)
- `section` (text)
- `father_name` (text)
- `mobile` (text)
- `admission_date` (timestamp)
- `status` (text)

## Performance Tips

1. **Generate during off-peak hours** for large batches
2. **Use PDF format** for better parsing reliability
3. **Monitor system logs** for account creation failures
4. **Set rate limits** on API endpoint to prevent abuse
5. **Implement retry logic** for failed account creations

## Security Checklist

- [ ] Verify admin authentication on API
- [ ] Validate file type and size
- [ ] Sanitize file content before parsing
- [ ] Hash passwords with bcrypt before storage
- [ ] Send credentials via secure email
- [ ] Log all account creations
- [ ] Implement audit trail
- [ ] Set up rate limiting
- [ ] Clean up temporary files

## Next Steps

1. ✓ Install dependencies
2. ✓ Generate test documents
3. ✓ Test local parsing
4. ✓ Set up API endpoint
5. ✓ Create frontend component
6. ✓ Test end-to-end workflow
7. ✓ Deploy to production
8. ✓ Configure monitoring and alerts

## Support

For issues or questions:
1. Check [STUDENT_RECORDS_SETUP.md](STUDENT_RECORDS_SETUP.md) for detailed documentation
2. Review error messages in console
3. Check API endpoint logs
4. Verify database schema and permissions
5. Test with sample files first

---

**Ready to go!** Your automated student onboarding system is now ready to use.
