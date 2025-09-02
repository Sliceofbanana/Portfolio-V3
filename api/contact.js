export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Simple, reliable body parsing
    const formData = req.body;
    
    // Validate we have data
    if (!formData) {
      return res.status(400).json({ error: 'No form data received' });
    }

    // Check environment variables
    if (!process.env.RESEND_API_KEY || !process.env.MY_EMAIL) {
      return res.status(500).json({ error: 'Missing environment variables' });
    }

    // Prepare email with exact Resend API format
    const emailData = {
      from: 'noreply@genesisjr.tech',
      to: process.env.MY_EMAIL,
      subject: 'New Contact Form Submission',
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${formData['Full Name / Company'] || 'Not provided'}</p>
        <p><strong>Email:</strong> ${formData.Email || 'Not provided'}</p>
        <p><strong>Phone:</strong> ${formData.Phone || 'Not provided'}</p>
        <p><strong>Business:</strong> ${formData['Business Description'] || 'Not provided'}</p>
        <p><strong>Goals:</strong> ${formData['Goals'] || 'Not provided'}</p>
        <p><strong>Budget:</strong> ${formData.Budget || 'Not provided'}</p>
        <p><strong>Timeline:</strong> ${formData.Timeline || 'Not provided'}</p>
        <p><strong>Pages:</strong> ${formData.Pages || 'Not provided'}</p>
        <p><strong>Features:</strong> ${formData.Features || 'Not provided'}</p>
        <p><strong>Design Preferences:</strong> ${formData['Design Preferences'] || 'Not provided'}</p>
        <p><strong>Notes:</strong> ${formData.Notes || 'Not provided'}</p>
        <hr>
        <p><em>Client Email: ${formData.Email || 'Not provided'}</em></p>
      `
    };

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      return res.status(200).json({ success: true });
    } else {
      const errorData = await response.json();
      return res.status(500).json({ 
        error: 'Email failed', 
        details: errorData 
      });
    }

  } catch (error) {
    return res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
}