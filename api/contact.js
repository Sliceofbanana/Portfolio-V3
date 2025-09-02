export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const formData = req.body;
  
  // Send email using a service like Resend, SendGrid, or Nodemailer
  try {
    // Example with fetch to a secure email service
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'noreply@yourdomain.com',
        to: process.env.MY_EMAIL,
        subject: 'New Contact Form Submission',
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${formData['Full Name / Company']}</p>
          <p><strong>Email:</strong> ${formData.Email}</p>
          <p><strong>Phone:</strong> ${formData.Phone}</p>
          <p><strong>Business:</strong> ${formData['Business Description']}</p>
          <p><strong>Goals:</strong> ${formData['Goals[]']}</p>
          <p><strong>Pages:</strong> ${formData.Pages}</p>
          <p><strong>Features:</strong> ${formData.Features}</p>
          <p><strong>Design Preferences:</strong> ${formData['Design Preferences']}</p>
          <p><strong>Budget:</strong> ${formData.Budget}</p>
          <p><strong>Timeline:</strong> ${formData.Timeline}</p>
          <p><strong>Notes:</strong> ${formData.Notes}</p>
        `
      })
    });

    if (response.ok) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}