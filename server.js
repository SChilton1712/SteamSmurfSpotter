// server.js
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');

const app = express();
const port = process.env.PORT || 3001;

// Security middleware
app.use(helmet()); // Add security headers

// Set up rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

// Apply rate limiting to contact form endpoint
app.use('/send-email', limiter);

// Configure CORS - UPDATED to allow all origins during development
app.use(cors());

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Enhanced logging that doesn't expose sensitive info
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// Simple email configuration for testing
const createTransporter = () => {
  // For testing, we'll create a simple mock transporter
  // In production, replace with your actual email configuration
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Mock transporter for development
    return {
      sendMail: (mailOptions) => {
        console.log('Email would be sent with:', mailOptions);
        return Promise.resolve({ messageId: 'test-message-id' });
      }
    };
  }
};

// Email sending endpoint with improved validation and security
app.post('/send-email', async (req, res) => {
  try {
    console.log('Received form submission:', req.body);
    
    const { name, email, subject, message, newsletter } = req.body;

    // Input validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Email validation using validator library
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Sanitize inputs to prevent XSS
    const sanitizedName = validator.escape(name);
    const sanitizedSubject = subject ? validator.escape(subject) : 'N/A';
    const sanitizedMessage = validator.escape(message);

    // Create transporter for this request
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Smurf Finder Contact" <noreply@example.com>`,
      to: process.env.RECIPIENT_EMAIL || 'recipient@example.com', // Change in production
      replyTo: email,
      subject: `Contact Form: ${sanitizedSubject}`,
      text: `
        Name: ${sanitizedName}
        Email: ${email}
        Subject: ${sanitizedSubject}
        Message: ${sanitizedMessage}
        Newsletter: ${newsletter ? 'Yes' : 'No'}
      `,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${sanitizedName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${sanitizedSubject}</p>
        <p><strong>Message:</strong></p>
        <p>${sanitizedMessage.replace(/\n/g, '<br>')}</p>
        <p><strong>Newsletter:</strong> ${newsletter ? 'Yes' : 'No'}</p>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);
    
    // Log success without exposing sensitive info
    console.log(`Email sent successfully from ${email}`);
    
    res.status(200).json({ message: 'Email sent successfully' });
    
  } catch (error) {
    console.error('Error sending email:', error.message);
    
    // Don't expose detailed error info to client
    res.status(500).json({ error: 'Failed to send email. Please try again later.' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});