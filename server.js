const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3001; // Change to 3002 if port conflict

// Configure CORS
app.use(cors({
  origin: ['http://127.0.0.1:5501', 'http://localhost:3001'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Serve static files
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('Smurf Finder Backend is running');
});

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com', // Replace with your Gmail address
    pass: 'your-app-password' // Replace with your Gmail App Password
  }
});

// Verify Nodemailer configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Nodemailer configuration error:', error);
  } else {
    console.log('Nodemailer is ready to send emails');
  }
});

// Endpoint to handle form submissions
app.post('/send-email', async (req, res) => {
  try {
    console.log('Received form data:', req.body);
    const { name, email, subject, message, newsletter } = req.body;

    // Validate input
    if (!name || !email || !message) {
      console.error('Validation failed: Missing required fields');
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    // Validate email format
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      console.error('Validation failed: Invalid email format');
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Email options
    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: 'SmurfFinderContactUs@gmail.com',
      subject: subject || 'Contact Form Submission',
      text: `
        Name: ${name}
        Email: ${email}
        Subject: ${subject}
        Message: ${message}
        Newsletter: ${newsletter ? 'Yes' : 'No'}
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error in /send-email:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toString()}] "${req.method} ${req.url}" "${req.headers['user-agent']}"`);
  next();
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});