async function test() {
  console.log('Sending request to running Next.js server...');
  const form = new FormData();
  form.append('name', 'API Test School');
  form.append('campus_code', 'API-001');
  form.append('admin_email', 'testadmin_' + Date.now() + '@school.com');
  form.append('admin_password', 'password123');
  
  try {
    const res = await fetch('http://localhost:3000/api/test-create', {
      method: 'POST',
      body: form
    });
    const text = await res.text();
    console.log('Response status:', res.status);
    console.log('Response body:', text);
  } catch (err) {
    console.error('Fetch failed (is server running?):', err.message);
  }
}

test();
