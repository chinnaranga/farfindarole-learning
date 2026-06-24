import { GET } from '../src/app/api/courses/certificate/download/route.js';
import { NextRequest } from 'next/server.js';

async function run() {
  try {
    console.log('Mocking GET request to certificate download route...');
    
    // Create a mock NextRequest
    const url = new URL('http://localhost:3000/api/courses/certificate/download?courseId=11111111-1111-1111-1111-111111111111&userId=rchinnarangaswamyreddy7404%40gmail.com&name=Ravipati%20Chinna%20Rangaswamy%20Reddy&sendEmail=true');
    const request = new NextRequest(url.toString(), {
      method: 'GET'
    });

    const response = await GET(request);
    console.log('Response Status:', response.status);
    
    if (response.status === 200) {
      console.log('Success! PDF generated and returned.');
    } else {
      const json = await response.json();
      console.log('Error Response JSON:', json);
    }
  } catch (err) {
    console.error('API route execution failed with exception:');
    console.error(err);
  }
}

run();
