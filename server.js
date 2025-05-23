require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
const path = require('path');
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const nodemailer = require('nodemailer');
const app = express();

// Use environment variable for Stripe secret key
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));
app.use(express.static(path.join(__dirname, 'public')));

// Multer storage config for mix&master requests
const requestsBasePath = path.join(os.homedir(), 'Desktop', 'mix&master requests');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const userEmail = req.body.email;
        if (!userEmail) return cb(new Error('Missing email'));
        const userDir = path.join(requestsBasePath, userEmail);
        fs.mkdirSync(userDir, { recursive: true });
        cb(null, userDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Create a transporter using ProtonMail SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.protonmail.ch',
    port: 587,
    secure: false,
    auth: {
        user: 'koreluca@proton.me',
        pass: process.env.EMAIL_PASSWORD // We'll set this as an environment variable
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'checkout.html'));
});

// Stripe payment endpoint
app.post('/create-payment-intent', async (req, res) => {
    const { amount, email, items } = req.body;
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount, // in cents
            currency: 'usd',
            receipt_email: email,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                orderItems: JSON.stringify(items)
            }
        });

        // Send confirmation email with Mailgun
        /*
        const mailgun = new Mailgun(formData);
        const mg = mailgun.client({
            username: 'api',
            key: process.env.MAILGUN_API_KEY,
        });

        // Format the order items for the email
        const orderItemsHtml = items && Array.isArray(items) 
            ? items.map(item => `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.license}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">$${item.price.toFixed(2)}</td>
                </tr>
            `).join('')
            : '';

        // Create a professional HTML email template
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #ff0000; margin: 0;">BEATLIST</h1>
                    <p style="color: #666; margin: 10px 0;">Your Purchase Confirmation</p>
                </div>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
                    <h2 style="color: #333; margin-top: 0;">Thank you for your purchase!</h2>
                    <p style="color: #666;">We're excited to have you as a customer. Here are your order details:</p>
                    <p style="color: #666; font-size: 14px;">Order ID: ${paymentIntent.id}</p>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #f5f5f5;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Beat</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">License</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orderItemsHtml}
                    </tbody>
                </table>

                <div style="text-align: right; margin-bottom: 20px;">
                    <p style="font-size: 18px; font-weight: bold;">
                        Total: <span style="color: #ff0000;">$${(amount/100).toFixed(2)}</span>
                    </p>
                </div>

                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
                    <h3 style="color: #333; margin-top: 0;">Next Steps</h3>
                    <p style="color: #666;">You will receive your purchased beats in a separate email shortly. Please keep this order ID for reference: <strong>${paymentIntent.id}</strong></p>
                    <p style="color: #666;">If you have any questions, please contact us at ${process.env.SUPPORT_EMAIL || 'support@beatlist.com'} with your order ID.</p>
                </div>

                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #999; font-size: 12px;">© 2025 Beatlist. All rights reserved.</p>
                </div>
            </div>
        `;

        try {
            await mg.messages.create(process.env.MAILGUN_DOMAIN, {
                from: process.env.MAILGUN_FROM_EMAIL,
                to: [email],
                subject: `Your Beatlist Purchase Confirmation - Order #${paymentIntent.id}`,
                text: `Thank you for your purchase! Your order total: $${(amount/100).toFixed(2)}. Order ID: ${paymentIntent.id}`,
                html: emailHtml,
                'h:Reply-To': process.env.SUPPORT_EMAIL || 'support@beatlist.com'
            });
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // Don't fail the payment if email fails
        }
        */

        res.send({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        console.error('Stripe or email error:', err);
        res.status(500).send({ error: err.message });
    }
});

// Endpoint to handle audio service file uploads
app.post('/upload-audio-service', upload.array('files'), (req, res) => {
    // files are saved, respond with success
    res.json({ success: true, files: req.files.map(f => f.filename) });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;

    try {
        // Send email
        await transporter.sendMail({
            from: 'koreluca@proton.me',
            to: 'koreluca@proton.me',
            subject: `Contact Form: ${subject}`,
            text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
            `,
            html: `
<h2>New Contact Form Submission</h2>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Subject:</strong> ${subject}</p>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, '<br>')}</p>
            `
        });

        res.json({ success: true, message: 'Email sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ success: false, message: 'Failed to send email. Please try again later.' });
    }
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Use Railway's PORT or fallback to 3000
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`)); 