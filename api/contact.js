export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Parse the request body properly
    let formData;
    
    if (req.body) {
      // If body is already parsed (from form submission)
      formData = req.body;
    } else {
      // If body needs to be parsed from raw data
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const rawBody = Buffer.concat(chunks).toString();
      formData = JSON.parse(rawBody);
    }

    console.log('Parsed form data:', formData);

    // Check if environment variables exist
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: 'RESEND_API_KEY not found' });
    }
    
    if (!process.env.MY_EMAIL) {
      return res.status(500).json({ error: 'MY_EMAIL not found' });
    }

    // Validate that we have form data
    if (!formData || typeof formData !== 'object') {
      return res.status(400).json({ error: 'Invalid form data received' });
    }

    const emailPayload = {
      from: process.env.MY_EMAIL,
      to: process.env.MY_EMAIL,
      reply_to: formData.Email || 'no-reply@example.com',
      subject: 'New Contact Form Submission',
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${formData['Full Name / Company'] || 'Not provided'}</p>
        <p><strong>Email:</strong> ${formData.Email || 'Not provided'}</p>
        <p><strong>Phone:</strong> ${formData.Phone || 'Not provided'}</p>
        <p><strong>Business:</strong> ${formData['Business Description'] || 'Not provided'}</p>
        <p><strong>Goals:</strong> ${formData['Goals[]'] || 'Not provided'}</p>
        <p><strong>Budget:</strong> ${formData.Budget || 'Not provided'}</p>
        <p><strong>Timeline:</strong> ${formData.Timeline || 'Not provided'}</p>
        <p><strong>Pages:</strong> ${formData.Pages || 'Not provided'}</p>
        <p><strong>Features:</strong> ${formData.Features || 'Not provided'}</p>
        <p><strong>Design Preferences:</strong> ${formData['Design Preferences'] || 'Not provided'}</p>
        <p><strong>Notes:</strong> ${formData.Notes || 'Not provided'}</p>
        <hr>
        <p><em>Reply to: ${formData.Email || 'Not provided'}</em></p>
      `
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    const responseData = await response.json();

    if (response.ok) {
      res.status(200).json({ success: true, message: 'Email sent successfully' });
    } else {
      res.status(500).json({ 
        error: 'Failed to send email',
        details: responseData,
        status: response.status
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
}