export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const formData = req.body;
    
    // Debug logs (check these in Vercel Functions logs)
    console.log('Environment variables:', {
      hasApiKey: !!process.env.RESEND_API_KEY,
      apiKeyLength: process.env.RESEND_API_KEY?.length || 0,
      hasEmail: !!process.env.MY_EMAIL,
      email: process.env.MY_EMAIL
    });

    // Check if environment variables exist
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: 'RESEND_API_KEY not found' });
    }
    
    if (!process.env.MY_EMAIL) {
      return res.status(500).json({ error: 'MY_EMAIL not found' });
    }

    console.log('Sending email with data:', formData);

    const emailPayload = {
      from: 'onboarding@resend.dev',
      to: process.env.MY_EMAIL,
      subject: 'New Contact Form Submission',
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${formData['Full Name / Company']}</p>
        <p><strong>Email:</strong> ${formData.Email}</p>
        <p><strong>Phone:</strong> ${formData.Phone}</p>
        <p><strong>Business:</strong> ${formData['Business Description']}</p>
        <p><strong>Goals:</strong> ${formData['Goals[]']}</p>
        <p><strong>Budget:</strong> ${formData.Budget}</p>
        <p><strong>Timeline:</strong> ${formData.Timeline}</p>
        <p><strong>Pages:</strong> ${formData.Pages}</p>
        <p><strong>Features:</strong> ${formData.Features}</p>
        <p><strong>Design Preferences:</strong> ${formData['Design Preferences']}</p>
        <p><strong>Notes:</strong> ${formData.Notes}</p>
      `
    };

    console.log('Email payload:', emailPayload);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    const responseData = await response.json();
    console.log('Resend API response:', {
      status: response.status,
      statusText: response.statusText,
      data: responseData
    });

    if (response.ok) {
      res.status(200).json({ success: true, message: 'Email sent successfully' });
    } else {
      console.error('Resend API error:', responseData);
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