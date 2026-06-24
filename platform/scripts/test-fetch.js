async function test() {
  const url = 'http://localhost:3000/api/courses/certificate/download?courseId=11111111-1111-1111-1111-111111111111&userId=rchinnarangaswamyreddy7404@gmail.com&name=Ravipati%20Chinna%20Rangaswamy%20Reddy&sendEmail=true';
  console.log('Sending request to:', url);
  
  try {
    const res = await fetch(url);
    console.log('Response Status:', res.status);
    console.log('Response Headers:', Object.fromEntries(res.headers.entries()));
    
    const text = await res.text();
    console.log('Response Body:');
    try {
      console.log(JSON.stringify(JSON.parse(text), null, 2));
    } catch {
      console.log(text.slice(0, 1000));
    }
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

test();
